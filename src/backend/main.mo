import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Migration "migration";
import HttpOutcall "http-outcalls/outcall";

(with migration = Migration.run)
actor {
  type TenantId = Text;
  type ApiKey = Text;
  type ApiKeyHash = Text;
  type Day = Nat;

  type Role = {
    #Admin;
    #Member;
    #Viewer;
  };

  type Tenant = {
    id : TenantId;
    name : Text;
    owner : Principal;
    createdAt : Time.Time;
    apiKeyHash : ApiKeyHash;
  };

  type Membership = {
    tenantId : TenantId;
    user : Principal;
    role : Role;
  };

  type WebhookConfig = {
    url : ?Text;
    enabled : Bool;
    enabledEvents : [Text];
    signingSecret : Text;
  };

  type AuthEvent = {
    eventType : Text;
    timestamp : Time.Time;
    tenantId : TenantId;
    userId : Text;
    success : Bool;
  };

  type DailyAggregate = {
    date : Day;
    apiCalls : Nat;
    uniqueUsers : Nat;
    successRate : Nat;
    webhookSuccess : Nat;
    webhookFailure : Nat;
  };

  public type RateLimitStatus = {
    used : Nat;
    limit : Nat;
    resetTimestamp : Time.Time;
  };

  public type RateLimitBucket = {
    count : Nat;
    windowStart : Time.Time;
  };

  let tenants = Map.empty<TenantId, Tenant>();
  let memberships = Map.empty<TenantId, List.List<Membership>>();
  let webhooks = Map.empty<TenantId, WebhookConfig>();
  let authEvents = Map.empty<TenantId, List.List<AuthEvent>>();
  let dailyAggregates = Map.empty<TenantId, Map.Map<Day, DailyAggregate>>();
  let retentionPeriod = 30 * 24 * 60 * 60 * 1_000_000_000 : Nat; // 30 days in nanoseconds
  let rateLimitBuckets = Map.empty<ApiKeyHash, RateLimitBucket>();

  public shared query ({ caller }) func transform(input : HttpOutcall.TransformationInput) : async HttpOutcall.TransformationOutput {
    HttpOutcall.transform(input);
  };

  func generateApiKey(tenantId : TenantId) : (ApiKey, ApiKeyHash) {
    let rawKey = "pk_" # tenantId # "_" # Time.now().toText();
    (rawKey, rawKey);
  };

  func verifyApiKey(apiKey : ApiKey, apiKeyHash : ApiKeyHash) : Bool {
    apiKey == apiKeyHash;
  };

  func createTenant(owner : Principal) : Tenant {
    let tenantId = Time.now().toText();
    let (apiKey, apiKeyHash) = generateApiKey(tenantId);

    let tenant : Tenant = {
      id = tenantId;
      name = "Tenant-" # tenantId;
      owner;
      createdAt = Time.now();
      apiKeyHash;
    };

    let membership : Membership = {
      tenantId;
      user = owner;
      role = #Admin;
    };

    tenants.add(tenantId, tenant);
    memberships.add(tenantId, List.fromArray<Membership>([membership]));
    tenant;
  };

  public shared ({ caller }) func getOrCreateTenant() : async Tenant {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    for ((tenantId, tenant) in tenants.entries()) {
      if (tenant.owner == caller) {
        return tenant;
      };
    };

    createTenant(caller);
  };

  func getUserRoleForTenant(tenantId : TenantId, user : Principal) : ?Role {
    switch (memberships.get(tenantId)) {
      case (?memberList) {
        switch (memberList.toArray().find(func(m) { m.user == user })) {
          case (?membership) { ?membership.role };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  func requireAdminRole(tenantId : TenantId, user : Principal) {
    switch (getUserRoleForTenant(tenantId, user)) {
      case (?role) {
        switch (role) {
          case (#Admin) { () };
          case (_) { Runtime.trap("Permission denied: You must be an admin") };
        };
      };
      case (null) { Runtime.trap("Permission denied: No role found for user and tenant") };
    };
  };

  func requireAdminOrMemberRole(tenantId : TenantId, user : Principal) : () {
    switch (getUserRoleForTenant(tenantId, user)) {
      case (?role) {
        switch (role) {
          case (#Admin) { () };
          case (#Member) { () };
          case (#Viewer) { Runtime.trap("Permission denied: You must be an admin or member") };
        };
      };
      case (null) { Runtime.trap("Permission denied: No role found for user and tenant") };
    };
  };

  public shared ({ caller }) func regenerateApiKey() : async ApiKey {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    let tenant = switch (tenants.values().find(func(t) { t.owner == caller })) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found") };
    };

    requireAdminRole(tenant.id, caller);

    let (newApiKey, newApiKeyHash) = generateApiKey(tenant.id);

    let updatedTenant = { tenant with apiKeyHash = newApiKeyHash };
    tenants.add(tenant.id, updatedTenant);

    newApiKey;
  };

  public shared ({ caller }) func authenticateWithAPIKey(apiKey : ApiKey) : async Tenant {
    for ((tenantId, tenant) in tenants.entries()) {
      if (verifyApiKey(apiKey, tenant.apiKeyHash)) {
        return tenant;
      };
    };
    Runtime.trap("Invalid API key");
  };

  public shared ({ caller }) func getCurrentTenant() : async Tenant {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    switch (tenants.values().find(func(t) { t.owner == caller })) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found") };
    };
  };

  public shared ({ caller }) func getTenantMembers() : async [Membership] {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    let tenant = switch (tenants.values().find(func(t) { t.owner == caller })) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found for caller") };
    };

    switch (memberships.get(tenant.id)) {
      case (?memberList) { memberList.toArray() };
      case (null) { [] };
    };
  };

  func isAdmin(principal : Principal, tenantId : TenantId) : Bool {
    switch (memberships.get(tenantId)) {
      case (?members) {
        members.toArray().find(func(m) { m.user == principal and m.role == #Admin }) != null;
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func addMemberByPrincipal(principal : Principal, role : Role) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    let tenant = switch (tenants.values().find(func(t) { t.owner == caller })) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found for caller") };
    };

    let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
    if (not allowed) { Runtime.trap("Rate limit exceeded") };

    if (not isAdmin(caller, tenant.id)) {
      Runtime.trap("Only admins can add members");
    };

    let member : Membership = {
      tenantId = tenant.id;
      user = principal;
      role;
    };

    let existingMembers = switch (memberships.get(tenant.id)) {
      case (?members) { members };
      case (null) { List.empty<Membership>() };
    };

    if (existingMembers.toArray().find(func(m) { m.user == principal }) != null) {
      Runtime.trap("Member already exists in this tenant");
    };

    existingMembers.add(member);
    memberships.add(tenant.id, existingMembers);
  };

  func findTenantByCaller(caller : Principal) : TenantId {
    switch (tenants.values().find(func(t) { t.owner == caller })) {
      case (?ten) { ten.id };
      case (null) { Runtime.trap("Tenant not found for caller") };
    };
  };

  func findMembership(tenantId : TenantId, user : Principal) : ?Membership {
    switch (memberships.get(tenantId)) {
      case (?memberList) {
        memberList.toArray().find(func(m) { m.user == user });
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func updateMemberRole(userPrincipal : Principal, newRole : Role) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    let tenantId = findTenantByCaller(caller);

    let tenant = switch (tenants.get(tenantId)) {
      case (?existingTenant) { existingTenant };
      case (null) { Runtime.trap("Tenant lookup failed") };
    };
    let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
    if (not allowed) { Runtime.trap("Rate limit exceeded") };

    if (not isAdmin(caller, tenantId)) {
      Runtime.trap("Only admins can update member roles");
    };

    let member = switch (findMembership(tenantId, userPrincipal)) {
      case (?m) { m };
      case (null) { Runtime.trap("Member not found in this tenant") };
    };

    if (member.user == caller) {
      Runtime.trap("Cannot change your own role");
    };

    let memberList = switch (memberships.get(tenantId)) {
      case (?mlist) { mlist };
      case (null) { List.empty<Membership>() };
    };

    let adminCount = memberList.toArray().filter(func(m) { m.role == #Admin }).size();

    if (member.role == #Admin and newRole != #Admin and adminCount <= 1) {
      Runtime.trap("Cannot demote the last admin");
    };

    let updatedMember : Membership = {
      member with role = newRole;
    };

    let filteredList = memberList.filter(func(m) { m.user != member.user });
    filteredList.add(updatedMember);
    memberships.add(tenantId, filteredList);
  };

  public shared ({ caller }) func removeMember(userPrincipal : Principal) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    let tenantId = findTenantByCaller(caller);

    let tenant = switch (tenants.get(tenantId)) {
      case (?existingTenant) { existingTenant };
      case (null) { Runtime.trap("Tenant lookup failed") };
    };
    let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
    if (not allowed) { Runtime.trap("Rate limit exceeded") };

    if (not isAdmin(caller, tenantId)) {
      Runtime.trap("Only admins can remove members");
    };

    let member = switch (findMembership(tenantId, userPrincipal)) {
      case (?m) { m };
      case (null) { Runtime.trap("Member not found in this tenant") };
    };

    let memberList = switch (memberships.get(tenantId)) {
      case (?mlist) { mlist };
      case (null) { List.empty<Membership>() };
    };

    let adminCount = memberList.toArray().filter(func(m) { m.role == #Admin }).size();

    if (member.role == #Admin and adminCount <= 1) {
      Runtime.trap("Cannot remove the last admin");
    };

    let filteredList = memberList.filter(func(m) { m.user != member.user });
    memberships.add(tenantId, filteredList);
  };

  public shared ({ caller }) func getUserRole() : async Role {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    let tenantId = findTenantByCaller(caller);

    switch (findMembership(tenantId, caller)) {
      case (?member) { member.role };
      case (null) { Runtime.trap("User does not belong to any tenant") };
    };
  };

  public shared ({ caller }) func configureWebhook(url : Text, enabledEvents : [Text]) : async Text {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    let tenant = switch (tenants.values().find(func(t) { t.owner == caller })) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found for caller") };
    };

    let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
    if (not allowed) { Runtime.trap("Rate limit exceeded") };

    requireAdminOrMemberRole(tenant.id, caller);

    let signingSecret = "secret_" # Time.now().toText();

    let webhookConfig : WebhookConfig = {
      url = ?url;
      enabled = true;
      enabledEvents;
      signingSecret;
    };

    webhooks.add(tenant.id, webhookConfig);
    signingSecret;
  };

  public shared ({ caller }) func getWebhookConfig() : async {
    url : ?Text;
    enabled : Bool;
    enabledEvents : [Text];
  } {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    let tenant = switch (tenants.values().find(func(t) { t.owner == caller })) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found for caller") };
    };

    switch (webhooks.get(tenant.id)) {
      case (?config) {
        {
          url = config.url;
          enabled = config.enabled;
          enabledEvents = config.enabledEvents;
        };
      };
      case (null) {
        {
          url = null;
          enabled = false;
          enabledEvents = [];
        };
      };
    };
  };

  public shared ({ caller }) func updateWebhookStatus(enabled : Bool) : async Bool {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    let tenant = switch (tenants.values().find(func(t) { t.owner == caller })) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found for caller") };
    };

    let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
    if (not allowed) { Runtime.trap("Rate limit exceeded") };

    switch (webhooks.get(tenant.id)) {
      case (?config) {
        let updatedConfig = { config with enabled };
        webhooks.add(tenant.id, updatedConfig);
        enabled;
      };
      case (null) { Runtime.trap("Webhook configuration not found") };
    };
  };

  public shared ({ caller }) func testWebhook() : async {
    status : Nat16;
    message : Text;
  } {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous calls not allowed. Must authenticate with principal.");
    };

    let tenant = switch (tenants.values().find(func(t) { t.owner == caller })) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found for caller") };
    };

    let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
    if (not allowed) { Runtime.trap("Rate limit exceeded") };

    requireAdminOrMemberRole(tenant.id, caller);

    let payload = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><event><id>test_event</id><type>user.authenticated</type><created>" #
      Time.now().toText() #
      "</created><data><tenant_id>" # tenant.id # "</tenant_id><user_id>test_user</user_id><metadata>test_metadata</metadata></data></event>";

    switch (webhooks.get(tenant.id)) {
      case (?config) {
        if (config.enabled and config.url != null) {
          let status = switch (config.url) {
            case (?url) { await HttpOutcall.httpPostRequest(url, [], payload, transform) };
            case (null) { "404" };
          };
          { status = 200; message = "Webhook sent with status " # status };
        } else {
          { status = 400; message = "Webhook is disabled or URL is missing" };
        };
      };
      case (null) { { status = 404; message = "Webhook configuration not found" } };
    };
  };

  public shared ({ caller }) func getWebhookDeliveries() : async [WebhookConfig] {
    webhooks.values().toArray();
  };

  func getCurrentDay() : Day {
    let now = Time.now();
    let dayMillis = 24 * 60 * 60 * 1_000_000_000;
    Int.abs(now / dayMillis);
  };

  public shared ({ caller }) func recordAuthEvent(tenantId : TenantId, eventType : Text, userId : Text, success : Bool) : async () {
    let event : AuthEvent = {
      eventType;
      timestamp = Time.now();
      tenantId;
      userId;
      success;
    };

    let currentEvents = switch (authEvents.get(tenantId)) {
      case (?events) { events };
      case (null) { List.empty<AuthEvent>() };
    };
    currentEvents.add(event);
    authEvents.add(tenantId, currentEvents);

    let day = getCurrentDay();
    let currentDayAggregates = switch (dailyAggregates.get(tenantId)) {
      case (?aggregates) { aggregates };
      case (null) { Map.empty<Day, DailyAggregate>() };
    };

    let prevAggregate = switch (currentDayAggregates.get(day)) {
      case (?agg) { agg };
      case (null) {
        {
          date = day;
          apiCalls = 0;
          uniqueUsers = 0;
          successRate = 0;
          webhookSuccess = 0;
          webhookFailure = 0;
        };
      };
    };

    let updatedAggregate = {
      prevAggregate with
      apiCalls = prevAggregate.apiCalls + 1;
      successRate = if (success) { prevAggregate.successRate + 1 } else {
        prevAggregate.successRate;
      };
    };

    currentDayAggregates.add(day, updatedAggregate);
    dailyAggregates.add(tenantId, currentDayAggregates);

    cleanupOldData(tenantId);
  };

  public shared ({ caller }) func recordWebhookEvent(tenantId : TenantId, success : Bool) : async () {
    let day = getCurrentDay();
    let currentDayAggregates = switch (dailyAggregates.get(tenantId)) {
      case (?aggregates) { aggregates };
      case (null) { Map.empty<Day, DailyAggregate>() };
    };

    let prevAggregate = switch (currentDayAggregates.get(day)) {
      case (?agg) { agg };
      case (null) {
        {
          date = day;
          apiCalls = 0;
          uniqueUsers = 0;
          successRate = 0;
          webhookSuccess = 0;
          webhookFailure = 0;
        };
      };
    };

    let updatedAggregate = if (success) {
      { prevAggregate with webhookSuccess = prevAggregate.webhookSuccess + 1 };
    } else { { prevAggregate with webhookFailure = prevAggregate.webhookFailure + 1 } };

    currentDayAggregates.add(day, updatedAggregate);
    dailyAggregates.add(tenantId, currentDayAggregates);

    cleanupOldData(tenantId);
  };

  func checkAndIncrementRateLimit(apiKeyHash : Text) : Bool {
    let now = Time.now();
    switch (rateLimitBuckets.get(apiKeyHash)) {
      case (null) {
        let newBucket = { count = 1; windowStart = now };
        rateLimitBuckets.add(apiKeyHash, newBucket);
        true;
      };
      case (?bucket) {
        if (now >= (bucket.windowStart + 3600_000_000_000)) {
          let resetBucket = { count = 1; windowStart = now };
          rateLimitBuckets.add(apiKeyHash, resetBucket);
          true;
        } else if (bucket.count < 1000) {
          let updatedBucket = { bucket with count = bucket.count + 1 };
          rateLimitBuckets.add(apiKeyHash, updatedBucket);
          true;
        } else { false };
      };
    };
  };

  public shared ({ caller }) func getAnalyticsSummary(tenantId : TenantId, days : Nat) : async {
    totalApiCalls : Nat;
    activeEndUsers : Nat;
    authSuccessRate : Nat;
    webhookHealth : {
      success : Nat;
      failure : Nat;
    };
  } {
    if (not tenants.containsKey(tenantId)) {
      Runtime.trap("Tenant not found");
    };

    let tenant = switch (tenants.get(tenantId)) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found") };
    };

    let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
    if (not allowed) { Runtime.trap("Rate limit exceeded") };

    let currentDay = getCurrentDay();
    var totalCalls = 0;
    var successCount = 0;
    var webhookSuccess = 0;
    var webhookFailure = 0;

    let aggregates = switch (dailyAggregates.get(tenantId)) {
      case (?aggs) { aggs };
      case (null) { Map.empty<Day, DailyAggregate>() };
    };

    let lowerBound = if (days >= currentDay) { 0 } else { currentDay - days };

    for ((day, agg) in aggregates.entries()) {
      if (day >= lowerBound and day <= currentDay) {
        totalCalls += agg.apiCalls;
        successCount += agg.successRate;
        webhookSuccess += agg.webhookSuccess;
        webhookFailure += agg.webhookFailure;
      };
    };

    let uniqueUsers = switch (authEvents.get(tenantId)) {
      case (?events) {
        events.toArray().size();
      };
      case (null) { 0 };
    };

    let result = {
      totalApiCalls = totalCalls;
      activeEndUsers = uniqueUsers;
      authSuccessRate = if (totalCalls == 0) { 0 } else if (totalCalls <= successCount) { totalCalls / successCount } else { 0 };
      webhookHealth = {
        success = webhookSuccess;
        failure = webhookFailure;
      };
    };

    result;
  };

  public shared ({ caller }) func getDailyTrend(tenantId : TenantId, days : Nat) : async [(Day, Nat)] {
    if (not tenants.containsKey(tenantId)) {
      Runtime.trap("Tenant not found");
    };

    let tenant = switch (tenants.get(tenantId)) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found") };
    };

    let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
    if (not allowed) { Runtime.trap("Rate limit exceeded") };

    let currentDay = getCurrentDay();
    var trend = List.empty<(Day, Nat)>();

    let aggregates = switch (dailyAggregates.get(tenantId)) {
      case (?aggs) { aggs };
      case (null) { Map.empty<Day, DailyAggregate>() };
    };

    let lowerBound = if (days >= currentDay) { 0 } else { currentDay - days };

    for ((day, agg) in aggregates.entries()) {
      if (day >= lowerBound and day <= currentDay) {
        trend.add((day, agg.apiCalls));
      };
    };

    trend.reverse().toArray();
  };

  public shared ({ caller }) func getEventBreakdown(tenantId : TenantId) : async {
    registered : Nat;
    authenticated : Nat;
    failed : Nat;
  } {
    if (not tenants.containsKey(tenantId)) {
      Runtime.trap("Tenant not found");
    };

    let tenant = switch (tenants.get(tenantId)) {
      case (?t) { t };
      case (null) { Runtime.trap("Tenant not found") };
    };

    let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
    if (not allowed) { Runtime.trap("Rate limit exceeded") };

    let events = switch (authEvents.get(tenantId)) {
      case (?evts) { evts };
      case (null) { List.empty<AuthEvent>() };
    };

    let now = Time.now();
    var registered = 0;
    var authenticated = 0;
    var failed = 0;

    events.toArray().forEach(
      func(event) {
        if (event.timestamp >= (now - retentionPeriod)) {
          if (event.eventType == "user_registered") { registered += 1 };
          if (event.eventType == "user_authenticated") { authenticated += 1 };
          if (event.eventType == "auth_failed") { failed += 1 };
        };
      }
    );

    {
      registered;
      authenticated;
      failed;
    };
  };

  func cleanupOldData(tenantId : TenantId) {
    let currentDay = getCurrentDay();

    let events = switch (authEvents.get(tenantId)) {
      case (?evts) { evts };
      case (null) { List.empty<AuthEvent>() };
    };
    let filteredEvents = events.filter(
      func(event) {
        event.timestamp >= (Time.now() - retentionPeriod : Int);
      }
    );
    authEvents.add(tenantId, filteredEvents);

    let aggregates = switch (dailyAggregates.get(tenantId)) {
      case (?aggs) { aggs };
      case (null) { Map.empty<Day, DailyAggregate>() };
    };

    let thirtyDaysAgo = if (currentDay >= 30) { currentDay - 30 } else { 0 };
    let filteredAggregates = aggregates.filter(
      func(day, agg) {
        day >= thirtyDaysAgo;
      }
    );
    dailyAggregates.add(tenantId, filteredAggregates);
  };

  public shared query ({ caller }) func getRateLimitStatus(apiKeyHash : ApiKeyHash) : async RateLimitStatus {
    let now = Time.now();
    let (currentCount, windowStart) = switch (rateLimitBuckets.get(apiKeyHash)) {
      case (?bucket) {
        if (now >= (bucket.windowStart + 3600_000_000_000)) {
          (0, now);
        } else { (bucket.count, bucket.windowStart) };
      };
      case (null) { (0, now) };
    };

    let plan = "free";
    let limit = switch (plan) {
      case ("pro") { 10_000 };
      case ("enterprise") { 100_000 };
      case (_) { 1_000 };
    };

    {
      used = currentCount;
      limit;
      resetTimestamp = windowStart + 3600_000_000_000;
    };
  };
};

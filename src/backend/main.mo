import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import HttpOutcall "http-outcalls/outcall";



actor {
  // Types and State
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

  public type EndUser = {
    userId : Text;
    principal : Principal;
    tenantId : TenantId;
    firstSeenAt : Time.Time;
    lastSeenAt : Time.Time;
  };

  public type Session = {
    sessionToken : Text;
    tenantId : TenantId;
    userId : Text;
    principal : Principal;
    createdAt : Time.Time;
    expiresAt : Time.Time;
  };

  public type VerifyAuthResult = {
    sessionToken : Text;
    userId : Text;
    expiresAt : Time.Time;
    isNewUser : Bool;
  };

  public type ValidateSessionResult = {
    userId : Text;
    valid : Bool;
    expiresAt : Time.Time;
  };

  // Audit log types
  public type AuditLogEntry = {
    id : Text;
    tenantId : TenantId;
    eventType : Text;
    userId : Text;
    timestamp : Time.Time;
    success : Bool;
    callerPrincipal : Text;
  };

  public type CanisterAttestation = {
    canisterId : Text;
    timestamp : Time.Time;
    version : Text;
    message : Text;
    network : Text;
  };

  // Stable collaborators keeping to notion content
  let tenants = Map.empty<TenantId, Tenant>();
  let memberships = Map.empty<TenantId, List.List<Membership>>();
  let webhooks = Map.empty<TenantId, WebhookConfig>();
  let authEvents = Map.empty<TenantId, List.List<AuthEvent>>();
  let dailyAggregates = Map.empty<TenantId, Map.Map<Day, DailyAggregate>>();
  let retentionPeriod = 30 * 24 * 60 * 60 * 1_000_000_000 : Nat; // 30 days in nanoseconds
  var rateLimitBuckets = Map.empty<ApiKeyHash, RateLimitBucket>();
  let systemAdmins = Map.empty<Principal, Bool>();

  let endUsers = Map.empty<Text, EndUser>();
  let sessions = Map.empty<Text, Session>();

  // Audit log storage
  let auditLog = Map.empty<TenantId, List.List<AuditLogEntry>>();
  var auditLogCounter = 0;

  public shared query ({ caller }) func transform(input : HttpOutcall.TransformationInput) : async HttpOutcall.TransformationOutput {
    HttpOutcall.transform(input);
  };

  // Role-based Access Control (RBAC)
  func isSystemAdmin(principal : Principal) : Bool {
    systemAdmins.containsKey(principal);
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

    requireAdminRole(tenant.id, caller); // Check privileges

    let (newApiKey, newApiKeyHash) = generateApiKey(tenant.id);

    let updatedTenant = { tenant with apiKeyHash = newApiKeyHash };
    tenants.add(tenant.id, updatedTenant);

    // Log event
    await addAuditLogEntry(
      tenant.id,
      "api_key_regenerated",
      Principal.anonymous().toText(),
      true,
      caller.toText(), // Provide caller's principal as Text
    );

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

    if (not isSystemAdmin(caller)) {
      let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
      if (not allowed) { Runtime.trap("Rate limit exceeded") };
    };

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

    // Log event
    await addAuditLogEntry(
      tenant.id,
      "member_added",
      principal.toText(),
      true,
      caller.toText(), // Provide caller's principal as Text
    );
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
    if (not isSystemAdmin(caller)) {
      let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
      if (not allowed) { Runtime.trap("Rate limit exceeded") };
    };

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

    // Log event
    await addAuditLogEntry(
      tenantId,
      "role_changed",
      userPrincipal.toText(),
      true,
      caller.toText(), // Provide caller's principal as Text
    );
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
    if (not isSystemAdmin(caller)) {
      let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
      if (not allowed) { Runtime.trap("Rate limit exceeded") };
    };

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

    // Log event
    await addAuditLogEntry(
      tenantId,
      "member_removed",
      userPrincipal.toText(),
      true,
      caller.toText(), // Provide caller's principal as Text
    );
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

    if (not isSystemAdmin(caller)) {
      let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
      if (not allowed) { Runtime.trap("Rate limit exceeded") };
    };

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

    if (not isSystemAdmin(caller)) {
      let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
      if (not allowed) { Runtime.trap("Rate limit exceeded") };
    };

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

    if (not isSystemAdmin(caller)) {
      let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
      if (not allowed) { Runtime.trap("Rate limit exceeded") };
    };

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

    // Also record in the audit log
    await addAuditLogEntry(
      tenantId,
      eventType,
      userId,
      success,
      "system",
    );
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

    if (not isSystemAdmin(caller)) {
      let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
      if (not allowed) { Runtime.trap("Rate limit exceeded") };
    };

    let currentDay = getCurrentDay();
    var totalCalls = 0;
    var successCount = 0;
    var webhookSuccess = 0;
    var webhookFailure = 0;

    let aggregates = switch (dailyAggregates.get(tenantId)) {
      case (?aggs) { aggs };
      case (null) { Map.empty<Day, DailyAggregate>() };
    };

    let lowerBound = Int.abs(currentDay - days);

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

    if (not isSystemAdmin(caller)) {
      let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
      if (not allowed) { Runtime.trap("Rate limit exceeded") };
    };

    let currentDay = getCurrentDay();
    var trend = List.empty<(Day, Nat)>();

    let aggregates = switch (dailyAggregates.get(tenantId)) {
      case (?aggs) { aggs };
      case (null) { Map.empty<Day, DailyAggregate>() };
    };

    let lowerBound = Int.abs(currentDay - days);

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

    if (not isSystemAdmin(caller)) {
      let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
      if (not allowed) { Runtime.trap("Rate limit exceeded") };
    };

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
        if (event.timestamp >= (now - retentionPeriod : Int)) {
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

    let thirtyDaysAgo = Int.abs(currentDay - 30);
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

  public shared ({ caller }) func getRateLimitStatusForCaller() : async RateLimitStatus {
    if (caller.isAnonymous()) {
      Runtime.trap("Must be an authenticated principal");
    };

    let tenantOpt = tenants.values().find(func(t) { t.owner == caller });

    switch (tenantOpt) {
      case (?tenant) {
        let now = Time.now();
        let (currentCount, windowStart) = switch (rateLimitBuckets.get(tenant.apiKeyHash)) {
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
      case (null) { Runtime.trap("Tenant not found for caller") };
    };
  };

  public shared ({ caller }) func cleanupRateLimitBuckets() : async Nat {
    if (not isSystemAdmin(caller)) {
      Runtime.trap("Permission denied: system admin only");
    };

    let now = Time.now();

    let expiredBuckets = rateLimitBuckets.filter(func(_k, v) { v.windowStart + 3_600_000_000_000 < now });

    let expiredCount = expiredBuckets.size();

    let unexpiredBuckets = rateLimitBuckets.filter(func(_k, v) { v.windowStart + 3_600_000_000_000 >= now });
    rateLimitBuckets := unexpiredBuckets;

    expiredCount;
  };

  func generateSessionToken() : Text {
    let timestamp = Time.now().toText();
    "st_" # timestamp # "_" # timestamp;
  };

  func generateUserId(p : Principal) : Text {
    "usr_" # p.toText();
  };

  // New public verifyAuth API.
  public shared ({ caller }) func verifyAuth(apiKey : Text, principalText : Text) : async VerifyAuthResult {
    let tenant = switch (tenants.values().find(func(t) { verifyApiKey(apiKey, t.apiKeyHash) })) {
      case (?t) { t };
      case (null) { Runtime.trap("Invalid API key") };
    };

    let allowed = checkAndIncrementRateLimit(tenant.apiKeyHash);
    if (not allowed) { Runtime.trap("Rate limit exceeded. Max 1,000 requests per hour.") };

    let compositeKey = tenant.id # "#" # principalText;
    let now = Time.now();
    var isNewUser = false;

    let endUser = switch (endUsers.get(compositeKey)) {
      case (?existingUser) {
        let updatedUser = { existingUser with lastSeenAt = now };
        endUsers.add(compositeKey, updatedUser);
        updatedUser;
      };
      case (null) {
        let principal = Principal.fromText(principalText);
        let userId = generateUserId(principal);
        let newEndUser = {
          userId;
          principal;
          tenantId = tenant.id;
          firstSeenAt = now;
          lastSeenAt = now;
        };
        endUsers.add(compositeKey, newEndUser);

        isNewUser := true;
        newEndUser;
      };
    };

    let expiresAt = now + 24 * 60 * 60 * 1_000_000_000;
    let sessionToken = generateSessionToken();
    let newSession = {
      sessionToken;
      tenantId = tenant.id;
      userId = endUser.userId;
      principal = endUser.principal;
      createdAt = now;
      expiresAt;
    };
    sessions.add(sessionToken, newSession);

    await recordAuthEvent(tenant.id, if isNewUser { "user_registered" } else {
      "user_authenticated";
    }, endUser.userId, true);

    {
      sessionToken;
      userId = endUser.userId;
      expiresAt;
      isNewUser;
    };
  };

  // New public validateSession API
  public shared ({ caller }) func validateSession(apiKey : Text, sessionToken : Text) : async ValidateSessionResult {
    let tenant = switch (tenants.values().find(func(t) { verifyApiKey(apiKey, t.apiKeyHash) })) {
      case (?t) { t };
      case (null) { Runtime.trap("Invalid API key") };
    };

    switch (sessions.get(sessionToken)) {
      case (?session) {
        if (session.tenantId != tenant.id) { switch (endUsers.get(sessionToken)) {
          case (?endUser) {
            if (endUser.tenantId != tenant.id) {
              return { userId = ""; valid = false; expiresAt = 0 };
            };
          };
          case (null) { return { userId = ""; valid = false; expiresAt = 0 } };
        } };
      };
      case (null) { return { userId = ""; valid = false; expiresAt = 0 } };
    };

    switch (sessions.get(sessionToken)) {
      case (?session) {
        if (Time.now() > session.expiresAt) {
          return {
            userId = session.userId;
            valid = false;
            expiresAt = session.expiresAt;
          };
        };
      };
      case (null) { return { userId = ""; valid = false; expiresAt = 0 } };
    };

    switch (sessions.get(sessionToken)) {
      case (?session) {
        {
          userId = session.userId;
          valid = true;
          expiresAt = session.expiresAt;
        };
      };
      case (null) { return { userId = ""; valid = false; expiresAt = 0 } };
    };
  };

  // Expose endUsers and sessions for testing.
  public shared ({ caller }) func getAllEndUsers() : async [EndUser] {
    endUsers.values().toArray();
  };

  public shared ({ caller }) func getAllSessions() : async [Session] {
    sessions.values().toArray();
  };

  // --------------------- Audit log helpers ---------------------

  public shared ({ caller }) func addAuditLogEntry(
    tenantId : TenantId,
    eventType : Text,
    userId : Text,
    success : Bool,
    callerPrincipal : Text,
  ) : async () {
    let newEntry : AuditLogEntry = {
      id = (auditLogCounter + 1).toText();
      tenantId;
      eventType;
      userId;
      timestamp = Time.now();
      success;
      callerPrincipal;
    };

    let currentEntries = switch (auditLog.get(tenantId)) {
      case (?entries) { entries };
      case (null) { List.empty<AuditLogEntry>() };
    };
    currentEntries.add(newEntry);

    auditLog.add(tenantId, currentEntries);
    auditLogCounter += 1;
  };

  public shared ({ caller }) func getAuditLog(tenantId : TenantId, limitParam : Nat) : async [AuditLogEntry] {
    // Permission check, require Admin role
    if (not tenants.containsKey(tenantId)) {
      Runtime.trap("Tenant not found");
    };

    requireAdminRole(tenantId, caller);

    let limit = if (limitParam > 500) { 500 } else { limitParam };

    switch (auditLog.get(tenantId)) {
      case (?logEntries) {
        let reversed = logEntries.reverse();
        let sliced = reversed.enumerate().filter(func((i, _)) { i < limit }).map(func((_, entry)) { entry });
        sliced.toArray();
      };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func getAuditLogCount(tenantId : TenantId) : async Nat {
    if (not tenants.containsKey(tenantId)) {
      Runtime.trap("Tenant not found");
    };

    requireAdminRole(tenantId, caller);

    switch (auditLog.get(tenantId)) {
      case (?entries) { entries.size() };
      case (null) { 0 };
    };
  };

  public query ({ caller }) func getCanisterAttestation() : async CanisterAttestation {
    {
      canisterId = "lep6p-paaaa-aaaai-q5v4q-cai";
      timestamp = Time.now();
      version = "avantkey-v1";
      message = "This canister is deployed on the Internet Computer Protocol (ICP). Verify at: https://dashboard.internetcomputer.org/canister/lep6p-paaaa-aaaai-q5v4q-cai";
      network = "Internet Computer Mainnet";
    };
  };
};

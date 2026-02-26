import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  // Old types and State (without audit log)
  type TenantId = Text;

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
    apiKeyHash : Text;
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
    date : Nat;
    apiCalls : Nat;
    uniqueUsers : Nat;
    successRate : Nat;
    webhookSuccess : Nat;
    webhookFailure : Nat;
  };

  type OldActor = {
    tenants : Map.Map<TenantId, Tenant>;
    memberships : Map.Map<TenantId, List.List<Membership>>;
    webhooks : Map.Map<TenantId, WebhookConfig>;
    authEvents : Map.Map<TenantId, List.List<AuthEvent>>;
    dailyAggregates : Map.Map<TenantId, Map.Map<Nat, DailyAggregate>>;
    retentionPeriod : Nat;
    rateLimitBuckets : Map.Map<Text, { count : Nat; windowStart : Time.Time }>;
    systemAdmins : Map.Map<Principal, Bool>;
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

  type NewActor = {
    tenants : Map.Map<TenantId, Tenant>;
    memberships : Map.Map<TenantId, List.List<Membership>>;
    webhooks : Map.Map<TenantId, WebhookConfig>;
    authEvents : Map.Map<TenantId, List.List<AuthEvent>>;
    dailyAggregates : Map.Map<TenantId, Map.Map<Nat, DailyAggregate>>;
    retentionPeriod : Nat;
    rateLimitBuckets : Map.Map<Text, { count : Nat; windowStart : Time.Time }>;
    systemAdmins : Map.Map<Principal, Bool>;
    auditLog : Map.Map<TenantId, List.List<AuditLogEntry>>;
    auditLogCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      auditLog = Map.empty<TenantId, List.List<AuditLogEntry>>();
      auditLogCounter = 0;
    };
  };
};

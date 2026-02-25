import Map "mo:core/Map";

module {
  type RateLimitBucket = {
    count : Nat;
    windowStart : Int;
  };

  type Actor = {
    rateLimitBuckets : Map.Map<Text, RateLimitBucket>;
  };

  public func run(old : Actor) : Actor {
    old;
  };
};

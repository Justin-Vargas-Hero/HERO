# Request Deduplication Explained

## What Happens When 5 Users Open /symbol/AAPL Simultaneously?

### The Scenario
5 users open `/symbol/AAPL` at the exact same time. Each page needs:
- Stock quote (price, change, volume, etc.)
- Company profile (CEO, employees, description, etc.)
- Historical chart data
- News articles

### Without Deduplication (Old System)
```
User 1 → API: Get AAPL quote → TwelveData API call #1
User 2 → API: Get AAPL quote → TwelveData API call #2
User 3 → API: Get AAPL quote → TwelveData API call #3
User 4 → API: Get AAPL quote → TwelveData API call #4
User 5 → API: Get AAPL quote → TwelveData API call #5

Result: 5 identical API calls wasting rate limit
```

### With Unified Cache Deduplication (New System)

#### Step 1: First Request Arrives
```typescript
User 1 → getOrFetch('quote:AAPL') →
  - Cache miss
  - No pending request
  - Creates Promise, stores in pendingRequests Map
  - Starts API call
```

#### Step 2: Requests 2-5 Arrive (microseconds later)
```typescript
User 2 → getOrFetch('quote:AAPL') →
  - Cache miss
  - Pending request EXISTS!
  - Returns the SAME Promise from User 1

User 3 → getOrFetch('quote:AAPL') →
  - Cache miss
  - Pending request EXISTS!
  - Returns the SAME Promise from User 1

User 4 → getOrFetch('quote:AAPL') →
  - Cache miss
  - Pending request EXISTS!
  - Returns the SAME Promise from User 1

User 5 → getOrFetch('quote:AAPL') →
  - Cache miss
  - Pending request EXISTS!
  - Returns the SAME Promise from User 1
```

#### Step 3: API Response Arrives
```typescript
API Response →
  - Data stored in cache (TTL: 1 minute)
  - Promise resolves
  - All 5 users receive the SAME data
  - Pending request removed
```

#### Result
- **API Calls Made**: 1
- **Users Served**: 5
- **Efficiency Gain**: 80% reduction

## The Complete Timeline

```
Time    | Action
--------|----------------------------------------------------------
0.000s  | User 1 requests AAPL quote → Starts API call
0.001s  | User 2 requests AAPL quote → Joins User 1's pending request
0.001s  | User 3 requests AAPL quote → Joins User 1's pending request
0.002s  | User 4 requests AAPL quote → Joins User 1's pending request
0.002s  | User 5 requests AAPL quote → Joins User 1's pending request
0.150s  | API responds with data
0.151s  | All 5 users receive data simultaneously
0.151s  | Data cached for 1 minute
--------|----------------------------------------------------------
30.000s | User 6 requests AAPL quote → Served from cache (no API call)
45.000s | User 7 requests AAPL quote → Served from cache (no API call)
60.001s | Cache expires
60.002s | User 8 requests AAPL quote → New API call starts
```

## Code Implementation

```typescript
// In unified-cache.ts
async getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig
): Promise<T> {
  // 1. Check cache first
  const cached = await this.get<T>(key);
  if (cached !== null) {
    return cached;  // Users 6-7 in example above
  }

  // 2. Check if request is already pending
  if (this.pendingRequests.has(key)) {
    return this.pendingRequests.get(key) as Promise<T>;  // Users 2-5
  }

  // 3. Create new request (User 1)
  const request = fetcher()
    .then(async (data) => {
      await this.set(key, data, config);
      this.pendingRequests.delete(key);
      return data;
    })
    .catch((error) => {
      this.pendingRequests.delete(key);
      throw error;
    });

  this.pendingRequests.set(key, request);
  return request;
}
```

## Benefits

### API Rate Limit Protection
- **TwelveData Limit**: 600 requests/minute
- **Without deduplication**: 5 users × 4 data types = 20 requests instantly
- **With deduplication**: 4 requests total (one per data type)

### Performance
- **First user**: ~150ms (API call)
- **Users 2-5**: ~150ms (same Promise)
- **Users 6+**: <1ms (cache hit)

### Cost Savings
For a site with 1000 concurrent users:
- **Without**: 1000 API calls
- **With**: 1 API call + 999 cache hits
- **Savings**: 99.9% reduction

## Edge Cases Handled

### Failed Requests
If the API call fails, all waiting users receive the same error, and the pending request is cleared so a retry can happen.

### Slow API Responses
All users wait for the same response - no duplicate calls are made even if the API is slow.

### Cache Invalidation
If cache is manually invalidated, the next request will trigger a new API call with deduplication for any concurrent requests.

## Summary
When 5 people open `/symbol/AAPL` simultaneously:
1. **Only 1 API call is made** (not 5)
2. **All 5 users share the same Promise**
3. **All receive data at the same time**
4. **Data is cached for 1 minute**
5. **Subsequent users get instant cache hits**

This is automatic and happens for ALL data types - quotes, profiles, news, etc.
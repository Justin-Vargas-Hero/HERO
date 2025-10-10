# Market Data Integration for HERO

## Architecture Overview

We use TwelveData API with intelligent caching to efficiently serve real-time market data to multiple users while staying within rate limits (610 requests/minute).

### Key Features:
- **Smart Caching**: 10-second cache during market hours, 60-second after hours
- **Request Batching**: Multiple symbol requests are batched together
- **Rate Limit Management**: Automatic queuing when approaching limits
- **Efficient Polling**: Client-side polling adjusts based on market hours and tab visibility

## Setup

1. **Add your TwelveData API key to `.env.local`:**
```env
TWELVEDATA_API_KEY=your_actual_api_key_here
```

2. **Install the component in your page:**
```tsx
import { MarketWatchlist } from '@/components/market/MarketWatchlist';

export default function TradingDashboard() {
  return <MarketWatchlist />;
}
```

## How It Works

### Server-Side (Backend)
1. **Single API Client**: One TwelveDataClient instance handles all requests
2. **Shared Cache**: All users benefit from cached data (10-second TTL)
3. **Request Batching**: If 5 users request AAPL within 100ms, only 1 API call is made
4. **Rate Limiting**: Automatic queuing prevents hitting the 610/min limit

### Client-Side (Frontend)
1. **Smart Polling**: 
   - Market hours: 10-second updates
   - Extended hours: 30-second updates
   - Market closed: 60-second updates
2. **Tab Visibility**: Pauses polling when tab is hidden
3. **Efficient Updates**: Only fetches when data is stale

## API Endpoints

### Get Quotes
```
GET /api/market/quote?symbols=AAPL,MSFT,GOOGL
```
Returns current quotes for specified symbols (max 50 per request).

### Single Quote
```
POST /api/market/quote
Body: { "symbol": "AAPL" }
```
Returns quote for a single symbol.

## Usage Examples

### Basic Watchlist
```tsx
import { useMarketData } from '@/hooks/useMarketData';

function MyWatchlist() {
  const { quotes, loading, error } = useMarketData({
    symbols: ['AAPL', 'MSFT', 'GOOGL'],
    pollInterval: 15000 // 15 seconds
  });

  return (
    <div>
      {Array.from(quotes.values()).map(quote => (
        <div key={quote.symbol}>
          {quote.symbol}: ${quote.price}
        </div>
      ))}
    </div>
  );
}
```

### Single Stock
```tsx
import { useMarketQuote } from '@/hooks/useMarketData';

function StockPrice({ symbol }) {
  const { quote, loading } = useMarketQuote(symbol);
  
  if (loading) return <div>Loading...</div>;
  if (!quote) return <div>No data</div>;
  
  return <div>${quote.price}</div>;
}
```

## Rate Limit Management

With 610 requests/minute:
- **Cached Requests**: Unlimited (no API call)
- **Cache Miss**: Counts as 1 API call
- **Batch Request**: 1 API call for up to 50 symbols

### Example Capacity:
- 100 active users viewing same 10 stocks = ~6 requests/minute
- 100 users viewing different stocks = ~60 requests/minute
- System can handle ~1000 concurrent users efficiently

## Adding More Features

### News Integration
```typescript
// Coming soon - already structured for:
GET /api/market/news?symbols=AAPL,MSFT
```

### Events Calendar
```typescript
// Coming soon - already structured for:
GET /api/market/events?symbol=AAPL
```

## Monitoring

Check the stats in your console:
```javascript
// Returns from API response
{
  stats: {
    cacheSize: 45,        // Number of cached symbols
    cacheHitRate: 85.2,   // Percentage of cache hits
    requestCount: 234,    // Requests this minute
    rateLimitRemaining: 376,
    resetIn: 42000        // ms until rate limit reset
  }
}
```

## Best Practices

1. **Group Symbols**: Request multiple symbols together
2. **Reasonable Polling**: 10-30 seconds is usually sufficient
3. **Use Cache**: Let multiple components share the same data
4. **Handle Errors**: Always implement error states
5. **Respect Limits**: Monitor stats to avoid hitting limits

## Troubleshooting

### "TWELVEDATA_API_KEY not configured"
Add your API key to `.env.local` and restart the dev server.

### Rate Limit Exceeded
The system automatically queues requests. If consistently hitting limits, consider:
- Increasing cache TTL
- Reducing polling frequency
- Upgrading TwelveData plan

### Stale Data
Check if market is closed. Data updates less frequently outside market hours.
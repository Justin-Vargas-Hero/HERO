# StockNewsAPI Integration Guide

## Setup
Add your StockNewsAPI key to `.env.local`:
```env
STOCKNEWS_API_KEY=your_api_key_here
```

## Available Endpoints

### 1. Symbol-Specific News
Get news for a specific stock symbol:
```
GET /api/market/news?symbol=AAPL
```

Returns news articles specifically mentioning AAPL, including:
- Title, description, source
- Publication timestamp
- Sentiment (positive/neutral/negative)
- Related tickers
- Article URL

### 2. General Market News
Get general market news:
```
GET /api/market/news?type=general
```

Returns broad market news and analysis.

### 3. Trending News
Get top trending/important news:
```
GET /api/market/news/trending
```

Returns top 10 most important news items sorted by rank/importance.

## Features Implemented

### Sentiment Analysis
Each news item includes sentiment data:
- **Positive**: Bullish news
- **Negative**: Bearish news
- **Neutral**: Informational content

### Intelligent Caching
- **Symbol news**: Cached for 1 hour
- **General news**: Cached for 1 hour
- **Trending news**: Cached for 15 minutes
- Reduces API calls and improves performance

### Request Deduplication
Multiple simultaneous requests for the same news are automatically deduplicated.

## Usage in Components

### Symbol Page News Section
```typescript
// Already implemented in src/app/symbol/[symbol]/page.tsx
fetch(`/api/market/news?symbol=${symbol}`)
```

### Market Page (To Add)
```typescript
// For general market news
fetch('/api/market/news?type=general')

// For trending headlines
fetch('/api/market/news/trending')
```

## API Limits
- Check your StockNewsAPI plan limits
- Basic plans typically allow:
  - 100-500 requests per day
  - Up to 100 items per request
  - Historical data access

## Future Enhancements

1. **Sentiment Indicators**
   - Add visual sentiment indicators (🟢 🔴 ⚪)
   - Color-code news based on sentiment

2. **News Filtering**
   - Filter by date range
   - Filter by sentiment
   - Filter by source

3. **Watchlist News**
   - Aggregate news for all watchlist symbols
   - Show breaking news alerts

4. **News Analytics**
   - Daily sentiment summary
   - Most mentioned tickers
   - News volume indicators

## Error Handling
- If API key is not configured, returns empty array
- Frontend shows "No news available" gracefully
- All errors are logged but don't break the app

## Testing
Test the integration:
```bash
# Test symbol news
curl http://localhost:3000/api/market/news?symbol=AAPL

# Test general news
curl http://localhost:3000/api/market/news?type=general

# Test trending news
curl http://localhost:3000/api/market/news/trending
```
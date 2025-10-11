// Ticker database compiled from TwelveData official ticker list
// Includes ETFs, popular stocks, and crypto pairs
// Last updated: 2024

export interface TickerSymbol {
  symbol: string;
  name: string;
  exchange?: string;
  country?: string;
}

// Popular stocks that every trader searches for
const POPULAR_STOCKS: TickerSymbol[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'GOOG', name: 'Alphabet Inc. Class C', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'BRK.A', name: 'Berkshire Hathaway Inc. Class A', exchange: 'NYSE', country: 'United States' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', exchange: 'NYSE', country: 'United States' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', country: 'United States' },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'DIS', name: 'Walt Disney Co.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'BAC', name: 'Bank of America Corp.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'ABT', name: 'Abbott Laboratories', exchange: 'NYSE', country: 'United States' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'ACN', name: 'Accenture plc', exchange: 'NYSE', country: 'United States' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', country: 'United States' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', exchange: 'NYSE', country: 'United States' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE', country: 'United States' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'QCOM', name: 'QUALCOMM Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'TXN', name: 'Texas Instruments Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'INTU', name: 'Intuit Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'AMGN', name: 'Amgen Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'MS', name: 'Morgan Stanley', exchange: 'NYSE', country: 'United States' },
  { symbol: 'BLK', name: 'BlackRock Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'C', name: 'Citigroup Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', exchange: 'NYSE', country: 'United States' },
  { symbol: 'SCHW', name: 'Charles Schwab Corporation', exchange: 'NYSE', country: 'United States' },
  { symbol: 'T', name: 'AT&T Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'TMUS', name: 'T-Mobile US Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'NEE', name: 'NextEra Energy Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', country: 'United States' },
  { symbol: 'KO', name: 'Coca-Cola Company', exchange: 'NYSE', country: 'United States' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', exchange: 'NYSE', country: 'United States' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'NKE', name: 'Nike Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'ABNB', name: 'Airbnb Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'LYFT', name: 'Lyft Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'SQ', name: 'Block Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'SHOP', name: 'Shopify Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'SPOT', name: 'Spotify Technology S.A.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'SNAP', name: 'Snap Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'PINS', name: 'Pinterest Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'TWTR', name: 'Twitter Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'RBLX', name: 'Roblox Corporation', exchange: 'NYSE', country: 'United States' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'HOOD', name: 'Robinhood Markets Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'PLTR', name: 'Palantir Technologies Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'SNOW', name: 'Snowflake Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'DDOG', name: 'Datadog Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'CRWD', name: 'CrowdStrike Holdings Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'ZM', name: 'Zoom Video Communications Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'DOCU', name: 'DocuSign Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'TEAM', name: 'Atlassian Corporation', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'OKTA', name: 'Okta Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'TWLO', name: 'Twilio Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'NOW', name: 'ServiceNow Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'WDAY', name: 'Workday Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'VEEV', name: 'Veeva Systems Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'PANW', name: 'Palo Alto Networks Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'FTNT', name: 'Fortinet Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'NET', name: 'Cloudflare Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'ROKU', name: 'Roku Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'TTD', name: 'The Trade Desk Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'MELI', name: 'MercadoLibre Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'SE', name: 'Sea Limited', exchange: 'NYSE', country: 'United States' },
  { symbol: 'BABA', name: 'Alibaba Group Holding Limited', exchange: 'NYSE', country: 'United States' },
  { symbol: 'JD', name: 'JD.com Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'PDD', name: 'PDD Holdings Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'NIO', name: 'NIO Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'LI', name: 'Li Auto Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'XPEV', name: 'XPeng Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'RIVN', name: 'Rivian Automotive Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'LCID', name: 'Lucid Group Inc.', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'F', name: 'Ford Motor Company', exchange: 'NYSE', country: 'United States' },
  { symbol: 'GM', name: 'General Motors Company', exchange: 'NYSE', country: 'United States' },
  { symbol: 'STLA', name: 'Stellantis N.V.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'TM', name: 'Toyota Motor Corporation', exchange: 'NYSE', country: 'United States' },
  { symbol: 'HMC', name: 'Honda Motor Co. Ltd.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'BA', name: 'Boeing Company', exchange: 'NYSE', country: 'United States' },
  { symbol: 'LMT', name: 'Lockheed Martin Corporation', exchange: 'NYSE', country: 'United States' },
  { symbol: 'RTX', name: 'Raytheon Technologies Corporation', exchange: 'NYSE', country: 'United States' },
  { symbol: 'GE', name: 'General Electric Company', exchange: 'NYSE', country: 'United States' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', exchange: 'NYSE', country: 'United States' },
  { symbol: 'DE', name: 'Deere & Company', exchange: 'NYSE', country: 'United States' },
  { symbol: 'MMM', name: '3M Company', exchange: 'NYSE', country: 'United States' },
  { symbol: 'HON', name: 'Honeywell International Inc.', exchange: 'NASDAQ', country: 'United States' }
];

// Popular ETFs
const POPULAR_ETFS: TickerSymbol[] = [
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE', country: 'United States' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF', exchange: 'NYSE', country: 'United States' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', exchange: 'NYSE', country: 'United States' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', exchange: 'NYSE', country: 'United States' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', exchange: 'NYSE', country: 'United States' },
  { symbol: 'EEM', name: 'iShares MSCI Emerging Markets ETF', exchange: 'NYSE', country: 'United States' },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund', exchange: 'NYSE', country: 'United States' },
  { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund', exchange: 'NYSE', country: 'United States' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR Fund', exchange: 'NYSE', country: 'United States' },
  { symbol: 'GLD', name: 'SPDR Gold Trust', exchange: 'NYSE', country: 'United States' },
  { symbol: 'SLV', name: 'iShares Silver Trust', exchange: 'NYSE', country: 'United States' },
  { symbol: 'USO', name: 'United States Oil Fund', exchange: 'NYSE', country: 'United States' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'HYG', name: 'iShares iBoxx High Yield Corporate Bond ETF', exchange: 'NYSE', country: 'United States' },
  { symbol: 'ARKK', name: 'ARK Innovation ETF', exchange: 'NYSE', country: 'United States' },
  { symbol: 'ARKG', name: 'ARK Genomic Revolution ETF', exchange: 'CBOE', country: 'United States' },
  { symbol: 'ARKQ', name: 'ARK Autonomous Technology & Robotics ETF', exchange: 'CBOE', country: 'United States' },
  { symbol: 'ARKW', name: 'ARK Next Generation Internet ETF', exchange: 'NYSE', country: 'United States' },
  { symbol: 'ICLN', name: 'iShares Global Clean Energy ETF', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'JETS', name: 'U.S. Global Jets ETF', exchange: 'NYSE', country: 'United States' },
  { symbol: 'XBI', name: 'SPDR S&P Biotech ETF', exchange: 'NYSE', country: 'United States' },
  { symbol: 'SMH', name: 'VanEck Semiconductor ETF', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'SOXX', name: 'iShares Semiconductor ETF', exchange: 'NASDAQ', country: 'United States' },
  { symbol: 'IBB', name: 'iShares Biotechnology ETF', exchange: 'NASDAQ', country: 'United States' }
];

// Crypto pairs
const CRYPTO_PAIRS: TickerSymbol[] = [
  { symbol: 'BTC/USD', name: 'Bitcoin', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'ETH/USD', name: 'Ethereum', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'BNB/USD', name: 'Binance Coin', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'XRP/USD', name: 'Ripple', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'ADA/USD', name: 'Cardano', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'SOL/USD', name: 'Solana', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'DOGE/USD', name: 'Dogecoin', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'DOT/USD', name: 'Polkadot', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'MATIC/USD', name: 'Polygon', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'SHIB/USD', name: 'Shiba Inu', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'AVAX/USD', name: 'Avalanche', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'LINK/USD', name: 'Chainlink', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'UNI/USD', name: 'Uniswap', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'ATOM/USD', name: 'Cosmos', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'LTC/USD', name: 'Litecoin', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'FTT/USD', name: 'FTX Token', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'NEAR/USD', name: 'NEAR Protocol', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'ALGO/USD', name: 'Algorand', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'BCH/USD', name: 'Bitcoin Cash', exchange: 'CRYPTO', country: 'Global' },
  { symbol: 'XLM/USD', name: 'Stellar', exchange: 'CRYPTO', country: 'Global' }
];

// Combine all tickers
export const ALL_TICKERS: TickerSymbol[] = [
  ...POPULAR_STOCKS,
  ...POPULAR_ETFS,
  ...CRYPTO_PAIRS
];

// Popular ticker symbols for quick access
export const POPULAR_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA',
  'SPY', 'QQQ', 'DIA', 'IWM', 'VOO',
  'BTC/USD', 'ETH/USD',
  'JPM', 'BAC', 'WMT', 'JNJ', 'V', 'PG'
];

/**
 * Search for tickers by symbol or name
 */
export function searchTickers(query: string, limit: number = 10): TickerSymbol[] {
  if (!query || query.length === 0) return [];
  
  const searchTerm = query.toUpperCase();
  const results: TickerSymbol[] = [];
  
  // First, exact symbol matches
  const exactMatch = ALL_TICKERS.find(t => 
    t.symbol.toUpperCase() === searchTerm
  );
  if (exactMatch) {
    results.push(exactMatch);
  }
  
  // Then, symbols starting with query
  ALL_TICKERS.forEach(ticker => {
    if (results.length >= limit) return;
    if (ticker.symbol.toUpperCase().startsWith(searchTerm) && 
        !results.find(r => r.symbol === ticker.symbol)) {
      results.push(ticker);
    }
  });
  
  // Then, symbols containing query
  ALL_TICKERS.forEach(ticker => {
    if (results.length >= limit) return;
    if (ticker.symbol.toUpperCase().includes(searchTerm) && 
        !results.find(r => r.symbol === ticker.symbol)) {
      results.push(ticker);
    }
  });
  
  // Finally, names containing query
  ALL_TICKERS.forEach(ticker => {
    if (results.length >= limit) return;
    if (ticker.name.toUpperCase().includes(searchTerm) && 
        !results.find(r => r.symbol === ticker.symbol)) {
      results.push(ticker);
    }
  });
  
  return results.slice(0, limit);
}

/**
 * Get a ticker by exact symbol match
 */
export function getTicker(symbol: string): TickerSymbol | undefined {
  return ALL_TICKERS.find(t => 
    t.symbol.toUpperCase() === symbol.toUpperCase()
  );
}

/**
 * Get popular tickers
 */
export function getPopularTickers(limit: number = 10): TickerSymbol[] {
  return POPULAR_SYMBOLS
    .slice(0, limit)
    .map(symbol => getTicker(symbol))
    .filter((t): t is TickerSymbol => t !== undefined);
}
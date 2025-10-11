const fs = require('fs');
const path = require('path');

// Read the crypto.json file
const cryptoDataPath = path.join(__dirname, '../../crypto.json');
const cryptoData = JSON.parse(fs.readFileSync(cryptoDataPath, 'utf8'));

// Filter for USD pairs on Binance
const binanceUsdPairs = cryptoData.data
  .filter(crypto =>
    crypto.currency_quote === 'US Dollar' &&
    crypto.available_exchanges.includes('Binance')
  )
  .map(crypto => {
    // Extract the base symbol from the pair (e.g., "BTC/USD" -> "BTC")
    const baseSymbol = crypto.symbol.split('/')[0];

    return {
      symbol: baseSymbol,
      name: crypto.currency_base,
      exchange: 'BINANCE',
      popularity: 50 // Default popularity, can be adjusted
    };
  })
  // Remove duplicates (some symbols might appear multiple times)
  .filter((item, index, self) =>
    index === self.findIndex(t => t.symbol === item.symbol)
  )
  // Sort alphabetically for better readability
  .sort((a, b) => a.symbol.localeCompare(b.symbol));

// Set higher popularity for well-known cryptos
const popularCryptos = {
  'BTC': 100,
  'ETH': 95,
  'BNB': 85,
  'USDT': 80,
  'USDC': 75,
  'XRP': 70,
  'ADA': 70,
  'DOGE': 75,
  'SOL': 80,
  'DOT': 65,
  'MATIC': 70,
  'SHIB': 70,
  'AVAX': 65,
  'LINK': 65,
  'UNI': 60,
  'LTC': 65,
  'ATOM': 60,
  'XLM': 55,
  'ALGO': 55,
  'VET': 50,
  'NEAR': 60,
  'FTM': 55,
  'ICP': 55,
  'FIL': 50,
  'APE': 65,
  'SAND': 60,
  'MANA': 60,
  'AXS': 60,
  'AAVE': 55,
  'CRV': 50,
  'MKR': 50,
  'SUSHI': 50,
  'CHZ': 55,
  'ENJ': 55,
  'GALA': 55
};

// Apply popularity scores
binanceUsdPairs.forEach(crypto => {
  if (popularCryptos[crypto.symbol]) {
    crypto.popularity = popularCryptos[crypto.symbol];
  }
});

// Generate TypeScript code for the tickers
const tsCode = `// Binance USD Trading Pairs - Auto-generated from crypto.json
// Generated on ${new Date().toISOString()}

export const BINANCE_USD_TICKERS: TickerSymbol[] = [
${binanceUsdPairs.map(crypto =>
  `  { symbol: "${crypto.symbol}", name: "${crypto.name}", exchange: "${crypto.exchange}", popularity: ${crypto.popularity} }`
).join(',\n')}
];
`;

// Output statistics
console.log(`Found ${binanceUsdPairs.length} USD trading pairs on Binance`);
console.log('\nTop 20 symbols:');
binanceUsdPairs.slice(0, 20).forEach(crypto => {
  console.log(`  ${crypto.symbol}: ${crypto.name}`);
});

// Save to a file that can be imported
const outputPath = path.join(__dirname, '../data/binance-usd-tickers.ts');
fs.writeFileSync(outputPath, tsCode);
console.log(`\nData saved to: ${outputPath}`);

// Also save as JSON for reference
const jsonPath = path.join(__dirname, '../data/binance-usd-tickers.json');
fs.writeFileSync(jsonPath, JSON.stringify(binanceUsdPairs, null, 2));
console.log(`JSON data saved to: ${jsonPath}`);
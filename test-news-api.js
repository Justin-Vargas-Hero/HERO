/**
 * Test StockNewsAPI Integration
 * Run: node test-news-api.js
 */

const baseUrl = 'http://localhost:3000';

async function testNewsEndpoint(endpoint, description) {
    console.log(`\n📰 Testing: ${description}`);
    console.log(`   Endpoint: ${endpoint}`);

    try {
        const response = await fetch(`${baseUrl}${endpoint}`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            console.log(`   ✅ Found ${data.length} news items`);

            // Show first news item as example
            const firstItem = data[0];
            console.log(`   📄 Sample article:`);
            console.log(`      Title: ${firstItem.title || 'N/A'}`);
            console.log(`      Source: ${firstItem.source || 'N/A'}`);
            console.log(`      Sentiment: ${firstItem.sentiment || 'N/A'}`);

            if (firstItem.tickers && firstItem.tickers.length > 0) {
                console.log(`      Tickers: ${firstItem.tickers.join(', ')}`);
            }
        } else if (Array.isArray(data) && data.length === 0) {
            console.log(`   ⚠️  No news available (API key might not be configured)`);
        } else {
            console.log(`   ❌ Unexpected response format`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
}

async function runTests() {
    console.log('🚀 Starting StockNewsAPI Integration Tests\n');
    console.log('Note: Add STOCKNEWS_API_KEY to .env.local for real data\n');

    // Test symbol-specific news
    await testNewsEndpoint(
        '/api/market/news?symbol=AAPL',
        'Apple (AAPL) specific news'
    );

    // Test general market news
    await testNewsEndpoint(
        '/api/market/news?type=general',
        'General market news'
    );

    // Test trending news
    await testNewsEndpoint(
        '/api/market/news/trending',
        'Trending/important news (sorted by rank)'
    );

    // Test crypto news
    await testNewsEndpoint(
        '/api/market/news?symbol=BTC',
        'Bitcoin news'
    );

    console.log('\n✨ Tests complete!');
    console.log('\nNext steps:');
    console.log('1. Add STOCKNEWS_API_KEY to .env.local');
    console.log('2. Restart the dev server');
    console.log('3. News will appear on symbol pages automatically');
}

runTests().catch(console.error);
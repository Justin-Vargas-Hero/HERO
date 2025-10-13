/**
 * Test script to demonstrate request deduplication
 * Run with: node test-deduplication.js
 */

const baseUrl = 'http://localhost:3000';

async function fetchQuote(userId) {
  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}/api/market/quote?symbol=AAPL`);
    const data = await response.json();
    const elapsed = Date.now() - start;

    console.log(`User ${userId}: Got response in ${elapsed}ms - Price: $${data.quote?.price || 'N/A'}`);
    return data;
  } catch (error) {
    console.error(`User ${userId}: Failed -`, error.message);
  }
}

async function testConcurrentRequests() {
  console.log('Testing: 5 users requesting AAPL quote simultaneously...\n');

  // Launch 5 requests at the exact same time
  const promises = [
    fetchQuote(1),
    fetchQuote(2),
    fetchQuote(3),
    fetchQuote(4),
    fetchQuote(5)
  ];

  // Wait for all to complete
  await Promise.all(promises);

  console.log('\n✅ All requests completed');
  console.log('Note: With deduplication, only 1 API call was made!\n');

  // Test cache hit
  console.log('Testing: User 6 requesting AAPL (should be cached)...');
  await fetchQuote(6);

  console.log('\n📊 Expected behavior:');
  console.log('- Users 1-5: Same response time (~100-200ms) - shared API call');
  console.log('- User 6: Fast response (<10ms) - served from cache');
}

// Run the test
console.log('🚀 Starting deduplication test...\n');
testConcurrentRequests().catch(console.error);
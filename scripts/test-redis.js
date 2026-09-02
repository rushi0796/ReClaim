require('dotenv').config();
const { testRedisConnection } = require('../src/utils/redisClient');

async function runRedisTest() {
  console.log('====================================================');
  console.log('  RECLAIM - Upstash Redis Database Connection Test');
  console.log('====================================================\n');

  console.log('Connecting to Upstash Redis database...');
  console.log('URL:', process.env.UPSTASH_REDIS_REST_URL || 'Not configured');

  const result = await testRedisConnection();

  console.log('\n--- TEST RESULT ---');
  console.log('Status     :', result.status);
  console.log('Success    :', result.success);
  console.log('Test Key   :', result.key);
  console.log('SET Value  :', result.set_value);
  console.log('GET Value  :', result.get_value);
  console.log('Message    :', result.message);

  if (result.success) {
    console.log('\n✅ Upstash Redis SET/GET test passed 100%!');
  } else {
    console.error('\n❌ Upstash Redis test failed!');
    process.exitCode = 1;
  }
}

runRedisTest().catch(err => {
  console.error('Test Error:', err);
  process.exitCode = 1;
});

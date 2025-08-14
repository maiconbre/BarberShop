const axios = require('axios');

const BASE_URL = 'http://localhost:6543/api';

async function testEmailVerification() {
  try {
    console.log('Testing email verification endpoints...\n');

    // Test 1: Initiate email verification
    console.log('1. Testing email verification initiation...');
    const emailResponse = await axios.post(`${BASE_URL}/barbershops/verify-email`, {
      email: 'test@example.com',
      barbershopName: 'Test Barbershop'
    });
    
    console.log('✅ Email verification initiated:', emailResponse.data);
    console.log('');

    // Test 2: Check slug availability
    console.log('2. Testing slug availability check...');
    const slugResponse = await axios.get(`${BASE_URL}/barbershops/check-slug/test-barbershop`);
    
    console.log('✅ Slug availability:', slugResponse.data);
    console.log('');

    // Test 3: Try to verify with wrong code (should fail)
    console.log('3. Testing code verification with wrong code...');
    try {
      await axios.post(`${BASE_URL}/barbershops/verify-code`, {
        email: 'test@example.com',
        code: '000000'
      });
    } catch (error) {
      console.log('✅ Wrong code rejected as expected:', error.response.data);
    }
    console.log('');

    console.log('All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEmailVerification();
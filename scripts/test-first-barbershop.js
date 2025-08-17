#!/usr/bin/env node

/**
 * Test script for first barbershop registration
 * This script tests the complete flow of barbershop registration
 */

const axios = require('axios');

// Configuration
const config = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:8000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

/**
 * Test barbershop registration flow
 */
async function testBarbershopRegistration() {
  console.log('🧪 Testing barbershop registration flow...\n');
  
  try {
    // Step 1: Check if backend is running
    console.log('1️⃣ Checking backend connectivity...');
    try {
      const healthResponse = await axios.get(`${config.backendUrl}/health`, { timeout: 5000 });
      console.log('✅ Backend is running');
    } catch (error) {
      console.log('❌ Backend is not accessible');
      console.log('   Make sure the backend is running on', config.backendUrl);
      return false;
    }
    
    // Step 2: Test barbershop registration endpoint
    console.log('\n2️⃣ Testing barbershop registration...');
    const testBarbershop = {
      name: 'Barbearia Teste',
      slug: 'barbearia-teste-' + Date.now(),
      ownerEmail: 'teste@exemplo.com',
      ownerName: 'João Teste',
      ownerPassword: 'senha123'
    };
    
    try {
      const registerResponse = await axios.post(
        `${config.backendUrl}/api/barbershops/register`,
        testBarbershop,
        { timeout: 10000 }
      );
      
      if (registerResponse.status === 201) {
        console.log('✅ Barbershop registration successful');
        console.log('   Barbershop ID:', registerResponse.data.barbershop?.id);
        console.log('   Slug:', registerResponse.data.barbershop?.slug);
        
        // Step 3: Test login with created user
        console.log('\n3️⃣ Testing login with created user...');
        try {
          const loginResponse = await axios.post(
            `${config.backendUrl}/api/auth/login`,
            {
              username: testBarbershop.ownerEmail,
              password: testBarbershop.ownerPassword
            },
            { timeout: 5000 }
          );
          
          if (loginResponse.status === 200 && loginResponse.data.token) {
            console.log('✅ Login successful');
            console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
            
            // Step 4: Test accessing barbershop data
            console.log('\n4️⃣ Testing barbershop data access...');
            try {
              const barbershopResponse = await axios.get(
                `${config.backendUrl}/api/barbershops/current`,
                {
                  headers: { Authorization: `Bearer ${loginResponse.data.token}` },
                  timeout: 5000
                }
              );
              
              if (barbershopResponse.status === 200) {
                console.log('✅ Barbershop data access successful');
                console.log('   Barbershop name:', barbershopResponse.data.name);
                console.log('   Plan type:', barbershopResponse.data.planType || 'free');
                
                return {
                  success: true,
                  barbershop: registerResponse.data.barbershop,
                  token: loginResponse.data.token,
                  message: 'All tests passed successfully!'
                };
              } else {
                console.log('❌ Failed to access barbershop data');
                return false;
              }
            } catch (error) {
              console.log('❌ Error accessing barbershop data:', error.response?.data?.message || error.message);
              return false;
            }
          } else {
            console.log('❌ Login failed - no token received');
            return false;
          }
        } catch (error) {
          console.log('❌ Login failed:', error.response?.data?.message || error.message);
          return false;
        }
      } else {
        console.log('❌ Barbershop registration failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Registration failed:', error.response?.data?.message || error.message);
      
      // Check if it's a duplicate slug error
      if (error.response?.status === 400 && error.response?.data?.message?.includes('slug')) {
        console.log('   This might be a duplicate slug. Try with a different name.');
      }
      
      return false;
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    return false;
  }
}

/**
 * Test frontend accessibility
 */
async function testFrontendAccess() {
  console.log('\n🌐 Testing frontend accessibility...');
  
  try {
    const response = await axios.get(config.frontendUrl, { timeout: 5000 });
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
      return true;
    } else {
      console.log('❌ Frontend returned status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend is not accessible');
    console.log('   Make sure the frontend is running on', config.frontendUrl);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting first barbershop registration test...\n');
  
  // Test frontend
  const frontendOk = await testFrontendAccess();
  
  // Test barbershop registration
  const registrationResult = await testBarbershopRegistration();
  
  console.log('\n📊 Test Results:');
  console.log('Frontend:', frontendOk ? '✅ OK' : '❌ FAIL');
  console.log('Registration Flow:', registrationResult ? '✅ OK' : '❌ FAIL');
  
  if (frontendOk && registrationResult) {
    console.log('\n🎉 All tests passed! The system is ready for the first real barbershop.');
    console.log('\n📝 Next steps:');
    console.log('1. Share the registration URL with the first barbershop');
    console.log('2. Monitor the registration process');
    console.log('3. Provide support if needed');
    
    if (registrationResult.barbershop) {
      console.log('\n🔗 Test barbershop URLs:');
      console.log(`   Public page: ${config.frontendUrl}/${registrationResult.barbershop.slug}`);
      console.log(`   Dashboard: ${config.frontendUrl}/app/${registrationResult.barbershop.slug}/dashboard`);
    }
    
    return true;
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues before launch.');
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testBarbershopRegistration, testFrontendAccess };
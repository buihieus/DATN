/**
 * Authentication System Test Script
 * This script tests the refresh token functionality and authentication flow
 */

const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000'; // Adjust to your server URL

console.log('Testing Authentication System...\n');

// Test variables
let testUser = {
  email: 'testuser@example.com',
  password: 'testpassword123',
  fullName: 'Test User',
  phone: '0123456789'
};

async function testAuthenticationFlow() {
  try {
    console.log('1. Testing registration...');
    
    // Test registration
    const registerResponse = await axios.post(`${BASE_URL}/api/register`, {
      fullName: testUser.fullName,
      email: testUser.email,
      password: testUser.password,
      phone: testUser.phone
    });
    
    console.log('✓ Registration successful');
    console.log('Response:', registerResponse.data.message);
    
    // Extract tokens from registration response
    const { token: accessToken, refreshToken } = registerResponse.data.metadata;
    
    console.log('\n2. Testing protected route with access token...');
    
    // Test accessing protected route with access token
    const authResponse = await axios.get(`${BASE_URL}/api/auth`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✓ Protected route access successful');
    console.log('User authenticated:', authResponse.data.message);
    
    console.log('\n3. Testing refresh token...');
    
    // Test refresh token
    const refreshResponse = await axios.get(`${BASE_URL}/api/refresh-token`, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`
      }
    });
    
    console.log('✓ Refresh token successful');
    console.log('New access token received');
    
    const newAccessToken = refreshResponse.data.metadata.token;
    
    console.log('\n4. Testing protected route with new access token...');
    
    // Test accessing protected route with new access token
    const newAuthResponse = await axios.get(`${BASE_URL}/api/auth`, {
      headers: {
        'Authorization': `Bearer ${newAccessToken}`
      }
    });
    
    console.log('✓ Protected route access with new token successful');
    console.log('User authenticated with new token:', newAuthResponse.data.message);
    
    console.log('\n5. Testing logout...');
    
    // Test logout
    const logoutResponse = await axios.get(`${BASE_URL}/api/logout`, {
      headers: {
        'Authorization': `Bearer ${newAccessToken}`
      }
    });
    
    console.log('✓ Logout successful');
    console.log('Response:', logoutResponse.data.message);
    
    console.log('\n✅ All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Run the test
testAuthenticationFlow();
import axios from 'axios';

const BASE_URL = 'http://localhost:5050/api';

async function testAuthentication() {
  console.log('🧪 Testing NestJS Authentication...\n');

  try {
    // Test login with existing user
    console.log('1. Testing login endpoint...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'milton@ingeocimyc.com',
      password: 'Ingeocimyc.1089',
    });

    console.log('✅ Login successful!');
    console.log('User data:', {
      email: loginResponse.data.user.email,
      name: loginResponse.data.user.name,
      role: loginResponse.data.user.role,
      token: loginResponse.data.access_token
        ? '✅ Token generated'
        : '❌ No token',
    });

    // Test accessing a protected route
    console.log('\n2. Testing protected route with JWT...');
    const token = loginResponse.data.access_token;

    const protectedResponse = await axios.get(`${BASE_URL}/service-requests`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Protected route access successful!');
    console.log(`Found ${protectedResponse.data.length} service requests`);

    // Test services endpoint
    console.log('\n3. Testing services endpoint...');
    const servicesResponse = await axios.get(`${BASE_URL}/services`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Services endpoint working!');
    console.log(`Found ${servicesResponse.data.length} services`);
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('\n🔍 Testing if user exists in database...');
      // This will help us understand if the issue is authentication or user data
    }
  }
}

testAuthentication();

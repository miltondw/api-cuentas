const axios = require('axios');

const BASE_URL = 'http://localhost:5051/api';

async function quickTest() {
  console.log('🧪 Quick authentication test...\n');

  try {
    // Test login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'milton@ingeocimyc.com',
      password: 'Ingeocimyc.1089',
    });

    if (loginResponse.data.accessToken) {
      console.log('✅ Login successful - token generated');

      const token = loginResponse.data.accessToken;
      console.log('User role:', loginResponse.data.user.role);

      // Test protected endpoint
      console.log('\n2. Testing service-requests endpoint...');
      const serviceRequestsResponse = await axios.get(
        `${BASE_URL}/service-requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log('✅ Service requests endpoint working!');

      // Test projects endpoint
      console.log('\n3. Testing projects endpoint...');
      const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('✅ Projects endpoint working!');
      console.log('\n🎉 All endpoints working! Authentication fixed!');
    } else {
      console.log('❌ Login failed - no token returned');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(
        '❌ Server not running. Start server with: npm run start:dev',
      );
    } else {
      console.error(
        '❌ Error:',
        error.response?.status,
        error.response?.data?.message || error.message,
      );

      if (error.response?.status === 401) {
        console.log('\n🔍 401 Error indicates JWT validation is still failing');
        console.log('This suggests TypeORM entity loading issue');
      }
    }
  }
}

quickTest();

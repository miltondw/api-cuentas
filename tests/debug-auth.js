const axios = require('axios');

const BASE_URL = 'http://localhost:5051/api';

async function debugAuth() {
  console.log('🔍 Debugging authentication...\n');

  try {
    // First test if server is running
    console.log('1. Testing if server is responding...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/auth/health`, {
        timeout: 5000,
      });
    } catch (healthError) {
      if (healthError.code === 'ECONNREFUSED') {
        console.log(
          '❌ Server is not running. Please start the server first with: npm run start:dev',
        );
        return;
      }
    }

    // Test login
    console.log('2. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'milton@ingeocimyc.com',
      password: 'Ingeocimyc.1089',
    });

    console.log('✅ Login successful!');
    console.log(`Token: ${loginResponse.data.accessToken.substring(0, 50)}...`);
    console.log(
      `User: ${loginResponse.data.user.name} (${loginResponse.data.user.role})`,
    );

    const token = loginResponse.data.accessToken;

    // Test protected route
    console.log('\n3. Testing protected route...');
    const protectedResponse = await axios.get(`${BASE_URL}/service-requests`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Protected route access successful!');
    console.log(`Service requests: ${protectedResponse.data.length} found`);

    // Test projects route
    console.log('\n4. Testing projects route...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Projects route access successful!');
    console.log(`Projects: ${projectsResponse.data.length} found`);
  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full response:', error.response?.data);
  }
}

debugAuth();

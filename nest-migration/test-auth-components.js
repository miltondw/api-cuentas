const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testAuthFlow() {
  console.log('🔍 Testing authentication flow directly...\n');

  try {
    // 1. Test database connection and user lookup
    console.log('1. Testing database connection and user lookup...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    const [users] = await connection.execute(
      'SELECT usuario_id as id, name, email, role FROM usuarios WHERE email = ?',
      ['milton@ingeocimyc.com'],
    );

    if (users.length === 0) {
      console.log('❌ User not found in database');
      return;
    }

    const user = users[0];
    console.log('✅ User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // 2. Test JWT token generation
    console.log('\n2. Testing JWT token generation...');
    const payload = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });
    console.log('✅ JWT token generated:', token.substring(0, 50) + '...');

    // 3. Test JWT token verification
    console.log('\n3. Testing JWT token verification...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT token verified:', {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString(),
    });

    // 4. Test user validation again with decoded email
    console.log('\n4. Testing user re-validation with decoded email...');
    const [revalidatedUsers] = await connection.execute(
      'SELECT usuario_id as id, name, email, role FROM usuarios WHERE email = ?',
      [decoded.email],
    );

    if (revalidatedUsers.length > 0) {
      console.log('✅ User re-validation successful');
      console.log('✅ All authentication components working correctly!');

      console.log('\n📋 Summary:');
      console.log('- Database connection: ✅ Working');
      console.log('- User lookup: ✅ Working');
      console.log('- JWT generation: ✅ Working');
      console.log('- JWT verification: ✅ Working');
      console.log('- User re-validation: ✅ Working');

      console.log('\n🎯 Issue Analysis:');
      console.log(
        'Since all components work individually, the issue is likely:',
      );
      console.log('1. TypeORM configuration or entity mapping');
      console.log('2. Guard execution order');
      console.log('3. Middleware interference');
      console.log('4. Request parsing issues');
    } else {
      console.log('❌ User re-validation failed');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

testAuthFlow();

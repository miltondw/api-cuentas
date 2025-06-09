import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../src/modules/auth/entities/user.entity';
import { AuthService } from '../src/modules/auth/auth.service';

async function testJWTValidation() {
  console.log('🔍 Testing JWT validation without server...\n');

  // Setup database connection
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection successful');

    // Setup JWT service
    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    });

    // Setup auth service
    const userRepository = dataSource.getRepository(User);
    const authService = new AuthService(userRepository, jwtService);

    // Test user lookup
    console.log('\n1. Testing user lookup...');
    const user = await authService.validateUser('milton@ingeocimyc.com');

    if (user) {
      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      // Test JWT token generation
      console.log('\n2. Testing JWT token generation...');
      const payload = {
        sub: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const token = jwtService.sign(payload);
      console.log('✅ JWT token generated:', token.substring(0, 50) + '...');

      // Test JWT token verification
      console.log('\n3. Testing JWT token verification...');
      const decoded = jwtService.verify(token);
      console.log('✅ JWT token verified:', {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000).toISOString(),
      });

      // Test user validation with token payload
      console.log('\n4. Testing user validation with token payload...');
      const validatedUser = await authService.validateUser(decoded.email);

      if (validatedUser) {
        console.log('✅ User validation successful with token payload');
        console.log('✅ All JWT authentication tests passed!');
      } else {
        console.log('❌ User validation failed with token payload');
      }
    } else {
      console.log('❌ User not found - this is the authentication issue!');
    }
  } catch (error) {
    console.error('❌ Error occurred:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Load environment variables
require('dotenv').config();
testJWTValidation();

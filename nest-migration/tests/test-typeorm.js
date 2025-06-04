const { DataSource } = require('typeorm');
require('dotenv').config();

async function testTypeORM() {
  console.log('🔍 Testing TypeORM configuration...\n');

  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: ['src/**/*.entity{.ts,.js}'],
    synchronize: false,
    logging: true,
  });

  try {
    console.log('1. Initializing TypeORM DataSource...');
    await dataSource.initialize();
    console.log('✅ TypeORM DataSource initialized successfully');

    console.log('\n2. Testing raw query...');
    const rawResult = await dataSource.query(
      'SELECT usuario_id as id, name, email, role FROM usuarios WHERE email = ?',
      ['milton@ingeocimyc.com'],
    );
    console.log('✅ Raw query result:', rawResult);

    console.log('\n3. Testing entity metadata...');
    const userMetadata = dataSource.getMetadata('User');
    if (userMetadata) {
      console.log('✅ User entity metadata found:', {
        tableName: userMetadata.tableName,
        columns: userMetadata.columns.map(col => ({
          propertyName: col.propertyName,
          databaseName: col.databaseName,
        })),
      });
    } else {
      console.log('❌ User entity metadata not found');
    }

    console.log('\n4. Testing repository...');
    try {
      const userRepository = dataSource.getRepository('User');
      console.log('✅ User repository created');

      const user = await userRepository.findOne({
        where: { email: 'milton@ingeocimyc.com' },
      });

      if (user) {
        console.log('✅ User found via repository:', {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        });
      } else {
        console.log('❌ User not found via repository');
      }
    } catch (repoError) {
      console.error('❌ Repository error:', repoError.message);
    }
  } catch (error) {
    console.error('❌ TypeORM error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

testTypeORM();

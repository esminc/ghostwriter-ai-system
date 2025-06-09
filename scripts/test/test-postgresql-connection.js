const { Client } = require('pg');
require('dotenv').config({ path: '.env.render' });

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 PostgreSQL接続テスト開始...');
    
    await client.connect();
    console.log('✅ 接続成功！');
    
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQLバージョン:', result.rows[0].version);
    
    const timeResult = await client.query('SELECT NOW() as current_time');
    console.log('⏰ サーバー時刻:', timeResult.rows[0].current_time);
    
    console.log('🎉 接続テスト完了！');
    
  } catch (error) {
    console.error('❌ 接続エラー:', error.message);
    console.error('🔍 詳細:', error);
  } finally {
    await client.end();
  }
}

testConnection();
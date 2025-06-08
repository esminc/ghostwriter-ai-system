#!/usr/bin/env node

// PostgreSQL対応後のSlack Bot テスト
require('dotenv').config();

const DatabaseConnection = require('../../src/database/connection');
const User = require('../../src/database/models/user');

async function testPostgreSQLModels() {
  console.log('🧪 PostgreSQL対応後のデータベースモデルテスト開始...');
  
  const dbConnection = new DatabaseConnection();
  
  try {
    // データベース接続テスト
    await dbConnection.connect();
    console.log('✅ PostgreSQL接続成功');
    
    // ユーザー検索テスト
    console.log('\n🔍 ユーザー検索テスト...');
    const testUser = await User.findBySlackId('U040L7EJC0Z');
    console.log('ユーザー取得結果:', testUser ? '✅ 成功' : '❌ 失敗');
    
    if (testUser) {
      console.log('ユーザー情報:', {
        id: testUser.id,
        slack_user_id: testUser.slack_user_id,
        slack_username: testUser.slack_username
      });
    }
    
    // ユーザー作成・更新テスト
    console.log('\n🔄 ユーザー作成・更新テスト...');
    const testUserData = {
      slack_user_id: 'TEST_USER_123',
      username: 'test-user',
      display_name: 'Test User'
    };
    
    const createResult = await User.createOrUpdate(testUserData);
    console.log('ユーザー作成・更新結果:', createResult ? '✅ 成功' : '❌ 失敗');
    
    // ユーザー数カウントテスト
    console.log('\n📊 ユーザー数カウントテスト...');
    const userCount = await User.count();
    console.log('総ユーザー数:', userCount);
    
    console.log('\n🎉 全てのテストが完了しました！');
    
  } catch (error) {
    console.error('❌ テストエラー:', error.message);
    console.error('エラー詳細:', error);
  } finally {
    await dbConnection.close();
  }
}

// メイン実行
if (require.main === module) {
  testPostgreSQLModels().catch(error => {
    console.error('❌ テスト実行エラー:', error);
    process.exit(1);
  });
}

module.exports = { testPostgreSQLModels };

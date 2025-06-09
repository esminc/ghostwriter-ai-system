const DatabaseConnection = require('./src/database/connection');
require('dotenv').config();

async function testPostgreSQLConnection() {
  console.log('🔍 PostgreSQL接続テスト開始...');
  console.log(`📊 DB_TYPE: ${process.env.DB_TYPE}`);
  
  const db = new DatabaseConnection();
  
  try {
    await db.connect();
    console.log('✅ PostgreSQL接続成功！');
    
    // データ件数確認
    const tables = ['users', 'profiles', 'ghostwrite_history', 'cache'];
    
    console.log('\n📊 データ件数確認:');
    for (const table of tables) {
      const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result[0]?.count || 0;
      console.log(`   ${table}: ${count}件`);
    }
    
    // 最新のghostwrite_historyを1件取得してテスト
    console.log('\n📝 最新の代筆履歴データ:');
    const latestHistory = await db.query(
      'SELECT target_user_id, esa_post_id, quality_rating, created_at FROM ghostwrite_history ORDER BY created_at DESC LIMIT 1'
    );
    
    if (latestHistory.length > 0) {
      const latest = latestHistory[0];
      console.log(`   対象ユーザー: ${latest.target_user_id}`);
      console.log(`   ESA投稿ID: ${latest.esa_post_id}`);
      console.log(`   品質評価: ${latest.quality_rating}`);
      console.log(`   作成日時: ${latest.created_at}`);
    }
    
    // プロフィールデータ確認
    console.log('\n👤 プロフィールデータ確認:');
    const profiles = await db.query('SELECT screen_name, article_count, analysis_quality FROM profiles');
    profiles.forEach(profile => {
      console.log(`   ${profile.screen_name}: 分析記事${profile.article_count}件, 品質${profile.analysis_quality}/5`);
    });
    
    console.log('\n🎉 全ての接続テスト完了！');
    console.log('✅ GhostWriterはPostgreSQLで正常動作準備完了です！');
    
  } catch (error) {
    console.error('❌ 接続テストエラー:', error.message);
  } finally {
    await db.close();
  }
}

testPostgreSQLConnection();
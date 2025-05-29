// 既存データのAI使用情報更新スクリプト
require('dotenv').config();
const database = require('./src/database/init');

async function updateExistingData() {
  console.log('📝 === 既存データAI使用情報更新 ===\n');
  
  try {
    const db = database.getDb();
    
    // 現在の状況確認
    console.log('📊 更新前の状況確認...');
    const beforeStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_count,
          COUNT(CASE WHEN ai_analysis_used = 1 THEN 1 END) as ai_analysis_count,
          COUNT(CASE WHEN ai_generation_used = 1 THEN 1 END) as ai_generation_count
        FROM ghostwrite_history
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });
    
    console.log(`   総履歴数: ${beforeStats.total_count}件`);
    console.log(`   AI分析使用: ${beforeStats.ai_analysis_count}件`);
    console.log(`   AI生成使用: ${beforeStats.ai_generation_count}件`);
    
    // 最新の履歴（最も確実にAI機能を使用している）を特定
    console.log('\n🔍 最新履歴の詳細確認...');
    const latestRecords = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, created_at, ai_analysis_used, ai_generation_used
        FROM ghostwrite_history 
        ORDER BY created_at DESC 
        LIMIT 3
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('最新3件の詳細:');
    latestRecords.forEach(record => {
      console.log(`   ID ${record.id}: 作成日時=${record.created_at}, AI分析=${record.ai_analysis_used}, AI生成=${record.ai_generation_used}`);
    });
    
    // AI統合版実装後の履歴を特定（2025-05-26 08:00以降と仮定）
    const aiIntegrationDate = '2025-05-26 08:00:00';
    
    console.log(`\\n🤖 AI統合版実装後の履歴更新（${aiIntegrationDate}以降）...`);
    
    // AI統合版以降の履歴をAI使用ありに更新
    const updateResult1 = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE ghostwrite_history 
        SET ai_analysis_used = 1, ai_generation_used = 1
        WHERE created_at >= ? AND (ai_analysis_used IS NULL OR ai_analysis_used = 0)
      `, [aiIntegrationDate], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
    
    console.log(`   AI統合版履歴更新: ${updateResult1}件`);
    
    // それ以前の履歴は従来方式として更新
    const updateResult2 = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE ghostwrite_history 
        SET ai_analysis_used = 0, ai_generation_used = 0
        WHERE created_at < ? AND (ai_analysis_used IS NULL OR ai_generation_used IS NULL)
      `, [aiIntegrationDate], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
    
    console.log(`   従来版履歴更新: ${updateResult2}件`);
    
    // 更新後の状況確認
    console.log('\\n📊 更新後の状況確認...');
    const afterStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_count,
          COUNT(CASE WHEN ai_analysis_used = 1 THEN 1 END) as ai_analysis_count,
          COUNT(CASE WHEN ai_generation_used = 1 THEN 1 END) as ai_generation_count,
          COUNT(CASE WHEN ai_analysis_used IS NULL OR ai_generation_used IS NULL THEN 1 END) as null_count
        FROM ghostwrite_history
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });
    
    console.log(`   総履歴数: ${afterStats.total_count}件`);
    console.log(`   AI分析使用: ${afterStats.ai_analysis_count}件`);
    console.log(`   AI生成使用: ${afterStats.ai_generation_count}件`);
    console.log(`   未設定: ${afterStats.null_count}件`);
    
    // 詳細確認
    console.log('\\n📋 更新後の最新3件:');
    const updatedRecords = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, created_at, ai_analysis_used, ai_generation_used
        FROM ghostwrite_history 
        ORDER BY created_at DESC 
        LIMIT 3
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    updatedRecords.forEach(record => {
      const aiAnalysisText = record.ai_analysis_used === 1 ? '✅ 使用' : '❌ 未使用';
      const aiGenerationText = record.ai_generation_used === 1 ? '✅ 使用' : '❌ 未使用';
      console.log(`   ID ${record.id}: AI分析=${aiAnalysisText}, AI生成=${aiGenerationText} (${record.created_at})`);
    });
    
    console.log('\\n🎉 既存データ更新完了！');
    console.log('');
    console.log('📈 更新結果:');
    console.log(`   ✅ AI統合版履歴: ${updateResult1}件 → AI使用ありに更新`);
    console.log(`   📝 従来版履歴: ${updateResult2}件 → AI未使用に設定`);
    console.log(`   🤖 AI生成履歴: ${afterStats.ai_generation_count}件（統計で正しく表示されます）`);
    console.log('');
    console.log('🚀 次のステップ:');
    console.log('   npm run test:ai  # AI統計が正しく表示されることを確認');
    
  } catch (error) {
    console.error('❌ データ更新エラー:', error.message);
  } finally {
    // データベース接続クローズ
    setTimeout(() => {
      console.log('\\n🔄 データベース接続をクローズ中...');
      database.close();
      process.exit(0);
    }, 1000);
  }
}

console.log('📝 既存データAI使用情報更新開始...');
console.log('このスクリプトは既存の履歴データにAI使用情報を設定します。');
console.log('');

updateExistingData();

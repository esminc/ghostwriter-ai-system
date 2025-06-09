// データベーススキーマ確認スクリプト
require('dotenv').config();
const database = require('./src/database/init');

async function checkDatabaseSchema() {
  console.log('🔍 === データベーススキーマ確認 ===\n');
  
  try {
    // ghostwrite_historyテーブルのスキーマ確認
    console.log('📋 ghostwrite_historyテーブル構造確認...');
    
    const db = database.getDb();
    
    // テーブル情報取得
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(ghostwrite_history)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📊 現在のカラム構成:');
    tableInfo.forEach(column => {
      console.log(`   - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
    });
    
    // AI統合カラムの存在確認
    const hasAiAnalysisUsed = tableInfo.some(col => col.name === 'ai_analysis_used');
    const hasAiGenerationUsed = tableInfo.some(col => col.name === 'ai_generation_used');
    
    console.log('\n🤖 AI統合カラム確認:');
    console.log(`   ai_analysis_used: ${hasAiAnalysisUsed ? '✅ 存在' : '❌ 不足'}`);
    console.log(`   ai_generation_used: ${hasAiGenerationUsed ? '✅ 存在' : '❌ 不足'}`);
    
    // 既存データ確認
    console.log('\n📝 既存データ確認...');
    const historyCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM ghostwrite_history", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    console.log(`   履歴レコード数: ${historyCount}件`);
    
    if (historyCount > 0) {
      // サンプルデータ取得
      const sampleData = await new Promise((resolve, reject) => {
        db.all("SELECT id, ai_analysis_used, ai_generation_used, created_at FROM ghostwrite_history ORDER BY created_at DESC LIMIT 3", (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      console.log('\n📋 最新3件の AI 使用状況:');
      sampleData.forEach(record => {
        console.log(`   ID ${record.id}: AI分析=${record.ai_analysis_used || '未設定'}, AI生成=${record.ai_generation_used || '未設定'} (${record.created_at})`);
      });
    }
    
    // プロフィールテーブルも確認
    console.log('\n📋 profilesテーブル構造確認...');
    const profileTableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(profiles)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const hasProfileAiAnalysisUsed = profileTableInfo.some(col => col.name === 'ai_analysis_used');
    const hasAnalysisQuality = profileTableInfo.some(col => col.name === 'analysis_quality');
    
    console.log('🤖 プロフィールAI統合カラム確認:');
    console.log(`   ai_analysis_used: ${hasProfileAiAnalysisUsed ? '✅ 存在' : '❌ 不足'}`);
    console.log(`   analysis_quality: ${hasAnalysisQuality ? '✅ 存在' : '❌ 不足'}`);
    
    // 推奨アクション
    console.log('\n💡 推奨アクション:');
    
    if (!hasAiAnalysisUsed || !hasAiGenerationUsed) {
      console.log('🔧 必要な修正:');
      console.log('   1. データベース初期化の再実行');
      console.log('   2. AI統合カラムの追加');
      console.log('   3. 既存データの更新（必要に応じて）');
      console.log('\n📝 実行コマンド:');
      console.log('   node db-schema-fix.js  # 修正スクリプト実行');
    } else if (historyCount > 0) {
      // 既存データのAI情報が未設定の場合
      const needsUpdate = sampleData.some(record => 
        record.ai_analysis_used === null || record.ai_generation_used === null
      );
      
      if (needsUpdate) {
        console.log('📝 既存データの更新が必要:');
        console.log('   既存の履歴レコードにAI使用情報を設定');
        console.log('\n📝 実行コマンド:');
        console.log('   node update-existing-data.js  # データ更新スクリプト');
      } else {
        console.log('✅ データベース構造は正常です');
        console.log('   すぐにテストを実行できます');
      }
    } else {
      console.log('✅ データベース構造は正常です');
      console.log('   新規データから正しく記録されます');
    }
    
  } catch (error) {
    console.error('❌ スキーマチェックエラー:', error.message);
  } finally {
    // データベース接続クローズ
    setTimeout(() => {
      console.log('\n🔄 データベース接続をクローズ中...');
      database.close();
      process.exit(0);
    }, 1000);
  }
}

console.log('🔍 データベーススキーマチェック開始...');
console.log('このスクリプトはデータベースの構造を確認します。');
console.log('');

checkDatabaseSchema();

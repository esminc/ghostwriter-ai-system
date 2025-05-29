require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  console.log('🔄 データベースリセット開始...');
  
  const dbPath = path.join(__dirname, 'database', 'ghostwriter.db');
  
  // 既存のデータベースファイルを削除
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ 既存のデータベースファイルを削除しました');
  }
  
  // 新しいデータベースを初期化
  const database = require('./database/init');
  
  // 少し待機してからテスト
  setTimeout(async () => {
    console.log('🔄 データベース再初期化完了、テスト実行...');
    
    const User = require('./database/models/user');
    const Profile = require('./database/models/profile');
    const GhostwriteHistory = require('./database/models/history');
    
    try {
      // テストユーザー作成
      const testUser = await User.create({
        slack_user_id: 'reset_test_user',
        slack_username: 'reset-test'
      });
      console.log('✅ テストユーザー作成成功:', testUser.id);
      
      // 統計テスト
      const userCount = await User.count();
      const profileCount = await Profile.count();
      const historyCount = await GhostwriteHistory.count();
      
      console.log('📊 データベース統計:');
      console.log(`   👥 ユーザー数: ${userCount}`);
      console.log(`   📋 プロフィール数: ${profileCount}`);
      console.log(`   📝 履歴数: ${historyCount}`);
      
      console.log('🎉 データベースリセット完了！');
      console.log('💡 再度 npm run test:ai を実行してください');
      
    } catch (error) {
      console.error('❌ データベーステストエラー:', error.message);
    } finally {
      database.close();
      process.exit(0);
    }
  }, 2000);
}

console.log('🚨 === データベースリセット ===');
console.log('このスクリプトは既存のデータベースを削除して再作成します。');
console.log('⚠️  既存のデータはすべて失われます。');
console.log('');
console.log('🛑 中断したい場合は今すぐCtrl+Cを押してください');
console.log('3秒後に実行開始...');

setTimeout(() => {
  resetDatabase();
}, 3000);

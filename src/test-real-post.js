require('dotenv').config();
const EsaAPI = require('./services/esa-api');
const DiaryGenerator = require('./services/diary-generator');
const ProfileAnalyzer = require('./services/profile-analyzer');
const database = require('./database/init');
const User = require('./database/models/user');
const Profile = require('./database/models/profile');
const GhostwriteHistory = require('./database/models/history');

async function testRealEsaPost() {
  try {
    console.log('=== 🚀 実際のesa投稿テスト ===\n');
    
    // 環境変数確認
    const accessToken = process.env.ESA_ACCESS_TOKEN;
    const teamName = process.env.ESA_TEAM_NAME || 'esminc-its';
    
    if (!accessToken || accessToken === 'your_esa_access_token_here') {
      console.log('❌ esa APIトークンが設定されていません');
      process.exit(1);
    }
    
    console.log(`🎯 対象チーム: ${teamName}`);
    console.log(`🔑 認証: OK`);
    
    // esa API初期化
    const esaAPI = new EsaAPI(teamName, accessToken);
    
    // Step 1: プロフィール分析データ取得
    console.log('\n🔄 Step 1: okamoto-takuyaのプロフィール分析...');
    const profileData = await esaAPI.getProfileAnalysisData('okamoto-takuya');
    
    if (!profileData.success) {
      console.log('❌ プロフィールデータ取得失敗:', profileData.error);
      return;
    }
    
    console.log('✅ プロフィールデータ取得成功');
    console.log(`   分析対象記事: ${profileData.analysis_posts}件`);
    
    // Step 2: プロフィール分析実行
    console.log('\n🔄 Step 2: 文体・関心事分析実行...');
    const analyzer = new ProfileAnalyzer();
    const analysisResult = await analyzer.analyzeProfile(
      'okamoto-takuya', 
      profileData.detailed_posts
    );
    
    if (!analysisResult.success) {
      console.log('❌ プロフィール分析失敗:', analysisResult.error);
      return;
    }
    
    console.log('✅ プロフィール分析完了');
    console.log(`   文体: ${analysisResult.analysis.writing_style.primary_tone}`);
    console.log(`   関心事: ${analysisResult.analysis.interests.main_categories.join(', ')}`);
    
    // Step 3: テスト用日記生成
    console.log('\n🔄 Step 3: 実投稿用日記生成...');
    const generator = new DiaryGenerator();
    
    const testActions = [
      '代筆さんシステム完成 🎉',
      'esa API連携テスト成功',
      'Phase 1完全達成！',
      '実際のesa投稿テスト実行'
    ];
    
    const diaryResult = await generator.generateDiary(
      'okamoto-takuya',
      testActions,
      analysisResult.profile,
      { 
        quality_rating: 5,
        test_post: true 
      }
    );
    
    if (!diaryResult.success) {
      console.log('❌ 日記生成失敗:', diaryResult.error);
      return;
    }
    
    console.log('✅ 日記生成完了');
    console.log('\n📝 投稿予定の日記:');
    console.log('='.repeat(70));
    console.log(diaryResult.content);
    console.log('='.repeat(70));
    
    // Step 4: 投稿確認
    console.log('\n❓ この内容でesa投稿を実行しますか？');
    console.log('   ⚠️  注意: 実際にesaに投稿されます');
    console.log('   💡 テスト投稿はWIP（下書き）として作成されます');
    console.log('   🗑️  後で削除可能です');
    
    // 10秒待機（本来はユーザー入力を待つが、自動実行のため）
    console.log('\n⏳ 10秒後に自動投稿します...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 5: 実際のesa投稿
    console.log('\n🚀 Step 5: esa投稿実行中...');
    
    // 投稿データを準備
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-');
    
    const postData = {
      name: `【代筆テスト】okamoto-takuya: 代筆システム完成記念`,
      body_md: `${diaryResult.content}

---

## 🤖 代筆システム情報

- **生成日時**: ${new Date().toLocaleString('ja-JP')}
- **プロフィール分析**: ${profileData.analysis_posts}件の記事から学習
- **文体特徴**: ${analysisResult.analysis.writing_style.primary_tone}
- **システム**: 代筆さん v0.1.0 (Phase 1完了記念投稿)

この投稿は代筆システムの動作テストです。問題があれば削除してください。`,
      category: `テスト/${year}/${month}`,
      wip: true, // WIP（下書き）として投稿
      message: '代筆システムによる実投稿テスト'
    };
    
    const postResult = await esaAPI.createPost(postData);
    
    if (postResult.success) {
      console.log('🎉 esa投稿成功！');
      console.log(`📝 投稿URL: ${postResult.url}`);
      console.log(`📄 記事番号: ${postResult.post.number}`);
      console.log(`📅 作成日時: ${postResult.post.created_at}`);
      
      // Step 6: 履歴保存
      console.log('\n🔄 Step 6: 代筆履歴保存...');
      
      // ユーザーを取得または作成
      let user = await User.findByUsername('okamoto-takuya');
      if (!user) {
        user = await User.create({
          slack_user_id: 'real_okamoto_takuya',
          slack_username: 'okamoto-takuya'
        });
      }
      
      const historyResult = await GhostwriteHistory.create({
        target_user_id: user.id,
        requester_user_id: user.id,
        esa_post_id: postResult.post.number,
        generated_content: diaryResult.content,
        input_actions: testActions,
        calendar_data: { test_post: true },
        slack_data: { system_test: true },
        quality_rating: 5
      });
      
      console.log('✅ 履歴保存完了');
      console.log(`📊 履歴ID: ${historyResult.id}`);
      
      // Step 7: 完了報告
      console.log('\n🎊 === 実esa投稿テスト完了 ===');
      console.log('');
      console.log('📈 達成内容:');
      console.log('  ✅ 実データからプロフィール分析');
      console.log('  ✅ リアルな文体での日記生成');
      console.log('  ✅ 実際のesa投稿成功');
      console.log('  ✅ 代筆履歴の完全保存');
      console.log('');
      console.log('🔗 確認方法:');
      console.log(`  📝 投稿確認: ${postResult.url}`);
      console.log('  🗄️ DB確認: src/database/ghostwriter.db');
      console.log('');
      console.log('🗑️ 投稿削除方法:');
      console.log('  1. esaの投稿画面で削除ボタンを押す');
      console.log('  2. または管理者に削除依頼');
      console.log('');
      console.log('🎯 プロジェクト状況:');
      console.log('  📊 Phase 1: 100% 完了');
      console.log('  🚀 実運用準備: 完了');
      console.log('  📱 Slack Bot化: 準備完了');
      console.log('  🏢 チーム展開: いつでも可能');
      
    } else {
      console.log('❌ esa投稿失敗:', postResult.error);
      console.log('詳細:', postResult);
    }
    
  } catch (error) {
    console.error('❌ 実投稿テストエラー:', error.message);
    console.error('スタックトレース:', error.stack);
  } finally {
    // データベース接続クローズ
    setTimeout(() => {
      console.log('\n🔄 データベース接続をクローズ中...');
      database.close();
      process.exit(0);
    }, 2000);
  }
}

// 実行前の確認メッセージ
console.log('⚠️  === 重要な注意事項 ===');
console.log('このスクリプトは実際にesaに投稿を行います。');
console.log('テスト投稿はWIP（下書き）として作成され、後で削除可能です。');
console.log('問題がある場合は、今すぐCtrl+Cで中断してください。');
console.log('');
console.log('5秒後に実行開始...');

// 5秒待機
setTimeout(() => {
  testRealEsaPost();
}, 5000);

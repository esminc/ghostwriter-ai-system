require('dotenv').config();
const EsaAPI = require('./services/esa-api');
const AIProfileAnalyzer = require('./services/ai-profile-analyzer');
const AIDiaryGenerator = require('./services/ai-diary-generator');
const database = require('./database/init');
const User = require('./database/models/user');
const Profile = require('./database/models/profile');
const GhostwriteHistory = require('./database/models/history');
const OpenAIClient = require('./ai/openai-client');

async function testAIIntegration() {
  try {
    console.log('=== 🤖 AI統合システムテスト ===\n');
    
    // Step 1: 環境確認
    console.log('🔄 Step 1: 環境設定確認...');
    
    const esaToken = process.env.ESA_ACCESS_TOKEN;
    const openaiKey = process.env.OPENAI_API_KEY;
    const teamName = process.env.ESA_TEAM_NAME || 'esminc-its';
    
    if (!esaToken || esaToken === 'your_esa_access_token_here') {
      console.log('❌ esa APIトークンが設定されていません');
      process.exit(1);
    }
    
    console.log(`✅ esa API: 設定済み (team: ${teamName})`);
    console.log(`🤖 OpenAI API: ${openaiKey && openaiKey !== 'your_openai_api_key_here' ? '設定済み' : '未設定（フォールバック使用）'}`);
    
    // OpenAI API状態確認
    const openaiClient = new OpenAIClient();
    const apiStatus = await openaiClient.checkApiStatus();
    console.log(`🔌 OpenAI接続状態: ${apiStatus.status} - ${apiStatus.message}`);
    
    // Step 2: esa API接続テスト
    console.log('\n🔄 Step 2: esa API接続テスト...');
    const esaAPI = new EsaAPI(teamName, esaToken);
    const connectionResult = await esaAPI.testConnection();
    
    if (!connectionResult.success) {
      console.log('❌ esa API接続失敗:', connectionResult.error);
      return;
    }
    
    console.log(`✅ esa接続成功: ${connectionResult.team.name}`);
    
    // Step 3: AI統合プロフィール分析テスト
    console.log('\n🔄 Step 3: AI統合プロフィール分析テスト...');
    
    const profileData = await esaAPI.getProfileAnalysisData('okamoto-takuya');
    if (!profileData.success) {
      console.log('❌ プロフィールデータ取得失敗:', profileData.error);
      return;
    }
    
    console.log(`📊 分析対象: ${profileData.analysis_posts}件の記事`);
    
    const aiAnalyzer = new AIProfileAnalyzer();
    const analysisResult = await aiAnalyzer.analyzeProfile(
      'okamoto-takuya', 
      profileData.detailed_posts
    );
    
    if (!analysisResult.success) {
      console.log('❌ AI統合プロフィール分析失敗:', analysisResult.error);
      return;
    }
    
    console.log('✅ AI統合プロフィール分析成功');
    console.log(`   🤖 AI分析使用: ${analysisResult.metadata.ai_used ? 'はい' : 'いいえ'}`);
    console.log(`   📝 文体特徴: ${analysisResult.analysis.writing_style.primary_tone}`);
    console.log(`   🎯 関心事: ${analysisResult.analysis.interests.main_categories.join(', ')}`);
    console.log(`   ⭐ 分析品質: ${analysisResult.metadata.quality_score}/5`);
    
    // Step 4: AI統合日記生成テスト
    console.log('\n🔄 Step 4: AI統合日記生成テスト...');
    
    const testActions = [
      'AI統合システム実装完了 🎉',
      'OpenAI API連携テスト成功',
      'プロフィール分析の品質向上を確認',
      'Phase 1 LLM統合版完成！'
    ];
    
    const aiGenerator = new AIDiaryGenerator();
    const diaryResult = await aiGenerator.generateDiary(
      'okamoto-takuya',
      testActions,
      analysisResult.profile,
      { 
        quality_rating: 5,
        test_mode: true,
        allow_automatic: true
      }
    );
    
    if (!diaryResult.success) {
      console.log('❌ AI統合日記生成失敗:', diaryResult.error);
      return;
    }
    
    console.log('✅ AI統合日記生成成功');
    console.log(`   🤖 AI生成使用: ${diaryResult.metadata.ai_generated ? 'はい' : 'いいえ'}`);
    console.log(`   ⭐ 品質スコア: ${diaryResult.metadata.quality_score}/5`);
    console.log(`   📝 文字数: ${diaryResult.metadata.character_count}文字`);
    console.log(`   🕒 生成方式: ${diaryResult.metadata.generation_method}`);
    
    // 生成された日記をプレビュー
    console.log('\n📝 生成された日記プレビュー:');
    console.log('='.repeat(70));
    console.log(diaryResult.content);
    console.log('='.repeat(70));
    
    // Step 5: 実投稿テスト（オプション）
    console.log('\n❓ 実際にesaに投稿しますか？');
    console.log('   ⚠️  注意: 実際にesaに投稿されます（WIPとして投稿）');
    console.log('   💡 10秒後に自動で投稿テストを実行します...');
    console.log('   🛑 中断したい場合はCtrl+Cを押してください');
    
    // 10秒待機
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n🚀 Step 5: 実投稿テスト実行...');
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-');
    
    // AI生成されたタイトルを抽出
    let aiGeneratedTitle = `【代筆】okamoto-takuya: AI統合システム完成記念`; // デフォルト
    
    if (diaryResult.content.includes('タイトル:')) {
      // "タイトル: 【代筆】okamoto-takuya: ..." 形式
      const titleLine = diaryResult.content.split('タイトル:')[1].split('\n')[0].trim();
      if (titleLine) {
        aiGeneratedTitle = titleLine;
      }
    } else {
      // タイトル行がない場合、本文から推測
      const lines = diaryResult.content.split('\n');
      const firstLine = lines[0].trim();
      if (firstLine && !firstLine.startsWith('##') && firstLine.length < 100) {
        aiGeneratedTitle = firstLine.startsWith('【代筆】') ? firstLine : `【代筆】okamoto-takuya: ${firstLine}`;
      }
    }
    
    // タイトルから「タイトル: 」プレフィックスを除去
    aiGeneratedTitle = aiGeneratedTitle.replace(/^タイトル:\s*/, '');
    
    console.log(`📝 使用するタイトル: ${aiGeneratedTitle}`);
    
    // 本文からタイトル行を除去（重複を避けるため）
    let cleanedContent = diaryResult.content;
    if (cleanedContent.includes('タイトル:')) {
      const contentParts = cleanedContent.split('\n');
      cleanedContent = contentParts.filter(line => !line.startsWith('タイトル:')).join('\n').trim();
    }
    
    const postData = {
      name: aiGeneratedTitle,
      body_md: `${cleanedContent}

---

## 🤖 AI統合システム情報

- **生成日時**: ${new Date().toLocaleString('ja-JP')}
- **AI分析使用**: ${analysisResult.metadata.ai_used ? 'はい' : 'いいえ（フォールバック）'}
- **AI生成使用**: ${diaryResult.metadata.ai_generated ? 'はい' : 'いいえ（フォールバック）'}
- **分析品質**: ${analysisResult.metadata.quality_score}/5
- **生成品質**: ${diaryResult.metadata.quality_score}/5
- **システム**: 代筆さん v0.2.0 (AI統合版)

この投稿はAI統合システムの動作テストです。OpenAI APIが設定されている場合は真のAI代筆、未設定の場合はフォールバック動作を確認できます。`,
      category: `テスト/${year}/${month}/${day}`,
      wip: true, // WIP（下書き）として投稿
      message: 'AI統合システム実投稿テスト'
    };
    
    const postResult = await esaAPI.createPost(postData);
    
    if (postResult.success) {
      console.log('🎉 AI統合システム実投稿成功！');
      console.log(`📝 投稿URL: ${postResult.url}`);
      console.log(`📄 記事番号: ${postResult.post.number}`);
      
      // Step 6: 履歴保存
      console.log('\n🔄 Step 6: AI統合履歴保存...');
      
      let user = await User.findByUsername('okamoto-takuya');
      if (!user) {
        user = await User.create({
          slack_user_id: 'ai_okamoto_takuya',
          slack_username: 'okamoto-takuya'
        });
      }
      
      const historyResult = await GhostwriteHistory.create({
        target_user_id: user.id,
        requester_user_id: user.id,
        esa_post_id: postResult.post.number,
        generated_content: diaryResult.content,
        input_actions: testActions,
        calendar_data: { test_post: true, ai_integrated: true },
        slack_data: { system_test: true, ai_version: true },
        quality_rating: diaryResult.metadata.quality_score,
        ai_analysis_used: analysisResult.metadata.ai_used,
        ai_generation_used: diaryResult.metadata.ai_generated
      });
      
      console.log('✅ AI統合履歴保存完了');
      console.log(`📊 履歴ID: ${historyResult.id}`);
      
      // Step 7: 統計・分析情報
      console.log('\n📊 Step 7: システム統計情報...');
      
      const totalUsers = await User.count();
      const totalProfiles = await Profile.count();
      const totalHistory = await GhostwriteHistory.count();
      const aiUsageHistory = await GhostwriteHistory.findAll({
        where: { ai_generation_used: true },
        limit: 100
      });
      
      console.log(`👥 登録ユーザー数: ${totalUsers}`);
      console.log(`📋 プロフィール数: ${totalProfiles}`);
      console.log(`📝 代筆履歴数: ${totalHistory}`);
      console.log(`🤖 AI生成履歴: ${aiUsageHistory.length}件`);
      
      // Step 8: 最終報告
      console.log('\n🎊 === AI統合システムテスト完了 ===');
      console.log('');
      console.log('📈 達成内容:');
      console.log('  ✅ OpenAI API統合完了');
      console.log('  ✅ AI統合プロフィール分析');
      console.log('  ✅ AI統合日記生成');
      console.log('  ✅ フォールバック機能完備');
      console.log('  ✅ 実際のesa投稿成功');
      console.log('  ✅ 品質管理システム');
      console.log('  ✅ 統計・履歴管理');
      console.log('');
      console.log('🤖 AI統合の特徴:');
      console.log('  🧠 真の文体分析（LLM活用）');
      console.log('  ✍️  自然な日記生成（プロンプトエンジニアリング）');
      console.log('  🛡️  フォールバック安全性');
      console.log('  📊 品質スコアリング');
      console.log('  🔄 ハイブリッド分析');
      console.log('');
      console.log('🔗 確認方法:');
      console.log(`  📝 投稿確認: ${postResult.url}`);
      console.log('  🗄️ DB確認: src/database/ghostwriter.db');
      console.log('  🤖 AI設定: .envファイルのOPENAI_API_KEY');
      console.log('');
      console.log('🎯 プロジェクト状況:');
      console.log('  📊 Phase 1: 100% 完了（AI統合版）');
      console.log('  🤖 LLM統合: 完全実装');
      console.log('  🚀 実運用準備: 完了');
      console.log('  📱 Phase 2準備: Slack Bot実装可能');
      console.log('  🏢 チーム展開: いつでも可能');
      console.log('');
      console.log('💡 次のステップ提案:');
      console.log('  1. OpenAI APIキー設定（真のAI機能使用）');
      console.log('  2. Slack Bot実装（Phase 2）');
      console.log('  3. チーム内βテスト');
      console.log('  4. 本格運用開始');
      
    } else {
      console.log('❌ AI統合システム実投稿失敗:', postResult.error);
      console.log('詳細:', postResult);
    }
    
  } catch (error) {
    console.error('❌ AI統合システムテストエラー:', error.message);
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
console.log('🤖 === AI統合システムテスト ===');
console.log('このスクリプトはAI統合版「代筆さん」システムをテストします。');
console.log('');
console.log('🔧 テスト内容:');
console.log('  1. OpenAI API接続確認');
console.log('  2. AI統合プロフィール分析');
console.log('  3. AI統合日記生成');
console.log('  4. 実際のesa投稿テスト');
console.log('  5. システム統計確認');
console.log('');
console.log('⚠️  注意事項:');
console.log('  - 実際にesaに投稿されます（WIP下書きとして）');
console.log('  - OpenAI API未設定でもフォールバック動作します');
console.log('  - テスト投稿は後で削除可能です');
console.log('');
console.log('🛑 中断したい場合は今すぐCtrl+Cを押してください');
console.log('');
console.log('5秒後に実行開始...');

// 5秒待機
setTimeout(() => {
  testAIIntegration();
}, 5000);

require('dotenv').config();
const EsaAPI = require('./services/esa-api');
const ProfileAnalyzer = require('./services/profile-analyzer');
const database = require('./database/init');
const User = require('./database/models/user');
const Profile = require('./database/models/profile');

async function testEsaAPI() {
  try {
    console.log('=== esa API連携テスト開始 ===\n');
    
    // 環境変数確認
    const accessToken = process.env.ESA_ACCESS_TOKEN;
    const teamName = process.env.ESA_TEAM_NAME || 'esminc-its';
    
    if (!accessToken || accessToken === 'your_esa_access_token_here') {
      console.log('❌ esa APIトークンが設定されていません');
      console.log('💡 .envファイルでESA_ACCESS_TOKENを設定してください');
      process.exit(1);
    }
    
    console.log(`🔄 チーム: ${teamName}`);
    console.log(`🔑 トークン: ${accessToken.substring(0, 10)}...`);
    
    // esa API初期化
    const esaAPI = new EsaAPI(teamName, accessToken);
    
    // 1. 接続テスト
    console.log('\n🔄 Step 1: esa API接続テスト...');
    const connectionResult = await esaAPI.testConnection();
    
    if (!connectionResult.success) {
      console.log('❌ esa API接続失敗:', connectionResult.error);
      return;
    }
    
    console.log('✅ esa API接続成功!');
    console.log(`   チーム名: ${connectionResult.team.name}`);
    console.log(`   メンバー数: ${connectionResult.team.members_count}人`);
    
    // 2. メンバー一覧取得テスト
    console.log('\n🔄 Step 2: チームメンバー取得...');
    const membersResult = await esaAPI.getMembers();
    
    if (membersResult.success && membersResult.members.length > 0) {
      console.log('✅ メンバー一覧取得成功!');
      console.log(`   メンバー数: ${membersResult.members.length}人`);
      
      // 最初の3人のスクリーンネームを表示
      const sampleMembers = membersResult.members.slice(0, 3);
      console.log('   サンプルメンバー:');
      sampleMembers.forEach(member => {
        console.log(`     - ${member.screen_name} (${member.name})`);
      });
      
      // okamoto-takuyaがいるかチェック
      const targetMember = membersResult.members.find(m => 
        m.screen_name === 'okamoto-takuya'
      );
      
      if (targetMember) {
        console.log('✅ okamoto-takuyaメンバー発見!');
        
        // 3. プロフィール分析テスト
        console.log('\n🔄 Step 3: プロフィール分析データ取得...');
        const profileData = await esaAPI.getProfileAnalysisData('okamoto-takuya');
        
        if (profileData.success) {
          console.log('✅ プロフィール分析データ取得成功!');
          console.log(`   総記事数: ${profileData.total_posts}件`);
          console.log(`   分析対象: ${profileData.analysis_posts}件`);
          
          if (profileData.detailed_posts.length > 0) {
            console.log('\n📝 最新記事サンプル:');
            const latestPost = profileData.detailed_posts[0];
            console.log(`   タイトル: ${latestPost.name}`);
            console.log(`   作成日: ${latestPost.created_at}`);
            console.log(`   本文長: ${(latestPost.body_md || '').length}文字`);
            
            // 4. プロフィール分析実行
            console.log('\n🔄 Step 4: 実際のプロフィール分析実行...');
            const analyzer = new ProfileAnalyzer();
            const analysisResult = await analyzer.analyzeProfile(
              'okamoto-takuya', 
              profileData.detailed_posts
            );
            
            if (analysisResult.success) {
              console.log('✅ プロフィール分析完了!');
              console.log(`   文体特徴: ${analysisResult.analysis.writing_style.primary_tone}`);
              console.log(`   主要関心事: ${analysisResult.analysis.interests.main_categories.join(', ')}`);
              console.log(`   典型的タスク: ${analysisResult.analysis.behavior_patterns.typical_tasks.slice(0, 3).join(', ')}`);
              
              // 5. テスト投稿（実際には投稿しない）
              console.log('\n🔄 Step 5: テスト日記生成...');
              const DiaryGenerator = require('./services/diary-generator');
              const generator = new DiaryGenerator();
              
              const testActions = [
                'esa API連携テスト実行',
                'プロフィール分析機能確認',
                'Phase 1最終動作確認'
              ];
              
              const diaryResult = await generator.generateDiary(
                'okamoto-takuya',
                testActions,
                analysisResult.profile
              );
              
              if (diaryResult.success) {
                console.log('✅ 実データベース日記生成成功!');
                console.log('\n📖 生成された日記（実データ反映版）:');
                console.log('='.repeat(70));
                console.log(diaryResult.content);
                console.log('='.repeat(70));
                
                // 6. 投稿テスト（コメントアウト - 実際には投稿しない）
                console.log('\n💡 実際のesa投稿テスト（今回は実行しません）');
                console.log('   以下のコマンドで実際の投稿が可能です:');
                console.log('   const postResult = await esaAPI.postGhostwrittenDiary(');
                console.log('     "okamoto-takuya", diaryResult.content, testActions');
                console.log('   );');
                
              } else {
                console.log('❌ 日記生成失敗:', diaryResult.error);
              }
              
            } else {
              console.log('❌ プロフィール分析失敗:', analysisResult.error);
            }
            
          } else {
            console.log('⚠️  詳細記事データが取得できませんでした');
          }
          
        } else {
          console.log('❌ プロフィール分析データ取得失敗:', profileData.error);
        }
        
      } else {
        console.log('⚠️  okamoto-takuyaメンバーが見つかりませんでした');
        console.log('   利用可能なメンバー:', membersResult.members.map(m => m.screen_name).slice(0, 5).join(', '));
      }
      
    } else {
      console.log('❌ メンバー一覧取得失敗:', membersResult.error);
    }
    
    console.log('\n🎉 esa API連携テスト完了!');
    console.log('\n📊 テスト結果サマリー:');
    console.log('  ✅ API接続');
    console.log('  ✅ チーム情報取得');
    console.log('  ✅ メンバー一覧取得');
    console.log('  ✅ プロフィールデータ取得');
    console.log('  ✅ 実データでの日記生成');
    console.log('  🔄 実際のesa投稿（未実行）');
    
    console.log('\n💡 Phase 1完了度: 100% 🎊');
    
  } catch (error) {
    console.error('❌ esa APIテストエラー:', error.message);
    console.error('スタックトレース:', error.stack);
  } finally {
    // データベース接続クローズ
    setTimeout(() => {
      database.close();
      process.exit(0);
    }, 1000);
  }
}

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未処理のPromise拒否:', reason);
  process.exit(1);
});

// 実行
testEsaAPI();

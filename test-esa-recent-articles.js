// 最近のesa記事取得テスト（72時間制限確認）

require('dotenv').config();
const LLMDiaryGeneratorPhase53Unified = require('./src/mcp-integration/llm-diary-generator-phase53-unified');

async function testEsaRecentArticles() {
    console.log('🧪 最近のesa記事取得テスト開始');
    console.log('🎯 目標: 昨日の「行脚」「リファクタリング」「1on1」記事が取得される');
    
    const generator = new LLMDiaryGeneratorPhase53Unified();
    
    try {
        // 初期化
        await generator.initialize();
        
        // ユーザー固有のesa記事データ取得
        console.log('\n=== esa記事データ取得 ===');
        const esaData = await generator.getUserSpecificEsaData('okamoto-takuya');
        
        console.log(`📋 総記事数: ${esaData.posts?.length || 0}件`);
        
        // 記事内容抽出テスト
        console.log('\n=== 記事内容抽出 ===');
        const extractedContent = await generator.extractEsaContentStep2(esaData);
        
        console.log(`✅ 抽出結果:`);
        console.log(`   - トピック: ${extractedContent.recentTopics.length}個`);
        console.log(`   - 活動: ${extractedContent.recentActivities.length}個`);
        console.log(`   - キーワード: ${extractedContent.extractedKeywords.length}個`);
        console.log(`   - 72時間以内記事: ${extractedContent.todayRelevantContent.length}件`);
        
        // 72時間以内の記事詳細表示
        if (extractedContent.todayRelevantContent.length > 0) {
            console.log(`\n=== 72時間以内記事詳細 ===`);
            extractedContent.todayRelevantContent.forEach((post, index) => {
                console.log(`${index + 1}. "${post.title}"`);
                console.log(`   更新日: ${post.updated_at}`);
                console.log(`   カテゴリ: ${post.category}`);
                console.log(`   本文あり: ${post.hasBody ? 'Yes' : 'No'}`);
            });
        }
        
        // 抽出された活動内容の確認
        console.log(`\n=== 抽出された活動 ===`);
        extractedContent.recentActivities.forEach((activity, index) => {
            console.log(`${index + 1}. ${activity}`);
        });
        
        // 期待される活動の確認
        const expectedActivities = ['行脚', '1on1', 'リファクタリング', '会議'];
        console.log(`\n=== 期待活動の確認 ===`);
        expectedActivities.forEach(expected => {
            const found = extractedContent.recentActivities.some(activity => 
                activity.includes(expected)
            );
            console.log(`${expected}: ${found ? '✅ 検出済み' : '❌ 未検出'}`);
        });
        
        // キーワード確認
        console.log(`\n=== 抽出キーワード ===`);
        console.log(`${extractedContent.extractedKeywords.slice(0, 10).join(', ')}`);
        
        console.log('\n✅ 最近のesa記事取得テスト完了');
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error);
    }
}

// テスト実行
testEsaRecentArticles();
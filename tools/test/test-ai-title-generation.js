// AI統合タイトル生成テスト

require('dotenv').config();
const LLMDiaryGeneratorPhase53Unified = require('../../src/mcp-integration/llm-diary-generator-phase53-unified');

async function testAITitleGeneration() {
    console.log('🧪 AI統合タイトル生成テスト開始');
    console.log('🎯 目標: AIがタイトルと内容を同時生成する');
    
    const generator = new LLMDiaryGeneratorPhase53Unified();
    
    try {
        // 初期化
        await generator.initialize();
        
        // テスト用のコンテキストデータ
        const mockContextData = {
            esaData: {
                extractedKeywords: ['行脚', 'リファクタリング', '1on1', '会議', '開発'],
                recentActivities: ['行脚その１（山下さん）', 'リファクタリングの話し合い', '1on1実施'],
                todayRelevantContent: [
                    { title: '行脚とリファクタリング検討の日' },
                    { title: '1on1実施とチーム連携' }
                ]
            },
            slackData: {
                activityAnalysis: {
                    keyActivities: ['チーム連携', 'システム議論'],
                    topics: ['技術改善', 'プロジェクト進捗']
                },
                todayMessages: [],
                dataSource: 'real_slack_mcp_multi_channel'
            }
        };
        
        console.log('\n=== AI統合生成テスト ===');
        
        // AI統合生成の実行
        const aiResult = await generator.generateAdvancedDiary('okamoto-takuya', mockContextData);
        
        console.log(`✅ 生成結果:`);
        console.log(`   タイトル: "${aiResult.title}"`);
        console.log(`   内容長: ${aiResult.content.length}文字`);
        console.log(`   内容プレビュー: "${aiResult.content.substring(0, 100)}..."`);
        
        // タイトルの品質チェック
        console.log(`\n=== タイトル品質チェック ===`);
        const title = aiResult.title;
        
        const hasActivity = title.includes('行脚') || title.includes('1on1') || title.includes('リファクタリング') || title.includes('会議');
        const hasEmotion = title.includes('充実') || title.includes('満足') || title.includes('発見') || title.includes('成長');
        const isAppropriateLength = title.length >= 15 && title.length <= 40;
        const hasPrefix = title.includes('【代筆】');
        
        console.log(`✅ 品質チェック結果:`);
        console.log(`   活動反映: ${hasActivity ? '✅ あり' : '❌ なし'}`);
        console.log(`   感情表現: ${hasEmotion ? '✅ あり' : '❌ なし'}`);
        console.log(`   適切な長さ: ${isAppropriateLength ? '✅ OK' : '❌ NG'}`);
        console.log(`   代筆マーク: ${hasPrefix ? '✅ あり' : '❌ なし'}`);
        
        // 内容の品質チェック
        console.log(`\n=== 内容品質チェック ===`);
        const content = aiResult.content;
        
        const hasYarukoto = content.includes('**やったこと**');
        const hasTIL = content.includes('**TIL');
        const hasKimochi = content.includes('**こんな気分**');
        const hasActivityInContent = content.includes('行脚') || content.includes('1on1') || content.includes('リファクタリング');
        
        console.log(`✅ 構造チェック結果:`);
        console.log(`   やったこと: ${hasYarukoto ? '✅ あり' : '❌ なし'}`);
        console.log(`   TIL: ${hasTIL ? '✅ あり' : '❌ なし'}`);
        console.log(`   こんな気分: ${hasKimochi ? '✅ あり' : '❌ なし'}`);
        console.log(`   活動詳細: ${hasActivityInContent ? '✅ あり' : '❌ なし'}`);
        
        console.log('\n✅ AI統合タイトル生成テスト完了');
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error);
    }
}

// テスト実行
testAITitleGeneration();
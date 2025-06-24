// Phase 7a 互換性テスト
// 旧システムとの互換性メソッドの動作確認

const AIKeywordExtractor = require('../../src/ai/keyword-extractor-ai');
require('dotenv').config();

async function testCompatibility() {
    console.log('🔄 Phase 7a 互換性テスト開始');
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  OPENAI_API_KEY が設定されていません。テストをスキップします。');
        return;
    }
    
    const extractor = new AIKeywordExtractor(process.env.OPENAI_API_KEY);
    
    const testMessages = [
        { channel_name: 'etc-spots', text: '渋谷でランチ', ts: '1735027200' },
        { channel_name: 'its-tech', text: 'React開発中', ts: '1735027300' }
    ];
    
    try {
        // 1. generateIntegratedAnalysis テスト
        console.log('\n📊 generateIntegratedAnalysis テスト...');
        const integratedResult = await extractor.generateIntegratedAnalysis(testMessages);
        console.log('✅ 統合分析成功');
        console.log(`   トップ関心事: ${integratedResult.topInterests.length}個`);
        console.log(`   特徴語: ${integratedResult.summary.characteristicWords.length}個`);
        
        // 2. generatePromptCharacteristicWords テスト
        console.log('\n🔑 generatePromptCharacteristicWords テスト...');
        const promptWords = await extractor.generatePromptCharacteristicWords(testMessages, 5);
        console.log('✅ プロンプト特徴語成功');
        console.log(`   特徴語数: ${promptWords.length}個`);
        console.log(`   語彙: ${promptWords.map(w => w.word || w).join(', ')}`);
        
        // 3. extractKeywordsForDiaryGeneration テスト
        console.log('\n📝 extractKeywordsForDiaryGeneration テスト...');
        const diaryResult = await extractor.extractKeywordsForDiaryGeneration(testMessages);
        console.log('✅ 日記生成用抽出成功');
        console.log(`   日常体験: ${diaryResult.categories?.daily_life?.keywords?.length || 0}個`);
        console.log(`   技術: ${diaryResult.categories?.technical?.keywords?.length || 0}個`);
        
        console.log('\n🎉 Phase 7a 互換性テスト すべて成功！');
        
    } catch (error) {
        console.error('❌ 互換性テストエラー:', error.message);
        console.error('詳細:', error.stack);
    }
}

if (require.main === module) {
    testCompatibility();
}

module.exports = testCompatibility;
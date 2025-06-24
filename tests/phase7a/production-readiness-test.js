// Phase 7a: 本番投入動作確認テスト

const AIKeywordExtractor = require('../../src/ai/keyword-extractor-ai');
const SlackMCPWrapperDirect = require('../../src/mcp-integration/slack-mcp-wrapper-direct');
require('dotenv').config();

class ProductionReadinessTest {
    constructor() {
        this.aiExtractor = new AIKeywordExtractor(process.env.OPENAI_API_KEY);
        this.slackWrapper = new SlackMCPWrapperDirect();
    }
    
    /**
     * 本番投入前の総合動作確認
     */
    async runProductionTest() {
        console.log('🚀 Phase 7a 本番投入動作確認テスト');
        console.log('━'.repeat(60));
        
        const results = {
            ai_extractor: await this.testAIExtractor(),
            slack_integration: await this.testSlackIntegration(),
            performance: await this.testPerformance(),
            error_handling: await this.testErrorHandling()
        };
        
        this.displaySummary(results);
        return results;
    }
    
    /**
     * AI抽出器の基本動作テスト
     */
    async testAIExtractor() {
        console.log('\n📊 AI抽出器テスト');
        console.log('─'.repeat(30));
        
        const testMessages = [
            { channel_name: 'etc-spots', text: '渋谷のカフェでランチ', ts: '1735027200' },
            { channel_name: 'its-tech', text: 'React開発を進行中', ts: '1735027300' }
        ];
        
        try {
            const startTime = Date.now();
            const result = await this.aiExtractor.extractKeywords(testMessages);
            const endTime = Date.now();
            
            const test = {
                success: true,
                responseTime: endTime - startTime,
                hasValidStructure: this.validateStructure(result),
                keywordCount: this.countKeywords(result),
                cacheEnabled: result.fromCache !== undefined,
                details: result
            };
            
            console.log(`✅ AI抽出成功: ${test.responseTime}ms`);
            console.log(`   構造: ${test.hasValidStructure ? '✅' : '❌'}`);
            console.log(`   キーワード数: ${test.keywordCount}`);
            console.log(`   キャッシュ: ${test.cacheEnabled ? '✅' : '❌'}`);
            
            return test;
            
        } catch (error) {
            console.error(`❌ AI抽出エラー:`, error.message);
            return {
                success: false,
                error: error.message,
                responseTime: -1
            };
        }
    }
    
    /**
     * Slack統合テスト
     */
    async testSlackIntegration() {
        console.log('\n📱 Slack統合テスト');
        console.log('─'.repeat(30));
        
        try {
            // SlackMCPWrapperの初期化確認
            const hasAIExtractor = this.slackWrapper.keywordExtractor instanceof AIKeywordExtractor;
            const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
            
            console.log(`✅ AI抽出器統合: ${hasAIExtractor ? '✅' : '❌'}`);
            console.log(`✅ OpenAI設定: ${hasOpenAIKey ? '✅' : '❌'}`);
            
            return {
                success: hasAIExtractor && hasOpenAIKey,
                aiExtractorIntegrated: hasAIExtractor,
                openaiConfigured: hasOpenAIKey,
                ready: hasAIExtractor && hasOpenAIKey
            };
            
        } catch (error) {
            console.error(`❌ Slack統合エラー:`, error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * パフォーマンステスト
     */
    async testPerformance() {
        console.log('\n⚡ パフォーマンステスト');
        console.log('─'.repeat(30));
        
        const testSizes = [2, 5, 10];
        const results = [];
        
        for (const size of testSizes) {
            const messages = this.generateTestMessages(size);
            
            const startTime = Date.now();
            try {
                const result = await this.aiExtractor.extractKeywords(messages);
                const endTime = Date.now();
                
                results.push({
                    messageCount: size,
                    responseTime: endTime - startTime,
                    success: true,
                    mode: result.metadata?.mode || 'normal'
                });
                
                console.log(`✅ ${size}件: ${endTime - startTime}ms (${result.metadata?.mode || 'normal'})`);
                
            } catch (error) {
                results.push({
                    messageCount: size,
                    responseTime: -1,
                    success: false,
                    error: error.message
                });
                
                console.log(`❌ ${size}件: エラー`);
            }
        }
        
        // キャッシュ効果テスト
        console.log('\n🎯 キャッシュ効果テスト');
        const cacheMessages = this.generateTestMessages(5);
        
        // 1回目（キャッシュなし）
        const firstTime = Date.now();
        await this.aiExtractor.extractKeywords(cacheMessages);
        const firstDuration = Date.now() - firstTime;
        
        // 2回目（キャッシュあり）
        const secondTime = Date.now();
        const cachedResult = await this.aiExtractor.extractKeywords(cacheMessages);
        const secondDuration = Date.now() - secondTime;
        
        console.log(`初回: ${firstDuration}ms`);
        console.log(`キャッシュ: ${secondDuration}ms (${cachedResult.fromCache ? 'ヒット' : 'ミス'})`);
        
        return {
            testResults: results,
            cache: {
                firstRun: firstDuration,
                cachedRun: secondDuration,
                hitSuccessful: cachedResult.fromCache === true,
                improvement: ((firstDuration - secondDuration) / firstDuration * 100).toFixed(1)
            }
        };
    }
    
    /**
     * エラーハンドリングテスト
     */
    async testErrorHandling() {
        console.log('\n🛡️ エラーハンドリングテスト');
        console.log('─'.repeat(30));
        
        const tests = [];
        
        // 空メッセージテスト
        try {
            const result = await this.aiExtractor.extractKeywords([]);
            tests.push({
                test: 'empty_messages',
                success: true,
                result: 'フォールバック動作確認'
            });
            console.log('✅ 空メッセージ: フォールバック動作');
        } catch (error) {
            tests.push({
                test: 'empty_messages',
                success: false,
                error: error.message
            });
            console.log('❌ 空メッセージ: エラー');
        }
        
        // 無効なメッセージテスト
        try {
            const invalidMessages = [{ channel_name: null, text: null }];
            const result = await this.aiExtractor.extractKeywords(invalidMessages);
            tests.push({
                test: 'invalid_messages',
                success: true,
                result: 'エラー処理成功'
            });
            console.log('✅ 無効メッセージ: エラー処理成功');
        } catch (error) {
            tests.push({
                test: 'invalid_messages',
                success: false,
                error: error.message
            });
            console.log('❌ 無効メッセージ: 予期しないエラー');
        }
        
        return {
            tests,
            allPassed: tests.every(t => t.success)
        };
    }
    
    /**
     * テストメッセージ生成
     */
    generateTestMessages(count) {
        const templates = [
            { channel_name: 'etc-spots', text: '渋谷でランチしました' },
            { channel_name: 'its-tech', text: 'React開発を進めています' },
            { channel_name: 'general', text: '今日のミーティング完了' },
            { channel_name: 'etc-hobby', text: '映画を見に行きました' }
        ];
        
        const messages = [];
        for (let i = 0; i < count; i++) {
            const template = templates[i % templates.length];
            messages.push({
                ...template,
                text: `${template.text} (${i + 1})`,
                ts: String(1735027200 + i * 100)
            });
        }
        
        return messages;
    }
    
    /**
     * 構造検証
     */
    validateStructure(result) {
        return !!(
            result.categories &&
            result.categories.daily_life &&
            result.categories.technical &&
            result.characteristic_words !== undefined &&
            result.top_keywords &&
            result.activity_inference
        );
    }
    
    /**
     * キーワード数カウント
     */
    countKeywords(result) {
        let count = 0;
        if (result.categories) {
            Object.values(result.categories).forEach(cat => {
                count += (cat.keywords || []).length;
            });
        }
        count += (result.top_keywords || []).length;
        return count;
    }
    
    /**
     * 総合評価表示
     */
    displaySummary(results) {
        console.log('\n\n' + '═'.repeat(60));
        console.log('📊 本番投入動作確認 総合評価');
        console.log('═'.repeat(60));
        
        const aiSuccess = results.ai_extractor.success;
        const slackReady = results.slack_integration.ready;
        const perfGood = results.performance.testResults.every(r => r.success);
        const errorHandling = results.error_handling.allPassed;
        
        console.log('\n✅ コンポーネント状況:');
        console.log(`   AI抽出器: ${aiSuccess ? '✅ 正常' : '❌ 異常'}`);
        console.log(`   Slack統合: ${slackReady ? '✅ 準備完了' : '❌ 未準備'}`);
        console.log(`   パフォーマンス: ${perfGood ? '✅ 良好' : '❌ 問題あり'}`);
        console.log(`   エラー処理: ${errorHandling ? '✅ 正常' : '❌ 問題あり'}`);
        
        const overallReady = aiSuccess && slackReady && perfGood && errorHandling;
        
        console.log('\n🎯 総合判定:');
        if (overallReady) {
            console.log('   ✅ 本番投入準備完了！');
            console.log('   🚀 Phase 7a AI化システム稼働可能');
        } else {
            console.log('   ⚠️  本番投入前に問題を解決してください');
        }
        
        // パフォーマンス詳細
        if (results.performance.cache.hitSuccessful) {
            console.log(`\n📊 キャッシュ効果: ${results.performance.cache.improvement}%向上`);
        }
        
        console.log('\n💡 推奨事項:');
        console.log('   1. 本格運用開始');
        console.log('   2. レスポンス時間の継続監視');
        console.log('   3. キャッシュ効果の定期確認');
    }
}

// テスト実行
async function runTest() {
    const test = new ProductionReadinessTest();
    return await test.runProductionTest();
}

if (require.main === module) {
    runTest().catch(console.error);
}

module.exports = ProductionReadinessTest;
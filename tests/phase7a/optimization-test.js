// Phase 7a: 最適化効果測定テスト

const AIKeywordExtractor = require('../../src/ai/keyword-extractor-ai');
const AIKeywordExtractorOptimized = require('../../src/ai/keyword-extractor-ai-optimized');
const SlackKeywordExtractor = require('../../src/mcp-integration/slack-keyword-extractor');
require('dotenv').config();

class OptimizationTest {
    constructor() {
        this.originalAI = new AIKeywordExtractor(process.env.OPENAI_API_KEY);
        this.optimizedAI = new AIKeywordExtractorOptimized(process.env.OPENAI_API_KEY);
        this.oldSystem = new SlackKeywordExtractor();
    }
    
    /**
     * テストケース
     */
    getTestCases() {
        return [
            {
                name: 'ケース1: 少数メッセージ（2件）',
                messages: [
                    { channel_name: 'etc-spots', text: '武蔵野でランチしました', ts: '1735027200' },
                    { channel_name: 'its-tech', text: 'React開発中', ts: '1735027300' }
                ]
            },
            {
                name: 'ケース2: 中規模（10件）',
                messages: this.generateMessages(10)
            },
            {
                name: 'ケース3: 大規模（30件）',
                messages: this.generateMessages(30)
            },
            {
                name: 'ケース4: 重複あり',
                messages: [
                    ...this.generateMessages(5),
                    ...this.generateMessages(5), // 同じメッセージを重複
                ]
            }
        ];
    }
    
    /**
     * テスト実行
     */
    async runOptimizationTest() {
        console.log('🚀 Phase 7a 最適化効果測定開始\n');
        console.log('━'.repeat(70));
        
        const results = [];
        
        for (const testCase of this.getTestCases()) {
            console.log(`\n📋 ${testCase.name}`);
            console.log(`   メッセージ数: ${testCase.messages.length}`);
            console.log('─'.repeat(70));
            
            // Phase 6.6+ (ベースライン)
            const oldStart = Date.now();
            const oldResult = this.oldSystem.extractKeywordsForDiaryGeneration(testCase.messages);
            const oldTime = Date.now() - oldStart;
            
            // 初期AI実装
            let originalTime = null;
            let originalResult = null;
            
            try {
                const originalStart = Date.now();
                originalResult = await this.originalAI.extractKeywords(testCase.messages);
                originalTime = Date.now() - originalStart;
            } catch (error) {
                console.error('   ❌ 初期AI実装エラー:', error.message);
                originalTime = -1;
            }
            
            // 最適化版AI
            const optimizedStart = Date.now();
            const optimizedResult = await this.optimizedAI.extractKeywords(testCase.messages);
            const optimizedTime = Date.now() - optimizedStart;
            
            // キャッシュ効果測定（2回目実行）
            const cacheStart = Date.now();
            const cachedResult = await this.optimizedAI.extractKeywords(testCase.messages);
            const cacheTime = Date.now() - cacheStart;
            
            // 結果分析
            const analysis = {
                testCase: testCase.name,
                performance: {
                    old: oldTime,
                    original: originalTime,
                    optimized: optimizedTime,
                    cached: cacheTime
                },
                improvements: {
                    vsOld: this.calculateImprovement(oldTime, optimizedTime),
                    vsOriginal: originalTime > 0 ? this.calculateImprovement(originalTime, optimizedTime) : null,
                    cacheBoost: this.calculateImprovement(optimizedTime, cacheTime)
                },
                quality: {
                    keywordCount: this.countKeywords(optimizedResult),
                    hasStructure: this.validateStructure(optimizedResult),
                    fromCache: cachedResult.fromCache || false
                }
            };
            
            this.displayResult(analysis);
            results.push(analysis);
        }
        
        // 総合評価
        this.displaySummary(results);
        
        // キャッシュ統計
        console.log('\n📊 キャッシュ統計:');
        console.log(this.optimizedAI.getCacheStats());
    }
    
    /**
     * テストメッセージ生成
     */
    generateMessages(count) {
        const channels = ['etc-spots', 'its-tech', 'general', 'its-training'];
        const templates = [
            '今日は{place}で{activity}しました',
            '{tech}の実装を進めています',
            '{food}を食べました。美味しかった！',
            'ミーティングで{topic}について議論',
            '{event}に参加。とても勉強になった'
        ];
        
        const placeholders = {
            place: ['渋谷', '新宿', '武蔵野', '三鷺', '吉祥寺'],
            activity: ['ランチ', 'カフェ作業', 'ミーティング', '散歩', 'ショッピング'],
            tech: ['React', 'Next.js', 'Node.js', 'Python', 'AI'],
            food: ['ラーメン', 'カレー', 'パスタ', 'たい焼き', 'ケーキ'],
            topic: ['プロジェクト進捗', '技術選定', 'チーム体制', '今後の方針'],
            event: ['技術セミナー', 'ハッカソン', '勉強会', 'カンファレンス']
        };
        
        const messages = [];
        for (let i = 0; i < count; i++) {
            const template = templates[i % templates.length];
            const channel = channels[i % channels.length];
            
            let text = template;
            Object.keys(placeholders).forEach(key => {
                const values = placeholders[key];
                text = text.replace(`{${key}}`, values[Math.floor(Math.random() * values.length)]);
            });
            
            messages.push({
                channel_name: channel,
                text,
                ts: String(1735027200 + i * 100)
            });
        }
        
        return messages;
    }
    
    /**
     * 改善率計算
     */
    calculateImprovement(before, after) {
        if (before === 0) return 0;
        return ((before - after) / before * 100).toFixed(1);
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
     * 構造検証
     */
    validateStructure(result) {
        return !!(
            result.categories &&
            result.characteristic_words !== undefined &&
            result.top_keywords &&
            result.activity_inference
        );
    }
    
    /**
     * 結果表示
     */
    displayResult(analysis) {
        console.log('\n📊 パフォーマンス比較:');
        console.log(`   Phase 6.6+:     ${analysis.performance.old}ms`);
        console.log(`   初期AI:         ${analysis.performance.original}ms`);
        console.log(`   最適化AI:       ${analysis.performance.optimized}ms`);
        console.log(`   キャッシュ使用:  ${analysis.performance.cached}ms`);
        
        console.log('\n📈 改善効果:');
        console.log(`   vs Phase 6.6+:  ${analysis.improvements.vsOld}% ${this.getEmoji(analysis.improvements.vsOld)}`);
        if (analysis.improvements.vsOriginal !== null) {
            console.log(`   vs 初期AI:      ${analysis.improvements.vsOriginal}% ${this.getEmoji(analysis.improvements.vsOriginal)}`);
        }
        console.log(`   キャッシュ効果: ${analysis.improvements.cacheBoost}% ${this.getEmoji(analysis.improvements.cacheBoost)}`);
        
        console.log('\n✅ 品質指標:');
        console.log(`   キーワード数:   ${analysis.quality.keywordCount}`);
        console.log(`   構造適合性:     ${analysis.quality.hasStructure ? '✅' : '❌'}`);
        console.log(`   キャッシュ利用: ${analysis.quality.fromCache ? '✅' : '❌'}`);
    }
    
    /**
     * 改善率に応じた絵文字
     */
    getEmoji(improvement) {
        const value = parseFloat(improvement);
        if (value >= 90) return '🚀';
        if (value >= 50) return '⚡';
        if (value >= 20) return '✨';
        if (value >= 0) return '✅';
        return '⚠️';
    }
    
    /**
     * 総合サマリー
     */
    displaySummary(results) {
        console.log('\n\n' + '═'.repeat(70));
        console.log('📊 最適化効果総合評価');
        console.log('═'.repeat(70));
        
        // 平均改善率
        const avgImprovement = {
            vsOld: 0,
            vsOriginal: 0,
            cacheBoost: 0
        };
        
        let validOriginalCount = 0;
        results.forEach(r => {
            avgImprovement.vsOld += parseFloat(r.improvements.vsOld);
            avgImprovement.cacheBoost += parseFloat(r.improvements.cacheBoost);
            
            if (r.improvements.vsOriginal !== null) {
                avgImprovement.vsOriginal += parseFloat(r.improvements.vsOriginal);
                validOriginalCount++;
            }
        });
        
        avgImprovement.vsOld /= results.length;
        avgImprovement.vsOriginal = validOriginalCount > 0 ? 
            avgImprovement.vsOriginal / validOriginalCount : null;
        avgImprovement.cacheBoost /= results.length;
        
        console.log('\n⚡ 平均改善効果:');
        console.log(`   vs Phase 6.6+:    ${avgImprovement.vsOld.toFixed(1)}%`);
        if (avgImprovement.vsOriginal !== null) {
            console.log(`   vs 初期AI:        ${avgImprovement.vsOriginal.toFixed(1)}%`);
        }
        console.log(`   キャッシュ効果:   ${avgImprovement.cacheBoost.toFixed(1)}%`);
        
        // 推奨事項
        console.log('\n💡 評価結果:');
        
        if (avgImprovement.vsOriginal > 50) {
            console.log('   ✅ 最適化により大幅な性能改善を達成');
        }
        
        if (avgImprovement.cacheBoost > 90) {
            console.log('   ✅ キャッシュが非常に効果的に機能');
        }
        
        if (avgImprovement.vsOld < -100) {
            console.log('   ⚠️  Phase 6.6+と比較してまだ遅いが、品質向上の価値あり');
        } else {
            console.log('   ✅ 実用的なレスポンス時間を達成');
        }
        
        console.log('\n📝 次のステップ:');
        console.log('   1. プロダクション環境でのA/Bテスト実施');
        console.log('   2. ユーザーフィードバックの収集');
        console.log('   3. さらなる最適化の検討（必要に応じて）');
    }
}

// テスト実行
async function runTest() {
    const test = new OptimizationTest();
    await test.runOptimizationTest();
}

if (require.main === module) {
    runTest().catch(console.error);
}

module.exports = OptimizationTest;
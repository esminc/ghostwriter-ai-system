// Phase 7a: 並行比較テスト
// 既存システム（Phase 6.6+）とAIシステム（Phase 7a）の比較検証

const SlackKeywordExtractor = require('../../src/mcp-integration/slack-keyword-extractor');
const AIKeywordExtractor = require('../../src/ai/keyword-extractor-ai');
require('dotenv').config();

class ParallelComparisonTest {
    constructor() {
        this.oldExtractor = new SlackKeywordExtractor();
        this.newExtractor = new AIKeywordExtractor(process.env.OPENAI_API_KEY);
        this.results = [];
    }
    
    /**
     * テストサンプルメッセージ
     */
    getTestMessages() {
        return [
            {
                daily_life: [
                    { channel_name: 'etc-spots', text: '武蔵野のカフェでアフタヌーンティーしてきました！紅茶が美味しかった', ts: '1735027200' },
                    { channel_name: 'etc-spots', text: '三鷺駅前のたい焼き屋さん、めっちゃ美味しい。また行きたい', ts: '1735027300' },
                    { channel_name: 'general', text: '今日は北陸新幹線で金沢まで行ってきます', ts: '1735027400' }
                ]
            },
            {
                technical: [
                    { channel_name: 'its-tech', text: 'Next.jsのSSR実装で苦戦中。hydrationエラーが解決しない', ts: '1735027500' },
                    { channel_name: 'its-tech', text: 'Claude APIとMCP統合が完了！レスポンスも高速化できた', ts: '1735027600' },
                    { channel_name: 'development', text: 'PostgreSQLのパフォーマンスチューニング完了', ts: '1735027700' }
                ]
            },
            {
                mixed: [
                    { channel_name: 'etc-spots', text: 'スタバで作業中。Next.jsの開発が捗る', ts: '1735027800' },
                    { channel_name: 'its-training', text: 'AIプロンプトエンジニアリングの研修参加。とても勉強になった', ts: '1735027900' },
                    { channel_name: 'general', text: '明日のミーティングの準備完了。プレゼン資料も仕上げた', ts: '1735028000' }
                ]
            }
        ];
    }
    
    /**
     * 並行実行と比較
     */
    async runComparison() {
        console.log('🔄 Phase 7a 並行比較テスト開始\n');
        
        const testCases = this.getTestMessages();
        
        for (const [index, testCase] of testCases.entries()) {
            const category = Object.keys(testCase)[0];
            const messages = testCase[category];
            
            console.log(`\n📝 テストケース ${index + 1}: ${category} (${messages.length}件のメッセージ)`);
            console.log('━'.repeat(60));
            
            try {
                // 並行実行
                const startOld = Date.now();
                const oldResult = this.oldExtractor.extractKeywordsForDiaryGeneration(messages);
                const oldTime = Date.now() - startOld;
                
                const startNew = Date.now();
                const newResult = await this.newExtractor.extractKeywords(messages);
                const newTime = Date.now() - startNew;
                
                // 結果の比較
                const comparison = this.compareResults(oldResult, newResult, oldTime, newTime);
                
                // 結果表示
                this.displayComparison(comparison, category);
                
                // 結果保存
                this.results.push({
                    category,
                    comparison,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error(`❌ エラー: ${error.message}`);
            }
        }
        
        // 総合評価
        this.displaySummary();
    }
    
    /**
     * 結果の比較分析
     */
    compareResults(oldResult, newResult, oldTime, newTime) {
        const comparison = {
            performance: {
                oldTime,
                newTime,
                speedup: ((oldTime - newTime) / oldTime * 100).toFixed(1)
            },
            keywords: {
                old: this.extractKeywordList(oldResult),
                new: this.extractKeywordList(newResult),
                similarity: 0,
                improvements: [],
                regressions: []
            },
            quality: {
                oldComplexity: this.calculateComplexity(oldResult),
                newComplexity: this.calculateComplexity(newResult),
                structureMatch: this.checkStructure(newResult)
            }
        };
        
        // キーワードの類似度計算
        const oldSet = new Set(comparison.keywords.old);
        const newSet = new Set(comparison.keywords.new);
        
        const intersection = new Set([...oldSet].filter(x => newSet.has(x)));
        const union = new Set([...oldSet, ...newSet]);
        
        comparison.keywords.similarity = (intersection.size / union.size * 100).toFixed(1);
        
        // 改善点と退化点
        comparison.keywords.improvements = [...newSet].filter(x => !oldSet.has(x));
        comparison.keywords.regressions = [...oldSet].filter(x => !newSet.has(x));
        
        return comparison;
    }
    
    /**
     * キーワードリストの抽出
     */
    extractKeywordList(result) {
        const keywords = [];
        
        // 旧形式の場合
        if (result.characteristic) {
            keywords.push(...result.characteristic.map(w => w.word));
        }
        
        // 新形式の場合
        if (result.categories) {
            Object.values(result.categories).forEach(cat => {
                if (cat.keywords) {
                    keywords.push(...cat.keywords);
                }
            });
        }
        
        if (result.top_keywords) {
            keywords.push(...result.top_keywords);
        }
        
        return [...new Set(keywords)]; // 重複除去
    }
    
    /**
     * 複雑性の計算
     */
    calculateComplexity(result) {
        let complexity = 0;
        
        // データ構造の深さ
        const depth = this.getObjectDepth(result);
        complexity += depth * 10;
        
        // キーワード数
        const keywordCount = this.extractKeywordList(result).length;
        complexity += keywordCount;
        
        return complexity;
    }
    
    /**
     * オブジェクトの深さを計算
     */
    getObjectDepth(obj, currentDepth = 0) {
        if (typeof obj !== 'object' || obj === null) {
            return currentDepth;
        }
        
        let maxDepth = currentDepth;
        for (const value of Object.values(obj)) {
            const depth = this.getObjectDepth(value, currentDepth + 1);
            maxDepth = Math.max(maxDepth, depth);
        }
        
        return maxDepth;
    }
    
    /**
     * 構造チェック
     */
    checkStructure(result) {
        const requiredFields = ['categories', 'characteristic_words', 'top_keywords'];
        const hasAllFields = requiredFields.every(field => result[field] !== undefined);
        
        const categoryCheck = result.categories && 
            ['daily_life', 'technical', 'business', 'emotion'].every(
                cat => result.categories[cat] !== undefined
            );
        
        return hasAllFields && categoryCheck;
    }
    
    /**
     * 比較結果の表示
     */
    displayComparison(comparison, category) {
        console.log('\n📊 比較結果:');
        console.log('─'.repeat(60));
        
        // パフォーマンス
        console.log('\n⚡ パフォーマンス:');
        console.log(`  旧システム: ${comparison.performance.oldTime}ms`);
        console.log(`  新システム: ${comparison.performance.newTime}ms`);
        console.log(`  速度変化: ${comparison.performance.speedup}%`);
        
        // キーワード比較
        console.log('\n🔑 キーワード分析:');
        console.log(`  類似度: ${comparison.keywords.similarity}%`);
        console.log(`  旧システムのキーワード数: ${comparison.keywords.old.length}`);
        console.log(`  新システムのキーワード数: ${comparison.keywords.new.length}`);
        
        if (comparison.keywords.improvements.length > 0) {
            console.log(`  ✅ 新規発見: ${comparison.keywords.improvements.slice(0, 5).join(', ')}`);
        }
        
        if (comparison.keywords.regressions.length > 0) {
            console.log(`  ⚠️  見逃し: ${comparison.keywords.regressions.slice(0, 5).join(', ')}`);
        }
        
        // 品質評価
        console.log('\n📈 品質評価:');
        console.log(`  構造適合性: ${comparison.quality.structureMatch ? '✅ 合格' : '❌ 不合格'}`);
        console.log(`  複雑性スコア: 旧 ${comparison.quality.oldComplexity} → 新 ${comparison.quality.newComplexity}`);
    }
    
    /**
     * 総合サマリー表示
     */
    displaySummary() {
        console.log('\n\n' + '═'.repeat(60));
        console.log('📊 総合評価サマリー');
        console.log('═'.repeat(60));
        
        // 平均パフォーマンス
        const avgOldTime = this.results.reduce((sum, r) => sum + r.comparison.performance.oldTime, 0) / this.results.length;
        const avgNewTime = this.results.reduce((sum, r) => sum + r.comparison.performance.newTime, 0) / this.results.length;
        const avgSpeedup = ((avgOldTime - avgNewTime) / avgOldTime * 100).toFixed(1);
        
        console.log('\n⚡ 平均パフォーマンス:');
        console.log(`  旧システム平均: ${avgOldTime.toFixed(0)}ms`);
        console.log(`  新システム平均: ${avgNewTime.toFixed(0)}ms`);
        console.log(`  平均速度変化: ${avgSpeedup}%`);
        
        // 平均類似度
        const avgSimilarity = this.results.reduce((sum, r) => 
            sum + parseFloat(r.comparison.keywords.similarity), 0
        ) / this.results.length;
        
        console.log('\n🔑 平均キーワード類似度: ' + avgSimilarity.toFixed(1) + '%');
        
        // 構造適合性
        const structurePass = this.results.every(r => r.comparison.quality.structureMatch);
        console.log('\n📋 構造適合性: ' + (structurePass ? '✅ 全テスト合格' : '❌ 一部不合格'));
        
        // 推奨事項
        console.log('\n💡 推奨事項:');
        if (avgNewTime > avgOldTime) {
            console.log('  - 新システムは遅いが、AI の高度な理解力により品質向上が期待できる');
        } else {
            console.log('  - 新システムは高速で、効率的な処理が可能');
        }
        
        if (avgSimilarity < 80) {
            console.log('  - キーワード抽出の差異が大きいため、段階的移行を推奨');
        } else {
            console.log('  - キーワード抽出の一貫性が高く、スムーズな移行が可能');
        }
    }
}

// テスト実行
async function runTest() {
    const test = new ParallelComparisonTest();
    await test.runComparison();
}

// 実行
if (require.main === module) {
    runTest().catch(console.error);
}

module.exports = ParallelComparisonTest;
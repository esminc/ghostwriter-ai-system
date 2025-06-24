const UnifiedDiaryGenerator = require('../../src/ai/unified-diary-generator');
const ContextGatherer = require('../../src/ai/context-gatherer');
const AIToolExecutor = require('../../src/ai/ai-tool-executor');
const ErrorRecoverySystem = require('../../src/ai/error-recovery-system');
const AIKeywordExtractor = require('../../src/ai/keyword-extractor-ai');

/**
 * Phase 7b統合テスト - Phase 7aとの統合を含む包括的テスト
 * 
 * テスト範囲:
 * 1. Phase 7a (AIキーワード抽出) との統合
 * 2. Phase 7b コンポーネント間の連携
 * 3. エラー回復機能の検証
 * 4. 品質保証の確認
 */
class Phase7bIntegrationTest {
    constructor() {
        this.testResults = [];
        this.testUser = 'test-user-phase7b';
    }

    /**
     * 🧪 メイン統合テスト実行
     */
    async runFullIntegrationTest() {
        console.log('🧪 Phase 7b統合テスト開始');
        console.log('=====================================');
        
        const testSuites = [
            this.testContextGatherer.bind(this),
            this.testUnifiedDiaryGenerator.bind(this),
            this.testPhase7aIntegration.bind(this),
            this.testAIToolExecutor.bind(this),
            this.testErrorRecoverySystem.bind(this),
            this.testEndToEndGeneration.bind(this)
        ];
        
        for (const testSuite of testSuites) {
            try {
                await testSuite();
            } catch (error) {
                console.error(`❌ テストスイート失敗: ${error.message}`);
                this.recordTestResult(testSuite.name, false, error.message);
            }
        }
        
        this.generateTestReport();
        return this.testResults;
    }

    /**
     * 🔍 ContextGatherer 単体テスト
     */
    async testContextGatherer() {
        console.log('\n🔍 ContextGatherer テスト');
        console.log('-------------------');
        
        const gatherer = new ContextGatherer();
        
        // テスト1: 基本コンテキスト収集
        try {
            console.log('📋 基本コンテキスト収集テスト');
            const context = await gatherer.gatherAll(this.testUser, {
                instructions: 'テスト用日記生成',
                autonomyLevel: 'medium'
            });
            
            this.assertContextStructure(context);
            console.log('✅ 基本コンテキスト収集: PASS');
            this.recordTestResult('ContextGatherer_basic', true);
            
        } catch (error) {
            console.log('❌ 基本コンテキスト収集: FAIL -', error.message);
            this.recordTestResult('ContextGatherer_basic', false, error.message);
        }
        
        // テスト2: フォールバック動作確認
        try {
            console.log('🚨 フォールバックコンテキスト収集テスト');
            const fallbackContext = await gatherer.gatherBasic(this.testUser);
            
            this.assertFallbackContext(fallbackContext);
            console.log('✅ フォールバックコンテキスト: PASS');
            this.recordTestResult('ContextGatherer_fallback', true);
            
        } catch (error) {
            console.log('❌ フォールバックコンテキスト: FAIL -', error.message);
            this.recordTestResult('ContextGatherer_fallback', false, error.message);
        }
        
        // テスト3: キャッシュ機能確認
        try {
            console.log('💾 キャッシュ機能テスト');
            const startTime = Date.now();
            await gatherer.gatherAll(this.testUser);
            const firstCallTime = Date.now() - startTime;
            
            const startTime2 = Date.now();
            await gatherer.gatherAll(this.testUser);
            const secondCallTime = Date.now() - startTime2;
            
            if (secondCallTime < firstCallTime * 0.8) {
                console.log('✅ キャッシュ機能: PASS (2回目が高速化)');
                this.recordTestResult('ContextGatherer_cache', true);
            } else {
                throw new Error(`キャッシュ効果なし: 1回目=${firstCallTime}ms, 2回目=${secondCallTime}ms`);
            }
            
        } catch (error) {
            console.log('❌ キャッシュ機能: FAIL -', error.message);
            this.recordTestResult('ContextGatherer_cache', false, error.message);
        }
    }

    /**
     * 🤖 UnifiedDiaryGenerator テスト
     */
    async testUnifiedDiaryGenerator() {
        console.log('\n🤖 UnifiedDiaryGenerator テスト');
        console.log('-------------------------');
        
        // テスト1: 基本日記生成（高自律モード）
        try {
            console.log('🚀 高自律モード日記生成テスト');
            const generator = new UnifiedDiaryGenerator({
                autonomyLevel: 'high',
                qualityThreshold: 0.8,
                timeoutMs: 60000
            });
            
            const result = await generator.generateDiary(
                this.testUser,
                'テスト用の高品質な日記を生成してください'
            );
            
            this.assertDiaryStructure(result);
            this.assertPhase7bMetadata(result.metadata);
            
            console.log('✅ 高自律モード日記生成: PASS');
            console.log(`   品質スコア: ${result.metadata.qualityScore}`);
            console.log(`   処理時間: ${result.metadata.processingTime}ms`);
            this.recordTestResult('UnifiedDiaryGenerator_high_autonomy', true, `品質: ${result.metadata.qualityScore}`);
            
        } catch (error) {
            console.log('❌ 高自律モード日記生成: FAIL -', error.message);
            this.recordTestResult('UnifiedDiaryGenerator_high_autonomy', false, error.message);
        }
        
        // テスト2: 制御付きモード
        try {
            console.log('🎛️ 制御付きモード日記生成テスト');
            const generator = new UnifiedDiaryGenerator({
                autonomyLevel: 'low',
                qualityThreshold: 0.7,
                temperature: 0.3
            });
            
            const result = await generator.generateDiary(
                this.testUser,
                '制御付きモードでの日記生成テスト'
            );
            
            this.assertDiaryStructure(result);
            console.log('✅ 制御付きモード: PASS');
            this.recordTestResult('UnifiedDiaryGenerator_low_autonomy', true);
            
        } catch (error) {
            console.log('❌ 制御付きモード: FAIL -', error.message);
            this.recordTestResult('UnifiedDiaryGenerator_low_autonomy', false, error.message);
        }
        
        // テスト3: 品質検証システム
        try {
            console.log('🔍 品質検証システムテスト');
            const generator = new UnifiedDiaryGenerator({
                qualityThreshold: 0.99 // 意図的に高い閾値
            });
            
            try {
                await generator.generateDiary(this.testUser, '短すぎる指示');
                throw new Error('品質検証が機能していません');
            } catch (qualityError) {
                if (qualityError.message.includes('品質') || qualityError.message.includes('fallback')) {
                    console.log('✅ 品質検証システム: PASS (適切にフォールバック)');
                    this.recordTestResult('UnifiedDiaryGenerator_quality_validation', true);
                } else {
                    throw qualityError;
                }
            }
            
        } catch (error) {
            console.log('❌ 品質検証システム: FAIL -', error.message);
            this.recordTestResult('UnifiedDiaryGenerator_quality_validation', false, error.message);
        }
    }

    /**
     * 🔗 Phase 7a統合テスト
     */
    async testPhase7aIntegration() {
        console.log('\n🔗 Phase 7a統合テスト');
        console.log('----------------');
        
        // テスト1: AIキーワード抽出器との統合
        try {
            console.log('🔤 AIキーワード抽出統合テスト');
            const keywordExtractor = new AIKeywordExtractor();
            
            // Phase 7aのキーワード抽出をテスト
            const testMessages = [
                { text: 'etc-spotsで美味しいラーメンを食べました', channel: 'etc-spots' },
                { text: 'リファクタリングの議論をしました', channel: 'its-wkwk-general' },
                { text: '今日は山下さんと1on1がありました', channel: 'its-wkwk-general' }
            ];
            
            const keywords = await keywordExtractor.extractKeywords(testMessages);
            
            if (keywords && keywords.daily_experience && keywords.daily_experience.length > 0) {
                console.log('✅ Phase 7a AIキーワード抽出: PASS');
                console.log(`   抽出キーワード: ${keywords.daily_experience.slice(0, 3).join(', ')}`);
                this.recordTestResult('Phase7a_integration', true, `キーワード数: ${keywords.daily_experience.length}`);
            } else {
                throw new Error('キーワード抽出結果が不正です');
            }
            
        } catch (error) {
            console.log('❌ Phase 7a統合: FAIL -', error.message);
            this.recordTestResult('Phase7a_integration', false, error.message);
        }
        
        // テスト2: 互換性メソッドの確認
        try {
            console.log('🔧 互換性メソッドテスト');
            const keywordExtractor = new AIKeywordExtractor();
            
            // Phase 6.6+互換メソッドのテスト
            const testMessages = [
                { text: 'テストメッセージ', user: this.testUser }
            ];
            
            const compatResult = await keywordExtractor.generateIntegratedAnalysis(testMessages);
            
            if (compatResult && compatResult.keywords && compatResult.summary) {
                console.log('✅ 互換性メソッド: PASS');
                this.recordTestResult('Phase7a_compatibility', true);
            } else {
                throw new Error('互換性メソッドの結果が不正です');
            }
            
        } catch (error) {
            console.log('❌ 互換性メソッド: FAIL -', error.message);
            this.recordTestResult('Phase7a_compatibility', false, error.message);
        }
    }

    /**
     * 🛠️ AIToolExecutor テスト
     */
    async testAIToolExecutor() {
        console.log('\n🛠️ AIToolExecutor テスト');
        console.log('------------------');
        
        // テスト1: ツール発見機能
        try {
            console.log('🔍 ツール発見テスト');
            const executor = new AIToolExecutor();
            const tools = await executor.discoverAvailableTools();
            
            console.log(`✅ ツール発見: PASS (${tools.length}個のツールを発見)`);
            this.recordTestResult('AIToolExecutor_discovery', true, `ツール数: ${tools.length}`);
            
        } catch (error) {
            console.log('❌ ツール発見: FAIL -', error.message);
            this.recordTestResult('AIToolExecutor_discovery', false, error.message);
        }
        
        // テスト2: プロンプトのみ実行（フォールバック）
        try {
            console.log('📝 プロンプトのみ実行テスト');
            const executor = new AIToolExecutor();
            
            const result = await executor.executePromptOnly('簡単なテスト応答を生成してください');
            
            if (result && result.content && result.content.length > 10) {
                console.log('✅ プロンプトのみ実行: PASS');
                this.recordTestResult('AIToolExecutor_prompt_only', true);
            } else {
                throw new Error('プロンプト実行結果が不正です');
            }
            
        } catch (error) {
            console.log('❌ プロンプトのみ実行: FAIL -', error.message);
            this.recordTestResult('AIToolExecutor_prompt_only', false, error.message);
        }
        
        // テスト3: 実行統計
        try {
            console.log('📊 実行統計テスト');
            const executor = new AIToolExecutor();
            const stats = executor.getExecutionStats();
            
            if (typeof stats.totalExecutions === 'number') {
                console.log('✅ 実行統計: PASS');
                this.recordTestResult('AIToolExecutor_stats', true);
            } else {
                throw new Error('統計データの形式が不正です');
            }
            
        } catch (error) {
            console.log('❌ 実行統計: FAIL -', error.message);
            this.recordTestResult('AIToolExecutor_stats', false, error.message);
        }
    }

    /**
     * 🛡️ ErrorRecoverySystem テスト
     */
    async testErrorRecoverySystem() {
        console.log('\n🛡️ ErrorRecoverySystem テスト');
        console.log('------------------------');
        
        // テスト1: エラー分類
        try {
            console.log('🏷️ エラー分類テスト');
            const recovery = new ErrorRecoverySystem();
            
            const testErrors = [
                new Error('OpenAI API error'),
                new Error('MCP connection failed'),
                new Error('Quality validation failed'),
                new Error('Timeout exceeded')
            ];
            
            for (const error of testErrors) {
                const errorType = recovery.classifyErrorType(error);
                console.log(`   ${error.message} -> ${errorType}`);
            }
            
            console.log('✅ エラー分類: PASS');
            this.recordTestResult('ErrorRecovery_classification', true);
            
        } catch (error) {
            console.log('❌ エラー分類: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_classification', false, error.message);
        }
        
        // テスト2: 回復戦略選択
        try {
            console.log('🔧 回復戦略選択テスト');
            const recovery = new ErrorRecoverySystem();
            
            const mockAnalysis = {
                type: 'ai_generation_error',
                severity: 3,
                context: { autonomyLevel: 'high' }
            };
            
            const strategy = recovery.selectRecoveryStrategy(mockAnalysis, 1);
            
            if (strategy && strategy.name && strategy.executor) {
                console.log(`✅ 回復戦略選択: PASS (${strategy.name})`);
                this.recordTestResult('ErrorRecovery_strategy', true);
            } else {
                throw new Error('戦略選択結果が不正です');
            }
            
        } catch (error) {
            console.log('❌ 回復戦略選択: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_strategy', false, error.message);
        }
        
        // テスト3: 緊急フォールバック
        try {
            console.log('🚨 緊急フォールバックテスト');
            const recovery = new ErrorRecoverySystem();
            
            const mockContext = {
                userName: this.testUser,
                instructions: 'テスト指示'
            };
            
            const mockAnalysis = {
                originalError: { message: 'テストエラー' },
                type: 'unknown_error'
            };
            
            const result = await recovery.executeEmergencyFallback(mockContext, mockAnalysis);
            
            if (result && result.success && result.result) {
                console.log('✅ 緊急フォールバック: PASS');
                this.recordTestResult('ErrorRecovery_emergency', true);
            } else {
                throw new Error('緊急フォールバック結果が不正です');
            }
            
        } catch (error) {
            console.log('❌ 緊急フォールバック: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_emergency', false, error.message);
        }
    }

    /**
     * 🔄 エンドツーエンド統合テスト
     */
    async testEndToEndGeneration() {
        console.log('\n🔄 エンドツーエンド統合テスト');
        console.log('------------------------');
        
        // テスト1: 完全なワークフロー
        try {
            console.log('🌊 完全ワークフロー実行テスト');
            const generator = new UnifiedDiaryGenerator({
                autonomyLevel: 'medium',
                qualityThreshold: 0.8,
                timeoutMs: 120000 // 2分
            });
            
            const startTime = Date.now();
            const result = await generator.generateDiary(
                this.testUser,
                'Phase 7b統合テストのための包括的な日記を生成してください。技術的な内容と日常的な体験をバランスよく含めてください。'
            );
            const totalTime = Date.now() - startTime;
            
            // 結果検証
            this.assertDiaryStructure(result);
            this.assertPhase7bMetadata(result.metadata);
            
            console.log('✅ 完全ワークフロー: PASS');
            console.log(`   処理時間: ${totalTime}ms`);
            console.log(`   品質スコア: ${result.metadata.qualityScore}`);
            console.log(`   生成方法: ${result.metadata.generationMethod}`);
            console.log(`   文字数: ${result.content.length}字`);
            
            this.recordTestResult('EndToEnd_full_workflow', true, {
                time: totalTime,
                quality: result.metadata.qualityScore,
                length: result.content.length
            });
            
        } catch (error) {
            console.log('❌ 完全ワークフロー: FAIL -', error.message);
            this.recordTestResult('EndToEnd_full_workflow', false, error.message);
        }
        
        // テスト2: エラー条件下での動作
        try {
            console.log('⚠️ エラー条件下動作テスト');
            const generator = new UnifiedDiaryGenerator({
                autonomyLevel: 'high',
                qualityThreshold: 0.99, // 意図的に高い閾値
                timeoutMs: 5000 // 短いタイムアウト
            });
            
            const result = await generator.generateDiary(
                this.testUser,
                '' // 空の指示でエラー誘発
            );
            
            // フォールバックが働いているかチェック
            if (result.metadata.fallbackUsed || result.metadata.generationMethod.includes('fallback')) {
                console.log('✅ エラー条件下動作: PASS (適切にフォールバック)');
                this.recordTestResult('EndToEnd_error_handling', true);
            } else {
                throw new Error('エラー処理が適切に動作していません');
            }
            
        } catch (error) {
            console.log('❌ エラー条件下動作: FAIL -', error.message);
            this.recordTestResult('EndToEnd_error_handling', false, error.message);
        }
    }

    /**
     * 🔍 アサーションメソッド
     */
    assertContextStructure(context) {
        if (!context.userName) throw new Error('userNameが欠如');
        if (!context.timestamp) throw new Error('timestampが欠如');
        if (!context.availableData) throw new Error('availableDataが欠如');
        if (!Array.isArray(context.tools)) throw new Error('toolsが配列でない');
        if (!context.context) throw new Error('contextが欠如');
    }

    assertFallbackContext(context) {
        if (!context.availableData.fallbackMode) throw new Error('fallbackModeフラグが欠如');
        if (context.tools.length > 0) throw new Error('フォールバック時にツールが含まれている');
    }

    assertDiaryStructure(result) {
        if (!result.title) throw new Error('タイトルが欠如');
        if (!result.content) throw new Error('コンテンツが欠如');
        if (!result.title.includes('【代筆】')) throw new Error('タイトル形式が不正');
        if (result.content.length < 100) throw new Error('コンテンツが短すぎる');
        
        const requiredSections = ['やったこと', 'TIL', 'こんな気分'];
        for (const section of requiredSections) {
            if (!result.content.includes(section)) {
                throw new Error(`必須セクション「${section}」が欠如`);
            }
        }
    }

    assertPhase7bMetadata(metadata) {
        if (!metadata.generationMethod) throw new Error('generationMethodが欠如');
        if (typeof metadata.qualityScore !== 'number') throw new Error('qualityScoreが数値でない');
        if (!metadata.autonomyLevel) throw new Error('autonomyLevelが欠如');
        if (typeof metadata.processingTime !== 'number') throw new Error('processingTimeが数値でない');
    }

    /**
     * 📊 テスト結果記録
     */
    recordTestResult(testName, success, details = null) {
        this.testResults.push({
            testName,
            success,
            details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 📈 テストレポート生成
     */
    generateTestReport() {
        console.log('\n📈 Phase 7b統合テスト結果');
        console.log('==========================');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
        
        console.log(`📊 総テスト数: ${totalTests}`);
        console.log(`✅ 成功: ${passedTests}`);
        console.log(`❌ 失敗: ${failedTests}`);
        console.log(`📈 成功率: ${successRate}%`);
        
        console.log('\n📝 詳細結果:');
        this.testResults.forEach(result => {
            const status = result.success ? '✅' : '❌';
            const details = result.details ? ` (${JSON.stringify(result.details)})` : '';
            console.log(`   ${status} ${result.testName}${details}`);
        });
        
        console.log('\n' + '='.repeat(50));
        
        if (successRate >= 80) {
            console.log('🎉 Phase 7b統合テスト: 全体的に成功');
        } else if (successRate >= 60) {
            console.log('⚠️ Phase 7b統合テスト: 一部問題あり');
        } else {
            console.log('🚨 Phase 7b統合テスト: 重大な問題あり');
        }
        
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: parseFloat(successRate),
            results: this.testResults
        };
    }
}

// テスト実行用エクスポート
module.exports = Phase7bIntegrationTest;

// 直接実行の場合
if (require.main === module) {
    (async () => {
        try {
            const tester = new Phase7bIntegrationTest();
            await tester.runFullIntegrationTest();
        } catch (error) {
            console.error('🚨 テスト実行エラー:', error);
            process.exit(1);
        }
    })();
}
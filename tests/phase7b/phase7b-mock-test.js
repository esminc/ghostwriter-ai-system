const UnifiedDiaryGenerator = require('../../src/ai/unified-diary-generator');
const ContextGatherer = require('../../src/ai/context-gatherer');
const ErrorRecoverySystem = require('../../src/ai/error-recovery-system');

/**
 * Phase 7b モックテスト - API依存なしの構造テスト
 * 
 * OpenAI APIやMCP接続を使わずに、Phase 7bコンポーネントの
 * 基本的な構造と動作をテストします。
 */
class Phase7bMockTest {
    constructor() {
        this.testResults = [];
        this.testUser = 'mock-test-user';
    }

    /**
     * 🧪 モックテスト実行
     */
    async runMockTests() {
        console.log('🧪 Phase 7b モックテスト開始 (API非依存)');
        console.log('=====================================');
        
        const testSuites = [
            this.testContextGathererStructure.bind(this),
            this.testUnifiedDiaryGeneratorStructure.bind(this),
            this.testErrorRecoveryStructure.bind(this),
            this.testComponentIntegration.bind(this)
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
     * 🔍 ContextGatherer 構造テスト
     */
    async testContextGathererStructure() {
        console.log('\n🔍 ContextGatherer 構造テスト');
        console.log('-------------------------');
        
        // テスト1: クラス初期化
        try {
            console.log('📋 クラス初期化テスト');
            const gatherer = new ContextGatherer();
            
            if (gatherer.mcpManager && gatherer.userProfileCache && gatherer.capabilityCache) {
                console.log('✅ クラス初期化: PASS');
                this.recordTestResult('ContextGatherer_initialization', true);
            } else {
                throw new Error('必要なプロパティが欠如');
            }
        } catch (error) {
            console.log('❌ クラス初期化: FAIL -', error.message);
            this.recordTestResult('ContextGatherer_initialization', false, error.message);
        }
        
        // テスト2: 基本フォールバック
        try {
            console.log('🚨 基本フォールバックテスト');
            const gatherer = new ContextGatherer();
            const fallbackContext = await gatherer.gatherBasic(this.testUser);
            
            this.assertBasicContextStructure(fallbackContext);
            console.log('✅ 基本フォールバック: PASS');
            this.recordTestResult('ContextGatherer_basic_fallback', true);
        } catch (error) {
            console.log('❌ 基本フォールバック: FAIL -', error.message);
            this.recordTestResult('ContextGatherer_basic_fallback', false, error.message);
        }
        
        // テスト3: ユーティリティメソッド
        try {
            console.log('🔧 ユーティリティメソッドテスト');
            const gatherer = new ContextGatherer();
            
            const timeContext = gatherer.getTimeContext();
            const preferences = gatherer.getDefaultPreferences();
            const events = await gatherer.checkSpecialEvents();
            
            if (typeof timeContext === 'string' && 
                preferences.priorityChannels && 
                Array.isArray(events)) {
                console.log('✅ ユーティリティメソッド: PASS');
                this.recordTestResult('ContextGatherer_utilities', true);
            } else {
                throw new Error('ユーティリティメソッドの返値が不正');
            }
        } catch (error) {
            console.log('❌ ユーティリティメソッド: FAIL -', error.message);
            this.recordTestResult('ContextGatherer_utilities', false, error.message);
        }
    }

    /**
     * 🤖 UnifiedDiaryGenerator 構造テスト
     */
    async testUnifiedDiaryGeneratorStructure() {
        console.log('\n🤖 UnifiedDiaryGenerator 構造テスト');
        console.log('-------------------------------');
        
        // テスト1: クラス初期化と設定
        try {
            console.log('⚙️ 初期化と設定テスト');
            const generator = new UnifiedDiaryGenerator({
                autonomyLevel: 'medium',
                qualityThreshold: 0.8,
                timeoutMs: 60000
            });
            
            if (generator.config.autonomyLevel === 'medium' &&
                generator.config.qualityThreshold === 0.8 &&
                generator.contextGatherer && 
                generator.keywordExtractor) {
                console.log('✅ 初期化と設定: PASS');
                this.recordTestResult('UnifiedGenerator_initialization', true);
            } else {
                throw new Error('初期化または設定が不正');
            }
        } catch (error) {
            console.log('❌ 初期化と設定: FAIL -', error.message);
            this.recordTestResult('UnifiedGenerator_initialization', false, error.message);
        }
        
        // テスト2: プロンプト構築
        try {
            console.log('🎨 プロンプト構築テスト');
            const generator = new UnifiedDiaryGenerator();
            
            const mockContext = {
                userName: this.testUser,
                tools: [],
                availableData: {
                    userProfile: { displayName: 'Test User' },
                    preferences: generator.contextGatherer.getDefaultPreferences()
                },
                context: {
                    timeOfDay: 'morning',
                    specialEvents: []
                }
            };
            
            const prompt = generator.buildMasterPrompt(this.testUser, mockContext, 'テスト指示');
            
            if (prompt.includes(this.testUser) && 
                prompt.includes('テスト指示') && 
                prompt.includes('自律的') &&
                prompt.length > 500) {
                console.log('✅ プロンプト構築: PASS');
                this.recordTestResult('UnifiedGenerator_prompt_building', true);
            } else {
                throw new Error('プロンプト構築結果が不正');
            }
        } catch (error) {
            console.log('❌ プロンプト構築: FAIL -', error.message);
            this.recordTestResult('UnifiedGenerator_prompt_building', false, error.message);
        }
        
        // テスト3: 品質検証
        try {
            console.log('🔍 品質検証テスト');
            const generator = new UnifiedDiaryGenerator();
            
            const mockResult = {
                title: '【代筆】Test User: テスト日記',
                content: `## テスト日記

**やったこと**
今日はテストをしました。いろいろなことを確認して、システムが正しく動作することを確認しました。

**TIL (Today I Learned)**
テストの重要性について改めて学びました。

**こんな気分**
テストが成功して良い気分です。`
            };
            
            const mockContext = { userName: this.testUser };
            const validation = await generator.validateResult(mockResult, mockContext);
            
            if (validation.isValid && validation.qualityScore > 0) {
                console.log(`✅ 品質検証: PASS (品質スコア: ${validation.qualityScore})`);
                this.recordTestResult('UnifiedGenerator_quality_validation', true, `score: ${validation.qualityScore}`);
            } else {
                throw new Error(`品質検証失敗: ${validation.reasons?.join(', ')}`);
            }
        } catch (error) {
            console.log('❌ 品質検証: FAIL -', error.message);
            this.recordTestResult('UnifiedGenerator_quality_validation', false, error.message);
        }
        
        // テスト4: 緊急フォールバック
        try {
            console.log('🚨 緊急フォールバックテスト');
            const generator = new UnifiedDiaryGenerator();
            
            const emergencyContent = generator.generateEmergencyContent(this.testUser);
            const emergencyDiary = generator.generateEmergencyDiary(this.testUser, new Error('テストエラー'));
            
            if (emergencyContent.includes('やったこと') && 
                emergencyDiary.title.includes('【代筆】') &&
                emergencyDiary.metadata.generationMethod === 'emergency_fallback') {
                console.log('✅ 緊急フォールバック: PASS');
                this.recordTestResult('UnifiedGenerator_emergency', true);
            } else {
                throw new Error('緊急フォールバック結果が不正');
            }
        } catch (error) {
            console.log('❌ 緊急フォールバック: FAIL -', error.message);
            this.recordTestResult('UnifiedGenerator_emergency', false, error.message);
        }
    }

    /**
     * 🛡️ ErrorRecoverySystem 構造テスト
     */
    async testErrorRecoveryStructure() {
        console.log('\n🛡️ ErrorRecoverySystem 構造テスト');
        console.log('----------------------------');
        
        // テスト1: 初期化とストラテジー
        try {
            console.log('⚙️ 初期化テスト');
            const recovery = new ErrorRecoverySystem();
            
            if (recovery.recoveryStrategies && recovery.recoveryStrategies.size > 0 &&
                recovery.errorHistory && Array.isArray(recovery.errorHistory) &&
                recovery.learnedPatterns) {
                console.log('✅ 初期化: PASS');
                this.recordTestResult('ErrorRecovery_initialization', true);
            } else {
                throw new Error('初期化が不完全');
            }
        } catch (error) {
            console.log('❌ 初期化: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_initialization', false, error.message);
        }
        
        // テスト2: エラー分類
        try {
            console.log('🏷️ エラー分類テスト');
            const recovery = new ErrorRecoverySystem();
            
            const testErrors = [
                { error: new Error('OpenAI API error'), expected: 'ai_generation_error' },
                { error: new Error('MCP connection failed'), expected: 'mcp_connection_error' },
                { error: new Error('Quality validation failed'), expected: 'quality_validation_error' },
                { error: new Error('Network timeout'), expected: 'timeout_error' }
            ];
            
            let allCorrect = true;
            for (const test of testErrors) {
                const classified = recovery.classifyErrorType(test.error);
                if (classified !== test.expected) {
                    allCorrect = false;
                    break;
                }
            }
            
            if (allCorrect) {
                console.log('✅ エラー分類: PASS');
                this.recordTestResult('ErrorRecovery_classification', true);
            } else {
                throw new Error('エラー分類が不正確');
            }
        } catch (error) {
            console.log('❌ エラー分類: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_classification', false, error.message);
        }
        
        // テスト3: 重要度評価
        try {
            console.log('⚖️ 重要度評価テスト');
            const recovery = new ErrorRecoverySystem();
            
            const severityTest = recovery.assessErrorSeverity(
                new Error('test error'), 
                { autonomyLevel: 'high', availableData: null }
            );
            
            if (typeof severityTest === 'number' && severityTest >= 1 && severityTest <= 5) {
                console.log('✅ 重要度評価: PASS');
                this.recordTestResult('ErrorRecovery_severity', true);
            } else {
                throw new Error('重要度評価結果が不正');
            }
        } catch (error) {
            console.log('❌ 重要度評価: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_severity', false, error.message);
        }
        
        // テスト4: 戦略選択
        try {
            console.log('🔧 戦略選択テスト');
            const recovery = new ErrorRecoverySystem();
            
            const mockAnalysis = {
                type: 'ai_generation_error',
                severity: 3
            };
            
            const strategy = recovery.selectRecoveryStrategy(mockAnalysis, 1);
            
            if (strategy && strategy.name && strategy.executor) {
                console.log(`✅ 戦略選択: PASS (${strategy.name})`);
                this.recordTestResult('ErrorRecovery_strategy_selection', true);
            } else {
                throw new Error('戦略選択結果が不正');
            }
        } catch (error) {
            console.log('❌ 戦略選択: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_strategy_selection', false, error.message);
        }
    }

    /**
     * 🔗 コンポーネント統合テスト
     */
    async testComponentIntegration() {
        console.log('\n🔗 コンポーネント統合テスト');
        console.log('----------------------');
        
        // テスト1: ContextGatherer + UnifiedDiaryGenerator
        try {
            console.log('🔗 ContextGatherer ⇔ UnifiedDiaryGenerator');
            
            const gatherer = new ContextGatherer();
            const generator = new UnifiedDiaryGenerator();
            
            // 基本コンテキストの取得
            const context = await gatherer.gatherBasic(this.testUser);
            
            // プロンプト構築（API呼び出しなし）
            const prompt = generator.buildMasterPrompt(this.testUser, context, 'テスト統合');
            
            if (prompt.includes(this.testUser) && prompt.includes('テスト統合')) {
                console.log('✅ ContextGatherer ⇔ UnifiedDiaryGenerator: PASS');
                this.recordTestResult('Integration_context_generator', true);
            } else {
                throw new Error('統合プロンプト構築が失敗');
            }
        } catch (error) {
            console.log('❌ ContextGatherer ⇔ UnifiedDiaryGenerator: FAIL -', error.message);
            this.recordTestResult('Integration_context_generator', false, error.message);
        }
        
        // テスト2: ErrorRecoverySystem + UnifiedDiaryGenerator
        try {
            console.log('🔗 ErrorRecoverySystem ⇔ UnifiedDiaryGenerator');
            
            const recovery = new ErrorRecoverySystem();
            const generator = new UnifiedDiaryGenerator();
            
            // 緊急フォールバック実行
            const mockContext = {
                userName: this.testUser,
                instructions: 'テスト指示'
            };
            
            const mockAnalysis = {
                originalError: { message: 'テストエラー' },
                type: 'test_error'
            };
            
            const result = await recovery.executeEmergencyFallback(mockContext, mockAnalysis);
            
            if (result && result.success && result.result && result.result.title) {
                console.log('✅ ErrorRecoverySystem ⇔ UnifiedDiaryGenerator: PASS');
                this.recordTestResult('Integration_recovery_generator', true);
            } else {
                throw new Error('エラー回復統合が失敗');
            }
        } catch (error) {
            console.log('❌ ErrorRecoverySystem ⇔ UnifiedDiaryGenerator: FAIL -', error.message);
            this.recordTestResult('Integration_recovery_generator', false, error.message);
        }
        
        // テスト3: 設定継承とメタデータ整合性
        try {
            console.log('📊 設定継承とメタデータ整合性');
            
            const generator = new UnifiedDiaryGenerator({
                autonomyLevel: 'low',
                qualityThreshold: 0.75,
                temperature: 0.5,
                model: 'test-model'
            });
            
            const stats = generator.getStats();
            
            if (stats.autonomyLevel === 'low' && 
                stats.qualityThreshold === 0.75 &&
                stats.model === 'test-model' &&
                stats.version === '7b.1.0') {
                console.log('✅ 設定継承とメタデータ: PASS');
                this.recordTestResult('Integration_config_metadata', true);
            } else {
                throw new Error('設定継承またはメタデータが不正');
            }
        } catch (error) {
            console.log('❌ 設定継承とメタデータ: FAIL -', error.message);
            this.recordTestResult('Integration_config_metadata', false, error.message);
        }
    }

    /**
     * 🔍 アサーション
     */
    assertBasicContextStructure(context) {
        if (!context.userName) throw new Error('userNameが欠如');
        if (!context.timestamp) throw new Error('timestampが欠如'); 
        if (!context.availableData) throw new Error('availableDataが欠如');
        if (!context.availableData.fallbackMode) throw new Error('fallbackModeが欠如');
        if (!Array.isArray(context.tools)) throw new Error('toolsが配列でない');
        if (!context.context) throw new Error('contextが欠如');
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
        console.log('\n📈 Phase 7b モックテスト結果');
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
            const details = result.details ? ` (${result.details})` : '';
            console.log(`   ${status} ${result.testName}${details}`);
        });
        
        console.log('\n' + '='.repeat(50));
        
        if (successRate >= 90) {
            console.log('🎉 Phase 7b モックテスト: 優秀');
        } else if (successRate >= 75) {
            console.log('✅ Phase 7b モックテスト: 良好');
        } else if (successRate >= 60) {
            console.log('⚠️ Phase 7b モックテスト: 一部問題あり');
        } else {
            console.log('🚨 Phase 7b モックテスト: 重大な問題あり');
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
module.exports = Phase7bMockTest;

// 直接実行の場合
if (require.main === module) {
    (async () => {
        try {
            const tester = new Phase7bMockTest();
            await tester.runMockTests();
        } catch (error) {
            console.error('🚨 モックテスト実行エラー:', error);
            process.exit(1);
        }
    })();
}
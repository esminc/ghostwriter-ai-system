const UnifiedDiaryGeneratorMock = require('../../src/ai/unified-diary-generator-mock');
const ContextGatherer = require('../../src/ai/context-gatherer');
const ErrorRecoverySystem = require('../../src/ai/error-recovery-system');

/**
 * Phase 7b 構造テスト - API非依存の完全構造テスト
 */
class Phase7bStructureTest {
    constructor() {
        this.testResults = [];
        this.testUser = 'structure-test-user';
    }

    /**
     * 🧪 構造テスト実行
     */
    async runStructureTests() {
        console.log('🧪 Phase 7b 構造テスト開始 (完全API非依存)');
        console.log('======================================');
        
        const testSuites = [
            this.testContextGathererComplete.bind(this),
            this.testUnifiedDiaryGeneratorComplete.bind(this),
            this.testErrorRecoveryComplete.bind(this),
            this.testFullIntegration.bind(this)
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
     * 🔍 ContextGatherer 完全テスト
     */
    async testContextGathererComplete() {
        console.log('\n🔍 ContextGatherer 完全テスト');
        console.log('----------------------------');
        
        // テスト1: 初期化
        try {
            console.log('⚙️ 初期化テスト');
            const gatherer = new ContextGatherer();
            
            if (gatherer.mcpManager && 
                gatherer.userProfileCache instanceof Map &&
                gatherer.capabilityCache instanceof Map &&
                gatherer.cacheTimeout === 5 * 60 * 1000) {
                console.log('✅ 初期化: PASS');
                this.recordTestResult('ContextGatherer_init', true);
            } else {
                throw new Error('初期化プロパティが不正');
            }
        } catch (error) {
            console.log('❌ 初期化: FAIL -', error.message);
            this.recordTestResult('ContextGatherer_init', false, error.message);
        }
        
        // テスト2: 基本コンテキスト収集
        try {
            console.log('📋 基本コンテキスト収集テスト');
            const gatherer = new ContextGatherer();
            const context = await gatherer.gatherBasic(this.testUser);
            
            // 構造チェック
            if (context.userName === this.testUser &&
                context.timestamp &&
                context.availableData.fallbackMode === true &&
                Array.isArray(context.tools) &&
                context.tools.length === 0 &&
                context.context.timeOfDay) {
                console.log('✅ 基本コンテキスト収集: PASS');
                this.recordTestResult('ContextGatherer_basic', true);
            } else {
                throw new Error('基本コンテキスト構造が不正');
            }
        } catch (error) {
            console.log('❌ 基本コンテキスト収集: FAIL -', error.message);
            this.recordTestResult('ContextGatherer_basic', false, error.message);
        }
        
        // テスト3: ユーティリティメソッド
        try {
            console.log('🔧 ユーティリティメソッドテスト');
            const gatherer = new ContextGatherer();
            
            const timeContext = gatherer.getTimeContext();
            const preferences = gatherer.getDefaultPreferences();
            const events = await gatherer.checkSpecialEvents();
            const stats = gatherer.getGatheringStats();
            
            if (['early_morning', 'morning', 'afternoon', 'evening', 'night'].includes(timeContext) &&
                preferences.priorityChannels &&
                Array.isArray(preferences.priorityChannels) &&
                Array.isArray(events) &&
                typeof stats.cacheSize === 'number') {
                console.log('✅ ユーティリティメソッド: PASS');
                this.recordTestResult('ContextGatherer_utilities', true);
            } else {
                throw new Error('ユーティリティメソッドの返値が不正');
            }
        } catch (error) {
            console.log('❌ ユーティリティメソッド: FAIL -', error.message);
            this.recordTestResult('ContextGatherer_utilities', false, error.message);
        }
        
        // テスト4: キャッシュクリア
        try {
            console.log('🧹 キャッシュクリア機能テスト');
            const gatherer = new ContextGatherer();
            
            // キャッシュに何かを設定
            gatherer.capabilityCache.set('test', { data: 'test', timestamp: Date.now() });
            gatherer.userProfileCache.set('test', { data: 'test', timestamp: Date.now() });
            
            if (gatherer.capabilityCache.size > 0 && gatherer.userProfileCache.size > 0) {
                gatherer.clearCache();
                
                if (gatherer.capabilityCache.size === 0 && gatherer.userProfileCache.size === 0) {
                    console.log('✅ キャッシュクリア: PASS');
                    this.recordTestResult('ContextGatherer_cache_clear', true);
                } else {
                    throw new Error('キャッシュクリアが不完全');
                }
            } else {
                throw new Error('キャッシュ設定が失敗');
            }
        } catch (error) {
            console.log('❌ キャッシュクリア: FAIL -', error.message);
            this.recordTestResult('ContextGatherer_cache_clear', false, error.message);
        }
    }

    /**
     * 🤖 UnifiedDiaryGeneratorMock 完全テスト
     */
    async testUnifiedDiaryGeneratorComplete() {
        console.log('\n🤖 UnifiedDiaryGeneratorMock 完全テスト');
        console.log('-----------------------------------');
        
        // テスト1: 初期化と設定
        try {
            console.log('⚙️ 初期化と設定テスト');
            const generator = new UnifiedDiaryGeneratorMock({
                autonomyLevel: 'medium',
                qualityThreshold: 0.8,
                temperature: 0.5,
                model: 'test-model'
            });
            
            if (generator.config.autonomyLevel === 'medium' &&
                generator.config.qualityThreshold === 0.8 &&
                generator.config.temperature === 0.5 &&
                generator.config.model === 'test-model' &&
                generator.contextGatherer &&
                generator.keywordExtractor) {
                console.log('✅ 初期化と設定: PASS');
                this.recordTestResult('UnifiedGenerator_init', true);
            } else {
                throw new Error('初期化または設定が不正');
            }
        } catch (error) {
            console.log('❌ 初期化と設定: FAIL -', error.message);
            this.recordTestResult('UnifiedGenerator_init', false, error.message);
        }
        
        // テスト2: プロンプト構築
        try {
            console.log('🎨 プロンプト構築テスト');
            const generator = new UnifiedDiaryGeneratorMock();
            
            const mockContext = {
                userName: this.testUser,
                tools: [],
                availableData: {
                    userProfile: { displayName: 'Test User' },
                    preferences: generator.contextGatherer.getDefaultPreferences(),
                    fallbackMode: true
                },
                context: {
                    timeOfDay: 'morning'
                }
            };
            
            const prompt = generator.buildMasterPrompt(this.testUser, mockContext, 'テスト指示');
            
            if (prompt.includes(this.testUser) && 
                prompt.includes('テスト指示') && 
                prompt.includes('自律的') &&
                prompt.includes('【今回のミッション】') &&
                prompt.includes('【最終成果物の要求】') &&
                prompt.length > 500) {
                console.log('✅ プロンプト構築: PASS');
                this.recordTestResult('UnifiedGenerator_prompt', true);
            } else {
                throw new Error('プロンプト構築結果が不正');
            }
        } catch (error) {
            console.log('❌ プロンプト構築: FAIL -', error.message);
            this.recordTestResult('UnifiedGenerator_prompt', false, error.message);
        }
        
        // テスト3: モック日記生成
        try {
            console.log('📝 モック日記生成テスト');
            const generator = new UnifiedDiaryGeneratorMock({
                autonomyLevel: 'high',
                qualityThreshold: 0.8
            });
            
            const result = await generator.generateDiary(
                this.testUser,
                'Phase 7bテスト用の高品質な日記を生成してください'
            );
            
            if (result.title && 
                result.title.includes('【代筆】') &&
                result.content &&
                result.content.includes('やったこと') &&
                result.content.includes('TIL') &&
                result.content.includes('こんな気分') &&
                result.metadata &&
                result.metadata.generationMethod === 'unified_ai_mock' &&
                result.metadata.version === '7b.1.0-mock' &&
                result.metadata.qualityScore > 0.8) {
                console.log('✅ モック日記生成: PASS');
                console.log(`   品質スコア: ${result.metadata.qualityScore}`);
                console.log(`   処理時間: ${result.metadata.processingTime}ms`);
                this.recordTestResult('UnifiedGenerator_generation', true, `品質: ${result.metadata.qualityScore}`);
            } else {
                throw new Error('日記生成結果が不正');
            }
        } catch (error) {
            console.log('❌ モック日記生成: FAIL -', error.message);
            this.recordTestResult('UnifiedGenerator_generation', false, error.message);
        }
        
        // テスト4: 品質検証システム
        try {
            console.log('🔍 品質検証システムテスト');
            const generator = new UnifiedDiaryGeneratorMock();
            
            // 高品質コンテンツのテスト
            const goodResult = {
                title: '【代筆】Test User: 充実した一日',
                content: `## 今日の振り返り

**やったこと**
今日はPhase 7bのテストをやってみた。新しいアーキテクチャがかなり良い感じで、従来システムより格段に使いやすくなった。

**TIL (Today I Learned)**
モックテストの重要性について深く理解できた。実際のAPIを使わなくても構造の検証は十分可能。

**こんな気分**
新しい技術にワクワクしている。明日も楽しくなりそう。`
            };
            
            const validation = await generator.validateResult(goodResult, { userName: this.testUser });
            
            if (validation.isValid && validation.qualityScore >= 0.8) {
                console.log('✅ 品質検証（高品質）: PASS');
                
                // 低品質コンテンツのテスト
                const badResult = {
                    title: '短い',
                    content: '短すぎる内容'
                };
                
                const badValidation = await generator.validateResult(badResult, { userName: this.testUser });
                
                if (!badValidation.isValid && badValidation.reasons.length > 0) {
                    console.log('✅ 品質検証（低品質検出）: PASS');
                    this.recordTestResult('UnifiedGenerator_quality', true);
                } else {
                    throw new Error('低品質コンテンツを検出できない');
                }
            } else {
                throw new Error('高品質コンテンツの検証が失敗');
            }
        } catch (error) {
            console.log('❌ 品質検証システム: FAIL -', error.message);
            this.recordTestResult('UnifiedGenerator_quality', false, error.message);
        }
        
        // テスト5: 緊急フォールバック
        try {
            console.log('🚨 緊急フォールバックテスト');
            const generator = new UnifiedDiaryGeneratorMock();
            
            const emergencyResult = generator.generateEmergencyDiary(this.testUser, new Error('テストエラー'));
            
            if (emergencyResult.title.includes('【代筆】') &&
                emergencyResult.content.includes('やったこと') &&
                emergencyResult.metadata.generationMethod === 'mock_emergency_fallback' &&
                emergencyResult.metadata.fallbackUsed === true) {
                console.log('✅ 緊急フォールバック: PASS');
                this.recordTestResult('UnifiedGenerator_emergency', true);
            } else {
                throw new Error('緊急フォールバック結果が不正');
            }
        } catch (error) {
            console.log('❌ 緊急フォールバック: FAIL -', error.message);
            this.recordTestResult('UnifiedGenerator_emergency', false, error.message);
        }
        
        // テスト6: 統計情報
        try {
            console.log('📊 統計情報テスト');
            const generator = new UnifiedDiaryGeneratorMock({
                autonomyLevel: 'low',
                qualityThreshold: 0.75,
                model: 'test-model'
            });
            
            const stats = generator.getStats();
            
            if (stats.version === '7b.1.0-mock' &&
                stats.autonomyLevel === 'low' &&
                stats.qualityThreshold === 0.75 &&
                stats.model === 'test-model') {
                console.log('✅ 統計情報: PASS');
                this.recordTestResult('UnifiedGenerator_stats', true);
            } else {
                throw new Error('統計情報が不正');
            }
        } catch (error) {
            console.log('❌ 統計情報: FAIL -', error.message);
            this.recordTestResult('UnifiedGenerator_stats', false, error.message);
        }
    }

    /**
     * 🛡️ ErrorRecoverySystem 完全テスト
     */
    async testErrorRecoveryComplete() {
        console.log('\n🛡️ ErrorRecoverySystem 完全テスト');
        console.log('------------------------------');
        
        // テスト1: 初期化とストラテジー設定
        try {
            console.log('⚙️ 初期化テスト');
            const recovery = new ErrorRecoverySystem();
            
            if (recovery.recoveryStrategies instanceof Map &&
                recovery.recoveryStrategies.size >= 4 &&
                Array.isArray(recovery.errorHistory) &&
                recovery.learnedPatterns instanceof Map &&
                recovery.maxRecoveryAttempts === 3) {
                console.log('✅ 初期化: PASS');
                this.recordTestResult('ErrorRecovery_init', true);
            } else {
                throw new Error('初期化が不完全');
            }
        } catch (error) {
            console.log('❌ 初期化: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_init', false, error.message);
        }
        
        // テスト2: エラー分析
        try {
            console.log('🔍 エラー分析テスト');
            const recovery = new ErrorRecoverySystem();
            
            const testError = new Error('OpenAI API rate limit exceeded');
            const mockContext = {
                userName: this.testUser,
                autonomyLevel: 'high',
                availableData: { test: 'data' }
            };
            
            const analysis = await recovery.analyzeError(testError, mockContext);
            
            if (analysis.id &&
                analysis.timestamp &&
                analysis.type === 'ai_generation_error' &&
                typeof analysis.severity === 'number' &&
                analysis.originalError.message === testError.message &&
                analysis.context.userName === this.testUser) {
                console.log('✅ エラー分析: PASS');
                this.recordTestResult('ErrorRecovery_analysis', true);
            } else {
                throw new Error('エラー分析結果が不正');
            }
        } catch (error) {
            console.log('❌ エラー分析: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_analysis', false, error.message);
        }
        
        // テスト3: エラー分類の正確性
        try {
            console.log('🏷️ エラー分類正確性テスト');
            const recovery = new ErrorRecoverySystem();
            
            const testCases = [
                { error: new Error('OpenAI API error'), expected: 'ai_generation_error' },
                { error: new Error('MCP connection timeout'), expected: 'mcp_connection_error' },
                { error: new Error('Quality validation failed'), expected: 'quality_validation_error' },
                { error: new Error('Request timeout exceeded'), expected: 'timeout_error' },
                { error: new Error('JSON parsing failed'), expected: 'data_processing_error' },
                { error: new Error('Network fetch failed'), expected: 'network_error' },
                { error: new Error('Unknown mysterious error'), expected: 'unknown_error' }
            ];
            
            let correct = 0;
            for (const testCase of testCases) {
                const classified = recovery.classifyErrorType(testCase.error);
                if (classified === testCase.expected) {
                    correct++;
                }
            }
            
            const accuracy = correct / testCases.length;
            if (accuracy >= 0.8) {
                console.log(`✅ エラー分類正確性: PASS (${accuracy * 100}%)`);
                this.recordTestResult('ErrorRecovery_classification', true, `accuracy: ${accuracy}`);
            } else {
                throw new Error(`分類精度が低い: ${accuracy * 100}%`);
            }
        } catch (error) {
            console.log('❌ エラー分類正確性: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_classification', false, error.message);
        }
        
        // テスト4: 重要度評価
        try {
            console.log('⚖️ 重要度評価テスト');
            const recovery = new ErrorRecoverySystem();
            
            const lowSeverity = recovery.assessErrorSeverity(
                new Error('minor issue'), 
                { autonomyLevel: 'low', availableData: { some: 'data' } }
            );
            
            const highSeverity = recovery.assessErrorSeverity(
                new Error('unknown critical error'), 
                { autonomyLevel: 'high', availableData: null }
            );
            
            if (lowSeverity >= 1 && lowSeverity <= 5 &&
                highSeverity >= 1 && highSeverity <= 5 &&
                highSeverity > lowSeverity) {
                console.log(`✅ 重要度評価: PASS (低:${lowSeverity}, 高:${highSeverity})`);
                this.recordTestResult('ErrorRecovery_severity', true);
            } else {
                throw new Error('重要度評価が不正');
            }
        } catch (error) {
            console.log('❌ 重要度評価: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_severity', false, error.message);
        }
        
        // テスト5: 戦略選択と実行
        try {
            console.log('🔧 戦略選択と実行テスト');
            const recovery = new ErrorRecoverySystem();
            
            const mockAnalysis = {
                type: 'ai_generation_error',
                severity: 3,
                context: { autonomyLevel: 'high' }
            };
            
            for (let attempt = 1; attempt <= 3; attempt++) {
                const strategy = recovery.selectRecoveryStrategy(mockAnalysis, attempt);
                
                if (!strategy || !strategy.name || !strategy.executor) {
                    throw new Error(`戦略選択失敗: attempt ${attempt}`);
                }
            }
            
            console.log('✅ 戦略選択と実行: PASS');
            this.recordTestResult('ErrorRecovery_strategy', true);
        } catch (error) {
            console.log('❌ 戦略選択と実行: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_strategy', false, error.message);
        }
        
        // テスト6: 学習機能
        try {
            console.log('🧠 学習機能テスト');
            const recovery = new ErrorRecoverySystem();
            
            const mockAnalysis = {
                type: 'ai_generation_error',
                originalError: { message: 'test error' },
                context: { autonomyLevel: 'high' }
            };
            
            const mockStrategy = { name: 'test_strategy' };
            
            recovery.learnFromSuccess(mockAnalysis, mockStrategy);
            
            const patternKey = recovery.generatePatternKey(mockAnalysis);
            const learnedPattern = recovery.checkLearnedPatterns(mockAnalysis);
            
            if (learnedPattern &&
                learnedPattern.successfulStrategy === 'test_strategy' &&
                learnedPattern.errorType === 'ai_generation_error') {
                console.log('✅ 学習機能: PASS');
                this.recordTestResult('ErrorRecovery_learning', true);
            } else {
                throw new Error('学習機能が正しく動作しない');
            }
        } catch (error) {
            console.log('❌ 学習機能: FAIL -', error.message);
            this.recordTestResult('ErrorRecovery_learning', false, error.message);
        }
    }

    /**
     * 🔗 完全統合テスト
     */
    async testFullIntegration() {
        console.log('\n🔗 完全統合テスト');
        console.log('----------------');
        
        // テスト1: エンドツーエンド正常フロー
        try {
            console.log('🌊 エンドツーエンド正常フローテスト');
            
            const generator = new UnifiedDiaryGeneratorMock({
                autonomyLevel: 'medium',
                qualityThreshold: 0.8
            });
            
            const startTime = Date.now();
            const result = await generator.generateDiary(
                this.testUser,
                'Phase 7b完全統合テストのための包括的で高品質な日記を生成してください。技術的な内容と日常的な体験をバランスよく含め、人間らしい自然な文体で書いてください。'
            );
            const totalTime = Date.now() - startTime;
            
            // 包括的な結果検証
            if (result.title && result.title.includes('【代筆】') &&
                result.content && result.content.length >= 400 &&
                result.content.includes('やったこと') &&
                result.content.includes('TIL') &&
                result.content.includes('こんな気分') &&
                result.category && result.category.includes('AI代筆日記') &&
                result.metadata &&
                result.metadata.generationMethod === 'unified_ai_mock' &&
                result.metadata.qualityScore >= 0.8 &&
                result.metadata.autonomyLevel === 'medium' &&
                result.metadata.version === '7b.1.0-mock') {
                
                console.log('✅ エンドツーエンド正常フロー: PASS');
                console.log(`   処理時間: ${totalTime}ms`);
                console.log(`   品質スコア: ${result.metadata.qualityScore}`);
                console.log(`   文字数: ${result.content.length}字`);
                console.log(`   タイトル: ${result.title}`);
                
                this.recordTestResult('FullIntegration_normal_flow', true, {
                    time: totalTime,
                    quality: result.metadata.qualityScore,
                    length: result.content.length
                });
            } else {
                throw new Error('エンドツーエンド結果が不正');
            }
        } catch (error) {
            console.log('❌ エンドツーエンド正常フロー: FAIL -', error.message);
            this.recordTestResult('FullIntegration_normal_flow', false, error.message);
        }
        
        // テスト2: 異なる自律性レベルでの動作
        try {
            console.log('🎛️ 自律性レベル別動作テスト');
            
            const autonomyLevels = ['high', 'medium', 'low'];
            let allPassed = true;
            const results = {};
            
            for (const level of autonomyLevels) {
                const generator = new UnifiedDiaryGeneratorMock({
                    autonomyLevel: level,
                    qualityThreshold: 0.7
                });
                
                const result = await generator.generateDiary(
                    this.testUser,
                    `${level}自律性レベルでのテスト実行`
                );
                
                if (result.metadata.autonomyLevel === level &&
                    result.title && result.content) {
                    results[level] = {
                        quality: result.metadata.qualityScore,
                        length: result.content.length
                    };
                } else {
                    allPassed = false;
                    break;
                }
            }
            
            if (allPassed) {
                console.log('✅ 自律性レベル別動作: PASS');
                console.log(`   高: 品質${results.high.quality}, ${results.high.length}字`);
                console.log(`   中: 品質${results.medium.quality}, ${results.medium.length}字`);
                console.log(`   低: 品質${results.low.quality}, ${results.low.length}字`);
                this.recordTestResult('FullIntegration_autonomy_levels', true, results);
            } else {
                throw new Error('自律性レベル別動作に問題');
            }
        } catch (error) {
            console.log('❌ 自律性レベル別動作: FAIL -', error.message);
            this.recordTestResult('FullIntegration_autonomy_levels', false, error.message);
        }
        
        // テスト3: 設定変更とその反映
        try {
            console.log('⚙️ 設定変更反映テスト');
            
            const generator = new UnifiedDiaryGeneratorMock({
                autonomyLevel: 'high',
                qualityThreshold: 0.9,
                temperature: 0.7
            });
            
            // 初期設定確認
            let stats = generator.getStats();
            if (stats.autonomyLevel !== 'high' || stats.qualityThreshold !== 0.9) {
                throw new Error('初期設定が正しく反映されていない');
            }
            
            // 設定変更
            generator.updateConfig({
                autonomyLevel: 'low',
                qualityThreshold: 0.6,
                temperature: 0.3
            });
            
            // 変更後確認
            stats = generator.getStats();
            if (stats.autonomyLevel === 'low' && stats.qualityThreshold === 0.6) {
                console.log('✅ 設定変更反映: PASS');
                this.recordTestResult('FullIntegration_config_changes', true);
            } else {
                throw new Error('設定変更が正しく反映されていない');
            }
        } catch (error) {
            console.log('❌ 設定変更反映: FAIL -', error.message);
            this.recordTestResult('FullIntegration_config_changes', false, error.message);
        }
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
        console.log('\n📈 Phase 7b 構造テスト結果');
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
            const details = result.details ? ` (${typeof result.details === 'object' ? JSON.stringify(result.details) : result.details})` : '';
            console.log(`   ${status} ${result.testName}${details}`);
        });
        
        console.log('\n' + '='.repeat(50));
        
        if (successRate >= 95) {
            console.log('🎉 Phase 7b 構造テスト: 優秀 - 完璧な実装');
        } else if (successRate >= 85) {
            console.log('✅ Phase 7b 構造テスト: 良好 - 高品質な実装');
        } else if (successRate >= 70) {
            console.log('⚠️ Phase 7b 構造テスト: 可 - 改善の余地あり');
        } else {
            console.log('🚨 Phase 7b 構造テスト: 重大な問題あり - 要修正');
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
module.exports = Phase7bStructureTest;

// 直接実行の場合
if (require.main === module) {
    (async () => {
        try {
            const tester = new Phase7bStructureTest();
            await tester.runStructureTests();
        } catch (error) {
            console.error('🚨 構造テスト実行エラー:', error);
            process.exit(1);
        }
    })();
}
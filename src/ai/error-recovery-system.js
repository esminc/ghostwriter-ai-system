const UnifiedDiaryGenerator = require('./unified-diary-generator');

/**
 * Phase 7b: ErrorRecoverySystem - 包括的エラー回復システム
 * 
 * 設計思想: 自律的3段階回復戦略
 * 1. 即座の対応: エラータイプ別の最適戦略実行
 * 2. 学習活用: 過去の成功パターンからの回復
 * 3. 緊急対応: 全失敗時の最低品質保証
 */
class ErrorRecoverySystem {
    constructor() {
        this.recoveryStrategies = new Map();
        this.errorHistory = [];
        this.learnedPatterns = new Map();
        this.maxRecoveryAttempts = 3;
        this.errorIdCounter = 0;
        
        this.initializeRecoveryStrategies();
    }

    /**
     * 🚨 メインエラーハンドリング - Phase 7b統合回復
     */
    async handleError(error, context) {
        console.log(`🚨 ErrorRecoverySystem: エラー検出 - ${error.message}`);
        const startTime = Date.now();
        
        try {
            // Step 1: エラー分析
            const errorAnalysis = await this.analyzeError(error, context);
            this.recordError(errorAnalysis);
            
            // Step 2: 学習済みパターンチェック
            const learnedRecovery = this.checkLearnedPatterns(errorAnalysis);
            if (learnedRecovery) {
                console.log('🧠 学習済みパターンで回復試行');
                const result = await this.executeLearnedRecovery(learnedRecovery, context);
                if (result.success) {
                    console.log('✅ 学習パターンによる回復成功');
                    return result;
                }
            }
            
            // Step 3: 段階的回復戦略実行
            for (let attempt = 1; attempt <= this.maxRecoveryAttempts; attempt++) {
                console.log(`🔄 回復試行 ${attempt}/${this.maxRecoveryAttempts}`);
                
                try {
                    const strategy = this.selectRecoveryStrategy(errorAnalysis, attempt);
                    const result = await this.executeRecoveryStrategy(strategy, context, errorAnalysis);
                    
                    if (result.success) {
                        console.log(`✅ 回復成功: ${strategy.name} (${Date.now() - startTime}ms)`);
                        this.learnFromSuccess(errorAnalysis, strategy);
                        return result;
                    }
                    
                } catch (recoveryError) {
                    console.log(`❌ 回復試行${attempt}失敗: ${recoveryError.message}`);
                    if (attempt === this.maxRecoveryAttempts) {
                        return await this.executeEmergencyFallback(context, errorAnalysis);
                    }
                }
            }
            
            // Step 4: 緊急フォールバック
            return await this.executeEmergencyFallback(context, errorAnalysis);
            
        } catch (systemError) {
            console.error('🚨 ErrorRecoverySystem自体のエラー:', systemError);
            return await this.generateCriticalFallback(context, error);
        }
    }

    /**
     * 🔍 包括的エラー分析
     */
    async analyzeError(error, context) {
        const analysis = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            type: this.classifyErrorType(error),
            severity: this.assessErrorSeverity(error, context),
            originalError: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context: {
                userName: context.userName,
                phase: 'phase7b',
                activeProcess: context.activeProcess || 'unified_diary_generation',
                availableData: context.availableData || {},
                autonomyLevel: context.autonomyLevel || 'high'
            },
            systemState: await this.captureSystemState(),
            suggestedStrategies: []
        };
        
        // エラータイプ別詳細分析
        if (analysis.type === 'ai_generation_error') {
            analysis.aiSpecific = await this.analyzeAIError(error, context);
        } else if (analysis.type === 'mcp_connection_error') {
            analysis.mcpSpecific = await this.analyzeMCPError(error, context);
        } else if (analysis.type === 'quality_validation_error') {
            analysis.qualitySpecific = await this.analyzeQualityError(error, context);
        }
        
        return analysis;
    }

    /**
     * 🏷️ エラータイプ分類
     */
    classifyErrorType(error) {
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();
        
        if (message.includes('openai') || message.includes('ai') || message.includes('generation') || name.includes('ai')) {
            return 'ai_generation_error';
        }
        if (message.includes('mcp') || message.includes('connection') || message.includes('tool')) {
            return 'mcp_connection_error';
        }
        if (message.includes('quality') || message.includes('validation') || name.includes('quality')) {
            return 'quality_validation_error';
        }
        if (message.includes('timeout') || message.includes('time')) {
            return 'timeout_error';
        }
        if (message.includes('data') || message.includes('parsing') || message.includes('json')) {
            return 'data_processing_error';
        }
        if (message.includes('network') || message.includes('fetch') || message.includes('http')) {
            return 'network_error';
        }
        
        return 'unknown_error';
    }

    /**
     * ⚖️ エラー重要度評価
     */
    assessErrorSeverity(error, context) {
        let severity = 0;
        
        // エラータイプによる基本重要度
        const typeSeverity = {
            'ai_generation_error': 3,
            'mcp_connection_error': 4,
            'quality_validation_error': 2,
            'timeout_error': 3,
            'data_processing_error': 2,
            'network_error': 3,
            'unknown_error': 5
        };
        
        severity += typeSeverity[this.classifyErrorType(error)] || 3;
        
        // コンテキスト調整
        if (!context.availableData) severity += 2;
        if (context.autonomyLevel === 'high') severity += 1; // 高自律モードでのエラーは重要
        if (this.isRepeatedError(error)) severity += 1;
        
        return Math.min(severity, 5);
    }

    /**
     * 🔧 回復戦略の初期化
     */
    initializeRecoveryStrategies() {
        // AI生成エラーの回復戦略
        this.recoveryStrategies.set('ai_generation_error', [
            {
                name: 'simplify_prompt',
                description: 'プロンプト簡素化と保守的設定での再試行',
                executor: this.simplifyPromptAndRetry.bind(this),
                successRate: 0.7
            },
            {
                name: 'fallback_model',
                description: '代替モデルでの再試行',
                executor: this.fallbackModelRetry.bind(this),
                successRate: 0.6
            },
            {
                name: 'reduced_autonomy',
                description: '自律性レベルを下げて再試行',
                executor: this.reducedAutonomyRetry.bind(this),
                successRate: 0.8
            }
        ]);

        // MCP接続エラーの回復戦略
        this.recoveryStrategies.set('mcp_connection_error', [
            {
                name: 'reconnect_mcp',
                description: 'MCP接続の再確立',
                executor: this.reconnectMCP.bind(this),
                successRate: 0.6
            },
            {
                name: 'bypass_mcp',
                description: 'MCPを使わずに実行',
                executor: this.bypassMCP.bind(this),
                successRate: 0.9
            },
            {
                name: 'cached_data_fallback',
                description: 'キャッシュデータでの継続',
                executor: this.useCachedData.bind(this),
                successRate: 0.5
            }
        ]);

        // 品質検証エラーの回復戦略
        this.recoveryStrategies.set('quality_validation_error', [
            {
                name: 'improve_content',
                description: 'コンテンツ品質の改善',
                executor: this.improveContent.bind(this),
                successRate: 0.8
            },
            {
                name: 'lower_threshold',
                description: '品質閾値を一時的に下げる',
                executor: this.lowerQualityThreshold.bind(this),
                successRate: 0.9
            }
        ]);

        // タイムアウトエラーの回復戦略
        this.recoveryStrategies.set('timeout_error', [
            {
                name: 'extend_timeout',
                description: 'タイムアウト時間延長',
                executor: this.extendTimeout.bind(this),
                successRate: 0.7
            },
            {
                name: 'simplify_process',
                description: 'プロセス簡素化',
                executor: this.simplifyProcess.bind(this),
                successRate: 0.8
            }
        ]);
    }

    async useCachedData(context, errorAnalysis) {
        return { success: false, error: 'キャッシュデータ回復は未実装' };
    }

    async extendTimeout(context, errorAnalysis) {
        return { success: false, error: 'タイムアウト延長は未実装' };
    }

    async simplifyProcess(context, errorAnalysis) {
        return { success: false, error: 'プロセス簡素化は未実装' };
    }

    /**
     * 🔄 回復戦略選択
     */
    selectRecoveryStrategy(errorAnalysis, attemptNumber) {
        const strategies = this.recoveryStrategies.get(errorAnalysis.type) || [];
        
        if (strategies.length === 0) {
            return this.getGenericRecoveryStrategy(attemptNumber);
        }
        
        // 試行回数と成功率を考慮して戦略選択
        const strategyIndex = Math.min(attemptNumber - 1, strategies.length - 1);
        return strategies[strategyIndex];
    }

    /**
     * 🔧 具体的回復戦略の実装
     */
    async simplifyPromptAndRetry(context, errorAnalysis) {
        console.log('🔧 プロンプト簡素化による回復');
        
        try {
            const simplifiedInstructions = this.simplifyInstructions(context.instructions);
            const generator = new UnifiedDiaryGenerator({
                autonomyLevel: 'low',
                temperature: 0.3,
                qualityThreshold: 0.8
            });
            
            const result = await generator.generateDiary(
                context.userName,
                simplifiedInstructions
            );
            
            return {
                success: true,
                result: result,
                method: 'simplified_prompt',
                qualityReduction: 0.1
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async fallbackModelRetry(context, errorAnalysis) {
        console.log('🔧 代替モデルでの再試行');
        
        try {
            const generator = new UnifiedDiaryGenerator({
                model: 'gpt-3.5-turbo',
                autonomyLevel: context.autonomyLevel || 'medium',
                qualityThreshold: 0.85
            });
            
            const result = await generator.generateDiary(
                context.userName,
                context.instructions
            );
            
            return {
                success: true,
                result: result,
                method: 'fallback_model',
                qualityReduction: 0.05
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async reducedAutonomyRetry(context, errorAnalysis) {
        console.log('🔧 自律性レベル低下での再試行');
        
        try {
            const lowerLevel = this.getLowerAutonomyLevel(context.autonomyLevel);
            const generator = new UnifiedDiaryGenerator({
                autonomyLevel: lowerLevel,
                qualityThreshold: 0.9
            });
            
            const result = await generator.generateDiary(
                context.userName,
                context.instructions
            );
            
            return {
                success: true,
                result: result,
                method: 'reduced_autonomy',
                qualityReduction: 0.05
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async reconnectMCP(context, errorAnalysis) {
        console.log('🔧 MCP接続再確立');
        
        try {
            const MCPConnectionManager = require('../mcp-integration/mcp-connection-manager');
            const mcpManager = new MCPConnectionManager();
            await mcpManager.forceReconnectAll();
            
            // 再接続後の再試行
            const generator = new UnifiedDiaryGenerator();
            const result = await generator.generateDiary(
                context.userName,
                context.instructions
            );
            
            return {
                success: true,
                result: result,
                method: 'mcp_reconnect',
                qualityReduction: 0
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async bypassMCP(context, errorAnalysis) {
        console.log('🔧 MCP迂回での実行');
        
        try {
            // MCPを使わない緊急生成
            const generator = new UnifiedDiaryGenerator({
                autonomyLevel: 'low' // MCPなしでは自律性を下げる
            });
            
            // 基本コンテキストのみで実行
            const basicContext = {
                ...context,
                availableData: {
                    ...context.availableData,
                    fallbackMode: true,
                    mcpBypass: true
                }
            };
            
            const result = await generator.generateDiary(
                context.userName,
                context.instructions || "基本的な日記を生成してください"
            );
            
            return {
                success: true,
                result: result,
                method: 'mcp_bypass',
                qualityReduction: 0.2
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async improveContent(context, errorAnalysis) {
        console.log('🔧 コンテンツ品質改善');
        
        try {
            // 品質問題を特定して改善
            const qualityIssues = errorAnalysis.qualitySpecific?.issues || [];
            
            if (qualityIssues.includes('mechanical_language')) {
                // 機械的表現の修正を試行
                const generator = new UnifiedDiaryGenerator({
                    temperature: 0.9, // より創造的に
                    autonomyLevel: 'high'
                });
                
                const improvedResult = await generator.generateDiary(
                    context.userName,
                    `${context.instructions}\n\n特に人間らしい自然な表現で書いてください。機械的な表現は完全に避けてください。`
                );
                
                return {
                    success: true,
                    result: improvedResult,
                    method: 'content_improvement',
                    qualityReduction: 0
                };
            }
            
            return { success: false, error: '改善戦略が特定できませんでした' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async lowerQualityThreshold(context, errorAnalysis) {
        console.log('🔧 品質閾値を一時的に低下');
        
        try {
            const generator = new UnifiedDiaryGenerator({
                qualityThreshold: 0.7, // 通常0.95から0.7に低下
                autonomyLevel: context.autonomyLevel
            });
            
            const result = await generator.generateDiary(
                context.userName,
                context.instructions
            );
            
            return {
                success: true,
                result: result,
                method: 'lowered_threshold',
                qualityReduction: 0.25,
                warning: '品質基準を一時的に下げて生成しました'
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 🚨 緊急フォールバック実行
     */
    async executeEmergencyFallback(context, errorAnalysis) {
        console.log('🚨 緊急フォールバック実行');
        
        try {
            const emergencyGenerator = new EmergencyDiaryGenerator();
            const result = await emergencyGenerator.generateBasicDiary(
                context.userName,
                {
                    reason: 'error_recovery_failed',
                    originalError: errorAnalysis.originalError.message,
                    timestamp: new Date().toISOString(),
                    errorType: errorAnalysis.type
                }
            );
            
            return {
                success: true,
                result: result,
                method: 'emergency_fallback',
                qualityReduction: 0.4,
                warning: '緊急モードで生成されました'
            };
            
        } catch (emergencyError) {
            console.error('🚨 緊急フォールバックも失敗:', emergencyError);
            return await this.generateCriticalFallback(context, errorAnalysis.originalError);
        }
    }

    /**
     * 🆘 最終クリティカルフォールバック
     */
    async generateCriticalFallback(context, originalError) {
        console.log('🆘 最終クリティカルフォールバック');
        
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
        });
        
        const criticalContent = `## ${today}の振り返り

**やったこと**
システムに問題が発生したため、今日の詳細な振り返りを生成することができませんでした。

**TIL (Today I Learned)**
システムの復旧作業について学ぶ機会がありました。

**こんな気分**
システムが正常に戻ることを願っています。

---
**システム情報**: 
- エラー: ${originalError.message}
- 発生時刻: ${new Date().toISOString()}
- 回復試行: 失敗`;

        return {
            success: true,
            result: {
                title: `【代筆】${context.userName}: ${today.split('（')[0]}の振り返り`,
                content: criticalContent,
                category: 'AI代筆日記/システムエラー',
                metadata: {
                    generationMethod: 'critical_fallback',
                    qualityScore: 0.3,
                    warning: 'システムエラーのため最小限の内容で生成'
                }
            },
            method: 'critical_fallback',
            qualityReduction: 0.7,
            criticalFailure: true
        };
    }

    /**
     * 🧠 成功パターンからの学習
     */
    learnFromSuccess(errorAnalysis, successfulStrategy) {
        const pattern = {
            errorType: errorAnalysis.type,
            errorMessage: errorAnalysis.originalError.message.substring(0, 100),
            successfulStrategy: successfulStrategy.name,
            context: {
                autonomyLevel: errorAnalysis.context.autonomyLevel,
                severity: errorAnalysis.severity
            },
            timestamp: new Date().toISOString()
        };
        
        const patternKey = this.generatePatternKey(errorAnalysis);
        this.learnedPatterns.set(patternKey, pattern);
        
        console.log(`🧠 学習記録: ${patternKey} -> ${successfulStrategy.name}`);
    }

    checkLearnedPatterns(errorAnalysis) {
        const patternKey = this.generatePatternKey(errorAnalysis);
        return this.learnedPatterns.get(patternKey);
    }

    generatePatternKey(errorAnalysis) {
        return `${errorAnalysis.type}_${errorAnalysis.context.autonomyLevel}_${errorAnalysis.severity}`;
    }

    /**
     * 🔧 ユーティリティメソッド
     */
    simplifyInstructions(instructions) {
        return instructions?.replace(/具体的に|詳細に|細かく/g, '') || "簡潔な日記を生成してください";
    }

    getLowerAutonomyLevel(currentLevel) {
        const levels = ['high', 'medium', 'low'];
        const currentIndex = levels.indexOf(currentLevel);
        return levels[Math.min(currentIndex + 1, levels.length - 1)];
    }

    isRepeatedError(error) {
        const recentErrors = this.errorHistory.slice(-5);
        return recentErrors.some(e => e.originalError.message === error.message);
    }

    generateErrorId() {
        return `ERR_${Date.now()}_${++this.errorIdCounter}`;
    }

    recordError(errorAnalysis) {
        this.errorHistory.push(errorAnalysis);
        // 履歴サイズ制限（最新100件）
        if (this.errorHistory.length > 100) {
            this.errorHistory = this.errorHistory.slice(-100);
        }
    }

    async captureSystemState() {
        return {
            timestamp: new Date().toISOString(),
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            nodeVersion: process.version
        };
    }

    async analyzeAIError(error, context) {
        return {
            modelUsed: context.model || 'gpt-4o-mini',
            promptLength: context.instructions?.length || 0,
            autonomyLevel: context.autonomyLevel || 'unknown'
        };
    }

    async analyzeMCPError(error, context) {
        return {
            availableConnections: Object.keys(context.availableData || {}),
            lastMCPActivity: Date.now()
        };
    }

    async analyzeQualityError(error, context) {
        return {
            issues: error.message.includes('機械的') ? ['mechanical_language'] : ['unknown_quality_issue'],
            qualityScore: context.qualityScore || 0
        };
    }

    getGenericRecoveryStrategy(attemptNumber) {
        return {
            name: 'generic_retry',
            description: `汎用回復戦略 #${attemptNumber}`,
            executor: this.genericRetry.bind(this)
        };
    }

    async genericRetry(context, errorAnalysis) {
        return { success: false, error: '汎用回復戦略は実装されていません' };
    }

    async executeLearnedRecovery(learnedPattern, context) {
        console.log(`🧠 学習パターン適用: ${learnedPattern.successfulStrategy}`);
        
        const strategies = this.recoveryStrategies.get(learnedPattern.errorType) || [];
        const strategy = strategies.find(s => s.name === learnedPattern.successfulStrategy);
        
        if (strategy) {
            return await strategy.executor(context, { type: learnedPattern.errorType });
        }
        
        return { success: false, error: '学習済み戦略が見つかりません' };
    }

    async executeRecoveryStrategy(strategy, context, errorAnalysis) {
        return await strategy.executor(context, errorAnalysis);
    }

    /**
     * 📊 エラー統計とレポート
     */
    generateErrorReport() {
        const recent = this.errorHistory.slice(-20);
        
        return {
            totalErrors: this.errorHistory.length,
            recentErrors: recent.length,
            errorTypes: this.groupErrorsByType(recent),
            recoveryRate: this.calculateRecoveryRate(recent),
            learnedPatterns: this.learnedPatterns.size,
            mostCommonErrors: this.findMostCommonErrors(recent)
        };
    }

    groupErrorsByType(errors) {
        const grouped = {};
        errors.forEach(error => {
            grouped[error.type] = (grouped[error.type] || 0) + 1;
        });
        return grouped;
    }

    calculateRecoveryRate(errors) {
        const recoveredErrors = errors.filter(e => e.recovered);
        return errors.length > 0 ? recoveredErrors.length / errors.length : 0;
    }

    findMostCommonErrors(errors) {
        const errorCounts = {};
        errors.forEach(error => {
            const key = error.originalError.message.substring(0, 50);
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        });
        
        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([error, count]) => ({ error, count }));
    }
}

/**
 * 緊急日記生成器
 */
class EmergencyDiaryGenerator {
    async generateBasicDiary(userName, emergencyInfo) {
        console.log('🚨 緊急モード日記生成');
        
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
        });
        
        const emergencyContent = `## ${today}の振り返り

**やったこと**
今日も一日お疲れさまでした。システムの調子が良くなかったため、詳細な情報収集ができませんでしたが、いつも通りお仕事や日常の活動に取り組まれたと思います。

**TIL (Today I Learned)**
技術的なことや新しい発見があった一日だったのではないでしょうか。

**こんな気分**
お疲れさまでした。明日も良い一日になりそうですね。

---
**システム情報**: 
- 生成理由: ${emergencyInfo.reason}  
- 発生時刻: ${emergencyInfo.timestamp}  
- エラータイプ: ${emergencyInfo.errorType || 'unknown'}  
- 詳細: システムの一時的な問題により、通常の品質での生成ができませんでした。`;

        return {
            title: `【代筆】${userName}: ${today.split('（')[0]}の振り返り`,
            content: emergencyContent,
            category: 'AI代筆日記/緊急生成',
            metadata: {
                generationMethod: 'emergency_fallback',
                emergencyInfo: emergencyInfo,
                processingTime: 100,
                qualityScore: 2.0
            }
        };
    }
}

module.exports = ErrorRecoverySystem;
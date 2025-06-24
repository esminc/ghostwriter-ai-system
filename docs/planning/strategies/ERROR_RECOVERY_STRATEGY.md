# 🛡️ Phase 7b: エラー回復戦略設計

**策定日**: 2025年6月24日  
**対象**: AI自律システムの包括的エラー対応  
**目標**: 人間介入なしでの自動回復と品質保証  

---

## 🎯 **設計思想**

### **自律的エラー回復の原則**
1. **予測と防止**: エラー発生前の予兆検知
2. **即座の対応**: エラー発生時の迅速な判断
3. **学習と改善**: エラーパターンからの学習
4. **透明性の確保**: すべての過程の詳細記録

---

## 🏗️ **エラー分類とハンドリング設計**

### **1. ErrorRecoverySystem (総合エラー管理)**

```javascript
// src/ai/error-recovery-system.js
class ErrorRecoverySystem {
    constructor() {
        this.recoveryStrategies = new Map();
        this.errorHistory = [];
        this.learnedPatterns = new Map();
        this.maxRecoveryAttempts = 3;
        
        this.initializeRecoveryStrategies();
    }

    /**
     * 🚨 メインエラーハンドリング
     */
    async handleError(error, context) {
        console.log(`🚨 エラー検出: ${error.message}`);
        
        const errorAnalysis = await this.analyzeError(error, context);
        this.recordError(errorAnalysis);
        
        // 学習済みパターンのチェック
        const learnedRecovery = this.checkLearnedPatterns(errorAnalysis);
        if (learnedRecovery) {
            console.log('🧠 学習済みパターンで回復試行');
            return await this.executeLearnedRecovery(learnedRecovery, context);
        }
        
        // 段階的回復戦略の実行
        for (let attempt = 1; attempt <= this.maxRecoveryAttempts; attempt++) {
            console.log(`🔄 回復試行 ${attempt}/${this.maxRecoveryAttempts}`);
            
            try {
                const strategy = this.selectRecoveryStrategy(errorAnalysis, attempt);
                const result = await this.executeRecoveryStrategy(strategy, context, errorAnalysis);
                
                if (result.success) {
                    console.log(`✅ 回復成功: ${strategy.name}`);
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
        
        // 全回復失敗時の緊急対応
        return await this.executeEmergencyFallback(context, errorAnalysis);
    }

    /**
     * 🔍 エラー分析
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
                activeProcess: context.activeProcess || 'unknown',
                availableData: context.availableData || {}
            },
            systemState: await this.captureSystemState(),
            suggestedStrategies: []
        };
        
        // エラータイプ別の分析強化
        if (analysis.type === 'ai_generation_error') {
            analysis.aiSpecific = await this.analyzeAIError(error, context);
        } else if (analysis.type === 'mcp_connection_error') {
            analysis.mcpSpecific = await this.analyzeMCPError(error, context);
        }
        
        return analysis;
    }

    /**
     * 🏷️ エラータイプ分類
     */
    classifyErrorType(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('openai') || message.includes('ai') || message.includes('generation')) {
            return 'ai_generation_error';
        }
        if (message.includes('mcp') || message.includes('connection') || message.includes('tool')) {
            return 'mcp_connection_error';
        }
        if (message.includes('quality') || message.includes('validation')) {
            return 'quality_validation_error';
        }
        if (message.includes('timeout') || message.includes('time')) {
            return 'timeout_error';
        }
        if (message.includes('data') || message.includes('parsing')) {
            return 'data_processing_error';
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
            'unknown_error': 5
        };
        
        severity += typeSeverity[this.classifyErrorType(error)] || 3;
        
        // コンテキストによる調整
        if (!context.availableData) severity += 2;
        if (context.isProductionMode) severity += 1;
        if (this.isRepeatedError(error)) severity += 1;
        
        return Math.min(severity, 5);
    }

    /**
     * 🔄 回復戦略の選択
     */
    selectRecoveryStrategy(errorAnalysis, attemptNumber) {
        const strategies = this.recoveryStrategies.get(errorAnalysis.type) || [];
        
        if (strategies.length === 0) {
            return this.getGenericRecoveryStrategy(attemptNumber);
        }
        
        // 試行回数に応じた戦略選択
        const strategyIndex = Math.min(attemptNumber - 1, strategies.length - 1);
        return strategies[strategyIndex];
    }

    /**
     * 🔧 回復戦略の初期化
     */
    initializeRecoveryStrategies() {
        // AI生成エラーの回復戦略
        this.recoveryStrategies.set('ai_generation_error', [
            {
                name: 'simplify_prompt',
                description: 'プロンプトを簡素化して再試行',
                executor: this.simplifyPromptAndRetry.bind(this)
            },
            {
                name: 'reduce_temperature',
                description: 'temperature を下げて決定論的に再試行',
                executor: this.reducedTemperatureRetry.bind(this)
            },
            {
                name: 'fallback_model',
                description: '代替モデルでの再試行',
                executor: this.fallbackModelRetry.bind(this)
            }
        ]);

        // MCP接続エラーの回復戦略
        this.recoveryStrategies.set('mcp_connection_error', [
            {
                name: 'reconnect_mcp',
                description: 'MCP接続の再確立',
                executor: this.reconnectMCP.bind(this)
            },
            {
                name: 'alternative_tools',
                description: '代替ツールでの実行',
                executor: this.useAlternativeTools.bind(this)
            },
            {
                name: 'cached_data',
                description: 'キャッシュデータでの継続',
                executor: this.useCachedData.bind(this)
            }
        ]);

        // 品質検証エラーの回復戦略
        this.recoveryStrategies.set('quality_validation_error', [
            {
                name: 'improve_content',
                description: 'コンテンツ品質の改善',
                executor: this.improveContent.bind(this)
            },
            {
                name: 'adjust_parameters',
                description: '生成パラメータの調整',
                executor: this.adjustGenerationParameters.bind(this)
            },
            {
                name: 'accept_lower_quality',
                description: '低品質での受容（緊急時）',
                executor: this.acceptLowerQuality.bind(this)
            }
        ]);
    }

    /**
     * 🔧 具体的回復戦略の実装
     */
    async simplifyPromptAndRetry(context, errorAnalysis) {
        console.log('🔧 プロンプト簡素化による回復');
        
        const simplifiedInstructions = this.simplifyInstructions(context.instructions);
        const fallbackGenerator = new SimplifiedDiaryGenerator();
        
        const result = await fallbackGenerator.generateDiary(
            context.userName,
            simplifiedInstructions
        );
        
        return {
            success: true,
            result: result,
            method: 'simplified_prompt',
            qualityReduction: 0.1
        };
    }

    async reducedTemperatureRetry(context, errorAnalysis) {
        console.log('🔧 決定論的設定での再試行');
        
        const conservativeGenerator = new UnifiedDiaryGenerator({
            temperature: 0.2,
            maxIterations: 5,
            autonomyLevel: 'low'
        });
        
        const result = await conservativeGenerator.generateDiary(
            context.userName,
            context.instructions
        );
        
        return {
            success: true,
            result: result,
            method: 'reduced_temperature',
            qualityReduction: 0.05
        };
    }

    async reconnectMCP(context, errorAnalysis) {
        console.log('🔧 MCP接続再確立');
        
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
    }

    async useAlternativeTools(context, errorAnalysis) {
        console.log('🔧 代替ツールでの実行');
        
        const alternativeContext = {
            ...context,
            forceFallbackMode: true,
            availableData: this.generateFallbackData(context)
        };
        
        const generator = new UnifiedDiaryGenerator({
            autonomyLevel: 'low'
        });
        
        const result = await generator.generateDiary(
            context.userName,
            context.instructions,
            alternativeContext
        );
        
        return {
            success: true,
            result: result,
            method: 'alternative_tools',
            qualityReduction: 0.2
        };
    }

    async improveContent(context, errorAnalysis) {
        console.log('🔧 コンテンツ品質改善');
        
        const contentImprover = new ContentQualityImprover();
        const improved = await contentImprover.improve(
            errorAnalysis.originalAttempt,
            errorAnalysis.qualityIssues
        );
        
        return {
            success: true,
            result: improved,
            method: 'content_improvement',
            qualityReduction: 0
        };
    }

    /**
     * 🚨 緊急フォールバック
     */
    async executeEmergencyFallback(context, errorAnalysis) {
        console.log('🚨 緊急フォールバック実行');
        
        try {
            const emergencyGenerator = new EmergencyDiaryGenerator();
            const result = await emergencyGenerator.generateBasicDiary(
                context.userName,
                {
                    reason: 'emergency_fallback',
                    originalError: errorAnalysis.originalError.message,
                    timestamp: new Date().toISOString()
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
            
            return {
                success: false,
                error: emergencyError.message,
                method: 'emergency_fallback_failed',
                criticalFailure: true
            };
        }
    }

    /**
     * 🧠 エラーパターン学習
     */
    learnFromSuccess(errorAnalysis, successfulStrategy) {
        const pattern = {
            errorType: errorAnalysis.type,
            errorMessage: errorAnalysis.originalError.message,
            successfulStrategy: successfulStrategy.name,
            context: errorAnalysis.context,
            timestamp: new Date().toISOString()
        };
        
        const patternKey = this.generatePatternKey(errorAnalysis);
        this.learnedPatterns.set(patternKey, pattern);
        
        console.log(`🧠 パターン学習: ${patternKey} -> ${successfulStrategy.name}`);
    }

    checkLearnedPatterns(errorAnalysis) {
        const patternKey = this.generatePatternKey(errorAnalysis);
        return this.learnedPatterns.get(patternKey);
    }

    generatePatternKey(errorAnalysis) {
        return `${errorAnalysis.type}_${errorAnalysis.originalError.message.substring(0, 50)}`;
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
            mostCommonErrors: this.findMostCommonErrors(recent),
            trends: this.analyzeErrorTrends(recent)
        };
    }

    calculateRecoveryRate(errors) {
        const recoveredErrors = errors.filter(e => e.recovered);
        return errors.length > 0 ? recoveredErrors.length / errors.length : 0;
    }
}
```

### **2. EmergencyDiaryGenerator (緊急時生成器)**

```javascript
// src/ai/emergency-diary-generator.js
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
**注意**: この日記は緊急モードで生成されました。  
**エラー理由**: ${emergencyInfo.reason}  
**発生時刻**: ${emergencyInfo.timestamp}  
**詳細**: システムの一時的な問題により、通常の品質での生成ができませんでした。`;

        return {
            title: `【代筆】${userName}: ${today.split('（')[0]}の振り返り`,
            content: emergencyContent,
            category: 'AI代筆日記/緊急生成',
            qualityScore: 2.0,
            metadata: {
                generationMethod: 'emergency_fallback',
                emergencyInfo: emergencyInfo,
                processingTime: 100
            }
        };
    }
}
```

### **3. ContentQualityImprover (品質改善器)**

```javascript
// src/ai/content-quality-improver.js
class ContentQualityImprover {
    async improve(originalContent, qualityIssues) {
        console.log('🔧 コンテンツ品質改善実行');
        
        const improvements = [];
        
        // 機械的表現の修正
        if (qualityIssues.includes('mechanical_language')) {
            improvements.push(this.improveMechanicalLanguage);
        }
        
        // 文字数不足の修正
        if (qualityIssues.includes('insufficient_length')) {
            improvements.push(this.expandContent);
        }
        
        // セクション構造の修正
        if (qualityIssues.includes('missing_sections')) {
            improvements.push(this.addMissingSections);
        }
        
        let improved = originalContent;
        for (const improvement of improvements) {
            improved = await improvement(improved);
        }
        
        return {
            title: this.improveTitle(originalContent.title),
            content: improved.content,
            qualityScore: await this.calculateImprovedQuality(improved),
            metadata: {
                generationMethod: 'quality_improved',
                improvementsApplied: improvements.length
            }
        };
    }

    async improveMechanicalLanguage(content) {
        const replacements = {
            '取り組みました': 'やってみた',
            '実施しました': 'やった',
            '行いました': 'した',
            '活発な議論を行いました': 'みんなでいろいろ話し合った'
        };
        
        let improved = content;
        for (const [mechanical, natural] of Object.entries(replacements)) {
            improved = improved.replace(new RegExp(mechanical, 'g'), natural);
        }
        
        return improved;
    }
}
```

---

## 📊 **エラー監視とアラート**

### **リアルタイム監視システム**

```javascript
// src/monitoring/error-monitor.js
class ErrorMonitor {
    constructor() {
        this.alertThresholds = {
            errorRate: 0.1,        // 10%以上のエラー率
            criticalErrors: 3,     // 1時間以内に3回の重大エラー
            recoveryFailure: 2     // 連続2回の回復失敗
        };
        
        this.alertCallbacks = [];
    }

    async monitorSystemHealth() {
        setInterval(async () => {
            const health = await this.checkSystemHealth();
            
            if (health.alertRequired) {
                await this.triggerAlert(health);
            }
        }, 60000); // 1分間隔
    }

    async checkSystemHealth() {
        const recentErrors = this.getRecentErrors(3600000); // 1時間
        const errorRate = this.calculateErrorRate(recentErrors);
        const criticalCount = recentErrors.filter(e => e.severity >= 4).length;
        
        return {
            errorRate,
            criticalCount,
            alertRequired: errorRate > this.alertThresholds.errorRate || 
                          criticalCount > this.alertThresholds.criticalErrors,
            details: {
                totalErrors: recentErrors.length,
                recoverySuccessRate: this.calculateRecoveryRate(recentErrors)
            }
        };
    }
}
```

---

## 🎯 **期待される成果**

### **1. 自律的問題解決**
- 95%以上のエラー自動回復率
- 人間介入なしでの品質保証
- 学習による継続的改善

### **2. 堅牢性の向上**
- 単一障害点の排除
- 多段階フォールバック機能
- 緊急時の最低品質保証

### **3. 透明性の確保**
- 全エラーの詳細記録
- 回復過程の完全ログ
- 学習パターンの可視化

この包括的エラー回復戦略により、Phase 7bシステムは高い信頼性と自律性を実現し、本番環境での安定稼働を保証します。

---

**策定者**: Claude Code  
**実装準備**: 完了
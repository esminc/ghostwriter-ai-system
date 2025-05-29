// 段階的移行管理クラス - 手動マッピングから自動マッピングへの安全な移行
const AutoUserMapper = require('./auto-user-mapper');
const fs = require('fs').promises;
const path = require('path');

class MigrationManager {
    constructor() {
        this.autoMapper = new AutoUserMapper();
        this.configPath = path.join(__dirname, '../../config/user-mappings.json');
        this.migrationLogPath = path.join(__dirname, '../../logs/mapping-migration.log');
        
        // 移行段階の定義
        this.migrationPhases = {
            PHASE_0: 'manual_only',           // 手動マッピングのみ
            PHASE_1: 'auto_with_manual_fallback', // 自動マッピング + 手動フォールバック
            PHASE_2: 'manual_with_auto_fallback', // 手動マッピング + 自動フォールバック  
            PHASE_3: 'auto_only'             // 自動マッピングのみ
        };
        
        // Phase 2: デフォルトで完全自動モードに設定
        this.currentPhase = this.migrationPhases.PHASE_3;
        this.manualMappings = null;
        
        console.log('🚀 段階的移行マネージャー: Phase 3 (完全自動) モードで初期化');
    }

    /**
     * 現在の移行段階を設定
     */
    setMigrationPhase(phase) {
        if (!Object.values(this.migrationPhases).includes(phase)) {
            throw new Error(`Invalid migration phase: ${phase}`);
        }
        
        this.currentPhase = phase;
        this.logMigration(`Migration phase set to: ${phase}`);
        console.log(`🔄 移行段階設定: ${phase}`);
    }

    /**
     * 手動マッピング設定を読み込み
     */
    async loadManualMappings() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            this.manualMappings = JSON.parse(configData);
            console.log('📋 手動マッピング設定読み込み完了');
        } catch (error) {
            console.error('❌ 手動マッピング設定読み込み失敗:', error.message);
            this.manualMappings = { userMappings: { slack_to_esa: {} } };
        }
    }

    /**
     * ユーザーマッピングの実行（段階に応じて動作変更）
     */
    async mapUser(slackUserInfo) {
        const startTime = Date.now();
        
        // 手動マッピング設定が未読み込みの場合は読み込み
        if (!this.manualMappings) {
            await this.loadManualMappings();
        }
        
        try {
            let result;
            
            switch (this.currentPhase) {
                case this.migrationPhases.PHASE_0:
                    result = await this.manualMappingOnly(slackUserInfo);
                    break;
                    
                case this.migrationPhases.PHASE_1:
                    result = await this.autoWithManualFallback(slackUserInfo);
                    break;
                    
                case this.migrationPhases.PHASE_2:
                    result = await this.manualWithAutoFallback(slackUserInfo);
                    break;
                    
                case this.migrationPhases.PHASE_3:
                    result = await this.autoMappingOnly(slackUserInfo);
                    break;
                    
                default:
                    throw new Error(`Unknown migration phase: ${this.currentPhase}`);
            }
            
            const processingTime = Date.now() - startTime;
            result.processingTime = processingTime;
            result.migrationPhase = this.currentPhase;
            
            // ログ記録
            this.logMappingResult(slackUserInfo, result);
            
            return result;
            
        } catch (error) {
            const errorResult = {
                success: false,
                error: error.message,
                slackUser: { id: slackUserInfo.id, name: slackUserInfo.name },
                esaUser: null,
                mappingMethod: 'error',
                migrationPhase: this.currentPhase,
                processingTime: Date.now() - startTime
            };
            
            this.logMappingResult(slackUserInfo, errorResult);
            return errorResult;
        }
    }

    /**
     * Phase 0: 手動マッピングのみ
     */
    async manualMappingOnly(slackUserInfo) {
        const userName = slackUserInfo.name;
        const esaScreenName = this.manualMappings.userMappings.slack_to_esa[userName];
        
        if (esaScreenName) {
            return {
                success: true,
                slackUser: { id: slackUserInfo.id, name: userName },
                esaUser: { screen_name: esaScreenName, name: null, email: null },
                mappingMethod: 'manual',
                confidence: 1.0
            };
        } else {
            return {
                success: false,
                error: '手動マッピング設定が見つかりません',
                slackUser: { id: slackUserInfo.id, name: userName },
                esaUser: null,
                mappingMethod: 'manual_failed'
            };
        }
    }

    /**
     * Phase 1: 自動マッピング + 手動フォールバック
     */
    async autoWithManualFallback(slackUserInfo) {
        // まず自動マッピングを試行
        const autoResult = await this.autoMapper.mapSlackToEsa(slackUserInfo);
        
        if (autoResult.success) {
            return {
                ...autoResult,
                mappingMethod: `auto_${autoResult.mappingMethod}`,
                fallbackUsed: false
            };
        }
        
        // 自動マッピング失敗時は手動マッピングにフォールバック
        console.log('⚠️ 自動マッピング失敗、手動マッピングにフォールバック');
        const manualResult = await this.manualMappingOnly(slackUserInfo);
        
        return {
            ...manualResult,
            fallbackUsed: true,
            autoMappingError: autoResult.error
        };
    }

    /**
     * Phase 2: 手動マッピング + 自動フォールバック
     */
    async manualWithAutoFallback(slackUserInfo) {
        // まず手動マッピングを試行
        const manualResult = await this.manualMappingOnly(slackUserInfo);
        
        if (manualResult.success) {
            return {
                ...manualResult,
                fallbackUsed: false
            };
        }
        
        // 手動マッピング失敗時は自動マッピングにフォールバック
        console.log('⚠️ 手動マッピング失敗、自動マッピングにフォールバック');
        const autoResult = await this.autoMapper.mapSlackToEsa(slackUserInfo);
        
        return {
            ...autoResult,
            mappingMethod: autoResult.success ? `fallback_${autoResult.mappingMethod}` : 'both_failed',
            fallbackUsed: true,
            manualMappingError: manualResult.error
        };
    }

    /**
     * Phase 3: 自動マッピングのみ
     */
    async autoMappingOnly(slackUserInfo) {
        const result = await this.autoMapper.mapSlackToEsa(slackUserInfo);
        return {
            ...result,
            mappingMethod: result.success ? `auto_${result.mappingMethod}` : 'auto_failed'
        };
    }

    /**
     * 移行ログの記録
     */
    async logMigration(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - ${message}\n`;
        
        try {
            // ログディレクトリが存在しない場合は作成
            const logDir = path.dirname(this.migrationLogPath);
            await fs.mkdir(logDir, { recursive: true });
            
            await fs.appendFile(this.migrationLogPath, logEntry);
        } catch (error) {
            console.error('ログ書き込みエラー:', error.message);
        }
    }

    /**
     * マッピング結果のログ記録
     */
    async logMappingResult(slackUserInfo, result) {
        const logData = {
            timestamp: new Date().toISOString(),
            slackUser: slackUserInfo.name,
            slackId: slackUserInfo.id,
            success: result.success,
            esaUser: result.esaUser?.screen_name,
            method: result.mappingMethod,
            confidence: result.confidence,
            processingTime: result.processingTime,
            phase: result.migrationPhase,
            fallbackUsed: result.fallbackUsed,
            error: result.error
        };
        
        await this.logMigration(`MAPPING: ${JSON.stringify(logData)}`);
    }

    /**
     * 移行統計の取得
     */
    async getMigrationStats() {
        try {
            const logContent = await fs.readFile(this.migrationLogPath, 'utf8');
            const logLines = logContent.split('\n').filter(line => line.includes('MAPPING:'));
            
            const stats = {
                totalMappings: logLines.length,
                successfulMappings: 0,
                failedMappings: 0,
                methodStats: {},
                phaseStats: {},
                avgProcessingTime: 0,
                fallbackUsage: 0
            };
            
            let totalProcessingTime = 0;
            
            logLines.forEach(line => {
                try {
                    const jsonPart = line.split('MAPPING: ')[1];
                    const logData = JSON.parse(jsonPart);
                    
                    if (logData.success) {
                        stats.successfulMappings++;
                    } else {
                        stats.failedMappings++;
                    }
                    
                    // メソッド統計
                    const method = logData.method || 'unknown';
                    stats.methodStats[method] = (stats.methodStats[method] || 0) + 1;
                    
                    // フェーズ統計
                    const phase = logData.phase || 'unknown';
                    stats.phaseStats[phase] = (stats.phaseStats[phase] || 0) + 1;
                    
                    // 処理時間統計
                    if (logData.processingTime) {
                        totalProcessingTime += logData.processingTime;
                    }
                    
                    // フォールバック使用統計
                    if (logData.fallbackUsed) {
                        stats.fallbackUsage++;
                    }
                    
                } catch (parseError) {
                    // JSON解析エラーは無視
                }
            });
            
            stats.avgProcessingTime = stats.totalMappings > 0 ? 
                totalProcessingTime / stats.totalMappings : 0;
            
            return stats;
            
        } catch (error) {
            console.error('統計取得エラー:', error.message);
            return null;
        }
    }

    /**
     * 移行レポートの生成
     */
    async generateMigrationReport() {
        console.log('📊 移行レポート生成中...');
        
        const stats = await this.getMigrationStats();
        
        if (!stats) {
            console.log('❌ 統計データが取得できませんでした');
            return;
        }
        
        console.log('\n🎯 移行統計レポート:');
        console.log(`   現在のフェーズ: ${this.currentPhase}`);
        console.log(`   総マッピング数: ${stats.totalMappings}`);
        console.log(`   成功率: ${stats.totalMappings > 0 ? (stats.successfulMappings / stats.totalMappings * 100).toFixed(1) : 0}%`);
        console.log(`   平均処理時間: ${stats.avgProcessingTime.toFixed(1)}ms`);
        console.log(`   フォールバック使用率: ${stats.totalMappings > 0 ? (stats.fallbackUsage / stats.totalMappings * 100).toFixed(1) : 0}%`);
        
        console.log('\n📈 メソッド別統計:');
        Object.entries(stats.methodStats).forEach(([method, count]) => {
            const percentage = (count / stats.totalMappings * 100).toFixed(1);
            console.log(`   ${method}: ${count}回 (${percentage}%)`);
        });
        
        console.log('\n🔄 フェーズ別統計:');
        Object.entries(stats.phaseStats).forEach(([phase, count]) => {
            const percentage = (count / stats.totalMappings * 100).toFixed(1);
            console.log(`   ${phase}: ${count}回 (${percentage}%)`);
        });
        
        // 次のフェーズへの移行推奨
        console.log('\n💡 移行推奨事項:');
        
        if (this.currentPhase === this.migrationPhases.PHASE_0) {
            console.log('   🚀 Phase 1への移行を推奨: 自動マッピングの導入開始');
        } else if (this.currentPhase === this.migrationPhases.PHASE_1) {
            const autoSuccessRate = Object.entries(stats.methodStats)
                .filter(([method, count]) => method.startsWith('auto_'))
                .reduce((sum, [method, count]) => sum + count, 0) / stats.totalMappings;
                
            if (autoSuccessRate > 0.8) {
                console.log('   ✅ Phase 3への直接移行を推奨: 自動マッピングが十分安定');
            } else {
                console.log('   ⚠️ Phase 2での様子見を推奨: 自動マッピングの精度向上が必要');
            }
        } else if (this.currentPhase === this.migrationPhases.PHASE_2) {
            if (stats.fallbackUsage / stats.totalMappings < 0.2) {
                console.log('   🎉 Phase 3への移行を推奨: フォールバック使用率が低く安定');
            } else {
                console.log('   ⏳ Phase 2での継続運用を推奨: フォールバック使用率がまだ高い');
            }
        } else {
            console.log('   🎯 完全自動マッピング運用中: 継続監視');
        }
        
        return stats;
    }

    /**
     * 段階的移行のテスト実行
     */
    async testMigrationPhases() {
        console.log('🧪 段階的移行テスト開始...');
        
        // テスト用ユーザー
        const testUsers = [
            {
                id: 'U1234567890',
                name: 'takuya.okamoto',
                real_name: '岡本拓也',
                profile: { email: 'takuya.okamoto@esm.co.jp' }
            },
            {
                id: 'U0987654321',
                name: 'new.user',
                real_name: '新規ユーザー',
                profile: { email: 'new.user@esm.co.jp' }
            }
        ];
        
        // 各フェーズでのテスト実行
        const phases = Object.values(this.migrationPhases);
        
        for (const phase of phases) {
            console.log(`\n🔄 Phase: ${phase}`);
            this.setMigrationPhase(phase);
            
            for (const user of testUsers) {
                console.log(`\n👤 テストユーザー: ${user.name}`);
                const result = await this.mapUser(user);
                
                console.log(`   結果: ${result.success ? '✅' : '❌'}`);
                console.log(`   方法: ${result.mappingMethod}`);
                console.log(`   処理時間: ${result.processingTime}ms`);
                
                if (result.success) {
                    console.log(`   マッピング: ${result.slackUser.name} → ${result.esaUser.screen_name}`);
                } else {
                    console.log(`   エラー: ${result.error}`);
                }
                
                if (result.fallbackUsed) {
                    console.log(`   フォールバック使用: はい`);
                }
            }
        }
        
        // テスト完了後のレポート生成
        console.log('\n📊 テスト完了、レポート生成...');
        await this.generateMigrationReport();
    }
}

module.exports = MigrationManager;
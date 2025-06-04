// 段階的移行管理クラス - 手動マッピングから自動マッピングへの安全な移行
// AutoUserMapper統合版
const fs = require('fs').promises;
const path = require('path');

class MigrationManager {
    constructor() {
        this.configPath = path.join(__dirname, '../../config/user-mappings.json');
        this.migrationLogPath = path.join(__dirname, '../../logs/mapping-migration.log');
        
        // 自動マッピング用プロパティ（旧AutoUserMapper統合）
        this.esaMembers = null;
        this.mappingCache = new Map();
        this.lastCacheUpdate = null;
        this.cacheExpiry = 1000 * 60 * 30; // 30分キャッシュ
        
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
        const autoResult = await this.mapSlackToEsa(slackUserInfo);
        
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
        const autoResult = await this.mapSlackToEsa(slackUserInfo);
        
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
        const result = await this.mapSlackToEsa(slackUserInfo);
        return {
            ...result,
            mappingMethod: result.success ? `auto_${result.mappingMethod}` : 'auto_failed'
        };
    }

    // ==============================================
    // 自動マッピング機能（旧AutoUserMapper統合）
    // ==============================================

    /**
     * Slackユーザー情報からesaユーザーを自動マッピング
     * @param {Object} slackUserInfo - Slack APIから取得したユーザー情報
     * @returns {Promise<Object>} マッピング結果
     */
    async mapSlackToEsa(slackUserInfo) {
        try {
            console.log('🔄 自動ユーザーマッピング開始:', {
                slackId: slackUserInfo.id,
                userName: slackUserInfo.name,
                email: slackUserInfo.profile?.email,
                realName: slackUserInfo.real_name
            });

            // メールアドレスによるマッピング（最優先）
            if (slackUserInfo.profile?.email) {
                const emailMapping = await this.mapByEmail(
                    slackUserInfo.profile.email,
                    slackUserInfo
                );
                if (emailMapping.success) {
                    return emailMapping;
                }
            }

            // 実名によるマッピング（次優先）
            if (slackUserInfo.real_name) {
                const nameMapping = await this.mapByRealName(
                    slackUserInfo.real_name,
                    slackUserInfo
                );
                if (nameMapping.success) {
                    return nameMapping;
                }
            }

            // ユーザー名による部分マッチング（最終手段）
            const usernameMapping = await this.mapByUsername(
                slackUserInfo.name,
                slackUserInfo
            );
            if (usernameMapping.success) {
                return usernameMapping;
            }

            // マッピング失敗
            return {
                success: false,
                error: 'ユーザーマッピングが見つかりませんでした',
                slackUser: {
                    id: slackUserInfo.id,
                    name: slackUserInfo.name,
                    email: slackUserInfo.profile?.email
                },
                esaUser: null,
                mappingMethod: 'none'
            };

        } catch (error) {
            console.error('❌ 自動マッピングエラー:', error);
            return {
                success: false,
                error: error.message,
                slackUser: null,
                esaUser: null,
                mappingMethod: 'error'
            };
        }
    }

    /**
     * メールアドレスによるマッピング
     */
    async mapByEmail(email, slackUserInfo) {
        console.log(`📧 メールアドレスでマッピング: ${email}`);
        
        const esaMembers = await this.getEsaMembers();
        if (!esaMembers) {
            return { success: false, error: 'esaメンバー情報取得失敗' };
        }

        // メールアドレスでの完全一致検索
        const matchedMember = esaMembers.find(member => 
            member.email && member.email.toLowerCase() === email.toLowerCase()
        );

        if (matchedMember) {
            console.log(`✅ メールアドレスマッピング成功:`, {
                email: email,
                esaScreenName: matchedMember.screen_name,
                esaName: matchedMember.name
            });

            return {
                success: true,
                slackUser: {
                    id: slackUserInfo.id,
                    name: slackUserInfo.name,
                    email: email
                },
                esaUser: {
                    screen_name: matchedMember.screen_name,
                    name: matchedMember.name,
                    email: matchedMember.email
                },
                mappingMethod: 'email',
                confidence: 1.0
            };
        }

        console.log(`❌ メールアドレスマッピング失敗: ${email}`);
        return { success: false, error: 'メールアドレス一致なし' };
    }

    /**
     * 実名によるマッピング
     */
    async mapByRealName(realName, slackUserInfo) {
        console.log(`👤 実名でマッピング: ${realName}`);
        
        const esaMembers = await this.getEsaMembers();
        if (!esaMembers) {
            return { success: false, error: 'esaメンバー情報取得失敗' };
        }

        // 実名での部分一致検索（日本語名対応）
        const normalizedRealName = this.normalizeJapaneseName(realName);
        
        const matchedMember = esaMembers.find(member => {
            if (!member.name) return false;
            
            const normalizedEsaName = this.normalizeJapaneseName(member.name);
            
            // 完全一致
            if (normalizedEsaName === normalizedRealName) return true;
            
            // 部分一致（姓または名）
            const realNameParts = normalizedRealName.split(/\s+/);
            const esaNameParts = normalizedEsaName.split(/\s+/);
            
            return realNameParts.some(part => 
                esaNameParts.some(esaPart => 
                    part.length >= 2 && esaPart.includes(part)
                )
            );
        });

        if (matchedMember) {
            console.log(`✅ 実名マッピング成功:`, {
                realName: realName,
                esaScreenName: matchedMember.screen_name,
                esaName: matchedMember.name
            });

            return {
                success: true,
                slackUser: {
                    id: slackUserInfo.id,
                    name: slackUserInfo.name,
                    realName: realName
                },
                esaUser: {
                    screen_name: matchedMember.screen_name,
                    name: matchedMember.name,
                    email: matchedMember.email
                },
                mappingMethod: 'realName',
                confidence: 0.8
            };
        }

        console.log(`❌ 実名マッピング失敗: ${realName}`);
        return { success: false, error: '実名一致なし' };
    }

    /**
     * ユーザー名による部分マッチング（改良版）
     */
    async mapByUsername(username, slackUserInfo) {
        console.log(`🔤 ユーザー名でマッピング: ${username}`);
        
        const esaMembers = await this.getEsaMembers();
        if (!esaMembers) {
            return { success: false, error: 'esaメンバー情報取得失敗' };
        }

        // 1. 順序逆転パターンの検出（最優先）
        const reversedMatch = this.findReversedNameMatch(username, esaMembers);
        if (reversedMatch) {
            console.log(`✅ 順序逆転マッチング成功:`, {
                username: username,
                esaScreenName: reversedMatch.screen_name,
                confidence: 0.9
            });

            return {
                success: true,
                slackUser: {
                    id: slackUserInfo.id,
                    name: slackUserInfo.name
                },
                esaUser: {
                    screen_name: reversedMatch.screen_name,
                    name: reversedMatch.name,
                    email: reversedMatch.email
                },
                mappingMethod: 'username_reversed',
                confidence: 0.9
            };
        }

        // 2. 通常のユーザー名正規化マッチング
        const normalizedUsername = username.toLowerCase()
            .replace(/[._-]/g, '');

        const matchedMember = esaMembers.find(member => {
            if (!member.screen_name) return false;
            
            const normalizedScreenName = member.screen_name.toLowerCase()
                .replace(/[._-]/g, '');
            
            // 完全一致または高い類似度
            return normalizedScreenName === normalizedUsername ||
                   this.calculateSimilarity(normalizedUsername, normalizedScreenName) > 0.8;
        });

        if (matchedMember) {
            console.log(`✅ ユーザー名マッピング成功:`, {
                username: username,
                esaScreenName: matchedMember.screen_name,
                similarity: this.calculateSimilarity(
                    normalizedUsername, 
                    matchedMember.screen_name.toLowerCase().replace(/[._-]/g, '')
                )
            });

            return {
                success: true,
                slackUser: {
                    id: slackUserInfo.id,
                    name: slackUserInfo.name
                },
                esaUser: {
                    screen_name: matchedMember.screen_name,
                    name: matchedMember.name,
                    email: matchedMember.email
                },
                mappingMethod: 'username',
                confidence: 0.7
            };
        }

        console.log(`❌ ユーザー名マッピング失敗: ${username}`);
        return { success: false, error: 'ユーザー名一致なし' };
    }

    /**
     * esaメンバー情報を取得（MCP経由）
     */
    async getEsaMembers() {
        const now = Date.now();
        
        // キャッシュが有効な場合はそれを使用
        if (this.esaMembers && 
            this.lastCacheUpdate && 
            (now - this.lastCacheUpdate) < this.cacheExpiry) {
            console.log('💾 esaメンバー情報をキャッシュから取得');
            return this.esaMembers;
        }

        console.log('🔄 MCP経由でesaメンバー情報を取得中...');
        
        try {
            // MCP統合版を使用してメンバー情報取得
            const MCPConnectionManager = require('../mcp-integration/mcp-connection-manager');
            const mcpManager = MCPConnectionManager.getInstance();
            
            console.log('🔄 MCPConnectionManager: 既存インスタンスを使用');
            
            // MCP初期化状態確認（既に初期化済みの場合はスキップ）
            if (!mcpManager.isInitialized) {
                console.log('🔄 MCP初期化中...');
                const initResult = await mcpManager.initialize();
                if (!initResult.success) {
                    throw new Error(`MCP初期化失敗: ${initResult.error || 'Unknown error'}`);
                }
            } else {
                console.log('✅ MCPConnectionManager: 既に初期化済み - 重複初期化をスキップ');
            }
            
            // esa接続取得
            const esaConnection = await mcpManager.getConnection('esa');
            if (!esaConnection) {
                throw new Error('esa MCP接続が利用できません');
            }
            
            console.log('✅ esa MCP接続取得成功 - 接続プール使用');
            
            // esa投稿からメンバー情報を抽出
            // 複数のページから投稿を検索してメンバー情報を収集
            const memberSet = new Set();
            const members = [];
            
            // 最新の投稿から複数ページ分取得してメンバー情報を抽出
            for (let page = 1; page <= 5; page++) {
                try {
                    const result = await esaConnection.callTool({
                        name: 'search_esa_posts',
                        arguments: {
                            query: '', // 空文字列で全投稿を対象
                            perPage: 100,
                            page: page,
                            sort: 'updated'
                        }
                    });
                    
                    // MCPツール結果のcontentを取得
                    const searchResult = result.content && result.content[0] ? 
                        JSON.parse(result.content[0].text) : null;
                    
                    if (!searchResult || !searchResult.posts || searchResult.posts.length === 0) {
                        console.log(`📄 ページ ${page}: 投稿なし、検索終了`);
                        break;
                    }
                    
                    // 投稿からメンバー情報を抽出
                    searchResult.posts.forEach(post => {
                        // created_by メンバー情報
                        if (post.created_by) {
                            const memberKey = post.created_by.screen_name;
                            if (memberKey && !memberSet.has(memberKey)) {
                                memberSet.add(memberKey);
                                members.push({
                                    screen_name: post.created_by.screen_name,
                                    name: post.created_by.name,
                                    email: null, // esa投稿データにはメールアドレスが含まれない
                                    icon: post.created_by.icon
                                });
                            }
                        }
                        
                        // updated_by メンバー情報（作成者と異なる場合）
                        if (post.updated_by && post.updated_by.screen_name !== post.created_by?.screen_name) {
                            const memberKey = post.updated_by.screen_name;
                            if (memberKey && !memberSet.has(memberKey)) {
                                memberSet.add(memberKey);
                                members.push({
                                    screen_name: post.updated_by.screen_name,
                                    name: post.updated_by.name,
                                    email: null,
                                    icon: post.updated_by.icon
                                });
                            }
                        }
                    });
                    
                    console.log(`📄 ページ ${page}: ${searchResult.posts.length}投稿から ${memberSet.size}メンバー収集`);
                    
                } catch (pageError) {
                    console.error(`❌ ページ ${page} 取得エラー:`, pageError.message);
                    break;
                }
            }
            
            if (members.length === 0) {
                console.log('⚠️ esaメンバー情報が見つかりませんでした');
                return null;
            }
            
            console.log(`✅ esaメンバー情報取得成功: ${members.length}人のメンバー`);
            console.log('📋 取得されたメンバー:', members.map(m => ({screen_name: m.screen_name, name: m.name})));
            
            // キャッシュ更新
            this.esaMembers = members;
            this.lastCacheUpdate = now;
            
            return members;
            
        } catch (error) {
            console.error('❌ MCP経由esaメンバー取得エラー:', error);
            return null;
        }
    }

    /**
     * 日本語名の正規化
     */
    normalizeJapaneseName(name) {
        if (!name) return '';
        
        return name
            .trim()
            .replace(/\s+/g, ' ')  // 複数スペースを単一スペースに
            .replace(/　/g, ' ')   // 全角スペースを半角に
            .toLowerCase();
    }

    /**
     * 文字列の類似度計算（レーベンシュタイン距離ベース）
     */
    calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;
        
        const matrix = Array(len2 + 1).fill().map(() => Array(len1 + 1).fill(0));
        
        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;
        
        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j - 1][i] + 1,      // deletion
                    matrix[j][i - 1] + 1,      // insertion
                    matrix[j - 1][i - 1] + cost // substitution
                );
            }
        }
        
        const maxLen = Math.max(len1, len2);
        return (maxLen - matrix[len2][len1]) / maxLen;
    }

    /**
     * 順序逆転パターンの検出（takuya.okamoto ↔ okamoto-takuya）
     */
    findReversedNameMatch(slackUsername, esaMembers) {
        // Slackユーザー名を部分に分解
        const slackParts = slackUsername.split(/[._-]/);
        
        // 2部分の名前のみ対象（first.last パターン）
        if (slackParts.length !== 2) {
            return null;
        }
        
        const [slackFirst, slackLast] = slackParts.map(part => part.toLowerCase());
        
        // esaメンバーで順序逆転パターンを検索
        const matchedMember = esaMembers.find(member => {
            if (!member.screen_name) return false;
            
            const esaParts = member.screen_name.split(/[._-]/);
            
            // 2部分の名前のみ対象
            if (esaParts.length !== 2) {
                return false;
            }
            
            const [esaFirst, esaLast] = esaParts.map(part => part.toLowerCase());
            
            // 順序逆転チェック: slack(first.last) ↔ esa(last-first)
            return (slackFirst === esaLast && slackLast === esaFirst);
        });
        
        if (matchedMember) {
            console.log(`🔄 順序逆転パターン検出:`, {
                slack: `${slackFirst}.${slackLast}`,
                esa: `${slackLast}-${slackFirst}`,
                matched: matchedMember.screen_name
            });
        }
        
        return matchedMember;
    }

    // ==============================================
    // 従来のMigrationManager機能
    // ==============================================

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
        
        return stats;
    }
}

module.exports = MigrationManager;
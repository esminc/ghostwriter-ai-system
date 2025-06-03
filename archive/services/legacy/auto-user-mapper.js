// 自動ユーザーマッピングサービス - Googleアカウント連携によるID統合
const EsaAPI = require('./esa-api');

class AutoUserMapper {
    constructor() {
        this.esaAPI = new EsaAPI(process.env.ESA_TEAM_NAME, process.env.ESA_ACCESS_TOKEN);
        this.esaMembers = null;
        this.mappingCache = new Map();
        this.lastCacheUpdate = null;
        this.cacheExpiry = 1000 * 60 * 30; // 30分キャッシュ
    }

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
     * esaメンバー情報を取得（キャッシュ付き）
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

        console.log('🔄 esaメンバー情報を取得中...');
        
        try {
            const result = await this.esaAPI.getMembers();
            
            if (result.success) {
                this.esaMembers = result.members;
                this.lastCacheUpdate = now;
                
                console.log(`✅ esaメンバー情報取得成功: ${this.esaMembers.length}人`);
                console.log(`👥 メンバー一覧:`, this.esaMembers.map(m => ({
                    screen_name: m.screen_name,
                    name: m.name,
                    email: m.email ? '***@***' : 'なし'
                })));
                
                return this.esaMembers;
            } else {
                console.error('❌ esaメンバー情報取得失敗:', result.error);
                return null;
            }
        } catch (error) {
            console.error('❌ esaメンバー取得エラー:', error);
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
     * マッピング結果をキャッシュ
     */
    cacheMapping(slackUserId, mappingResult) {
        this.mappingCache.set(slackUserId, {
            ...mappingResult,
            cachedAt: Date.now()
        });
    }

    /**
     * キャッシュからマッピング取得
     */
    getCachedMapping(slackUserId) {
        const cached = this.mappingCache.get(slackUserId);
        if (!cached) return null;
        
        const now = Date.now();
        if ((now - cached.cachedAt) > this.cacheExpiry) {
            this.mappingCache.delete(slackUserId);
            return null;
        }
        
        console.log(`💾 キャッシュからマッピング取得: ${slackUserId}`);
        return cached;
    }

    /**
     * 従来のマッピング形式に変換（後方互換性）
     */
    toLegacyMapping(mappingResult) {
        if (!mappingResult.success) {
            return null;
        }
        
        return {
            slackUserId: mappingResult.slackUser.id,
            slackUserName: mappingResult.slackUser.name,
            esaScreenName: mappingResult.esaUser.screen_name,
            method: mappingResult.mappingMethod,
            confidence: mappingResult.confidence
        };
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

    /**
     * マッピング統計情報
     */
    getMappingStats() {
        return {
            cacheSize: this.mappingCache.size,
            lastEsaMembersUpdate: this.lastCacheUpdate,
            esaMembersCount: this.esaMembers ? this.esaMembers.length : 0
        };
    }

    /**
     * 自動マッピングのテスト・デバッグ用メソッド
     */
    async testMapping(testSlackUser) {
        console.log(`🧪 自動マッピングテスト: ${testSlackUser.name}`);
        
        const result = await this.mapSlackToEsa(testSlackUser);
        
        console.log(`テスト結果:`, {
            success: result.success,
            method: result.mappingMethod,
            confidence: result.confidence,
            slackUser: result.slackUser?.name,
            esaUser: result.esaUser?.screen_name,
            error: result.error
        });
        
        return result;
    }

    /**
     * 手動マッピング設定との比較
     */
    async compareWithManualMapping(manualMappings) {
        console.log('🔍 手動マッピングとの比較開始...');
        
        const comparisons = [];
        
        for (const [slackName, esaName] of Object.entries(manualMappings.slack_to_esa || {})) {
            const testSlackUser = {
                id: 'TEST_' + slackName.toUpperCase(),
                name: slackName,
                profile: { email: `${slackName}@example.com` },
                real_name: slackName.replace(/[._-]/g, ' ')
            };
            
            const autoResult = await this.mapSlackToEsa(testSlackUser);
            
            const comparison = {
                slackName,
                manualEsaName: esaName,
                autoEsaName: autoResult.success ? autoResult.esaUser.screen_name : null,
                autoMethod: autoResult.mappingMethod,
                autoConfidence: autoResult.confidence,
                match: autoResult.success && autoResult.esaUser.screen_name === esaName,
                autoSuccess: autoResult.success
            };
            
            comparisons.push(comparison);
            
            console.log(`📋 ${slackName}:`);
            console.log(`   手動: ${esaName}`);
            console.log(`   自動: ${comparison.autoEsaName || 'N/A'} (${comparison.autoMethod})`);
            console.log(`   一致: ${comparison.match ? '✅' : '❌'}`);
            console.log('');
        }
        
        const totalTests = comparisons.length;
        const successfulMappings = comparisons.filter(c => c.autoSuccess).length;
        const matchingMappings = comparisons.filter(c => c.match).length;
        
        console.log('📊 比較結果サマリー:');
        console.log(`   総テスト数: ${totalTests}`);
        console.log(`   自動マッピング成功: ${successfulMappings}/${totalTests} (${(successfulMappings/totalTests*100).toFixed(1)}%)`);
        console.log(`   手動マッピング一致: ${matchingMappings}/${totalTests} (${(matchingMappings/totalTests*100).toFixed(1)}%)`);
        
        return {
            comparisons,
            stats: {
                total: totalTests,
                autoSuccess: successfulMappings,
                manualMatch: matchingMappings,
                successRate: successfulMappings / totalTests,
                matchRate: matchingMappings / totalTests
            }
        };
    }
}

module.exports = AutoUserMapper;
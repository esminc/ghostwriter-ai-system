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

    // 残りのメソッドは長いため省略...
}

module.exports = AutoUserMapper;
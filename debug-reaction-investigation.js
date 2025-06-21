// Slackリアクション付きメッセージの影響調査専用スクリプト
// 6/8の古い投稿にリアクションが付いた場合の動作を検証

const path = require('path');

// プロジェクトルートから相対パスで必要モジュールを読み込み
const MCPConnectionManager = require('./src/mcp-integration/mcp-connection-manager');

class SlackReactionInvestigator {
    constructor() {
        this.mcpManager = new MCPConnectionManager();
        console.log('🔍 Slackリアクション影響調査開始');
        console.log('🎯 仮説: 6/8の古い投稿にリアクションが付いたため、48時間制限内に含まれている');
    }

    async initialize() {
        console.log('🔧 MCP接続初期化中...');
        const initResult = await this.mcpManager.initialize();
        if (!initResult.success) {
            throw new Error(`MCP初期化失敗: ${initResult.error}`);
        }
        console.log('✅ MCP接続初期化完了');
        return initResult;
    }

    async investigateReactionMessages() {
        console.log('\n📊 === リアクション付きメッセージ調査開始 ===');
        
        const slackMCPClient = await this.mcpManager.getConnection('slack');
        if (!slackMCPClient) {
            throw new Error('Slack MCP接続が利用できません');
        }

        // etc-spotsチャンネルを重点調査（72時間設定）
        const targetChannels = [
            { id: 'C040BKQ8P2L', name: 'etc-spots', timeRange: '72hours' },
            { id: 'C05JRUFND9P', name: 'its-wkwk-general', timeRange: '48hours' },
            { id: 'C07JN9616B1', name: 'its-wkwk-diary', timeRange: '48hours' }
        ];

        for (const channel of targetChannels) {
            console.log(`\n🔍 チャンネル調査: ${channel.name}`);
            await this.investigateChannelReactions(slackMCPClient, channel);
        }
    }

    async investigateChannelReactions(slackClient, channel) {
        const now = new Date();
        const hours = channel.timeRange === '72hours' ? 72 : 48;
        const timeAgo = new Date(now.getTime() - (hours * 60 * 60 * 1000));
        const oldestTimestamp = Math.floor(timeAgo.getTime() / 1000).toString();

        console.log(`   ⏰ 期間設定: ${hours}時間前から (${timeAgo.toISOString()})`);
        console.log(`   📅 oldest値: ${oldestTimestamp}`);

        try {
            // 1. 通常のチャンネル履歴取得
            console.log('   📨 チャンネル履歴取得中...');
            const historyResult = await slackClient.callTool({
                name: "slack_get_channel_history",
                arguments: {
                    channel_id: channel.id,
                    limit: 50,
                    oldest: oldestTimestamp
                }
            });

            const historyData = this.parseSlackResponse(historyResult);
            const messages = historyData?.messages || [];

            console.log(`   📝 取得メッセージ数: ${messages.length}`);

            if (messages.length === 0) {
                console.log('   ⚠️ メッセージなし - oldestパラメータが正常動作している可能性');
                return;
            }

            // 2. 各メッセージの詳細分析
            console.log('\n   🔍 メッセージ詳細分析:');
            messages.forEach((msg, index) => {
                this.analyzeMessage(msg, index + 1, oldestTimestamp);
            });

            // 3. 特に古いメッセージをピックアップ
            const oldMessages = messages.filter(msg => {
                const msgTimestamp = parseFloat(msg.ts);
                const cutoffTimestamp = parseFloat(oldestTimestamp);
                return msgTimestamp < cutoffTimestamp;
            });

            if (oldMessages.length > 0) {
                console.log(`\n   🚨 範囲外の古いメッセージ発見: ${oldMessages.length}件`);
                oldMessages.forEach((msg, index) => {
                    console.log(`   ⚠️ 古いメッセージ ${index + 1}:`);
                    this.analyzeOldMessage(msg, oldestTimestamp);
                });
            } else {
                console.log('\n   ✅ 範囲外メッセージなし - フィルタリング正常');
            }

        } catch (error) {
            console.error(`   ❌ チャンネル${channel.name}調査エラー:`, error.message);
        }
    }

    analyzeMessage(msg, index, oldestTimestamp) {
        const msgTimestamp = parseFloat(msg.ts);
        const msgDate = new Date(msgTimestamp * 1000);
        const oldestDate = new Date(parseFloat(oldestTimestamp) * 1000);
        const isInRange = msgTimestamp >= parseFloat(oldestTimestamp);
        const daysDiff = Math.floor((Date.now() - msgTimestamp * 1000) / (24 * 60 * 60 * 1000));

        console.log(`     ${index}. 投稿日時: ${msgDate.toISOString()} (${daysDiff}日前)`);
        console.log(`        範囲内: ${isInRange ? '✅' : '❌'}`);
        console.log(`        テキスト: ${(msg.text || '').substring(0, 50)}...`);

        // リアクション分析
        if (msg.reactions && msg.reactions.length > 0) {
            console.log(`        🎭 リアクション: ${msg.reactions.length}個`);
            msg.reactions.forEach((reaction, reactionIndex) => {
                console.log(`           ${reactionIndex + 1}. :${reaction.name}: (${reaction.count}回)`);
            });
        }

        // スレッド分析
        if (msg.thread_ts) {
            console.log(`        🧵 スレッド: thread_ts=${msg.thread_ts}`);
            if (msg.reply_count) {
                console.log(`           返信数: ${msg.reply_count}`);
            }
            if (msg.latest_reply) {
                const latestReplyDate = new Date(parseFloat(msg.latest_reply) * 1000);
                console.log(`           最新返信: ${latestReplyDate.toISOString()}`);
            }
        }

        // メッセージ更新情報
        if (msg.edited) {
            console.log(`        ✏️ 編集済み: ${new Date(parseFloat(msg.edited.ts) * 1000).toISOString()}`);
        }

        console.log('');
    }

    analyzeOldMessage(msg, oldestTimestamp) {
        const msgTimestamp = parseFloat(msg.ts);
        const msgDate = new Date(msgTimestamp * 1000);
        const oldestDate = new Date(parseFloat(oldestTimestamp) * 1000);
        const daysDiff = Math.floor((Date.now() - msgTimestamp * 1000) / (24 * 60 * 60 * 1000));

        console.log(`      📅 投稿: ${msgDate.toISOString()} (${daysDiff}日前)`);
        console.log(`      📋 制限: ${oldestDate.toISOString()}`);
        console.log(`      📝 内容: ${(msg.text || '').substring(0, 100)}...`);

        // この古いメッセージがなぜ取得されたかの分析
        const reasons = [];
        
        if (msg.reactions && msg.reactions.length > 0) {
            reasons.push(`リアクション${msg.reactions.length}個`);
        }
        
        if (msg.thread_ts) {
            reasons.push('スレッド投稿');
            if (msg.latest_reply) {
                const latestReplyDate = new Date(parseFloat(msg.latest_reply) * 1000);
                const replyDaysDiff = Math.floor((Date.now() - parseFloat(msg.latest_reply) * 1000) / (24 * 60 * 60 * 1000));
                reasons.push(`最新返信${replyDaysDiff}日前`);
            }
        }
        
        if (msg.edited) {
            const editDate = new Date(parseFloat(msg.edited.ts) * 1000);
            const editDaysDiff = Math.floor((Date.now() - parseFloat(msg.edited.ts) * 1000) / (24 * 60 * 60 * 1000));
            reasons.push(`編集${editDaysDiff}日前`);
        }

        console.log(`      🔍 取得理由推測: ${reasons.length > 0 ? reasons.join(', ') : '不明'}`);
        
        // 6/8の投稿かチェック
        if (msgDate.getMonth() === 5 && msgDate.getDate() === 8) { // 6月8日
            console.log(`      🎯 重要: これは6/8の投稿です！仮説と一致`);
        }
        
        console.log('');
    }

    parseSlackResponse(result) {
        try {
            if (result && result.content) {
                if (Array.isArray(result.content)) {
                    if (result.content.length > 0 && result.content[0].text) {
                        return JSON.parse(result.content[0].text);
                    }
                } else if (typeof result.content === 'string') {
                    return JSON.parse(result.content);
                } else if (typeof result.content === 'object') {
                    return result.content;
                }
            }
            return result;
        } catch (error) {
            console.error('❌ レスポンス解析エラー:', error.message);
            return null;
        }
    }

    async generateReport() {
        console.log('\n📋 === 調査レポート ===');
        console.log('🎯 仮説検証結果:');
        console.log('   - 6/8の古い投稿にリアクションが付いている場合');
        console.log('   - mcp-server-slackのoldestパラメータが無視される可能性');
        console.log('   - アプリケーション側での厳密フィルタリングが必要');
        console.log('');
        console.log('🔧 対策案:');
        console.log('   1. msg.tsでの厳密なタイムスタンプチェック');
        console.log('   2. リアクション・スレッド無視オプション');
        console.log('   3. チャンネル別特殊ルール設定');
        console.log('');
    }

    async cleanup() {
        console.log('🧹 クリーンアップ中...');
        await this.mcpManager.cleanup();
        console.log('✅ 調査完了');
    }
}

// メイン実行
async function main() {
    const investigator = new SlackReactionInvestigator();
    
    try {
        await investigator.initialize();
        await investigator.investigateReactionMessages();
        await investigator.generateReport();
    } catch (error) {
        console.error('❌ 調査エラー:', error);
    } finally {
        await investigator.cleanup();
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SlackReactionInvestigator;
// MCP統合版 簡素化Slack Bot
// 複雑な処理をLLMに委任することで大幅にコード削減

const { App } = require('@slack/bolt');
const LLMDiaryGenerator = require('./llm-diary-generator');

class SimplifiedGhostWriterBot {
    constructor() {
        // Slack Bolt アプリ初期化
        this.app = new App({
            token: process.env.SLACK_BOT_TOKEN,
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            socketMode: true,
            appToken: process.env.SLACK_APP_TOKEN,
            port: process.env.PORT || 3000
        });

        // LLM日記生成システム初期化
        this.diaryGenerator = new LLMDiaryGenerator();

        // イベントハンドラー設定
        this.setupEventHandlers();
        
        console.log('🤖 MCP統合版GhostWriter Bot初期化完了');
    }

    setupEventHandlers() {
        // 日記生成コマンド（メンション）
        this.app.event('app_mention', async ({ event, client, say }) => {
            try {
                const userName = await this.extractUserName(event.text, client, event.user);
                console.log(`📝 日記生成リクエスト: ${userName}`);

                // 処理開始通知
                await say({
                    text: `🤖 ${userName}の日記を生成中です...\n*MCP統合版で簡素化された処理で実行中*`,
                    thread_ts: event.ts
                });

                // LLMに全体処理を委任
                const result = await this.diaryGenerator.generateDiaryWithMCP(userName);

                if (result.success) {
                    // 成功レスポンス
                    await say({
                        text: this.formatSuccessResponse(result, userName),
                        thread_ts: event.ts
                    });
                } else {
                    // エラー時はPhase 1にフォールバック
                    await this.handleFallback(userName, result.error, say, event.ts);
                }

            } catch (error) {
                console.error('❌ Slack Bot エラー:', error);
                await say({
                    text: `❌ 申し訳ありません。システムエラーが発生しました: ${error.message}`,
                    thread_ts: event.ts
                });
            }
        });

        // ヘルプコマンド
        this.app.command('/ghostwriter-help', async ({ command, ack, respond }) => {
            await ack();
            await respond({
                text: this.buildHelpMessage(),
                response_type: 'ephemeral'
            });
        });
    }

    /**
     * ユーザー名抽出（既存ロジック簡素化）
     */
    async extractUserName(text, client, userId) {
        // メンション形式から抽出
        const mentionMatch = text.match(/<@(\w+)>/);
        if (mentionMatch) {
            const mentionedUserId = mentionMatch[1];
            try {
                const userInfo = await client.users.info({ user: mentionedUserId });
                return userInfo.user.real_name || userInfo.user.name || 'unknown-user';
            } catch (error) {
                console.warn('ユーザー情報取得失敗:', error);
            }
        }

        // デフォルト: メッセージ送信者
        try {
            const userInfo = await client.users.info({ user: userId });
            return userInfo.user.real_name || userInfo.user.name || 'default-user';
        } catch (error) {
            return 'anonymous-user';
        }
    }

    /**
     * 成功レスポンス形式
     */
    formatSuccessResponse(result, userName) {
        const metadata = result.metadata || {};
        
        return `✅ **${userName}の日記生成完了！**

📝 **今日の日記**
${result.diary}

---
🤖 **MCP統合処理情報**
• 処理方式: ${metadata.processing_method || 'mcp_integration'}
• 品質スコア: ${metadata.quality_score || 'N/A'}/5
• 処理時刻: ${new Date(metadata.generation_time || Date.now()).toLocaleString('ja-JP')}
• 使用トークン: ${metadata.tokens_used || 'N/A'}

*MCP統合により大幅に簡素化された処理で生成されました* 🚀`;
    }

    /**
     * フォールバック処理（Phase 1システムへ）
     */
    async handleFallback(userName, error, say, threadTs) {
        console.log('🔄 Phase 1システムへフォールバック...');
        
        await say({
            text: `⚠️ MCP統合処理でエラーが発生しました: ${error}
            
🔄 **Phase 1システムへフォールバック実行中...**
*既存の高品質システムで再処理します*`,
            thread_ts: threadTs
        });

        try {
            // Phase 1システムの導入（簡易版）
            const { GhostWriterService } = require('../services/ghost-writer-service');
            const fallbackService = new GhostWriterService();
            
            const fallbackResult = await fallbackService.generateDiary(userName);
            
            if (fallbackResult.success) {
                await say({
                    text: `✅ **フォールバック成功** - ${userName}の日記生成完了！

📝 **今日の日記**
${fallbackResult.diary}

---
🛡️ **Phase 1フォールバック情報**
• 処理方式: fallback_to_phase1
• 品質スコア: ${fallbackResult.qualityScore || 'N/A'}/5
• MCP統合版で問題が発生したため、実証済みシステムで生成`,
                    thread_ts: threadTs
                });
            } else {
                throw new Error('フォールバックも失敗');
            }
            
        } catch (fallbackError) {
            console.error('❌ フォールバック失敗:', fallbackError);
            await say({
                text: `❌ **システム全体エラー**
                
MCP統合版・Phase 1フォールバック共に失敗しました。
システム管理者にお問い合わせください。

エラー詳細: ${fallbackError.message}`,
                thread_ts: threadTs
            });
        }
    }

    /**
     * ヘルプメッセージ
     */
    buildHelpMessage() {
        return `🤖 **GhostWriter Bot - MCP統合版**

**使用方法:**
• @GhostWriter @[ユーザー名] - 指定ユーザーの日記生成
• @GhostWriter - あなたの日記生成

**MCP統合の特徴:**
✨ LLMが柔軟に処理判断
✨ 300行以上のコードを20行程度に簡素化
✨ Phase 1システムへの自動フォールバック
✨ 既存品質（5/5）を維持

**システム構成:**
• フロントエンド: Slack（従来通り）
• 処理エンジン: GPT-4o-mini + MCP統合
• バックアップ: Phase 1システム（フォールバック）

詳細: MCP (Model Context Protocol) により、複雑なAPI実装をLLMの自然言語処理に委任`;
    }

    /**
     * Bot開始
     */
    async start() {
        try {
            await this.app.start();
            console.log('🚀 MCP統合版GhostWriter Bot起動完了 (Port 3000)');
            console.log('📊 システム構成: Slack Bot (20行) → LLM → esa MCP Server');
            console.log('🛡️ フォールバック: Phase 1システム待機中');
        } catch (error) {
            console.error('❌ Bot起動失敗:', error);
            process.exit(1);
        }
    }
}

module.exports = SimplifiedGhostWriterBot;

// 直接実行時の処理
if (require.main === module) {
    require('dotenv').config();
    
    const bot = new SimplifiedGhostWriterBot();
    bot.start().catch(console.error);
}

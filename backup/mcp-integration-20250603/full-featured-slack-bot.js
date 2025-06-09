// Phase 2-A MCP統合版 フル機能Slack Bot
// Phase 1の完全なUI機能 + Phase 2-AのMCP統合効率化を組み合わせ

const { App, ExpressReceiver } = require('@slack/bolt');
const LLMDiaryGeneratorPhase53Unified = require('./llm-diary-generator-phase53-unified');
const MigrationManager = require('../services/migration-manager'); // Phase 1互換: Emailマッピング機能

class FullFeaturedGhostWriterBot {
    constructor() {
        console.log('🚀 Phase 2-A フル機能版初期化開始...');
        
        // 環境変数チェック
        this.validateEnvironment();
        
        // ExpressReceiver でChallenge Response処理
        this.receiver = new ExpressReceiver({
            signingSecret: process.env.SLACK_SIGNING_SECRET,
            endpoints: '/slack/events'
        });
        
        // Challenge Response ハンドラー
        this.setupChallengeHandler();
        
        // Slack App初期化
        this.app = new App({
            token: process.env.SLACK_BOT_TOKEN,
            receiver: this.receiver
        });

        // Phase 5.3完全統一版MCP統合エンジン初期化（重複初期化問題解決版）
        console.log('\n' + '🎯'.repeat(30));
        console.log('🎯 Phase 5.3完全統一版インスタンス作成中...');
        console.log('⚠️ 他のシステムが動作した場合はバグです！');
        
        this.diaryGenerator = new LLMDiaryGeneratorPhase53Unified();
        
        // システムの確認
        console.log(`✅ Phase 5.3完全統一版インスタンス作成完了`);
        console.log(`🆔 システムタイプ: ${this.diaryGenerator.constructor.name}`);
        console.log(`🏷️ システムバージョン: ${this.diaryGenerator.systemVersion || 'Unknown'}`);
        console.log(`🆔 システムID: ${this.diaryGenerator.systemId || 'Unknown'}`);
        console.log('📋 重複初期化解決システム稼働中');
        console.log('🎯'.repeat(30) + '\n');
        
        // Phase 1互換: Email優先マッピング機能
        this.migrationManager = new MigrationManager();
        console.log('📧 Email優先マッピング機能統合完了');
        
        // イベントハンドラー設定
        this.setupEventHandlers();
        
        console.log('🎉 Phase 5.3完全統一版 フル機能版初期化完了 - 重複初期化問題完全解決 + 完全UI + Emailマッピング');
    }

    validateEnvironment() {
        const required = ['SLACK_BOT_TOKEN', 'SLACK_SIGNING_SECRET', 'ESA_ACCESS_TOKEN', 'ESA_TEAM_NAME'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`❌ 必須環境変数が不足: ${missing.join(', ')}`);
        }
        
        console.log('✅ 環境変数チェック完了');
    }

    setupChallengeHandler() {
        this.receiver.app.post('/slack/events', (req, res, next) => {
            if (req.body && req.body.type === 'url_verification') {
                console.log('🔄 Challenge received:', req.body.challenge);
                return res.status(200).send(req.body.challenge);
            }
            next();
        });
    }

    setupEventHandlers() {
        // 🚀 Slashコマンド（/ghostwrite）- 3秒タイムアウト完全対策
        this.app.command('/ghostwrite', async ({ command, ack, respond, client }) => {
            await ack(); // 最優先: 3秒以内必須
            console.log('✅ /ghostwrite コマンドACK完了');
            
            // 非同期でUI表示処理
            this.handleSlashCommand(command, respond, client).catch(error => {
                console.error('❌ Slashコマンド処理エラー:', error);
            });
        });

        // 🔘 ボタンアクション処理 - 3秒タイムアウト完全対策
        this.app.action(/^ghostwrite_/, async ({ body, ack, respond, client }) => {
            await ack(); // 最優先: 3秒以内必須
            console.log('✅ ボタンアクションACK完了:', body.actions[0].action_id);
            
            // 非同期でボタン処理
            this.handleButtonAction(body, respond, client).catch(error => {
                console.error('❌ ボタンアクション処理エラー:', error);
            });
        });

        // 📱 メンション処理 - 3秒タイムアウト完全対策
        this.app.event('app_mention', async ({ event, client, say, ack }) => {
            await ack(); // 最優先: 3秒以内必須
            console.log('✅ メンションACK完了');
            
            // 非同期でメンション処理
            this.handleMention(event, client, say).catch(error => {
                console.error('❌ メンション処理エラー:', error);
            });
        });

        // ヘルプコマンド
        this.app.command('/ghostwriter-help', async ({ command, ack, respond }) => {
            await ack();
            await respond({
                text: this.getHelpMessage(),
                response_type: 'ephemeral'
            });
        });
    }

    /**
     * 🚀 Phase 1完全互換 - Slashコマンド処理
     */
    async handleSlashCommand(command, respond, client) {
        try {
            const userId = command.user_id;
            const userName = command.user_name;
            const text = command.text.trim();

            console.log(`📝 /ghostwrite from ${userName}: "${text}"`);

            // ヘルプ表示
            if (text === 'help') {
                await respond({
                    text: this.getHelpMessage(),
                    response_type: 'ephemeral'
                });
                return;
            }

            // Phase 1完全互換 - 対話的UI表示
            await respond({
                text: '✍️ 代筆日記を作成します...',
                blocks: this.getInteractiveBlocks(userId),
                response_type: 'ephemeral'
            });

        } catch (error) {
            console.error('❌ Slashコマンド処理エラー:', error);
            await respond({
                text: `❌ エラーが発生しました: ${error.message}`,
                response_type: 'ephemeral'
            });
        }
    }
}
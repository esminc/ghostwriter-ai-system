#!/usr/bin/env node

// esa投稿機能テスト - esa_bot代筆投稿対応版
require('dotenv').config();

const SlackMCPWrapperDirect = require('./src/mcp-integration/slack-mcp-wrapper-direct.js');

class EsaPostingTest {
    constructor() {
        this.slackWrapper = new SlackMCPWrapperDirect();
        this.esaApiUrl = 'https://api.esa.io/v1';
        this.teamName = process.env.ESA_TEAM_NAME || 'esminc-its';
        this.accessToken = process.env.ESA_ACCESS_TOKEN;
        console.log('📝 esa投稿機能テスト初期化（esa_bot代筆対応）...');
    }
    
    /**
     * 🧠 AI日記生成（前回と同じロジック）
     */
    async generateDiaryWithAI(userName, slackData) {
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
        });

        const isRealData = slackData.dataSource === 'real_slack_mcp_direct';
        
        const prompt = `あなたはESM社の${userName}として、今日（${today}）の日記を書いてください。

## 💬 今日のSlack活動データ （データソース: ${slackData.dataSource}）
**取得メッセージ数**: ${slackData.todayMessages?.length || 0}件
**主要チャンネル**: ${(slackData.messageStats?.channelsActive || []).join(', ')}
**生産性スコア**: ${slackData.productivityMetrics?.score ? (slackData.productivityMetrics.score * 100).toFixed(0) : 0}%

### 今日のメッセージ内容:
${(slackData.todayMessages || []).map((msg, index) => {
    const time = new Date(parseFloat(msg.ts) * 1000).toLocaleTimeString('ja-JP');
    return `${index + 1}. [${time}] ${msg.text || '[添付ファイルまたはその他]'}`;
}).join('\n')}

## 🧠 活動分析結果
**主要トピック**: ${(slackData.activityAnalysis?.topics || []).join(', ')}
**ムード**: ${slackData.activityAnalysis?.mood || '普通'}
**エンゲージメント**: ${slackData.activityAnalysis?.engagement || '中'}

## 📝 日記の作成指示

以下の形式で日記を作成してください：

### ESM社の日記スタイル
- カジュアルで親しみやすい文体（だね、だよ、なんか）
- 率直で内省的な表現
- 技術的な話題に対する素直な感想

### 構造
1. **## やることやったこと** - 実際のSlack活動を自然に反映
2. **## TIL (Today I Learned)** - 学んだことや気づき
3. **## こんな気分** - 一日の振り返りと感想

### 長さ
400-600文字程度で、読みやすく自然な日記にしてください。

**重要**: ${isRealData ? 
    '今日のSlackメッセージは実際の活動データです。具体的な内容を自然に日記に組み込んでください。' : 
    'フォールバックデータのため、一般的で自然な内容で日記を作成してください。'
}

出力は日記の本文のみとし、追加の説明や注釈は不要です。`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'あなたはESM社の社員として、日常的な日記を書く専門家です。自然で親しみやすい文体で書いてください。' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API Error: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                content: data.choices[0]?.message?.content || '',
                usage: data.usage,
                model: data.model
            };

        } catch (error) {
            console.error('❌ OpenAI API呼び出しエラー:', error);
            throw error;
        }
    }
    
    /**
     * 📄 日記フッター追加
     */
    addDiaryFooter(content, userName, metadata = {}) {
        const today = new Date();
        const dateTimeStr = today.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        let footer = `\n\n---\n\n**🤖 AI代筆システム情報**\n`;
        footer += `* **生成日時**: ${dateTimeStr}\n`;
        footer += `* **システム**: GhostWriter 0.1.0 (修正版Slack投稿参照機能)\n`;
        footer += `* **対象ユーザー**: ${userName}\n`;
        footer += `* **データソース**: ${metadata.dataSource || 'unknown'}\n`;
        footer += `* **Slackメッセージ**: ${metadata.messageCount || 0}件\n`;
        footer += `* **生産性スコア**: ${metadata.productivityScore || 0}%\n`;
        footer += `* **使用トークン**: ${metadata.tokensUsed || 0}トークン\n`;
        footer += `* **投稿者**: esa_bot (AI代筆システム)\n`;
        footer += `* **WIP状態**: 有効（代筆投稿のため）\n`;
        
        return content + footer;
    }
    
    /**
     * 🎯 日記タイトル生成
     */
    generateDiaryTitle(content, userName) {
        let baseTitle = '今日も一日お疲れ様';
        
        if (content) {
            const lowercaseContent = content.toLowerCase();
            
            if (lowercaseContent.includes('ハッカソン')) {
                baseTitle = 'ハッカソンでの挑戦';
            } else if (lowercaseContent.includes('会議') || lowercaseContent.includes('ミーティング')) {
                baseTitle = 'チームでの充実した一日';
            } else if (lowercaseContent.includes('ai') || lowercaseContent.includes('システム')) {
                baseTitle = 'AI開発に集中した一日';
            } else if (lowercaseContent.includes('chatgpt')) {
                baseTitle = 'ChatGPTとの協働';
            } else if (lowercaseContent.includes('学習') || lowercaseContent.includes('発見')) {
                baseTitle = '新しい発見のある一日';
            }
        }
        
        return `【代筆】${userName}: ${baseTitle}`;
    }
    
    /**
     * 📤 esa投稿実行（esa_bot代筆対応）
     */
    async postToEsa(diary, isDryRun = true) {
        console.log(`📤 esa投稿${isDryRun ? '（ドライラン）' : '実行'}中...`);
        
        if (!this.accessToken || this.accessToken === 'your_esa_access_token_here') {
            throw new Error('esa APIアクセストークンが設定されていません');
        }
        
        // 今日の日付でカテゴリを作成
        const today = new Date();
        const categoryDate = today.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '/');
        
        const postData = {
            post: {
                name: diary.title,
                body_md: diary.content,
                category: `AI代筆日記/${categoryDate}`,
                tags: diary.tags || ['AI代筆', '日記'],
                wip: true, // WIP状態で投稿（代筆投稿のため）
                user: 'esa_bot', // esa_botによる代筆投稿
                message: 'AI代筆システムによる自動投稿（esa_bot代筆、WIP状態）'
            }
        };
        
        if (isDryRun) {
            console.log('📋 ドライラン実行 - 以下の内容で投稿予定:');
            console.log('='.repeat(60));
            console.log(`タイトル: ${postData.post.name}`);
            console.log(`カテゴリ: ${postData.post.category}`);
            console.log(`タグ: ${postData.post.tags.join(', ')}`);
            console.log(`WIP状態: ${postData.post.wip ? '✅ 有効' : '❌ 無効'}`);
            console.log(`投稿者: ${postData.post.user} (AI代筆システム)`);
            console.log(`投稿メッセージ: ${postData.post.message}`);
            console.log(`本文プレビュー: ${postData.post.body_md.substring(0, 200)}...`);
            console.log('='.repeat(60));
            
            return {
                success: true,
                dryRun: true,
                message: 'ドライラン完了 - 実際の投稿は行われていません（esa_bot代筆、WIP設定：有効）',
                postData: postData
            };
        }
        
        try {
            const response = await fetch(`${this.esaApiUrl}/teams/${this.teamName}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify(postData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`esa API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }
            
            const result = await response.json();
            
            console.log('✅ esa投稿成功！');
            console.log(`📝 投稿URL: ${result.url}`);
            console.log(`🆔 投稿ID: ${result.number}`);
            console.log(`👤 投稿者: ${result.created_by?.name || 'esa_bot'}`);
            console.log(`📋 WIP状態: ${result.wip ? '✅ 有効' : '❌ 無効'}`);
            
            return {
                success: true,
                dryRun: false,
                post: result,
                url: result.url,
                postId: result.number,
                wip: result.wip,
                createdBy: result.created_by
            };
            
        } catch (error) {
            console.error('❌ esa投稿エラー:', error);
            throw error;
        }
    }
    
    /**
     * 🚀 完全統合テスト実行
     */
    async runFullIntegrationTest(userName, slackUserId, options = {}) {
        const { dryRun = true, skipDiaryGeneration = false } = options;
        
        console.log(`🚀 完全統合テスト開始: ${userName} (${slackUserId})`);
        console.log(`モード: ${dryRun ? 'ドライラン' : '実投稿'}`);
        console.log(`投稿者: esa_bot (AI代筆システム)`);
        console.log(`WIP設定: ✅ 有効（代筆投稿のため）`);
        
        try {
            let diary;
            
            if (skipDiaryGeneration) {
                // 前回生成した日記を使用（テスト用）
                console.log('📄 テスト用日記を使用...');
                diary = {
                    title: `【代筆】${userName}: ハッカソンでの挑戦`,
                    content: `## やることやったこと

今日は日曜日だけど、意外とSlackでの活動が盛りだくさんだったよ！

## TIL (Today I Learned)

今日の学びは、AIの活用方法についての新たな視点だったかな。

## こんな気分

一日を振り返ると、今日はとても充実していたなぁ。

---

**🤖 AI代筆システム情報**
* **生成日時**: 2025/06/01 13:00
* **システム**: GhostWriter 0.1.0 (修正版Slack投稿参照機能)
* **対象ユーザー**: ${userName}
* **データソース**: real_slack_mcp_direct
* **Slackメッセージ**: 6件
* **生産性スコア**: 100%
* **使用トークン**: 1328トークン
* **投稿者**: esa_bot (AI代筆システム)
* **WIP状態**: 有効（代筆投稿のため）`,
                    tags: ['AI代筆', '日記', 'esa_bot代筆']
                };
            } else {
                // Step 1: Slack MCP Wrapper初期化
                console.log('🔄 Slack MCP Wrapper初期化中...');
                await this.slackWrapper.initialize();
                
                // Step 2: Slackデータ取得
                console.log('💬 Slackデータ取得中...');
                const slackData = await this.slackWrapper.getUserSlackDataByUserId(slackUserId, {
                    includeThreads: true,
                    targetChannelId: 'C05JRUFND9P',
                    messageLimit: 100,
                    secureMode: true
                });
                
                console.log(`✅ Slackデータ取得完了: ${slackData.todayMessages?.length || 0}件のメッセージ`);
                
                // Step 3: AI日記生成
                console.log('🧠 AI日記生成中...');
                const aiResult = await this.generateDiaryWithAI(userName, slackData);
                
                // Step 4: 日記コンテンツ構築
                const diaryTitle = this.generateDiaryTitle(aiResult.content, userName);
                
                diary = {
                    title: diaryTitle,
                    content: this.addDiaryFooter(aiResult.content, userName, {
                        dataSource: slackData.dataSource,
                        messageCount: slackData.todayMessages?.length || 0,
                        productivityScore: slackData.productivityMetrics?.score ? 
                            Math.round(slackData.productivityMetrics.score * 100) : 0,
                        tokensUsed: aiResult.usage?.total_tokens || 0
                    }),
                    tags: ['AI代筆', '日記', slackData.dataSource === 'real_slack_mcp_direct' ? 'リアルデータ' : 'フォールバック', 'esa_bot代筆']
                };
                
                console.log('✅ 日記生成完了！');
            }
            
            // Step 5: esa投稿
            const postResult = await this.postToEsa(diary, dryRun);
            
            console.log('\n🎉 **完全統合テスト成功！**');
            
            if (postResult.dryRun) {
                console.log('\n📋 **ドライラン結果**:');
                console.log('・日記生成: ✅ 成功');
                console.log('・esa投稿準備: ✅ 成功');
                console.log('・投稿者設定: ✅ esa_bot');
                console.log('・WIP設定: ✅ 有効');
                console.log('・実投稿: 🔄 スキップ（ドライランモード）');
                
                console.log('\n🎯 **実投稿の実行方法**:');
                console.log('node test-esa-posting-bot.js "岡本卓也" U040L7EJC0Z --real-post');
            } else {
                console.log('\n📤 **実投稿結果**:');
                console.log('・日記生成: ✅ 成功');
                console.log('・esa投稿: ✅ 成功');
                console.log(`・投稿URL: ${postResult.url}`);
                console.log(`・投稿ID: ${postResult.postId}`);
                console.log(`・投稿者: ${postResult.createdBy?.name || 'esa_bot'}`);
                console.log(`・WIP状態: ${postResult.wip ? '✅ 有効' : '❌ 無効'}`);
            }
            
            return {
                success: true,
                diary: diary,
                postResult: postResult
            };
            
        } catch (error) {
            console.error('❌ 完全統合テストエラー:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            if (!skipDiaryGeneration) {
                await this.slackWrapper.cleanup();
            }
        }
    }
}

// テスト実行
async function runEsaPostingTest() {
    const args = process.argv.slice(2);
    const userName = args[0];
    const slackUserId = args[1];
    const isRealPost = args.includes('--real-post');
    const skipDiaryGeneration = args.includes('--skip-diary');
    
    if (!userName || !slackUserId) {
        console.log('❌ 使用方法: node test-esa-posting-bot.js [USER_NAME] [SLACK_USER_ID] [OPTIONS]');
        console.log('例: node test-esa-posting-bot.js "岡本卓也" U040L7EJC0Z');
        console.log('オプション:');
        console.log('  --real-post    実際にesaに投稿（デフォルト: ドライラン）');
        console.log('  --skip-diary   日記生成をスキップしてテスト用日記を使用');
        console.log('');
        console.log('🤖 Phase1設定:');
        console.log('  - 投稿者: esa_bot (AI代筆システム)');
        console.log('  - WIP状態: 有効（代筆投稿のため）');
        console.log('  - 代筆対象: 指定ユーザーの日記を代筆');
        return;
    }
    
    console.log('📝 esa投稿機能テスト開始（esa_bot代筆対応版）');
    console.log('='.repeat(60));
    console.log(`対象ユーザー: ${userName} (${slackUserId})`);
    console.log(`実行モード: ${isRealPost ? '実投稿' : 'ドライラン'}`);
    console.log('🤖 Phase1設定: esa_bot代筆投稿、WIP状態有効');
    console.log();
    
    const tester = new EsaPostingTest();
    
    const result = await tester.runFullIntegrationTest(userName, slackUserId, {
        dryRun: !isRealPost,
        skipDiaryGeneration: skipDiaryGeneration
    });
    
    if (!result.success) {
        console.error(`❌ テスト失敗: ${result.error}`);
        process.exit(1);
    }
}

runEsaPostingTest();

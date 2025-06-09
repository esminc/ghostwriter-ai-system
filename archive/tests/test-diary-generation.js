#!/usr/bin/env node

// 日記生成機能テスト - 完全機能版
require('dotenv').config();

const SlackMCPWrapperDirect = require('./src/mcp-integration/slack-mcp-wrapper-direct.js');

class DiaryGenerationTest {
    constructor() {
        this.slackWrapper = new SlackMCPWrapperDirect();
        console.log('📖 日記生成機能テスト初期化（完全機能版）...');
    }
    
    /**
     * 🧠 AI日記生成（OpenAI API使用）
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
            // OpenAI API呼び出し
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
            
            // フォールバック日記生成
            return {
                success: false,
                error: error.message,
                fallback_content: this.generateFallbackDiary(userName, slackData)
            };
        }
    }
    
    /**
     * 🔄 フォールバック日記生成
     */
    generateFallbackDiary(userName, slackData) {
        const topics = slackData.activityAnalysis?.topics || [];
        const messages = slackData.todayMessages || [];
        
        let content = `## やることやったこと\n\n`;
        
        if (topics.includes('ハッカソン')) {
            content += `- [x] ハッカソン参加の準備とエントリー\n`;
            content += `- [x] AI日記システムの開発作業\n`;
        }
        
        if (topics.includes('ミーティング')) {
            content += `- [x] 一斉会議への参加\n`;
            content += `- [x] チームでの情報共有\n`;
        }
        
        if (topics.includes('ChatGPT')) {
            content += `- [x] ChatGPT利用についての相談\n`;
            content += `- [x] AI活用方法の検討\n`;
        }
        
        content += `\n## TIL\n\n`;
        content += `AIシステム開発において、実際のSlackデータを活用することで、より自然で個性的な日記が生成できることを学んだ。`;
        if (topics.includes('ハッカソン')) {
            content += `ハッカソンでの短期集中開発では、MVP（最小実行可能製品）を意識した設計が重要だということも実感した。`;
        }
        
        content += `\n\n## こんな気分\n\n`;
        content += `今日は技術的な挑戦が多い一日だったけど、`;
        if (messages.length > 0) {
            content += `チームとの連携がうまくいって、すごくいい感じだね。`;
        } else {
            content += `着実に前に進んでいる感覚があって満足してる。`;
        }
        content += `明日もこの勢いで、さらに良いシステムを作っていきたいって思ってる。`;
        
        return content;
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
        
        if (metadata.messageCount !== undefined) {
            footer += `* **Slackメッセージ**: ${metadata.messageCount}件\n`;
        }
        
        if (metadata.productivityScore !== undefined) {
            footer += `* **生産性スコア**: ${metadata.productivityScore}%\n`;
        }
        
        if (metadata.tokensUsed) {
            footer += `* **使用トークン**: ${metadata.tokensUsed}トークン\n`;
        }
        
        footer += `* **投稿者**: esa_bot (AI代筆システム)\n`;
        
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
     * 🚀 日記生成メイン処理
     */
    async generateDiary(userName, slackUserId) {
        console.log(`📖 日記生成開始: ${userName} (${slackUserId})`);
        
        try {
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
            
            let diaryContent;
            let tokensUsed = 0;
            
            if (aiResult.success) {
                diaryContent = aiResult.content;
                tokensUsed = aiResult.usage?.total_tokens || 0;
                console.log(`✅ AI日記生成成功（${tokensUsed}トークン使用）`);
            } else {
                diaryContent = aiResult.fallback_content;
                console.log('⚠️ AI日記生成失敗、フォールバック使用');
            }
            
            // Step 4: 日記コンテンツ構築
            const diaryTitle = this.generateDiaryTitle(diaryContent, userName);
            
            const finalDiary = {
                title: diaryTitle,
                content: this.addDiaryFooter(diaryContent, userName, {
                    dataSource: slackData.dataSource,
                    messageCount: slackData.todayMessages?.length || 0,
                    productivityScore: slackData.productivityMetrics?.score ? 
                        Math.round(slackData.productivityMetrics.score * 100) : 0,
                    tokensUsed: tokensUsed
                }),
                category: 'AI代筆日記',
                tags: ['AI代筆', '日記', slackData.dataSource === 'real_slack_mcp_direct' ? 'リアルデータ' : 'フォールバック']
            };
            
            console.log('✅ 日記生成完了！');
            
            return {
                success: true,
                diary: finalDiary,
                metadata: {
                    processing_method: 'slack_mcp_direct_with_ai',
                    generation_time: new Date().toISOString(),
                    data_source: slackData.dataSource,
                    message_count: slackData.todayMessages?.length || 0,
                    tokens_used: tokensUsed,
                    ai_generation: aiResult.success,
                    slack_stats: slackData.messageStats,
                    activity_analysis: slackData.activityAnalysis
                }
            };
            
        } catch (error) {
            console.error('❌ 日記生成エラー:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            await this.slackWrapper.cleanup();
        }
    }
}

// テスト実行
async function runDiaryGenerationTest(userName, slackUserId) {
    if (!userName || !slackUserId) {
        console.log('❌ 使用方法: node test-diary-generation.js [USER_NAME] [SLACK_USER_ID]');
        console.log('例: node test-diary-generation.js "岡本拓也" U040L7EJC0Z');
        return;
    }
    
    console.log('📖 日記生成機能テスト開始（完全機能版）');
    console.log('='.repeat(50));
    console.log(`対象ユーザー: ${userName} (${slackUserId})`);
    console.log();
    
    const tester = new DiaryGenerationTest();
    
    try {
        const result = await tester.generateDiary(userName, slackUserId);
        
        if (result.success) {
            console.log('\n🎉 **日記生成成功！**');
            console.log('\n📄 **生成された日記**:');
            console.log('='.repeat(50));
            console.log(`**タイトル**: ${result.diary.title}`);
            console.log();
            console.log(result.diary.content);
            console.log('='.repeat(50));
            
            console.log('\n📊 **生成統計**:');
            console.log(`・データソース: ${result.metadata.data_source}`);
            console.log(`・メッセージ数: ${result.metadata.message_count}件`);
            console.log(`・使用トークン: ${result.metadata.tokens_used}トークン`);
            console.log(`・AI生成: ${result.metadata.ai_generation ? '成功' : 'フォールバック使用'}`);
            console.log(`・生成時刻: ${result.metadata.generation_time}`);
            
            if (result.metadata.slack_stats) {
                console.log('\n📈 **Slack活動統計**:');
                console.log(`・チャンネル: ${result.metadata.slack_stats.channelsActive.join(', ')}`);
                console.log(`・平均リアクション: ${result.metadata.slack_stats.averageReactions.toFixed(1)}`);
                console.log(`・スレッド参加: ${result.metadata.slack_stats.threadParticipation}件`);
            }
            
            if (result.metadata.activity_analysis) {
                console.log('\n🧠 **活動分析**:');
                console.log(`・主要トピック: ${result.metadata.activity_analysis.topics.join(', ')}`);
                console.log(`・ムード: ${result.metadata.activity_analysis.mood}`);
                console.log(`・エンゲージメント: ${result.metadata.activity_analysis.engagement}`);
            }
            
            console.log('\n🎯 **次のステップ**:');
            console.log('1. esaへの投稿テスト');
            console.log('2. 自動実行システムの設定');
            console.log('3. 本格運用開始');
            
        } else {
            console.log('\n❌ **日記生成失敗**');
            console.log(`エラー: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ テスト実行エラー:', error.message);
    }
}

// コマンドライン引数からパラメータを取得
const userName = process.argv[2];
const slackUserId = process.argv[3];

runDiaryGenerationTest(userName, slackUserId);

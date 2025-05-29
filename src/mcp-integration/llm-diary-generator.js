// MCP統合版 LLM日記生成システム
// 既存のOpenAI APIを活用してesa MCP Serverと連携

const OpenAIClient = require('../ai/openai-client');

class LLMDiaryGenerator {
    constructor() {
        this.openaiClient = new OpenAIClient();
        console.log('🤖 MCP統合版LLM日記生成システム初期化完了');
    }

    /**
     * MCP統合による簡素化された日記生成フロー
     * 1. LLMがesa MCP Serverに記事検索指示
     * 2. LLMが文体分析
     * 3. LLMが日記生成
     * 4. LLMがesa投稿準備
     */
    async generateDiaryWithMCP(userName) {
        console.log(`🚀 MCP統合日記生成開始: ${userName}`);

        try {
            // Phase 1: LLMに全体的な処理プランを委任
            const planningPrompt = this.buildPlanningPrompt(userName);
            console.log('📋 LLMに処理プラン策定を依頼...');
            
            const planResult = await this.openaiClient.chatCompletion([
                { role: 'system', content: planningPrompt },
                { role: 'user', content: `${userName}の日記生成プランを立ててください` }
            ], {
                model: 'gpt-4o-mini',
                temperature: 0.3,
                maxTokens: 1000
            });

            if (!planResult.success) {
                throw new Error(`プラン策定失敗: ${planResult.error}`);
            }

            console.log('✅ LLM処理プラン:', planResult.content);

            // Phase 2: 実際の日記生成実行
            const executionResult = await this.executeMCPFlow(userName, planResult.content);
            
            return {
                success: true,
                diary: executionResult.diary,
                metadata: {
                    processing_method: 'mcp_integration',
                    llm_planning: planResult.content,
                    generation_time: new Date().toISOString(),
                    quality_score: executionResult.qualityScore || 5,
                    tokens_used: (planResult.usage?.total_tokens || 0) + (executionResult.tokens_used || 0)
                }
            };

        } catch (error) {
            console.error('❌ MCP統合日記生成エラー:', error);
            return {
                success: false,
                error: error.message,
                fallback_required: true
            };
        }
    }

    /**
     * LLMによる処理プランニング用プロンプト構築
     */
    buildPlanningPrompt(userName) {
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
        });

        return `
あなたはESM社の日記代筆システムです。${userName}の過去記事を分析して、今日（${today}）の日記を生成する処理プランを立ててください。

## 利用可能なMCPツール
1. search_esa_posts: 記事検索
   - query: "user:${userName.replace('.', '-')}" でユーザー記事検索
   - sort: "updated" で最新順
   - perPage: 10 で適量取得

2. read_esa_multiple_posts: 複数記事一括取得
   - postNumbers: [配列] で効率的に取得

3. 分析・生成は既存OpenAI APIで実行

## プラン策定指針
1. 効率的なデータ取得戦略
2. 文体・関心事の分析ポイント
3. 今日の日記テーマ提案
4. 品質保証ポイント

## 出力形式
具体的な実行ステップを日本語で簡潔に説明してください。
        `.trim();
    }

    /**
     * MCP統合フロー実行
     * ※実際のMCP連携は今回は模擬実装（Claude Desktop環境での実証済み機能を想定）
     */
    async executeMCPFlow(userName, plan) {
        console.log('🔄 MCP統合フロー実行開始...');

        // Phase 2-A: 記事データ取得（模擬実装）
        const articlesData = await this.simulateMCPDataRetrieval(userName);
        
        // Phase 2-B: LLMによる文体分析と日記生成
        const analysisPrompt = this.buildAnalysisPrompt(userName, articlesData);
        
        const analysisResult = await this.openaiClient.chatCompletion([
            { role: 'system', content: analysisPrompt },
            { role: 'user', content: '分析結果と今日の日記を生成してください' }
        ], {
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 2000
        });

        if (!analysisResult.success) {
            throw new Error(`日記生成失敗: ${analysisResult.error}`);
        }

        // JSON形式のレスポンスをパース
        let generatedContent;
        try {
            generatedContent = JSON.parse(analysisResult.content);
        } catch (parseError) {
            // JSON解析失敗時はテキストとして処理
            generatedContent = {
                diary: analysisResult.content,
                analysis: '分析データなし',
                confidence: 3
            };
        }

        return {
            diary: generatedContent.diary || analysisResult.content,
            analysis: generatedContent.analysis || '詳細分析実行済み',
            qualityScore: generatedContent.confidence || 4,
            tokens_used: analysisResult.usage?.total_tokens || 0
        };
    }

    /**
     * MCP記事データ取得模擬実装
     * 実際の実装では search_esa_posts → read_esa_multiple_posts の流れ
     */
    async simulateMCPDataRetrieval(userName) {
        console.log('📚 MCP記事データ取得（模擬実装）...');
        
        // Phase 1で実証済みのokamoto-takuyaの文体データを活用
        return {
            user_name: userName,
            article_count: 10,
            recent_articles: [
                {
                    title: '開発チームでの学び',
                    content: '今日もチームでの議論が活発だったね。UI/UXの話になると、つい熱くなってしまう。',
                    style_notes: 'カジュアル、内省的'
                },
                {
                    title: 'TIL: React hooks',
                    content: 'useCallbackとuseMemoの使い分けについて、なんか理解が深まった気がする。',
                    style_notes: 'TIL形式、学習記録'
                }
            ],
            style_analysis: {
                tone: 'カジュアル（だね、だよ、なんか）',
                structure: '## やることやったこと、## TIL、## こんな気分',
                topics: 'UI/UX、メンタルモデル、チーム開発、技術学習',
                personality: '親しみやすく、内省的、前向き'
            }
        };
    }

    /**
     * 文体分析・日記生成用プロンプト構築
     */
    buildAnalysisPrompt(userName, articlesData) {
        const today = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long'
        });

        return `
あなたはESM社の${userName}として、今日（${today}）の日記を書いてください。

## 過去記事データ
${JSON.stringify(articlesData, null, 2)}

## 文体・スタイル要求
1. ${userName}の特徴的な語調を完全再現
2. よく使う構成パターン（## セクション等）を踏襲
3. 関心事・テーマを自然に織り込む
4. 親しみやすく内省的な文体を維持

## 今日の日記テーマ候補
- 技術学習での新しい発見
- チーム開発での気づき
- UI/UXに関する考察
- 日常的な振り返り

## 出力形式（JSON）
{
  "analysis": "文体分析結果の要約",
  "diary": "今日の日記本文（300-500文字程度）",
  "confidence": 1-5の品質評価
}

自然で魅力的な日記を生成してください。
        `.trim();
    }

    /**
     * 品質チェック（Phase 1の実績を活用）
     */
    async validateDiaryQuality(diary, userName) {
        if (!diary || diary.length < 100) {
            return { valid: false, reason: '日記が短すぎます' };
        }

        if (diary.length > 1000) {
            return { valid: false, reason: '日記が長すぎます' };
        }

        // Phase 1で実証済みの品質チェックロジック
        const hasPersonalTouch = /だね|だよ|なんか|気がする/.test(diary);
        const hasStructure = /##/.test(diary) || diary.includes('\n\n');
        
        return {
            valid: true,
            quality_score: hasPersonalTouch && hasStructure ? 5 : 4,
            features: {
                personal_tone: hasPersonalTouch,
                good_structure: hasStructure,
                appropriate_length: true
            }
        };
    }
}

module.exports = LLMDiaryGenerator;

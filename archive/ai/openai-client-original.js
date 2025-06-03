require('dotenv').config();

class OpenAIClient {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.defaultModel = 'gpt-4o-mini'; // コスト効率と長いコンテキスト
    
    console.log('🔍 OpenAI Client初期化デバッグ:');
    console.log(`   API Key存在: ${this.apiKey ? 'あり' : 'なし'}`);
    console.log(`   API Key長さ: ${this.apiKey ? this.apiKey.length : 0}文字`);
    console.log(`   API Key先頭: ${this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'なし'}`);
    
    if (!this.apiKey || this.apiKey === 'your_openai_api_key_here') {
      console.warn('⚠️  OpenAI API key not configured. Using fallback mode.');
      this.fallbackMode = true;
    } else {
      this.fallbackMode = false;
      console.log('✅ OpenAI API client initialized');
    }
  }

  // メインのチャット完了API呼び出し
  async chatCompletion(messages, options = {}) {
    console.log(`🤖 OpenAI API呼び出し開始 - フォールバックモード: ${this.fallbackMode}`);
    
    if (this.fallbackMode) {
      console.log('🔄 フォールバックモードで応答');
      return this.fallbackResponse(messages, options);
    }

    try {
      console.log('🌐 OpenAI APIに接続中...');
      const requestBody = {
        model: options.model || this.defaultModel,
        messages: messages,
        max_tokens: options.maxTokens || 1500,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
        ...options.additionalParams
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ OpenAI API応答成功');
      console.log(`   モデル: ${data.model}`);
      console.log(`   使用トークン: ${data.usage?.total_tokens || 'N/A'}`);
      
      return {
        success: true,
        content: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: data.model,
        finishReason: data.choices[0]?.finish_reason
      };

    } catch (error) {
      console.error('❌ OpenAI API呼び出しエラー:', error.message);
      console.log('🔄 エラー時フォールバックを使用');
      return {
        success: false,
        error: error.message,
        fallback: this.fallbackResponse(messages, options)
      };
    }
  }

  // プロフィール分析専用のAPI呼び出し
  async analyzeProfile(articles, targetUser) {
    // 記事データを要約して最適化
    const optimizedArticles = this.optimizeArticlesForAnalysis(articles);
    
    const systemPrompt = `あなたは文体分析の専門家です。
与えられたesa記事から、${targetUser}さんの文体的特徴を詳細に分析してください。

分析観点：
1. 語調・文体（カジュアル/フォーマル/技術的など）
2. よく使う表現・語尾
3. 感情表現の特徴
4. 記事構成の傾向
5. 技術的関心領域
6. 典型的な行動パターン

結果は以下のJSON形式で返してください：
{
  "writing_style": {
    "primary_tone": "casual|formal|technical",
    "characteristic_expressions": ["表現1", "表現2"],
    "emotion_style": "description",
    "formality_level": 1-5
  },
  "interests": {
    "main_categories": ["category1", "category2"],
    "technical_keywords": ["keyword1", "keyword2"],
    "learning_patterns": ["pattern1", "pattern2"]
  },
  "behavior_patterns": {
    "typical_tasks": ["task1", "task2"],
    "work_style": "description",
    "article_structure": "description"
  },
  "personality_traits": {
    "communication_style": "description",
    "problem_solving_approach": "description",
    "team_interaction": "description"
  }
}`;

    const userPrompt = `以下は${targetUser}さんのesa記事の要約です（分析用に最適化）：

${optimizedArticles}

上記の記事を分析して、${targetUser}さんの文体的特徴をJSONで返してください。`;

    return this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      model: 'gpt-4o-mini', // 長いコンテキストに対応
      temperature: 0.3, // 分析は安定した結果を求める
      maxTokens: 2000
    });
  }

  // 記事データを分析用に最適化
  optimizeArticlesForAnalysis(articles) {
    return articles.slice(0, 15).map((article, index) => {
      // 本文を重要部分のみに要約
      const body = article.body_md || '';
      const lines = body.split('\n');
      
      // 重要な行を抽出（タスク、感情表現、TILなど）
      const importantLines = lines.filter(line => 
        line.includes('- [x]') || 
        line.includes('##') ||
        line.toLowerCase().includes('til') ||
        line.includes('気分') ||
        line.includes('感じ') ||
        line.includes('だね') ||
        line.includes('って') ||
        line.length > 0 && line.length < 100
      ).slice(0, 10); // 最初の10行のみ
      
      const optimizedBody = importantLines.join('\n');
      
      return `--- 記事${index + 1}: ${article.name} ---
${optimizedBody.substring(0, 500)}${optimizedBody.length > 500 ? '...' : ''}`;
    }).join('\n\n');
  }

  // 日記生成専用のAPI呼び出し
  async generateDiary(targetUser, actions, profileAnalysis, contextData = {}) {
    const systemPrompt = `あなたは${targetUser}さんの代筆を行う専門システムです。
${targetUser}さんの文体的特徴を完全に再現し、自然で個性的な日記を生成してください。

文体特徴：
- 語調: ${profileAnalysis.writing_style?.primary_tone || 'casual'}
- 特徴的表現: ${profileAnalysis.writing_style?.characteristic_expressions?.join(', ') || '一般的な表現'}
- 感情表現: ${profileAnalysis.writing_style?.emotion_style || '標準的'}
- 関心事: ${profileAnalysis.interests?.main_categories?.join(', ') || '技術全般'}

**絶対的な生成ルール（厳守）**：
1. 出力の1行目は必ず「タイトル: 【代筆】${targetUser}: [内容に基づく具体的なタイトル]」
2. 2行目は空行
3. 3行目から日記本文開始
4. ${targetUser}さんらしい文体で書く
5. 以下の構成で書く：
   ## やることやったこと
   ## TIL  
   ## こんな気分

**出力テンプレート（必ず従ってください）**：
タイトル: 【代筆】${targetUser}: [今日の内容を表す具体的なタイトル]

## やることやったこと
[内容]

## TIL
[内容]

## こんな気分
[内容]

**重要**: 絶対に「タイトル:」から始めてください。セクションヘッダー（##）から始めることは禁止です。`;

    const actionsText = actions.length > 0 ? 
      actions.map((action, i) => `${i + 1}. ${action}`).join('\n') : 
      '今日の具体的な作業内容は不明';

    const userPrompt = `今日の${targetUser}さんの行動：
${actionsText}

${contextData.additional_context ? `追加コンテキスト：\n${contextData.additional_context}` : ''}

上記の情報を基に、${targetUser}さんらしい日記を生成してください。

**出力の1行目は必ず「タイトル: 【代筆】${targetUser}: [具体的なタイトル]」から始めてください。**

例：
タイトル: 【代筆】${targetUser}: プログラミングでいい感じの進捗があった日

## やることやったこと
...

この形式を厳守してください。`;

    return this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      model: 'gpt-4o-mini', // 効率的なモデル
      temperature: 0.6, // 創造性と制御のバランス
      maxTokens: 1200
    });
  }

  // 日記の品質チェック
  async qualityCheck(generatedDiary, targetUser, originalActions) {
    const systemPrompt = `生成された日記の品質をチェックしてください。

評価観点：
1. 自然さ (1-5)
2. 個性の再現度 (1-5)  
3. 内容の整合性 (1-5)
4. 文体の一貫性 (1-5)
5. 全体的な完成度 (1-5)

JSON形式で評価結果を返してください：
{
  "scores": {
    "naturalness": 1-5,
    "personality": 1-5,
    "consistency": 1-5,
    "style": 1-5,
    "overall": 1-5
  },
  "feedback": "改善点や良い点",
  "suggestions": ["改善提案1", "改善提案2"]
}`;

    const userPrompt = `対象ユーザー: ${targetUser}
元の行動: ${originalActions.join(', ')}

生成された日記:
${generatedDiary}

この日記の品質を評価してください。`;

    return this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      model: 'gpt-4o-mini', // コスト効率を重視
      temperature: 0.2, // 評価は客観的に
      maxTokens: 800
    });
  }

  // フォールバックレスポンス（API未設定時）
  fallbackResponse(messages, options) {
    console.log('🔄 OpenAI API未設定のため、フォールバック応答を使用');
    
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    if (lastMessage.includes('分析')) {
      return {
        success: true,
        content: JSON.stringify({
          writing_style: {
            primary_tone: "casual",
            characteristic_expressions: ["だね", "って感じ"],
            emotion_style: "フレンドリーで親しみやすい",
            formality_level: 2
          },
          interests: {
            main_categories: ["バックエンド", "AI"],
            technical_keywords: ["API", "データベース"],
            learning_patterns: ["実装して学ぶタイプ"]
          },
          behavior_patterns: {
            typical_tasks: ["実装", "コードレビュー", "技術調査"],
            work_style: "集中型",
            article_structure: "やったこと中心"
          },
          personality_traits: {
            communication_style: "カジュアルで分かりやすい",
            problem_solving_approach: "実践的",
            team_interaction: "協力的"
          }
        }, null, 2),
        fallback: true
      };
    } else if (lastMessage.includes('日記')) {
      return {
        success: true,
        content: `タイトル: 【代筆】okamoto-takuya: 今日も開発でいい進捗だった日

## やることやったこと

- [x] 代筆さんシステムの改善作業
- [x] OpenAI API統合の検討
- [x] LLM連携機能の実装

## TIL

- AIを活用した文章生成の仕組みについて理解が深まった
- プロンプトエンジニアリングの重要性を実感

## こんな気分

技術的な挑戦が多い一日だったけど、着実に進歩している感じ。AI統合は予想以上に上手くいった、この調子で進めていきたいね！`,
        fallback: true
      };
    }
    
    return {
      success: true,
      content: 'フォールバック応答: API設定後に正常な応答が得られます。',
      fallback: true
    };
  }

  // API利用状況の確認
  async checkApiStatus() {
    if (this.fallbackMode) {
      return {
        status: 'not_configured',
        message: 'OpenAI API key not configured'
      };
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        return {
          status: 'active',
          message: 'OpenAI API is accessible'
        };
      } else {
        return {
          status: 'error',
          message: `API Error: ${response.status}`
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
}

module.exports = OpenAIClient;

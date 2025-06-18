require('dotenv').config();

class OpenAIClient {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.defaultModel = 'gpt-4o-mini';
    
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

  // 日記生成専用のAPI呼び出し - 関心事反映強化版
  async generateDiary(targetUser, actions, profileAnalysis, contextData = {}) {
    // 🔧 改善1: プロフィール分析結果から具体的な関心事を抽出
    const interests = this.extractDetailedInterests(profileAnalysis);
    const techKeywords = this.extractTechnicalKeywords(profileAnalysis);
    const workPatterns = this.extractWorkPatterns(profileAnalysis);
    
    console.log('🎯 関心事抽出結果:', {
      interests: interests,
      techKeywords: techKeywords,
      workPatterns: workPatterns
    });

    // 🔧 改善2: 関心事に基づく具体的なシステムプロンプト
    const systemPrompt = `あなたは${targetUser}さんの代筆を行う専門システムです。
${targetUser}さんの文体的特徴と関心領域を完全に再現し、技術的で具体性のある日記を生成してください。

## ${targetUser}さんの特徴分析結果

### 文体特徴
- 語調: ${profileAnalysis.writing_style?.primary_tone || 'casual'}
- 特徴的表現: ${profileAnalysis.writing_style?.characteristic_expressions?.join(', ') || '一般的な表現'}
- 感情表現: ${profileAnalysis.writing_style?.emotion_style || '標準的'}

### 技術的関心領域（必ず反映）
- **主要関心事**: ${interests.join(', ')}
- **技術キーワード**: ${techKeywords.join(', ')}
- **典型的な作業**: ${workPatterns.join(', ')}

### 生成における重要な指針
1. **技術的具体性**: 抽象的な「タスク」ではなく、具体的な技術作業を記述
2. **関心事の反映**: ${interests.join('、')}に関連する内容を必ず含める
3. **専門用語の活用**: ${techKeywords.join('、')}などの技術用語を自然に使用
4. **学習・発見の描写**: 技術的な学びや発見を具体的に記述

**絶対的な生成ルール（厳守）**：
1. 出力の1行目は必ず「タイトル: 【代筆】${targetUser}: [技術的内容を含む具体的なタイトル]」
2. 2行目は空行
3. 3行目から日記本文開始
4. ${targetUser}さんらしい文体で書く
5. 以下の構成で書く：
   ## やることやったこと
   ## TIL  
   ## こんな気分

**技術的内容の例（必ず参考にする）**：
- 「${techKeywords[0] || 'API'}の実装作業」
- 「${interests[0] || 'バックエンド'}システムの改善」
- 「${techKeywords[1] || 'データベース'}のパフォーマンス調査」
- 「${interests[1] || 'AI'}関連の新しい技術調査」

**出力テンプレート（必ず従ってください）**：
タイトル: 【代筆】${targetUser}: [技術的内容を含む具体的なタイトル]

## やることやったこと
[具体的な技術作業、${interests.join('・')}に関連する内容を含む]

## TIL
[技術的な学び、${techKeywords.join('・')}に関する発見]

## こんな気分
[技術作業への感想、達成感や課題意識を含む]`;

    // 🔧 改善3: アクションが不明な場合の関心事ベース生成
    const enhancedActionsText = this.generateContextAwareActions(actions, interests, techKeywords, workPatterns);
    
    const userPrompt = `今日の${targetUser}さんの行動（関心事に基づいて拡張）：
${enhancedActionsText}

**重要**: ${targetUser}さんの主要関心事（${interests.join('、')}）を必ず反映し、技術的に具体的な内容を生成してください。

${contextData.additional_context ? `追加コンテキスト：\n${contextData.additional_context}` : ''}

**出力の1行目は必ず「タイトル: 【代筆】${targetUser}: [技術的内容を含む具体的なタイトル]」から始めてください。**

例：
タイトル: 【代筆】${targetUser}: ${this.generateExampleTitle(interests, techKeywords)}

この形式を厳守し、技術的関心事を具体的に反映してください。`;

    return this.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], {
      model: 'gpt-4o-mini',
      temperature: 0.7, // 創造性を少し高めて具体性を向上
      maxTokens: 1200
    });
  }

  // 🔧 新機能: 詳細な関心事抽出
  extractDetailedInterests(profileAnalysis) {
    const interests = [];
    
    // プロフィール分析からの抽出
    if (profileAnalysis.interests?.main_categories) {
      interests.push(...profileAnalysis.interests.main_categories);
    }
    
    if (profileAnalysis.interests?.technical_keywords) {
      interests.push(...profileAnalysis.interests.technical_keywords);
    }
    
    // 行動パターンからの推定
    if (profileAnalysis.behavior_patterns?.typical_tasks) {
      const tasks = profileAnalysis.behavior_patterns.typical_tasks;
      if (tasks.some(task => task.includes('API'))) interests.push('API開発');
      if (tasks.some(task => task.includes('DB') || task.includes('データベース'))) interests.push('データベース設計');
      if (tasks.some(task => task.includes('AI') || task.includes('機械学習'))) interests.push('AI・機械学習');
      if (tasks.some(task => task.includes('実装'))) interests.push('ソフトウェア実装');
    }
    
    // デフォルト値（空の場合）
    if (interests.length === 0) {
      interests.push('ソフトウェア開発', '技術調査', 'システム改善');
    }
    
    return [...new Set(interests)].slice(0, 3); // 重複除去、最大3つ
  }

  // 🔧 新機能: 技術キーワード抽出
  extractTechnicalKeywords(profileAnalysis) {
    const keywords = [];
    
    if (profileAnalysis.interests?.technical_keywords) {
      keywords.push(...profileAnalysis.interests.technical_keywords);
    }
    
    if (profileAnalysis.interests?.main_categories) {
      profileAnalysis.interests.main_categories.forEach(category => {
        if (category.toLowerCase().includes('backend')) keywords.push('バックエンド', 'API', 'データベース');
        if (category.toLowerCase().includes('ai')) keywords.push('AI', '機械学習', 'LLM');
        if (category.toLowerCase().includes('frontend')) keywords.push('フロントエンド', 'UI', 'React');
        if (category.toLowerCase().includes('devops')) keywords.push('DevOps', 'CI/CD', 'インフラ');
      });
    }
    
    // デフォルト値
    if (keywords.length === 0) {
      keywords.push('API', 'データベース', 'システム設計', 'プログラミング');
    }
    
    return [...new Set(keywords)].slice(0, 4); // 重複除去、最大4つ
  }

  // 🔧 新機能: 作業パターン抽出
  extractWorkPatterns(profileAnalysis) {
    const patterns = [];
    
    if (profileAnalysis.behavior_patterns?.typical_tasks) {
      patterns.push(...profileAnalysis.behavior_patterns.typical_tasks);
    }
    
    // 作業スタイルからの推定
    if (profileAnalysis.behavior_patterns?.work_style) {
      const workStyle = profileAnalysis.behavior_patterns.work_style;
      if (workStyle.includes('実装')) patterns.push('コード実装', '機能開発');
      if (workStyle.includes('設計')) patterns.push('システム設計', 'アーキテクチャ検討');
      if (workStyle.includes('調査')) patterns.push('技術調査', '情報収集');
    }
    
    // デフォルト値
    if (patterns.length === 0) {
      patterns.push('コード実装', '技術調査', 'システム改善', 'チーム連携');
    }
    
    return [...new Set(patterns)].slice(0, 3); // 重複除去、最大3つ
  }

  // 🔧 新機能: 関心事ベースのアクション生成
  generateContextAwareActions(originalActions, interests, techKeywords, workPatterns) {
    if (originalActions.length > 0 && 
        originalActions.some(action => action !== '今日のタスクと日常作業')) {
      // 元のアクションがある場合は、それを技術的に強化
      return originalActions.map(action => 
        this.enhanceActionWithTechnicalContext(action, interests, techKeywords)
      ).map((action, i) => `${i + 1}. ${action}`).join('\n');
    }
    
    // アクションが不明または汎用的な場合、関心事に基づいて生成
    const contextAwareActions = [
      `${interests[0] || 'バックエンド'}システムの${workPatterns[0] || '実装作業'}`,
      `${techKeywords[0] || 'API'}を使った${workPatterns[1] || '機能開発'}`,
      `${techKeywords[1] || 'データベース'}の${workPatterns[2] || 'パフォーマンス調査'}`,
      `${interests[1] || 'AI'}関連の技術調査と実装検討`
    ];
    
    // ランダムに2-3個選択
    const selectedActions = contextAwareActions
      .sort(() => 0.5 - Math.random())
      .slice(0, 2 + Math.floor(Math.random() * 2));
    
    return selectedActions.map((action, i) => `${i + 1}. ${action}`).join('\n');
  }

  // 🔧 新機能: アクションの技術的強化
  enhanceActionWithTechnicalContext(action, interests, techKeywords) {
    if (action === '今日のタスクと日常作業' || action.includes('日常作業')) {
      return `${interests[0] || 'バックエンド'}関連の実装作業と${techKeywords[0] || 'API'}改善`;
    }
    
    if (action.includes('タスク') && !action.includes('API') && !action.includes('実装')) {
      return `${action.replace('タスク', `${techKeywords[0] || '開発'}タスク`)}（${interests[0] || '技術'}関連）`;
    }
    
    return action;
  }

  // 🔧 新機能: 関心事ベースのタイトル例生成
  generateExampleTitle(interests, techKeywords) {
    const templates = [
      `${techKeywords[0] || 'API'}実装でいい感じの進捗があった日`,
      `${interests[0] || 'バックエンド'}開発で新しい発見があった日`,
      `${techKeywords[1] || 'システム'}改善に集中できた日`,
      `${interests[1] || 'AI'}技術の調査で学びがあった日`,
      `${techKeywords[0] || 'プログラミング'}でスムーズに進められた日`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // 既存のメソッド...
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
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 2000
    });
  }

  // 記事データを分析用に最適化
  optimizeArticlesForAnalysis(articles) {
    return articles.slice(0, 15).map((article, index) => {
      const body = article.body_md || '';
      const lines = body.split('\n');
      
      const importantLines = lines.filter(line => 
        line.includes('- [x]') || 
        line.includes('##') ||
        line.toLowerCase().includes('til') ||
        line.includes('気分') ||
        line.includes('感じ') ||
        line.includes('だね') ||
        line.includes('って') ||
        line.length > 0 && line.length < 100
      ).slice(0, 10);
      
      const optimizedBody = importantLines.join('\n');
      
      return `--- 記事${index + 1}: ${article.name} ---
${optimizedBody.substring(0, 500)}${optimizedBody.length > 500 ? '...' : ''}`;
    }).join('\n\n');
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
      model: 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 800
    });
  }

  // フォールバックレスポンス - 関心事反映版
  fallbackResponse(messages, options) {
    console.log('🔄 OpenAI API未設定のため、フォールバック応答を使用');
    
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    if (lastMessage.includes('分析')) {
      return {
        success: true,
        content: JSON.stringify({
          writing_style: {
            primary_tone: "casual",
            characteristic_expressions: ["だね", "って感じ", "いい感じ"],
            emotion_style: "フレンドリーで親しみやすい",
            formality_level: 2
          },
          interests: {
            main_categories: ["ソフトウェア開発", "システム設計", "技術調査"],
            technical_keywords: ["API", "データベース", "システム設計", "プログラミング"],
            learning_patterns: ["実装して学ぶタイプ", "新技術への積極的取り組み"]
          },
          behavior_patterns: {
            typical_tasks: ["API実装", "システム改善", "技術調査", "開発作業"],
            work_style: "技術的な深掘りを好む集中型",
            article_structure: "具体的な実装内容中心"
          },
          personality_traits: {
            communication_style: "技術的だがカジュアルで分かりやすい",
            problem_solving_approach: "実践的・体系的",
            team_interaction: "技術共有を重視する協力的"
          }
        }, null, 2),
        fallback: true
      };
    } else if (lastMessage.includes('日記')) {
      return {
        success: true,
        content: `タイトル: 【代筆】一般ユーザー: 開発作業で着実な進捗があった日

## やることやったこと

- [x] システム機能の実装作業
- [x] API連携部分の改善
- [x] データベース設計の見直し
- [x] 技術仕様の検討と調査

## TIL

- 効率的な開発手法について新しい知見を得ることができた
- システム間連携の仕組みについて理解が深まった
- API設計において、拡張性と性能のバランスを取るアプローチを学んだ
- 継続的な改善活動の重要性について再認識した

## こんな気分

技術的な課題に集中して取り組めた一日だった。システム改善が順調に進んで良い手応えを感じている。新しい発見もあって充実していた。明日も継続してより良いシステムを目指していきたい。`,
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
const Profile = require('../database/models/profile');
const User = require('../database/models/user');
const OpenAIClient = require('../ai/openai-client');
const UserMappingManager = require('./user-mapping-manager');

class AIProfileAnalyzer {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.userMappingManager = new UserMappingManager();
    
    // フォールバック用の従来の分析パターン
    this.analysisPatterns = {
      tones: {
        casual: ['だね', 'だな', 'でしょ', 'じゃん', '〜', 'って'],
        formal: ['です', 'ます', 'である', 'であります', 'ございます'],
        technical: ['実装', 'アーキテクチャ', 'リファクタリング', 'デプロイ', 'API']
      },
      emotions: {
        positive: ['嬉しい', '楽しい', '良い', 'ナイス', '最高', '👍', '😊', '🎉'],
        negative: ['難しい', '大変', '困った', '厳しい', '😰', '😅'],
        neutral: ['思う', '感じる', '考える', 'という']
      },
      techInterests: {
        backend: ['API', 'データベース', 'サーバー', 'バックエンド', 'DB'],
        frontend: ['フロント', 'UI', 'UX', 'React', 'Vue', 'CSS'],
        infrastructure: ['インフラ', 'AWS', 'Docker', 'Kubernetes', 'CI/CD'],
        ai_ml: ['AI', 'ML', '機械学習', 'ChatGPT', 'Claude', 'LLM']
      }
    };
  }

  // ユーザー名の正規化（SlackユーザーIDをesaのscreen_nameにマッピング）
  normalizeUserName(userName) {
    // 既知のマッピング
    const userMappings = {
      'takuya.okamoto': 'okamoto-takuya',
      'takuya_okamoto': 'okamoto-takuya',
      // 他のユーザーのマッピングも必要に応じて追加
    };
    
    // マッピングがある場合は使用
    if (userMappings[userName]) {
      return userMappings[userName];
    }
    
    // マッピングがない場合は元の名前をそのまま使用
    return userName;
  }
  
  // 複数のユーザー名パターンを試行する
  async getUserArticlesWithFallback(esaAPI, userName) {
    const userNamePatterns = [
      userName,
      this.normalizeUserName(userName),
      // 逆変換も試す
      userName.replace('-', '.'),
      userName.replace('.', '-'),
      userName.replace('_', '-'),
      userName.replace('-', '_')
    ];
    
    // 重複を除去
    const uniquePatterns = [...new Set(userNamePatterns)];
    
    console.log(`🔍 検索パターン一覧: ${uniquePatterns.join(', ')}`);
    
    for (const pattern of uniquePatterns) {
      console.log(`🔎 "${pattern}" で検索中...`);
      const result = await esaAPI.getUserDiaryPosts(pattern, 50);
      
      if (result.success && result.posts.length > 0) {
        console.log(`✅ "${pattern}" で${result.posts.length}件の記事を発見`);
        return result;
      }
    }
    
    console.log(`❌ 全ての検索パターンで記事が見つかりませんでした`);
    return {
      success: false,
      posts: [],
      error: '記事が見つかりませんでした'
    };
  }

  // メイン分析処理（AI統合版）
  async analyzeProfile(screenName, articlesData) {
    console.log(`🤖 ${screenName}のAI統合プロフィール分析開始...`);
    
    try {
      let aiAnalysis = null;
      let fallbackAnalysis = null;

      // AI分析を試行
      if (articlesData.length > 0) {
        console.log(`🔄 AI分析実行中... (${articlesData.length}件の記事)`);
        const aiResult = await this.openaiClient.analyzeProfile(articlesData, screenName);
        
        if (aiResult.success && !aiResult.fallback) {
          try {
            // JSONマークアップを除去
            let content = aiResult.content.trim();
            if (content.startsWith('```json')) {
              content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }
            aiAnalysis = JSON.parse(content);
            console.log('✅ AI分析成功');
          } catch (parseError) {
            console.warn('⚠️  AI分析結果のパース失敗、フォールバック使用');
            console.log('Raw AI response:', aiResult.content);
          }
        } else {
          console.log('🔄 AI分析失敗またはフォールバック、従来方式を併用');
        }
      }

      // フォールバック分析（従来方式）
      fallbackAnalysis = this.traditionalAnalysis(articlesData);
      console.log('✅ 従来方式分析完了');

      // AI分析と従来分析を統合
      const integratedAnalysis = this.integrateAnalyses(aiAnalysis, fallbackAnalysis);
      
      // ユーザー検索（存在しない場合は作成）
      let user = await User.findByUsername(screenName);
      if (!user) {
        user = await User.create({
          slack_user_id: `ai_${screenName}`,
          slack_username: screenName
        });
      }
      
      // プロフィール保存/更新
      const profileData = {
        user_id: user.id,
        screen_name: screenName,
        writing_style: JSON.stringify(integratedAnalysis.writing_style),
        interests: JSON.stringify(integratedAnalysis.interests),
        behavior_patterns: JSON.stringify(integratedAnalysis.behavior_patterns),
        article_count: articlesData.length,
        ai_analysis_used: aiAnalysis !== null,
        analysis_quality: this.calculateAnalysisQuality(aiAnalysis, fallbackAnalysis)
      };
      
      const profile = await Profile.createOrUpdate(profileData);
      
      console.log(`🎉 ${screenName}のAI統合プロフィール分析完了`);
      console.log(`   📊 分析記事数: ${articlesData.length}`);
      console.log(`   🤖 AI分析: ${aiAnalysis ? '成功' : 'フォールバック'}`);
      console.log(`   📝 文体特徴: ${integratedAnalysis.writing_style.primary_tone}`);
      console.log(`   🎯 主要関心事: ${integratedAnalysis.interests.main_categories.join(', ')}`);
      console.log(`   ⭐ 分析品質: ${profileData.analysis_quality}/5`);
      
      return {
        success: true,
        profile: profile,
        analysis: integratedAnalysis,
        metadata: {
          ai_used: aiAnalysis !== null,
          fallback_used: fallbackAnalysis !== null,
          article_count: articlesData.length,
          quality_score: profileData.analysis_quality
        }
      };
      
    } catch (error) {
      console.error(`❌ ${screenName}のAI統合プロフィール分析エラー:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 従来方式の分析（フォールバック用）
  traditionalAnalysis(articles) {
    const allText = articles.map(article => 
      `${article.name} ${article.body_md || ''}`
    ).join(' ');
    
    // 語調分析
    const toneScores = {};
    for (const [tone, patterns] of Object.entries(this.analysisPatterns.tones)) {
      toneScores[tone] = patterns.reduce((count, pattern) => {
        const regex = new RegExp(pattern, 'gi');
        return count + (allText.match(regex) || []).length;
      }, 0);
    }
    
    const primaryTone = Object.entries(toneScores)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    // 感情表現分析
    const emotionScores = {};
    for (const [emotion, patterns] of Object.entries(this.analysisPatterns.emotions)) {
      emotionScores[emotion] = patterns.reduce((count, pattern) => {
        const regex = new RegExp(pattern, 'gi');
        return count + (allText.match(regex) || []).length;
      }, 0);
    }
    
    // 技術分野分析
    const techScores = {};
    for (const [category, keywords] of Object.entries(this.analysisPatterns.techInterests)) {
      techScores[category] = keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        return count + (allText.match(regex) || []).length;
      }, 0);
    }
    
    const mainCategories = Object.entries(techScores)
      .filter(([, score]) => score > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // 記事の長さ分析
    const lengths = articles.map(article => (article.body_md || '').length);
    const avgLength = lengths.length > 0 ? 
      lengths.reduce((sum, len) => sum + len, 0) / lengths.length : 0;
    
    // 絵文字使用頻度
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiCount = (allText.match(emojiRegex) || []).length;
    const emojiFrequency = articles.length > 0 ? emojiCount / articles.length : 0;

    return {
      writing_style: {
        primary_tone: primaryTone,
        tone_scores: toneScores,
        emotion_scores: emotionScores,
        avg_article_length: Math.round(avgLength),
        emoji_frequency: Math.round(emojiFrequency * 10) / 10,
        characteristic_expressions: this.extractCharacteristicPhrases(allText),
        formality_level: this.calculateFormalityLevel(toneScores)
      },
      interests: {
        tech_scores: techScores,
        main_categories: mainCategories,
        frequent_keywords: this.extractKeywords(allText).slice(0, 10),
        learning_patterns: this.extractLearningTopics(articles)
      },
      behavior_patterns: {
        typical_tasks: this.extractTypicalTasks(articles),
        work_style: this.inferWorkStyle(articles),
        posting_frequency: this.calculatePostingFrequency(articles),
        article_structure: this.analyzeArticleStructure(articles)
      }
    };
  }

  // AI分析と従来分析の統合
  integrateAnalyses(aiAnalysis, fallbackAnalysis) {
    if (!aiAnalysis) {
      // AI分析が失敗した場合は従来分析をそのまま使用
      return fallbackAnalysis;
    }

    // AI分析を基本として、従来分析で補完
    return {
      writing_style: {
        primary_tone: aiAnalysis.writing_style?.primary_tone || 
                     fallbackAnalysis.writing_style.primary_tone,
        characteristic_expressions: [
          ...(aiAnalysis.writing_style?.characteristic_expressions || []),
          ...fallbackAnalysis.writing_style.characteristic_expressions
        ].slice(0, 8),
        emotion_style: aiAnalysis.writing_style?.emotion_style || 
                      '標準的な感情表現',
        formality_level: aiAnalysis.writing_style?.formality_level || 
                        fallbackAnalysis.writing_style.formality_level,
        // 従来分析の詳細データも保持
        tone_scores: fallbackAnalysis.writing_style.tone_scores,
        emotion_scores: fallbackAnalysis.writing_style.emotion_scores,
        avg_article_length: fallbackAnalysis.writing_style.avg_article_length,
        emoji_frequency: fallbackAnalysis.writing_style.emoji_frequency
      },
      interests: {
        main_categories: [
          ...(aiAnalysis.interests?.main_categories || []),
          ...fallbackAnalysis.interests.main_categories
        ].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 5),
        technical_keywords: [
          ...(aiAnalysis.interests?.technical_keywords || []),
          ...fallbackAnalysis.interests.frequent_keywords
        ].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 10),
        learning_patterns: aiAnalysis.interests?.learning_patterns || 
                          fallbackAnalysis.interests.learning_patterns,
        // 従来分析の詳細データも保持
        tech_scores: fallbackAnalysis.interests.tech_scores
      },
      behavior_patterns: {
        typical_tasks: [
          ...(aiAnalysis.behavior_patterns?.typical_tasks || []),
          ...fallbackAnalysis.behavior_patterns.typical_tasks
        ].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 8),
        work_style: aiAnalysis.behavior_patterns?.work_style || 
                   fallbackAnalysis.behavior_patterns.work_style,
        article_structure: aiAnalysis.behavior_patterns?.article_structure || 
                          '標準的な構成',
        // 従来分析の詳細データも保持
        posting_frequency: fallbackAnalysis.behavior_patterns.posting_frequency
      },
      personality_traits: aiAnalysis.personality_traits || {
        communication_style: '協力的でフレンドリー',
        problem_solving_approach: '実践的',
        team_interaction: '積極的'
      }
    };
  }

  // Slack Bot用: esaから記事を取得してプロフィール分析
  // Phase 2: 段階的移行マネージャーの結果を必須とする（従来マッピング廃止）
  async analyzeFromEsa(slackUserName, esaScreenName) {
    console.log(`📡 ${slackUserName}のesa記事を取得してプロフィール分析...`);
    
    try {
      // 段階的移行マネージャーからのesaScreenNameは必須
      if (!esaScreenName) {
        console.log(`❌ エラー: esaScreenNameが提供されていません`);
        console.log(`💡 段階的移行マネージャーでマッピングを先に実行してください`);
        return this.generateDefaultProfile(slackUserName);
      }
      
      console.log(`✅ 段階的移行マネージャー結果使用: ${slackUserName} → ${esaScreenName}`);
      
      // esa API経由で記事を取得
      const EsaAPI = require('./esa-api');
      const esaAPI = new EsaAPI();
      esaAPI.accessToken = process.env.ESA_ACCESS_TOKEN;
      
      // マッピングされた正確なesaスクリーンネームで検索
      const result = await esaAPI.getUserDiaryPosts(esaScreenName, 50);
      
      if (!result.success) {
        console.log(`⚠️  ${esaScreenName}の記事検索に失敗: ${result.error}`);
        return this.generateDefaultProfile(slackUserName);
      }
      
      const articles = result.posts || [];
      console.log(`📊 ${esaScreenName}の記事取得完了: ${articles.length}件`);
      
      if (articles.length === 0) {
        console.log(`⚠️  ${esaScreenName}の記事が見つかりません - デフォルトプロフィールを生成`);
        return this.generateDefaultProfile(slackUserName);
      }
      
      // 記事の詳細内容を取得（最新10件のみ）
      const detailedArticles = [];
      const articlesToAnalyze = articles.slice(0, 10);
      
      for (const article of articlesToAnalyze) {
        if (article.body_md) {
          // 既に本文がある場合はそのまま使用
          detailedArticles.push(article);
        } else {
          // 本文がない場合は詳細を取得
          const detailResult = await esaAPI.getPost(article.number);
          if (detailResult.success) {
            detailedArticles.push(detailResult.post);
          }
          // API制限を考慮して少し待機
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`📝 詳細データ取得完了: ${detailedArticles.length}件`);
      
      // 記事データを分析用形式に変換
      const articlesData = detailedArticles.map(article => ({
        name: article.name,
        body_md: article.body_md || '',
        created_at: article.created_at,
        updated_at: article.updated_at
      }));
      
      // Phase 2: 段階的移行マネージャーの結果に基づいてプロフィール分析
      const analysisResult = await this.analyzeProfile(esaScreenName, articlesData);
      
      if (analysisResult.success) {
        console.log(`✅ ${slackUserName} (→ ${esaScreenName})のプロフィール分析完了`);
        return analysisResult.analysis;
      } else {
        console.log(`⚠️  プロフィール分析失敗: ${analysisResult.error}`);
        return this.generateDefaultProfile(slackUserName);
      }
      
    } catch (error) {
      console.error(`❌ ${slackUserName}のesa記事取得エラー:`, error);
      return this.generateDefaultProfile(slackUserName);
    }
  }
  
  // デフォルトプロフィール生成
  generateDefaultProfile(userName) {
    return {
      writing_style: {
        primary_tone: 'casual',
        characteristic_expressions: ['だと思います', 'という感じ', 'って感じ'],
        emotion_style: '親しみやすい',
        formality_level: 3,
        tone_scores: { casual: 5, formal: 2, technical: 3 },
        emotion_scores: { positive: 3, neutral: 5, negative: 1 },
        avg_article_length: 500,
        emoji_frequency: 0.5
      },
      interests: {
        main_categories: ['開発', 'プログラミング'],
        technical_keywords: ['JavaScript', 'API', 'システム'],
        learning_patterns: ['新しい技術の学習', '問題解決'],
        tech_scores: { backend: 3, frontend: 2, infrastructure: 1, ai_ml: 1 }
      },
      behavior_patterns: {
        typical_tasks: ['コード実装', '技術調査', 'バグ修正'],
        work_style: 'バランス型',
        article_structure: '標準的な構成',
        posting_frequency: '週数回'
      },
      personality_traits: {
        communication_style: '協力的でフレンドリー',
        problem_solving_approach: '実践的',
        team_interaction: '積極的'
      }
    };
  }

  // 分析品質を計算
  calculateAnalysisQuality(aiAnalysis, fallbackAnalysis) {
    let score = 3; // ベーススコア（従来分析のみの場合）
    
    if (aiAnalysis) {
      score = 4; // AI分析成功の場合
      
      // AI分析の充実度をチェック
      const hasDetailedStyle = aiAnalysis.writing_style?.characteristic_expressions?.length > 0;
      const hasDetailedInterests = aiAnalysis.interests?.main_categories?.length > 0;
      const hasPersonality = aiAnalysis.personality_traits !== undefined;
      
      if (hasDetailedStyle && hasDetailedInterests && hasPersonality) {
        score = 5; // 高品質分析
      }
    }
    
    return score;
  }

  // フォーマリティレベル計算
  calculateFormalityLevel(toneScores) {
    const formal = toneScores.formal || 0;
    const casual = toneScores.casual || 0;
    const technical = toneScores.technical || 0;
    
    const total = formal + casual + technical;
    if (total === 0) return 3;
    
    const formalRatio = formal / total;
    const technicalRatio = technical / total;
    
    if (formalRatio > 0.6) return 5;
    if (formalRatio > 0.4 || technicalRatio > 0.5) return 4;
    if (formalRatio > 0.2) return 3;
    if (formalRatio > 0.1) return 2;
    return 1;
  }

  // 以下、従来分析のヘルパーメソッド（再利用）
  extractCharacteristicPhrases(text) {
    const phrases = [];
    const patterns = [
      /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+だね/g,
      /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+だな/g,
      /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+かも/g,
      /[\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+感/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      phrases.push(...matches.slice(0, 3));
    });
    
    return phrases.slice(0, 5);
  }

  extractKeywords(text) {
    const katakanaRegex = /[\u30A0-\u30FF]{3,}/g;
    const techRegex = /[A-Z]{2,}|[a-zA-Z]+[A-Z][a-zA-Z]*/g;
    
    const katakanaWords = text.match(katakanaRegex) || [];
    const techWords = text.match(techRegex) || [];
    
    const allWords = [...katakanaWords, ...techWords];
    
    const frequency = {};
    allWords.forEach(word => {
      if (word.length >= 3) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .map(([word]) => word);
  }

  extractLearningTopics(articles) {
    const learningKeywords = ['学習', '勉強', '調査', '検証', 'TIL', '知った'];
    const topics = [];
    
    articles.forEach(article => {
      const content = article.body_md || '';
      learningKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          const sentences = content.split(/[。\n]/).filter(sentence => 
            sentence.includes(keyword) && sentence.length > 10
          );
          topics.push(...sentences.slice(0, 2));
        }
      });
    });
    
    return topics.slice(0, 5);
  }

  extractTypicalTasks(articles) {
    const taskPatterns = [];
    
    articles.forEach(article => {
      const content = article.body_md || '';
      const tasks = content.match(/- \[x\] .+/g) || [];
      taskPatterns.push(...tasks.map(task => 
        task.replace('- [x] ', '').trim()
      ));
    });
    
    const taskFrequency = {};
    taskPatterns.forEach(task => {
      const normalized = this.normalizeTask(task);
      taskFrequency[normalized] = (taskFrequency[normalized] || 0) + 1;
    });
    
    return Object.entries(taskFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([task]) => task);
  }

  normalizeTask(task) {
    const patterns = [
      { pattern: /(バグ|bug|修正|fix)/i, normalized: 'バグ修正' },
      { pattern: /(レビュー|review)/i, normalized: 'コードレビュー' },
      { pattern: /(実装|開発|implementation)/i, normalized: '機能実装' },
      { pattern: /(テスト|test)/i, normalized: 'テスト' },
      { pattern: /(設計|design)/i, normalized: '設計' },
      { pattern: /(調査|研究|study)/i, normalized: '技術調査' }
    ];
    
    for (const { pattern, normalized } of patterns) {
      if (pattern.test(task)) {
        return normalized;
      }
    }
    
    return task.length > 20 ? task.substring(0, 20) + '...' : task;
  }

  inferWorkStyle(articles) {
    const recentArticles = articles.slice(0, 10);
    const avgTaskCount = recentArticles.reduce((sum, article) => {
      const tasks = (article.body_md || '').match(/- \[x\]/g) || [];
      return sum + tasks.length;
    }, 0) / Math.max(recentArticles.length, 1);
    
    if (avgTaskCount > 8) return '高密度型';
    if (avgTaskCount > 5) return '集中型';
    if (avgTaskCount > 2) return 'バランス型';
    return '深掘り型';
  }

  calculatePostingFrequency(articles) {
    if (articles.length < 2) return '不明';
    
    const dates = articles.map(article => new Date(article.created_at))
      .sort((a, b) => b - a);
    
    const daysDiff = (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24);
    const avgInterval = daysDiff / (articles.length - 1);
    
    if (avgInterval <= 1) return '毎日';
    if (avgInterval <= 3) return '高頻度';
    if (avgInterval <= 7) return '週数回';
    return '週1回程度';
  }

  analyzeArticleStructure(articles) {
    const structures = articles.map(article => {
      const content = article.body_md || '';
      return {
        has_header: content.includes('##'),
        has_tasks: content.includes('- [x]'),
        has_til: content.toLowerCase().includes('til'),
        has_emotions: content.includes('気分') || content.includes('感じ')
      };
    });
    
    const commonStructure = {
      uses_headers: structures.filter(s => s.has_header).length / Math.max(structures.length, 1) > 0.5,
      uses_tasks: structures.filter(s => s.has_tasks).length / Math.max(structures.length, 1) > 0.5,
      uses_til: structures.filter(s => s.has_til).length / Math.max(structures.length, 1) > 0.3,
      uses_emotions: structures.filter(s => s.has_emotions).length / Math.max(structures.length, 1) > 0.3
    };
    
    return commonStructure;
  }
}

module.exports = AIProfileAnalyzer;

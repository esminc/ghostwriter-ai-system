const Profile = require('../database/models/profile');
const User = require('../database/models/user');

class ProfileAnalyzer {
  constructor() {
    // 文体分析の基本パターン
    this.analysisPatterns = {
      // 語調パターン
      tones: {
        casual: ['だね', 'だな', 'でしょ', 'じゃん', '〜', 'って'],
        formal: ['です', 'ます', 'である', 'であります', 'ございます'],
        technical: ['実装', 'アーキテクチャ', 'リファクタリング', 'デプロイ', 'API']
      },
      
      // 感情表現パターン
      emotions: {
        positive: ['嬉しい', '楽しい', '良い', 'ナイス', '最高', '👍', '😊', '🎉'],
        negative: ['難しい', '大変', '困った', '厳しい', '😰', '😅'],
        neutral: ['思う', '感じる', '考える', 'という']
      },
      
      // 技術関心パターン
      techInterests: {
        backend: ['API', 'データベース', 'サーバー', 'バックエンド', 'DB'],
        frontend: ['フロント', 'UI', 'UX', 'React', 'Vue', 'CSS'],
        infrastructure: ['インフラ', 'AWS', 'Docker', 'Kubernetes', 'CI/CD'],
        ai_ml: ['AI', 'ML', '機械学習', 'ChatGPT', 'Claude', 'LLM']
      }
    };
  }

  // メイン分析処理
  async analyzeProfile(screenName, articlesData) {
    console.log(`🔄 ${screenName}のプロフィール分析開始...`);
    
    try {
      // 記事データから文体・関心事を分析
      const writingStyle = this.analyzeWritingStyle(articlesData);
      const interests = this.analyzeInterests(articlesData);
      const behaviorPatterns = this.analyzeBehaviorPatterns(articlesData);
      
      // ユーザー検索（存在しない場合は作成）
      let user = await User.findByUsername(screenName);
      if (!user) {
        user = await User.create({
          slack_user_id: `temp_${screenName}`,
          slack_username: screenName
        });
      }
      
      // プロフィール保存/更新
      const profileData = {
        user_id: user.id,
        screen_name: screenName,
        writing_style: JSON.stringify(writingStyle),
        interests: JSON.stringify(interests),
        behavior_patterns: JSON.stringify(behaviorPatterns),
        article_count: articlesData.length
      };
      
      const profile = await Profile.createOrUpdate(profileData);
      
      console.log(`✅ ${screenName}のプロフィール分析完了`);
      console.log(`   - 分析記事数: ${articlesData.length}`);
      console.log(`   - 文体特徴: ${writingStyle.primary_tone}`);
      console.log(`   - 主要関心事: ${interests.main_categories.join(', ')}`);
      
      return {
        success: true,
        profile: profile,
        analysis: {
          writing_style: writingStyle,
          interests: interests,
          behavior_patterns: behaviorPatterns
        }
      };
      
    } catch (error) {
      console.error(`❌ ${screenName}のプロフィール分析エラー:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 文体分析
  analyzeWritingStyle(articles) {
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
    
    // 主要語調を決定
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
    
    // 記事の長さ分析
    const lengths = articles.map(article => (article.body_md || '').length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    
    // 絵文字使用頻度
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiCount = (allText.match(emojiRegex) || []).length;
    const emojiFrequency = emojiCount / articles.length;
    
    return {
      primary_tone: primaryTone,
      tone_scores: toneScores,
      emotion_scores: emotionScores,
      avg_article_length: Math.round(avgLength),
      emoji_frequency: Math.round(emojiFrequency * 10) / 10,
      characteristic_phrases: this.extractCharacteristicPhrases(allText)
    };
  }

  // 関心事分析
  analyzeInterests(articles) {
    const allText = articles.map(article => 
      `${article.name} ${article.body_md || ''}`
    ).join(' ');
    
    // 技術分野の関心度を分析
    const techScores = {};
    for (const [category, keywords] of Object.entries(this.analysisPatterns.techInterests)) {
      techScores[category] = keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        return count + (allText.match(regex) || []).length;
      }, 0);
    }
    
    // 頻出キーワード抽出
    const keywords = this.extractKeywords(allText);
    
    // 主要カテゴリ決定
    const mainCategories = Object.entries(techScores)
      .filter(([, score]) => score > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
    
    return {
      tech_scores: techScores,
      main_categories: mainCategories,
      frequent_keywords: keywords.slice(0, 10),
      learning_topics: this.extractLearningTopics(articles)
    };
  }

  // 行動パターン分析
  analyzeBehaviorPatterns(articles) {
    // 典型的なタスクパターンを抽出
    const taskPatterns = [];
    const timePatterns = [];
    
    articles.forEach(article => {
      const content = article.body_md || '';
      
      // タスクパターン抽出（チェックリスト形式）
      const tasks = content.match(/- \[x\] .+/g) || [];
      taskPatterns.push(...tasks.map(task => 
        task.replace('- [x] ', '').trim()
      ));
      
      // 時間パターン抽出
      const timeRegex = /(\d{1,2}:\d{2}|\d+時間?|\d+分)/g;
      const times = content.match(timeRegex) || [];
      timePatterns.push(...times);
    });
    
    // 頻出タスクを集計
    const taskFrequency = {};
    taskPatterns.forEach(task => {
      const normalized = this.normalizeTask(task);
      taskFrequency[normalized] = (taskFrequency[normalized] || 0) + 1;
    });
    
    const topTasks = Object.entries(taskFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([task]) => task);
    
    return {
      typical_tasks: topTasks,
      work_style: this.inferWorkStyle(articles),
      posting_frequency: this.calculatePostingFrequency(articles),
      typical_structure: this.analyzeArticleStructure(articles)
    };
  }

  // 特徴的フレーズ抽出
  extractCharacteristicPhrases(text) {
    // よく使う語尾や表現を抽出
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

  // キーワード抽出（簡易版）
  extractKeywords(text) {
    // カタカナ語と技術用語を抽出
    const katakanaRegex = /[\u30A0-\u30FF]{3,}/g;
    const techRegex = /[A-Z]{2,}|[a-zA-Z]+[A-Z][a-zA-Z]*/g;
    
    const katakanaWords = text.match(katakanaRegex) || [];
    const techWords = text.match(techRegex) || [];
    
    const allWords = [...katakanaWords, ...techWords];
    
    // 頻度集計
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

  // 学習トピック抽出
  extractLearningTopics(articles) {
    const learningKeywords = ['学習', '勉強', '調査', '検証', 'TIL', '知った'];
    const topics = [];
    
    articles.forEach(article => {
      const content = article.body_md || '';
      learningKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          // 学習関連の文を抽出
          const sentences = content.split(/[。\n]/).filter(sentence => 
            sentence.includes(keyword) && sentence.length > 10
          );
          topics.push(...sentences.slice(0, 2));
        }
      });
    });
    
    return topics.slice(0, 5);
  }

  // タスク正規化
  normalizeTask(task) {
    // 類似タスクをグループ化
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

  // ワークスタイル推定
  inferWorkStyle(articles) {
    const recentArticles = articles.slice(0, 10);
    const avgTaskCount = recentArticles.reduce((sum, article) => {
      const tasks = (article.body_md || '').match(/- \[x\]/g) || [];
      return sum + tasks.length;
    }, 0) / recentArticles.length;
    
    if (avgTaskCount > 8) return '高密度型';
    if (avgTaskCount > 5) return '集中型';
    if (avgTaskCount > 2) return 'バランス型';
    return '深掘り型';
  }

  // 投稿頻度計算
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

  // 記事構造分析
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
      uses_headers: structures.filter(s => s.has_header).length / structures.length > 0.5,
      uses_tasks: structures.filter(s => s.has_tasks).length / structures.length > 0.5,
      uses_til: structures.filter(s => s.has_til).length / structures.length > 0.3,
      uses_emotions: structures.filter(s => s.has_emotions).length / structures.length > 0.3
    };
    
    return commonStructure;
  }
}

module.exports = ProfileAnalyzer;

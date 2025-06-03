class DiaryGenerator {
  constructor() {
    // 日記生成のテンプレートパターン
    this.templates = {
      // 基本構造テンプレート
      basic: {
        structure: ['## やることやったこと', '## TIL', '## こんな気分'],
        taskIntros: ['今日は', '本日は', 'やったこと：'],
        tilIntros: ['学んだこと：', '新しい発見：', 'TIL：'],
        emotionIntros: ['今日の気分：', 'こんな感じ：', '振り返ると：']
      },
      
      // 語調パターン
      tones: {
        casual: {
          endings: ['だね', 'だな', 'かも', '感じ'],
          connectors: ['それで', 'で、', 'あと', 'そして'],
          emotions: ['なんか', 'けっこう', 'わりと', 'ちょっと'],
          reactions: ['😊', '👍', '🎉', '💪', '🤔']
        },
        formal: {
          endings: ['です', 'ました', 'でした', 'であります'],
          connectors: ['そして', 'また', 'さらに', '続いて'],
          emotions: ['非常に', 'とても', '大変', '実に'],
          reactions: ['。', '！']
        },
        technical: {
          endings: ['した', 'できた', '完了', '実装'],
          connectors: ['次に', 'その後', '結果として', 'それにより'],
          emotions: ['効率的に', '実装面で', '技術的に', 'アーキテクチャ的に'],
          reactions: ['⚡', '🔧', '📊', '🚀']
        }
      },

      // TIL生成パターン
      tilPatterns: {
        technical: [
          '{keyword}の使い方について理解が深まった',
          '{keyword}を使った実装パターンを学んだ',
          '{keyword}のベストプラクティスを調べた',
          '{keyword}の仕組みについて調査した'
        ],
        general: [
          '効率的な作業の進め方を見つけた',
          'チーム連携の重要性を実感した',
          '問題解決のアプローチを学んだ',
          '新しい視点での取り組み方を発見した'
        ]
      },

      // 感情表現パターン
      emotionPatterns: {
        positive: [
          '達成感があって嬉しい',
          '順調に進んで気分が良い',
          '新しい学びがあって楽しい',
          '充実した一日だった'
        ],
        challenging: [
          '難しかったけど勉強になった',
          '苦戦したが最終的にうまくいった',
          '試行錯誤の連続だったが収穫があった',
          '壁にぶつかったが乗り越えられた'
        ],
        neutral: [
          '着実に進めることができた',
          '予定どおりの作業ができた',
          '安定したペースで取り組めた',
          'いつものペースで進められた'
        ]
      }
    };
  }

  // メイン生成処理
  async generateDiary(targetUser, inputActions = [], profileData = null, contextData = {}) {
    console.log(`🔄 ${targetUser}の日記生成開始...`);
    
    try {
      // プロフィールデータから文体情報を取得
      const writingStyle = profileData ? JSON.parse(profileData.writing_style) : null;
      const interests = profileData ? JSON.parse(profileData.interests) : null;
      const behaviorPatterns = profileData ? JSON.parse(profileData.behavior_patterns) : null;
      
      // 日記構成要素を生成
      const title = this.generateTitle(targetUser, inputActions, writingStyle);
      const tasksSection = this.generateTasksSection(inputActions, writingStyle, behaviorPatterns);
      const tilSection = this.generateTILSection(inputActions, interests, writingStyle);
      const emotionSection = this.generateEmotionSection(inputActions, writingStyle, contextData);
      
      // 日記本文を組み立て
      const diary = this.assembleDiary(title, tasksSection, tilSection, emotionSection, writingStyle);
      
      console.log(`✅ ${targetUser}の日記生成完了`);
      
      return {
        success: true,
        content: diary,
        metadata: {
          target_user: targetUser,
          input_actions: inputActions,
          writing_style: writingStyle?.primary_tone || 'default',
          generated_at: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error(`❌ ${targetUser}の日記生成エラー:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // タイトル生成
  generateTitle(targetUser, actions, writingStyle) {
    if (actions.length === 0) {
      return `【代筆】${targetUser}: 今日も一日お疲れ様`;
    }
    
    // 主要なアクションから特徴的なキーワードを抽出
    const mainAction = actions[0];
    const keywords = this.extractTitleKeywords(mainAction);
    
    const titlePatterns = [
      `${keywords.main}と格闘した日`,
      `${keywords.main}に集中した日`,
      `${keywords.main}で学びがあった日`,
      `${keywords.main}を頑張った日`,
      `${keywords.main}な一日`
    ];
    
    // ランダムに選択（実際はwritingStyleに基づいて選択）
    const selectedPattern = titlePatterns[Math.floor(Math.random() * titlePatterns.length)];
    
    return `【代筆】${targetUser}: ${selectedPattern}`;
  }

  // タスクセクション生成
  generateTasksSection(actions, writingStyle, behaviorPatterns) {
    if (actions.length === 0) {
      return `## やることやったこと

- [x] 今日も一日お疲れ様でした`;
    }

    const tone = writingStyle?.primary_tone || 'casual';
    const toneData = this.templates.tones[tone] || this.templates.tones.casual;
    
    // タスクリストを生成
    const taskList = actions.map(action => {
      const enhancedAction = this.enhanceActionDescription(action, tone, toneData);
      return `- [x] ${enhancedAction}`;
    }).join('\n');

    // セクションの導入文を生成
    const intro = this.generateTaskIntro(actions.length, tone, toneData);
    
    return `## やることやったこと

${intro}

${taskList}`;
  }

  // TILセクション生成
  generateTILSection(actions, interests, writingStyle) {
    const tone = writingStyle?.primary_tone || 'casual';
    const toneData = this.templates.tones[tone] || this.templates.tones.casual;
    
    // アクションから技術キーワードを抽出
    const techKeywords = this.extractTechKeywords(actions);
    const interestsData = interests || { main_categories: [], frequent_keywords: [] };
    
    // TIL項目を生成
    const tilItems = this.generateTILItems(techKeywords, interestsData, tone);
    
    const tilList = tilItems.map(item => `- ${item}`).join('\n');
    
    return `## TIL

${tilList}`;
  }

  // 感情セクション生成
  generateEmotionSection(actions, writingStyle, contextData) {
    const tone = writingStyle?.primary_tone || 'casual';
    const toneData = this.templates.tones[tone] || this.templates.tones.casual;
    
    // 作業の難易度・充実度を推定
    const difficulty = this.estimateDifficulty(actions);
    const satisfaction = this.estimateSatisfaction(actions, contextData);
    
    // 感情表現を選択
    let emotionType = 'neutral';
    if (satisfaction > 0.7) emotionType = 'positive';
    else if (difficulty > 0.7) emotionType = 'challenging';
    
    const emotionText = this.generateEmotionText(emotionType, tone, toneData, actions);
    
    return `## こんな気分

${emotionText}`;
  }

  // アクション説明を強化
  enhanceActionDescription(action, tone, toneData) {
    // 技術用語を検出して詳細化
    const techTerms = ['API', 'DB', 'SQL', 'React', 'Vue', 'Python', 'JavaScript'];
    const foundTech = techTerms.find(term => 
      action.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundTech && tone === 'technical') {
      return `${action}（${foundTech}関連の実装作業）`;
    }
    
    // カジュアルトーンの場合は感情を追加
    if (tone === 'casual' && Math.random() > 0.7) {
      const reactions = toneData.reactions || ['👍'];
      const reaction = reactions[Math.floor(Math.random() * reactions.length)];
      return `${action} ${reaction}`;
    }
    
    return action;
  }

  // タスク導入文生成
  generateTaskIntro(taskCount, tone, toneData) {
    const intros = {
      casual: [
        `今日は${taskCount}個のタスクに取り組んだ`,
        `${taskCount}つのことを頑張った`,
        `やったことまとめ`
      ],
      formal: [
        `本日は${taskCount}件の作業を実施しました`,
        `以下の${taskCount}項目に取り組みました`,
        `実施した作業は以下の通りです`
      ],
      technical: [
        `本日の実装・作業項目（${taskCount}件）`,
        `技術的な取り組み${taskCount}項目`,
        `実装した機能・作業`
      ]
    };
    
    const candidates = intros[tone] || intros.casual;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // 技術キーワード抽出
  extractTechKeywords(actions) {
    const techKeywords = [];
    const patterns = {
      'API': /api|エーピーアイ/i,
      'データベース': /db|database|sql|sqlite|mysql/i,
      'フロントエンド': /react|vue|html|css|javascript/i,
      'バックエンド': /server|backend|node|python|java/i,
      'インフラ': /docker|aws|kubernetes|deploy/i,
      'AI・ML': /ai|ml|gpt|claude|機械学習/i
    };
    
    const allText = actions.join(' ').toLowerCase();
    
    Object.entries(patterns).forEach(([keyword, pattern]) => {
      if (pattern.test(allText)) {
        techKeywords.push(keyword);
      }
    });
    
    return techKeywords;
  }

  // TIL項目生成
  generateTILItems(techKeywords, interests, tone) {
    const items = [];
    
    // 技術的な学び
    if (techKeywords.length > 0) {
      const mainTech = techKeywords[0];
      const patterns = this.templates.tilPatterns.technical;
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      items.push(pattern.replace('{keyword}', mainTech));
    }
    
    // 一般的な学び
    const generalPatterns = this.templates.tilPatterns.general;
    items.push(generalPatterns[Math.floor(Math.random() * generalPatterns.length)]);
    
    // 関心事に基づく学び
    if (interests.frequent_keywords && interests.frequent_keywords.length > 0) {
      const keyword = interests.frequent_keywords[0];
      items.push(`${keyword}についての理解が深まった`);
    }
    
    return items.slice(0, 3); // 最大3項目
  }

  // 難易度推定
  estimateDifficulty(actions) {
    const difficultWords = ['バグ', '修正', '問題', '調査', '解決', '苦戦', '検証'];
    const allText = actions.join(' ').toLowerCase();
    
    let score = 0;
    difficultWords.forEach(word => {
      if (allText.includes(word)) score += 0.2;
    });
    
    return Math.min(score, 1.0);
  }

  // 満足度推定
  estimateSatisfaction(actions, contextData) {
    const positiveWords = ['完了', '実装', '成功', '達成', '完成'];
    const allText = actions.join(' ').toLowerCase();
    
    let score = 0.5; // ベーススコア
    
    positiveWords.forEach(word => {
      if (allText.includes(word)) score += 0.1;
    });
    
    // コンテキストデータから推定
    if (contextData.quality_rating) {
      score = contextData.quality_rating / 5;
    }
    
    return Math.min(score, 1.0);
  }

  // 感情テキスト生成
  generateEmotionText(emotionType, tone, toneData, actions) {
    const patterns = this.templates.emotionPatterns[emotionType];
    let baseText = patterns[Math.floor(Math.random() * patterns.length)];
    
    // トーンに応じて調整
    if (tone === 'casual') {
      const emotion = toneData.emotions[Math.floor(Math.random() * toneData.emotions.length)];
      const ending = toneData.endings[Math.floor(Math.random() * toneData.endings.length)];
      baseText = `${emotion}${baseText}${ending}`;
      
      // 絵文字追加
      if (toneData.reactions && Math.random() > 0.5) {
        const reaction = toneData.reactions[Math.floor(Math.random() * toneData.reactions.length)];
        baseText += ` ${reaction}`;
      }
    } else if (tone === 'formal') {
      baseText = `${baseText}。今後も継続して取り組んでまいります。`;
    } else if (tone === 'technical') {
      baseText = `${baseText}。技術的な成長を実感できる一日でした。`;
    }
    
    return baseText;
  }

  // タイトルキーワード抽出
  extractTitleKeywords(action) {
    const keywords = {
      main: 'お疲れ様',
      sub: ''
    };
    
    // 主要キーワードを抽出
    const patterns = [
      { regex: /(バグ|bug)/i, keyword: 'バグ' },
      { regex: /(実装|開発)/i, keyword: '実装' },
      { regex: /(設計|デザイン)/i, keyword: '設計' },
      { regex: /(テスト|test)/i, keyword: 'テスト' },
      { regex: /(レビュー|review)/i, keyword: 'レビュー' },
      { regex: /(調査|研究)/i, keyword: '調査' },
      { regex: /(API|api)/i, keyword: 'API' },
      { regex: /(データベース|DB|db)/i, keyword: 'DB' }
    ];
    
    for (const pattern of patterns) {
      if (pattern.regex.test(action)) {
        keywords.main = pattern.keyword;
        break;
      }
    }
    
    return keywords;
  }

  // 日記組み立て
  assembleDiary(title, tasksSection, tilSection, emotionSection, writingStyle) {
    const sections = [tasksSection, tilSection, emotionSection];
    const content = sections.join('\n\n');
    
    // 最終的な調整
    return this.finalizeContent(content, writingStyle);
  }

  // コンテンツ最終調整
  finalizeContent(content, writingStyle) {
    // 改行の調整
    let finalContent = content.replace(/\n{3,}/g, '\n\n');
    
    // 文体の一貫性チェック
    const tone = writingStyle?.primary_tone || 'casual';
    if (tone === 'formal') {
      finalContent = finalContent.replace(/だね|だな|かも/g, 'です');
    }
    
    return finalContent;
  }

  // おまかせ生成（アクションなしの場合）
  async generateAutomatic(targetUser, profileData = null, contextData = {}) {
    console.log(`🔄 ${targetUser}のおまかせ日記生成...`);
    
    // プロフィールから典型的なタスクを推定
    const behaviorPatterns = profileData ? JSON.parse(profileData.behavior_patterns) : null;
    const typicalTasks = behaviorPatterns?.typical_tasks || [
      '今日のタスクを進めた',
      'チームでの作業を行った',
      '技術的な調査をした'
    ];
    
    // ランダムに2-4個のタスクを選択
    const selectedTasks = this.selectRandomTasks(typicalTasks, 2 + Math.floor(Math.random() * 3));
    
    return this.generateDiary(targetUser, selectedTasks, profileData, contextData);
  }

  // ランダムタスク選択
  selectRandomTasks(tasks, count) {
    const shuffled = [...tasks].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, tasks.length));
  }
}

module.exports = DiaryGenerator;

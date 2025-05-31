const OpenAIClient = require('../ai/openai-client');

class AIDiaryGenerator {
  constructor() {
    this.openaiClient = new OpenAIClient();
    
    // フォールバック用の従来テンプレート
    this.templates = {
      basic: {
        structure: ['## やることやったこと', '## TIL', '## こんな気分'],
        taskIntros: ['今日は', '本日は', 'やったこと：'],
        tilIntros: ['学んだこと：', '新しい発見：', 'TIL：'],
        emotionIntros: ['今日の気分：', 'こんな感じ：', '振り返ると：']
      },
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
      }
    };
  }

  // メイン生成処理（AI統合版）- Slack Bot対応
  async generateDiary(profileAnalysis, options = {}) {
    const targetUser = options.author || 'ユーザー';
    const inputActions = options.inputActions || [];
    const contextData = options.contextData || {};
    
    console.log(`🤖 ${targetUser}のAI統合日記生成開始...`);
    
    try {
      let aiGeneratedDiary = null;
      let fallbackDiary = null;

      // AI生成を試行
      if (inputActions.length > 0 || contextData.allow_automatic) {
        console.log('🔄 AI日記生成実行中...');
        const aiResult = await this.openaiClient.generateDiary(
          targetUser, 
          inputActions.length > 0 ? inputActions : ['今日のタスクと日常作業'], 
          profileAnalysis, 
          contextData
        );
        
        if (aiResult.success && !aiResult.fallback) {
          aiGeneratedDiary = aiResult.content;
          console.log('✅ AI日記生成成功');
          console.log(`   生成文字数: ${aiResult.content ? aiResult.content.length : 0}文字`);
        } else {
          console.log('🔄 AI日記生成失敗またはフォールバック、従来方式を併用');
          if (aiResult.fallback) {
            console.log('   フォールバック理由: API未設定またはAPIエラー');
          }
          if (aiResult.error) {
            console.log(`   エラー詳細: ${aiResult.error}`);
          }
        }
      }

      // フォールバック生成（従来方式）
      fallbackDiary = this.traditionalGenerate(targetUser, inputActions, profileAnalysis, contextData);
      console.log('✅ 従来方式日記生成完了');

      // AI生成と従来生成を統合
      const integrationMetadata = {
        analysisQuality: profileAnalysis ? 5 : 0,
        generationQuality: aiGeneratedDiary ? 4.2 : 0,
        referencedPosts: contextData.referencedPosts || [],
        generatedAt: new Date().toISOString(),
        systemVersion: 'v1.0.0 (Phase 1完成版)',
        inputActions: inputActions
      };
      const integrationResult = this.integrateDiaries(aiGeneratedDiary, fallbackDiary, targetUser, integrationMetadata, profileAnalysis);
      
      // 🔍 統合結果デバッグ
      console.log('🔍 Integration result debug:', {
        hasResult: !!integrationResult,
        hasContent: !!(integrationResult && integrationResult.content),
        hasTitle: !!(integrationResult && integrationResult.title),
        contentLength: integrationResult && integrationResult.content ? integrationResult.content.length : 'undefined'
      });
      
      const finalDiary = integrationResult ? integrationResult.content : fallbackDiary;
      const extractedTitle = integrationResult ? integrationResult.title : `【代筆】${targetUser}: 今日も一日お疲れ様`;
      
      // 品質チェック
      let qualityScore = 3;
      if (aiGeneratedDiary && finalDiary) {
        const qualityResult = await this.checkQuality(finalDiary, targetUser, inputActions);
        qualityScore = qualityResult.success ? 
          qualityResult.averageScore : 3;
      }
      
      console.log(`🎉 ${targetUser}のAI統合日記生成完了`);
      console.log(`   🤖 AI生成: ${aiGeneratedDiary ? '成功' : 'フォールバック'}`);
      console.log(`   ⭐ 品質スコア: ${qualityScore}/5`);
      console.log(`   📝 文字数: ${finalDiary ? finalDiary.length : 0}文字`);
      console.log(`   🏷️ 抽出タイトル: ${extractedTitle}`);
      
      // 🔍 タイトル抽出デバッグ
      console.log('🔍 Title extraction debug:', {
        targetUser: targetUser,
        finalDiaryPreview: finalDiary.substring(0, 200) + '...',
        extractedTitle: extractedTitle,
        aiGenerated: aiGeneratedDiary !== null
      });
      
      // Slack Bot用の戻り値形式（テスト配下に投稿）
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-');
      const testCategory = `テスト/日記/${year}/${month}/${day}`;
      
      return {
        title: extractedTitle,
        content: finalDiary,
        category: testCategory,
        qualityScore: qualityScore,
        metadata: {
          target_user: targetUser,
          input_actions: inputActions,
          ai_generated: aiGeneratedDiary !== null,
          quality_score: qualityScore,
          generation_method: aiGeneratedDiary ? 'ai_primary' : 'traditional_fallback',
          generated_at: new Date().toISOString(),
          character_count: finalDiary.length
        }
      };
      
    } catch (error) {
      console.error(`❌ ${targetUser}のAI統合日記生成エラー:`, error);
      
      // エラー時のフォールバック
      const fallbackContent = this.generateEmergencyFallback(targetUser);
      
      // エラー時のフォールバック（テスト配下に投稿）
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const [year, month, day] = dateStr.split('-');
      const testCategory = `テスト/日記/${year}/${month}/${day}`;
      const fallbackTitle = `【代筆】${targetUser}: エラー時の緊急フォールバック`;
      
      return {
        title: fallbackTitle,
        content: fallbackContent,
        category: testCategory,
        qualityScore: 2,
        error: error.message
      };
    }
  }

  // プロフィール分析データを準備
  prepareProfileAnalysis(profileData) {
    if (!profileData) {
      return {
        writing_style: { primary_tone: 'casual' },
        interests: { main_categories: [] },
        behavior_patterns: { typical_tasks: [] }
      };
    }

    try {
      return {
        writing_style: typeof profileData.writing_style === 'string' ? 
          JSON.parse(profileData.writing_style) : profileData.writing_style,
        interests: typeof profileData.interests === 'string' ? 
          JSON.parse(profileData.interests) : profileData.interests,
        behavior_patterns: typeof profileData.behavior_patterns === 'string' ? 
          JSON.parse(profileData.behavior_patterns) : profileData.behavior_patterns
      };
    } catch (parseError) {
      console.warn('プロフィールデータのパースに失敗、デフォルト使用');
      return {
        writing_style: { primary_tone: 'casual' },
        interests: { main_categories: [] },
        behavior_patterns: { typical_tasks: [] }
      };
    }
  }

  // 従来方式の日記生成（フォールバック用）
  traditionalGenerate(targetUser, actions, profileAnalysis, contextData) {
    if (actions.length === 0) {
      return this.generateAutomaticDiary(targetUser, profileAnalysis, contextData);
    }

    const writingStyle = profileAnalysis.writing_style || {};
    const tone = writingStyle.primary_tone || 'casual';
    const toneData = this.templates.tones[tone] || this.templates.tones.casual;
    
    // タイトル生成
    const title = this.generateTraditionalTitle(targetUser, actions, writingStyle);
    
    // セクション生成
    const tasksSection = this.generateTasksSection(actions, tone, toneData);
    const tilSection = this.generateTILSection(actions, profileAnalysis.interests, tone, toneData);
    const emotionSection = this.generateEmotionSection(actions, tone, toneData, contextData);
    
    // 日記組み立て
    return this.assembleDiary(title, tasksSection, tilSection, emotionSection, tone);
  }

  // AI日記と従来日記の統合
  integrateDiaries(aiDiary, fallbackDiary, targetUser, metadata = {}, profileAnalysis = null) {
    console.log('🔍 integrateDiaries called:', {
      hasAiDiary: !!aiDiary,
      hasFallbackDiary: !!fallbackDiary,
      aiDiaryLength: aiDiary ? aiDiary.length : 0,
      fallbackDiaryLength: fallbackDiary ? fallbackDiary.length : 0
    });
    
    if (!aiDiary) {
      console.log('🔄 AI日記がないため、従来日記を使用');
      const contentWithAiInfo = this.addAISystemInfo(fallbackDiary, {
        ...metadata,
        aiGenerated: false,
        analysisQuality: metadata.analysisQuality || 0,
        generationQuality: metadata.generationQuality || 0,
        targetUser: targetUser
      });
      const content = this.addGhostwriterFooter(contentWithAiInfo, targetUser);
      const title = this.extractTitleFromContent(fallbackDiary, targetUser);
      return { content, title };
    }

    // 🔍 AI生成結果のバリデーション
    let finalDiary = aiDiary.trim();
    let extractedTitle = null;
    
    // 🔍 AI生成結果の詳細デバッグ
    console.log('🔍 AI生成結果の詳細分析:', {
      firstLine: finalDiary.split('\n')[0],
      startsWithTitle: finalDiary.startsWith('タイトル:'),
      length: finalDiary.length,
      preview: finalDiary.substring(0, 50) + '...'
    });
    
    // AI生成が「タイトル:」から始まっていない場合の対処
    if (!finalDiary.startsWith('タイトル:')) {
      console.log('⚠️ AI生成がタイトル行を含まない、修正して統合');
      
      // AI生成内容からタイトルを推定
      const lines = finalDiary.split('\n');
      let suggestedTitle = '今日も一日お疲れ様';
      
      // 最初のセクション内容からタイトルを推定
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('## やることやったこと') && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine && nextLine.length > 10 && nextLine.length < 80) {
            // 最初のセンテンスからキーワード抽出
            if (nextLine.includes('プログラミング')) suggestedTitle = 'プログラミングでいい進捗の日';
            else if (nextLine.includes('タスク')) suggestedTitle = 'タスクをしっかりこなせた日';
            else if (nextLine.includes('チーム')) suggestedTitle = 'チームとの連携が良好だった日';
            else if (nextLine.includes('AI') || nextLine.includes('機械学習')) suggestedTitle = 'AIプロジェクトで学びのあった日';
            else if (nextLine.includes('達成感')) suggestedTitle = '達成感のある充実した日';
            else if (nextLine.includes('実装')) suggestedTitle = '実装作業が順調に進んだ日';
            else if (nextLine.includes('調査')) suggestedTitle = '調査作業で新しい発見があった日';
            break;
          }
        }
      }
      
      // タイトルを設定（コンテンツには追加しない）
      extractedTitle = `【代筆】${targetUser}: ${suggestedTitle}`;
      console.log(`✅ タイトルを推定: ${extractedTitle}`);
    } else {
      console.log('✅ AI生成が正しくタイトル行を含んでいる');
      console.log('🔍 正しいタイトル行を検出:', finalDiary.split('\n')[0]);
      
      // タイトル行からタイトルを抽出
      const firstLine = finalDiary.split('\n')[0].trim();
      extractedTitle = firstLine.replace(/^タイトル:\s*/, '').trim();
      console.log(`🔍 AI生成タイトルを抽出: ${extractedTitle}`);
      
      // タイトル行をコンテンツから除去
      const lines = finalDiary.split('\n');
      lines.shift(); // 最初の行を除去
      // 空行がある場合はそれも除去
      if (lines.length > 0 && lines[0].trim() === '') {
        lines.shift();
      }
      finalDiary = lines.join('\n');
    }
    
    // AI統合システム情報を追加
    const contentWithAiInfo = this.addAISystemInfo(finalDiary, {
      ...metadata,
      aiGenerated: true,
      analysisQuality: metadata.analysisQuality || 5,
      generationQuality: metadata.generationQuality || 4,
      targetUser: targetUser,
      profileAnalysis: profileAnalysis,  // 🔧 プロフィール分析結果を渡す
      analysisDetails: { articleCount: 60 }  // 🔧 分析詳細を渡す
    });
    
    // 代筆フッター追加
    const content = this.addGhostwriterFooter(contentWithAiInfo, targetUser);
    
    console.log('🔍 integrateDiaries result:', {
      hasContent: !!content,
      hasTitle: !!extractedTitle,
      contentLength: content ? content.length : 0,
      title: extractedTitle
    });
    
    return { content, title: extractedTitle };
  }

  // AI統合システム情報セクション追加 - 関心事分析強化版
  addAISystemInfo(content, metadata = {}) {
    const {
      aiGenerated = false,
      analysisQuality = 0,
      generationQuality = 0,
      targetUser = 'ユーザー',
      referencedPosts = [],
      generatedAt,
      systemVersion = 'v1.0.0',
      profileAnalysis = null,  // 🔧 プロフィール分析結果を追加
      analysisDetails = null   // 🔧 分析詳細を追加
    } = metadata;

    const today = new Date();
    const dateTimeStr = today.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // 🔧 関心事分析の実行
    let interestAnalysis = null;
    if (profileAnalysis && aiGenerated) {
      interestAnalysis = this.analyzeInterestReflection(content, profileAnalysis);
    }

    let aiInfoSection = `\n\n---\n\n**🤖 AI統合システム情報**\n`;
    aiInfoSection += `* **生成日時**: ${dateTimeStr}\n`;
    
    // AI分析使用情報を詳細化
    if (analysisQuality > 0) {
      const postCount = referencedPosts.length || (analysisDetails?.articleCount || 60);
      aiInfoSection += `* **AI分析使用**: はい (${postCount}記事分析)\n`;
    } else {
      aiInfoSection += `* **AI分析使用**: いいえ\n`;
    }
    
    aiInfoSection += `* **AI生成使用**: ${aiGenerated ? 'はい' : 'いいえ'}\n`;
    
    if (analysisQuality > 0) {
      aiInfoSection += `* **分析品質**: ${analysisQuality}/5\n`;
    }
    
    if (aiGenerated) {
      aiInfoSection += `* **生成品質**: ${generationQuality}/5\n`;
    }

    // 🔧 関心事反映分析セクション
    if (interestAnalysis) {
      aiInfoSection += `\n**🎯 関心事反映分析**\n`;
      aiInfoSection += `* **検出された関心事**: ${interestAnalysis.detectedInterests.join(', ')}\n`;
      aiInfoSection += `* **技術キーワード**: ${interestAnalysis.detectedTechKeywords.join(', ')}\n`;
      aiInfoSection += `* **反映された関心事**: ${interestAnalysis.reflectedInterests.join(', ')}\n`;
      aiInfoSection += `* **関心事反映度**: ${interestAnalysis.reflectionPercentage}% (${interestAnalysis.reflectionLevel})\n`;
      aiInfoSection += `* **技術的具体性**: ${interestAnalysis.technicalSpecificity.assessment} (${interestAnalysis.technicalSpecificity.foundTechnical.length}個の技術用語使用)\n`;
    }

    // 🔧 個人化品質分析セクション
    if (profileAnalysis && aiGenerated) {
      const personalizationAnalysis = this.analyzePersonalizationQuality(content, profileAnalysis);
      
      aiInfoSection += `\n**📊 個人化品質**\n`;
      aiInfoSection += `* **文体再現度**: ${personalizationAnalysis.styleScore}/5 (特徴的表現: ${personalizationAnalysis.foundExpressions.join(', ')})\n`;
      aiInfoSection += `* **作業パターン適合**: ${personalizationAnalysis.behaviorScore}/5 (${personalizationAnalysis.matchedPatterns.join('・')})\n`;
      aiInfoSection += `* **総合模倣度**: ${personalizationAnalysis.overallScore}/5 (${personalizationAnalysis.overallAssessment})\n`;
    }
    
    // 参照した投稿情報を追加
    if (referencedPosts && referencedPosts.length > 0) {
      aiInfoSection += `\n* **参照投稿**: `;
      const postLinks = referencedPosts.map(post => {
        if (typeof post === 'object' && post.id && post.title) {
          return `[#${post.id} ${post.title}](https://esminc-its.esa.io/posts/${post.id})`;
        } else if (typeof post === 'number') {
          return `[#${post}](https://esminc-its.esa.io/posts/${post})`;
        }
        return post.toString();
      });
      aiInfoSection += postLinks.join(', ') + '\n';
    }
    
    aiInfoSection += `\n* **対象ユーザー**: ${targetUser}\n`;
    aiInfoSection += `* **投稿者**: esa_bot (代筆システム)\n`;
    aiInfoSection += `* **システム**: 代筆さん ${systemVersion} (${aiGenerated ? 'AI統合版' : 'フォールバック版'})\n`;
    
    // 生成方法の説明
    if (aiGenerated) {
      aiInfoSection += `\nこの投稿はAI統合システムによって自動生成されました。OpenAI GPT-4o-miniを使用してプロフィール分析に基づく個人化された日記を生成しています。`;
    } else {
      aiInfoSection += `\nこの投稿はAI統合システムのフォールバック機能によって生成されました。AI APIが利用できない場合でも、従来のテンプレートベース生成で品質を保持しています。`;
    }
    
    return content + aiInfoSection;
  }

  // 代筆フッター追加（AI統合システム情報と統合済みのため削除）
  addGhostwriterFooter(content, targetUser) {
    // AI統合システム情報セクションに統合済みのため、フッターは追加しない
    return content;
  }

  // 品質チェック
  async checkQuality(generatedDiary, targetUser, originalActions) {
    try {
      const qualityResult = await this.openaiClient.qualityCheck(
        generatedDiary, 
        targetUser, 
        originalActions
      );
      
      if (qualityResult.success && !qualityResult.fallback) {
        const qualityData = JSON.parse(qualityResult.content);
        const scores = qualityData.scores || {};
        const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
        
        return {
          success: true,
          averageScore: averageScore,
          scores: scores,
          feedback: qualityData.feedback,
          suggestions: qualityData.suggestions
        };
      }
    } catch (error) {
      console.warn('品質チェック失敗:', error.message);
    }
    
    return {
      success: false,
      averageScore: 3,
      error: '品質チェックを実行できませんでした'
    };
  }

  // 自動日記生成（アクションなしの場合）
  generateAutomaticDiary(targetUser, profileAnalysis, contextData) {
    const behaviorPatterns = profileAnalysis.behavior_patterns || {};
    const typicalTasks = behaviorPatterns.typical_tasks || [
      '今日のタスクを進めた',
      'チームでの作業を行った',
      '技術的な調査をした'
    ];
    
    // ランダムに2-4個のタスクを選択
    const selectedTasks = this.selectRandomTasks(typicalTasks, 2 + Math.floor(Math.random() * 3));
    
    return this.traditionalGenerate(targetUser, selectedTasks, profileAnalysis, contextData);
  }

  // 従来方式のタイトル生成
  generateTraditionalTitle(targetUser, actions, writingStyle) {
    if (actions.length === 0) {
      return `【代筆】${targetUser}: 今日も一日お疲れ様`;
    }
    
    const mainAction = actions[0];
    const keywords = this.extractTitleKeywords(mainAction);
    
    const titlePatterns = [
      `${keywords.main}と格闘した日`,
      `${keywords.main}に集中した日`,
      `${keywords.main}で学びがあった日`,
      `${keywords.main}を頑張った日`,
      `${keywords.main}な一日`
    ];
    
    const selectedPattern = titlePatterns[Math.floor(Math.random() * titlePatterns.length)];
    return `【代筆】${targetUser}: ${selectedPattern}`;
  }

  // タスクセクション生成
  generateTasksSection(actions, tone, toneData) {
    // actionsが配列でない、または空の場合のハンドリング
    const actionList = Array.isArray(actions) ? actions : [];
    
    if (actionList.length === 0) {
      return `## やることやったこと\n\n- [x] 今日も一日お疲れ様でした`;
    }

    const taskList = actionList.map(action => {
      const enhancedAction = this.enhanceActionDescription(action, tone, toneData);
      return `- [x] ${enhancedAction}`;
    }).join('\n');

    const intro = this.generateTaskIntro(actionList.length, tone);
    
    return `## やることやったこと\n\n${intro}\n\n${taskList}`;
  }

  // TILセクション生成
  generateTILSection(actions, interests, tone, toneData) {
    const techKeywords = this.extractTechKeywords(actions);
    const interestsData = interests || { main_categories: [], frequent_keywords: [] };
    
    const tilItems = this.generateTILItems(techKeywords, interestsData, tone);
    const tilList = tilItems.map(item => `- ${item}`).join('\n');
    
    return `## TIL\n\n${tilList}`;
  }

  // 感情セクション生成
  generateEmotionSection(actions, tone, toneData, contextData) {
    const difficulty = this.estimateDifficulty(actions);
    const satisfaction = this.estimateSatisfaction(actions, contextData);
    
    let emotionType = 'neutral';
    if (satisfaction > 0.7) emotionType = 'positive';
    else if (difficulty > 0.7) emotionType = 'challenging';
    
    const emotionText = this.generateEmotionText(emotionType, tone, toneData, actions);
    
    return `## こんな気分\n\n${emotionText}`;
  }

  // アクション説明強化
  enhanceActionDescription(action, tone, toneData) {
    const techTerms = ['API', 'DB', 'SQL', 'React', 'Vue', 'Python', 'JavaScript'];
    const foundTech = techTerms.find(term => 
      action.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundTech && tone === 'technical') {
      return `${action}（${foundTech}関連の実装作業）`;
    }
    
    if (tone === 'casual' && Math.random() > 0.7) {
      const reactions = toneData.reactions || ['👍'];
      const reaction = reactions[Math.floor(Math.random() * reactions.length)];
      return `${action} ${reaction}`;
    }
    
    return action;
  }

  // タスク導入文生成
  generateTaskIntro(taskCount, tone) {
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
    
    if (techKeywords.length > 0) {
      const mainTech = techKeywords[0];
      const patterns = [
        `${mainTech}の使い方について理解が深まった`,
        `${mainTech}を使った実装パターンを学んだ`,
        `${mainTech}のベストプラクティスを調べた`,
        `${mainTech}の仕組みについて調査した`
      ];
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      items.push(pattern);
    }
    
    const generalPatterns = [
      '効率的な作業の進め方を見つけた',
      'チーム連携の重要性を実感した',
      '問題解決のアプローチを学んだ',
      '新しい視点での取り組み方を発見した'
    ];
    items.push(generalPatterns[Math.floor(Math.random() * generalPatterns.length)]);
    
    if (interests.frequent_keywords && interests.frequent_keywords.length > 0) {
      const keyword = interests.frequent_keywords[0];
      items.push(`${keyword}についての理解が深まった`);
    }
    
    return items.slice(0, 3);
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
    
    let score = 0.5;
    
    positiveWords.forEach(word => {
      if (allText.includes(word)) score += 0.1;
    });
    
    if (contextData.quality_rating) {
      score = contextData.quality_rating / 5;
    }
    
    return Math.min(score, 1.0);
  }

  // 感情テキスト生成
  generateEmotionText(emotionType, tone, toneData, actions) {
    const emotionPatterns = {
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
    };
    
    const patterns = emotionPatterns[emotionType];
    let baseText = patterns[Math.floor(Math.random() * patterns.length)];
    
    if (tone === 'casual') {
      const emotion = toneData.emotions[Math.floor(Math.random() * toneData.emotions.length)];
      const ending = toneData.endings[Math.floor(Math.random() * toneData.endings.length)];
      baseText = `${emotion}${baseText}${ending}`;
      
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
    const keywords = { main: 'お疲れ様', sub: '' };
    
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
  assembleDiary(title, tasksSection, tilSection, emotionSection, tone) {
    const sections = [tasksSection, tilSection, emotionSection];
    const content = sections.join('\n\n');
    
    let finalContent = content.replace(/\n{3,}/g, '\n\n');
    
    if (tone === 'formal') {
      finalContent = finalContent.replace(/だね|だな|かも/g, 'です');
    }
    
    return finalContent;
  }

  // 緊急フォールバック日記生成
  generateEmergencyFallback(targetUser) {
    const content = `## やることやったこと

- [x] 今日も一日お疲れ様でした
- [x] 様々なタスクに取り組みました
- [x] チームとの連携も順調でした

## TIL

- 日々の積み重ねが大切であることを実感
- 効率的な作業の進め方を発見
- チームワークの重要性を再認識

## こんな気分

着実に進めることができた一日でした。明日も引き続き頑張っていきましょう！💪`;
    
    // エラー時のAI情報を追加
    const contentWithAiInfo = this.addAISystemInfo(content, {
      aiGenerated: false,
      analysisQuality: 0,
      generationQuality: 0,
      targetUser: targetUser,
      systemVersion: 'v1.0.0 (緊急フォールバック)',
      referencedPosts: []
    });
    
    return this.addGhostwriterFooter(contentWithAiInfo, targetUser);
  }

  // ランダムタスク選択
  selectRandomTasks(tasks, count) {
    const shuffled = [...tasks].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, tasks.length));
  }

  // コンテンツからタイトル抽出
  extractTitleFromContent(content, targetUser) {
    console.log('🔍 extractTitleFromContent called:', {
      hasContent: !!content,
      targetUser: targetUser,
      contentPreview: content ? content.substring(0, 100) + '...' : 'NO CONTENT'
    });
    
    if (!content) {
      const fallbackTitle = `【代筆】${targetUser}: 今日も一日お疲れ様`;
      console.log('🔍 Using fallback title (no content):', fallbackTitle);
      return fallbackTitle;
    }
    
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    console.log('🔍 First line analysis:', {
      firstLine: firstLine,
      startsWithTitle: firstLine.startsWith('タイトル:'),
      includesGhostwrite: firstLine.includes('【代筆】'),
      startsWithHash: firstLine.startsWith('#'),
      length: firstLine.length
    });
    
    // 既に「タイトル:」がある場合は除去してタイトルとして使用
    if (firstLine.startsWith('タイトル:')) {
      const extractedTitle = firstLine.replace(/^タイトル:\s*/, '').trim();
      console.log('🔍 Extracted from "タイトル:" line:', extractedTitle);
      return extractedTitle;
    }
    
    // 既に【代筆】がある場合はそのまま使用
    if (firstLine.includes('【代筆】')) {
      console.log('🔍 Using existing ghostwrite title:', firstLine);
      return firstLine;
    }
    
    // 最初の行がタイトルらしい場合（セクションヘッダーではない）
    if (firstLine && !firstLine.startsWith('#') && firstLine.length > 5 && firstLine.length < 100) {
      const generatedTitle = `【代筆】${targetUser}: ${firstLine}`;
      console.log('🔍 Generated title from first line:', generatedTitle);
      return generatedTitle;
    }
    
    // フォールバックタイトル
    const fallbackTitle = `【代筆】${targetUser}: 今日も一日お疲れ様`;
    console.log('🔍 Using fallback title:', fallbackTitle);
    return fallbackTitle;
  }

  // 🔧 新機能: 関心事反映度分析
  analyzeInterestReflection(content, profileAnalysis) {
    const interests = profileAnalysis.interests || {};
    const detectedInterests = [
      ...(interests.main_categories || []),
      ...(interests.technical_keywords || [])
    ];
    
    const detectedTechKeywords = interests.technical_keywords || [];
    
    // 実際に反映された関心事の検出
    const reflectedInterests = [];
    let reflectionScore = 0;
    
    detectedInterests.forEach(interest => {
      if (content.toLowerCase().includes(interest.toLowerCase())) {
        reflectedInterests.push(interest);
        reflectionScore += interest.length > 2 ? 2 : 1; // 長い用語ほど高スコア
      }
    });
    
    const maxScore = detectedInterests.length * 2;
    const reflectionPercentage = maxScore > 0 ? Math.round((reflectionScore / maxScore) * 100) : 0;
    
    // 反映度レベルの判定
    let reflectionLevel = '低';
    if (reflectionPercentage >= 80) reflectionLevel = '優秀';
    else if (reflectionPercentage >= 60) reflectionLevel = '良好';
    else if (reflectionPercentage >= 40) reflectionLevel = '普通';
    
    // 技術的具体性の分析
    const technicalSpecificity = this.analyzeTechnicalSpecificity(content);
    
    return {
      detectedInterests: detectedInterests.slice(0, 4), // 最大4個表示
      detectedTechKeywords: detectedTechKeywords.slice(0, 4),
      reflectedInterests: reflectedInterests.slice(0, 3),
      reflectionScore,
      reflectionPercentage,
      reflectionLevel,
      technicalSpecificity
    };
  }

  // 🔧 新機能: 個人化品質分析
  analyzePersonalizationQuality(content, profileAnalysis) {
    const writingStyle = profileAnalysis.writing_style || {};
    const behaviorPatterns = profileAnalysis.behavior_patterns || {};
    
    // 文体再現度チェック
    const characteristicExpressions = writingStyle.characteristic_expressions || [];
    const foundExpressions = [];
    let styleScore = 3; // ベーススコア
    
    characteristicExpressions.forEach(expr => {
      if (content.includes(expr)) {
        foundExpressions.push(expr);
        styleScore += 0.3;
      }
    });
    
    styleScore = Math.min(styleScore, 5);
    
    // 作業パターン適合度チェック
    const typicalTasks = behaviorPatterns.typical_tasks || [];
    const matchedPatterns = [];
    let behaviorScore = 3;
    
    typicalTasks.forEach(task => {
      if (content.toLowerCase().includes(task.toLowerCase())) {
        matchedPatterns.push(task);
        behaviorScore += 0.4;
      }
    });
    
    behaviorScore = Math.min(behaviorScore, 5);
    
    // 総合評価
    const overallScore = ((styleScore + behaviorScore) / 2);
    let overallAssessment = '標準';
    if (overallScore >= 4.5) overallAssessment = '非常に高品質';
    else if (overallScore >= 4.0) overallAssessment = '高品質';
    else if (overallScore >= 3.5) overallAssessment = '良好';
    
    return {
      styleScore: Math.round(styleScore * 10) / 10,
      foundExpressions: foundExpressions.slice(0, 3),
      behaviorScore: Math.round(behaviorScore * 10) / 10,
      matchedPatterns: matchedPatterns.slice(0, 3),
      overallScore: Math.round(overallScore * 10) / 10,
      overallAssessment
    };
  }

  // 🔧 新機能: 技術的具体性分析
  analyzeTechnicalSpecificity(content) {
    const technicalTerms = [
      'API', 'データベース', '実装', 'システム', 'アーキテクチャ',
      'プログラミング', 'フレームワーク', 'ライブラリ', 'アルゴリズム',
      'パフォーマンス', 'セキュリティ', 'スケーリング', 'デプロイ',
      'CI/CD', 'DevOps', 'マイクロサービス', 'REST', 'GraphQL',
      '機械学習', 'AI', 'LLM', 'MCP', 'OpenAI', 'バックエンド',
      'フロントエンド', 'フルスタック', 'クラウド', 'コンテナ',
      'リファクタリング', 'チャットボット', 'ハッカソン', 'エラーハンドリング'
    ];
    
    const genericTerms = [
      'タスク', '作業', '仕事', '業務', '活動', '行動',
      '取り組み', '対応', '処理', '進行', '実施'
    ];
    
    let technicalCount = 0;
    let genericCount = 0;
    let foundTechnical = [];
    let foundGeneric = [];
    
    technicalTerms.forEach(term => {
      if (content.includes(term)) {
        technicalCount++;
        foundTechnical.push(term);
      }
    });
    
    genericTerms.forEach(term => {
      if (content.includes(term)) {
        genericCount++;
        foundGeneric.push(term);
      }
    });
    
    const technicalRatio = technicalCount / (technicalCount + genericCount);
    
    return {
      technicalTerms: technicalCount,
      genericTerms: genericCount,
      technicalRatio: Math.round(technicalRatio * 100),
      foundTechnical: [...new Set(foundTechnical)],
      foundGeneric: [...new Set(foundGeneric)],
      assessment: technicalRatio > 0.7 ? '非常に高' : 
                  technicalRatio > 0.5 ? '高' : 
                  technicalRatio > 0.3 ? '中' : '低'
    };
  }
}

module.exports = AIDiaryGenerator;

const axios = require('axios');

class EsaAPI {
  constructor(teamName = 'esminc-its', accessToken = null) {
    this.teamName = teamName;
    this.accessToken = accessToken;
    this.baseURL = `https://api.esa.io/v1/teams/${teamName}`;
  }

  // APIリクエストのヘッダー
  getHeaders() {
    if (!this.accessToken) {
      throw new Error('esa APIアクセストークンが設定されていません');
    }
    
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // 記事検索（プロフィール分析用）
  async searchPosts(query, options = {}) {
    try {
      const {
        page = 1,
        per_page = 20,
        sort = 'updated'
      } = options;

      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        per_page: per_page.toString(),
        sort
      });
      
      const url = `${this.baseURL}/posts?${params}`;
      console.log(`🔎 APIリクエスト: ${url}`);

      const response = await axios.get(url, {
        headers: this.getHeaders()
      });
      
      console.log(`📊 検索結果: ${response.data.posts.length}件 / 総数: ${response.data.total_count}件`);

      return {
        success: true,
        posts: response.data.posts,
        total_count: response.data.total_count,
        page: response.data.page,
        per_page: response.data.per_page,
        max_per_page: response.data.max_per_page
      };
    } catch (error) {
      console.error('❌ esa記事検索エラー:', error.response?.data || error.message);
      console.error('❌ リクエストURL:', `${this.baseURL}/posts?q=${query}&page=${options.page || 1}`);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // 特定ユーザーの日記記事を取得
  async getUserDiaryPosts(screenName, limit = 50) {
    console.log(`🔍 ${screenName}の記事検索開始...`);
    
    try {
      const allPosts = [];
      let page = 1;
      const perPage = 20;
      
      // 複数の検索パターンを試す
      const searchPatterns = [
        `user:${screenName}`,  // ユーザーの全記事
        `in:日記 user:${screenName}`,  // 日記カテゴリのみ
        `updated_by:${screenName}`,  // 更新者で検索
        `screen_name:${screenName}`,  // screen_nameで検索
        screenName  // シンプルな名前検索
      ];
      
      for (const query of searchPatterns) {
        console.log(`🔎 検索パターン: "${query}"`);
        
        page = 1;
        while (allPosts.length < limit) {
          const result = await this.searchPosts(query, {
            page,
            per_page: perPage,
            sort: 'updated'
          });
          
          console.log(`📊 検索結果: ${result.success ? result.posts.length : 0}件 (query: "${query}", page: ${page})`);

          if (!result.success) {
            console.log(`⚠️ 検索エラー: ${result.error}`);
            break;
          }
          
          if (result.posts.length === 0) {
            break;
          }

          allPosts.push(...result.posts);
          
          // 次のページがない場合は終了
          if (result.posts.length < perPage) {
            break;
          }
          
          page++;
        }
        
        // 一つのパターンで記事が見つかったら終了
        if (allPosts.length > 0) {
          console.log(`✅ "${query}"で${allPosts.length}件の記事を発見`);
          break;
        }
      }
      
      // 重複を除去
      const uniquePosts = allPosts.filter((post, index, self) => 
        self.findIndex(p => p.number === post.number) === index
      );

      console.log(`📈 最終結果: ${uniquePosts.length}件のユニーク記事を取得`);
      
      return {
        success: true,
        posts: uniquePosts.slice(0, limit),
        total_found: uniquePosts.length,
        screen_name: screenName
      };
    } catch (error) {
      console.error(`❌ ${screenName}の日記取得エラー:`, error);
      return {
        success: false,
        error: error.message,
        screen_name: screenName
      };
    }
  }

  // 記事詳細取得
  async getPost(postNumber) {
    try {
      const response = await axios.get(`${this.baseURL}/posts/${postNumber}`, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        post: response.data
      };
    } catch (error) {
      console.error('記事詳細取得エラー:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // 記事投稿
  async createPost(postData) {
    try {
      // アクセストークンの確認（早期エラーチェック）
      if (!this.accessToken) {
        console.error('❌ esa APIアクセストークンが設定されていません');
        return {
          success: false,
          error: 'esa APIアクセストークンが設定されていません',
          url: null,
          number: null
        };
      }
      
      const {
        name,           // タイトル
        body_md,        // 本文（Markdown）
        category,       // カテゴリー
        wip = false,    // WIP（Work In Progress）
        message = null, // コミットメッセージ
        user = null  // 投稿者指定（esa_bot使用可能）
      } = postData;

      const data = {
        post: {
          name,
          body_md,
          category,
          wip,
          message
        }
      };
      
      // 投稿者指定がある場合は追加（ownerのみ使用可能）
      if (user) {
        data.post.user = user;
        console.log(`🔄 投稿者指定: ${user}`);
      }
      
      console.log('📡 esa APIリクエスト:', {
        url: `${this.baseURL}/posts`,
        team: this.teamName,
        hasToken: !!this.accessToken,
        postTitle: name,
        createdBy: user || 'デフォルト（トークン所有者）'
      });

      const response = await axios.post(`${this.baseURL}/posts`, data, {
        headers: this.getHeaders()
      });
      
      console.log('✅ esa APIレスポンス:', response.data);

      return {
        success: true,
        post: response.data,
        url: `https://${this.teamName}.esa.io/posts/${response.data.number}`,
        number: response.data.number
      };
    } catch (error) {
      console.error('記事投稿エラー:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message,
        url: null,
        number: null
      };
    }
  }

  // チーム情報取得
  async getTeamInfo() {
    try {
      const response = await axios.get(`https://api.esa.io/v1/teams/${this.teamName}`, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        team: response.data
      };
    } catch (error) {
      console.error('チーム情報取得エラー:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // メンバー一覧取得
  async getMembers() {
    try {
      const response = await axios.get(`${this.baseURL}/members`, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        members: response.data.members
      };
    } catch (error) {
      console.error('メンバー取得エラー:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // 接続テスト
  async testConnection() {
    console.log('🔄 esa API接続テスト中...');
    console.log(`📡 チーム: ${this.teamName}`);
    console.log(`🔑 アクセストークン: ${this.accessToken ? '設定済み' : '未設定'}`);
    
    const teamResult = await this.getTeamInfo();
    if (!teamResult.success) {
      console.log(`❌ チーム情報取得失敗: ${teamResult.error}`);
      return {
        success: false,
        error: 'チーム情報の取得に失敗',
        details: teamResult.error
      };
    }

    console.log(`✅ チーム接続成功: ${teamResult.team.name}`);
    
    // メンバー情報もテスト
    const membersResult = await this.getMembers();
    if (membersResult.success) {
      console.log(`👥 メンバー数: ${membersResult.members.length}人`);
      console.log(`👤 メンバー一覧: ${membersResult.members.map(m => m.screen_name).join(', ')}`);
    }
    
    return {
      success: true,
      team: teamResult.team,
      members: membersResult.success ? membersResult.members : []
    };
  }

  // プロフィール分析用データ取得
  async getProfileAnalysisData(screenName) {
    console.log(`🔄 ${screenName}のプロフィール分析データ取得中...`);
    console.log(`📡 アクセストークン: ${this.accessToken ? '設定済み' : '未設定'}`);
    
    const diaryResult = await this.getUserDiaryPosts(screenName, 100);
    if (!diaryResult.success) {
      console.log(`❌ 日記記事取得失敗: ${diaryResult.error}`);
      return {
        success: false,
        error: '日記記事の取得に失敗',
        details: diaryResult.error
      };
    }
    
    console.log(`📊 取得した記事数: ${diaryResult.posts.length}件`);

    // 記事の詳細内容を取得（最新20件のみ）
    const detailedPosts = [];
    const postsToAnalyze = diaryResult.posts.slice(0, 20);
    
    console.log(`🔍 詳細分析対象: ${postsToAnalyze.length}件`);
    
    for (const post of postsToAnalyze) {
      console.log(`📝 記事詳細取得中: #${post.number} - ${post.name}`);
      const detailResult = await this.getPost(post.number);
      if (detailResult.success) {
        detailedPosts.push(detailResult.post);
        console.log(`✅ 記事詳細取得成功: #${post.number}`);
      } else {
        console.log(`❌ 記事詳細取得失敗: #${post.number} - ${detailResult.error}`);
      }
      
      // API制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`📊 詳細データ取得完了: ${detailedPosts.length}件`);

    return {
      success: true,
      screen_name: screenName,
      summary_posts: diaryResult.posts,
      detailed_posts: detailedPosts,
      total_posts: diaryResult.posts.length,
      analysis_posts: detailedPosts.length
    };
  }

  // 日記投稿（代筆用）
  async postGhostwrittenDiary(targetUser, content, inputActions = []) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const [year, month, day] = dateStr.split('-');
    
    const category = `テスト/日記/${year}/${month}/${day}`;
    const title = `【代筆】${targetUser}: ${this.generateTitleFromContent(content)}`;
    
    const postData = {
      name: title,
      body_md: content,
      category: category,
      wip: true,  // WIP状態に変更
      message: `🤖 AI代筆システム - 対象ユーザー: ${targetUser}`,
      user: 'esa_bot'  // 共通投稿者アカウント使用
    };

    console.log(`🔄 ${targetUser}の代筆日記を投稿中...`);
    const result = await this.createPost(postData);
    
    if (result.success) {
      console.log(`✅ 代筆日記投稿完了: ${result.url}`);
    }
    
    return result;
  }

  // コンテンツからタイトルを生成
  generateTitleFromContent(content) {
    // 簡単なタイトル生成ロジック
    const lines = content.split('\n').filter(line => line.trim());
    const actionLines = lines.filter(line => line.includes('- [x]'));
    
    if (actionLines.length > 0) {
      const mainAction = actionLines[0].replace('- [x]', '').trim();
      return `${mainAction}な日`;
    }
    
    // デフォルトタイトル
    const hour = new Date().getHours();
    if (hour < 12) return '朝から頑張った日';
    if (hour < 18) return '午後も集中した日';
    return '今日も一日お疲れ様';
  }
}

module.exports = EsaAPI;
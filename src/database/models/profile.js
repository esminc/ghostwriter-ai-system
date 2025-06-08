const database = require('../init');

class Profile {
  // プロフィール作成・更新（AI統合システム対応版）
  static async createOrUpdate(profileData) {
    const { 
      user_id, 
      screen_name, 
      writing_style, 
      interests, 
      behavior_patterns, 
      article_count,
      ai_analysis_used = false,
      analysis_quality = 3
    } = profileData;
    
    try {
      // まず既存のプロフィールを確認
      const checkSql = `SELECT id FROM profiles WHERE user_id = $1`;
      const existingProfile = await database.get(checkSql, [user_id]);

      if (existingProfile) {
        // 更新
        const updateSql = `
          UPDATE profiles 
          SET screen_name = $1, 
              writing_style = $2, 
              interests = $3, 
              behavior_patterns = $4, 
              article_count = $5,
              ai_analysis_used = $6,
              analysis_quality = $7,
              last_analyzed = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $8
        `;
        
        await database.run(updateSql, [
          screen_name, 
          typeof writing_style === 'string' ? writing_style : JSON.stringify(writing_style), 
          typeof interests === 'string' ? interests : JSON.stringify(interests), 
          typeof behavior_patterns === 'string' ? behavior_patterns : JSON.stringify(behavior_patterns), 
          article_count,
          ai_analysis_used,
          analysis_quality,
          user_id
        ]);
        
        return { id: existingProfile.id, updated: true, ...profileData };
      } else {
        // 新規作成
        const insertSql = `
          INSERT INTO profiles (
            user_id, screen_name, writing_style, interests, 
            behavior_patterns, article_count, ai_analysis_used, 
            analysis_quality, last_analyzed
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          RETURNING id
        `;
        
        const result = await database.run(insertSql, [
          user_id, 
          screen_name, 
          typeof writing_style === 'string' ? writing_style : JSON.stringify(writing_style), 
          typeof interests === 'string' ? interests : JSON.stringify(interests), 
          typeof behavior_patterns === 'string' ? behavior_patterns : JSON.stringify(behavior_patterns), 
          article_count,
          ai_analysis_used,
          analysis_quality
        ]);
        
        return { id: result.lastID, created: true, ...profileData };
      }
    } catch (error) {
      throw error;
    }
  }

  // ユーザーIDでプロフィール取得
  static async findByUserId(userId) {
    const sql = `
      SELECT p.*, u.slack_username, u.slack_user_id
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `;
    
    try {
      const row = await database.get(sql, [userId]);
      
      if (row) {
        // JSONフィールドのパース処理
        try {
          row.writing_style = typeof row.writing_style === 'string' ? 
            JSON.parse(row.writing_style) : row.writing_style;
          row.interests = typeof row.interests === 'string' ? 
            JSON.parse(row.interests) : row.interests;
          row.behavior_patterns = typeof row.behavior_patterns === 'string' ? 
            JSON.parse(row.behavior_patterns) : row.behavior_patterns;
        } catch (parseError) {
          console.warn('Profile data parsing error:', parseError);
          // パースに失敗した場合はそのまま返す
        }
      }
      return row;
    } catch (error) {
      throw error;
    }
  }

  // スクリーンネームでプロフィール取得
  static async findByScreenName(screenName) {
    const sql = `
      SELECT p.*, u.slack_username, u.slack_user_id
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.screen_name = $1
    `;
    
    try {
      const row = await database.get(sql, [screenName]);
      
      if (row) {
        // JSONフィールドのパース処理
        try {
          row.writing_style = typeof row.writing_style === 'string' ? 
            JSON.parse(row.writing_style) : row.writing_style;
          row.interests = typeof row.interests === 'string' ? 
            JSON.parse(row.interests) : row.interests;
          row.behavior_patterns = typeof row.behavior_patterns === 'string' ? 
            JSON.parse(row.behavior_patterns) : row.behavior_patterns;
        } catch (parseError) {
          console.warn('Profile data parsing error:', parseError);
        }
      }
      return row;
    } catch (error) {
      throw error;
    }
  }

  // 全プロフィール取得
  static async findAll() {
    const sql = `
      SELECT p.*, u.slack_username, u.slack_user_id
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.last_analyzed DESC
    `;
    
    try {
      const rows = await database.query(sql, []);
      
      const parsedRows = rows.map(row => {
        try {
          row.writing_style = typeof row.writing_style === 'string' ? 
            JSON.parse(row.writing_style) : row.writing_style;
          row.interests = typeof row.interests === 'string' ? 
            JSON.parse(row.interests) : row.interests;
          row.behavior_patterns = typeof row.behavior_patterns === 'string' ? 
            JSON.parse(row.behavior_patterns) : row.behavior_patterns;
        } catch (parseError) {
          console.warn('Profile data parsing error for row:', row.id);
        }
        return row;
      });
      
      return parsedRows;
    } catch (error) {
      throw error;
    }
  }

  // 古いプロフィール検索（再分析対象）
  static async findStaleProfiles(daysOld = 7) {
    const sql = `
      SELECT p.*, u.slack_username, u.slack_user_id
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.last_analyzed < NOW() - INTERVAL '${daysOld} days'
      ORDER BY p.last_analyzed ASC
    `;
    
    try {
      const rows = await database.query(sql, []);
      
      const parsedRows = rows.map(row => {
        try {
          row.writing_style = typeof row.writing_style === 'string' ? 
            JSON.parse(row.writing_style) : row.writing_style;
          row.interests = typeof row.interests === 'string' ? 
            JSON.parse(row.interests) : row.interests;
          row.behavior_patterns = typeof row.behavior_patterns === 'string' ? 
            JSON.parse(row.behavior_patterns) : row.behavior_patterns;
        } catch (parseError) {
          console.warn('Profile data parsing error for row:', row.id);
        }
        return row;
      });
      
      return parsedRows;
    } catch (error) {
      throw error;
    }
  }

  // プロフィール数カウント
  static async count() {
    const sql = `SELECT COUNT(*) as count FROM profiles`;
    
    try {
      const result = await database.get(sql, []);
      return result.count;
    } catch (error) {
      throw error;
    }
  }

  // AI分析統計
  static async getAIAnalysisStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(CASE WHEN ai_analysis_used = true THEN 1 END) as ai_analyzed_profiles,
        AVG(analysis_quality) as avg_quality,
        AVG(article_count) as avg_article_count
      FROM profiles
    `;
    
    try {
      const row = await database.get(sql, []);
      
      return {
        totalProfiles: row.total_profiles || 0,
        aiAnalyzedProfiles: row.ai_analyzed_profiles || 0,
        averageQuality: row.avg_quality ? parseFloat(row.avg_quality.toFixed(1)) : null,
        averageArticleCount: row.avg_article_count ? Math.round(row.avg_article_count) : 0
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Profile;
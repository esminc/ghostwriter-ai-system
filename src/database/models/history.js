const database = require('../init');

class GhostwriteHistory {
  // 代筆履歴作成
  static async create(historyData) {
    const { 
      user_id,  // Slack Bot用フィールド（target_user_idに対応）
      target_user_id, 
      requester_user_id, 
      title,  // Slack Bot用フィールド
      content,  // Slack Bot用フィールド（generated_contentに対応）
      category,  // Slack Bot用フィールド
      esa_post_number,  // Slack Bot用フィールド
      esa_post_url,  // Slack Bot用フィールド
      quality_score,  // Slack Bot用フィールド（quality_ratingに対応）
      is_ai_generated = true,  // Slack Bot用フィールド
      generation_method = 'slack_bot',  // Slack Bot用フィールド
      esa_post_id,
      generated_content, 
      input_actions, 
      calendar_data, 
      slack_data,
      quality_rating = null,
      ai_analysis_used = false,
      ai_generation_used = false
    } = historyData;
    
    // Slack Bot用とPhase 1用のデータを統合
    const finalUserId = user_id || target_user_id;
    const finalContent = content || generated_content;
    const finalQualityRating = quality_score || quality_rating;
    const finalAiGenerated = is_ai_generated !== undefined ? is_ai_generated : ai_generation_used;
    
    const sql = `
      INSERT INTO ghostwrite_history (
        target_user_id, requester_user_id, esa_post_id,
        generated_content, input_actions, calendar_data, 
        slack_data, quality_rating, ai_analysis_used, ai_generation_used
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    
    // JSONデータは文字列として保存
    const actionsJson = JSON.stringify(input_actions || []);
    const calendarJson = JSON.stringify(calendar_data || {});
    const slackJson = JSON.stringify(slack_data || {
      title: title,
      category: category,
      esa_post_number: esa_post_number,
      esa_post_url: esa_post_url,
      generation_method: generation_method
    });
    
    try {
      const result = await database.run(sql, [
        finalUserId, 
        requester_user_id || finalUserId, 
        esa_post_id || esa_post_number,
        finalContent, 
        actionsJson, 
        calendarJson, 
        slackJson, 
        finalQualityRating, 
        ai_analysis_used, 
        finalAiGenerated
      ]);
      
      return { id: result.lastID, ...historyData };
    } catch (error) {
      throw error;
    }
  }

  // 履歴取得（ユーザー別）
  static async findByUserId(userId, limit = 10) {
    const sql = `
      SELECT 
        h.*,
        target_user.slack_username as target_username,
        requester_user.slack_username as requester_username
      FROM ghostwrite_history h
      LEFT JOIN users target_user ON h.target_user_id = target_user.slack_user_id
      LEFT JOIN users requester_user ON h.requester_user_id = requester_user.slack_user_id
      WHERE h.target_user_id = $1
      ORDER BY h.created_at DESC
      LIMIT $2
    `;
    
    try {
      const rows = await database.query(sql, [userId, limit]);
      
      // JSONデータをパース
      const parsedRows = rows.map(row => ({
        ...row,
        input_actions: JSON.parse(row.input_actions || '[]'),
        calendar_data: JSON.parse(row.calendar_data || '{}'),
        slack_data: JSON.parse(row.slack_data || '{}')
      }));
      
      return parsedRows;
    } catch (error) {
      throw error;
    }
  }

  // 履歴取得（全体）
  static async findAllBasic(limit = 50) {
    const sql = `
      SELECT 
        h.*,
        target_user.slack_username as target_username,
        requester_user.slack_username as requester_username
      FROM ghostwrite_history h
      LEFT JOIN users target_user ON h.target_user_id = target_user.slack_user_id
      LEFT JOIN users requester_user ON h.requester_user_id = requester_user.slack_user_id
      ORDER BY h.created_at DESC
      LIMIT $1
    `;
    
    try {
      const rows = await database.query(sql, [limit]);
      
      const parsedRows = rows.map(row => ({
        ...row,
        input_actions: JSON.parse(row.input_actions || '[]'),
        calendar_data: JSON.parse(row.calendar_data || '{}'),
        slack_data: JSON.parse(row.slack_data || '{}')
      }));
      
      return parsedRows;
    } catch (error) {
      throw error;
    }
  }

  // 統計情報取得
  static async getStats(userId = null) {
    let sql;
    let params = [];
    
    if (userId) {
      sql = `
        SELECT 
          COUNT(*) as total_count,
          AVG(quality_rating) as avg_rating,
          MAX(created_at) as last_ghostwrite,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_count
        FROM ghostwrite_history 
        WHERE target_user_id = $1
      `;
      params = [userId];
    } else {
      sql = `
        SELECT 
          COUNT(*) as total_count,
          AVG(quality_rating) as avg_rating,
          MAX(created_at) as last_ghostwrite,
          COUNT(DISTINCT target_user_id) as unique_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_count
        FROM ghostwrite_history
      `;
    }
    
    try {
      const result = await database.get(sql, params);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // 評価更新
  static async updateRating(historyId, rating) {
    const sql = `
      UPDATE ghostwrite_history 
      SET quality_rating = $1
      WHERE id = $2
    `;
    
    try {
      const result = await database.run(sql, [rating, historyId]);
      return { changes: result.changes };
    } catch (error) {
      throw error;
    }
  }

  // IDで履歴取得
  static async findById(historyId) {
    const sql = `
      SELECT 
        h.*,
        target_user.slack_username as target_username,
        requester_user.slack_username as requester_username
      FROM ghostwrite_history h
      LEFT JOIN users target_user ON h.target_user_id = target_user.slack_user_id
      LEFT JOIN users requester_user ON h.requester_user_id = requester_user.slack_user_id
      WHERE h.id = $1
    `;
    
    try {
      const row = await database.get(sql, [historyId]);
      
      if (row) {
        // JSONデータをパース
        const parsedRow = {
          ...row,
          input_actions: JSON.parse(row.input_actions || '[]'),
          calendar_data: JSON.parse(row.calendar_data || '{}'),
          slack_data: JSON.parse(row.slack_data || '{}')
        };
        return parsedRow;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  // 統計情報取得（インスタンスメソッド）
  async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as totalGhostWrites,
        COUNT(CASE WHEN ai_generation_used = true THEN 1 END) as aiGeneratedCount,
        AVG(quality_rating) as averageQualityScore,
        MAX(created_at) as latestPost,
        COUNT(DISTINCT target_user_id) as uniqueUsers
      FROM ghostwrite_history
    `;
    
    try {
      const row = await database.get(sql, []);
      
      return {
        totalGhostWrites: row.totalGhostWrites || 0,
        aiGeneratedCount: row.aiGeneratedCount || 0,
        averageQualityScore: row.averageQualityScore ? parseFloat(row.averageQualityScore.toFixed(1)) : null,
        latestPost: row.latestPost,
        uniqueUsers: row.uniqueUsers || 0
      };
    } catch (error) {
      throw error;
    }
  }

  // 最近の履歴取得（インスタンスメソッド）- Slack Bot用に最適化
  async getRecentHistory(userId, limit = 5) {
    const sql = `
      SELECT 
        h.*,
        target_user.slack_username as target_username
      FROM ghostwrite_history h
      LEFT JOIN users target_user ON h.target_user_id = target_user.slack_user_id
      WHERE h.target_user_id = $1
      ORDER BY h.created_at DESC
      LIMIT $2
    `;
    
    try {
      const rows = await database.query(sql, [userId, limit]);
      
      const parsedRows = rows.map(row => {
        const slackData = JSON.parse(row.slack_data || '{}');
        return {
          id: row.id,
          title: slackData.title || this.extractTitleFromContent(row.generated_content),
          created_at: row.created_at,
          quality_score: row.quality_rating,
          is_ai_generated: row.ai_generation_used === true,
          esa_post_url: slackData.esa_post_url,
          category: slackData.category
        };
      });
      
      return parsedRows;
    } catch (error) {
      throw error;
    }
  }

  // コンテンツからタイトルを抽出するヘルパーメソッド
  extractTitleFromContent(content) {
    if (!content) return 'タイトルなし';
    
    // 【代筆】で始まる行を探す
    const lines = content.split('\n');
    const titleLine = lines.find(line => line.includes('【代筆】'));
    if (titleLine) {
      return titleLine.replace('【代筆】', '').trim().substring(0, 50);
    }
    
    // 最初の行をタイトルとして使用（簡単な実装）
    const firstLine = lines.find(line => line.trim().length > 0);
    return firstLine ? firstLine.trim().substring(0, 50) : 'タイトルなし';
  }

  // 履歴数カウント
  static async count() {
    const sql = `SELECT COUNT(*) as count FROM ghostwrite_history`;
    
    try {
      const result = await database.get(sql, []);
      return result.count;
    } catch (error) {
      throw error;
    }
  }

  // AI使用履歴検索
  static async findAll(options = {}) {
    const { where = {}, limit = 50 } = options;
    
    let sql = `
      SELECT 
        h.*,
        target_user.slack_username as target_username,
        requester_user.slack_username as requester_username
      FROM ghostwrite_history h
      LEFT JOIN users target_user ON h.target_user_id = target_user.slack_user_id
      LEFT JOIN users requester_user ON h.requester_user_id = requester_user.slack_user_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (where.ai_generation_used !== undefined) {
      conditions.push('h.ai_generation_used = $' + (params.length + 1));
      params.push(where.ai_generation_used);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY h.created_at DESC';
    
    if (limit) {
      sql += ' LIMIT $' + (params.length + 1);
      params.push(limit);
    }
    
    try {
      const rows = await database.query(sql, params);
      
      const parsedRows = rows.map(row => ({
        ...row,
        input_actions: JSON.parse(row.input_actions || '[]'),
        calendar_data: JSON.parse(row.calendar_data || '{}'),
        slack_data: JSON.parse(row.slack_data || '{}')
      }));
      
      return parsedRows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = GhostwriteHistory;
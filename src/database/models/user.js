const database = require('../init');

class User {
  // ユーザー作成
  static async create(userData) {
    const { slack_user_id, slack_username } = userData;
    
    const sql = `
      INSERT INTO users (slack_user_id, slack_username)
      VALUES ($1, $2) RETURNING id
    `;
    
    try {
      const result = await database.run(sql, [slack_user_id, slack_username]);
      return { id: result.lastID, ...userData };
    } catch (error) {
      throw error;
    }
  }

  // ユーザー検索
  static async findBySlackId(slackUserId) {
    const sql = `SELECT * FROM users WHERE slack_user_id = $1`;
    
    try {
      const result = await database.get(sql, [slackUserId]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Googleトークン更新
  static async updateGoogleTokens(slackUserId, tokenData) {
    const { 
      google_user_id, 
      google_email, 
      access_token, 
      refresh_token, 
      token_expiry 
    } = tokenData;
    
    const sql = `
      UPDATE users 
      SET google_user_id = $1, 
          google_email = $2, 
          access_token = $3, 
          refresh_token = $4, 
          token_expiry = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE slack_user_id = $6
    `;
    
    try {
      const result = await database.run(sql, [
        google_user_id, 
        google_email, 
        access_token, 
        refresh_token, 
        token_expiry, 
        slackUserId
      ]);
      return { changes: result.changes };
    } catch (error) {
      throw error;
    }
  }

  // 全ユーザー取得
  static async findAll() {
    const sql = `SELECT * FROM users ORDER BY created_at`;
    
    try {
      const results = await database.query(sql, []);
      return results;
    } catch (error) {
      throw error;
    }
  }

  // ユーザー名で検索
  static async findByUsername(username) {
    const sql = `SELECT * FROM users WHERE slack_username = $1`;
    
    try {
      const result = await database.get(sql, [username]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // ユーザー作成または更新（Slack Bot用）
  static async createOrUpdate(userData) {
    const { slack_user_id, username, display_name, is_active } = userData;
    
    try {
      // まず既存ユーザーを検索
      const existingUser = await this.findBySlackId(slack_user_id);
      
      if (existingUser) {
        // 既存ユーザーを更新
        const sql = `
          UPDATE users 
          SET slack_username = $1, 
              updated_at = CURRENT_TIMESTAMP
          WHERE slack_user_id = $2
          RETURNING id
        `;
        
        const result = await database.run(sql, [username || display_name, slack_user_id]);
        return { id: existingUser.id, ...userData, updated: true };
      } else {
        // 新規ユーザーを作成
        return await this.create({
          slack_user_id,
          slack_username: username || display_name
        });
      }
    } catch (error) {
      throw error;
    }
  }

  // ユーザー数カウント
  static async count() {
    const sql = `SELECT COUNT(*) as count FROM users`;
    
    try {
      const result = await database.get(sql, []);
      return result.count;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;

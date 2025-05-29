const database = require('../init');

class User {
  // ユーザー作成
  static create(userData) {
    return new Promise((resolve, reject) => {
      const { slack_user_id, slack_username } = userData;
      
      const sql = `
        INSERT INTO users (slack_user_id, slack_username)
        VALUES (?, ?)
      `;
      
      database.getDb().run(sql, [slack_user_id, slack_username], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...userData });
        }
      });
    });
  }

  // ユーザー検索
  static findBySlackId(slackUserId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE slack_user_id = ?`;
      
      database.getDb().get(sql, [slackUserId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Googleトークン更新
  static updateGoogleTokens(slackUserId, tokenData) {
    return new Promise((resolve, reject) => {
      const { 
        google_user_id, 
        google_email, 
        access_token, 
        refresh_token, 
        token_expiry 
      } = tokenData;
      
      const sql = `
        UPDATE users 
        SET google_user_id = ?, 
            google_email = ?, 
            access_token = ?, 
            refresh_token = ?, 
            token_expiry = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE slack_user_id = ?
      `;
      
      database.getDb().run(sql, [
        google_user_id, 
        google_email, 
        access_token, 
        refresh_token, 
        token_expiry, 
        slackUserId
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // 全ユーザー取得
  static findAll() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users ORDER BY created_at`;
      
      database.getDb().all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // ユーザー名で検索
  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM users WHERE slack_username = ?`;
      
      database.getDb().get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // ユーザー作成または更新（Slack Bot用）
  static createOrUpdate(userData) {
    return new Promise((resolve, reject) => {
      const { slack_user_id, username, display_name, is_active } = userData;
      
      // まず既存ユーザーを検索
      this.findBySlackId(slack_user_id)
        .then(existingUser => {
          if (existingUser) {
            // 既存ユーザーを更新
            const sql = `
              UPDATE users 
              SET slack_username = ?, 
                  updated_at = CURRENT_TIMESTAMP
              WHERE slack_user_id = ?
            `;
            
            database.getDb().run(sql, [username || display_name, slack_user_id], function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({ id: existingUser.id, ...userData, updated: true });
              }
            });
          } else {
            // 新規ユーザーを作成
            this.create({
              slack_user_id,
              slack_username: username || display_name
            }).then(resolve).catch(reject);
          }
        })
        .catch(reject);
    });
  }

  // ユーザー数カウント
  static count() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) as count FROM users`;
      
      database.getDb().get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }
}

module.exports = User;

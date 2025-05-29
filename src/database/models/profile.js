const database = require('../init');

class Profile {
  // プロフィール作成・更新（AI統合システム対応版）
  static createOrUpdate(profileData) {
    return new Promise((resolve, reject) => {
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
      
      // まず既存のプロフィールを確認
      const checkSql = `SELECT id FROM profiles WHERE user_id = ?`;
      
      database.getDb().get(checkSql, [user_id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          // 更新
          const updateSql = `
            UPDATE profiles 
            SET screen_name = ?, 
                writing_style = ?, 
                interests = ?, 
                behavior_patterns = ?, 
                article_count = ?,
                ai_analysis_used = ?,
                analysis_quality = ?,
                last_analyzed = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `;
          
          database.getDb().run(updateSql, [
            screen_name, 
            typeof writing_style === 'string' ? writing_style : JSON.stringify(writing_style), 
            typeof interests === 'string' ? interests : JSON.stringify(interests), 
            typeof behavior_patterns === 'string' ? behavior_patterns : JSON.stringify(behavior_patterns), 
            article_count,
            ai_analysis_used ? 1 : 0,
            analysis_quality,
            user_id
          ], function(updateErr) {
            if (updateErr) {
              reject(updateErr);
            } else {
              resolve({ id: row.id, updated: true, ...profileData });
            }
          });
        } else {
          // 新規作成
          const insertSql = `
            INSERT INTO profiles (
              user_id, screen_name, writing_style, interests, 
              behavior_patterns, article_count, ai_analysis_used, 
              analysis_quality, last_analyzed
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `;
          
          database.getDb().run(insertSql, [
            user_id, 
            screen_name, 
            typeof writing_style === 'string' ? writing_style : JSON.stringify(writing_style), 
            typeof interests === 'string' ? interests : JSON.stringify(interests), 
            typeof behavior_patterns === 'string' ? behavior_patterns : JSON.stringify(behavior_patterns), 
            article_count,
            ai_analysis_used ? 1 : 0,
            analysis_quality
          ], function(insertErr) {
            if (insertErr) {
              reject(insertErr);
            } else {
              resolve({ id: this.lastID, created: true, ...profileData });
            }
          });
        }
      });
    });
  }

  // ユーザーIDでプロフィール取得
  static findByUserId(userId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, u.slack_username, u.slack_user_id
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
      `;
      
      database.getDb().get(sql, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
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
          resolve(row);
        }
      });
    });
  }

  // スクリーンネームでプロフィール取得
  static findByScreenName(screenName) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, u.slack_username, u.slack_user_id
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.screen_name = ?
      `;
      
      database.getDb().get(sql, [screenName], (err, row) => {
        if (err) {
          reject(err);
        } else {
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
          resolve(row);
        }
      });
    });
  }

  // 全プロフィール取得
  static findAll() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, u.slack_username, u.slack_user_id
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.last_analyzed DESC
      `;
      
      database.getDb().all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
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
          resolve(parsedRows);
        }
      });
    });
  }

  // 古いプロフィール検索（再分析対象）
  static findStaleProfiles(daysOld = 7) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, u.slack_username, u.slack_user_id
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.last_analyzed < datetime('now', '-${daysOld} days')
        ORDER BY p.last_analyzed ASC
      `;
      
      database.getDb().all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
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
          resolve(parsedRows);
        }
      });
    });
  }

  // プロフィール数カウント
  static count() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) as count FROM profiles`;
      
      database.getDb().get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  // AI分析統計
  static getAIAnalysisStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) as total_profiles,
          COUNT(CASE WHEN ai_analysis_used = 1 THEN 1 END) as ai_analyzed_profiles,
          AVG(analysis_quality) as avg_quality,
          AVG(article_count) as avg_article_count
        FROM profiles
      `;
      
      database.getDb().get(sql, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            totalProfiles: row.total_profiles || 0,
            aiAnalyzedProfiles: row.ai_analyzed_profiles || 0,
            averageQuality: row.avg_quality ? parseFloat(row.avg_quality.toFixed(1)) : null,
            averageArticleCount: row.avg_article_count ? Math.round(row.avg_article_count) : 0
          });
        }
      });
    });
  }
}

module.exports = Profile;
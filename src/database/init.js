const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// データベースファイルのパス
const DB_PATH = path.join(__dirname, 'ghostwriter.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('データベース接続エラー:', err.message);
      } else {
        console.log('SQLiteデータベースに接続しました');
        this.init();
      }
    });
  }

  // テーブル初期化
  init() {
    this.db.serialize(() => {
      // ユーザーテーブル
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slack_user_id TEXT UNIQUE NOT NULL,
          slack_username TEXT,
          google_user_id TEXT,
          google_email TEXT,
          access_token TEXT,
          refresh_token TEXT,
          token_expiry DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // プロフィールテーブル
      this.db.run(`
        CREATE TABLE IF NOT EXISTS profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          screen_name TEXT,
          writing_style TEXT,
          interests TEXT,
          behavior_patterns TEXT,
          last_analyzed DATETIME,
          article_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // 代筆履歴テーブル
      this.db.run(`
        CREATE TABLE IF NOT EXISTS ghostwrite_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          target_user_id INTEGER,
          requester_user_id INTEGER,
          esa_post_id INTEGER,
          generated_content TEXT,
          input_actions TEXT,
          calendar_data TEXT,
          slack_data TEXT,
          quality_rating INTEGER,
          ai_analysis_used BOOLEAN DEFAULT 0,
          ai_generation_used BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (target_user_id) REFERENCES users (id),
          FOREIGN KEY (requester_user_id) REFERENCES users (id)
        )
      `);

      // AI統合機能用カラム追加（既存テーブル用）
      this.db.run(`
        ALTER TABLE ghostwrite_history 
        ADD COLUMN ai_analysis_used BOOLEAN DEFAULT 0
      `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          // カラムが既に存在する場合以外のエラーは表示
          console.log('ai_analysis_used カラム追加:', err.message);
        }
      });
      
      this.db.run(`
        ALTER TABLE ghostwrite_history 
        ADD COLUMN ai_generation_used BOOLEAN DEFAULT 0
      `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.log('ai_generation_used カラム追加:', err.message);
        }
      });

      // プロフィールテーブルのAI統合機能用カラム追加
      this.db.run(`
        ALTER TABLE profiles 
        ADD COLUMN ai_analysis_used BOOLEAN DEFAULT 0
      `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.log('profiles ai_analysis_used カラム追加:', err.message);
        }
      });
      
      this.db.run(`
        ALTER TABLE profiles 
        ADD COLUMN analysis_quality INTEGER DEFAULT 3
      `, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.log('profiles analysis_quality カラム追加:', err.message);
        }
      });

      // キャッシュテーブル
      this.db.run(`
        CREATE TABLE IF NOT EXISTS cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cache_key TEXT UNIQUE,
          cache_value TEXT,
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('データベーステーブルを初期化しました');
    });
  }

  // データベース接続取得
  getDb() {
    return this.db;
  }

  // 接続クローズ
  close() {
    this.db.close((err) => {
      if (err) {
        console.error('データベースクローズエラー:', err.message);
      } else {
        console.log('データベース接続を終了しました');
      }
    });
  }
}

// データベースインスタンス
const dbInstance = new Database();

// 初期化関数（Promise版）
function initDatabase() {
  return new Promise((resolve, reject) => {
    // データベースが既に初期化済みの場合はすぐに resolve
    if (dbInstance.db) {
      resolve(dbInstance);
    } else {
      // 少し待ってから resolve（初期化の完了を待つ）
      setTimeout(() => {
        resolve(dbInstance);
      }, 100);
    }
  });
}

module.exports = dbInstance;
module.exports.initDatabase = initDatabase;

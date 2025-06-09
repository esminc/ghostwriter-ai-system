const DatabaseConnection = require('./connection');
require('dotenv').config();

class Database {
  constructor() {
    this.dbConnection = new DatabaseConnection();
    this.init();
  }

  async init() {
    try {
      await this.dbConnection.connect();
      await this.createTables();
      console.log('データベーステーブルを初期化しました');
    } catch (error) {
      console.error('データベース初期化エラー:', error.message);
    }
  }

  async createTables() {
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    if (dbType === 'postgresql') {
      // PostgreSQL用テーブル作成（既存テーブルがある場合はスキップ）
      await this.dbConnection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          slack_user_id VARCHAR(50) UNIQUE NOT NULL,
          slack_username VARCHAR(100),
          google_user_id VARCHAR(100),
          google_email VARCHAR(255),
          access_token TEXT,
          refresh_token TEXT,
          token_expiry TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.dbConnection.query(`
        CREATE TABLE IF NOT EXISTS profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          screen_name VARCHAR(100),
          writing_style JSONB,
          interests JSONB,
          behavior_patterns JSONB,
          last_analyzed TIMESTAMP,
          article_count INTEGER DEFAULT 0,
          ai_analysis_used BOOLEAN DEFAULT FALSE,
          analysis_quality INTEGER DEFAULT 3,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.dbConnection.query(`
        CREATE TABLE IF NOT EXISTS ghostwrite_history (
          id SERIAL PRIMARY KEY,
          target_user_id VARCHAR(50) NOT NULL,
          requester_user_id VARCHAR(50) NOT NULL,
          esa_post_id INTEGER,
          generated_content TEXT,
          input_actions TEXT,
          calendar_data JSONB,
          slack_data JSONB,
          quality_rating DECIMAL(3,2),
          ai_analysis_used BOOLEAN DEFAULT FALSE,
          ai_generation_used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.dbConnection.query(`
        CREATE TABLE IF NOT EXISTS cache (
          id SERIAL PRIMARY KEY,
          cache_key VARCHAR(255) UNIQUE,
          cache_value JSONB,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // トリガー作成（updated_at自動更新）
      try {
        await this.dbConnection.query(`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql'
        `);

        await this.dbConnection.query(`
          CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);

        await this.dbConnection.query(`
          CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
      } catch (triggerError) {
        // トリガーが既に存在する場合は無視
        if (!triggerError.message.includes('already exists')) {
          console.log('トリガー作成スキップ:', triggerError.message);
        }
      }

    } else {
      // SQLite用テーブル作成（従来のコード）
      const sqlite3 = require('sqlite3').verbose();
      const path = require('path');
      const DB_PATH = path.join(__dirname, 'ghostwriter.db');
      
      const db = new sqlite3.Database(DB_PATH);
      
      // SQLiteテーブル作成処理（従来コード）
      db.serialize(() => {
        db.run(`
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

        db.run(`
          CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            screen_name TEXT,
            writing_style TEXT,
            interests TEXT,
            behavior_patterns TEXT,
            last_analyzed DATETIME,
            article_count INTEGER DEFAULT 0,
            ai_analysis_used BOOLEAN DEFAULT 0,
            analysis_quality INTEGER DEFAULT 3,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS ghostwrite_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_user_id TEXT,
            requester_user_id TEXT,
            esa_post_id INTEGER,
            generated_content TEXT,
            input_actions TEXT,
            calendar_data TEXT,
            slack_data TEXT,
            quality_rating REAL,
            ai_analysis_used BOOLEAN DEFAULT 0,
            ai_generation_used BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cache_key TEXT UNIQUE,
            cache_value TEXT,
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      });
      
      this.dbConnection.connection = db;
    }
  }

  // データベース接続取得
  getDb() {
    return this.dbConnection.connection;
  }

  // Promise版query
  async query(sql, params = []) {
    return await this.dbConnection.query(sql, params);
  }

  async get(sql, params = []) {
    return await this.dbConnection.get(sql, params);
  }

  async run(sql, params = []) {
    return await this.dbConnection.run(sql, params);
  }

  // 接続クローズ
  async close() {
    await this.dbConnection.close();
  }
}

// データベースインスタンス
const dbInstance = new Database();

// 初期化関数（Promise版）
async function initDatabase() {
  return dbInstance;
}

module.exports = dbInstance;
module.exports.initDatabase = initDatabase;
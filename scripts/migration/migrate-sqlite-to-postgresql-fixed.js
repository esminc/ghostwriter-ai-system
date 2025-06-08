const { Client } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

class SQLiteToPostgreSQLMigrator {
  constructor() {
    this.sqliteDb = null;
    this.pgClient = null;
  }

  async connect() {
    // SQLite接続
    this.sqliteDb = new sqlite3.Database('./src/database/ghostwriter.db');
    
    // PostgreSQL接続
    this.pgClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false }
    });
    await this.pgClient.connect();
  }

  async dropAndRecreatePostgreSQLTables() {
    const dropTables = `
      -- 既存テーブルを削除（外部キー制約のため逆順で削除）
      DROP TABLE IF EXISTS cache CASCADE;
      DROP TABLE IF EXISTS ghostwrite_history CASCADE;
      DROP TABLE IF EXISTS profiles CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      
      -- 関数・トリガーも削除
      DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
    `;

    const tableDefinitions = `
      -- ユーザーテーブル（PostgreSQL版・修正）
      CREATE TABLE users (
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
      );

      -- プロフィールテーブル（PostgreSQL版）
      CREATE TABLE profiles (
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
      );

      -- 代筆履歴テーブル（PostgreSQL版・修正：Slack User IDを直接保存）
      CREATE TABLE ghostwrite_history (
        id SERIAL PRIMARY KEY,
        target_user_id VARCHAR(50) NOT NULL,  -- Slack User ID (TEXT)
        requester_user_id VARCHAR(50) NOT NULL,  -- Slack User ID (TEXT)
        esa_post_id INTEGER,
        generated_content TEXT,
        input_actions TEXT,
        calendar_data JSONB,
        slack_data JSONB,
        quality_rating INTEGER,
        ai_analysis_used BOOLEAN DEFAULT FALSE,
        ai_generation_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- キャッシュテーブル（PostgreSQL版）
      CREATE TABLE cache (
        id SERIAL PRIMARY KEY,
        cache_key VARCHAR(255) UNIQUE,
        cache_value JSONB,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- updated_at自動更新のトリガー作成
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      -- インデックス作成（パフォーマンス向上）
      CREATE INDEX idx_users_slack_user_id ON users(slack_user_id);
      CREATE INDEX idx_profiles_user_id ON profiles(user_id);
      CREATE INDEX idx_ghostwrite_history_target_user_id ON ghostwrite_history(target_user_id);
      CREATE INDEX idx_ghostwrite_history_requester_user_id ON ghostwrite_history(requester_user_id);
      CREATE INDEX idx_cache_key ON cache(cache_key);
    `;

    // テーブル削除・作成実行
    try {
      console.log('🗑️  既存テーブルを削除中...');
      await this.pgClient.query(dropTables);
      
      console.log('🏗️  PostgreSQLテーブルを再作成中...');
      await this.pgClient.query(tableDefinitions);
      console.log('✅ PostgreSQLテーブル再作成完了');
    } catch (error) {
      console.error('❌ テーブル再作成エラー:', error);
      throw error;
    }
  }

  async migrateData() {
    const tables = ['users', 'profiles', 'ghostwrite_history', 'cache'];
    
    for (const table of tables) {
      await this.migrateTable(table);
    }
  }

  async migrateTable(tableName) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
        if (err) {
          console.log(`⚠️  テーブル ${tableName} が存在しないか、読み取りエラー`);
          resolve();
          return;
        }

        if (rows.length === 0) {
          console.log(`ℹ️  テーブル ${tableName}: データなし`);
          resolve();
          return;
        }

        // カラム名取得（idを除く）
        const columns = Object.keys(rows[0]).filter(col => col !== 'id');
        
        // INSERT文作成
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

        console.log(`📝 ${tableName} テーブル移行開始...`);
        let successCount = 0;
        let errorCount = 0;

        // データ変換・挿入
        for (const row of rows) {
          const values = columns.map(col => {
            let value = row[col];
            
            // JSON文字列をJSONBに変換（PostgreSQL対応）
            if (['writing_style', 'interests', 'behavior_patterns', 'calendar_data', 'slack_data', 'cache_value'].includes(col) && typeof value === 'string') {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // JSONパースエラーの場合はnullに
                value = null;
              }
            }
            
            // 空文字列をnullに変換（PostgreSQLの型制約対応）
            if (value === '') {
              value = null;
            }
            
            return value;
          });

          try {
            await this.pgClient.query(insertSQL, values);
            successCount++;
          } catch (error) {
            errorCount++;
            if (errorCount <= 3) { // 最初の3件のエラーのみ表示
              console.error(`❌ ${tableName} データ挿入エラー:`, error.message);
              console.error('問題のデータ:', JSON.stringify(row, null, 2));
            }
          }
        }

        console.log(`✅ テーブル ${tableName}: ${successCount}件成功, ${errorCount}件失敗 (総件数: ${rows.length})`);
        resolve();
      });
    });
  }

  async verifyMigration() {
    const tables = ['users', 'profiles', 'ghostwrite_history', 'cache'];
    
    console.log('\n📊 移行結果検証:');
    
    for (const table of tables) {
      const pgResult = await this.pgClient.query(`SELECT COUNT(*) as count FROM ${table}`);
      const pgCount = parseInt(pgResult.rows[0].count);
      
      const sqliteCount = await new Promise((resolve) => {
        this.sqliteDb.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
          resolve(err ? 0 : row.count);
        });
      });
      
      const status = pgCount === sqliteCount ? '✅' : '⚠️';
      console.log(`${status} ${table}: SQLite(${sqliteCount}) → PostgreSQL(${pgCount})`);
    }
  }

  async testConnection() {
    try {
      const result = await this.pgClient.query('SELECT version()');
      console.log('✅ PostgreSQL接続成功');
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL接続エラー:', error.message);
      return false;
    }
  }

  async run() {
    try {
      console.log('🚀 SQLite → PostgreSQL 移行開始（修正版）');
      
      await this.connect();
      console.log('✅ データベース接続完了');
      
      // 接続テスト
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        throw new Error('PostgreSQL接続に失敗しました');
      }
      
      await this.dropAndRecreatePostgreSQLTables();
      await this.migrateData();
      await this.verifyMigration();
      
      console.log('🎉 移行完了！');
      console.log('📝 次のステップ: アプリケーションの接続設定をPostgreSQLに変更してテストしてください');
      
    } catch (error) {
      console.error('❌ 移行エラー:', error);
    } finally {
      if (this.sqliteDb) this.sqliteDb.close();
      if (this.pgClient) await this.pgClient.end();
    }
  }
}

// 実行
if (require.main === module) {
  // 環境変数読み込み
  require('dotenv').config({ path: '.env.render' });
  
  const migrator = new SQLiteToPostgreSQLMigrator();
  migrator.run();
}

module.exports = SQLiteToPostgreSQLMigrator;
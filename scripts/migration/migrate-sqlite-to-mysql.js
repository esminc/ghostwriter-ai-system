const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const fs = require('fs');

class SQLiteToMySQLMigrator {
  constructor() {
    this.sqliteDb = null;
    this.mysqlConnection = null;
  }

  async connect() {
    // SQLite接続
    this.sqliteDb = new sqlite3.Database('./src/database/ghostwriter.db');
    
    // MySQL接続（環境変数から）
    this.mysqlConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: true }
    });
  }

  async createMySQLTables() {
    const tableDefinitions = `
      -- ユーザーテーブル（MySQL版）
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slack_user_id VARCHAR(50) UNIQUE NOT NULL,
        slack_username VARCHAR(100),
        google_user_id VARCHAR(100),
        google_email VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        token_expiry TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

      -- プロフィールテーブル（MySQL版）
      CREATE TABLE IF NOT EXISTS profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        screen_name VARCHAR(100),
        writing_style JSON,
        interests JSON,
        behavior_patterns JSON,
        last_analyzed TIMESTAMP NULL,
        article_count INT DEFAULT 0,
        ai_analysis_used BOOLEAN DEFAULT FALSE,
        analysis_quality INT DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );

      -- 代筆履歴テーブル（MySQL版）
      CREATE TABLE IF NOT EXISTS ghostwrite_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_user_id INT,
        requester_user_id INT,
        esa_post_id INT,
        generated_content TEXT,
        input_actions TEXT,
        calendar_data JSON,
        slack_data JSON,
        quality_rating INT,
        ai_analysis_used BOOLEAN DEFAULT FALSE,
        ai_generation_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (target_user_id) REFERENCES users (id),
        FOREIGN KEY (requester_user_id) REFERENCES users (id)
      );

      -- キャッシュテーブル（MySQL版）
      CREATE TABLE IF NOT EXISTS cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cache_key VARCHAR(255) UNIQUE,
        cache_value JSON,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // テーブル作成実行
    const statements = tableDefinitions.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        await this.mysqlConnection.execute(statement.trim());
      }
    }
    
    console.log('✅ MySQLテーブル作成完了');
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

        // カラム名取得
        const columns = Object.keys(rows[0]).filter(col => col !== 'id');
        
        // INSERT文作成
        const placeholders = columns.map(() => '?').join(', ');
        const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

        // データ変換・挿入
        for (const row of rows) {
          const values = columns.map(col => {
            let value = row[col];
            
            // JSON文字列をJSONに変換（MySQL JSON型対応）
            if (['writing_style', 'interests', 'behavior_patterns', 'calendar_data', 'slack_data', 'cache_value'].includes(col) && typeof value === 'string') {
              try {
                value = JSON.parse(value);
              } catch (e) {
                // JSONパースエラーの場合はそのまま
              }
            }
            
            return value;
          });

          try {
            await this.mysqlConnection.execute(insertSQL, values);
          } catch (error) {
            console.error(`❌ ${tableName} データ挿入エラー:`, error.message);
          }
        }

        console.log(`✅ テーブル ${tableName}: ${rows.length}件のデータ移行完了`);
        resolve();
      });
    });
  }

  async verifyMigration() {
    const tables = ['users', 'profiles', 'ghostwrite_history', 'cache'];
    
    console.log('\n📊 移行結果検証:');
    
    for (const table of tables) {
      const [mysqlRows] = await this.mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const mysqlCount = mysqlRows[0].count;
      
      const sqliteCount = await new Promise((resolve) => {
        this.sqliteDb.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
          resolve(err ? 0 : row.count);
        });
      });
      
      const status = mysqlCount === sqliteCount ? '✅' : '❌';
      console.log(`${status} ${table}: SQLite(${sqliteCount}) → MySQL(${mysqlCount})`);
    }
  }

  async run() {
    try {
      console.log('🚀 SQLite → MySQL 移行開始');
      
      await this.connect();
      console.log('✅ データベース接続完了');
      
      await this.createMySQLTables();
      await this.migrateData();
      await this.verifyMigration();
      
      console.log('🎉 移行完了！');
      
    } catch (error) {
      console.error('❌ 移行エラー:', error);
    } finally {
      if (this.sqliteDb) this.sqliteDb.close();
      if (this.mysqlConnection) await this.mysqlConnection.end();
    }
  }
}

// 実行
if (require.main === module) {
  const migrator = new SQLiteToMySQLMigrator();
  migrator.run();
}

module.exports = SQLiteToMySQLMigrator;
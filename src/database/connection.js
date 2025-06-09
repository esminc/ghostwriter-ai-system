const { Client, Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.dbType = process.env.DB_TYPE || 'sqlite';
  }

  async connect() {
    if (this.dbType === 'postgresql') {
      // PostgreSQL接続（Connection Pool使用）
      this.connection = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
        max: 20, // 最大接続数
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      
      // 接続テスト
      const client = await this.connection.connect();
      console.log('✅ PostgreSQL接続完了');
      client.release();
      
    } else {
      // SQLite (フォールバック)
      this.connection = new sqlite3.Database('./src/database/ghostwriter.db');
      console.log('✅ SQLite接続完了');
    }
    
    return this.connection;
  }

  async query(sql, params = []) {
    if (this.dbType === 'postgresql') {
      const result = await this.connection.query(sql, params);
      return result.rows;
    } else {
      // SQLite Promise wrapper
      return new Promise((resolve, reject) => {
        this.connection.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  }

  async get(sql, params = []) {
    if (this.dbType === 'postgresql') {
      const result = await this.connection.query(sql, params);
      return result.rows[0] || null;
    } else {
      // SQLite Promise wrapper
      return new Promise((resolve, reject) => {
        this.connection.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    }
  }

  async run(sql, params = []) {
    if (this.dbType === 'postgresql') {
      const result = await this.connection.query(sql, params);
      return {
        lastID: result.rows[0]?.id, // RETURNINGが必要な場合
        changes: result.rowCount
      };
    } else {
      // SQLite Promise wrapper
      return new Promise((resolve, reject) => {
        this.connection.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        });
      });
    }
  }

  async close() {
    if (this.connection) {
      if (this.dbType === 'postgresql') {
        await this.connection.end();
      } else {
        this.connection.close();
      }
    }
  }
}

module.exports = DatabaseConnection;
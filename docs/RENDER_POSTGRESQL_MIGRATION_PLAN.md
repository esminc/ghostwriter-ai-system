# 🗄️ Render PostgreSQL 移行実行計画

**移行先**: Render PostgreSQL (Asia Tokyo)
**実行期間**: 1-2日
**戦略**: ローカル検証 → Renderデプロイ（安全な2段階アプローチ）

## 🎯 移行戦略：安全な2段階アプローチ

### **Phase 1: ローカル環境でRender PostgreSQLに接続・検証**
1. **Render PostgreSQL作成** → DATABASE_URL取得
2. **ローカルから接続・動作確認** → 全機能テスト完了
3. **コード確定** → 動作保証されたコードベース完成

### **Phase 2: Renderデプロイ**
4. **環境変数設定のみ** → 既に検証済みコードをデプロイ
5. **本番稼働開始** → 即座に稼働

## 📋 Phase 1 詳細手順

### **1. Render PostgreSQL作成**

```bash
# Renderダッシュボードで実行
1. https://render.com → Dashboard
2. "New" → "PostgreSQL"
3. 設定：
   - Database Name: ghostwriter-db
   - User: ghostwriter_user  
   - Region: Asia (Tokyo)
   - Plan: Free (90日間、その後$7/月)
4. 作成完了後、"External Database URL" をコピー
   例: postgresql://ghostwriter_user:password@region-postgres.render.com/ghostwriter_db
```

### **2. ローカル環境での接続設定**

#### 環境変数設定 (`.env.render`)
```env
# Render PostgreSQL Connection
NODE_ENV=development
DB_TYPE=postgresql
DATABASE_URL=postgresql://ghostwriter_user:password@region-postgres.render.com/ghostwriter_db

# Slack Configuration  
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret

# ESA Configuration
ESA_TEAM_NAME=esminc-its
ESA_ACCESS_TOKEN=your-esa-token
```

#### PostgreSQL ライブラリインストール
```bash
# PostgreSQL接続ライブラリ追加
npm install pg

# 型定義（TypeScript使用時）
npm install @types/pg --save-dev
```

### **3. SQLite → PostgreSQL 移行スクリプト**

#### `migrate-sqlite-to-postgresql.js`
```javascript
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
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    await this.pgClient.connect();
  }

  async createPostgreSQLTables() {
    const tableDefinitions = `
      -- ユーザーテーブル（PostgreSQL版）
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
      );

      -- プロフィールテーブル（PostgreSQL版）
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
      );

      -- 代筆履歴テーブル（PostgreSQL版）
      CREATE TABLE IF NOT EXISTS ghostwrite_history (
        id SERIAL PRIMARY KEY,
        target_user_id INTEGER REFERENCES users(id),
        requester_user_id INTEGER REFERENCES users(id),
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
      CREATE TABLE IF NOT EXISTS cache (
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
    `;

    // テーブル作成実行
    try {
      await this.pgClient.query(tableDefinitions);
      console.log('✅ PostgreSQLテーブル作成完了');
    } catch (error) {
      console.error('❌ テーブル作成エラー:', error);
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
          } catch (error) {
            console.error(`❌ ${tableName} データ挿入エラー:`, error.message);
            console.error('問題のデータ:', row);
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
      const pgResult = await this.pgClient.query(`SELECT COUNT(*) as count FROM ${table}`);
      const pgCount = parseInt(pgResult.rows[0].count);
      
      const sqliteCount = await new Promise((resolve) => {
        this.sqliteDb.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
          resolve(err ? 0 : row.count);
        });
      });
      
      const status = pgCount === sqliteCount ? '✅' : '❌';
      console.log(`${status} ${table}: SQLite(${sqliteCount}) → PostgreSQL(${pgCount})`);
    }
  }

  async testConnection() {
    try {
      const result = await this.pgClient.query('SELECT version()');
      console.log('✅ PostgreSQL接続成功:', result.rows[0].version);
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL接続エラー:', error.message);
      return false;
    }
  }

  async run() {
    try {
      console.log('🚀 SQLite → PostgreSQL 移行開始');
      
      await this.connect();
      console.log('✅ データベース接続完了');
      
      // 接続テスト
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        throw new Error('PostgreSQL接続に失敗しました');
      }
      
      await this.createPostgreSQLTables();
      await this.migrateData();
      await this.verifyMigration();
      
      console.log('🎉 移行完了！');
      console.log('📝 次のステップ: 環境変数を設定してアプリケーションをテストしてください');
      
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
```

### **4. データベース接続抽象化（PostgreSQL対応版）**

#### `src/database/connection.js`
```javascript
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
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
```

### **5. 移行実行手順**

#### 事前準備
```bash
# 1. PostgreSQLライブラリインストール
npm install pg

# 2. 環境変数ファイル作成
cp .env .env.backup
echo "# Render PostgreSQL Configuration" > .env.render

# 3. Render DATABASE_URLを.env.renderに設定
# DATABASE_URL=postgresql://user:pass@host/dbname

# 4. 現在のSQLiteをバックアップ
cp src/database/ghostwriter.db src/database/ghostwriter_backup_$(date +%Y%m%d).db
```

#### 移行実行
```bash
# 1. 移行スクリプト実行
node migrate-sqlite-to-postgresql.js

# 2. 環境設定変更
export DB_TYPE=postgresql
# または .env.render を .env にコピー

# 3. アプリケーション起動テスト
npm start

# 4. 全機能動作確認
# - Slack認証機能
# - 自動マッピング機能（Phase 3モード）
# - プロフィール分析機能
# - AI代筆生成機能
# - 履歴保存機能
```

## 📋 Phase 2: Renderデプロイ手順

### **1. Renderサービス作成**

```bash
# Renderダッシュボードで実行
1. "New" → "Web Service"
2. GitHub リポジトリ選択
3. 設定：
   - Name: ghostwriter-app
   - Environment: Node
   - Build Command: npm install
   - Start Command: npm start
   - Region: Asia (Tokyo)
```

### **2. 環境変数設定**

```bash
# Render Web Service → Environment Variables
DATABASE_URL=postgresql://...  # 作成したPostgreSQLのURL
DB_TYPE=postgresql
NODE_ENV=production

SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
ESA_TEAM_NAME=esminc-its
ESA_ACCESS_TOKEN=...
```

### **3. デプロイ・動作確認**

```bash
# 自動デプロイ実行後
1. Render URLでアクセス確認
2. Slack Bot動作確認
3. 全機能テスト
```

## 🎯 成功指標

### **Phase 1完了条件**
- ✅ Render PostgreSQL接続成功
- ✅ 全データ移行完了（データ整合性100%）
- ✅ ローカルでの全機能動作確認完了
- ✅ レスポンス時間：3-4秒維持
- ✅ エラー率：0%維持

### **Phase 2完了条件**
- ✅ Renderデプロイ成功
- ✅ 本番環境での全機能動作確認
- ✅ Slack Bot正常稼働
- ✅ データ永続化完全実現

## 🚨 リスク評価と対策

### **低リスク（推奨実行理由）**
1. **段階的アプローチ**: ローカル検証 → デプロイの安全な2段階
2. **完全フォールバック**: SQLiteバックアップによる即座復旧
3. **小さなデータ量**: 236KB → 移行時間最短
4. **既存の自動化**: Phase 3モードによる設定不要

### **潜在的リスク**
1. **PostgreSQL固有の制約**: データ型、制約の違い
   - **対策**: ローカル検証での事前確認
2. **Render固有の制限**: 接続数、タイムアウト等
   - **対策**: Connection Pool設定、適切なエラーハンドリング

## 📈 移行後の効果

### **即座に得られる効果**
- ✅ **データ永続化**: デプロイ時のデータ消失リスク完全解消
- ✅ **統合環境**: Render内での一元管理
- ✅ **地理的優位性**: Asia (Tokyo) リージョンによる低レイテンシー
- ✅ **PostgreSQL機能**: JSONB、高度なクエリ機能

### **将来的な効果**
- ✅ **スケーラビリティ**: 高負荷対応、読み取りレプリカ等
- ✅ **運用効率**: バックアップ、監視の自動化
- ✅ **機能拡張**: PostgreSQL固有機能の活用

---

## 🎯 推奨アクション

### **即座実行推奨（今日から開始可能）**
1. **Render PostgreSQL作成** - 10分
2. **ローカル接続・移行実行** - 1時間
3. **全機能動作確認** - 1時間
4. **Renderデプロイ準備** - 30分

### **明日実行**
- Renderデプロイ・本番稼働開始

**🎊 結論**: 安全な2段階アプローチにより、リスク最小でRender PostgreSQL移行を実現。ローカル検証により確実な動作保証の上でデプロイ実行。

# 🗄️ GhostWriter データベース移行実行計画

**移行先**: PlanetScale (MySQL互換) 無料枠
**実行期間**: 1-2日
**目標**: SQLiteからクラウドDBへの完全移行によるデータ永続化実現

## 🎯 移行戦略：段階的アプローチ

### **Phase 1: PlanetScale無料枠移行**（推奨：即座実行）
- **期間**: 1-2日
- **リスク**: 低（無料、完全フォールバック可能）
- **効果**: データ永続化の完全実現

### **Phase 2: 本格運用体制**（1-2週間後）
- **期間**: 1週間  
- **内容**: バックアップ・監視・復旧体制の確立

### **Phase 3: スケールアップ**（必要時）
- **条件**: チーム50人以上 または 月間1億読み取り超過
- **選択肢**: PlanetScale Pro ($29/月) または AWS RDS

## 📋 Phase 1 移行手順書

### **1. PlanetScaleセットアップ**

#### アカウント作成・データベース作成
```bash
# 1. https://planetscale.com でアカウント作成
# 2. 新しいデータベース作成
#    - Database name: ghostwriter-prod
#    - Region: us-east-1 (最も安定)
# 3. main ブランチの接続情報取得
```

#### 接続情報の取得
```bash
# PlanetScale CLI インストール（オプション）
curl -fsSL https://github.com/planetscale/cli/releases/latest/download/pscale_linux_amd64.tar.gz | tar -xz
sudo mv pscale /usr/local/bin

# 接続文字列例
mysql://username:password@aws.connect.psdb.cloud/ghostwriter-prod?ssl={"rejectUnauthorized":true}
```

### **2. SQLite → MySQL 変換スクリプト**

#### 変換スクリプト作成 (`migrate-sqlite-to-mysql.js`)
```javascript
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
```

### **3. アプリケーション修正**

#### 環境変数設定 (`.env`)
```env
# Database Configuration
NODE_ENV=production
DB_TYPE=mysql
DB_HOST=aws.connect.psdb.cloud
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=ghostwriter-prod
DB_SSL=true

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret

# ESA Configuration
ESA_TEAM_NAME=esminc-its
ESA_ACCESS_TOKEN=your-esa-token
```

#### データベース接続の抽象化 (`src/database/connection.js`)
```javascript
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.dbType = process.env.DB_TYPE || 'sqlite';
  }

  async connect() {
    if (this.dbType === 'mysql') {
      this.connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false
      });
      console.log('✅ MySQL接続完了');
    } else {
      // SQLite (フォールバック)
      this.connection = new sqlite3.Database('./src/database/ghostwriter.db');
      console.log('✅ SQLite接続完了');
    }
    
    return this.connection;
  }

  async query(sql, params = []) {
    if (this.dbType === 'mysql') {
      const [rows] = await this.connection.execute(sql, params);
      return rows;
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

  async close() {
    if (this.connection) {
      if (this.dbType === 'mysql') {
        await this.connection.end();
      } else {
        this.connection.close();
      }
    }
  }
}

module.exports = DatabaseConnection;
```

### **4. 移行実行手順**

#### 事前準備
```bash
# 1. 現在のSQLiteデータベースをバックアップ
cp src/database/ghostwriter.db src/database/ghostwriter_backup_$(date +%Y%m%d).db

# 2. MySQL接続ライブラリインストール
npm install mysql2

# 3. 環境変数設定
cp .env.example .env
# .envファイルを編集して接続情報を設定
```

#### 移行実行
```bash
# 1. 移行スクリプト実行
node migrate-sqlite-to-mysql.js

# 2. アプリケーション設定変更
export DB_TYPE=mysql

# 3. アプリケーション起動テスト
npm start

# 4. 動作確認
# - Slack bot `/ghostwrite` コマンドテスト
# - プロフィール分析の動作確認
# - 履歴データの表示確認
```

### **5. 検証・ロールバック計画**

#### 検証項目
```bash
# データ整合性確認
node verify-migration.js

# 機能テスト
- [ ] Slack認証機能
- [ ] 自動マッピング機能（Phase 3モード）
- [ ] プロフィール分析機能
- [ ] AI代筆生成機能
- [ ] 履歴保存機能
```

#### ロールバック手順（緊急時）
```bash
# 1. 環境変数をSQLiteに戻す
export DB_TYPE=sqlite

# 2. アプリケーション再起動
npm restart

# 3. SQLiteデータが古い場合はバックアップから復元
cp src/database/ghostwriter_backup_YYYYMMDD.db src/database/ghostwriter.db
```

## 📊 Phase 2: 本格運用体制構築

### **バックアップ戦略**
```bash
# 日次バックアップスクリプト
#!/bin/bash
DATE=$(date +%Y%m%d)
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > backup_${DATE}.sql
aws s3 cp backup_${DATE}.sql s3://ghostwriter-backups/
```

### **監視・アラート設定**
```javascript
// ヘルスチェックAPI
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});
```

### **パフォーマンス最適化**
```sql
-- インデックス追加（必要に応じて）
CREATE INDEX idx_users_slack_user_id ON users(slack_user_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_history_target_user_id ON ghostwrite_history(target_user_id);
CREATE INDEX idx_cache_key ON cache(cache_key);
```

## 🎯 成功指標

### **Phase 1完了条件**
- ✅ PlanetScale接続成功
- ✅ 全データ移行完了（データ整合性100%）
- ✅ 主要機能の動作確認完了
- ✅ レスポンス時間：3-4秒維持
- ✅ エラー率：0%維持

### **Phase 2完了条件**
- ✅ 自動バックアップ体制確立
- ✅ 監視・アラート設定完了
- ✅ 障害対応手順書作成
- ✅ パフォーマンス最適化完了

## 🚨 リスク評価と対策

### **低リスク（移行実行推奨理由）**
1. **フォールバック可能**: SQLiteバックアップによる即座復旧
2. **無料サービス**: コスト負担なし
3. **データ量小**: 236KB → 移行時間最短
4. **高度な自動化**: 手動設定不要（Phase 3モード）

### **潜在的リスク**
1. **ネットワークレイテンシー**: ローカル vs クラウド接続
   - **対策**: 接続プール、キャッシュ活用
2. **API制限**: 無料枠の制限
   - **対策**: 使用量監視、段階的アップグレード計画
3. **サービス依存**: PlanetScale障害リスク
   - **対策**: 定期バックアップ、AWS RDS移行オプション

## 📈 移行後の効果予測

### **即座に得られる効果**
- ✅ **データ永続化**: デプロイ時のデータ消失リスク完全解消
- ✅ **スケーラビリティ**: チーム拡大への対応準備完了
- ✅ **運用安定性**: マネージドサービスによる可用性向上

### **将来的な効果**
- ✅ **本格運用準備**: エンタープライズレベルのシステム基盤
- ✅ **チーム拡張**: 50人以上のチームでも安定動作
- ✅ **機能拡張**: リアルタイム機能、高度な分析機能への発展

---

## 🎯 推奨アクション

### **即座実行推奨（今日から開始可能）**
1. **PlanetScaleアカウント作成** - 5分
2. **移行スクリプト準備** - 30分
3. **移行実行** - 1時間
4. **動作確認** - 30分

### **1週間以内**
- バックアップ体制構築
- 監視設定
- 運用手順書作成

**🎊 結論**: 現在の高品質システムを活かしながら、リスク最小で永続化を実現する最適な移行計画。Phase 3完全自動モードの恩恵により、移行後も手動作業一切不要で運用継続可能。

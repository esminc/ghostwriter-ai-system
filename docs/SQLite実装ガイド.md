# SQLite実装ガイド - 代筆さん機能

## 1. SQLite選択のメリット

### 学習・開発面
- **設定不要**: ファイル1つで完結、サーバー不要
- **軽量**: 数MBの小さなライブラリ
- **標準SQL**: 他のDBと同じSQL文が使える
- **可視化ツール**: DB Browser for SQLiteで中身を簡単確認
- **移行性**: 後でMySQL/PostgreSQLに移行しやすい

### 実装面
- **高速**: ローカルファイルなので応答が早い
- **シンプル**: 接続設定やクレデンシャル管理不要
- **デバッグ容易**: ファイルを直接開いて確認可能

## 2. 環境準備

### Node.js パッケージインストール
```bash
# 必要なパッケージ
npm init -y
npm install sqlite3          # SQLite driver
npm install @slack/bolt      # Slack Bot framework  
npm install googleapis       # Google API client
npm install crypto           # 暗号化（Node.js標準）

# 開発用ツール
npm install --save-dev nodemon  # 自動再起動
```

### ディレクトリ構成
```
ghostwriter/
├── package.json
├── app.js                   # メインアプリ
├── database/
│   ├── init.js             # DB初期化
│   ├── models/             # データモデル
│   │   ├── user.js
│   │   ├── profile.js
│   │   └── history.js
│   └── ghostwriter.db      # SQLiteファイル（自動生成）
├── services/
│   ├── slack-bot.js        # Slack Bot処理
│   ├── google-calendar.js  # カレンダー連携
│   ├── esa-api.js          # esa連携
│   └── ghostwriter.js      # 代筆処理
├── utils/
│   └── crypto.js           # 暗号化ユーティリティ
└── config/
    └── config.js           # 設定ファイル
```

## 3. データベース初期化

### database/init.js
```javascript
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (target_user_id) REFERENCES users (id),
          FOREIGN KEY (requester_user_id) REFERENCES users (id)
        )
      `);

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

module.exports = new Database();
```

### database/models/user.js
```javascript
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
}

module.exports = User;
```

## 4. 基本的な使用例

### app.js（メイン）
```javascript
const database = require('./database/init');
const User = require('./database/models/user');
const GhostwriteHistory = require('./database/models/history');

async function main() {
  try {
    // テストユーザー作成
    console.log('=== テストユーザー作成 ===');
    const user = await User.create({
      slack_user_id: 'U1234567',
      slack_username: 'okamoto-takuya'
    });
    console.log('作成されたユーザー:', user);

    // ユーザー検索テスト
    console.log('=== ユーザー検索テスト ===');
    const foundUser = await User.findBySlackId('U1234567');
    console.log('検索されたユーザー:', foundUser);

    // 代筆履歴作成テスト
    console.log('=== 代筆履歴作成テスト ===');
    const history = await GhostwriteHistory.create({
      target_user_id: foundUser.id,
      requester_user_id: foundUser.id,
      esa_post_id: 999,
      generated_content: 'テスト日記内容',
      input_actions: ['バグ修正', 'コードレビュー'],
      calendar_data: { meetings: 3, busyLevel: 'high' },
      slack_data: { posts: 5, techTopics: ['MCP', 'SQLite'] }
    });
    console.log('作成された履歴:', history);

    // 統計情報取得
    console.log('=== 統計情報 ===');
    const stats = await GhostwriteHistory.getStats(foundUser.id);
    console.log('統計:', stats);

  } catch (error) {
    console.error('エラー:', error);
  }
}

// 実行
main();
```

## 5. 開発・デバッグツール

### DB Browser for SQLiteのインストール
```bash
# macOS (Homebrew)
brew install --cask db-browser-for-sqlite

# Windows
# https://sqlitebrowser.org/ からダウンロード

# Ubuntu
sudo apt install sqlitebrowser
```

### 使い方
1. DB Browser for SQLite を起動
2. `Open Database` で `ghostwriter.db` を開く
3. テーブル構造・データを視覚的に確認
4. SQLクエリを直接実行して動作確認

### 便利なSQLクエリ例
```sql
-- 全ユーザー確認
SELECT * FROM users;

-- 最新の代筆履歴5件
SELECT 
  h.id,
  u.slack_username,
  h.generated_content,
  h.created_at
FROM ghostwrite_history h
JOIN users u ON h.target_user_id = u.id
ORDER BY h.created_at DESC
LIMIT 5;

-- ユーザー別代筆回数
SELECT 
  u.slack_username,
  COUNT(h.id) as 代筆回数,
  AVG(h.quality_rating) as 平均評価
FROM users u
LEFT JOIN ghostwrite_history h ON u.id = h.target_user_id
GROUP BY u.id, u.slack_username;
```

## 6. 実際の始め方

### Step 1: プロジェクト作成
```bash
mkdir ghostwriter
cd ghostwriter
npm init -y
npm install sqlite3
```

### Step 2: 基本ファイル作成
```bash
# ディレクトリ作成
mkdir -p database/models services utils config

# 上記のファイルを作成
touch app.js
touch database/init.js
touch database/models/user.js
touch database/models/history.js
```

### Step 3: データベース動作確認
```bash
# 実行
node app.js

# 結果確認
# - ghostwriter.db ファイルが作成される
# - テーブルが作成される
# - テストデータが挿入される
```

### Step 4: DB Browser で確認
1. DB Browser for SQLite を起動
2. `ghostwriter.db` を開く
3. テーブル・データを確認

## 7. 次のステップ

### 実装順序（推奨）
```
1. ✅ SQLite + 基本モデル （完了）
2. 🔄 esa API 連携テスト
3. 🔄 プロフィール分析の基本実装
4. 🔄 Slack Bot 基本機能
5. 🔄 Google Calendar 連携
```

### 学習ポイント
- SQLiteの基本操作
- Node.jsでのPromise処理
- モデルクラスの設計パターン
- JOINクエリの活用

## 8. トラブルシューティング

### よくあるエラー
```javascript
// エラー: SQLITE_BUSY
// 原因: 同時アクセス
// 対策: db.serialize() を使用

// エラー: no such table
// 原因: テーブル初期化前のアクセス
// 対策: init() 完了を待つ

// エラー: FOREIGN KEY constraint failed
// 原因: 存在しないIDへの外部キー参照
// 対策: データ存在確認
```

### デバッグのコツ
- `console.log` でSQL文を出力
- DB Browser for SQLite でデータ確認
- エラーメッセージを詳しく読む
- 小さな単位でテスト実行

これでSQLiteを使った基盤ができます！まずはこのコードを動かしてみて、データベースの操作に慣れてから次の機能（esa API連携など）に進むのがおすすめです。
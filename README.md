# GhostWriter AI代筆システム

Slack統合とMCP (Model Context Protocol) を活用したAI日記自動生成システムです。

## 概要

GhostWriterは、ユーザーのSlack活動とesa記事履歴を分析し、個人の文体を模倣した日記を自動生成するシステムです。OpenAI GPT-4o-miniを使用して、esaに投稿可能な形式のMarkdown日記を生成します。

## 主な機能

- **Slack統合**: 実際のSlackメッセージを取得・分析
- **esa記事分析**: 過去の投稿パターンと文体を学習
- **個人化された日記生成**: ユーザー固有の表現や関心事を反映
- **自動categorization**: 日付ベースのフォルダ構成 (`AI代筆日記/YYYY/MM/DD`)
- **関心事抽出**: Slackキーワード分析による具体的な関心事識別
- **品質メトリクス**: 生成品質とデータソースの透明性確保

## 技術構成

### アーキテクチャ

```
Slack Bot → MCP統合システム → AI代筆エンジン → esa投稿
    ↓            ↓                ↓
  Slackデータ   esa記事分析     個人化日記生成
```

### 技術スタック

- **Node.js**: サーバーサイド実行環境
- **OpenAI GPT-4o-mini**: テキスト生成AI
- **MCP (Model Context Protocol)**: esa/Slack連携
- **PostgreSQL**: データベース (SQLiteから移行済み)
- **Render**: 本番環境ホスティング

### 主要コンポーネント

- `LLMDiaryGeneratorPhase53Unified`: 核心的な日記生成エンジン
- `SlackMCPWrapperDirect`: Slack データ取得・分析
- `SlackKeywordExtractor`: 高度キーワード抽出・関心事分析
- `MCPConnectionManager`: esa/Slack MCP接続管理

## セットアップ

### 必要条件

- Node.js 18以上
- PostgreSQL 13以上
- OpenAI APIキー
- Slack Bot Token
- esa APIアクセス

### インストール

```bash
# リポジトリクローン
git clone https://github.com/esminc/ghostwriter-ai-system.git
cd ghostwriter-ai-system

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
```

### 環境変数設定

`.env`ファイルに以下を設定：

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Slack
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_SIGNING_SECRET=your_signing_secret

# PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database

# esa (MCP経由で使用)
ESA_API_TOKEN=your_esa_api_token
ESA_TEAM=your_team_name
```

### 起動

```bash
# 開発環境
npm run dev

# 本番環境 (Render)
npm start
```

## 使用方法

### Slackでの使用

1. Slackワークスペースに招待されたBotがいることを確認
2. 任意のチャンネルで以下のコマンドを実行：

```
/ghostwrite
```

### 生成される日記の例

```markdown
## 2025/06/08日曜日の振り返り

**やったこと**
今日は一斉会議の案内を中心に取り組みました。また、ハッカソン参加報告にも注力し、Slackでは10件のメッセージでチームと連携を図りました。
特にミーティングとハッカソンについて活発な議論を行いました。

**TIL (Today I Learned)**
チームとのコミュニケーションを通じて、新しい視点や解決策を発見できました。
Slackでの高レベルの関与により、チームワークの価値を再認識しました。

**こんな気分**
前向きな気持ちで一日を過ごすことができました。
Slackでの活発なコミュニケーションにより、チームとの連携が非常にうまく行きました。
```

## データ処理

### Slack データ分析

- 複数チャンネルからのメッセージ収集
- キーワード分析 (技術・ビジネス・イベント・感情の4カテゴリ)
- 感情分析と生産性メトリクス計算
- チャンネル特性を考慮したコンテキスト分析

### esa記事分析

- 過去記事の検索・取得
- カテゴリとタイトルパターンの分析
- 文体特徴の抽出
- 投稿頻度と傾向の分析

### 関心事抽出

システムは以下の方法で関心事を抽出します：

- Slackトピック分析: 「ミーティング」→「ミーティング・会議」
- キーワード変換: 「AI」→「AI・機械学習」  
- 活動分析: 「ハッカソン参加」→「ハッカソン・イベント」
- esaカテゴリ分析: 過去記事のカテゴリパターン

## 品質管理

### 生成品質指標

- **文体再現度**: 4.5/5程度
- **関心事反映度**: 95%程度
- **具体性**: Slack実データに基づく具体的活動記録

### データソース情報

生成された日記には以下の情報が自動付与されます：

- 使用したesa記事数
- 分析したSlackメッセージ数
- データ取得方法
- 生成品質スコア
- 関心事抽出結果

## プロジェクト構造

```
├── src/
│   ├── mcp-integration/         # MCP統合システム
│   │   ├── llm-diary-generator-phase53-unified.js  # 核心エンジン
│   │   ├── slack-mcp-wrapper-direct.js             # Slack統合
│   │   ├── slack-keyword-extractor.js              # キーワード抽出
│   │   └── mcp-connection-manager.js               # MCP接続管理
│   ├── slack/                   # Slack Bot
│   ├── ai/                      # AI統合
│   └── database/                # データベース
├── docs/                        # ドキュメント
├── scripts/                     # 運用スクリプト
└── tests/                       # テスト
```

## 本番環境

### デプロイ

- **プラットフォーム**: Render
- **データベース**: PostgreSQL (Render Postgres)
- **環境**: Node.js 18
- **自動デプロイ**: GitHubプッシュ時

### 監視・ログ

- Renderダッシュボードでのログ監視
- PostgreSQL接続状況の確認
- Slack Bot動作状況の確認

## 開発情報

### データベース変更履歴

- 初期: SQLite (ローカル開発用)
- 現在: PostgreSQL (本番運用対応)
- 移行理由: Render環境での永続化とパフォーマンス向上

### アーキテクチャ変更

システムは段階的に改良されており、現在は以下の状態です：

- MCP統合によるesa/Slack連携
- 高度キーワード抽出システム
- 関心事の具体化 (日付情報から実際の技術・活動内容へ)
- 複数チャンネル対応のSlack分析

## API仕様

### 主要メソッド

#### `generateDiaryWithMCP(userName, options)`

日記生成のメインエントリーポイント

**パラメーター:**
- `userName`: esa/Slackでのユーザー識別子
- `options.slackUserId`: SlackユーザーID (推奨)

**戻り値:**
```javascript
{
  success: true,
  diary: {
    title: "【代筆】ユーザー名: タイトル",
    content: "マークダウン形式の日記本文",
    category: "AI代筆日記/2025/06/08"
  },
  metadata: {
    slack_data_source: "real_slack_mcp_multi_channel",
    generation_time: "2025-06-08T06:10:14.547Z"
  }
}
```

## トラブルシューティング

### よくある問題

1. **Slack統合エラー**
   - Slack Bot Tokenの確認
   - MCPサーバーの起動状況確認

2. **esa投稿エラー**  
   - esa API Tokenの有効性確認
   - MCP esa接続の確認

3. **PostgreSQL接続エラー**
   - DATABASE_URL の設定確認
   - Render Postgres サービス状況確認

### ログ確認

```bash
# ローカル開発時
npm run dev

# 本番環境 (Render)
# Renderダッシュボードのログ画面で確認
```

## コントリビューション

1. Issueの作成
2. Forkとブランチ作成
3. 変更の実装
4. テスト実行
5. Pull Request作成

## ライセンス

MIT License

---

**リポジトリ**: https://github.com/esminc/ghostwriter-ai-system  
**本番環境**: Render (esminc-its組織)  
**最終更新**: 2025-06-08

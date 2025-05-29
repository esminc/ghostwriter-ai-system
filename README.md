# 代筆さん (GhostWriter for esa Diary) - AI統合版

ESM ITSチームメンバーの日記投稿負担を軽減し、継続的な日記文化を維持するAI統合システム

## 🚀 現在の実装状況

### ✅ Phase 1: AI統合基盤（100%完了）

- **🤖 OpenAI API統合**: GPT-4による真の文体分析・日記生成
- **🧠 AI統合プロフィール分析**: LLMによる深い文体理解
- **✍️ AI統合日記生成**: 自然で個性的な日記作成
- **🛡️ フォールバック機能**: API未設定でも従来方式で動作
- **📊 品質管理システム**: AI生成内容の品質チェック
- **🗄️ SQLiteデータベース**: 完全な履歴・統計管理
- **🔗 esa API連携**: 実投稿機能完備
- **✅ 実動作確認済み**: 投稿テスト成功

### ✅ Phase 2: Slack Bot統合（100%完了）

- **🤖 Slack Bot実装**: Slack Bolt frameworkによる本格Bot
- **💬 対話的UI**: `/ghostwrite`コマンド・ボタン操作
- **🔄 リアルタイム連携**: Phase 1システムとの完全統合
- **📱 ユーザーフレンドリー**: 直感的なSlackインターフェース
- **🚀 esa自動投稿**: Slackから直接esa投稿機能
- **📊 履歴管理**: Slack内での代筆履歴確認
- **⚙️ チーム展開準備**: エンタープライズレベルでの運用準備完了

### 🔄 次のステップ
- チーム内βテスト・本格運用開始
- Google Calendar連携（予定取得）
- MCP Server実装（Claude Desktop連携）

## 📁 プロジェクト構成

```
GhostWriter/
├── src/
│   ├── ai/                     # AI統合機能
│   │   └── openai-client.js    # OpenAI API統合クライアント
│   ├── slack/                  # Slack Bot機能 (Phase 2)
│   │   └── app.js              # Slack Botメインアプリ
│   ├── database/               # SQLiteデータベース
│   │   ├── init.js             # DB初期化
│   │   ├── ghostwriter.db      # SQLiteファイル（自動生成）
│   │   └── models/             # データモデル
│   │       ├── user.js         # ユーザーモデル
│   │       ├── profile.js      # プロフィールモデル
│   │       └── history.js      # 代筆履歴モデル
│   ├── services/               # ビジネスロジック
│   │   ├── esa-api.js          # esa API連携
│   │   ├── ai-profile-analyzer.js    # AI統合プロフィール分析
│   │   ├── ai-diary-generator.js     # AI統合日記生成
│   │   ├── profile-analyzer.js       # 従来プロフィール分析（フォールバック）
│   │   └── diary-generator.js        # 従来日記生成（フォールバック）
│   ├── utils/                  # ユーティリティ
│   ├── index.js               # 統合テスト
│   ├── slack-bot.js           # Slack Bot起動スクリプト
│   ├── test-esa-api.js        # esa APIテスト
│   ├── test-real-post.js      # 実投稿テスト
│   ├── test-ai-integration.js # AI統合テスト
│   └── test-slack-bot.js      # Slack Botテスト
├── docs/                      # 設計ドキュメント
│   └── SLACK_BOT_SETUP.md     # Slack Bot設定ガイド
├── package.json
├── .env                      # 環境設定
└── README.md
```

## 🏃‍♂️ 実行方法

### 1. 環境準備

```bash
# パッケージインストール
npm install

# 環境設定（既に設定済みの場合はスキップ）
cp .env.example .env
# .envファイルを編集してAPIトークンを設定
```

### 2. 🤖 Phase 2: Slack Bot起動（推奨）

```bash
# Slack Bot統合テスト
npm run test:slack

# Slack Bot起動
npm run slack

# 開発モード（自動再起動）
npm run slack:dev
```

**Slack使用方法:**
- `/ghostwrite` - AI代筆生成
- `/ghostwrite help` - ヘルプ表示
- `@GhostWriter` - メンション操作

### 3. 🤖 Phase 1: AI統合システムテスト

```bash
# AI統合系統全体テスト
npm run test:ai
```

このテストで以下が確認されます：
- OpenAI API接続状態（設定されていない場合はフォールバック動作）
- AI統合プロフィール分析
- AI統合日記生成
- 実際のesa投稿
- システム統計情報

### 3. 個別機能テスト

```bash
# 基本機能テスト
npm test              # 基本機能
npm run test:esa      # esa API
npm run test:post     # 実投稿
npm run test:slack    # Slack Bot統合
```

### 4. データベース確認

[DB Browser for SQLite](https://sqlitebrowser.org/)をインストールして、`src/database/ghostwriter.db`を開いて確認できます。

## 🎯 主要機能

### 🤖 AI統合プロフィール分析
- **LLM活用**: OpenAI GPT-4による深い文体分析
- **ハイブリッド分析**: AI分析＋従来分析の統合
- **フォールバック**: API未設定でも従来方式で動作
- **品質管理**: 分析品質の自動評価

### ✍️ AI統合日記生成
- **自然な文体再現**: プロンプトエンジニアリングによる個性的な文章
- **品質チェック**: 生成内容の自動品質評価
- **複数生成方式**: AI生成＋従来生成の統合
- **安全性**: フォールバック機能で確実に動作

### 🗄️ データ管理
- **SQLiteベース**: 軽量で高速なデータ管理
- **完全履歴**: 代筆履歴・統計情報の保存
- **AI使用状況**: AI機能の使用状況追跡
- **プロフィールキャッシュ**: 効率的な分析結果保存

## 🔧 開発情報

### 技術スタック
- **AI統合**: OpenAI GPT-4 API
- **データベース**: SQLite3
- **バックエンド**: Node.js
- **外部API**: esa API, Google Calendar API（Phase 2）
- **将来**: Slack Bot API, MCP Server

### AI統合の特徴
- **真の文体分析**: ルールベースではなくLLMによる理解
- **自然な生成**: テンプレートではなく文脈理解による生成
- **フォールバック安全性**: API問題時も確実に動作
- **品質保証**: 生成内容の自動品質チェック
- **ハイブリッド**: AI＋従来手法の最適な組み合わせ

### 設計思想
- **段階的AI統合**: 従来機能を残しつつAI機能を追加
- **フォールバック優先**: 確実な動作を最優先
- **品質重視**: 生成内容の品質管理
- **個人の文体尊重**: 真の代筆システム

## 📋 実装計画

### ✅ Phase 1: AI統合基盤（完了 100%）
- [x] OpenAI API統合
- [x] AI統合プロフィール分析
- [x] AI統合日記生成
- [x] フォールバック機能
- [x] 品質管理システム
- [x] 実投稿テスト成功
- [x] 統計・履歴管理

### ✅ Phase 2: Slack Bot展開（完了 100%）
- [x] Slack Bot基本機能
- [x] 対話的UI実装
- [x] リアルタイム連携
- [x] esa自動投稿機能
- [x] 履歴管理機能
- [x] チーム展開準備完了

### 🔄 次のステップ
- [ ] チーム内βテスト
- [ ] Google Calendar連携
- [ ] MCP Server実装
- [ ] 本格運用開始

## 🤖 Slack Bot設定

### Slack Bot設定

1. `.env`ファイルの`SLACK_BOT_TOKEN`と`SLACK_SIGNING_SECRET`を設定
2. 設定後、`npm run test:slack`で動作確認
3. `npm run slack`でSlack Bot起動

```env
# .envファイル
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
SLACK_SIGNING_SECRET=your-slack-signing-secret-here
```

**詳細な設定手順**: `docs/SLACK_BOT_SETUP.md`を参照

### Slack Botの動作

- **設定済み**: Slackで`/ghostwrite`コマンドが使用可能
- **未設定**: Demo ModeでPhase 1機能をテスト実行
- **エラー時**: 自動的にDemo Modeに切り替え

## 📊 システム統計

`npm run test:ai`または`npm run test:slack`実行時に以下の統計情報を確認できます：
- 登録ユーザー数
- プロフィール分析数
- 代筆履歴数
- AI機能使用率
- 品質スコア統計
- Slack Bot使用状況

## 🤝 開発チーム

ESM ITS Team

---

## 🎊 Phase 1完成記念

**代筆さんシステム Phase 1（AI統合版）が完成しました！**

- 🤖 真のAI統合による自然な代筆
- 🛡️ 確実に動作するフォールバック機能  
- 📊 完全な品質管理・統計システム
- 🚀 Phase 2（Slack Bot）への準備完了

**次のステップ**: `npm run test:ai`でAI統合システムをテストしてみてください！

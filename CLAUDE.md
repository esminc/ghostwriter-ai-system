# CLAUDE.md

このファイルはClaude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## よく使用するコマンド

### 開発・テスト用コマンド

```bash
# メイン開発コマンド
npm run dev                    # nodemonでMCPシステムを起動（デフォルト開発環境）
npm run slack                  # Slackボットのみ起動
npm run slack:dev             # nodemonでSlackボット起動
npm start                     # 本番環境でMCPシステム起動

# テスト用コマンド
npm test                      # メインテスト実行（src/index.js）
npm run test:slack            # Slackボット機能テスト
npm run test:ai               # AI統合テスト
npm run test:post             # 実際のesa投稿テスト
npm run test:mapping          # ユーザーマッピングテスト
npm run mcp:test              # MCPシステム統合テスト

# データベース操作
npm run reset:db              # データベースリセット
npm run test:db               # データベース接続テスト

# 品質保証
npm run lint                  # ESLint実行
npm run lint:fix              # ESLint自動修正
```

### 本番環境用コマンド

```bash
# メイン本番エントリーポイント
node src/mcp-integration/llm-diary-generator-phase53-unified.js  # コアAI日記生成器
node src/slack-bot.js                                           # Slackボット起動
node src/index.js                                              # データベーステスト
```

## プロジェクトアーキテクチャ

### コアシステム概要

GhostWriterは、ユーザーのSlack活動とesa記事を分析して個人化された日記エントリを生成するAI搭載Slackボットです。シームレスなデータ統合にはMCP（Model Context Protocol）を使用し、AI生成にはOpenAI GPT-4o-miniを使用しています。

### 主要アーキテクチャコンポーネント

#### 1. **エントリーポイント**

- `src/slack-bot.js` - 環境検証付きSlackボット起動
- `src/mcp-integration/llm-diary-generator-phase53-unified.js` - コアAI日記生成器（Phase 6.6+）
- `src/index.js` - データベーステスト用メインアプリケーション

#### 2. **MCP統合レイヤー**（`src/mcp-integration/`）

- `mcp-connection-manager.js` - MCPプロトコル接続管理
- `slack-keyword-extractor.js` - 高度なSlackデータ分析（Phase 6）
- `slack-mcp-wrapper-direct.js` - 直接Slack API統合

#### 3. **データベースレイヤー**（`src/database/`）

- デュアルデータベースサポート: PostgreSQL（本番）/ SQLite（開発）
- `init.js` - データベース接続とテーブル初期化
- `models/` - ユーザー、プロフィール、履歴モデル

#### 4. **AIサービス**（`src/services/`）

- `ai-diary-generator.js` - コア日記生成ロジック
- `mcp-profile-analyzer.js` - ユーザープロフィール分析
- `migration-manager.js` - データ移行ユーティリティ

#### 5. **Slack統合**（`src/slack/`）

- `app.js` - Slack Boltフレームワーク設定

### データフロー

1. **Slackデータ収集** → マルチチャンネルメッセージ分析（8チャンネル）
2. **esa記事分析** → 過去の文章パターン抽出（27キーワード、2700%改善）
3. **プロフィール構築** → ユーザー固有の文体モデリング
4. **AI生成** → GPT-4o-mini（temperature=0.8）で50:50 esa/Slackバランス
5. **品質保証** → クロス汚染防止と品質スコアリング
6. **esa投稿** → カテゴリ分類による自動投稿

## 環境設定

### 必須環境変数

```bash
# コア統合
ESA_ACCESS_TOKEN       # esa API認証
ESA_TEAM_NAME          # esaチーム識別子
OPENAI_API_KEY         # OpenAI GPT統合
SLACK_BOT_TOKEN        # Slackボット認証
SLACK_SIGNING_SECRET   # Slackセキュリティ検証

# データベース（本番）
DATABASE_URL           # PostgreSQL接続文字列
DB_TYPE=postgresql     # データベースタイプ選択

# オプション統合
GOOGLE_CLIENT_ID       # Googleカレンダー統合
```

### 環境ファイル

- `.env.example` - 開発用テンプレート
- `.env.render` - Renderプラットフォーム用本番設定
- `.env.local` - ローカル開発用オーバーライド

## 開発ワークフロー

### フェーズシステム

プロジェクトはフェーズベースの開発アプローチを使用しています。現在の状態は**Phase 6.6+**（メンテナンスモード）です。

### 主要機能（Phase 6.6+）

- **クロス汚染防止**: ユーザー固有のコンテンツ分離
- **高度キーワード抽出**: 27キーワード vs 従来の1（2700%改善）
- **50:50データバランス**: esa記事 + Slackデータの最適統合
- **品質メトリクス**: 透明な生成品質スコアリング
- **日常体験優先**: etc-spotsと人間的体験への注力

### データベース考慮事項

- 開発ではSQLiteを使用（`src/database/ghostwriter.db`）
- 本番ではRenderプラットフォーム上のPostgreSQLを使用
- データベースモデルは`DB_TYPE`環境変数により両システムをサポート
- 移行ユーティリティは`src/services/migration-manager.js`で利用可能

### AI生成パイプライン

1. **データソース**: Slack（8チャンネル）+ esa（過去記事）
2. **キーワード抽出**: 4カテゴリ分析（日常体験、技術、ビジネス、感情）
3. **プロフィール分析**: ユーザー固有文体モデリング
4. **AI生成**: 創造性のためのGPT-4o-mini temperature=0.8
5. **品質スコアリング**: 汚染防止付き5段階評価
6. **フッター生成**: 透明性メトリクス付き動的メタデータ

## テスト戦略

### テストカテゴリ

- **統合テスト**（`tests/integration/`）- フルシステムテスト
- **単体テスト**（`tests/unit/`）- コンポーネント固有テスト
- **フェーズテスト**（`tests/phase-tests/`）- フェーズ固有検証

### 主要テストファイル

- `tests/integration/slack-mcp-integration.js` - Slack MCP統合テスト
- `tests/test-phase53-complete.js` - Phase 53完了検証
- `scripts/test-contamination-fix.js` - クロス汚染防止テスト

## プロジェクト構造ガイドライン

### ドキュメント構成

- `docs/` - 技術仕様とガイド
- `docs/handovers/` - 日付組織化されたプロジェクト引き継ぎドキュメント
- `docs/chat-history/` - 開発会話ログ
- `archive/` - レガシーコードと過去ドキュメント

### コード構成

- 関心事の明確な分離によるモジュラーアーキテクチャ
- 外部API管理のためのMCP統合レイヤー
- 複数データベースタイプをサポートするデータベース抽象化
- 包括的なエラーハンドリングとログ記録

### デプロイメント

- **プラットフォーム**: Render（esminc-its組織）
- **データベース**: Render PostgreSQL
- **ヘルスチェック**: 自動監視システム
- **CI/CD**: `scripts/`ディレクトリ内のスクリプトベースデプロイメント
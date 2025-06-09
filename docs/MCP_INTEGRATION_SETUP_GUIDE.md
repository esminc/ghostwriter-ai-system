# Slack MCP統合 環境設定ガイド

## 📋 環境設定確認結果

### ✅ 既存設定状況
- **基本設定完了率**: 100% (7/7)
- **ESA_ACCESS_TOKEN**: 設定済み
- **ESA_TEAM_NAME**: 設定済み  
- **OPENAI_API_KEY**: 設定済み
- **SLACK_BOT_TOKEN**: 設定済み
- **SLACK_SIGNING_SECRET**: 設定済み

### ⚠️ 追加設定が必要な項目
- **MCP統合設定完了率**: 0% (0/3)
- **SLACK_MCP_ENABLED**: 未設定
- **SLACK_USER_ID_OKAMOTO_TAKUYA**: 未設定  
- **SLACK_USER_ID_ESA_BOT**: 未設定

### 📈 全体設定完了率: 70% (7/10)

## 🚀 設定完了手順

### 1️⃣ Slack User IDの取得

#### 方法A: Slack Web API
```bash
curl -H "Authorization: Bearer xoxb-3963306992470-8967097222849-RJRSd58HxoGXyav669I4EDLU" \
     "https://slack.com/api/users.list" | jq '.members[] | select(.name=="okamoto.takuya") | .id'
```

#### 方法B: ブラウザ版Slack
1. ブラウザでSlackワークスペースにアクセス
2. @okamoto-takuya のプロフィールをクリック
3. プロフィール画面の「その他」→「メンバーIDをコピー」

#### 方法C: Slackアプリ
1. Slackアプリで @okamoto-takuya をメンション
2. プロフィールを表示
3. 「メンバーIDをコピー」

### 2️⃣ 環境変数の追加

`.env`ファイルに以下を追加:

```bash
# 真のSlack MCP統合版用設定
SLACK_MCP_ENABLED=true
SLACK_USER_ID_OKAMOTO_TAKUYA=U[取得したID]
SLACK_USER_ID_ESA_BOT=U[取得したID]
```

または、`.env.mcp-integration`ファイルの内容を`.env`にマージ:

```bash
cat .env.mcp-integration >> .env
```

### 3️⃣ Claude Desktop MCP設定

#### 設定ファイル配置
```bash
# macOS
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Linux  
cp claude_desktop_config.json ~/.config/claude-desktop/claude_desktop_config.json
```

#### MCPサーバーのインストール
```bash
# esa MCP Server
npm install -g @modelcontextprotocol/server-esa

# Slack MCP Server (要確認)
npm install -g @modelcontextprotocol/server-slack
```

### 4️⃣ 設定確認

#### 環境変数確認
```bash
node -e "console.log('Slack MCP:', process.env.SLACK_MCP_ENABLED)"
node -e "console.log('User ID:', process.env.SLACK_USER_ID_OKAMOTO_TAKUYA)"
```

#### システムテスト実行
```bash
npm restart
node src/mcp-integration/test-mcp-system.js
```

## 🎯 MCP統合チェックリスト

- [ ] Slack User IDの取得
- [ ] 環境変数の追加設定
- [ ] Claude Desktop アプリのインストール
- [ ] MCP設定ファイルの配置
- [ ] MCPサーバーのインストール
- [ ] Claude Desktop アプリの再起動
- [ ] MCP接続状況の確認
- [ ] システムテストの実行

## 🔧 トラブルシューティング

### MCPサーバーが見つからない場合
```bash
# パッケージ名の確認
npm search @modelcontextprotocol
npm search mcp-server
```

### 環境変数が反映されない場合
```bash
# プロセス再起動
npm restart

# 環境確認
printenv | grep SLACK
```

### Claude Desktop接続エラー
1. Claude Desktop アプリを完全終了
2. 設定ファイルの構文チェック
3. アプリを再起動
4. 接続ログの確認

## 📊 期待される結果

設定完了後は以下が利用可能になります:

### 📱 Slack MCP機能
- `slack_get_channel_history()` - チャンネル履歴取得
- `slack_get_user_profile()` - ユーザープロフィール取得  
- `slack_get_users()` - ユーザー一覧取得

### 📚 esa MCP機能  
- `search_esa_posts()` - 記事検索 ✅ 利用可能
- `read_esa_multiple_posts()` - 複数記事取得 ✅ 利用可能
- `create_esa_post()` - 記事投稿

### 🤖 統合システム
- 実際のSlackメッセージを活用した日記生成
- リアルタイムのSlack活動分析
- 高精度な個人化日記作成

## 🌟 完了後の確認事項

1. **MCP統合状況**: Claude Desktop環境で確認
2. **実際のSlackデータ取得**: 今日のメッセージ分析
3. **統合日記生成**: esa文体 + Slack活動の統合
4. **自動投稿**: WIP状態でのesa投稿

設定完了後、真のSlack MCP統合版の完全な機能をお楽しみください！🎉

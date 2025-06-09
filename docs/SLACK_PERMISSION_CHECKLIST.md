## Slack App権限確認チェックリスト

### 🔍 確認手順

#### 1. Slack App管理画面
- https://api.slack.com/apps
- あなたのGhostWriter Appを選択

#### 2. OAuth & Permissions ページ
- 左サイドバーから「OAuth & Permissions」を選択

#### 3. Bot Token Scopes 確認
現在必要な権限:
- [x] `app_mentions:read`
- [x] `channels:read`  
- [x] `chat:write`
- [x] `commands`
- [x] `users:read`
- [ ] `users:read.email` ← **これが追加されているか確認**

#### 4. 再インストール必須
権限を追加した場合は必ず：
- 「Install App to Workspace」ボタンをクリック
- ワークスペースへの再インストール実行

#### 5. 新しいBot Token取得
- Bot User OAuth Token (xoxb-で始まる) をコピー
- .envファイルのSLACK_BOT_TOKENを更新

#### 6. 権限変更の注意事項
- 既存のトークンは無効になります
- ワークスペース管理者の承認が必要な場合があります
- 再インストール後にボットを再起動が必要

### 🧪 権限確認テスト
権限追加後、以下で確認：
```bash
npm run slack
```

期待される結果:
```
📋 詳細ユーザー情報:
   - メール: takuya.okamoto@esm.co.jp  ← 取得成功
```

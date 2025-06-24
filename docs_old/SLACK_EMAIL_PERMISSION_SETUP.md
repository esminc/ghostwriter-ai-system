## Slack App Email権限追加手順

### 1. Slack App管理画面にアクセス
https://api.slack.com/apps

### 2. GhostWriter Appを選択

### 3. OAuth & Permissions ページに移動

### 4. Bot Token Scopes を確認
現在の設定:
- app_mentions:read
- channels:read
- chat:write
- commands
- users:read

### 5. 追加すべき権限
- users:read.email

### 6. 権限追加後の再インストール
「Install App to Workspace」ボタンをクリックして
ワークスペースに再インストール

### 7. 新しいBot Tokenを取得
xoxb-... で始まる新しいトークンを.envファイルに更新

### 注意事項
- 権限を追加すると既存のトークンは無効になります
- ワークスペースへの再インストールが必要です
- 管理者承認が必要な場合があります

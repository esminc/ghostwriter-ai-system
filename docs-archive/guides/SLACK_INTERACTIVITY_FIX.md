# GhostWriter Slack Bot - Interactivity Fix Guide

## 🔧 問題の解決方法

### 1. 現在の問題
Slack Botのボタンクリックが「このアプリは、インタラクティブな応答を処理するように設定されていません」エラーで動作しない。

### 2. 原因
Slack AppでInteractivity & Shortcutsの設定が不完全。

### 3. 解決手順

#### A. ngrokのセットアップ（ローカル開発用）

```bash
# ngrokをインストール（未インストールの場合）
brew install ngrok

# ngrokでローカルサーバーを公開
./setup-ngrok.sh
```

#### B. Slack App設定の修正

1. **Slack App管理画面**（https://api.slack.com/apps）にアクセス
2. あなたのGhostWriter Appを選択

3. **Interactivity & Shortcuts**
   - `Interactivity`を**ON**にする
   - `Request URL`に設定: `https://あなたのngrok.URL/slack/events`
   - 例: `https://abc123.ngrok.io/slack/events`

4. **Event Subscriptions**
   - `Enable Events`を**ON**にする
   - `Request URL`に設定: `https://あなたのngrok.URL/slack/events`

5. **Slash Commands**
   - `/ghostwrite`コマンドの`Request URL`も同様に更新

#### C. 修正されたSlack Botコードの適用

```bash
# 修正版のSlack Botコードを適用
cp src/slack/app-fixed.js src/slack/app.js
```

### 4. テスト手順

1. **ngrok起動**
   ```bash
   ./setup-ngrok.sh
   ```

2. **Slack Bot起動**
   ```bash
   npm run slack
   ```

3. **Slackでテスト**
   - `/ghostwrite`コマンドを実行
   - ボタンをクリックしてインタラクションをテスト

### 5. 期待される動作

✅ `/ghostwrite`コマンドでUIが表示される
✅ 「AI代筆生成」ボタンがクリック可能
✅ 「履歴確認」「設定」ボタンが動作する
✅ AI代筆生成が実行される
✅ esaへの投稿が可能

### 6. トラブルシューティング

#### エラー: "URL verification failed"
- ngrokのURLが正しく設定されているか確認
- Slack Botが起動しているか確認

#### エラー: "signing_secret verification failed"
- .envファイルの`SLACK_SIGNING_SECRET`が正しいか確認

#### エラー: "invalid_auth"
- .envファイルの`SLACK_BOT_TOKEN`が正しいか確認

### 7. 本番環境への移行

開発完了後は、ngrokではなく本格的なサーバー（Heroku、AWS等）にデプロイして、そのURLをSlack Appに設定します。

---

## 🚀 修正点の詳細

### 主な改善内容

1. **ExpressReceiver除去**: シンプルなHTTP Modeに変更
2. **アクションハンドラー改善**: 個別のaction_idで処理
3. **エラーハンドリング強化**: より詳細なエラー表示
4. **UI改善**: ローディング状態の表示改善
5. **デバッグ情報追加**: 問題特定を容易にする

### コードの主な変更点

```javascript
// 変更前（問題があった部分）
this.app.action(/^ghostwrite_/, async ({ body, ack, respond, client }) => {
    // パターンマッチングで複数のアクションを処理
});

// 変更後（修正版）
this.app.action('ghostwrite_generate', async ({ body, ack, respond, client }) => {
    // 個別のアクションごとに処理
});
this.app.action('ghostwrite_history', async ({ body, ack, respond, client }) => {
    // 履歴表示の処理
});
```

これにより、各ボタンクリックが確実に処理されるようになります。
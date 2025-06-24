# 🔧 Slack データソース表示修正コミット

## 修正概要
Slackでの投稿表示時に「模擬データ」と誤表示される問題を根本解決

## 修正ファイル
1. `src/slack/app.js`
2. `src/mcp-integration/llm-diary-generator-phase53-unified.js`

## 修正内容

### 1. Slack App判定ロジック修正
```diff
- const slackDataStatus = previewData.slackDataSource === 'real_slack_mcp' ? '✅ 実Slackデータ' : '⚠️ 模擬データ';
+ const slackDataStatus = previewData.slackDataSource === 'real_slack_mcp_multi_channel' ? '✅ 実Slackデータ' : '⚠️ 模擬データ';
```

### 2. データソース取得方法修正
```diff
- slackDataSource: mcpResult?.metadata?.data_sources?.slack || 'phase_5_3_unified',
+ slackDataSource: mcpResult?.metadata?.slack_data_source || 'phase_5_3_unified',
```

### 3. デバッグログ追加
- SlackMCPWrapper レスポンス確認
- mcpResult メタデータ確認
- previewData 内容確認

## 期待される結果
- 実際のSlackデータ取得時に「✅ 実Slackデータ」と正しく表示
- データソース値の正確な伝達
- 詳細なデバッグ情報でトラブルシューティング向上

## コミットコマンド
```bash
git add src/slack/app.js src/mcp-integration/llm-diary-generator-phase53-unified.js
git commit -m "🔧 Fix Slack data source display issue

- 修正: Slack判定ロジック (real_slack_mcp → real_slack_mcp_multi_channel)
- 修正: データソース取得方法 (metadata.slack_data_source)
- 追加: 詳細デバッグログ
- 解決: 実Slackデータが模擬データと誤表示される問題"
```

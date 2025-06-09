# 🚀 Phase 1移行テスト実行ガイド

## 概要
自動マッピングシステム Phase 1 (auto_with_manual_fallback) の実際のテスト実行手順

## 事前準備完了事項
✅ 環境変数設定: `MAPPING_PHASE=auto_with_manual_fallback`  
✅ ログディレクトリ作成: `logs/mapping-migration.log`  
✅ 既存手動マッピング確認: 3件設定済み  
✅ MigrationManager統合: Slack Bot完全対応  
✅ テストスクリプト準備: phase1-test-start.sh, phase1-monitor.sh  

---

## 📋 実行手順

### Terminal 1: ngrok起動
```bash
cd /Users/takuya/Documents/AI-Work/GhostWriter
chmod +x phase1-test-start.sh
./phase1-test-start.sh
```

### Terminal 2: Slack Bot起動
```bash
cd /Users/takuya/Documents/AI-Work/GhostWriter
node src/slack/app.js
```

### Terminal 3: 統計監視（オプション）
```bash
cd /Users/takuya/Documents/AI-Work/GhostWriter
chmod +x phase1-monitor.sh
./phase1-monitor.sh
```

---

## 🔧 Slack App設定

ngrok起動後に表示される HTTPS URL (例: `https://abc123.ngrok.io`) を使用:

1. **Slack App管理画面** → **Interactivity & Shortcuts**
   - Request URL: `https://abc123.ngrok.io/slack/events`

2. **Event Subscriptions**
   - Request URL: `https://abc123.ngrok.io/slack/events`

3. **Slash Commands** (`/ghostwrite`)
   - Request URL: `https://abc123.ngrok.io/slack/events`

---

## 🧪 Phase 1テスト項目

### テスト1: 既存ユーザー（手動マッピングあり）
- **実行**: Slackで `/ghostwrite` 実行
- **期待動作**: 
  1. 自動マッピング試行
  2. 成功時 → 自動マッピング使用
  3. 失敗時 → 手動フォールバック (`okamoto-takuya`)
- **確認ポイント**: 
  - ✅ エラーなく日記生成完了
  - ✅ マッピング方法がUIに表示
  - ✅ 統計ログに記録

### テスト2: 新規ユーザー（手動マッピングなし）
- **実行**: 新規Slackユーザーで `/ghostwrite` 実行
- **期待動作**:
  1. 3段階自動マッピング実行
  2. 成功時 → 自動マッピング結果使用
  3. 失敗時 → エラーまたは最終フォールバック
- **確認ポイント**:
  - ✅ 自動マッピングアルゴリズム実行
  - ✅ 適切なエラーハンドリング
  - ✅ 統計データ記録

---

## 📊 成功判定基準

### Phase 1成功基準
- ✅ **エラー率 < 5%**: 致命的エラーなし
- ✅ **自動マッピング成功率 > 80%**: 期待性能達成
- ✅ **フォールバック正常動作**: 手動設定正常使用
- ✅ **統計記録完全**: ログファイル・コンソール出力

### Phase 2移行判定基準
- 🎯 **自動マッピング成功率 > 80%**
- 🎯 **1-2週間の安定動作**
- 🎯 **フォールバック使用率 < 20%**
- 🎯 **平均処理時間 < 100ms**

---

## 🔍 トラブルシューティング

### ngrok接続エラー
```bash
# ngrok再起動
pkill ngrok
./phase1-test-start.sh
```

### Slack Bot起動エラー
```bash
# 環境変数確認
echo $MAPPING_PHASE
echo $SLACK_BOT_TOKEN

# 依存関係確認
npm install
```

### 自動マッピングエラー
```bash
# esa API接続確認
node test-esa-connection.js

# 手動マッピング確認
cat config/user-mappings.json
```

---

## 📈 期待される統計データ

### ログ出力例
```
Phase 1移行ログ開始 - 2025-05-28 15:30:00
フェーズ: auto_with_manual_fallback

🔄 段階的移行マネージャーによるマッピング開始...
✅ 自動マッピング成功: method=auto_email, confidence=1.0, time=45ms
⚠️ フォールバック使用: method=manual_fallback
```

### コンソール出力例
```
📊 Phase 1統計サマリー (最新 10 件)
   自動マッピング成功率: 87% (8/10)
   手動フォールバック率: 13% (2/10)
   エラー件数: 0 件
🎉 Phase 2移行推奨: 自動成功率 > 80%
```

---

## ✅ テスト完了後のアクション

### 成功時
1. **統計データ保存**: ログファイル・スクリーンショット
2. **Phase 2移行計画**: 1-2週間後の判定準備
3. **継続監視**: 日次統計レポート確認

### 改善が必要な場合
1. **アルゴリズム調整**: 自動マッピング精度向上
2. **手動マッピング追加**: 失敗ケース対応
3. **Phase 1継続**: 安定性確保優先

---

*Phase 1移行テスト完了後、データ収集を継続してPhase 2移行の判断を行います*

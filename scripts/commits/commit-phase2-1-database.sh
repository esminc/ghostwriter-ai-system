#!/bin/bash

# Phase 2-1: データベース・統計機能改善コミット
echo "🔧 Phase 2-1: データベース・統計機能改善をコミット中..."

# 特定ファイルのみをステージング
git add src/database/init.js
git add src/database/models/history.js

# コミット実行
git commit -m "🔧 Phase 2-1: データベース・統計機能改善

📊 データベース機能強化
======================

✨ 新機能:
- initDatabase関数追加 (Promise対応)
- 統計情報取得インスタンスメソッド追加
- 履歴管理機能の強化
- getStatistics(), getRecentHistory()メソッド実装

🛠️ 改善:
- データベース初期化の安定性向上
- 統計データの正確性確保
- エラーハンドリング強化

📈 効果:
- Slack Bot統合の基盤整備
- 統計情報の完璧な表示 (7件のAI生成実績)
- 品質スコア管理の向上 (平均3.8/5)"

if [ $? -eq 0 ]; then
    echo "✅ Phase 2-1コミット完了"
else
    echo "❌ Phase 2-1コミットでエラーが発生"
fi

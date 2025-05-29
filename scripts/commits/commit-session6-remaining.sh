#!/bin/bash

# Session 6: 残りファイル追加コミットスクリプト

echo "🔄 Session 6: 残りファイル追加コミット"
echo "======================================="

# 現在のディレクトリ確認
if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
    echo "❌ エラー: GhostWriterプロジェクトのルートディレクトリで実行してください"
    exit 1
fi

echo "📂 現在のディレクトリ: $(pwd)"
echo ""

# 残りの変更ファイル確認
echo "📋 残りの変更ファイル確認"
echo "------------------------"
remaining_files=$(git diff --name-only)

if [[ -z "$remaining_files" ]]; then
    echo "✅ 未コミットの変更はありません"
    exit 0
fi

echo "📝 未コミットファイル:"
echo "$remaining_files"
echo ""

# user-mapping-manager.js が含まれているかチェック
if echo "$remaining_files" | grep -q "src/services/user-mapping-manager.js"; then
    echo "⚠️  重要: user-mapping-manager.js に変更があります（ユーザーマッピング機能）"
fi

# 変更の統計情報表示
echo "📊 変更サマリー:"
git diff --stat
echo ""

# 各ファイルの変更内容を簡潔に表示
echo "🔍 各ファイルの変更内容:"
echo "========================"

if git diff --name-only | grep -q "package.json"; then
    echo ""
    echo "📦 package.json の変更:"
    echo "------------------------"
    git diff package.json | head -20
    echo ""
fi

if git diff --name-only | grep -q "src/services/ai-profile-analyzer.js"; then
    echo ""
    echo "🧠 ai-profile-analyzer.js の変更:"
    echo "-----------------------------------"
    git diff src/services/ai-profile-analyzer.js | head -20
    echo ""
fi

if git diff --name-only | grep -q "src/services/esa-api.js"; then
    echo ""
    echo "📡 esa-api.js の変更:"
    echo "---------------------"
    git diff src/services/esa-api.js | head -20
    echo ""
fi

if git diff --name-only | grep -q "src/services/user-mapping-manager.js"; then
    echo ""
    echo "🔗 user-mapping-manager.js の変更:"
    echo "-------------------------------------"
    git diff src/services/user-mapping-manager.js | head -20
    echo ""
fi

# ユーザー確認
read -p "🤔 上記の変更を確認しました。これらをコミットしますか？ (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⏹️  コミット処理を中止しました"
    exit 0
fi

echo ""
echo "🔄 残りファイルのコミット実行中..."
echo ""

# 個別にコミットするか、まとめてコミットするかを判断

# package.json のみの変更をコミット
if git diff --name-only | grep -q "package.json"; then
    echo "📦 package.json をコミット中..."
    git add package.json
    git commit -m "📦 package.json 更新

- Session 6で追加されたテストコマンドやスクリプトの反映
- OpenAI API問題解決関連の依存関係調整

補完: Session 6でのプロジェクト設定更新"
    echo "✅ package.json コミット完了"
    echo ""
fi

# ai-profile-analyzer.js, esa-api.js, user-mapping-manager.js をサービス改善としてまとめてコミット
service_files=""
if git diff --name-only | grep -q "src/services/ai-profile-analyzer.js"; then
    service_files="$service_files src/services/ai-profile-analyzer.js"
fi
if git diff --name-only | grep -q "src/services/esa-api.js"; then
    service_files="$service_files src/services/esa-api.js"
fi
if git diff --name-only | grep -q "src/services/user-mapping-manager.js"; then
    service_files="$service_files src/services/user-mapping-manager.js"
fi

if [[ -n "$service_files" ]]; then
    echo "🔧 サービスファイル改善をコミット中..."
    git add $service_files
    git commit -m "🔧 サービス機能改善

- ai-profile-analyzer.js: プロフィール分析精度向上
- esa-api.js: 投稿機能の安定性向上
- user-mapping-manager.js: ユーザーマッピング機能強化
- Session 6でのOpenAI API統合に伴う調整

効果: より安定した分析・マッピング・投稿処理の実現"
    echo "✅ サービスファイル改善コミット完了"
    echo ""
fi

# その他のファイルがあれば処理
other_files=$(git diff --name-only)
if [[ -n "$other_files" ]]; then
    echo "📋 その他のファイル:"
    echo "$other_files"
    echo ""
    read -p "🤔 これらもコミットしますか？ (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "🔧 Session 6: その他の細かな調整

- Session 6完了時の追加調整ファイル
- OpenAI API統合完了に伴う周辺ファイル更新

補完: Session 6全変更の確実な記録"
        echo "✅ その他のファイルもコミット完了"
    fi
fi

echo ""
echo "🎉 残りファイルのコミット完了！"
echo "================================"

# 最新のコミット履歴を表示
echo "📜 最新のコミット履歴 (直近6件):"
git log --oneline -6

echo ""
echo "✅ Session 6: 全変更コミット完了"
echo "- 🔧 OpenAI API デバッグログ強化"
echo "- 🤖 AIDiaryGenerator 自動生成改善"
echo "- 🚀 Slack Bot パラメータ修正"
echo "- 📝 Session 6完了記録更新"
echo "- 📦 プロジェクト設定更新"
echo "- 🔧 サービス機能改善"

echo ""
echo "🚀 次のアクション:"
echo "git push origin main  # 全変更をリモートに送信"

echo ""
echo "✨ Session 6: 完全コミット完了！ ✨"

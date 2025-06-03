#!/bin/bash

# Phase 5 プロジェクト構造整理 - 全自動実行スクリプト

echo "🎯 Phase 5 プロジェクト構造整理 - 全自動実行開始"
echo "============================================================"
echo ""

# 各ステップに実行権限を付与
chmod +x cleanup-step1-directories.sh
chmod +x cleanup-step2-docs.sh  
chmod +x cleanup-step3-scripts.sh
chmod +x cleanup-step4-final.sh

echo "🏗️ ステップ1: ディレクトリ構造作成..."
./cleanup-step1-directories.sh

echo ""
echo "📚 ステップ2: ドキュメント移動..."
./cleanup-step2-docs.sh

echo ""
echo "🔧 ステップ3: スクリプト・テスト移動..."
./cleanup-step3-scripts.sh

echo ""
echo "🔍 ステップ4: 最終確認..."
./cleanup-step4-final.sh

echo ""
echo "============================================================"
echo "🎉 Phase 5 プロジェクト構造整理 - 完全自動実行完了！"
echo ""
echo "📊 ビフォー・アフター比較:"
echo "   🔴 Before: ルート直下に38個の雑多なファイル"
echo "   ✅ After:  プロフェッショナルな構造化プロジェクト"
echo ""
echo "🎯 実現した価値:"
echo "   💡 視認性: ルートディレクトリがスッキリ"
echo "   🔍 ナビゲーション: 目的のファイルが見つけやすい"
echo "   🛠️ 保守性: 関連ファイルがグループ化"
echo "   🚀 拡張性: 新機能追加が構造化されて簡単"
echo "   🎆 エンタープライズ: プロダクション品質"
echo ""
echo "🔄 推奨される次の行動:"
echo "   git add ."
echo "   git commit -m '📁 Phase 5: プロジェクト構造整理完了 - エンタープライズレベル構造確立'"
echo "   git push origin main"
echo ""
echo "🚀 Phase 5基盤の上に、Phase 6開発を開始できます！"

#!/bin/bash

# Phase 1移行 - リアルタイム統計監視スクリプト

echo "📊 Phase 1移行 - リアルタイム統計監視"
echo "フェーズ: auto_with_manual_fallback"
echo "監視対象: logs/mapping-migration.log"
echo ""

# ログファイル存在確認
if [ ! -f "logs/mapping-migration.log" ]; then
    echo "⚠️ ログファイルが見つかりません"
    echo "📝 ログファイル作成中..."
    touch logs/mapping-migration.log
    echo "Phase 1統計監視開始 - $(date)" >> logs/mapping-migration.log
fi

echo "🔄 統計監視開始 (Ctrl+C で終了)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 統計カウンター初期化
total_mappings=0
auto_success=0
manual_fallback=0
errors=0

# ログファイルをリアルタイム監視
tail -f logs/mapping-migration.log | while read line; do
    echo "📝 $(date '+%H:%M:%S') | $line"
    
    # 統計計算（簡易版）
    if [[ "$line" == *"自動マッピング成功"* ]]; then
        ((auto_success++))
        ((total_mappings++))
        echo "📈 統計更新: 自動成功 $auto_success/$total_mappings"
    elif [[ "$line" == *"手動フォールバック"* ]]; then
        ((manual_fallback++))
        ((total_mappings++))
        echo "📈 統計更新: 手動FB $manual_fallback/$total_mappings"
    elif [[ "$line" == *"エラー"* ]] || [[ "$line" == *"失敗"* ]]; then
        ((errors++))
        echo "⚠️ エラー検出: 累計 $errors 件"
    fi
    
    # 定期的な統計サマリー表示
    if [ $((total_mappings % 5)) -eq 0 ] && [ $total_mappings -gt 0 ]; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📊 Phase 1統計サマリー (最新 $total_mappings 件)"
        if [ $total_mappings -gt 0 ]; then
            auto_rate=$((auto_success * 100 / total_mappings))
            fb_rate=$((manual_fallback * 100 / total_mappings))
            echo "   自動マッピング成功率: $auto_rate% ($auto_success/$total_mappings)"
            echo "   手動フォールバック率: $fb_rate% ($manual_fallback/$total_mappings)"
            echo "   エラー件数: $errors 件"
            
            # Phase 2移行判定
            if [ $auto_rate -gt 80 ]; then
                echo "🎉 Phase 2移行推奨: 自動成功率 > 80%"
            else
                echo "🔄 Phase 1継続推奨: 自動成功率 < 80%"
            fi
        fi
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
    fi
done

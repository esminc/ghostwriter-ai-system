# 📁 Documentation Migration Script

## 🎯 移行方針

### Planning関連 → `planning/`
```bash
# Phase計画書
cp docs/planning/phase-plans/PHASE7_IMPLEMENTATION_PLAN_2025-06-18.md docs_organized/planning/phase-plans/

# アーキテクチャ設計
cp docs/planning/architecture/*.md docs_organized/planning/architecture/

# Phase 7関連の設計書
cp docs/planning/phase7a/*.md docs_organized/planning/strategies/
cp docs/planning/phase7b/*.md docs_organized/planning/strategies/
```

### Technical関連 → `technical/`
```bash
# 技術調査レポート
cp docs/technical/phase6-slack-user-mapping-investigation.md docs_organized/technical/investigations/
cp docs/technical/esa-mcp-investigation.md docs_organized/technical/investigations/
cp docs/technical/slack-integration-report.md docs_organized/technical/investigations/
cp docs/technical/SLACK_REACTION_INVESTIGATION_REPORT.md docs_organized/technical/investigations/
cp docs/technical/timeout-fix-summary.md docs_organized/technical/investigations/

# 完了サマリー（最重要）
cp docs/technical/PHASE7_COMPLETION_SUMMARY_2025-06-24.md docs_organized/technical/
```

### Reports関連 → `reports/`
```bash
# Phase完了レポート
cp docs/handovers/2025-06/PHASE*_COMPLETION_REPORT.md docs_organized/reports/phase-reports/
cp docs/handovers/2025-06/*_COMPLETE*.md docs_organized/reports/completion-reports/

# 分析レポート
cp docs/COMPARISON-SUMMARY.md docs_organized/reports/analysis-reports/
cp docs/reports/project-analysis/*.md docs_organized/reports/analysis-reports/
cp docs/reports/code-reviews/*.md docs_organized/reports/analysis-reports/
```

### Project Management関連 → `project-management/`
```bash
# 引き継ぎドキュメント
cp docs/handovers/2025-06/CHAT_HANDOVER_*.md docs_organized/project-management/handovers/
cp docs/handovers/2025-06/CONTINUATION_PROMPT_*.md docs_organized/project-management/handovers/

# コミット・デプロイメントガイド
cp docs/commit-messages/*.md docs_organized/project-management/commit-guides/
cp docs/development/git-commit-procedure.md docs_organized/project-management/commit-guides/
cp docs/development/deployment/*.md docs_organized/project-management/deployment/
```

### Archive関連 → `archive/`
```bash
# 旧フェーズドキュメント
cp docs/phases/phase4/*.md docs_organized/archive/old-phases/
cp docs/phases/phase5/*.md docs_organized/archive/old-phases/
cp docs/phases/phase53/*.md docs_organized/archive/old-phases/

# レガシードキュメント
cp docs/archive/development/*.md docs_organized/archive/legacy-docs/
cp docs/archive/guides/*.md docs_organized/archive/legacy-docs/
cp docs/archive/reports/*.md docs_organized/archive/legacy-docs/

# 旧チャット履歴
cp docs/chat-history/*.md docs_organized/archive/legacy-docs/
```

## 🗂️ 移行対象外（削除候補）

以下のファイルは重複または不要のため、移行しない：

### 重複ファイル
- `README_NEW.md` (README.mdと重複)
- 同じ内容の複数のCOMMIT_MESSAGE*.md

### 開発中間ファイル
- `DEBUG_FILES_CLEANUP_REPORT.md`
- `PROJECT_STRUCTURE_CLEANUP_REPORT*.md`
- 各種TEMP_*.md

### 詳細な移行フロー
1. **重要ファイル先行移行**: PHASE7関連、技術調査、完了レポート
2. **カテゴリ別整理**: 上記スクリプトに従って移行
3. **重複削除**: 同一内容のファイルを統合
4. **インデックス作成**: 各ディレクトリにREADME.mdを配置
5. **旧ディレクトリ削除**: 移行完了後に`docs/`を`docs_old/`にリネーム

## ✅ 移行後の検証

- [ ] 重要ドキュメントの移行確認
- [ ] リンク切れの修正
- [ ] 各ディレクトリのREADME.md作成
- [ ] 全体のナビゲーション整理
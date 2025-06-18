# 📁 GhostWriter プロジェクトルート整理計画

**策定日**: 2025年6月18日  
**対象**: プロジェクトルート直下のファイル整理  
**目標**: クリーンで保守性の高いディレクトリ構造の実現

---

## 🎯 **整理の目的**

1. **ルート階層の簡素化**: 必要最小限のファイルのみルートに配置
2. **カテゴリ別分類**: 関連ファイルの適切なグルーピング  
3. **可読性向上**: プロジェクト構造の理解容易性
4. **保守性向上**: ファイルの発見・更新の効率化

---

## 📋 **現状分析**

### **ルート直下の移動対象ファイル**

| ファイル名 | 現在の場所 | 移動先 | 分類 |
|------------|------------|--------|------|
| `FOLDER_STRUCTURE_ANALYSIS_REPORT.md` | ROOT | `docs/reports/` | 分析レポート |
| `HANDOVER_PROMPT.md` | ROOT | `docs/handovers/` | 引継ぎドキュメント |
| `git-commit-procedure.md` | ROOT | `docs/development/` | 開発手順書 |

### **ルート直下に残すファイル**

| ファイル名 | 理由 |
|------------|------|
| `README.md` | プロジェクトのメインドキュメント |
| `CLAUDE.md` | Claude Code用ガイドライン |
| `package.json` | Node.js設定ファイル |
| `package-lock.json` | 依存関係ロック |

---

## 🚀 **実行計画**

### **Step 1: docs内の構造最適化**

#### **新しいdocs構造**
```
docs/
├── README.md                    # docs全体の目次
├── development/                 # 開発関連ドキュメント
│   ├── git-commit-procedure.md  # 移動対象
│   ├── setup-guides/
│   ├── testing/
│   └── deployment/
├── reports/                     # 分析・レポート類
│   ├── code-reviews/
│   ├── project-analysis/
│   │   └── FOLDER_STRUCTURE_ANALYSIS_REPORT.md  # 移動対象
│   └── performance/
├── handovers/                   # 引継ぎ関連
│   ├── HANDOVER_PROMPT.md       # 移動対象
│   ├── 2025-06/
│   └── templates/
├── planning/                    # 計画・設計ドキュメント
│   ├── phase-plans/
│   ├── architecture/
│   └── roadmaps/
└── legacy/                      # 過去のドキュメント
    ├── archived-reports/
    └── deprecated-guides/
```

### **Step 2: scripts構造の最適化**

#### **現在のscripts構造問題点**
- 複数の用途が混在（commit, deployment, maintenance, test）
- フラットな構造で可読性が低い
- 使用頻度の異なるスクリプトが同階層

#### **最適化後の構造**
```
scripts/
├── README.md                    # スクリプト使用ガイド
├── development/                 # 開発用スクリプト
│   ├── setup/
│   ├── testing/
│   └── debugging/
├── deployment/                  # デプロイ関連
│   ├── render/
│   ├── database/
│   └── monitoring/
├── maintenance/                 # メンテナンス
│   ├── cleanup/
│   ├── migration/
│   └── backup/
├── git/                        # Git操作（既存）
└── legacy/                     # 非推奨スクリプト
```

---

## 🔧 **具体的な移動操作**

### **Phase 1: ルート直下ファイルの移動**

#### **1. docs/reports/project-analysis/ ディレクトリ作成**
```bash
mkdir -p docs/reports/project-analysis
```

#### **2. FOLDER_STRUCTURE_ANALYSIS_REPORT.md の移動**
```bash
mv FOLDER_STRUCTURE_ANALYSIS_REPORT.md docs/reports/project-analysis/
```

#### **3. docs/development/ ディレクトリ作成**
```bash
mkdir -p docs/development
```

#### **4. git-commit-procedure.md の移動**
```bash
mv git-commit-procedure.md docs/development/
```

#### **5. HANDOVER_PROMPT.md の移動**
```bash
mv HANDOVER_PROMPT.md docs/handovers/
```

### **Phase 2: docs内構造の最適化**

#### **1. 新しいディレクトリ構造の作成**
```bash
# 新しいカテゴリディレクトリ作成
mkdir -p docs/reports/code-reviews
mkdir -p docs/reports/performance  
mkdir -p docs/planning/phase-plans
mkdir -p docs/planning/architecture
mkdir -p docs/planning/roadmaps
mkdir -p docs/development/setup-guides
mkdir -p docs/development/testing
mkdir -p docs/development/deployment
mkdir -p docs/legacy/archived-reports
mkdir -p docs/legacy/deprecated-guides
```

#### **2. 既存ファイルの再分類**

**コードレビュー関連**
```bash
mv docs/CODE_REVIEW_REPORT_2025-06-18.md docs/reports/code-reviews/
```

**プロジェクト計画関連**
```bash
mv docs/PHASE7_IMPLEMENTATION_PLAN_2025-06-18.md docs/planning/phase-plans/
mv docs/project-info/AI_CENTRIC_ARCHITECTURE_MIGRATION_PLAN_PHASE7_PLUS.md docs/planning/architecture/
```

**設定・セットアップ関連**
```bash
mv docs/MCP_INTEGRATION_SETUP_GUIDE.md docs/development/setup-guides/
mv docs/SLACK_BOT_SETUP.md docs/development/setup-guides/
mv docs/SLACK_EMAIL_PERMISSION_SETUP.md docs/development/setup-guides/
mv docs/SLACK_PERMISSION_CHECKLIST.md docs/development/setup-guides/
```

**テスト関連**
```bash
mv docs/TESTING_CHECKLIST.md docs/development/testing/
```

**デプロイメント関連**
```bash
mv docs/RENDER_POSTGRESQL_MIGRATION_PLAN.md docs/development/deployment/
```

**技術仕様**
```bash
mv docs/SYSTEM_SPECIFICATIONS.md docs/planning/architecture/
mv docs/STRATEGY_B_IMPROVED_TECHNICAL_SPECS.md docs/planning/architecture/
```

### **Phase 3: scripts構造の最適化**

#### **1. 新しいscripts構造の作成**
```bash
mkdir -p scripts/development/setup
mkdir -p scripts/development/testing  
mkdir -p scripts/development/debugging
mkdir -p scripts/deployment/render
mkdir -p scripts/deployment/database
mkdir -p scripts/deployment/monitoring
mkdir -p scripts/maintenance/cleanup
mkdir -p scripts/maintenance/migration
mkdir -p scripts/maintenance/backup
mkdir -p scripts/legacy/deprecated
```

#### **2. 既存スクリプトの再分類**

**開発用テストスクリプト**
```bash
mv scripts/test/ scripts/development/testing/
mv scripts/test-*.js scripts/development/testing/
```

**デプロイメント関連**
```bash
mv scripts/deployment/ scripts/deployment/render/
mv scripts/render-deployment-commit.sh scripts/deployment/render/
mv scripts/postgresql-fixes-commit.sh scripts/deployment/database/
```

**メンテナンス関連**
```bash
mv scripts/maintenance/ scripts/maintenance/cleanup/
mv scripts/migration/ scripts/maintenance/migration/
```

**非推奨スクリプト**
```bash
mv scripts/commit/legacy/ scripts/legacy/deprecated/
mv scripts/restart_*.sh scripts/legacy/deprecated/
```

---

## 📚 **ドキュメント更新**

### **1. docs/README.md の作成**
新しいdocs構造の目次ファイルを作成

### **2. scripts/README.md の作成**  
スクリプト使用ガイドを作成

### **3. CLAUDE.md の更新**
新しいファイル構造に対応した更新

### **4. メインREADME.md の更新**
プロジェクト構造説明の更新

---

## 🎯 **期待される効果**

### **Before (現在)**
```
ROOT/
├── FOLDER_STRUCTURE_ANALYSIS_REPORT.md  # 不適切な配置
├── HANDOVER_PROMPT.md                    # 不適切な配置
├── git-commit-procedure.md               # 不適切な配置
├── docs/ (58 files, 複雑な構造)
└── scripts/ (71 files, フラット構造)
```

### **After (整理後)**
```
ROOT/
├── README.md                             # プロジェクトメイン
├── CLAUDE.md                             # Claude Code用
├── package.json                          # Node.js設定
├── docs/ (構造化された分類)
│   ├── reports/code-reviews/
│   ├── planning/phase-plans/
│   ├── development/setup-guides/
│   └── handovers/
└── scripts/ (用途別分類)
    ├── development/
    ├── deployment/
    └── maintenance/
```

### **具体的改善効果**

1. **可読性**: ルート階層がスッキリ
2. **発見性**: 目的別分類で必要ファイルが見つけやすい
3. **保守性**: 関連ファイルがグループ化
4. **拡張性**: 新しいファイルの配置先が明確

---

## ⚠️ **注意事項**

### **移動時の考慮点**

1. **参照関係の確認**
   - 他ファイルからの相対パス参照
   - スクリプト内のファイルパス
   - ドキュメント内のリンク

2. **Git履歴の保持**
   - `git mv` コマンドの使用
   - 履歴追跡の確保

3. **CI/CD設定の更新**
   - パス変更に伴う設定修正
   - テストスクリプトのパス更新

### **実行前のバックアップ**
```bash
# 重要ファイルのバックアップ
cp -r docs/ backup/docs-backup-$(date +%Y%m%d)/
cp -r scripts/ backup/scripts-backup-$(date +%Y%m%d)/
```

---

## 📅 **実行スケジュール**

### **Phase 1: ルート整理 (30分)**
- [ ] ルート直下ファイルの移動
- [ ] 移動後の動作確認

### **Phase 2: docs構造最適化 (1時間)**  
- [ ] 新ディレクトリ構造作成
- [ ] 既存ファイルの再分類
- [ ] リンク関係の確認・修正

### **Phase 3: scripts構造最適化 (1時間)**
- [ ] 新ディレクトリ構造作成  
- [ ] スクリプトの再分類
- [ ] パス参照の確認・修正

### **Phase 4: ドキュメント更新 (30分)**
- [ ] README類の更新
- [ ] CLAUDE.mdの更新
- [ ] 参照リンクの修正確認

**総所要時間**: 約3時間

---

## 🎊 **完了後の確認事項**

### **動作確認**
- [ ] npm scripts の正常動作
- [ ] 主要スクリプトの実行確認  
- [ ] ドキュメントリンクの確認

### **品質確認**
- [ ] ファイル構造の論理性
- [ ] 命名規則の一貫性
- [ ] アクセス性の向上

### **将来対応**
- [ ] 新ファイル配置ルールの文書化
- [ ] メンテナンス手順の更新
- [ ] チーム共有と合意形成

---

## 📝 **結論**

この整理計画により、GhostWriterプロジェクトは以下を実現します：

1. **クリーンなルート構造**: 必要最小限のファイル配置
2. **論理的分類**: 目的・用途別の明確な構造化  
3. **高い保守性**: ファイルの発見・更新の効率化
4. **拡張性**: 新ファイルの適切な配置指針

整理後は、新規参加者にとって理解しやすく、既存メンバーにとって保守しやすいプロジェクト構造となります。

---

**策定者**: Claude Code  
**実行予定**: 即座実行可能  
**所要時間**: 約3時間  
**次回レビュー**: 整理完了後1週間
#!/usr/bin/env node

// チャット引き継ぎ自動生成システム
const fs = require('fs');
const path = require('path');

class ChatHandoverGenerator {
    constructor(projectPath = '/Users/takuya/Documents/AI-Work/GhostWriter') {
        this.projectPath = projectPath;
        this.handoverPath = path.join(projectPath, 'chat-handover');
        this.ensureHandoverDirectory();
    }
    
    ensureHandoverDirectory() {
        if (!fs.existsSync(this.handoverPath)) {
            fs.mkdirSync(this.handoverPath, { recursive: true });
        }
    }
    
    // 現在の状況を自動収集
    async collectCurrentStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            project: 'GhostWriter',
            phase: this.detectCurrentPhase(),
            completedFeatures: await this.scanCompletedFeatures(),
            activeIssues: await this.scanActiveIssues(),
            nextActions: await this.generateNextActions(),
            environmentStatus: await this.checkEnvironmentStatus(),
            recentChanges: await this.scanRecentChanges()
        };
        
        return status;
    }
    
    // 現在のフェーズを自動検出
    detectCurrentPhase() {
        const phases = [
            { name: 'Slack投稿参照機能修正', keywords: ['slack', 'mcp', 'channels:read'] },
            { name: 'esa統合完成', keywords: ['esa', 'api', 'post'] },
            { name: 'AI日記生成', keywords: ['diary', 'gpt', 'llm'] },
            { name: 'マッピングシステム', keywords: ['mapping', 'user', 'auto'] }
        ];
        
        // ここでログファイルやエラーファイルから現在のフェーズを推定
        return 'Slack投稿参照機能修正'; // 現在のフェーズ
    }
    
    // 完了機能をスキャン
    async scanCompletedFeatures() {
        const features = [];
        
        // ファイル存在チェックで完了機能を判定
        const checkFiles = [
            { file: 'src/mcp-integration/slack-mcp-wrapper-fixed.js', feature: 'Slack MCP統合' },
            { file: 'src/services/ai-diary-generator.js', feature: 'AI日記生成' },
            { file: 'src/services/esa-api.js', feature: 'esa API統合' },
            { file: 'src/slack/app.js', feature: 'SlackBot統合' }
        ];
        
        for (const check of checkFiles) {
            const filePath = path.join(this.projectPath, check.file);
            if (fs.existsSync(filePath)) {
                features.push({
                    name: check.feature,
                    status: '✅ 完成',
                    file: check.file
                });
            }
        }
        
        return features;
    }
    
    // アクティブな問題をスキャン
    async scanActiveIssues() {
        const issues = [];
        
        // 環境変数チェック
        try {
            require('dotenv').config({ path: path.join(this.projectPath, '.env') });
            
            if (!process.env.SLACK_BOT_TOKEN) {
                issues.push({
                    type: '環境変数',
                    issue: 'SLACK_BOT_TOKEN未設定',
                    priority: 'HIGH'
                });
            }
            
            // 最近のエラーログチェック（存在する場合）
            const logPath = path.join(this.projectPath, 'error.log');
            if (fs.existsSync(logPath)) {
                const logContent = fs.readFileSync(logPath, 'utf8');
                if (logContent.includes('missing_scope')) {
                    issues.push({
                        type: 'Slack権限',
                        issue: 'channels:read権限不足',
                        priority: 'HIGH',
                        solution: 'Slack App権限追加 → 再インストール'
                    });
                }
            }
            
        } catch (error) {
            issues.push({
                type: 'システム',
                issue: `設定ファイル読み込みエラー: ${error.message}`,
                priority: 'MEDIUM'
            });
        }
        
        return issues;
    }
    
    // 次のアクションを生成
    async generateNextActions() {
        const actions = [];
        
        // 問題ベースでアクション生成
        const issues = await this.scanActiveIssues();
        
        issues.forEach(issue => {
            if (issue.issue.includes('channels:read')) {
                actions.push({
                    action: 'Slack App権限修正',
                    steps: [
                        'https://api.slack.com/apps → GhostWriter',
                        'OAuth & Permissions → Bot Token Scopes',
                        'channels:read, channels:history追加',
                        'Install to Workspace',
                        '新Token → .env更新'
                    ],
                    priority: 'HIGH'
                });
            }
        });
        
        return actions;
    }
    
    // 環境状態チェック
    async checkEnvironmentStatus() {
        const status = {
            nodeVersion: process.version,
            projectPath: this.projectPath,
            envFile: fs.existsSync(path.join(this.projectPath, '.env')),
            packageJson: fs.existsSync(path.join(this.projectPath, 'package.json')),
            mainFiles: {}
        };
        
        // 主要ファイルの存在確認
        const mainFiles = [
            'src/slack/app.js',
            'src/mcp-integration/slack-mcp-wrapper-fixed.js',
            'src/services/ai-diary-generator.js'
        ];
        
        mainFiles.forEach(file => {
            status.mainFiles[file] = fs.existsSync(path.join(this.projectPath, file));
        });
        
        return status;
    }
    
    // 最近の変更をスキャン
    async scanRecentChanges() {
        const changes = [];
        
        try {
            // 最近変更されたファイルを検出
            const srcPath = path.join(this.projectPath, 'src');
            if (fs.existsSync(srcPath)) {
                const files = this.getAllFiles(srcPath);
                const recent = files.filter(file => {
                    const stats = fs.statSync(file);
                    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
                    return stats.mtime.getTime() > dayAgo;
                });
                
                recent.forEach(file => {
                    const relativePath = path.relative(this.projectPath, file);
                    changes.push({
                        file: relativePath,
                        modified: fs.statSync(file).mtime.toISOString()
                    });
                });
            }
        } catch (error) {
            // エラーは無視
        }
        
        return changes;
    }
    
    // ファイル一覧取得
    getAllFiles(dirPath, files = []) {
        try {
            const entries = fs.readdirSync(dirPath);
            
            entries.forEach(entry => {
                const fullPath = path.join(dirPath, entry);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    this.getAllFiles(fullPath, files);
                } else if (entry.endsWith('.js')) {
                    files.push(fullPath);
                }
            });
        } catch (error) {
            // エラーは無視
        }
        
        return files;
    }
    
    // 引き継ぎドキュメント生成
    async generateHandoverDocument() {
        const status = await this.collectCurrentStatus();
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `handover-${timestamp}.md`;
        const filepath = path.join(this.handoverPath, filename);
        
        const content = this.formatHandoverContent(status);
        
        fs.writeFileSync(filepath, content, 'utf8');
        
        // 最新の引き継ぎファイルとしてもコピー
        const latestPath = path.join(this.handoverPath, 'latest-handover.md');
        fs.writeFileSync(latestPath, content, 'utf8');
        
        // 再開プロンプトも生成
        const promptPath = path.join(this.handoverPath, 'resume-prompt.txt');
        const resumePrompt = this.generateResumePrompt(status);
        fs.writeFileSync(promptPath, resumePrompt, 'utf8');
        
        console.log(`✅ 引き継ぎドキュメント生成完了:`);
        console.log(`   📄 詳細: ${filepath}`);
        console.log(`   🔄 最新: ${latestPath}`);
        console.log(`   🚀 再開プロンプト: ${promptPath}`);
        
        return {
            detailFile: filepath,
            latestFile: latestPath,
            promptFile: promptPath,
            status: status
        };
    }
    
    // 引き継ぎ内容フォーマット
    formatHandoverContent(status) {
        return `# 🔄 チャット引き継ぎドキュメント

**生成日時**: ${status.timestamp}
**プロジェクト**: ${status.project}
**現在のフェーズ**: ${status.phase}

## ✅ 完了機能

${status.completedFeatures.map(f => `- ${f.status} ${f.name} (${f.file})`).join('\n')}

## ⚠️ アクティブな問題

${status.activeIssues.map(issue => `### ${issue.type} - ${issue.priority}
- **問題**: ${issue.issue}
${issue.solution ? `- **解決法**: ${issue.solution}` : ''}
`).join('\n')}

## 🎯 次のアクション

${status.nextActions.map(action => `### ${action.action} (優先度: ${action.priority})
${action.steps.map(step => `1. ${step}`).join('\n')}
`).join('\n')}

## 🔧 環境状態

- **Node.js**: ${status.environmentStatus.nodeVersion}
- **プロジェクトパス**: ${status.environmentStatus.projectPath}
- **環境設定ファイル**: ${status.environmentStatus.envFile ? '✅' : '❌'}
- **package.json**: ${status.environmentStatus.packageJson ? '✅' : '❌'}

### 主要ファイル状態
${Object.entries(status.environmentStatus.mainFiles).map(([file, exists]) => 
    `- ${exists ? '✅' : '❌'} ${file}`
).join('\n')}

## 📝 最近の変更

${status.recentChanges.length > 0 ? 
    status.recentChanges.map(change => `- ${change.file} (${change.modified})`).join('\n') :
    '最近24時間の変更なし'
}

---
*自動生成: ChatHandoverGenerator v1.0*
`;
    }
    
    // 再開プロンプト生成
    generateResumePrompt(status) {
        const highPriorityIssues = status.activeIssues.filter(i => i.priority === 'HIGH');
        const nextAction = status.nextActions[0];
        
        return `**前回のチャット継続**: ${status.project} - ${status.phase}

**完了済み**: 
${status.completedFeatures.map(f => `✅ ${f.name}`).join(', ')}

**現在の問題**: 
${highPriorityIssues.map(i => `❌ ${i.issue}`).join(', ')}

**次の作業**: 
${nextAction ? nextAction.action : '状況確認'}

**確認コマンド**:
\`\`\`bash
cd ${status.environmentStatus.projectPath}
# 必要に応じて実行
\`\`\`

前回の続きから開始してください。`;
    }
}

// 使用例
async function generateHandover() {
    const generator = new ChatHandoverGenerator();
    const result = await generator.generateHandoverDocument();
    
    console.log('\n🔄 **引き継ぎファイル使用方法**:');
    console.log('1. 新しいチャットで以下をアップロード:');
    console.log(`   📄 ${result.latestFile}`);
    console.log('2. または以下をコピペ:');
    console.log(`   🚀 ${result.promptFile}`);
    
    return result;
}

// スクリプトとして実行された場合
if (require.main === module) {
    generateHandover()
        .then(() => console.log('\n✅ 引き継ぎ生成完了'))
        .catch(error => console.error('❌ エラー:', error));
}

module.exports = ChatHandoverGenerator;

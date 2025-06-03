const fs = require('fs');
const path = require('path');

class UserMappingManager {
  constructor() {
    // 絶対パスで設定ファイルを指定
    const projectRoot = process.cwd();
    this.mappingFile = path.join(projectRoot, 'config', 'user-mappings.json');
    this.mappings = this.loadMappings();
  }

  // マッピング設定を読み込み
  loadMappings() {
    console.log(`📁 マッピングファイルパス: ${this.mappingFile}`);
    console.log(`📁 絶対パス: ${path.resolve(this.mappingFile)}`);
    
    try {
      if (fs.existsSync(this.mappingFile)) {
        const data = fs.readFileSync(this.mappingFile, 'utf8');
        const config = JSON.parse(data);
        console.log('✅ ユーザーマッピング設定を読み込みました');
        console.log(`📊 マッピング数: ${Object.keys(config.userMappings?.slack_to_esa || {}).length}件`);
        return config.userMappings;
      } else {
        console.log('⚠️  ユーザーマッピング設定ファイルが見つかりません');
        console.log(`📁 探したパス: ${this.mappingFile}`);
        return { slack_to_esa: {}, esa_to_slack: {} };
      }
    } catch (error) {
      console.error('❌ ユーザーマッピング設定の読み込みエラー:', error);
      return { slack_to_esa: {}, esa_to_slack: {} };
    }
  }

  // SlackユーザーIDをesaスクリーンネームに変換
  slackToEsa(slackUserId) {
    const esaScreenName = this.mappings.slack_to_esa[slackUserId];
    
    if (esaScreenName) {
      console.log(`🔄 マッピング適用: ${slackUserId} → ${esaScreenName}`);
      return esaScreenName;
    } else {
      console.log(`⚠️  マッピングなし: ${slackUserId} (設定されていないSlackユーザー)`);
      return null;
    }
  }

  // esaスクリーンネームをSlackユーザーIDに変換
  esaToSlack(esaScreenName) {
    const slackUserId = this.mappings.esa_to_slack[esaScreenName];
    
    if (slackUserId) {
      console.log(`🔄 逆マッピング適用: ${esaScreenName} → ${slackUserId}`);
      return slackUserId;
    } else {
      console.log(`⚠️  逆マッピングなし: ${esaScreenName}`);
      return null;
    }
  }

  // マッピングが存在するかチェック
  hasMapping(slackUserId) {
    return this.mappings.slack_to_esa.hasOwnProperty(slackUserId);
  }

  // 利用可能なマッピング一覧を取得
  getAvailableMappings() {
    return {
      slack_users: Object.keys(this.mappings.slack_to_esa),
      esa_users: Object.keys(this.mappings.esa_to_slack),
      total_mappings: Object.keys(this.mappings.slack_to_esa).length
    };
  }

  // 新しいマッピングを追加（開発・メンテナンス用）
  addMapping(slackUserId, esaScreenName) {
    this.mappings.slack_to_esa[slackUserId] = esaScreenName;
    this.mappings.esa_to_slack[esaScreenName] = slackUserId;
    
    console.log(`✅ 新しいマッピングを追加: ${slackUserId} ↔ ${esaScreenName}`);
    
    // 設定ファイルに保存
    this.saveMappings();
  }

  // マッピング設定を保存
  saveMappings() {
    try {
      const config = {
        userMappings: this.mappings,
        defaultMappings: {
          fallback_enabled: false,
          auto_normalize: false
        },
        mappingRules: {
          description: "Slack User ID to esa screen_name mapping",
          last_updated: new Date().toISOString().split('T')[0],
          maintainer: "system"
        }
      };
      
      fs.writeFileSync(this.mappingFile, JSON.stringify(config, null, 2), 'utf8');
      console.log('💾 ユーザーマッピング設定を保存しました');
    } catch (error) {
      console.error('❌ ユーザーマッピング設定の保存エラー:', error);
    }
  }

  // マッピング情報をログ出力
  logMappingInfo() {
    const info = this.getAvailableMappings();
    console.log('📋 ユーザーマッピング情報:');
    console.log(`   - Slackユーザー: ${info.slack_users.join(', ')}`);
    console.log(`   - esaユーザー: ${info.esa_users.join(', ')}`);
    console.log(`   - 総マッピング数: ${info.total_mappings}件`);
  }

  // デバッグ用: 特定ユーザーのマッピング状況を確認
  debugUser(identifier) {
    console.log(`🔍 "${identifier}" のマッピング状況:`);
    
    // Slackユーザーとして検索
    const esaName = this.slackToEsa(identifier);
    if (esaName) {
      console.log(`   - Slack→esa: ${identifier} → ${esaName}`);
    }
    
    // esaユーザーとして検索
    const slackName = this.esaToSlack(identifier);
    if (slackName) {
      console.log(`   - esa→Slack: ${identifier} → ${slackName}`);
    }
    
    if (!esaName && !slackName) {
      console.log(`   - マッピングなし: "${identifier}" は登録されていません`);
    }
  }
}

module.exports = UserMappingManager;

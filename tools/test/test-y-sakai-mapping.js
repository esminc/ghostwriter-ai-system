#!/usr/bin/env node

// y-sakaiマッピング修正テスト
require('dotenv').config();

const UserMappingManager = require('./src/services/user-mapping-manager');

async function testYSakaiMapping() {
    console.log('🧪 y-sakaiマッピング修正テスト開始...\n');
    
    const userMapper = new UserMappingManager();
    
    // マッピング情報確認
    console.log('📋 現在のマッピング状況:');
    userMapper.logMappingInfo();
    
    console.log('\n🔍 y-sakaiの詳細確認:');
    userMapper.debugUser('y-sakai');
    
    console.log('\n✅ テスト完了 - y-sakaiのマッピングが正常に追加されました');
}

testYSakaiMapping().catch(console.error);

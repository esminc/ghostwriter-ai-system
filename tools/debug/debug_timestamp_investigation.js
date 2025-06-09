// 🔍 タイムスタンプ処理調査スクリプト
// etc-spotsメッセージ取得問題の詳細調査

console.log('🔍 タイムスタンプ処理調査開始...');
console.log('現在時刻:', new Date().toISOString());

// 現在のgetTodayTimestamp()の実装を再現
function getCurrentImplementation() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    console.log('\n📊 現在の実装による計算:');
    console.log('  現在時刻 (now):', now.toISOString());
    console.log('  24時間前 (twentyFourHoursAgo):', twentyFourHoursAgo.toISOString());
    
    const timestamp = Math.floor(twentyFourHoursAgo.getTime() / 1000).toString();
    console.log('  Slack APIに送信されるoldestパラメータ:', timestamp);
    
    // タイムスタンプを人間が読める形に戻して確認
    const readableTime = new Date(parseInt(timestamp) * 1000);
    console.log('  oldest時刻 (人間が読める形):', readableTime.toISOString());
    
    return { timestamp, twentyFourHoursAgo, now };
}

// 期待されるメッセージの時刻を確認
function analyzeExpectedMessage() {
    console.log('\n🎯 期待されるメッセージの時刻分析:');
    
    // 6/9 15:08 JST = 6/9 06:08 UTC
    const expectedJST = new Date('2025-06-09T15:08:00+09:00');
    const expectedUTC = new Date('2025-06-09T06:08:00Z');
    
    console.log('  期待メッセージ時刻 (JST):', expectedJST.toISOString());
    console.log('  期待メッセージ時刻 (UTC):', expectedUTC.toISOString());
    
    // Slackタイムスタンプ形式に変換
    const expectedSlackTimestamp = Math.floor(expectedUTC.getTime() / 1000);
    console.log('  期待メッセージのSlackタイムスタンプ:', expectedSlackTimestamp.toString());
    
    return { expectedJST, expectedUTC, expectedSlackTimestamp };
}

// 現在取得されているメッセージの分析
function analyzeCurrentlyRetrievedMessage() {
    console.log('\n📋 現在取得されているメッセージの分析:');
    
    // ログに出ていた実際のタイムスタンプ: 2025-06-08T06:08:07.817Z
    const currentlyRetrieved = new Date('2025-06-08T06:08:07.817Z');
    console.log('  現在取得されているメッセージ時刻:', currentlyRetrieved.toISOString());
    
    const currentSlackTimestamp = Math.floor(currentlyRetrieved.getTime() / 1000);
    console.log('  そのSlackタイムスタンプ:', currentSlackTimestamp.toString());
    
    return { currentlyRetrieved, currentSlackTimestamp };
}

// 取得範囲と期待メッセージの関係を分析
function analyzeRangeAndMessage() {
    console.log('\n🔍 取得範囲と期待メッセージの関係分析:');
    
    const current = getCurrentImplementation();
    const expected = analyzeExpectedMessage();
    const retrieved = analyzeCurrentlyRetrievedMessage();
    
    console.log('\n📊 比較結果:');
    console.log('  取得範囲開始:', current.twentyFourHoursAgo.toISOString());
    console.log('  取得範囲終了:', current.now.toISOString());
    console.log('  期待メッセージ:', expected.expectedUTC.toISOString());
    console.log('  実際取得メッセージ:', retrieved.currentlyRetrieved.toISOString());
    
    // 期待メッセージが範囲内かチェック
    const isExpectedInRange = expected.expectedUTC >= current.twentyFourHoursAgo && expected.expectedUTC <= current.now;
    console.log('\n❓ 期待メッセージは取得範囲内か:', isExpectedInRange);
    
    // 実際に取得されたメッセージが範囲内かチェック
    const isRetrievedInRange = retrieved.currentlyRetrieved >= current.twentyFourHoursAgo && retrieved.currentlyRetrieved <= current.now;
    console.log('❓ 実際取得メッセージは取得範囲内か:', isRetrievedInRange);
    
    if (!isRetrievedInRange) {
        console.log('🚨 問題発見: 取得範囲外のメッセージが取得されている');
        
        // どれだけ範囲外かを計算
        const timeDiff = current.twentyFourHoursAgo.getTime() - retrieved.currentlyRetrieved.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        console.log(`   範囲外の時間: ${hoursDiff.toFixed(2)}時間前`);
    }
    
    if (isExpectedInRange && !isRetrievedInRange) {
        console.log('🎯 推論: 期待メッセージは範囲内のはずだが、別の問題がある可能性');
    }
}

// 推奨される修正案を提示
function suggestFixes() {
    console.log('\n🔧 推奨される修正案:');
    
    console.log('\n1. 取得範囲を48時間に拡大:');
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    console.log('   48時間前:', fortyEightHoursAgo.toISOString());
    
    console.log('\n2. より具体的な時刻指定:');
    // 6/9 00:00 JST から開始
    const june9Start = new Date('2025-06-09T00:00:00+09:00');
    console.log('   6/9 00:00 JST (UTC):', june9Start.toISOString());
    
    console.log('\n3. 現在時刻の確認:');
    console.log('   現在の日本時間:', new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
}

// すべての調査を実行
function runFullInvestigation() {
    console.log('🔍 === etc-spotsメッセージ取得問題 タイムスタンプ調査 ===\n');
    
    getCurrentImplementation();
    analyzeExpectedMessage();
    analyzeCurrentlyRetrievedMessage();
    analyzeRangeAndMessage();
    suggestFixes();
    
    console.log('\n✅ 調査完了');
}

// 調査実行
runFullInvestigation();

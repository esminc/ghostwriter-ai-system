#!/bin/bash

# ngrok Setup Script for GhostWriter Slack Bot Development

echo "🚀 Setting up ngrok for GhostWriter Slack Bot development..."

# ngrokが既にインストールされているかチェック
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed."
    echo "📥 Please install ngrok from https://ngrok.com/"
    echo "💡 Or install with Homebrew: brew install ngrok"
    exit 1
fi

# ngrokでトンネル作成 (ポート3000を公開)
echo "🌐 Starting ngrok tunnel on port 3000..."
echo "📝 After starting, you'll see a public URL like: https://xxxxx.ngrok.io"
echo ""
echo "🔧 Next steps:"
echo "1. Copy the HTTPS URL from ngrok"
echo "2. Go to your Slack App settings"
echo "3. Set the following URLs:"
echo "   - Interactivity Request URL: https://xxxxx.ngrok.io/slack/events"
echo "   - Event Subscriptions Request URL: https://xxxxx.ngrok.io/slack/events"
echo "   - Slash Commands Request URL: https://xxxxx.ngrok.io/slack/events"
echo ""
echo "Press Ctrl+C to stop ngrok when done testing"
echo ""

# ngrok起動
ngrok http 3000
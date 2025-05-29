#!/bin/bash

echo "🔧 Setting up GhostWriter Slack Bot with Interactivity Fix..."

# 実行権限を設定
chmod +x setup-ngrok.sh

echo "✅ Permissions set"
echo ""
echo "🚀 Next Steps:"
echo "1. Start ngrok tunnel: ./setup-ngrok.sh"
echo "2. Copy the HTTPS URL from ngrok"
echo "3. Update Slack App settings with the ngrok URL"
echo "4. Start the bot: npm run slack"
echo "5. Test /ghostwrite command in Slack"
echo ""
echo "📖 Full instructions in: SLACK_INTERACTIVITY_FIX.md"
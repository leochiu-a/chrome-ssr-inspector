#!/bin/bash

set -e

echo "🔨 Building extension..."
npm run build

echo "📦 Creating package for Chrome Web Store..."
cd dist
zip -r ../ssr-inspector-extension.zip *
cd ..

echo "✅ Package created: ssr-inspector-extension.zip"
echo "📊 Package size:"
ls -lh ssr-inspector-extension.zip

echo ""
echo "🚀 Ready for Chrome Web Store submission!"

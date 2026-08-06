#!/bin/bash
# 首件核对 APP - Android APK 打包脚本
# 使用前请确保已安装: Node.js, pnpm, Java JDK 17+, Android SDK

set -e

echo "=== 首件核对 APP 打包脚本 ==="
echo ""

# 检查环境
echo "1. 检查环境..."
node --version || { echo "错误: 未安装 Node.js"; exit 1; }
pnpm --version || { echo "错误: 未安装 pnpm"; exit 1; }
java -version 2>&1 || { echo "错误: 未安装 Java JDK"; exit 1; }

# 安装依赖
echo ""
echo "2. 安装依赖..."
pnpm install

# 构建 Next.js 静态文件
echo ""
echo "3. 构建 Web 应用..."
pnpm run build

# 导出静态文件
echo ""
echo "4. 导出静态文件..."
pnpm run export || echo "提示: 如 next export 不可用，请确认 next.config.ts 中已配置 output: 'export'"

# 同步到 Android 项目
echo ""
echo "5. 同步 Capacitor..."
npx cap sync android

echo ""
echo "=== 打包准备完成 ==="
echo ""
echo "接下来请在 Android Studio 中打开 android/ 目录:"
echo "  1. 打开 Android Studio"
echo "  2. File → Open → 选择 android/ 目录"
echo "  3. 等待 Gradle 同步完成"
echo "  4. Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo "  5. APK 文件位于: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "或使用命令行打包:"
echo "  cd android && ./gradlew assembleDebug"
echo "  APK 位于: android/app/build/outputs/apk/debug/app-debug.apk"

# 首件核对 APP - Android APK 打包指南

## 概述
本项目使用 Capacitor 将 Web 应用打包为 Android 原生 APP。

## 环境要求
- Node.js 18+
- pnpm
- Java JDK 17+
- Android SDK (API 24+)
- Android Studio (推荐)

## 快速打包（命令行）

### 1. 安装环境
```bash
# macOS
brew install node openjdk@17
brew install --cask android-studio

# Windows
# 下载安装: Node.js, JDK 17, Android Studio
```

### 2. 配置 Android SDK
```bash
# 设置环境变量 (添加到 ~/.bashrc 或 ~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$LOCALAPPDATA/Android/Sdk  # Windows
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3. 执行打包
```bash
# 进入项目目录
cd /path/to/project

# 运行打包脚本
bash scripts/build-apk.sh

# 或手动执行:
pnpm install
pnpm run build
pnpm run export
npx cap sync android
cd android && ./gradlew assembleDebug
```

### 4. 获取 APK
打包完成后，APK 文件位于:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Android Studio 打包（推荐）

1. 打开 Android Studio
2. File → Open → 选择项目中的 `android/` 目录
3. 等待 Gradle 同步完成
4. 修改应用配置（可选）:
   - `android/app/build.gradle` 中修改版本号
5. Build → Build Bundle(s) / APK(s) → Build APK(s)
6. APK 位于: `android/app/build/outputs/apk/debug/`

## 签名发布（正式版本）

### 1. 生成签名密钥
```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key
```

### 2. 配置签名
在 `android/app/build.gradle` 中添加:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('../release-key.jks')
            storePassword 'your-password'
            keyAlias 'my-key'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### 3. 打包正式版
```bash
cd android && ./gradlew assembleRelease
```

## 分发方式

### 企业微信分发
1. 将 APK 文件上传到企业微信管理后台
2. 进入 **应用管理** → **自建应用** → 选择应用
3. 在"应用主页"中上传 APK 或填写下载链接
4. 员工可在企业微信中直接下载安装

### 直接分发
1. 将 APK 文件通过微信/企业微信发送给员工
2. 员工点击安装（需开启"允许安装未知来源应用"）

### 内网分发
1. 将 APK 放到公司内网服务器
2. 生成下载二维码
3. 员工扫码下载安装

## 应用配置

### 修改应用名称
编辑 `capacitor.config.json`:
```json
{
  "appName": "你的应用名称"
}
```

### 修改服务器地址
编辑 `capacitor.config.json`:
```json
{
  "server": {
    "url": "https://your-domain.com"
  }
}
```

### 修改应用图标
将图标文件放到 `android/app/src/main/res/mipmap-*/ic_launcher.png`

## 常见问题

### Q: 打包时报错 "SDK location not found"
A: 设置 ANDROID_HOME 环境变量指向 Android SDK 路径

### Q: 安装后打开白屏
A: 检查 `capacitor.config.json` 中的 `server.url` 是否正确

### Q: 拍照功能不可用
A: 在 AndroidManifest.xml 中添加相机权限:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### Q: 如何更新 APP 内容
A: 由于 APP 加载的是远程服务器内容，只需更新服务器端代码即可，无需重新打包 APK。

# BitNP Desktop Pet (树莓娘桌宠)

基于 Electron + React + TypeScript + Vite 构建的 Windows 桌面宠物基础框架。

## 核心特性

- **透明无边框窗口**：实现完美的桌面嵌入感。
- **智能鼠标穿透**：
  - 透明区域鼠标点击穿透，不影响背景窗口操作。
  - 宠物图像（不透明区域）自动捕获鼠标，支持交互。
- **自定义像素级拖拽**：
  - 仅在宠物图像区域可按住拖动。
  - 解决了 Electron 默认拖拽区域 (`-webkit-app-region: drag`) 会吞掉鼠标事件的问题。
- **系统托盘支持**：支持右键菜单进行显示/隐藏及退出操作。

## 技术栈

- **前端**: React 18, TypeScript, Vite
- **主进程**: Electron 28
- **构建工具**: `vite-plugin-electron` (集成 Vite 与 Electron)
- **打包工具**: `electron-builder`

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
npm run dev
```

### 构建安装包

```bash
npm run build
```

## 项目结构

- `electron/`: Electron 主进程及预加载脚本代码。
- `src/`: React 渲染进程代码。
- `dist/`: 前端静态资源构建输出（Vite）。
- `dist-electron/`: Electron 脚本构建输出。

## 注意事项

- **require 错误**: 本项目已配置为 CommonJS 兼容模式。请勿在 `package.json` 中添加 `"type": "module"`，否则会导致 Electron 主进程运行报错。
- **网络代理**: 若在安装 Electron 依赖时遇到困难，项目已内置 `.npmrc` 配置了国内镜像加速。

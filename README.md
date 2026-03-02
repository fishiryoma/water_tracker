# Water Tracker - 智慧補水追蹤 Web App

這是一個整合 LINE 生態系統與 Firebase 雲端服務的補水追蹤應用程式。旨在透過直觀的互動介面與即時數據反饋，幫助用戶建立規律的飲水習慣。

## 🌟 技術亮點

### 1. 現代化前端架構

- **Vue 3 & TypeScript**: 基於 Composition API 開發，確保程式碼具備高度可維護性與型別安全性。
- **Pinia 狀態管理**: 高效管理用戶資訊、飲水紀錄與全域狀態（如主題色、錯誤處理）。
- **Vite 構建工具**: 提供極速的開發體驗與優化的打包效能。

### 2. 進階 UI/UX 與動效實作

- **GSAP 高性能動畫**: 實作高品質的水位上升、波浪波動與 UI 切換特效，提供流暢的視覺體驗。
- **動態 SVG 插值**: 運用數學演算法動態修改 SVG Path，模擬真實液體起伏效果。
- **Tailwind CSS**: 快速製作響應式設計，並採用現代化的毛玻璃 (Glassmorphism) 風格。

### 3. 三方平台與雲端整合

- **LINE LIFF 整合**: 深度整合 LINE Front-end Framework，支援 LINE 內一鍵登入、用戶資料存取與分享功能。
- **Firebase 實時數據庫**: 使用 Firebase Auth 進行身分驗證，並透過 Realtime Database 實現跨裝置數據即時同步。

### 4. 工程實踐

- **多語系支援 (i18n)**: 實施完整的繁中、英文、日文語系切換機制。
- **數據可視化**: 整合 **Chart.js** 提供直觀的飲水趨勢分析與歷史紀錄追蹤。

---

## 🚀 專案安裝與啟動

### 環境需求

- [Node.js](https://nodejs.org/) (建議 v18.0.0 以上)
- npm 或 yarn

### 1. 安裝依賴

```sh
npm install
```

### 2. 啟動開發伺服器

```sh
npm run dev
```

### 3. 專案打包

```sh
npm run build
```

### 4. 程式碼規範檢核與格式化

```sh
# ESLint 檢查
npm run lint

# Prettier 格式化
npm run format
```

---

## 🛠️ 推薦開發環境

- **IDE**: [VSCode](https://code.visualstudio.com/)
- **必備插件**: [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (原 Volar)，並建議停用 Vetur。

## 📚 相關參考

- [Vite 配置參考](https://vite.dev/config/)
- [Vue 3 官方文件](https://vuejs.org/)
- [LIFF 官方文件](https://developers.line.biz/en/docs/liff/)

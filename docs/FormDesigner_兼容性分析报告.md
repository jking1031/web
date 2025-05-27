
# FormDesigner 组件兼容性分析报告

## 📌 项目目的
本项目旨在构建基于 Formily + Designable 的可视化表单设计器，并支持 Ant Design v5。

---

## ❗ 当前存在的问题

### 🚨 问题 1：未使用 `@designable/formily-antd-v5`
当前组件未引入官方提供的适配包 `@designable/formily-antd-v5`，该包专为适配 Ant Design v5 提供必要的 UI 和行为兼容支持。未使用该包可能导致样式错乱或功能不兼容。

### 🚨 问题 2：可能存在样式冲突
当前使用了 Ant Design v5 的组件，但未明确隔离旧版本样式。若仍依赖 `@formily/antd` 或 `@designable/formily-antd`，则可能引发 CSS 冲突或运行时错误。

### 🚨 问题 3：未统一升级 Designable 相关依赖
Designable 组件中使用了多个 `@designable/*` 包，但未统一指向与 AntD v5 兼容的版本（如 v1.x）。可能存在 API 或样式层面的不一致。

---

## ✅ 推荐解决方案

### ✔️ 方案一：全面升级为 Ant Design v5 支持

1. 卸载旧版本依赖：

   ````bash
   npm uninstall @formily/antd @designable/formily-antd
   ````

2. 安装 v5 适配包：

   ````bash
   npm install @formily/antd-v5 @designable/formily-antd-v5
   ````

3. 修改组件引入方式：

   ````js
   import { FormDesigner } from '@designable/formily-antd-v5';
   ````

   并在渲染中使用：

   ````jsx
   <FormDesigner designer={designer} />
   ````

---

### ✔️ 方案二：样式隔离（如无法一次性升级）

- 使用 CSS Modules 或 Shadow DOM 避免样式冲突
- 避免全局引入旧版本 AntD 样式（如 `antd/dist/antd.css`）
- 使用 `ConfigProvider` 显式配置 AntD v5 的主题和样式作用域

---

## 📦 建议的依赖版本

```json
{
  "@formily/antd-v5": "^1.2.4",
  "@formily/core": "^2.2.14",
  "@formily/react": "^2.2.14",
  "@designable/core": "^1.1.0",
  "@designable/react": "^1.1.0",
  "@designable/formily-antd-v5": "^1.2.4"
}
```

---

## 📝 结语

为获得最佳的用户体验和稳定性，建议尽早升级所有设计器相关组件至 Ant Design v5 的兼容版本，避免使用旧版包混合开发。

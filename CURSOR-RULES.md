# ZZIOT Web 项目开发规则

本文档定义了 ZZIOT Web 项目的开发规则和代码规范，所有开发人员必须严格遵守这些规则，以确保代码质量和一致性。

## 文件和目录命名

1. **组件文件命名**: 使用 PascalCase
   - 正确: `SiteDetail.jsx`, `DataTable.jsx`
   - 错误: `site-detail.jsx`, `dataTable.jsx`

2. **页面文件命名**: 使用 PascalCase
   - 正确: `HomePage.jsx`, `SiteListPage.jsx`
   - 错误: `homePage.jsx`, `site_list_page.jsx`

3. **工具/辅助文件命名**: 使用 camelCase
   - 正确: `apiClient.js`, `dateUtils.js`
   - 错误: `APIClient.js`, `date-utils.js`

4. **样式文件命名**: 与对应组件名相同，使用 .module.scss 后缀
   - 正确: `Button.module.scss`, `Header.module.scss`
   - 错误: `button.scss`, `header_styles.scss`

5. **目录命名**: 使用 kebab-case
   - 正确: `src/components/site-management/`
   - 错误: `src/components/siteManagement/`

## 代码规范

### JavaScript/TypeScript

1. **使用 ES6+ 特性**
   - 优先使用箭头函数
   - 使用解构赋值
   - 使用扩展运算符
   - 使用模板字符串

2. **变量命名**
   - 使用有意义的变量名，避免使用单字母变量名（除了循环计数器）
   - 普通变量和函数使用 camelCase
   - 常量使用 UPPER_SNAKE_CASE
   - 类、组件和类型使用 PascalCase
   - 布尔变量使用 is/has/should 等前缀

3. **注释规范**
   - 函数和组件必须添加 JSDoc 注释
   - 复杂逻辑必须添加详细注释
   - 临时代码必须添加 TODO 注释

4. **代码格式**
   - 使用 2 个空格缩进
   - 每行最大长度为 100 个字符
   - 大括号使用 K&R 风格（开括号不换行）
   - 语句结尾必须使用分号
   - 操作符前后必须有空格

### React 规范

1. **组件编写**
   - 优先使用函数组件和 Hooks
   - 组件最大行数不超过 300 行，超过时拆分为子组件
   - props 必须定义 PropTypes 或使用 TypeScript 类型
   - 使用解构方式获取 props 和 state

2. **Hook 使用规范**
   - 遵循 Hook 使用规则，不在条件和循环中使用 Hook
   - 使用 useCallback 和 useMemo 优化性能
   - 复杂状态管理使用 useReducer
   - 自定义 Hook 命名必须以 use 开头

3. **JSX 编写规范**
   - 属性超过 3 个时换行显示
   - 避免在 JSX 中编写复杂的条件和表达式
   - 列表渲染必须提供稳定的 key
   - 避免在 render 方法中创建函数

### CSS/SCSS 规范

1. **样式编写**
   - 使用 CSS Modules 或 styled-components
   - 选择器嵌套不超过 3 层
   - 使用语义化的类名，避免使用 ID 选择器
   - 颜色值使用变量定义

2. **响应式设计**
   - 使用相对单位（rem, em, %）
   - 设置断点：xs(< 576px), sm(≥ 576px), md(≥ 768px), lg(≥ 992px), xl(≥ 1200px)
   - 移动优先的设计理念

3. **主题和变量**
   - 颜色、字体、间距等通过变量统一管理
   - 兼容亮色和暗色主题

## 文件组织

### 组件结构

组件目录结构应遵循以下模式：

```
ComponentName/
  ├── index.jsx        # 主组件文件
  ├── ComponentName.jsx # 可选，复杂组件拆分
  ├── ComponentName.module.scss # 组件样式
  ├── SubComponent.jsx # 子组件
  └── __tests__/       # 测试文件目录
      └── ComponentName.test.jsx
```

### 项目结构

```
src/
  ├── api/             # API 相关代码
  ├── assets/          # 静态资源
  ├── components/      # 共享组件
  ├── context/         # Context 状态管理
  ├── hooks/           # 自定义 Hooks
  ├── pages/           # 页面组件
  ├── styles/          # 全局样式
  ├── utils/           # 工具函数
  ├── App.jsx          # 根组件
  ├── main.jsx         # 入口文件
  └── router.jsx       # 路由配置
```

## 导入顺序

导入语句应按以下顺序排列：

1. React 和第三方库
2. 项目内的组件、钩子和上下文
3. 工具函数和常量
4. 类型定义
5. 样式导入

例如：

```jsx
// 1. React 和第三方库
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card } from 'antd';

// 2. 项目内的组件、钩子和上下文
import DataTable from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';

// 3. 工具函数和常量
import { formatDate, filterData } from '../../utils/dataUtils';
import { API_ENDPOINTS } from '../../api/constants';

// 4. 类型定义
import type { SiteData, FilterOptions } from '../../types';

// 5. 样式导入
import styles from './SiteDetail.module.scss';
```

## Git 提交规范

提交信息格式：`类型(范围): 简短描述`

类型：
- feat: 新功能
- fix: 修复 bug
- docs: 文档变更
- style: 代码格式变更（不影响功能）
- refactor: 代码重构
- perf: 性能优化
- test: 添加或修改测试
- chore: 构建过程或辅助工具变更

例如：
- `feat(auth): 添加用户角色验证`
- `fix(data-query): 修复日期选择器范围限制问题`
- `docs(readme): 更新安装说明`

## 代码审查

代码审查应关注以下方面：

1. **功能性**：代码是否实现了预期功能
2. **可维护性**：代码是否易于理解和维护
3. **性能**：是否存在性能问题
4. **安全性**：是否存在安全隐患
5. **一致性**：是否遵循项目规范

## 测试要求

1. **组件测试**：核心组件必须有单元测试
2. **功能测试**：重要功能必须有集成测试
3. **测试覆盖率**：核心功能的测试覆盖率不低于 80%

## 性能优化

1. **懒加载和代码分割**：非首屏内容使用懒加载
2. **状态管理**：避免不必要的状态更新
3. **渲染优化**：
   - 使用 React.memo 避免不必要的渲染
   - 使用 useCallback 和 useMemo 优化性能
   - 减少不必要的嵌套和大型组件

## 文档要求

1. **组件文档**：每个组件都应有 props 说明
2. **API 文档**：每个 API 方法都应有参数和返回值说明
3. **使用示例**：核心功能应有使用示例

## 错误处理

1. **API 错误**：统一处理 API 错误，提供友好的用户提示
2. **前端异常**：捕获前端异常，避免白屏
3. **错误边界**：使用 React 错误边界组件捕获组件渲染错误

## 兼容性

1. **浏览器兼容性**：支持最新版本的 Chrome、Firefox、Safari、Edge
2. **响应式设计**：适配从移动设备到桌面设备的各种屏幕尺寸

---

这些规则旨在提高代码质量和开发效率，确保团队成员能够协作开发高质量的 ZZIOT Web 应用。所有开发人员必须遵守这些规则，确保项目的一致性和可维护性。 
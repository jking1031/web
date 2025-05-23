# 项目目录结构

## 1. 核心功能模块

### 1.1 仪表盘 (Dashboard)
- `/` - 主仪表盘 (EnhancedDashboard)
  - 使用组件：
    - `ProductionStats` - 生产数据统计
    - `EnhancedTrendChart` - 趋势图
    -  RealtimeTrendChart  - 趋势图2
    - `DailyProcessAnalysis` - 工艺数据
    - Material-UI: `Box`, `Typography`, `Button`, `Grid`
    - Ant Design Icons: `AppstoreOutlined`, `UserOutlined`

- `/admin-dashboard` - 管理员仪表盘
  - 使用组件：
    - React-Admin 组件
    - `EnhancedDashboard`
    - `CustomLayout`
    - Material-UI: `Box`, `Typography`, `CircularProgress`

- `/api-dashboard` - API仪表盘
  - 使用组件：
    - API相关组件
    - 数据可视化组件

### 1.2 站点管理 (Sites)
- `/sites` - 站点列表 (SiteList)
  - 使用组件：
    - Ant Design: `Row`, `Col`, `Card`, `Input`, `Badge`, `Spin`, `Empty`, `message`, `Statistic`, `Typography`, `Tag`, `Button`
    - Ant Design Icons: `SearchOutlined`, `EnvironmentOutlined`, `TeamOutlined`, `WarningOutlined`, `DashboardOutlined`, `ReloadOutlined`
    - `ApiEditorButton` - API编辑器按钮
    - 自定义样式: `SiteList.module.scss`

- `/sites/:id` - 站点详情（新版本）SiteDetailNew.jsx
  - 使用组件：
    - 站点详情组件
    - 数据展示组件
    - 图表组件

- `/sites/:id/old` - 站点详情（旧版本）
  - 使用组件：
    - 旧版站点详情组件
    - 基础数据展示组件

### 1.3 数据中心 (Data Center)
- `/data-query` - 数据查询 (DataQuery)
  - 使用组件：
    - Ant Design: `Card`, `Table`, `Form`, `Select`, `Button`, `DatePicker`, `Spin`, `message`, `Space`, `Row`, `Col`, `Radio`
    - Ant Design Icons: `SearchOutlined`, `ReloadOutlined`, `DownloadOutlined`
    - 自定义样式: `DataQuery.module.scss`

- `/history-data` - 历史数据查询
  - 使用组件：
    - 历史数据查询组件
    - 时间范围选择器
    - 数据导出组件

- `/carbon-calc` - 碳排放计算
  - 使用组件：
    - 碳排放计算器
    - 数据输入表单
    - 结果展示组件

### 1.4 报表系统 (Reports)
- `/reports` - 报表主页
  - 使用组件：
    - 报表列表组件
    - 报表预览组件
    - 报表生成组件

- `/reports/5000` - 5000报表
  - 使用组件：
    - 5000报表表单
    - 数据验证组件
    - 提交组件

- `/reports/sludge` - 污泥报表
  - 使用组件：
    - 污泥报表表单
    - 数据计算组件
    - 结果展示组件

- `/reports/pump-station` - 泵站报表
  - 使用组件：
    - 泵站报表表单
    - 设备数据组件
    - 运行状态组件

- `/report-query` - 报表查询
  - 使用组件：
    - 报表查询表单
    - 结果列表组件
    - 导出组件

- `/dynamic-reports` - 动态报表
  - 使用组件：
    - 动态报表生成器
    - 模板选择组件
    - 数据绑定组件

### 1.5 化验数据管理 (Lab Data)
- `/lab-data` - 化验数据主页
  - 使用组件：
    - 数据列表组件
    - 数据筛选组件
    - 数据统计组件

- `/lab-data/entry` - 化验数据录入
  - 使用组件：
    - 数据录入表单
    - 数据验证组件
    - 提交组件

- `/lab-data/sludge` - 污泥数据录入
  - 使用组件：
    - 污泥数据表单
    - 数据计算组件
    - 结果展示组件

- `/lab-data/ao` - AO数据录入
  - 使用组件：
    - AO数据表单
    - 数据验证组件
    - 提交组件

### 1.6 工单系统 (Tickets)
- `/tickets` - 工单列表
  - 使用组件：
    - 工单列表组件
    - 工单筛选组件
    - 工单状态组件

- `/tickets/:id` - 工单详情
  - 使用组件：
    - 工单详情组件
    - 工单处理组件
    - 工单历史组件

- `/tickets/create` - 创建工单
  - 使用组件：
    - 工单创建表单
    - 工单模板组件
    - 提交组件

### 1.7 计算器工具 (Calculators)
- `/calculators/pac` - PAC计算器
  - 使用组件：
    - PAC计算表单
    - 结果展示组件
    - 历史记录组件

- `/calculators/pam` - PAM计算器
  - 使用组件：
    - PAM计算表单
    - 结果展示组件
    - 历史记录组件

- `/calculators/dosing` - 加药计算器
  - 使用组件：
    - 加药计算表单
    - 结果展示组件
    - 历史记录组件

- `/calculators/sludge` - 污泥计算器
  - 使用组件：
    - 污泥计算表单
    - 结果展示组件
    - 历史记录组件

## 2. 管理功能（需要管理员权限）

### 2.1 用户管理
- `/user-management` - 用户管理
  - 使用组件：
    - 用户列表组件
    - 用户表单组件
    - 权限管理组件

### 2.2 系统设置
- `/settings` - 系统设置
  - 使用组件：
    - 设置表单组件
    - 配置管理组件
    - 系统信息组件

- `/query-management` - 查询管理
  - 使用组件：
    - 查询列表组件
    - 查询编辑器组件
    - 查询测试组件

- `/db-test` - 数据库测试
  - 使用组件：
    - 数据库连接测试组件
    - 查询测试组件
    - 结果展示组件

- `/api-management` - API管理
  - 使用组件：
    - API列表组件
    - API编辑器组件
    - API测试组件

## 3. 认证相关

### 3.1 认证页面
- `/login` - 登录
  - 使用组件：
    - 登录表单组件
    - 验证码组件
    - 错误提示组件

- `/register` - 注册
  - 使用组件：
    - 注册表单组件
    - 验证组件
    - 成功提示组件

- `/forgot-password` - 忘记密码
  - 使用组件：
    - 密码重置表单
    - 验证组件
    - 邮件发送组件

## 4. 其他

### 4.1 错误页面
- `/404` - 404页面
  - 使用组件：
    - 错误提示组件
    - 返回首页按钮
    - 错误信息组件

## 5. 文件结构

```
src/
├── components/                 # 通用组件
│   ├── Auth/                  # 认证相关组件
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx
│   ├── Layout/               # 布局组件
│   │   └── MainLayout.jsx
│   ├── ErrorBoundary/        # 错误边界组件
│   │   └── ErrorBoundary.jsx
│   └── DatabaseTest/         # 数据库测试组件
│       └── DatabaseTest.jsx
│
├── features/                  # 功能模块
│   ├── dashboard/            # 仪表盘模块
│   │   ├── components/       # 仪表盘组件
│   │   │   ├── EnhancedDashboard.jsx
│   │   │   ├── ProductionStats.jsx
│   │   │   ├── EnhancedTrendChart.jsx
│   │   │   └── DeviceStatus.jsx
│   │   └── pages/           # 仪表盘页面
│   │       └── ApiDashboard.jsx
│   └── sites/               # 站点管理模块
│       └── pages/           # 站点相关页面
│           ├── SiteList.jsx
│           ├── SiteDetail.jsx
│           └── SiteDetailNew.jsx
│
├── pages/                    # 页面组件
│   ├── Admin/               # 管理页面
│   │   ├── UserManagement.jsx
│   │   └── Settings.jsx
│   ├── AdminDashboard/      # 管理员仪表盘
│   │   └── AdminDashboard.jsx
│   ├── ApiManagement/       # API管理
│   │   └── ApiManagement.jsx
│   ├── Auth/                # 认证页面
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotPassword.jsx
│   ├── DataCenter/          # 数据中心
│   │   ├── DataQuery.jsx
│   │   ├── HistoryDataQuery.jsx
│   │   └── CarbonCalc.jsx
│   ├── LabData/             # 化验数据
│   │   ├── LabData.jsx
│   │   ├── LabDataEntry.jsx
│   │   ├── SludgeDataEntry.jsx
│   │   └── AODataEntry.jsx
│   ├── Reports/             # 报表系统
│   │   ├── Reports.jsx
│   │   ├── ReportForm5000.jsx
│   │   ├── ReportFormSludge.jsx
│   │   ├── ReportFormPumpStation.jsx
│   │   ├── ReportQuery.jsx
│   │   └── DynamicReports.jsx
│   ├── Tickets/             # 工单系统
│   │   ├── TicketList.jsx
│   │   ├── TicketDetail.jsx
│   │   └── CreateTicket.jsx
│   ├── Calculators/         # 计算器工具
│   │   ├── PacCalculator.jsx
│   │   ├── PamCalculator.jsx
│   │   ├── DosingCalculator.jsx
│   │   └── ExcessSludgeCalculator.jsx
│   └── NotFound/            # 404页面
│       └── NotFound.jsx
│
└── router.jsx               # 路由配置
```

## 6. 权限控制

- `ProtectedRoute` - 需要登录才能访问的路由
- `AdminRoute` - 需要管理员权限才能访问的路由

## 7. 技术特点

1. 使用 React Router 进行路由管理
2. 采用懒加载方式导入组件
3. 统一的错误边界处理
4. 统一的加载状态处理
5. 基于角色的访问控制
6. 使用 Material-UI 和 Ant Design 组件库
7. 模块化的项目结构
8. 组件复用和组合 

主布局文件：
  MainLayout.jsx - 整体布局的容器组件，负责组织页头、侧边栏和主内容区域
  Layout.jsx - 基础布局组件
页头（Header）相关：
  Header.jsx - 顶部导航栏组件，包含：
    折叠/展开侧边栏按钮
    面包屑导航
    通知中心
    用户菜单
    主题切换
    全屏切换
侧边导航（Sidebar）相关：
  Sidebar.jsx - 侧边导航组件，包含：
    仪表盘
    站点管理
    数据中心（数据查询中心、数据填报中心）
    报表系统
    工单系统
    工具箱
    管理员菜单
样式文件：
  MainLayout.module.scss - 主布局样式
  Header.module.scss - 页头样式
  Sidebar.module.scss - 侧边栏样式
这些组件共同构成了应用的整体布局结构，使用了 Ant Design 的 Layout 组件作为基础，并添加了自定义的样式和功能
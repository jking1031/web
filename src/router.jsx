import { createHashRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// 使用懒加载方式导入组件
const EnhancedDashboard = lazy(() => import('./features/dashboard/components/EnhancedDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const DatabaseTest = lazy(() => import('./components/DatabaseTest/DatabaseTest'));
// 示例组件已移除，不再导入
const ApiDashboard = lazy(() => import('./features/dashboard/pages/ApiDashboard'));

// 认证页面
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const SiteList = lazy(() => import('./features/sites/pages/SiteList'));
const SiteDetail = lazy(() => import('./features/sites/pages/SiteDetail'));
const SiteDetailNew = lazy(() => import('./features/sites/pages/SiteDetailNew'));
const DataQuery = lazy(() => import('./pages/DataCenter/DataQuery'));
const HistoryDataQuery = lazy(() => import('./pages/DataCenter/HistoryDataQuery'));
const CarbonCalc = lazy(() => import('./pages/DataCenter/CarbonCalc'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const ReportForm5000 = lazy(() => import('./pages/Reports/ReportForm5000'));
const ReportFormSludge = lazy(() => import('./pages/Reports/ReportFormSludge'));
const ReportFormPumpStation = lazy(() => import('./pages/Reports/ReportFormPumpStation'));
const ReportQuery = lazy(() => import('./pages/Reports/ReportQuery'));
const DynamicReports = lazy(() => import('./pages/Reports/DynamicReports'));
const LabData = lazy(() => import('./pages/LabData/LabData'));
const LabDataEntry = lazy(() => import('./pages/LabData/LabDataEntry'));
const SludgeDataEntry = lazy(() => import('./pages/LabData/SludgeDataEntry'));
const AODataEntry = lazy(() => import('./pages/LabData/AODataEntry'));
const TicketList = lazy(() => import('./pages/Tickets/TicketList'));
const TicketDetail = lazy(() => import('./pages/Tickets/TicketDetail'));
const CreateTicket = lazy(() => import('./pages/Tickets/CreateTicket'));
const PacCalculator = lazy(() => import('./pages/Calculators/PacCalculator'));
const PamCalculator = lazy(() => import('./pages/Calculators/PamCalculator'));
const DosingCalculator = lazy(() => import('./pages/Calculators/DosingCalculator'));
const ExcessSludgeCalculator = lazy(() => import('./pages/Calculators/ExcessSludgeCalculator'));
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const Settings = lazy(() => import('./pages/Admin/Settings'));
const ApiManagement = lazy(() => import('./pages/ApiManagement/ApiManagement'));
const NewApiManagement = lazy(() => import('./features/api/pages/ApiManagement'));
const QueryManagement = lazy(() => import('./pages/QueryManagement/QueryManagement'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

// 加载中组件
const LoadingFallback = () => <div className="loading-container">加载中...</div>;

// 创建路由配置
const router = createHashRouter(
  [
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Suspense fallback={<LoadingFallback />}><EnhancedDashboard /></Suspense> },
      { path: 'admin-dashboard', element: <Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense> },
      { path: 'sites', element: <Suspense fallback={<LoadingFallback />}><SiteList /></Suspense> },
      { path: 'sites/:id', element: <Suspense fallback={<LoadingFallback />}><SiteDetailNew /></Suspense> },
      { path: 'sites/:id/old', element: <Suspense fallback={<LoadingFallback />}><SiteDetail /></Suspense> },
      // 数据中心
      { path: 'data-query', element: <Suspense fallback={<LoadingFallback />}><DataQuery /></Suspense> },
      { path: 'history-data', element: <Suspense fallback={<LoadingFallback />}><HistoryDataQuery /></Suspense> },
      { path: 'carbon-calc', element: <Suspense fallback={<LoadingFallback />}><CarbonCalc /></Suspense> },
      // 报表系统
      { path: 'reports', element: <Suspense fallback={<LoadingFallback />}><Reports /></Suspense> },
      { path: 'reports/5000', element: <Suspense fallback={<LoadingFallback />}><ReportForm5000 /></Suspense> },
      { path: 'reports/sludge', element: <Suspense fallback={<LoadingFallback />}><ReportFormSludge /></Suspense> },
      { path: 'reports/pump-station', element: <Suspense fallback={<LoadingFallback />}><ReportFormPumpStation /></Suspense> },
      { path: 'report-query', element: <Suspense fallback={<LoadingFallback />}><ReportQuery /></Suspense> },
      { path: 'dynamic-reports', element: <Suspense fallback={<LoadingFallback />}><DynamicReports /></Suspense> },
      // 化验数据管理
      { path: 'lab-data', element: <Suspense fallback={<LoadingFallback />}><LabData /></Suspense> },
      { path: 'lab-data/entry', element: <Suspense fallback={<LoadingFallback />}><LabDataEntry /></Suspense> },
      { path: 'lab-data/sludge', element: <Suspense fallback={<LoadingFallback />}><SludgeDataEntry /></Suspense> },
      { path: 'lab-data/ao', element: <Suspense fallback={<LoadingFallback />}><AODataEntry /></Suspense> },
      // 工单系统
      { path: 'tickets', element: <Suspense fallback={<LoadingFallback />}><TicketList /></Suspense> },
      { path: 'tickets/:id', element: <Suspense fallback={<LoadingFallback />}><TicketDetail /></Suspense> },
      { path: 'tickets/create', element: <Suspense fallback={<LoadingFallback />}><CreateTicket /></Suspense> },
      // 计算器工具
      { path: 'calculators/pac', element: <Suspense fallback={<LoadingFallback />}><PacCalculator /></Suspense> },
      { path: 'calculators/pam', element: <Suspense fallback={<LoadingFallback />}><PamCalculator /></Suspense> },
      { path: 'calculators/dosing', element: <Suspense fallback={<LoadingFallback />}><DosingCalculator /></Suspense> },
      { path: 'calculators/sludge', element: <Suspense fallback={<LoadingFallback />}><ExcessSludgeCalculator /></Suspense> },
      // 管理功能 - 只有管理员可以访问
      { path: 'user-management', element: <AdminRoute><Suspense fallback={<LoadingFallback />}><UserManagement /></Suspense></AdminRoute> },
      { path: 'settings', element: <AdminRoute><Suspense fallback={<LoadingFallback />}><Settings /></Suspense></AdminRoute> },
      { path: 'api-management', element: <AdminRoute><Suspense fallback={<LoadingFallback />}><ErrorBoundary showDetails={false}><ApiManagement /></ErrorBoundary></Suspense></AdminRoute> },
      { path: 'new-api-management', element: <AdminRoute><Suspense fallback={<LoadingFallback />}><ErrorBoundary showDetails={false}><NewApiManagement /></ErrorBoundary></Suspense></AdminRoute> },
      { path: 'query-management', element: <AdminRoute><Suspense fallback={<LoadingFallback />}><ErrorBoundary showDetails={false}><QueryManagement /></ErrorBoundary></Suspense></AdminRoute> },
      { path: 'db-test', element: <AdminRoute><Suspense fallback={<LoadingFallback />}><ErrorBoundary showDetails={true}><DatabaseTest /></ErrorBoundary></Suspense></AdminRoute> },
      // API 仪表盘页面
      { path: 'api-dashboard', element: <Suspense fallback={<LoadingFallback />}><ErrorBoundary showDetails={true}><ApiDashboard /></ErrorBoundary></Suspense> },
      // 404页面
      { path: '404', element: <Suspense fallback={<LoadingFallback />}><NotFound /></Suspense> },
      { path: '*', element: <Navigate to="/404" replace /> }
    ],
  },
  // 认证路由
  {
    path: '/login',
    element: <Suspense fallback={<LoadingFallback />}><Login /></Suspense>,
  },
  {
    path: '/register',
    element: <Suspense fallback={<LoadingFallback />}><Register /></Suspense>,
  },
  {
    path: '/forgot-password',
    element: <Suspense fallback={<LoadingFallback />}><ForgotPassword /></Suspense>,
  },
], {
  basename: '/' // 设置基础路径
});

export default router;

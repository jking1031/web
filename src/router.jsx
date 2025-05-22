import { lazy, Suspense } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import LoadingFallback from './components/Common/LoadingFallback';

// 懒加载页面组件
const ApiManagement = lazy(() => import('./pages/ApiManagement/ApiManagement'));

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/admin-dashboard" replace />} />
        {/* API 管理路由 */}
        <Route path="api-management" element={
          <AdminRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ErrorBoundary showDetails={false}>
                <ApiManagement />
              </ErrorBoundary>
            </Suspense>
          </AdminRoute>
        } />
      </Route>
    </Routes>
  );
}

export default AppRoutes; 
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/auth';
import { WebSocketProvider } from './context/WebSocketContext';
import router from './router';

/**
 * 应用程序入口组件
 * @returns {JSX.Element} 应用程序根组件
 */
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <WebSocketProvider>
          <RouterProvider router={router} />
        </WebSocketProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

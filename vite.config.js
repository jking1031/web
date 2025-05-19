import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [
      react(),
    ],
    // 配置基础路径
    base: '/',
    server: {
      // 允许公网访问的域名
      allowedHosts: [
        '5173-imo26kxk6bp0kcrnbu34q-22fad657.manusvm.computer',
        '.manusvm.computer'
      ],
      // 配置HMR WebSocket连接
      hmr: {
        // 使用默认配置，不要修改
        overlay: true,
      },
      // 配置代理，用于开发环境中的API请求
      proxy: {
        // 认证API代理 - 使用zziot.jzz77.cn:9003
        '/auth-api': {
          target: 'https://zziot.jzz77.cn:9003',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/auth-api/, ''),
        },
        // 管理员状态检查API代理 - 使用nodered.jzz77.cn:9003
        '/admin-api': {
          target: 'https://nodered.jzz77.cn:9003',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/admin-api/, ''),
        },
        // 其他API代理 - 使用nodered.jzz77.cn:9003
        '/api': {
          target: 'https://nodered.jzz77.cn:9003',
          changeOrigin: true,
          secure: false,
        },
        // WebSocket代理 - 使用nodered.jzz77.cn:9003
        '/ws': {
          target: 'wss://nodered.jzz77.cn:9003',
          ws: true,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    // 添加构建配置，优化打包
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['antd', '@ant-design/icons'],
          }
        }
      }
    }
  };

  // 仅在开发环境下添加history API fallback中间件
  if (command === 'serve') {
    // 动态导入，避免生产构建依赖
    config.plugins.push({
      name: 'configure-server',
      configureServer(server) {
        return () => {
          // 动态导入connect-history-api-fallback
          import('connect-history-api-fallback').then(({ default: history }) => {
            server.middlewares.use(
              history({
                // 不处理API请求
                rewrites: [
                  {
                    from: /^\/api\/.*$/,
                    to: function(context) {
                      return context.parsedUrl.pathname;
                    }
                  }
                ],
                // 调试日志
                verbose: true
              })
            );
            console.log('History API fallback middleware enabled for development');
          }).catch(err => {
            console.warn('Failed to load history API fallback middleware:', err);
            console.warn('You may need to install it with: npm install connect-history-api-fallback --save-dev');
          });
        };
      }
    });
  }

  return config;
})

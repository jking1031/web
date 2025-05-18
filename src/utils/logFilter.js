/**
 * 日志过滤器
 * 用于减少控制台日志输出，只保留重要的内容
 */

// 需要过滤的日志前缀或关键词
const FILTERED_PATTERNS = [
  '工具提示时间原始值',
  'TrendChartItem.jsx:',
  'EnhancedTrendChart.jsx:',
  'ProductionStats.jsx:',
  'AuthContext.jsx:'
];

// 保存原始的console方法
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

/**
 * 检查消息是否应该被过滤
 * @param {Array} args - 日志参数
 * @returns {boolean} 是否应该过滤
 */
const shouldFilter = (args) => {
  if (!args || args.length === 0) return false;
  
  // 将第一个参数转换为字符串
  const firstArg = String(args[0]);
  
  // 检查是否包含任何需要过滤的模式
  return FILTERED_PATTERNS.some(pattern => firstArg.includes(pattern));
};

/**
 * 初始化日志过滤器
 */
export const initLogFilter = () => {
  // 重写console.log
  console.log = function(...args) {
    if (!shouldFilter(args)) {
      originalConsole.log.apply(console, args);
    }
  };
  
  // 重写console.warn
  console.warn = function(...args) {
    if (!shouldFilter(args)) {
      originalConsole.warn.apply(console, args);
    }
  };
  
  // 重写console.error - 保留大多数错误，但过滤一些特定的错误
  console.error = function(...args) {
    if (!shouldFilter(args)) {
      originalConsole.error.apply(console, args);
    }
  };
  
  // 重写console.info
  console.info = function(...args) {
    if (!shouldFilter(args)) {
      originalConsole.info.apply(console, args);
    }
  };
  
  // 重写console.debug
  console.debug = function(...args) {
    if (!shouldFilter(args)) {
      originalConsole.debug.apply(console, args);
    }
  };
};

/**
 * 恢复原始的console方法
 */
export const restoreConsole = () => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
};

export default {
  initLogFilter,
  restoreConsole
};

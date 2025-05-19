/**
 * API 工具函数
 * 提供 API 相关的辅助函数
 */

/**
 * 创建API参数构建器
 * @param {object} defaultParams - 默认参数
 * @returns {Function} - 返回参数构建函数
 */
export function createParamsBuilder(defaultParams = {}) {
  return (customParams = {}) => ({
    ...defaultParams,
    ...customParams
  });
}

/**
 * 格式化API响应数据
 * @param {object} response - API响应
 * @param {Function} formatter - 格式化函数
 * @returns {object} - 返回格式化后的数据
 */
export function formatApiResponse(response, formatter) {
  if (!response) return null;
  
  try {
    return formatter(response);
  } catch (error) {
    console.error('格式化API响应失败', error);
    return response;
  }
}

/**
 * 创建API错误处理器
 * @param {object} handlers - 错误处理函数映射
 * @returns {Function} - 返回错误处理函数
 */
export function createErrorHandler(handlers = {}) {
  return (error) => {
    const errorCode = error.code || 'unknown';
    const handler = handlers[errorCode] || handlers.default;
    
    if (handler) {
      return handler(error);
    }
    
    // 默认错误处理
    console.error('API错误', error);
    throw error;
  };
}

/**
 * 创建API响应转换器
 * @param {object} transformers - 转换函数映射
 * @returns {Function} - 返回转换函数
 */
export function createResponseTransformer(transformers = {}) {
  return (apiKey, response) => {
    const transformer = transformers[apiKey];
    
    if (transformer) {
      return transformer(response);
    }
    
    return response;
  };
}

/**
 * 创建API依赖管理器
 * 用于管理API之间的依赖关系
 */
export class ApiDependencyManager {
  constructor() {
    this.dependencies = new Map();
  }
  
  /**
   * 添加API依赖
   * @param {string} apiKey - 依赖的API键名
   * @param {string} dependsOn - 被依赖的API键名
   * @param {Function} paramsBuilder - 参数构建函数
   */
  addDependency(apiKey, dependsOn, paramsBuilder) {
    if (!this.dependencies.has(apiKey)) {
      this.dependencies.set(apiKey, []);
    }
    
    this.dependencies.get(apiKey).push({
      dependsOn,
      paramsBuilder
    });
  }
  
  /**
   * 获取API的所有依赖
   * @param {string} apiKey - API键名
   * @returns {Array} - 依赖数组
   */
  getDependencies(apiKey) {
    return this.dependencies.get(apiKey) || [];
  }
  
  /**
   * 构建依赖参数
   * @param {string} apiKey - API键名
   * @param {object} results - 已有的API结果
   * @returns {object|null} - 构建的参数或null
   */
  buildDependencyParams(apiKey, results) {
    const dependencies = this.getDependencies(apiKey);
    
    if (dependencies.length === 0) {
      return null;
    }
    
    // 检查所有依赖是否都已满足
    for (const dep of dependencies) {
      if (!results[dep.dependsOn]) {
        return null; // 依赖未满足
      }
    }
    
    // 构建参数
    let params = {};
    for (const dep of dependencies) {
      const depParams = dep.paramsBuilder(results[dep.dependsOn]);
      params = { ...params, ...depParams };
    }
    
    return params;
  }
}

/**
 * 创建API批处理器
 * 用于批量处理API调用
 */
export class ApiBatchProcessor {
  constructor(apiService) {
    this.apiService = apiService;
    this.dependencyManager = new ApiDependencyManager();
  }
  
  /**
   * 批量处理API调用
   * @param {Array} apiKeys - API键名数组
   * @param {object} initialParams - 初始参数
   * @param {object} options - 选项
   * @returns {Promise} - 返回处理结果
   */
  async process(apiKeys, initialParams = {}, options = {}) {
    const results = {};
    const errors = {};
    
    // 第一轮：处理没有依赖的API
    const firstRound = apiKeys.filter(key => 
      this.dependencyManager.getDependencies(key).length === 0
    );
    
    // 调用第一轮API
    const firstRoundCalls = firstRound.map(key => ({
      key,
      params: initialParams[key] || {}
    }));
    
    const firstRoundResults = await this.apiService.batchCallApis(firstRoundCalls);
    
    // 处理第一轮结果
    firstRoundResults.forEach(({ key, response, error }) => {
      if (error) {
        errors[key] = error;
      } else {
        results[key] = response;
      }
    });
    
    // 处理剩余的API（有依赖的）
    const remaining = apiKeys.filter(key => !firstRound.includes(key));
    
    // 循环处理，直到所有API都被处理或无法继续
    let processed = true;
    while (remaining.length > 0 && processed) {
      processed = false;
      
      // 找出可以处理的API
      const processable = remaining.filter(key => {
        const params = this.dependencyManager.buildDependencyParams(key, results);
        return params !== null;
      });
      
      if (processable.length > 0) {
        processed = true;
        
        // 调用这些API
        const calls = processable.map(key => ({
          key,
          params: {
            ...this.dependencyManager.buildDependencyParams(key, results),
            ...(initialParams[key] || {})
          }
        }));
        
        const batchResults = await this.apiService.batchCallApis(calls);
        
        // 处理结果
        batchResults.forEach(({ key, response, error }) => {
          if (error) {
            errors[key] = error;
          } else {
            results[key] = response;
          }
          
          // 从剩余列表中移除
          const index = remaining.indexOf(key);
          if (index !== -1) {
            remaining.splice(index, 1);
          }
        });
      }
    }
    
    return { results, errors, remaining };
  }
}

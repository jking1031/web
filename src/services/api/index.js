// 核心服务
export { default as ApiManager } from './core/apiManager';
export { default as ApiRegistry } from './core/apiRegistry';
export { default as ApiProxy } from './core/apiProxy';

// 管理器
export { default as FieldManager } from './managers/apiFieldManager';
export { default as VariableManager } from './managers/apiVariableManager';
export { default as BaseUrlManager } from './managers/baseUrlManager';

// 工具
export { default as ApiDocGenerator } from './utils/apiDocGenerator';

// 导出默认实例
import ApiManager from './core/apiManager';
import ApiRegistry from './core/apiRegistry';
import ApiProxy from './core/apiProxy';
import FieldManager from './managers/apiFieldManager';
import VariableManager from './managers/apiVariableManager';
import BaseUrlManager from './managers/baseUrlManager';

export default {
  ApiManager,
  ApiRegistry,
  ApiProxy,
  FieldManager,
  VariableManager,
  BaseUrlManager
}; 
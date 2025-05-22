import axios from 'axios';
import { ApiManager } from './apiManager';

/**
 * IoT API 客户端
 * 提供统一的 API 调用接口
 */
class IoTApiClient {
  constructor() {
    this.axios = axios;
    this.setupInterceptors();
  }

  // ... existing code ...
}

const httpClient = new IoTApiClient();

export default httpClient; 
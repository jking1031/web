/**
 * API 高阶组件
 * 为类组件提供 API 调用功能
 */
import React, { Component } from 'react';
import apiService from '../services/apiService';
import { ApiContext } from '../context/ApiContext';

/**
 * 为类组件提供API调用功能的高阶组件
 * @param {object} apiConfig - API配置对象，键为属性名，值为API键名
 * @returns {Function} - 返回高阶组件
 */
export function withApi(apiConfig) {
  return (WrappedComponent) => {
    class WithApiComponent extends Component {
      static contextType = ApiContext;
      
      constructor(props) {
        super(props);
        
        this.state = {
          apiData: {},
          apiLoading: {},
          apiErrors: {}
        };
        
        // 创建API调用函数
        this.apiCallers = {};
        Object.entries(apiConfig).forEach(([propName, apiKey]) => {
          this.apiCallers[propName] = this.createApiCaller(propName, apiKey);
        });
      }
      
      // 创建单个API调用函数
      createApiCaller = (propName, apiKey) => {
        return async (params = {}, options = {}) => {
          this.setState(prev => ({
            apiLoading: { ...prev.apiLoading, [propName]: true },
            apiErrors: { ...prev.apiErrors, [propName]: null }
          }));
          
          try {
            // 检查缓存
            const { getCachedResponse, cacheResponse } = this.context;
            const cachedData = options.useCache ? getCachedResponse(apiKey, params) : null;
            
            if (cachedData) {
              this.setState(prev => ({
                apiData: { ...prev.apiData, [propName]: cachedData },
                apiLoading: { ...prev.apiLoading, [propName]: false }
              }));
              
              return cachedData;
            }
            
            // 调用API
            const response = await apiService.callApi(apiKey, params, options);
            
            // 更新状态
            this.setState(prev => ({
              apiData: { ...prev.apiData, [propName]: response },
              apiLoading: { ...prev.apiLoading, [propName]: false }
            }));
            
            // 缓存响应
            if (options.cacheTime) {
              cacheResponse(apiKey, params, response, options.cacheTime);
            }
            
            return response;
          } catch (error) {
            this.setState(prev => ({
              apiErrors: { ...prev.apiErrors, [propName]: error },
              apiLoading: { ...prev.apiLoading, [propName]: false }
            }));
            
            throw error;
          }
        };
      };
      
      // 批量调用API
      batchCallApis = async (calls, options = {}) => {
        this.setState({ batchLoading: true, batchError: null });
        
        try {
          const results = await apiService.batchCallApis(calls, options.parallel);
          
          // 更新状态
          const newData = {};
          const newErrors = {};
          
          results.forEach(({ key, response, error }) => {
            if (error) {
              newErrors[key] = error;
            } else {
              newData[key] = response;
            }
          });
          
          this.setState(prev => ({
            apiData: { ...prev.apiData, ...newData },
            apiErrors: { ...prev.apiErrors, ...newErrors },
            batchLoading: false
          }));
          
          return results;
        } catch (error) {
          this.setState({
            batchLoading: false,
            batchError: error
          });
          
          throw error;
        }
      };
      
      render() {
        const apiProps = {
          apiData: this.state.apiData,
          apiLoading: this.state.apiLoading,
          apiErrors: this.state.apiErrors,
          batchLoading: this.state.batchLoading,
          batchError: this.state.batchError,
          batchCallApis: this.batchCallApis,
          ...this.apiCallers
        };
        
        return <WrappedComponent {...this.props} {...apiProps} />;
      }
    }
    
    return WithApiComponent;
  };
}

/**
 * 为类组件提供单个API调用功能的高阶组件
 * @param {string} apiKey - API键名
 * @param {string} propName - 属性名
 * @returns {Function} - 返回高阶组件
 */
export function withSingleApi(apiKey, propName = 'api') {
  return withApi({ [propName]: apiKey });
}

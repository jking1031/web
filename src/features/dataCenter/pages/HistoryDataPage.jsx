import React, { useState } from 'react';
import { Typography, message, Breadcrumb } from 'antd';
import { HomeOutlined, DatabaseOutlined, HistoryOutlined } from '@ant-design/icons';
import HistoryDataQueryBuilder from '../components/HistoryDataQueryBuilder';
import HistoryDataResults from '../components/HistoryDataResults';
import apiManager from '../../../services/api/core/apiManager';

const { Title } = Typography;

/**
 * 历史数据查询页面
 * 集成查询构建器和结果显示组件
 */
const HistoryDataPage = () => {
  const [queryResults, setQueryResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryInfo, setQueryInfo] = useState(null);

  // 执行查询
  const handleQuerySubmit = async (queryData) => {
    setLoading(true);
    setError(null);
    setQueryInfo(queryData);
    
    try {
      console.log('执行查询:', queryData);
      
      const response = await apiManager.call('queryHistoryData', {
        table: queryData.table,
        query: queryData.query,
        sql: queryData.sql
      }, {
        showError: true
      });
      
      if (response && response.success && Array.isArray(response.data)) {
        setQueryResults(response.data);
        
        if (response.data.length === 0) {
          message.info('查询未返回任何结果');
        } else {
          message.success(`查询成功，返回 ${response.data.length} 条记录`);
        }
      } else {
        throw new Error(response?.message || '查询失败');
      }
    } catch (error) {
      console.error('查询历史数据失败:', error);
      setError(error.message || '查询历史数据失败，请检查查询条件或稍后重试');
      message.error('查询历史数据失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px 24px' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item href="/">
          <HomeOutlined />
          <span>首页</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/data-center">
          <DatabaseOutlined />
          <span>数据中心</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <HistoryOutlined />
          <span>历史数据</span>
        </Breadcrumb.Item>
      </Breadcrumb>
      
      
      <HistoryDataQueryBuilder onQuerySubmit={handleQuerySubmit} />
      
      <HistoryDataResults 
        data={queryResults} 
        loading={loading} 
        error={error}
        queryInfo={queryInfo}
      />
    </div>
  );
};

export default HistoryDataPage; 
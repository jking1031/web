import React, { useState, useEffect } from 'react';
import { Card, List, Button, Space, Tag, message, Input, Empty, Skeleton, Tooltip } from 'antd';
import { SearchOutlined, FormOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { formService } from '../services/formService';
import styles from '../styles/FormModule.module.scss';

const { Search } = Input;

/**
 * 表单填报入口页面
 * 用户可以查看并填写已发布的表单
 */
const FormList = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredForms, setFilteredForms] = useState([]);
  const navigate = useNavigate();

  // 加载表单列表
  useEffect(() => {
    loadForms();
  }, []);

  // 根据搜索条件过滤表单
  useEffect(() => {
    if (searchValue) {
      const filtered = forms.filter(form => 
        form.title.toLowerCase().includes(searchValue.toLowerCase()) || 
        (form.description && form.description.toLowerCase().includes(searchValue.toLowerCase()))
      );
      setFilteredForms(filtered);
    } else {
      setFilteredForms(forms);
    }
  }, [searchValue, forms]);

  // 从服务器获取表单列表
  const loadForms = async () => {
    setLoading(true);
    try {
      console.log('正在获取表单列表...');
      const response = await formService.getForms();
      
      console.log('表单列表API响应:', response);
      
      if (response.success) {
        // 只显示状态为active的表单
        const activeForms = (response.data || []).filter(form => form.status === 'active');
        console.log(`获取到${activeForms.length}个活跃表单`);
        
        setForms(activeForms);
        setFilteredForms(activeForms);
        
        if (activeForms.length === 0) {
          message.info('暂无可用表单');
        }
      } else {
        message.error(response.message || '加载表单列表失败');
        console.error('加载表单列表失败:', response.message);
      }
    } catch (error) {
      console.error('加载表单列表错误:', error);
      message.error('加载表单列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 重试加载表单列表
  const handleRetry = () => {
    message.info('正在重新加载表单列表...');
    loadForms();
  };

  // 处理表单填写
  const handleFillForm = (id) => {
    navigate(`/forms/preview/${id}`);
  };

  // 处理搜索
  const handleSearch = (value) => {
    setSearchValue(value);
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className={styles['form-list']}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FormOutlined /> 表单填报
          </div>
        }
        extra={
          <Search
            placeholder="搜索表单名称或描述"
            onSearch={handleSearch}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
        }
      >
        <Skeleton loading={loading} active paragraph={{ rows: 4 }}>
          {filteredForms.length === 0 ? (
            <Empty 
              description="暂无可填写的表单" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" onClick={handleRetry}>
                重新加载
              </Button>
            </Empty>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={filteredForms}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      onClick={() => handleFillForm(item.id)}
                      icon={<FormOutlined />}
                    >
                      填写表单
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={<a onClick={() => handleFillForm(item.id)}>{item.title}</a>}
                    description={
                      <div>
                        <p>{item.description || '暂无描述'}</p>
                        <Space size="middle" style={{ marginTop: '8px' }}>
                          <Tooltip title="发布时间">
                            <Tag icon={<CalendarOutlined />} color="blue">
                              {formatDate(item.createdAt)}
                            </Tag>
                          </Tooltip>
                          {item.updatedAt && (
                            <Tooltip title="最近更新">
                              <Tag icon={<ClockCircleOutlined />} color="green">
                                {formatDate(item.updatedAt)}
                              </Tag>
                            </Tooltip>
                          )}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
              pagination={{
                pageSize: 8,
                showTotal: (total) => `共 ${total} 项`,
                showSizeChanger: true,
                pageSizeOptions: ['8', '16', '24'],
              }}
            />
          )}
        </Skeleton>
      </Card>
    </div>
  );
};

export default FormList; 
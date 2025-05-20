import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Badge, Spin, Empty, message, Statistic, Typography, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  WarningOutlined,
  DashboardOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../../../api/interceptors';
import { ApiEditorButton } from '../../../components/ApiEditor';
import apiManager from '../../../services/apiManager';
import styles from './SiteList.module.scss';

const { Title } = Typography;

/**
 * 站点列表页面组件
 * @returns {JSX.Element} 站点列表页面
 */
const SiteList = () => {
  const [sites, setSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  // 获取站点列表
  const fetchSites = async () => {
    setLoading(true);
    try {
      // 检查getSiteList API是否存在
      const siteListApi = apiManager.registry.get('getSiteList');

      if (!siteListApi) {
        console.warn('getSiteList API不存在，尝试注册');
        // 注册站点列表API
        apiManager.registry.register('getSiteList', {
          name: '获取站点列表',
          url: 'https://nodered.jzz77.cn:9003/api/site/sites',
          method: 'GET',
          category: 'system',
          status: 'enabled',
          description: '获取所有站点列表',
          timeout: 10000,
          retries: 1,
          cacheTime: 60000, // 60秒缓存
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // 将API注册到当前页面
        apiManager.registry.setPageApis('siteList', ['getSiteList']);
      }

      // 使用API管理系统调用getSiteList API
      const response = await apiManager.call('getSiteList', {}, {
        showError: true
      });

      console.log('站点列表API响应:', response);

      // 检查API调用是否成功
      if (response && response.success && Array.isArray(response.data)) {
        // 如果响应是标准格式且data是数组
        setSites(response.data);
        setFilteredSites(response.data);
      } else if (response && response.success && response.data) {
        // 如果响应是标准格式但data不是数组
        const data = response.data;
        if (Array.isArray(data)) {
          setSites(data);
          setFilteredSites(data);
        } else {
          console.warn('站点数据不是数组格式:', data);
          throw new Error('站点数据格式不正确');
        }
      } else if (response && Array.isArray(response)) {
        // 如果响应本身是数组
        setSites(response);
        setFilteredSites(response);
      } else {
        // 尝试从响应中提取有用的数据
        let siteData = null;

        if (response && typeof response === 'object') {
          // 查找响应中的数组属性
          for (const key in response) {
            if (Array.isArray(response[key])) {
              siteData = response[key];
              console.log(`从响应的 ${key} 属性中提取站点数据:`, siteData);
              break;
            }
          }
        }

        if (siteData) {
          setSites(siteData);
          setFilteredSites(siteData);
        } else {
          console.error('无法从响应中提取站点数据:', response);
          throw new Error(response?.error || '获取站点列表失败');
        }
      }
    } catch (error) {
      console.error('获取站点列表失败', error);
      message.error('获取站点列表失败');
      // 使用模拟数据
      const mockSites = getMockSiteData();
      setSites(mockSites);
      setFilteredSites(mockSites);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    // 等待API管理器初始化完成
    apiManager.waitForReady().then(ready => {
      if (ready) {
        // 注册站点列表API
        if (!apiManager.registry.get('getSiteList')) {
          apiManager.registry.register('getSiteList', {
            name: '获取站点列表',
            url: 'https://nodered.jzz77.cn:9003/api/site/sites',
            method: 'GET',
            category: 'system',
            status: 'enabled',
            description: '获取所有站点列表',
            timeout: 10000,
            retries: 1,
            cacheTime: 60000, // 60秒缓存
            headers: {
              'Content-Type': 'application/json'
            },
            // 添加转换函数，确保返回正确的格式
            transform: (data) => {
              // 如果数据已经是数组，直接返回
              if (Array.isArray(data)) {
                return data;
              }

              // 如果数据是对象，尝试提取数组
              if (data && typeof data === 'object') {
                // 查找对象中的数组属性
                for (const key in data) {
                  if (Array.isArray(data[key])) {
                    return data[key];
                  }
                }
              }

              // 如果无法提取数组，返回原始数据
              return data;
            }
          });
        }

        // 将API注册到当前页面
        apiManager.registry.setPageApis('siteList', ['getSiteList']);

        // 获取站点列表
        fetchSites();
      } else {
        setLoading(false);
        message.error('API管理器初始化失败');
      }
    });
  }, []);

  // 搜索站点
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchText(value);

    if (!value.trim()) {
      setFilteredSites(sites);
      return;
    }

    const filtered = sites.filter(site =>
      site.name.toLowerCase().includes(value.toLowerCase()) ||
      (site.address && site.address.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredSites(filtered);
  };

  // 点击站点卡片导航到详情页
  const handleSiteClick = (siteId) => {
    navigate(`/sites/${siteId}`);
  };


  // 获取状态对应的颜色
  const getStatusColor = (status) => {
    switch (status) {
      case '在线':
        return 'success';
      case '离线':
        return 'error';
      default:
        return 'default';
    }
  };

  // 获取告警对应的颜色
  const getAlarmColor = (alarm) => {
    switch (alarm) {
      case '设施正常':
        return 'success';
      case '设施停用':
        return 'warning';
      case '设施故障':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div className={styles.siteListContainer}>
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <Title level={4} className={styles.pageTitle}>站点管理</Title>
          <div className={styles.actions}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchSites}
              loading={loading}
              className={styles.actionButton}
            />
            <ApiEditorButton
              pageKey="siteList"
              tooltip="编辑站点API"
              className={styles.actionButton}
            />
          </div>
        </div>
        <Input
          className={styles.searchInput}
          placeholder="搜索站点名称或地址"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          allowClear
        />
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
        </div>
      ) : filteredSites.length > 0 ? (
        <Row gutter={[16, 16]} className={styles.siteGrid}>
          {filteredSites.map(site => (
            <Col xs={24} sm={12} md={8} lg={6} key={site.id}>
              <Card
                className={styles.siteCard}
                hoverable
                onClick={() => handleSiteClick(site.id)}
              >
                <div className={styles.siteContent}>
                  <div className={styles.siteName}>
                    {site.name}
                    <Badge
                      className={styles.statusBadge}
                      status={getStatusColor(site.status)}
                      text={site.status}
                    />
                  </div>

                  <div className={styles.siteLocation}>
                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                    {site.address || '暂无地址'}
                  </div>

                  <div className={styles.siteStats}>
                    <div>
                      <Tag color={getAlarmColor(site.alarm)}>
                        {site.alarm || '未知状态'}
                      </Tag>
                    </div>

                    {site.totalInflow !== null && (
                      <div className={styles.inflowData}>
                        <DashboardOutlined style={{ marginRight: 4 }} />
                        <span>{site.totalInflow.toFixed(2)} 吨</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.siteDepartments}>
                    <TeamOutlined style={{ marginRight: 4 }} />
                    <span>管理部门: {site.departments ? site.departments.length : 0}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="未找到站点" />
      )}
    </div>
  );
};

export default SiteList;
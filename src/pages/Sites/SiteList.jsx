import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Badge, Spin, Empty, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined } from '@ant-design/icons';
import api from '../../api/interceptors';
import styles from './SiteList.module.scss';

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
  
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await api.get('/api/sites');
        setSites(response.data);
        setFilteredSites(response.data);
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
    
    fetchSites();
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
      site.location.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSites(filtered);
  };
  
  // 点击站点卡片导航到详情页
  const handleSiteClick = (siteId) => {
    navigate(`/sites/${siteId}`);
  };
  
  // 获取模拟数据
  const getMockSiteData = () => {
    return [
      { id: 1, name: '华北水厂', location: '北京', deviceCount: 24, alarmCount: 2, online: true },
      { id: 2, name: '东方水处理厂', location: '上海', deviceCount: 18, alarmCount: 0, online: true },
      { id: 3, name: '西部污水处理中心', location: '成都', deviceCount: 12, alarmCount: 1, online: true },
      { id: 4, name: '南方水厂', location: '广州', deviceCount: 16, alarmCount: 0, online: false },
      { id: 5, name: '城东污水站', location: '杭州', deviceCount: 8, alarmCount: 3, online: true },
      { id: 6, name: '第二污水处理厂', location: '天津', deviceCount: 15, alarmCount: 0, online: true },
    ];
  };
  
  return (
    <div className={styles.siteListContainer}>
      <div className={styles.header}>
        <Input
          className={styles.searchInput}
          placeholder="搜索站点名称或位置"
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
                      status={site.online ? "success" : "error"} 
                      text={site.online ? "在线" : "离线"} 
                    />
                  </div>
                  <div className={styles.siteLocation}>{site.location}</div>
                  <div className={styles.siteStats}>
                    <div>设备数量: {site.deviceCount}</div>
                    <div>警报数量: 
                      <span className={site.alarmCount > 0 ? styles.alertCount : ''}>
                        {site.alarmCount}
                      </span>
                    </div>
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
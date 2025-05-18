import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Select, Tag, Space, Typography, Row, Col, Badge, Tooltip, message, DatePicker } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_ENDPOINTS } from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import styles from './Tickets.module.scss';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/**
 * 工单列表页面
 * @returns {JSX.Element} 工单列表页面组件
 */
const TicketList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [sites, setSites] = useState([]);
  const [siteFilter, setSiteFilter] = useState('all');

  // 获取站点列表
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.SITES);
        if (response.data) {
          setSites(response.data);
        }
      } catch (error) {
        console.error('获取站点列表失败:', error);
        
        // 使用模拟数据
        const mockSites = [
          { id: 1, name: '华北水厂' },
          { id: 2, name: '东方水处理厂' },
          { id: 3, name: '西部污水处理中心' },
          { id: 4, name: '南方水厂' },
        ];
        setSites(mockSites);
      }
    };
    
    fetchSites();
  }, []);

  // 获取工单列表
  useEffect(() => {
    fetchTickets();
  }, []);

  // 筛选工单
  useEffect(() => {
    filterTickets();
  }, [tickets, searchText, statusFilter, priorityFilter, dateRange, siteFilter]);

  // 获取工单列表
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.TICKETS);
      
      if (response.data) {
        setTickets(response.data);
      }
    } catch (error) {
      console.error('获取工单列表失败:', error);
      
      // 使用模拟数据
      const mockTickets = [];
      const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      const priorities = ['high', 'medium', 'low'];
      const types = ['maintenance', 'repair', 'inspection', 'emergency'];
      
      for (let i = 1; i <= 20; i++) {
        const createdAt = dayjs().subtract(Math.floor(Math.random() * 30), 'day');
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const completedAt = status === 'completed' ? createdAt.add(Math.floor(Math.random() * 5) + 1, 'day') : null;
        
        mockTickets.push({
          id: `TICKET-${1000 + i}`,
          title: `工单 #${1000 + i}: ${types[Math.floor(Math.random() * types.length)]} 任务`,
          description: `这是一个${types[Math.floor(Math.random() * types.length)]}工单，需要处理设备问题。`,
          status,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          site_id: Math.floor(Math.random() * 4) + 1,
          created_by: 'admin',
          assigned_to: Math.random() > 0.3 ? '张工' : null,
          created_at: createdAt.format('YYYY-MM-DD HH:mm:ss'),
          updated_at: createdAt.add(Math.floor(Math.random() * 3), 'day').format('YYYY-MM-DD HH:mm:ss'),
          completed_at: completedAt ? completedAt.format('YYYY-MM-DD HH:mm:ss') : null,
        });
      }
      
      setTickets(mockTickets);
    } finally {
      setLoading(false);
    }
  };

  // 筛选工单
  const filterTickets = () => {
    let filtered = [...tickets];
    
    // 搜索文本筛选
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.id.toLowerCase().includes(searchLower) || 
        ticket.title.toLowerCase().includes(searchLower) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchLower))
      );
    }
    
    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    // 优先级筛选
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    
    // 日期范围筛选
    if (dateRange && dateRange.length === 2) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(ticket => {
        const createdAt = dayjs(ticket.created_at);
        return createdAt.isAfter(startDate) && createdAt.isBefore(endDate);
      });
    }
    
    // 站点筛选
    if (siteFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.site_id.toString() === siteFilter);
    }
    
    setFilteredTickets(filtered);
  };

  // 处理搜索文本变化
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  // 处理状态筛选变化
  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  // 处理优先级筛选变化
  const handlePriorityFilterChange = (value) => {
    setPriorityFilter(value);
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // 处理站点筛选变化
  const handleSiteFilterChange = (value) => {
    setSiteFilter(value);
  };

  // 重置筛选条件
  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setDateRange(null);
    setSiteFilter('all');
  };

  // 刷新工单列表
  const refreshTickets = () => {
    fetchTickets();
  };

  // 创建新工单
  const createNewTicket = () => {
    navigate('/tickets/create');
  };

  // 查看工单详情
  const viewTicketDetail = (id) => {
    navigate(`/tickets/${id}`);
  };

  // 获取状态标签
  const getStatusTag = (status) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">待处理</Tag>;
      case 'in_progress':
        return <Tag color="blue">处理中</Tag>;
      case 'completed':
        return <Tag color="green">已完成</Tag>;
      case 'cancelled':
        return <Tag color="red">已取消</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 获取优先级标签
  const getPriorityTag = (priority) => {
    switch (priority) {
      case 'high':
        return <Tag color="red">高</Tag>;
      case 'medium':
        return <Tag color="orange">中</Tag>;
      case 'low':
        return <Tag color="green">低</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  // 获取站点名称
  const getSiteName = (siteId) => {
    const site = sites.find(site => site.id === siteId);
    return site ? site.name : `站点 ${siteId}`;
  };

  // 表格列定义
  const columns = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <a onClick={() => viewTicketDetail(text)}>{text}</a>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '站点',
      dataIndex: 'site_id',
      key: 'site_id',
      render: (siteId) => getSiteName(siteId),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => getPriorityTag(priority),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: '负责人',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (text) => text || <Text type="secondary">未分配</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => viewTicketDetail(record.id)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.ticketListContainer}>
      <Card className={styles.ticketListCard}>
        <div className={styles.headerRow}>
          <Title level={4}>工单管理</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={createNewTicket}
          >
            新建工单
          </Button>
        </div>
        
        <div className={styles.filterRow}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6} lg={6}>
              <Input 
                placeholder="搜索工单..." 
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={handleSearchChange}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="状态筛选"
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <Option value="all">全部状态</Option>
                <Option value="pending">待处理</Option>
                <Option value="in_progress">处理中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="优先级筛选"
                style={{ width: '100%' }}
                value={priorityFilter}
                onChange={handlePriorityFilterChange}
              >
                <Option value="all">全部优先级</Option>
                <Option value="high">高</Option>
                <Option value="medium">中</Option>
                <Option value="low">低</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4}>
              <Select
                placeholder="站点筛选"
                style={{ width: '100%' }}
                value={siteFilter}
                onChange={handleSiteFilterChange}
              >
                <Option value="all">全部站点</Option>
                {sites.map(site => (
                  <Option key={site.id} value={site.id.toString()}>{site.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={12} lg={6}>
              <Space>
                <RangePicker 
                  value={dateRange}
                  onChange={handleDateRangeChange}
                />
                <Tooltip title="重置筛选">
                  <Button 
                    icon={<FilterOutlined />} 
                    onClick={resetFilters}
                  />
                </Tooltip>
                <Tooltip title="刷新">
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={refreshTickets}
                  />
                </Tooltip>
              </Space>
            </Col>
          </Row>
        </div>
        
        <div className={styles.statsRow}>
          <Row gutter={16}>
            <Col xs={12} sm={6} md={6} lg={6}>
              <Card className={styles.statCard}>
                <Tooltip title="待处理工单数量">
                  <Badge count={filteredTickets.filter(t => t.status === 'pending').length} overflowCount={999}>
                    <div className={styles.statLabel}>待处理</div>
                  </Badge>
                </Tooltip>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6} lg={6}>
              <Card className={styles.statCard}>
                <Tooltip title="处理中工单数量">
                  <Badge count={filteredTickets.filter(t => t.status === 'in_progress').length} overflowCount={999} style={{ backgroundColor: '#1890ff' }}>
                    <div className={styles.statLabel}>处理中</div>
                  </Badge>
                </Tooltip>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6} lg={6}>
              <Card className={styles.statCard}>
                <Tooltip title="已完成工单数量">
                  <Badge count={filteredTickets.filter(t => t.status === 'completed').length} overflowCount={999} style={{ backgroundColor: '#52c41a' }}>
                    <div className={styles.statLabel}>已完成</div>
                  </Badge>
                </Tooltip>
              </Card>
            </Col>
            <Col xs={12} sm={6} md={6} lg={6}>
              <Card className={styles.statCard}>
                <Tooltip title="高优先级工单数量">
                  <Badge count={filteredTickets.filter(t => t.priority === 'high').length} overflowCount={999} style={{ backgroundColor: '#f5222d' }}>
                    <div className={styles.statLabel}>高优先级</div>
                  </Badge>
                </Tooltip>
              </Card>
            </Col>
          </Row>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredTickets} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default TicketList;

# ZZIOT Web端开发指南

## 项目概述

本文档为zziot1.5.3-25.4.5项目的Web端开发指南，目的是将现有移动端应用转换为Web应用，确保两端在功能和逻辑上完全一致，但针对Web平台优化UI和交互。

### 项目目标

- 严格按照移动端的逻辑和功能进行开发，确保功能完整性
- 适配Web端布局和交互方式，提供良好的桌面体验
- 保持与移动端相同的API调用和数据流
- 提供响应式设计，适配不同屏幕尺寸

## 技术栈选择

### 前端框架
- **React 18**: 使用React进行开发，与移动端保持一致的组件化思想
- **React Router**: 用于Web端路由管理，替代React Navigation
- **Axios**: 保持与移动端相同的API调用方式
- **Context API**: 使用相同的状态管理方式

### UI组件库
- **Ant Design**: 用于替代React Native组件，提供Web端良好的UI体验
- **Charts**: 使用ECharts或Recharts替代react-native-gifted-charts
- **SCSS/Less**: 用于样式管理，替代StyleSheet

### 构建工具
- **Vite**: 保留现有项目的构建工具
- **ESLint/Prettier**: 代码质量和格式化

## 项目结构

保持与移动端相同的目录结构，以确保逻辑一致性：

```
zziot-web/
├── public/                # 静态资源
├── src/
│   ├── api/               # API接口(保持相同结构)
│   ├── assets/            # 图片和图标资源
│   ├── components/        # 共享组件
│   ├── context/           # Context状态管理(保持相同结构)
│   ├── pages/             # 页面组件(对应移动端screens)
│   ├── styles/            # 样式文件
│   ├── utils/             # 工具函数
│   ├── App.jsx            # 根组件
│   ├── main.jsx           # 入口文件
│   └── router.jsx         # 路由配置
├── .eslintrc.js
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

## 路由设计

使用React Router替代React Navigation，保持相同的导航层次结构：

```jsx
// router.jsx
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SiteList from './pages/SiteList';
import SiteDetail from './pages/SiteDetail';
// 其他页面导入...

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/sites', element: <SiteList /> },
      { path: '/sites/:id', element: <SiteDetail /> },
      { path: '/data-center', element: <DataCenter /> },
      { path: '/data-query', element: <DataQuery /> },
      { path: '/carbon-calc', element: <CarbonCalc /> },
      { path: '/toolbox', element: <Toolbox /> },
      // 报表系统
      { path: '/reports', element: <Reports /> },
      { path: '/reports/5000', element: <ReportForm5000 /> },
      { path: '/reports/sludge', element: <ReportFormSludge /> },
      { path: '/reports/pump-station', element: <ReportFormPumpStation /> },
      { path: '/reports/form/:id', element: <ReportForm /> },
      // 化验数据
      { path: '/lab-data', element: <LabData /> },
      { path: '/lab-data/entry', element: <LabDataEntry /> },
      { path: '/lab-data/sludge', element: <SludgeDataEntry /> },
      { path: '/lab-data/ao', element: <AODataEntry /> },
      // 查询中心
      { path: '/query-center', element: <DataQueryCenter /> },
      { path: '/entry-center', element: <DataEntryCenter /> },
      { path: '/report-query', element: <ReportQuery /> },
      { path: '/dynamic-reports', element: <DynamicReports /> },
      { path: '/ao-data-query', element: <AODataQuery /> },
      { path: '/history-data', element: <HistoryDataQuery /> },
      { path: '/message-query', element: <MessageQuery /> },
      // 工单系统
      { path: '/tickets', element: <TicketList /> },
      { path: '/tickets/:id', element: <TicketDetail /> },
      { path: '/tickets/create', element: <CreateTicket /> },
      // 其他功能
      { path: '/file-upload', element: <FileUpload /> },
      { path: '/user-management', element: <UserManagement /> },
      // 计算器
      { path: '/calculators/pac', element: <PacCalculator /> },
      { path: '/calculators/pam', element: <PamCalculator /> },
      { path: '/calculators/dosing', element: <DosingCalculator /> },
      { path: '/calculators/sludge', element: <ExcessSludgeCalculator /> },
    ],
  },
  { path: '/login', element: <Login /> },
  // 其他独立路由...
]);

export default router;
```

## 样式和主题

1. 使用CSS变量实现亮色/暗色主题切换，保持与移动端相同的颜色方案：

```css
:root {
  /* 浅色主题变量 */
  --primary: #FF6700;
  --background: #F5F5F7;
  --card: #FFFFFF;
  --text: #1A1A1A;
  --text-secondary: #666666;
  --border: #E0E0E0;
}

[data-theme='dark'] {
  /* 深色主题变量 */
  --primary: #FF6700;
  --background: #121212;
  --card: #1E1E1E;
  --text: #FFFFFF;
  --text-secondary: #BBBBBB;
  --border: #333333;
}
```

2. 组件样式应遵循移动端的视觉设计语言，但适应Web端常见布局

## API和数据交互

1. 保持与移动端相同的API端点和请求结构
2. 使用Axios拦截器处理请求/响应，与移动端保持一致的错误处理逻辑
3. 使用localStorage替代AsyncStorage进行本地存储

```javascript
// api/config.js
export const BASE_URL = 'https://nodered.jzz77.cn:9003';
export const REQUEST_TIMEOUT = 10000;

// api/interceptors.js
import axios from 'axios';
import { BASE_URL, REQUEST_TIMEOUT } from './config';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 错误处理逻辑，与移动端保持一致
    return Promise.reject(error);
  }
);

export default api;
```

## 功能模块列表

根据移动端App.js分析，Web端需要实现以下功能模块：

### 1. 认证与用户管理
- 登录/注册系统
- 用户个人资料
- 权限控制
- 主题切换功能

### 2. 站点管理
- 站点列表浏览
- 站点详情查看
- 站点数据管理

### 3. 数据中心
- 历史数据查询
- 图表展示
- 数据导出功能

### 4. 报表系统
- 运行填报
- 5000吨处理厂日报
- 污泥车间日报
- 泵站运行周报
- 报告查询
- 动态报表

### 5. 化验数据管理
- 化验数据填写
- 污泥化验数据填报
- AO池数据填报
- 数据查询中心

### 6. 工单系统
- 工单列表查看
- 工单详情查看
- 创建新工单
- 工单状态跟踪
- 工单分配与处理

### 7. 计算器工具
- PAC稀释计算器
- PAM稀释计算器
- 脱水药剂投加计算器
- 剩余污泥计算器
- 碳源投加量计算

## 详细功能实现要求

### 1. 首页(Home)

功能需求：
- 显示系统概况统计数据
- 提供快捷导航到主要功能
- 显示警报和通知
- 支持自定义快捷方式
- 显示在线/离线设备统计

UI组件：
- 顶部导航栏
- 统计卡片网格
- 快捷方式列表
- 警报通知面板

API接口：
- `GET /api/stats/overview` - 获取系统概况数据

实现参考：
```jsx
// 参考HomeScreen中的统计卡片实现
const StatsCard = ({ title, value, icon, color }) => (
  <Card>
    <div className="stats-card">
      <div className="icon" style={{ backgroundColor: color }}>
        <i className={icon}></i>
      </div>
      <div className="content">
        <div className="value">{value}</div>
        <div className="title">{title}</div>
      </div>
    </div>
  </Card>
);
```

### 2. 站点管理

功能需求：
- 站点列表以卡片或表格形式展示
- 站点搜索和筛选功能
- 站点详情页显示设备状态、警报和工单
- 支持查看站点历史数据和趋势图表

UI组件：
- 站点列表组件
- 站点详情页面
- 设备状态指示器
- 数据趋势图表

API接口：
- `GET /api/sites` - 获取站点列表
- `GET /api/sites/:id` - 获取站点详情
- `GET /api/sites/:id/devices` - 获取站点设备列表
- `GET /api/sites/:id/alarms` - 获取站点警报
- `GET /api/sites/:id/data` - 获取站点数据

实现参考：
```jsx
// 参考SiteListScreen的列表视图
const SiteList = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await api.get('/api/sites');
        setSites(response.data);
      } catch (error) {
        message.error('获取站点列表失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSites();
  }, []);
  
  return (
    <div className="site-list-container">
      <div className="header">
        <h1>站点列表</h1>
        <Input.Search placeholder="搜索站点" />
      </div>
      
      {loading ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]}>
          {sites.map(site => (
            <Col xs={24} sm={12} md={8} lg={6} key={site.id}>
              <Card
                hoverable
                onClick={() => navigate(`/sites/${site.id}`)}
              >
                <div className="site-card">
                  <div className="site-name">{site.name}</div>
                  <div className="site-status">
                    <Badge status={site.online ? "success" : "error"} />
                    {site.online ? "在线" : "离线"}
                  </div>
                  <div className="site-info">
                    <div>设备数量: {site.deviceCount}</div>
                    <div>警报数量: {site.alarmCount}</div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};
```

### 3. 数据中心

功能需求：
- 历史数据查询界面，支持多种筛选条件
- 数据展示为表格和图表形式
- 支持数据导出为Excel
- 支持多维度数据比较

UI组件：
- 日期范围选择器
- 高级筛选表单
- 数据表格
- 可交互图表
- 导出按钮

API接口：
- `GET /api/data/query` - 查询历史数据
- `POST /api/data/export` - 导出数据

实现参考：
```jsx
// 参考DataQueryScreen的查询表单
const DataQuery = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async (values) => {
    setLoading(true);
    try {
      const response = await api.get('/api/data/query', {
        params: {
          ...values,
          startDate: values.dateRange[0].format('YYYY-MM-DD'),
          endDate: values.dateRange[1].format('YYYY-MM-DD'),
        },
      });
      setData(response.data);
    } catch (error) {
      message.error('查询数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = async () => {
    // 导出逻辑
  };
  
  return (
    <div className="data-query-container">
      <Card className="query-form">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="dateRange"
                label="日期范围"
                rules={[{ required: true, message: '请选择日期范围' }]}
              >
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="siteId"
                label="站点"
              >
                <Select placeholder="选择站点">
                  {/* 站点选项 */}
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="dataType"
                label="数据类型"
              >
                <Select placeholder="选择数据类型">
                  {/* 数据类型选项 */}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <div className="form-actions">
            <Button type="primary" htmlType="submit" loading={loading}>
              查询
            </Button>
            <Button onClick={handleExport} disabled={data.length === 0}>
              导出Excel
            </Button>
          </div>
        </Form>
      </Card>
      
      {data.length > 0 && (
        <>
          <Card className="data-chart">
            {/* 使用ECharts或Recharts实现图表 */}
          </Card>
          
          <Card className="data-table">
            <Table
              columns={/* 定义表格列 */}
              dataSource={data}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </Card>
        </>
      )}
    </div>
  );
};
```

### 4. 工单系统

功能需求：
- 符合README.md中描述的完整工单流程
- 工单创建、审核、分配、处理和关闭
- 工单列表支持多种筛选和排序
- 工单详情页支持添加评论和状态更新
- 工单统计报表

UI组件：
- 工单列表表格
- 工单详情面板
- 评论系统
- 状态流程指示器
- 创建工单表单

API接口：
- `GET /api/tickets` - 获取工单列表
- `GET /api/tickets/:id` - 获取工单详情
- `POST /api/tickets` - 创建新工单
- `PATCH /api/tickets/:id/status` - 更新工单状态
- `POST /api/tickets/:id/comments` - 添加工单评论
- `PATCH /api/tickets/:id/assign` - 分配工单

实现参考：
```jsx
// 工单详情组件
const TicketDetail = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await api.get(`/api/tickets/${id}`);
        setTicket(response.data);
      } catch (error) {
        message.error('获取工单详情失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTicket();
  }, [id]);
  
  const handleStatusChange = async (newStatus) => {
    try {
      await api.patch(`/api/tickets/${id}/status`, { status: newStatus });
      message.success('状态更新成功');
      // 刷新工单数据
    } catch (error) {
      message.error('状态更新失败');
    }
  };
  
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      await api.post(`/api/tickets/${id}/comments`, { content: commentText });
      setCommentText('');
      message.success('评论添加成功');
      // 刷新工单数据
    } catch (error) {
      message.error('评论添加失败');
    }
  };
  
  if (loading) return <Spin />;
  if (!ticket) return <Empty description="工单不存在" />;
  
  return (
    <div className="ticket-detail-container">
      <div className="header">
        <h1>{ticket.title}</h1>
        <Tag color={getStatusColor(ticket.status)}>
          {getStatusText(ticket.status)}
        </Tag>
      </div>
      
      <Row gutter={24}>
        <Col span={16}>
          <Card title="工单详情">
            <div className="ticket-info">
              <p className="description">{ticket.description}</p>
              
              <Divider />
              
              <div className="meta-info">
                <div className="meta-item">
                  <span className="label">创建者:</span>
                  <span>{ticket.creator.name}</span>
                </div>
                <div className="meta-item">
                  <span className="label">创建时间:</span>
                  <span>{formatDate(ticket.createdAt)}</span>
                </div>
                <div className="meta-item">
                  <span className="label">分类:</span>
                  <span>{ticket.category}</span>
                </div>
                <div className="meta-item">
                  <span className="label">优先级:</span>
                  <span className={`priority ${ticket.priority}`}>
                    {getPriorityText(ticket.priority)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
          
          <Card title="工单评论" className="comments-card">
            {ticket.comments.length > 0 ? (
              <Timeline>
                {ticket.comments.map(comment => (
                  <Timeline.Item key={comment.id}>
                    <div className="comment">
                      <div className="comment-header">
                        <span className="author">{comment.author.name}</span>
                        <span className="time">{formatDate(comment.createdAt)}</span>
                      </div>
                      <div className="comment-content">{comment.content}</div>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="暂无评论" />
            )}
            
            <div className="comment-form">
              <Input.TextArea
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="添加评论..."
              />
              <Button
                type="primary"
                onClick={handleAddComment}
                disabled={!commentText.trim()}
              >
                提交评论
              </Button>
            </div>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="工单状态">
            <Steps
              direction="vertical"
              current={getStatusStep(ticket.status)}
              className="status-steps"
            >
              <Steps.Step title="待审核" description={/* 相关信息 */} />
              <Steps.Step title="已审核" description={/* 相关信息 */} />
              <Steps.Step title="已分配" description={/* 相关信息 */} />
              <Steps.Step title="处理中" description={/* 相关信息 */} />
              <Steps.Step title="已完成" description={/* 相关信息 */} />
              <Steps.Step title="已关闭" description={/* 相关信息 */} />
            </Steps>
            
            {/* 状态操作按钮，根据用户角色和当前状态显示不同按钮 */}
            <div className="status-actions">
              {renderStatusActions(ticket, handleStatusChange)}
            </div>
          </Card>
          
          <Card title="分配信息" className="assign-card">
            {ticket.assignedTo ? (
              <div className="assigned-info">
                <div className="assignee">
                  <UserOutlined />
                  <span>{ticket.assignedTo.name}</span>
                </div>
                <div className="assign-time">
                  分配时间: {formatDate(ticket.assignedAt)}
                </div>
              </div>
            ) : (
              <Empty description="未分配" />
            )}
            
            {/* 分配操作，仅管理员可见 */}
            {isAdmin && (
              <div className="assign-actions">
                <Button type="primary">分配工单</Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

### 5. 报表和数据填报

功能需求：
- 多种报表表单，与移动端保持一致
- 表单验证和数据保存
- 历史报表查询
- 报表打印和导出

UI组件：
- 动态表单生成器
- 数据验证提示
- 数据导出组件
- 表单填写向导

API接口：
- `POST /api/reports` - 提交报表
- `GET /api/reports` - 获取报表列表
- `GET /api/reports/:id` - 获取报表详情
- `GET /api/reports/templates` - 获取报表模板

实现参考：
```jsx
// 报表表单组件
const ReportForm = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await api.get(`/api/reports/templates/${id}`);
        setTemplate(response.data);
        // 预填充表单默认值
        form.setFieldsValue(response.data.defaultValues || {});
      } catch (error) {
        message.error('获取报表模板失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [id, form]);
  
  const handleSubmit = async (values) => {
    try {
      await api.post('/api/reports', {
        templateId: id,
        data: values,
      });
      message.success('报表提交成功');
      // 导航到报表列表
    } catch (error) {
      message.error('报表提交失败');
    }
  };
  
  if (loading) return <Spin />;
  if (!template) return <Empty description="报表模板不存在" />;
  
  return (
    <div className="report-form-container">
      <Card title={template.title}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {template.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="form-section">
              <h3 className="section-title">{section.title}</h3>
              
              {section.fields.map((field, fieldIndex) => {
                const fieldKey = `${section.key}_${field.key}`;
                
                // 根据字段类型渲染不同的表单控件
                let formItem;
                
                switch (field.type) {
                  case 'text':
                    formItem = <Input placeholder={field.placeholder} />;
                    break;
                  case 'number':
                    formItem = <InputNumber min={field.min} max={field.max} />;
                    break;
                  case 'select':
                    formItem = (
                      <Select placeholder={field.placeholder}>
                        {field.options.map(option => (
                          <Select.Option key={option.value} value={option.value}>
                            {option.label}
                          </Select.Option>
                        ))}
                      </Select>
                    );
                    break;
                  case 'date':
                    formItem = <DatePicker style={{ width: '100%' }} />;
                    break;
                  case 'textarea':
                    formItem = <Input.TextArea rows={4} placeholder={field.placeholder} />;
                    break;
                  default:
                    formItem = <Input />;
                }
                
                return (
                  <Form.Item
                    key={fieldKey}
                    name={fieldKey}
                    label={field.label}
                    rules={field.rules || []}
                  >
                    {formItem}
                  </Form.Item>
                );
              })}
            </div>
          ))}
          
          <div className="form-actions">
            <Button type="primary" htmlType="submit">
              提交报表
            </Button>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
```

### 6. 计算器工具

功能需求：
- 与移动端保持一致的计算器功能
- 响应式布局，适配不同屏幕尺寸
- 实时计算和结果显示
- 可选择保存结果

UI组件：
- 输入表单
- 结果展示面板
- 计算按钮
- 保存按钮

实现参考：
```jsx
// PAC计算器组件
const PacCalculator = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState(null);
  
  const handleCalculate = (values) => {
    // 实现与移动端相同的计算逻辑
    const { concentration, targetVolume, targetConcentration } = values;
    
    const requiredAmount = (targetVolume * targetConcentration) / concentration;
    const waterAmount = targetVolume - requiredAmount;
    
    setResult({
      requiredAmount: requiredAmount.toFixed(2),
      waterAmount: waterAmount.toFixed(2),
    });
  };
  
  const handleSave = async () => {
    if (!result) return;
    
    try {
      await api.post('/api/calculations/save', {
        type: 'pac',
        input: form.getFieldsValue(),
        result,
      });
      message.success('计算结果已保存');
    } catch (error) {
      message.error('保存失败');
    }
  };
  
  return (
    <div className="calculator-container">
      <h1>PAC稀释计算器</h1>
      
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Card title="输入参数">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                concentration: 30,
                targetVolume: 100,
                targetConcentration: 10,
              }}
            >
              <Form.Item
                name="concentration"
                label="原液浓度 (%)"
                rules={[{ required: true, message: '请输入原液浓度' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="targetVolume"
                label="目标体积 (L)"
                rules={[{ required: true, message: '请输入目标体积' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="targetConcentration"
                label="目标浓度 (%)"
                rules={[{ required: true, message: '请输入目标浓度' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
              
              <Button type="primary" htmlType="submit" block>
                计算
              </Button>
            </Form>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="计算结果">
            {result ? (
              <div className="result-container">
                <div className="result-item">
                  <span className="label">所需PAC原液:</span>
                  <span className="value">{result.requiredAmount} L</span>
                </div>
                
                <div className="result-item">
                  <span className="label">所需添加水量:</span>
                  <span className="value">{result.waterAmount} L</span>
                </div>
                
                <div className="actions">
                  <Button type="primary" onClick={handleSave}>
                    保存结果
                  </Button>
                </div>
              </div>
            ) : (
              <Empty description="请输入参数并点击计算" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

## 技术实现注意事项

1. **响应式布局**：Web端需要适配不同屏幕尺寸，从桌面到平板设备
   ```css
   /* 示例响应式布局 */
   .container {
     padding: 20px;
   }
   
   @media (max-width: 768px) {
     .container {
       padding: 10px;
     }
   }
   ```

2. **表单组件转换**：
   - React Native的`Picker`组件转换为HTML的`select`或Ant Design的`Select`
   - `TextInput`转换为`input`或Ant Design的`Input`
   - `Modal`转换为Ant Design的`Modal`组件

3. **导航转换**：
   - 底部标签导航可转换为顶部或侧边导航栏
   - 堆栈导航转换为嵌套路由

4. **图表适配**：
   - 将react-native-gifted-charts替换为ECharts或Recharts
   - 保持相同的数据展示逻辑和交互功能

5. **API兼容**：
   - 保持与移动端相同的API调用结构
   - 使用相同的请求参数和响应格式

6. **状态管理**：
   - 继续使用Context API进行状态管理
   - 保持相同的状态逻辑和数据流

7. **主题系统**：
   - 实现与移动端相同的亮色/暗色主题切换
   - 保持相同的颜色方案和视觉设计语言

8. **权限控制**：
   - 实现与移动端相同的权限管理机制
   - 根据用户角色控制页面访问和操作权限

## 开发流程建议

1. **环境搭建**：
   - 设置Vite + React项目
   - 配置路由和基础组件
   - 集成样式系统和主题支持

2. **布局实现**：
   - 实现页面布局和导航
   - 构建可复用的UI组件
   - 适配响应式设计

3. **功能开发**：
   - 按功能模块分批实现
   - 优先实现核心功能(认证、站点管理、数据查询)
   - 逐步添加其他功能模块

4. **API集成**：
   - 实现API服务和拦截器
   - 连接后端接口
   - 处理数据加载和错误状态

5. **测试与优化**：
   - 功能测试确保与移动端一致
   - 性能优化
   - 跨浏览器兼容性测试

## 总结

本文档提供了zziot系统Web端开发的完整指南，包括技术栈选择、项目结构、路由设计、样式主题、功能模块及其实现要求。开发团队应严格按照本指南进行开发，确保Web端与移动端在功能和逻辑上保持一致，同时充分利用Web平台的优势提供更好的用户体验。 
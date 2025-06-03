import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Space,
  message,
  Upload,
  Breadcrumb,
  Typography,
  Divider,
  Tooltip,
  Modal,
  Alert,
  Spin,
  Empty,
  Checkbox,
  Switch,
  Drawer,
  Avatar,
  Tag,
  Row,
  Col,
  App,
  List,
  Progress,
} from 'antd';
import {
  LoginOutlined,
  FolderOutlined,
  FileOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FolderAddOutlined,
  HomeOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SettingOutlined,
  CloudOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { saveAs } from 'file-saver';
import webdavService from '../../services/webdav';
import './WebDAVFileManager.scss';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

/**
 * WebDAV文件管理器组件
 * 支持连接Nextcloud等WebDAV服务，进行文件浏览、上传和下载
 */
const WebDAVFileManager = () => {
  // 创建连接表单和设置表单实例
  const [connectionForm] = Form.useForm();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [webdavStatus, setWebdavStatus] = useState({
    configured: false,
    server: '',
    username: '',
    hasPassword: false,
  });
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingStatus, setUploadingStatus] = useState(false);
  const connectionRef = useRef(null);

  // 尝试从localStorage加载保存的连接信息
  useEffect(() => {
    const savedConnection = localStorage.getItem('webdav_connection');
    if (savedConnection) {
      try {
        const connectionData = JSON.parse(savedConnection);
        const { server, username, password, remember } = connectionData;
        
        if (remember) {
          // 设置表单字段
          connectionForm.setFieldsValue({
            server,
            username,
            password,
            remember,
          });
          
          // 更新WebDAV状态
          setWebdavStatus({
            configured: true,
            server,
            username,
            hasPassword: !!password,
          });
        }
      } catch (error) {
        console.error('无法加载保存的连接信息', error);
      }
    }
  }, [connectionForm]);

  // 添加页面关闭时断开连接的机制
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (connected) {
        setConnected(false);
        // 通知服务器断开连接
        try {
          webdavService.disconnect && webdavService.disconnect();
        } catch (error) {
          console.error('断开连接失败', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, [connected]);

  // 连接到WebDAV服务器
  const handleConnect = async (values) => {
    try {
      setConnecting(true);
      const { server, username, password, remember } = values || {};
      
      // 安全检查，确保server存在
      if (!server) {
        message.error('服务器地址不能为空');
        setConnecting(false);
        return;
      }
      
      // 确保server URL格式正确
      const serverUrl = server.endsWith('/') ? server : `${server}/`;
      
      // 初始化WebDAV客户端
      await webdavService.init(serverUrl, username, password);
      setConnected(true);
      setCurrentPath('');
      setPathHistory([]);
      
      // 保存连接信息到localStorage
      if (remember) {
        localStorage.setItem('webdav_connection', JSON.stringify(values));
        
        // 更新WebDAV状态
        setWebdavStatus({
          configured: true,
          server: serverUrl,
          username,
          hasPassword: !!password,
        });
      } else {
        localStorage.removeItem('webdav_connection');
      }
      
      // 加载根目录文件
      await loadFiles('');
      message.success('连接成功');
    } catch (error) {
      console.error('连接失败', error);
      message.error('连接失败，请检查服务器地址和凭据');
    } finally {
      setConnecting(false);
    }
  };

  // 加载指定目录的文件
  const loadFiles = async (path) => {
    try {
      setLoading(true);
      const items = await webdavService.listDirectory(path);
      
      // 后处理文件列表，确保文件名正确显示
      const processedItems = items.map(item => {
        // 尝试修复文件名
        let displayName = item.name;
        try {
          // 过滤掉文件名中的非法字符
          displayName = displayName.replace(/[\uFFFD\uFEFF]/g, '');
          
          // 尝试使用decodeURIComponent解决URL编码问题
          if (displayName.includes('%')) {
            try {
              const decoded = decodeURIComponent(displayName);
              displayName = decoded;
            } catch (e) {
              // 解码失败，保留原始文件名
            }
          }
          
          // 如果文件名很长且包含无法识别的字符，截断它
          if (displayName.length > 100) {
            const ext = displayName.split('.').pop();
            if (ext && ext.length < 10) {
              displayName = displayName.substring(0, 50) + '...' + '.' + ext;
            } else {
              displayName = displayName.substring(0, 50) + '...';
            }
          }
        } catch (e) {
          console.warn('处理文件名失败:', e);
        }
        
        return {
          ...item,
          displayName
        };
      });
      
      setFiles(processedItems);
      setCurrentPath(path);
    } catch (error) {
      console.error('加载文件失败', error);
      message.error('加载文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 导航到子目录
  const navigateToFolder = (path, folderName) => {
    const newPath = path ? `${path}/${folderName}` : folderName;
    setPathHistory([...pathHistory, currentPath]);
    loadFiles(newPath);
  };

  // 返回上一级目录
  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, pathHistory.length - 1));
      loadFiles(previousPath);
    }
  };

  // 返回根目录
  const navigateToRoot = () => {
    setPathHistory([]);
    loadFiles('');
  };

  // 下载文件
  const downloadFile = async (path, fileName) => {
    try {
      setLoading(true);
      const fileData = await webdavService.downloadFile(`${path}/${fileName}`);
      saveAs(fileData, fileName);
      message.success(`文件 ${fileName} 下载成功`);
    } catch (error) {
      console.error('下载文件失败', error);
      message.error(`下载文件 ${fileName} 失败`);
    } finally {
      setLoading(false);
    }
  };

  // 删除文件或目录
  const deleteItem = async (path, name, isDirectory) => {
    Modal.confirm({
      title: `确定要删除${isDirectory ? '目录' : '文件'} ${name} 吗？`,
      content: isDirectory ? '删除目录将同时删除其中的所有文件和子目录，此操作不可恢复。' : '此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          await webdavService.delete(`${path}/${name}`);
          message.success(`${isDirectory ? '目录' : '文件'} ${name} 已删除`);
          loadFiles(currentPath); // 重新加载当前目录
        } catch (error) {
          console.error('删除失败', error);
          message.error(`删除${isDirectory ? '目录' : '文件'} ${name} 失败`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // 创建新文件夹
  const createFolder = async () => {
    if (!newFolderName.trim()) {
      message.warning('请输入文件夹名称');
      return;
    }
    
    try {
      setLoading(true);
      const folderPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
      await webdavService.createDirectory(folderPath);
      setCreateFolderVisible(false);
      setNewFolderName('');
      message.success(`文件夹 ${newFolderName} 创建成功`);
      loadFiles(currentPath); // 重新加载当前目录
    } catch (error) {
      console.error('创建文件夹失败', error);
      message.error(`创建文件夹 ${newFolderName} 失败`);
    } finally {
      setLoading(false);
    }
  };

  // 处理文件上传
  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      message.warning('请选择要上传的文件');
      return;
    }
    
    try {
      setLoading(true);
      setUploadingStatus(true);
      let successCount = 0;
      let failedFiles = [];
      
      for (const file of uploadFiles) {
        try {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { percent: 0, status: 'active' }
          }));
          
          await webdavService.uploadFile(
            currentPath, 
            file, 
            (percent, uploaded, total) => {
              setUploadProgress(prev => ({
                ...prev,
                [file.name]: { 
                  percent, 
                  status: percent === 100 ? 'success' : 'active',
                  uploaded,
                  total
                }
              }));
            }
          );
          
          successCount++;
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { percent: 100, status: 'success' }
          }));
        } catch (error) {
          console.error(`上传文件 ${file.name} 失败`, error);
          failedFiles.push(file.name);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { percent: 0, status: 'exception' }
          }));
        }
      }
      
      if (successCount === uploadFiles.length) {
        message.success('所有文件上传成功');
      } else if (successCount > 0) {
        message.warning(`已上传 ${successCount}/${uploadFiles.length} 个文件`);
        if (failedFiles.length > 0) {
          message.error(`上传失败的文件: ${failedFiles.join(', ')}`);
        }
      } else {
        message.error('文件上传失败');
      }
      
      // 不要立即关闭上传对话框，让用户可以看到上传进度和结果
      setTimeout(() => {
        setUploadModalVisible(false);
        setUploadFiles([]);
        setUploadProgress({});
        setUploadingStatus(false);
        loadFiles(currentPath); // 重新加载当前目录
      }, 1500);
    } catch (error) {
      console.error('上传文件失败', error);
      message.error('文件上传失败');
      setUploadingStatus(false);
    } finally {
      setLoading(false);
    }
  };

  // 处理上传文件列表变化
  const handleUploadChange = ({ fileList }) => {
    const files = fileList.map(file => file.originFileObj);
    setUploadFiles(files);
  };
  
  // 获取文件图标
  const getFileIcon = (fileName, isDirectory) => {
    if (isDirectory) {
      return <FolderOutlined className="nextcloud-folder-icon" />;
    }

    // 根据文件扩展名返回不同图标
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    // 文档类型
    if (['doc', 'docx', 'rtf', 'txt', 'odt'].includes(ext)) {
      return <FileOutlined className="nextcloud-file-icon document-icon" />;
    }
    
    // 表格类型
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return <FileOutlined className="nextcloud-file-icon spreadsheet-icon" />;
    }
    
    // 演示文稿
    if (['ppt', 'pptx', 'odp'].includes(ext)) {
      return <FileOutlined className="nextcloud-file-icon presentation-icon" />;
    }
    
    // PDF
    if (ext === 'pdf') {
      return <FileOutlined className="nextcloud-file-icon pdf-icon" />;
    }
    
    // 图片
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) {
      return <FileOutlined className="nextcloud-file-icon image-icon" />;
    }
    
    // 压缩文件
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileOutlined className="nextcloud-file-icon archive-icon" />;
    }
    
    // 代码文件
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'php', 'py', 'java', 'c', 'cpp', 'h', 'json', 'xml'].includes(ext)) {
      return <FileOutlined className="nextcloud-file-icon code-icon" />;
    }
    
    // Markdown
    if (ext === 'md') {
      return <FileOutlined className="nextcloud-file-icon markdown-icon" />;
    }

    // 默认文件图标
    return <FileOutlined className="nextcloud-file-icon" />;
  };
  
  // 获取文件类型描述
  const getFileType = (fileName, contentType, isDirectory) => {
    if (isDirectory) {
      return '文件夹';
    }
    
    if (contentType && contentType !== 'application/octet-stream') {
      // 尝试从content-type获取更友好的描述
      const mimeToType = {
        'text/plain': '文本文件',
        'text/html': 'HTML文件',
        'text/css': 'CSS文件',
        'text/javascript': 'JavaScript文件',
        'image/jpeg': 'JPEG图片',
        'image/png': 'PNG图片',
        'image/gif': 'GIF图片',
        'image/svg+xml': 'SVG图片',
        'application/pdf': 'PDF文档',
        'application/msword': 'Word文档',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word文档',
        'application/vnd.ms-excel': 'Excel表格',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel表格',
        'application/vnd.ms-powerpoint': 'PowerPoint演示文稿',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint演示文稿',
        'application/zip': 'ZIP压缩文件',
        'application/x-rar-compressed': 'RAR压缩文件',
        'text/markdown': 'Markdown文件'
      };
      
      // 尝试从MIME类型获取友好名称
      const friendlyType = mimeToType[contentType];
      if (friendlyType) {
        return friendlyType;
      }
    }
    
    // 根据文件扩展名返回类型
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    const extToType = {
      // 文档
      'doc': 'Word文档',
      'docx': 'Word文档',
      'rtf': 'RTF文档',
      'txt': '文本文件',
      'odt': 'OpenDocument文本',
      
      // 表格
      'xls': 'Excel表格',
      'xlsx': 'Excel表格',
      'csv': 'CSV表格',
      'ods': 'OpenDocument表格',
      
      // 演示文稿
      'ppt': 'PowerPoint演示文稿',
      'pptx': 'PowerPoint演示文稿',
      'odp': 'OpenDocument演示文稿',
      
      // PDF
      'pdf': 'PDF文档',
      
      // 图片
      'jpg': 'JPEG图片',
      'jpeg': 'JPEG图片',
      'png': 'PNG图片',
      'gif': 'GIF图片',
      'bmp': 'BMP图片',
      'svg': 'SVG图片',
      
      // 压缩文件
      'zip': 'ZIP压缩文件',
      'rar': 'RAR压缩文件',
      '7z': '7Z压缩文件',
      'tar': 'TAR归档文件',
      'gz': 'GZIP压缩文件',
      
      // 代码文件
      'js': 'JavaScript文件',
      'jsx': 'React JSX文件',
      'ts': 'TypeScript文件',
      'tsx': 'React TSX文件',
      'html': 'HTML文件',
      'css': 'CSS文件',
      'scss': 'SCSS样式表',
      'php': 'PHP文件',
      'py': 'Python文件',
      'java': 'Java文件',
      'c': 'C语言文件',
      'cpp': 'C++文件',
      'h': 'C/C++头文件',
      'json': 'JSON数据文件',
      'xml': 'XML数据文件',
      
      // Markdown
      'md': 'Markdown文件'
    };
    
    return extToType[ext] || '未知';
  };

  // 表格列配置
  const columns = [
    {
      title: '名称',
      dataIndex: 'displayName',
      key: 'name',
      render: (text, record) => (
        <Space>
          {getFileIcon(record.name, record.isDirectory)}
          {record.isDirectory ? (
            <a onClick={() => navigateToFolder(currentPath, record.name)} className="nextcloud-link">{text}</a>
          ) : (
            <Tooltip title={record.name} placement="topLeft">
              <span>{text}</span>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
      render: (text, record) => getFileType(record.name, text, record.isDirectory),
      responsive: ['md'],
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size) => {
        if (size === 0) return '-';
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
        if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
        return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      },
      responsive: ['md'],
    },
    {
      title: '修改时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      render: (date) => date ? date.toLocaleString() : '-',
      responsive: ['lg'],
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          {!record.isDirectory && (
            <Tooltip title="下载">
              <Button
                icon={<DownloadOutlined />}
                size="small"
                type="text"
                className="nextcloud-action-button"
                onClick={() => downloadFile(currentPath, record.name)}
              />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              type="text"
              danger
              className="nextcloud-action-button"
              onClick={() => deleteItem(currentPath, record.name, record.isDirectory)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 渲染简化的用户连接页面
  const renderUserConnectionPage = () => (
    <div className="webdav-connect-simple">
      <Card className="webdav-welcome-card">
        <div className="webdav-welcome-content">
          <div className="webdav-welcome-header">
            <Avatar size={64} icon={<CloudOutlined />} className="webdav-avatar" />
            <Title level={2}>共享网盘</Title>
          </div>
          
          <Paragraph className="webdav-welcome-description">
            通过Nextcloud随时随地访问和共享您的文件、日历、联系人、邮件等。
          </Paragraph>

          {webdavStatus.configured && webdavStatus.server ? (
            <div className="webdav-status-configured">
              <Alert
                message="网盘已配置"
                description={
                  <div>
                    <p>
                      <strong>服务器:</strong> {webdavStatus.server || '未设置'}<br />
                      <strong>用户名:</strong> {webdavStatus.username || '未设置'}
                    </p>
                    <p>
                      {webdavStatus.hasPassword ? 
                        "点击下方按钮连接到共享网盘" : 
                        "请点击'修改配置'输入密码后连接到共享网盘"}
                    </p>
                  </div>
                }
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
              
              <div className="webdav-actions">
                <Button 
                  type="primary" 
                  icon={<LoginOutlined />} 
                  size="large"
                  onClick={() => {
                    // 如果配置了服务器信息，直接使用
                    if (webdavStatus.configured && webdavStatus.server) {
                      // 获取密码
                      const password = connectionForm.getFieldValue('password');
                      
                      // 如果没有密码，提示用户输入
                      if (!password) {
                        message.warning('请点击"修改配置"输入密码');
                        setSettingsDrawerVisible(true);
                        return;
                      }
                      
                      // 直接使用状态中的信息 + 表单中的密码
                      const connectionInfo = {
                        server: webdavStatus.server,
                        username: webdavStatus.username,
                        password: password,
                        remember: true
                      };
                      
                      // 连接网盘
                      handleConnect(connectionInfo);
                    } else {
                      message.error('网盘配置信息不完整，请点击"修改配置"设置');
                      setSettingsDrawerVisible(true);
                    }
                  }}
                  loading={connecting}
                >
                  连接到网盘
                </Button>
                
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setSettingsDrawerVisible(true)}
                >
                  修改配置
                </Button>
              </div>
            </div>
          ) : (
            <div className="webdav-status-not-configured">
              <Alert
                message="网盘未配置"
                description="请点击下方按钮配置您的共享网盘连接信息。"
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
              />
              
              <Button
                type="primary"
                icon={<SettingOutlined />}
                onClick={() => setSettingsDrawerVisible(true)}
                style={{ marginTop: 16 }}
              >
                配置网盘
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {/* 设置抽屉 */}
      <Drawer
        title="网盘配置"
        placement="right"
        onClose={() => setSettingsDrawerVisible(false)}
        open={settingsDrawerVisible}
        width={420}
        styles={{ body: { padding: '24px' } }}
      >
        <Form
          form={connectionForm}
          layout="vertical"
          onFinish={(values) => {
            handleConnect(values);
            setSettingsDrawerVisible(false);
          }}
          initialValues={{
            server: webdavStatus.server || '',
            username: webdavStatus.username || '',
            password: '',
            remember: true,
          }}
        >
          <Form.Item
            name="server"
            label="WebDAV服务器地址"
            rules={[{ required: true, message: '请输入WebDAV服务器地址' }]}
          >
            <Input 
              prefix={<HomeOutlined />} 
              placeholder="https://your-nextcloud.com/remote.php/dav/files/username/"
            />
          </Form.Item>
          
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="密码" 
              visibilityToggle={{ visible: showPassword, onVisibleChange: setShowPassword }}
              iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>
          
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住连接信息</Checkbox>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={connecting} block>
              保存配置并连接
            </Button>
          </Form.Item>
          
          <Divider />
          
          <Paragraph type="secondary">
            <Text strong>Nextcloud WebDAV地址示例:</Text><br />
            https://your-nextcloud.com/remote.php/dav/files/your-username/
          </Paragraph>
        </Form>
      </Drawer>
    </div>
  );

  // 渲染文件管理器
  const renderFileManager = () => (
    <div className="webdav-file-manager nextcloud-style">
      <Card
        title={
          <Space size="middle" className="nextcloud-header">
            <Avatar size="small" icon={<CloudOutlined />} className="nextcloud-logo" />
            <Title level={4}>共享网盘</Title>
            <Tag color="blue" className="connection-tag">
              {connectionForm.getFieldValue('server')}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button 
              onClick={() => setConnected(false)}
              icon={<LoginOutlined />}
              className="nextcloud-button"
            >
              断开连接
            </Button>
          </Space>
        }
        className="nextcloud-card"
      >
        {/* 导航栏 */}
        <div className="file-navigation">
          <Space wrap>
            <Breadcrumb
              items={[
                {
                  title: <a onClick={navigateToRoot} className="nextcloud-breadcrumb-home"><HomeOutlined /> 根目录</a>,
                },
                ...currentPath.split('/').filter(Boolean).map((segment, index, arr) => ({
                  title: index === arr.length - 1 ? segment : (
                    <a 
                      onClick={() => {
                        const path = arr.slice(0, index + 1).join('/');
                        loadFiles(path);
                      }}
                      className="nextcloud-breadcrumb-link"
                    >
                      {segment}
                    </a>
                  ),
                })),
              ]}
              className="nextcloud-breadcrumb"
            />
          </Space>
          
          <div className="file-actions">
            <Space wrap>
              <Button
                icon={<ArrowUpOutlined />}
                disabled={pathHistory.length === 0}
                onClick={navigateBack}
                className="nextcloud-action-button"
              >
                返回上级
              </Button>
              
              <Button
                icon={<SyncOutlined />}
                onClick={() => loadFiles(currentPath)}
                className="nextcloud-action-button"
              >
                刷新
              </Button>
              
              <Button
                icon={<FolderAddOutlined />}
                onClick={() => setCreateFolderVisible(true)}
                className="nextcloud-action-button"
              >
                新建文件夹
              </Button>
              
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
                className="nextcloud-upload-button"
              >
                上传文件
              </Button>
            </Space>
          </div>
        </div>
        
        <Divider style={{ margin: '12px 0' }} className="nextcloud-divider" />
        
        {/* 文件列表 */}
        <Spin spinning={loading} className="nextcloud-spinner">
          {files.length > 0 ? (
            <Table
              columns={columns}
              dataSource={files.map(file => ({ ...file, key: file.path }))}
              pagination={{ 
                pageSize: 15, 
                showSizeChanger: true, 
                showTotal: total => `共 ${total} 项`,
                className: "nextcloud-pagination"
              }}
              className="nextcloud-table"
              rowClassName="nextcloud-table-row"
            />
          ) : (
            <Empty description="当前目录为空" className="nextcloud-empty" />
          )}
        </Spin>
      </Card>
      
      {/* 新建文件夹对话框 */}
      <Modal
        title="新建文件夹"
        open={createFolderVisible}
        onOk={createFolder}
        onCancel={() => {
          setCreateFolderVisible(false);
          setNewFolderName('');
        }}
        okText="创建"
        cancelText="取消"
        className="nextcloud-modal"
      >
        <Input
          placeholder="请输入文件夹名称"
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          prefix={<FolderOutlined />}
          autoFocus
          className="nextcloud-input"
        />
      </Modal>
    </div>
  );

  // 修改上传文件对话框部分
  const renderUploadModal = () => (
    <Modal
      title="上传文件"
      open={uploadModalVisible}
      onOk={handleUpload}
      onCancel={() => {
        // 如果正在上传，不允许关闭
        if (uploadingStatus) {
          message.warning('文件上传中，请等待上传完成...');
          return;
        }
        setUploadModalVisible(false);
        setUploadFiles([]);
        setUploadProgress({});
      }}
      okText="上传"
      cancelText="取消"
      okButtonProps={{ 
        disabled: uploadFiles.length === 0 || uploadingStatus,
        loading: uploadingStatus
      }}
      cancelButtonProps={{ disabled: uploadingStatus }}
      className="nextcloud-modal"
      width={600}
    >
      <Dragger
        multiple
        beforeUpload={file => {
          // 不实际上传，只添加到列表
          return false;
        }}
        onChange={handleUploadChange}
        fileList={[]}
        disabled={uploadingStatus}
        className="nextcloud-upload"
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined className="nextcloud-upload-icon" />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p className="ant-upload-hint">
          支持单个或批量上传
        </p>
      </Dragger>
      
      {uploadFiles.length > 0 && (
        <div className="upload-file-list">
          <Divider plain>已选择 {uploadFiles.length} 个文件</Divider>
          <List
            size="small"
            dataSource={uploadFiles}
            renderItem={file => (
              <List.Item>
                <div className="upload-file-item">
                  <Space>
                    <FileOutlined />
                    <span className="upload-filename">{file.name}</span>
                  </Space>
                  {uploadProgress[file.name] && (
                    <Progress 
                      percent={uploadProgress[file.name].percent} 
                      size="small" 
                      status={uploadProgress[file.name].status}
                      style={{ marginLeft: 8, flex: 1 }}
                    />
                  )}
                </div>
              </List.Item>
            )}
            style={{ maxHeight: '200px', overflow: 'auto' }}
          />
        </div>
      )}
    </Modal>
  );

  return (
    <App>
      <div className="webdav-container">
        {connected ? (
          <>
            {renderFileManager()}
            {renderUploadModal()}
          </>
        ) : renderUserConnectionPage()}
      </div>
    </App>
  );
};

export default WebDAVFileManager; 
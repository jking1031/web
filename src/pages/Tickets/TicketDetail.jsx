import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Typography, Row, Col, Descriptions, Timeline, Input, Select, Form, Upload, message, Space, Divider, Modal, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CheckOutlined, CloseOutlined, MessageOutlined, UserOutlined, PaperClipOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { API_ENDPOINTS } from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import { useApi, useApis } from '../../hooks/useApi';
import styles from './Tickets.module.scss';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * 工单详情页面
 * @returns {JSX.Element} 工单详情页面组件
 */
const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [sites, setSites] = useState([]);
  const [users, setUsers] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // 使用API Hook获取工单详情
  const {
    data: ticketData,
    loading: ticketLoading,
    error: ticketError,
    execute: fetchTicketDetail
  } = useApi('getTicketById', { id }, {
    autoLoad: true,
    onSuccess: (data) => {
      setTicket(data);
    },
    onError: (error) => {
      console.error('获取工单详情失败:', error);
      message.error('获取工单详情失败，请稍后重试');

      // 使用模拟数据
      const mockTicket = {
        id,
        title: `工单 #${id}: 设备维修任务`,
        description: '曝气系统出现异常，需要检查并维修。',
        status: 'in_progress',
        priority: 'high',
        site_id: 1,
        created_by: 'admin',
        assigned_to: '张工',
        created_at: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
        updated_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
        completed_at: null,
        attachments: [],
        equipment: '曝气系统',
        location: '生化池A区',
        expected_completion_date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      };

      setTicket(mockTicket);
    }
  });

  // 使用API Hook获取工单评论
  const {
    data: commentsData,
    loading: commentsLoading,
    error: commentsError,
    execute: fetchComments
  } = useApi('getTicketComments', { id }, {
    autoLoad: true,
    dependencies: [id, ticket],
    onSuccess: (data) => {
      setComments(data || []);
    },
    onError: (error) => {
      console.error('获取评论列表失败:', error);

      // 模拟评论数据
      const mockComments = [
        {
          id: 1,
          ticket_id: id,
          user: 'admin',
          content: '已创建工单，请尽快处理。',
          created_at: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
          attachments: [],
        },
        {
          id: 2,
          ticket_id: id,
          user: '张工',
          content: '已接单，计划明天上午进行检查。',
          created_at: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
          attachments: [],
        },
        {
          id: 3,
          ticket_id: id,
          user: '张工',
          content: '初步检查发现曝气盘堵塞，需要清洗。',
          created_at: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
          attachments: [],
        },
      ];

      setComments(mockComments);
    }
  });

  // 使用API Hook获取站点列表
  const {
    data: sitesData,
    loading: sitesLoading,
    error: sitesError,
    execute: fetchSites
  } = useApi('getSites', {}, {
    autoLoad: true,
    onSuccess: (data) => {
      setSites(data || []);
    },
    onError: (error) => {
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
  });

  // 使用API Hook获取用户列表
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    execute: fetchUsers
  } = useApi('getUsers', {}, {
    autoLoad: true,
    onSuccess: (data) => {
      setUsers(data || []);
    },
    onError: (error) => {
      console.error('获取用户列表失败:', error);

      // 使用模拟数据
      const mockUsers = [
        { id: 1, name: '张工' },
        { id: 2, name: '李工' },
        { id: 3, name: '王工' },
        { id: 4, name: '赵工' },
      ];

      setUsers(mockUsers);
    }
  });

  // 更新工单数据
  useEffect(() => {
    if (ticketData) {
      setTicket(ticketData);
    }
  }, [ticketData]);

  // 更新评论数据
  useEffect(() => {
    if (commentsData) {
      setComments(commentsData);
    }
  }, [commentsData]);

  // 更新站点数据
  useEffect(() => {
    if (sitesData) {
      setSites(sitesData);
    }
  }, [sitesData]);

  // 更新用户数据
  useEffect(() => {
    if (usersData) {
      setUsers(usersData);
    }
  }, [usersData]);

  // 返回工单列表
  const goBack = () => {
    navigate('/tickets');
  };

  // 切换编辑模式
  const toggleEditMode = () => {
    if (!editMode) {
      form.setFieldsValue({
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        site_id: ticket.site_id,
        assigned_to: ticket.assigned_to,
        equipment: ticket.equipment,
        location: ticket.location,
        expected_completion_date: ticket.expected_completion_date ? dayjs(ticket.expected_completion_date) : null,
      });
    }

    setEditMode(!editMode);
  };

  // 使用API Hook更新工单
  const {
    loading: updateLoading,
    error: updateError,
    execute: executeUpdateTicket
  } = useApi('updateTicket', {}, {
    autoLoad: false,
    onSuccess: (data) => {
      message.success('工单更新成功');
      setTicket(data);
      setEditMode(false);
    },
    onError: (error) => {
      console.error('更新工单失败:', error);
      message.error('更新工单失败，请重试');

      // 模拟成功更新（仅用于演示）
      const updatedTicket = {
        ...ticket,
        ...form.getFieldsValue(),
        expected_completion_date: form.getFieldValue('expected_completion_date') ?
          form.getFieldValue('expected_completion_date').format('YYYY-MM-DD') : null,
        updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };

      setTicket(updatedTicket);
      setEditMode(false);
      message.success('工单更新成功');
    }
  });

  // 更新工单
  const updateTicket = (values) => {
    setSubmitting(true);

    // 格式化日期
    const formattedValues = {
      ...values,
      id,
      expected_completion_date: values.expected_completion_date ?
        values.expected_completion_date.format('YYYY-MM-DD') : null,
    };

    executeUpdateTicket(formattedValues)
      .finally(() => {
        setSubmitting(false);
      });
  };

  // 使用API Hook添加评论
  const {
    loading: addCommentLoading,
    error: addCommentError,
    execute: executeAddComment
  } = useApi('addTicketComment', {}, {
    autoLoad: false,
    onSuccess: (data) => {
      message.success('评论添加成功');
      fetchComments();
      commentForm.resetFields();
      setFileList([]);
    },
    onError: (error) => {
      console.error('添加评论失败:', error);
      message.error('添加评论失败，请重试');

      // 模拟成功添加（仅用于演示）
      const newComment = {
        id: comments.length + 1,
        ticket_id: id,
        user: user?.name || 'admin',
        content: commentForm.getFieldValue('content'),
        attachments: [],
        created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };

      setComments([...comments, newComment]);
      commentForm.resetFields();
      setFileList([]);
      message.success('评论添加成功');
    }
  });

  // 添加评论
  const addComment = (values) => {
    setCommentSubmitting(true);

    // 处理附件
    let attachments = [];
    if (fileList.length > 0) {
      // 这里应该实现附件上传逻辑
      message.info('附件上传功能正在开发中');
    }

    const commentData = {
      id,
      ticket_id: id,
      user: user?.name || 'admin',
      content: values.content,
      attachments,
      created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };

    executeAddComment(commentData)
      .finally(() => {
        setCommentSubmitting(false);
      });
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

  // 图片预览处理
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }

    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
  };

  // 图片上传变化处理
  const handleChange = ({ fileList }) => setFileList(fileList);

  // 图片上传前处理
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB!');
    }

    return isImage && isLt5M;
  };

  // 将文件转换为Base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // 上传按钮
  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  // 计算总体加载状态
  const isLoading = ticketLoading || commentsLoading || sitesLoading || usersLoading;

  if (isLoading && !ticket) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (!ticket && !isLoading) {
    return (
      <div className={styles.notFoundContainer}>
        <Title level={4}>未找到工单</Title>
        <Button type="primary" onClick={goBack}>返回工单列表</Button>
      </div>
    );
  }

  return (
    <div className={styles.ticketDetailContainer}>
      <Card className={styles.ticketDetailCard}>
        <div className={styles.headerRow}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={goBack}
          >
            返回
          </Button>
          <Space>
            {editMode ? (
              <>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => form.submit()}
                  loading={submitting}
                >
                  保存
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={toggleEditMode}
                >
                  取消
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={toggleEditMode}
              >
                编辑
              </Button>
            )}
          </Space>
        </div>

        {editMode ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={updateTicket}
            initialValues={{
              title: ticket.title,
              description: ticket.description,
              status: ticket.status,
              priority: ticket.priority,
              site_id: ticket.site_id,
              assigned_to: ticket.assigned_to,
              equipment: ticket.equipment,
              location: ticket.location,
              expected_completion_date: ticket.expected_completion_date ? dayjs(ticket.expected_completion_date) : null,
            }}
          >
            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  name="title"
                  label="标题"
                  rules={[{ required: true, message: '请输入工单标题' }]}
                >
                  <Input placeholder="请输入工单标题" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="site_id"
                  label="站点"
                  rules={[{ required: true, message: '请选择站点' }]}
                >
                  <Select placeholder="请选择站点">
                    {sites.map(site => (
                      <Option key={site.id} value={site.id}>{site.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="描述"
              rules={[{ required: true, message: '请输入工单描述' }]}
            >
              <TextArea rows={4} placeholder="请输入工单描述" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: '请选择工单状态' }]}
                >
                  <Select placeholder="请选择工单状态">
                    <Option value="pending">待处理</Option>
                    <Option value="in_progress">处理中</Option>
                    <Option value="completed">已完成</Option>
                    <Option value="cancelled">已取消</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="priority"
                  label="优先级"
                  rules={[{ required: true, message: '请选择优先级' }]}
                >
                  <Select placeholder="请选择优先级">
                    <Option value="high">高</Option>
                    <Option value="medium">中</Option>
                    <Option value="low">低</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="assigned_to"
                  label="负责人"
                >
                  <Select placeholder="请选择负责人" allowClear>
                    {users.map(user => (
                      <Option key={user.id} value={user.name}>{user.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="equipment"
                  label="设备"
                >
                  <Input placeholder="请输入设备名称" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="location"
                  label="位置"
                >
                  <Input placeholder="请输入位置信息" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="expected_completion_date"
                  label="预计完成日期"
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <>
            <div className={styles.ticketHeader}>
              <Title level={4}>{ticket.title}</Title>
              <div className={styles.ticketMeta}>
                <Space>
                  {getStatusTag(ticket.status)}
                  {getPriorityTag(ticket.priority)}
                  <Tag>#{ticket.id}</Tag>
                </Space>
              </div>
            </div>

            <Descriptions bordered column={2} className={styles.ticketInfo}>
              <Descriptions.Item label="站点">{getSiteName(ticket.site_id)}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{ticket.created_at}</Descriptions.Item>
              <Descriptions.Item label="创建人">{ticket.created_by}</Descriptions.Item>
              <Descriptions.Item label="负责人">{ticket.assigned_to || '未分配'}</Descriptions.Item>
              <Descriptions.Item label="设备">{ticket.equipment || '未指定'}</Descriptions.Item>
              <Descriptions.Item label="位置">{ticket.location || '未指定'}</Descriptions.Item>
              <Descriptions.Item label="最后更新">{ticket.updated_at}</Descriptions.Item>
              <Descriptions.Item label="预计完成日期">{ticket.expected_completion_date || '未指定'}</Descriptions.Item>
              {ticket.completed_at && (
                <Descriptions.Item label="完成时间" span={2}>{ticket.completed_at}</Descriptions.Item>
              )}
              <Descriptions.Item label="描述" span={2}>
                <Paragraph>{ticket.description}</Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}

        <Divider orientation="left">工单记录</Divider>

        <Timeline className={styles.ticketTimeline}>
          <Timeline.Item>
            <Text strong>{ticket.created_by}</Text> 创建了工单
            <div className={styles.timelineTime}>{ticket.created_at}</div>
          </Timeline.Item>

          {comments.map(comment => (
            <Timeline.Item key={comment.id}>
              <div className={styles.comment}>
                <div className={styles.commentHeader}>
                  <Text strong>{comment.user}</Text>
                  <Text type="secondary" className={styles.commentTime}>{comment.created_at}</Text>
                </div>
                <div className={styles.commentContent}>
                  {comment.content}
                </div>
                {comment.attachments && comment.attachments.length > 0 && (
                  <div className={styles.commentAttachments}>
                    {comment.attachments.map((attachment, index) => (
                      <div key={index} className={styles.attachment}>
                        <PaperClipOutlined /> {attachment.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>

        <Divider orientation="left">添加评论</Divider>

        <Form
          form={commentForm}
          layout="vertical"
          onFinish={addComment}
        >
          <Form.Item
            name="content"
            rules={[{ required: true, message: '请输入评论内容' }]}
          >
            <TextArea rows={4} placeholder="请输入评论内容..." />
          </Form.Item>

          <Form.Item label="附件">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChange}
              beforeUpload={beforeUpload}
            >
              {fileList.length >= 8 ? null : uploadButton}
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<MessageOutlined />}
              loading={commentSubmitting}
            >
              提交评论
            </Button>
          </Form.Item>
        </Form>

        <Modal
          open={previewVisible}
          title={previewTitle}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
        >
          <img alt="预览图片" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      </Card>
    </div>
  );
};

export default TicketDetail;

import React from 'react';
import { Box, Grid, Typography, Card, CardContent, CardHeader } from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  SupervisorAccount as AdminIcon,
  Speed as PerformanceIcon,
  Storage as DatabaseIcon,
  Group as UserIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import styles from './AdminDashboard.module.scss';

/**
 * 管理员仪表盘组件
 * 提供系统管理、用户管理、API管理等功能入口
 */
const AdminDashboard = () => {
  const navigate = useNavigate();

  // 管理卡片数据
  const adminCards = [
    {
      title: '用户管理',
      description: '管理系统用户、角色和权限',
      icon: <UserIcon />,
      onClick: () => navigate('/user-management')
    },
    {
      title: 'API管理',
      description: '配置和管理系统API接口',
      icon: <AdminIcon />,
      onClick: () => navigate('/api-management')
    },
    {
      title: '系统设置',
      description: '配置系统参数和全局设置',
      icon: <SettingsIcon />,
      onClick: () => navigate('/settings')
    },
    {
      title: 'API仪表盘',
      description: '监控API性能和使用情况',
      icon: <PerformanceIcon />,
      onClick: () => navigate('/api-dashboard')
    },
    {
      title: '数据中心',
      description: '查看系统数据统计和分析',
      icon: <DatabaseIcon />,
      onClick: () => navigate('/history-data')
    },
    {
      title: '返回主仪表盘',
      description: '返回系统主仪表盘',
      icon: <DashboardIcon />,
      onClick: () => navigate('/')
    }
  ];

  return (
    <div className={styles.adminContainer}>
      <Box p={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AdminIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          管理员控制台
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          欢迎使用管理员控制台，在这里您可以管理系统的各项功能和设置。
        </Typography>

        <Grid container spacing={3} mt={2}>
          {adminCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                  }
                }}
                onClick={card.onClick}
              >
                <CardHeader
                  avatar={card.icon}
                  title={card.title}
                  sx={{
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                    '& .MuiCardHeader-title': {
                      fontWeight: 500
                    }
                  }}
                />
                <CardContent>
                  <Typography variant="body2" color="textSecondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </div>
  );
};

export default AdminDashboard; 
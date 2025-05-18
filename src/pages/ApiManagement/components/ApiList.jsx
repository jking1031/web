import React, { useState, useMemo } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Collapse,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ApiOutlined,
  SearchOutlined,
  DownOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  FilterOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { API_CATEGORIES, API_STATUS } from '../../../services/apiRegistry';

// API 状态标签
const ApiStatusChip = ({ status }) => {
  switch (status) {
    case API_STATUS.ENABLED:
      return (
        <Chip
          size="small"
          label="启用"
          color="success"
          icon={<CheckCircleOutlined />}
        />
      );
    case API_STATUS.DISABLED:
      return (
        <Chip
          size="small"
          label="禁用"
          color="error"
          icon={<CloseCircleOutlined />}
        />
      );
    case API_STATUS.DEPRECATED:
      return (
        <Chip
          size="small"
          label="已弃用"
          color="warning"
          icon={<WarningOutlined />}
        />
      );
    default:
      return (
        <Chip
          size="small"
          label={status || '未知'}
          color="default"
        />
      );
  }
};

// API 列表组件
function ApiList({ apis, selectedApiKey, onApiSelect }) {
  const [searchText, setSearchText] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(Object.values(API_CATEGORIES));
  const [statusFilter, setStatusFilter] = useState(null);

  // 处理搜索文本变化
  const handleSearchChange = (event) => {
    setSearchText(event.target.value);
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchText('');
  };

  // 处理分类展开/折叠
  const handleCategoryToggle = (category) => {
    setExpandedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // 处理状态筛选
  const handleStatusFilter = (status) => {
    setStatusFilter((prev) => (prev === status ? null : status));
  };

  // 按分类分组 API
  const apisByCategory = useMemo(() => {
    const result = {};
    
    // 初始化所有分类
    Object.values(API_CATEGORIES).forEach((category) => {
      result[category] = [];
    });
    
    // 添加未分类
    result['uncategorized'] = [];
    
    // 分组 API
    Object.entries(apis).forEach(([key, api]) => {
      const category = api.category || 'uncategorized';
      
      // 应用搜索过滤
      if (searchText && !key.toLowerCase().includes(searchText.toLowerCase()) && 
          !api.name?.toLowerCase().includes(searchText.toLowerCase()) && 
          !api.url?.toLowerCase().includes(searchText.toLowerCase())) {
        return;
      }
      
      // 应用状态过滤
      if (statusFilter && api.status !== statusFilter) {
        return;
      }
      
      // 添加到对应分类
      if (result[category]) {
        result[category].push({ key, ...api });
      } else {
        result['uncategorized'].push({ key, ...api });
      }
    });
    
    return result;
  }, [apis, searchText, statusFilter]);

  // 获取分类名称
  const getCategoryName = (category) => {
    const categoryMap = {
      [API_CATEGORIES.SYSTEM]: '系统 API',
      [API_CATEGORIES.DATA]: '数据查询 API',
      [API_CATEGORIES.DEVICE]: '设备控制 API',
      [API_CATEGORIES.CUSTOM]: '用户自定义 API',
      [API_CATEGORIES.ADMIN]: '管理员 API',
      [API_CATEGORIES.AUTH]: '认证 API',
      [API_CATEGORIES.REPORT]: '报表 API',
      'uncategorized': '未分类 API'
    };
    
    return categoryMap[category] || category;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="搜索 API..."
          value={searchText}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
            endAdornment: searchText && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <ClearOutlined />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Tooltip title="筛选启用的 API">
          <Chip
            size="small"
            label="启用"
            color={statusFilter === API_STATUS.ENABLED ? 'success' : 'default'}
            onClick={() => handleStatusFilter(API_STATUS.ENABLED)}
            icon={<FilterOutlined />}
            variant={statusFilter === API_STATUS.ENABLED ? 'filled' : 'outlined'}
          />
        </Tooltip>
        <Tooltip title="筛选禁用的 API">
          <Chip
            size="small"
            label="禁用"
            color={statusFilter === API_STATUS.DISABLED ? 'error' : 'default'}
            onClick={() => handleStatusFilter(API_STATUS.DISABLED)}
            icon={<FilterOutlined />}
            variant={statusFilter === API_STATUS.DISABLED ? 'filled' : 'outlined'}
          />
        </Tooltip>
        <Tooltip title="筛选已弃用的 API">
          <Chip
            size="small"
            label="已弃用"
            color={statusFilter === API_STATUS.DEPRECATED ? 'warning' : 'default'}
            onClick={() => handleStatusFilter(API_STATUS.DEPRECATED)}
            icon={<FilterOutlined />}
            variant={statusFilter === API_STATUS.DEPRECATED ? 'filled' : 'outlined'}
          />
        </Tooltip>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List component="nav" dense>
          {Object.entries(apisByCategory).map(([category, categoryApis]) => {
            // 如果分类下没有 API，则不显示
            if (categoryApis.length === 0) {
              return null;
            }
            
            const isExpanded = expandedCategories.includes(category);
            
            return (
              <React.Fragment key={category}>
                <ListItemButton onClick={() => handleCategoryToggle(category)}>
                  <ListItemIcon>
                    {isExpanded ? <DownOutlined /> : <RightOutlined />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={getCategoryName(category)} 
                    secondary={`${categoryApis.length} 个 API`} 
                  />
                </ListItemButton>
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {categoryApis.map((api) => (
                      <ListItemButton
                        key={api.key}
                        selected={selectedApiKey === api.key}
                        onClick={() => onApiSelect(api.key)}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>
                          <ApiOutlined />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                {api.name || api.key}
                              </Typography>
                              <ApiStatusChip status={api.status} />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" noWrap sx={{ maxWidth: 200 }}>
                              {api.url}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}

export default ApiList;

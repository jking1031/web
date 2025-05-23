import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box, CircularProgress, Button, Alert, Tooltip, Divider, Paper } from '@mui/material';
import { ReloadOutlined, ExperimentOutlined } from '@ant-design/icons';
import moment from 'moment';

/**
 * 每日工艺分析组件
 * 展示工艺参数分析和建议
 */
const DailyProcessAnalysis = () => {
  const [loading, setLoading] = useState([true, true, true]);
  const [error, setError] = useState([null, null, null]);
  const [processData, setProcessData] = useState([null, null, null]);
  const [lastUpdated, setLastUpdated] = useState([null, null, null]);

  // 获取工艺数据
  useEffect(() => {
    // 单个池子数据获取函数
    const fetchPoolData = async (poolNumber) => {
      try {
        console.log(`[DailyProcessAnalysis] 开始获取${poolNumber}号AO池工艺数据`);
        
        const response = await fetch(`/api/getGongYiData?ao=${poolNumber}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log(`[DailyProcessAnalysis] ${poolNumber}号AO池API响应状态:`, response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[DailyProcessAnalysis] ${poolNumber}号AO池原始返回数据:`, data);
        
        // 验证数据结构
        if (!data || !data.input_data || !data.result) {
          console.error(`[DailyProcessAnalysis] ${poolNumber}号AO池数据格式不正确:`, data);
          throw new Error('返回数据格式不正确');
        }
        
        // 更新对应池子的数据
        setProcessData(prevData => {
          const newData = [...prevData];
          newData[poolNumber - 1] = data;
          return newData;
        });
        
        // 保存到本地存储
        try {
          localStorage.setItem(`aoPool${poolNumber}Data`, JSON.stringify(data));
          localStorage.setItem(`aoPool${poolNumber}UpdateTime`, new Date().toISOString());
        } catch (storageError) {
          console.error(`[DailyProcessAnalysis] 保存${poolNumber}号AO池数据到本地存储失败:`, storageError);
        }
        
        setLastUpdated(prevUpdated => {
          const newUpdated = [...prevUpdated];
          newUpdated[poolNumber - 1] = new Date();
          return newUpdated;
        });
        
        setLoading(prevLoading => {
          const newLoading = [...prevLoading];
          newLoading[poolNumber - 1] = false;
          return newLoading;
        });
        
        console.log(`[DailyProcessAnalysis] ${poolNumber}号AO池数据更新成功`);
      } catch (error) {
        console.error(`[DailyProcessAnalysis] 获取${poolNumber}号AO池工艺数据失败:`, error);
        setError(prevError => {
          const newError = [...prevError];
          newError[poolNumber - 1] = '获取数据失败: ' + (error.message || '未知错误');
          return newError;
        });
        
        setLoading(prevLoading => {
          const newLoading = [...prevLoading];
          newLoading[poolNumber - 1] = false;
          return newLoading;
        });
      }
    };

    // 按顺序获取所有池子的数据，每次间隔10秒
    const fetchAllPoolsData = async () => {
      // 依次请求三个AO池的数据，每次请求间隔10秒
      await fetchPoolData(1);
      await new Promise(resolve => setTimeout(resolve, 10000));
      await fetchPoolData(2);
      await new Promise(resolve => setTimeout(resolve, 10000));
      await fetchPoolData(3);
    };

    // 加载可能的本地存储数据
    const loadLocalData = () => {
      for (let i = 1; i <= 3; i++) {
        try {
          const storedData = localStorage.getItem(`aoPool${i}Data`);
          const updateTime = localStorage.getItem(`aoPool${i}UpdateTime`);
          
          if (storedData && updateTime) {
            const parsedData = JSON.parse(storedData);
            setProcessData(prevData => {
              const newData = [...prevData];
              newData[i - 1] = parsedData;
              return newData;
            });
            
            setLastUpdated(prevUpdated => {
              const newUpdated = [...prevUpdated];
              newUpdated[i - 1] = new Date(updateTime);
              return newUpdated;
            });
            
            setLoading(prevLoading => {
              const newLoading = [...prevLoading];
              newLoading[i - 1] = false;
              return newLoading;
            });
            
            console.log(`[DailyProcessAnalysis] 从本地存储加载${i}号AO池数据成功`);
          }
        } catch (error) {
          console.error(`[DailyProcessAnalysis] 从本地存储加载${i}号AO池数据失败:`, error);
        }
      }
    };

    // 首先尝试从本地存储加载数据
    loadLocalData();
    
    // 然后从API获取最新数据
    fetchAllPoolsData();
    
    // 设置定时器，每5小时更新一次数据
    const timer = setInterval(fetchAllPoolsData, 5 * 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // 手动刷新数据
  const handleRefresh = async () => {
    setLoading([true, true, true]);
    console.log('[DailyProcessAnalysis] 手动刷新所有AO池数据');
    
    const fetchPoolData = async (poolNumber) => {
      try {
        console.log(`[DailyProcessAnalysis] 手动刷新开始获取${poolNumber}号AO池工艺数据`);
        
        const response = await fetch(`/api/getGongYiData?ao=${poolNumber}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[DailyProcessAnalysis] ${poolNumber}号AO池手动刷新返回数据:`, data);
        
        // 验证数据结构
        if (!data || !data.input_data || !data.result) {
          console.error(`[DailyProcessAnalysis] ${poolNumber}号AO池手动刷新数据格式不正确:`, data);
          throw new Error('返回数据格式不正确');
        }
        
        // 更新对应池子的数据
        setProcessData(prevData => {
          const newData = [...prevData];
          newData[poolNumber - 1] = data;
          return newData;
        });
        
        // 保存到本地存储
        try {
          localStorage.setItem(`aoPool${poolNumber}Data`, JSON.stringify(data));
          localStorage.setItem(`aoPool${poolNumber}UpdateTime`, new Date().toISOString());
        } catch (storageError) {
          console.error(`[DailyProcessAnalysis] 保存${poolNumber}号AO池数据到本地存储失败:`, storageError);
        }
        
        setLastUpdated(prevUpdated => {
          const newUpdated = [...prevUpdated];
          newUpdated[poolNumber - 1] = new Date();
          return newUpdated;
        });
        
        console.log(`[DailyProcessAnalysis] ${poolNumber}号AO池手动刷新数据更新成功`);
      } catch (error) {
        console.error(`[DailyProcessAnalysis] ${poolNumber}号AO池手动刷新数据失败:`, error);
        setError(prevError => {
          const newError = [...prevError];
          newError[poolNumber - 1] = '刷新数据失败: ' + (error.message || '未知错误');
          return newError;
        });
      } finally {
        setLoading(prevLoading => {
          const newLoading = [...prevLoading];
          newLoading[poolNumber - 1] = false;
          return newLoading;
        });
      }
    };
    
    // 依次请求三个AO池的数据，每次请求间隔10秒
    await fetchPoolData(1);
    await new Promise(resolve => setTimeout(resolve, 10000));
    await fetchPoolData(2);
    await new Promise(resolve => setTimeout(resolve, 10000));
    await fetchPoolData(3);
  };

  // 安全获取数值的辅助函数
  const getValue = (obj, key, defaultValue = '-') => {
    return obj && obj[key] !== undefined ? obj[key] : defaultValue;
  };

  // 渲染单个AO池数据
  const renderPoolData = (poolData, poolIndex, isLoading, poolError) => {
    if (isLoading) {
    return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
      );
    }

    if (poolError) {
      return (
        <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, color: '#d32f2f' }}>
          <Typography variant="body1">{poolError}</Typography>
        </Box>
    );
  }

    if (!poolData || !poolData.input_data || !poolData.result) {
      return (
        <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, color: '#d32f2f' }}>
          <Typography variant="body1">数据格式不正确</Typography>
        </Box>
      );
    }

    const { input_data, result } = poolData;

    return (
      <Box>
        {/* 紧凑显示输入参数和分析结果 */}
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
          输入参数
        </Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              进水流量: {getValue(input_data, 'Q')} m³/d
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              COD: {getValue(input_data, 'COD')} mg/L
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              出水SS: {getValue(input_data, 'SS_out')} mg/L
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              SV30: {getValue(input_data, 'SV30')} mL/L
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              MLSS: {getValue(input_data, 'MLSS')} mg/L
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              污泥量: {getValue(input_data, 'sludge_mass')} 吨/天
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
          分析结果
        </Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              F/M比: {getValue(result, 'F_M')}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              SRT: {getValue(result, 'SRT_days')} 天
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              SVI: {getValue(result, 'SVI')} mL/g
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
              脱氮效率: {getValue(result, 'TN_removal_efficiency')}%
            </Typography>
          </Grid>
        </Grid>

        {/* 显示所有建议 */}
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
          运行建议
        </Typography>
        {Array.isArray(result.建议) && result.建议.length > 0 ? (
          <Box sx={{ maxHeight: '120px', overflowY: 'auto' }}>
            {result.建议.map((suggestion, idx) => (
              <Alert 
                key={idx} 
                severity="info" 
                sx={{ 
                  mb: idx < result.建议.length - 1 ? 1 : 0,
                  py: 0.5, 
                  fontSize: '0.75rem',
                  '& .MuiAlert-icon': { fontSize: '0.875rem', mr: 1 }
                }}
              >
                {suggestion}
              </Alert>
            ))}
          </Box>
        ) : (
          <Alert severity="info" sx={{ py: 0.5, fontSize: '0.75rem' }}>
            暂无运行建议
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          mb: 2,
          borderBottom: '1px solid #f0f0f0',
          pb: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ExperimentOutlined style={{ fontSize: 20, marginRight: 8, color: '#2E7D32' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>每日工艺分析</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption" color="textSecondary" sx={{ mr: 1 }}>
              最后更新: {lastUpdated.some(date => date) ? moment(Math.max(...lastUpdated.filter(date => date).map(date => date.getTime()))).format('YYYY-MM-DD HH:mm:ss') : '未更新'}
              </Typography>
            <Tooltip title="刷新数据">
              <span>
              <Button
                size="small"
                startIcon={<ReloadOutlined />}
                onClick={handleRefresh}
                  disabled={loading.every(isLoading => isLoading)}
              >
                刷新
              </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* 使用Grid让三个池子并列显示 */}
        <Grid container spacing={2}>
          {[0, 1, 2].map(index => (
            <Grid item xs={12} md={4} key={index}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                  {index + 1}号AO池
                </Typography>
                {renderPoolData(processData[index], index, loading[index], error[index])}
              </Paper>
                  </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DailyProcessAnalysis; 
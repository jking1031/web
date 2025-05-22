import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box, CircularProgress, Chip, Tooltip, Button } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ReloadOutlined } from '@ant-design/icons';
import moment from 'moment';

/**
 * 每日工艺分析组件
 * 展示AO池、污泥等工艺数据
 */
const DailyProcessAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processData, setProcessData] = useState({
    aoPool: {
      do: [], // 溶解氧
      mlss: [], // 污泥浓度
      temperature: [], // 温度
    },
    sludge: {
      sv30: [], // 污泥沉降比
      svi: [], // 污泥指数
      concentration: [], // 污泥浓度
    },
    lastUpdated: null
  });

  // 获取工艺数据
  useEffect(() => {
    const fetchProcessData = async () => {
      try {
        setLoading(true);
        console.log('[DailyProcessAnalysis] 开始获取工艺数据');
        
        const response = await fetch('/api/getGongYiData');
        console.log('[DailyProcessAnalysis] API响应状态:', response.status, response.statusText);
        console.log('[DailyProcessAnalysis] API响应头:', Object.fromEntries(response.headers.entries()));
        
        // 检查响应状态
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 获取响应文本
        const responseText = await response.text();
        console.log('[DailyProcessAnalysis] API响应文本:', responseText);
        
        // 尝试解析JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('[DailyProcessAnalysis] 解析后的数据:', data);
        } catch (parseError) {
          console.error('[DailyProcessAnalysis] JSON解析失败:', parseError);
          throw new Error('返回数据格式错误: ' + parseError.message);
        }
        
        if (data) {
          setProcessData({
            aoPool: data.aoPool || {
              do: [],
              mlss: [],
              temperature: []
            },
            sludge: data.sludge || {
              sv30: [],
              svi: [],
              concentration: []
            },
            lastUpdated: new Date()
          });
        }
      } catch (error) {
        console.error('[DailyProcessAnalysis] 获取工艺数据失败:', error);
        setError('获取数据失败: ' + (error.message || '未知错误'));
      } finally {
        setLoading(false);
      }
    };

    fetchProcessData();
    // 设置定时器，每5分钟更新一次数据
    const timer = setInterval(fetchProcessData, 300000);

    return () => clearInterval(timer);
  }, []);

  // 手动刷新数据
  const handleRefresh = () => {
    setLoading(true);
    fetch('/api/getGongYiData')
      .then(response => response.json())
      .then(data => {
        setProcessData({
          aoPool: data.aoPool || processData.aoPool,
          sludge: data.sludge || processData.sludge,
          lastUpdated: new Date()
        });
      })
      .catch(error => {
        console.error('刷新工艺数据失败:', error);
        setError('刷新数据失败: ' + (error.message || '未知错误'));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 1, color: '#d32f2f' }}>
            <Typography variant="body1">{error}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">每日工艺分析</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {processData.lastUpdated && (
              <Typography variant="caption" color="textSecondary" sx={{ mr: 1 }}>
                最后更新: {moment(processData.lastUpdated).format('YYYY-MM-DD HH:mm:ss')}
              </Typography>
            )}
            <Tooltip title="刷新数据">
              <Button
                size="small"
                startIcon={<ReloadOutlined />}
                onClick={handleRefresh}
                disabled={loading}
              >
                刷新
              </Button>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* AO池数据 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  AO池数据
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processData.aoPool.do}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" name="溶解氧" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      溶解氧: {processData.aoPool.do[processData.aoPool.do.length - 1]?.value || '-'} mg/L
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      MLSS: {processData.aoPool.mlss[processData.aoPool.mlss.length - 1]?.value || '-'} mg/L
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      温度: {processData.aoPool.temperature[processData.aoPool.temperature.length - 1]?.value || '-'} °C
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 污泥数据 */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  污泥数据
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={processData.sludge.sv30}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="value" stroke="#82ca9d" name="SV30" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      SV30: {processData.sludge.sv30[processData.sludge.sv30.length - 1]?.value || '-'} %
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      SVI: {processData.sludge.svi[processData.sludge.svi.length - 1]?.value || '-'} mL/g
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">
                      浓度: {processData.sludge.concentration[processData.sludge.concentration.length - 1]?.value || '-'} g/L
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DailyProcessAnalysis; 
import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';

/**
 * 简单的JSON编辑器组件
 * @param {Object} props 组件属性
 * @param {string} props.value 编辑器的值
 * @param {function} props.onChange 值变更回调函数
 * @param {string} props.height 编辑器高度
 * @param {string} props.width 编辑器宽度
 * @param {boolean} props.readOnly 是否只读
 */
const JsonEditor = ({ value, onChange, height = '200px', width = '100%', readOnly = false }) => {
  const [error, setError] = useState(null);
  const [formattedValue, setFormattedValue] = useState('');

  // 格式化JSON
  useEffect(() => {
    try {
      // 如果值是空字符串，使用空对象
      if (!value) {
        setFormattedValue('{}');
        setError(null);
        return;
      }

      // 如果值已经是对象，转换为格式化的JSON字符串
      if (typeof value === 'object') {
        setFormattedValue(JSON.stringify(value, null, 2));
        setError(null);
        return;
      }

      // 尝试解析JSON字符串
      const parsed = JSON.parse(value);
      setFormattedValue(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      // 如果解析失败，保留原始值
      setFormattedValue(value);
      setError('无效的JSON格式');
    }
  }, [value]);

  // 处理值变更
  const handleChange = (e) => {
    const newValue = e.target.value;

    try {
      // 尝试解析JSON
      if (newValue.trim()) {
        JSON.parse(newValue);
      }
      setError(null);
    } catch (err) {
      setError('无效的JSON格式');
    }

    if (onChange) {
      onChange(newValue);
    }
  };

  // 格式化JSON
  const formatJson = () => {
    try {
      if (!formattedValue.trim()) {
        return;
      }
      const parsed = JSON.parse(formattedValue);
      const formatted = JSON.stringify(parsed, null, 2);
      if (onChange) {
        onChange(formatted);
      }
    } catch (err) {
      setError('无效的JSON格式，无法格式化');
    }
  };

  return (
    <Box sx={{ width }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        {!readOnly && (
          <Button
            size="small"
            onClick={formatJson}
            variant="outlined"
            sx={{ fontSize: '12px' }}
          >
            格式化JSON
          </Button>
        )}
      </Box>
      <Paper
        variant="outlined"
        sx={{
          position: 'relative',
          ...(error && { border: '1px solid #f44336' })
        }}
      >
        <textarea
          value={formattedValue}
          onChange={handleChange}
          style={{
            width: '100%',
            height,
            padding: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            backgroundColor: readOnly ? '#f5f5f5' : 'white'
          }}
          readOnly={readOnly}
        />
      </Paper>
      {error && (
        <Typography color="error" variant="caption">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default JsonEditor;

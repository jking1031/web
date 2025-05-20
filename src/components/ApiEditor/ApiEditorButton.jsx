import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Badge } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import ApiEditorModal from './ApiEditorModal';
import PropTypes from 'prop-types';
import apiManager from '../../services/apiManager';

/**
 * API编辑器按钮组件
 * 用于在页面中显示API编辑器按钮
 */
const ApiEditorButton = ({ pageKey, buttonProps, style, size, type, shape, className, tooltip }) => {
  const [visible, setVisible] = useState(false);
  const [apiCount, setApiCount] = useState(0);

  // 获取页面API数量并注册当前页面使用的API
  useEffect(() => {
    if (pageKey) {
      try {
        // 获取页面API
        const pageApis = apiManager.registry.getPageApis(pageKey);
        setApiCount(pageApis.length);

        // 如果当前页面没有注册API，尝试自动注册
        if (pageApis.length === 0) {
          // 查找与页面相关的API
          let allApis = apiManager.registry.getAll();

          // 确保allApis是数组格式
          if (!Array.isArray(allApis)) {
            console.warn('API配置不是数组格式，尝试转换');
            if (typeof allApis === 'object' && allApis !== null) {
              allApis = Object.keys(allApis).map(key => ({
                key,
                ...allApis[key]
              }));
            } else {
              console.error('无法转换API配置为数组格式');
              allApis = [];
            }
          }

          const pageKeyLower = pageKey.toLowerCase();

          // 查找名称或描述中包含页面键的API
          const relatedApis = allApis.filter(api =>
            api && api.key && (
              api.key.toLowerCase().includes(pageKeyLower) ||
              (api.name && api.name.toLowerCase().includes(pageKeyLower)) ||
              (api.description && api.description.toLowerCase().includes(pageKeyLower))
            )
          );

          // 如果找到相关API，注册到页面
          if (relatedApis.length > 0) {
            const relatedApiKeys = relatedApis.map(api => api.key);
            apiManager.registry.setPageApis(pageKey, relatedApiKeys);
            setApiCount(relatedApiKeys.length);
          }
        }
      } catch (error) {
        console.error('获取页面API失败:', error);
      }
    }
  }, [pageKey]);

  // 显示API编辑器
  const showApiEditor = () => {
    setVisible(true);
  };

  // 关闭API编辑器
  const closeApiEditor = () => {
    setVisible(false);

    // 更新API数量
    if (pageKey) {
      const pageApis = apiManager.registry.getPageApis(pageKey);
      setApiCount(pageApis.length);
    }
  };

  return (
    <>
      <Tooltip title={tooltip || "API编辑器"}>
        <Badge count={apiCount} size="small" offset={[-5, 5]}>
          <Button
            icon={<ApiOutlined />}
            onClick={showApiEditor}
            style={style}
            size={size}
            type={type}
            shape={shape}
            className={className}
            {...buttonProps}
          />
        </Badge>
      </Tooltip>

      <ApiEditorModal
        visible={visible}
        onClose={closeApiEditor}
        pageKey={pageKey}
      />
    </>
  );
};

ApiEditorButton.propTypes = {
  pageKey: PropTypes.string,
  buttonProps: PropTypes.object,
  style: PropTypes.object,
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  type: PropTypes.oneOf(['primary', 'ghost', 'dashed', 'link', 'text', 'default']),
  shape: PropTypes.oneOf(['circle', 'round']),
  className: PropTypes.string,
  tooltip: PropTypes.string
};

ApiEditorButton.defaultProps = {
  pageKey: '',
  buttonProps: {},
  size: 'middle',
  type: 'default'
};

export default ApiEditorButton;

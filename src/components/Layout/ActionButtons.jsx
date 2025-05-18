import React from 'react';
import { Button, Tooltip, Space } from 'antd';
import {
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import styles from './ActionButtons.module.scss';

/**
 * 操作按钮组件
 * @param {Object} props - 组件属性
 * @param {Function} props.onRefresh - 刷新按钮点击事件
 * @param {Function} props.onHelp - 帮助按钮点击事件
 * @returns {JSX.Element} 操作按钮组件
 */
const ActionButtons = ({ onRefresh, onHelp }) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // 监听全屏状态变化
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={styles.actionButtons}>
      <Space size={4}>
        <Tooltip title="刷新">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            onClick={onRefresh || (() => window.location.reload())}
            className={styles.actionButton}
          />
        </Tooltip>
        <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
            className={styles.actionButton}
          />
        </Tooltip>
        <Tooltip title="帮助">
          <Button
            type="text"
            icon={<QuestionCircleOutlined />}
            onClick={onHelp || (() => {})}
            className={styles.actionButton}
          />
        </Tooltip>
      </Space>
    </div>
  );
};

export default ActionButtons;

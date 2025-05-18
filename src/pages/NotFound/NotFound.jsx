import React from 'react';
import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';
import styles from './NotFound.module.scss';

/**
 * 404页面组件
 * @returns {JSX.Element} 404页面
 */
const NotFound = () => {
  return (
    <div className={styles.notFoundContainer}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Link to="/">
            <Button type="primary">返回首页</Button>
          </Link>
        }
      />
    </div>
  );
};

export default NotFound; 
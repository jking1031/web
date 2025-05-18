/* 增强的交互组件
 * 提供更好的用户交互体验和微动画效果
 */
import React, { useState, useEffect } from 'react';
import './EnhancedInteraction.module.scss';

// 带有涟漪效果的按钮
export function RippleButton({ 
  children, 
  onClick, 
  className = '', 
  type = 'default', 
  size = 'medium',
  disabled = false,
  block = false,
  ...props 
}) {
  const [ripples, setRipples] = useState([]);
  
  // 处理点击事件，添加涟漪效果
  const handleClick = (e) => {
    if (disabled) return;
    
    // 获取按钮相对位置
    const rect = e.currentTarget.getBoundingClientRect();
    const left = e.clientX - rect.left;
    const top = e.clientY - rect.top;
    
    // 创建新的涟漪
    const ripple = {
      id: Date.now(),
      left,
      top,
    };
    
    // 添加到涟漪列表
    setRipples([...ripples, ripple]);
    
    // 调用原始点击处理函数
    if (onClick) {
      onClick(e);
    }
  };
  
  // 清理过期的涟漪
  useEffect(() => {
    if (ripples.length === 0) return;
    
    const timeoutId = setTimeout(() => {
      setRipples(ripples.slice(1));
    }, 600);
    
    return () => clearTimeout(timeoutId);
  }, [ripples]);
  
  // 构建类名
  const classes = [
    'ripple-button',
    `ripple-button-${type}`,
    `ripple-button-${size}`,
    disabled ? 'ripple-button-disabled' : '',
    block ? 'ripple-button-block' : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <button 
      className={classes} 
      onClick={handleClick} 
      disabled={disabled}
      {...props}
    >
      <span className="ripple-button-content">{children}</span>
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="ripple-effect"
          style={{
            left: ripple.left,
            top: ripple.top,
          }}
        />
      ))}
    </button>
  );
}

// 带有动画效果的卡片
export function AnimatedCard({ 
  children, 
  title, 
  extra,
  bordered = true,
  hoverable = true,
  loading = false,
  animation = 'fade', // fade, slide, zoom
  className = '',
  bodyStyle = {},
  ...props 
}) {
  const [visible, setVisible] = useState(false);
  
  // 组件挂载时触发动画
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setVisible(true);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // 构建类名
  const classes = [
    'animated-card',
    `animated-card-${animation}`,
    visible ? 'animated-card-visible' : '',
    bordered ? 'animated-card-bordered' : '',
    hoverable ? 'animated-card-hoverable' : '',
    loading ? 'animated-card-loading' : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...props}>
      {(title || extra) && (
        <div className="animated-card-header">
          {title && <div className="animated-card-title">{title}</div>}
          {extra && <div className="animated-card-extra">{extra}</div>}
        </div>
      )}
      <div className="animated-card-body" style={bodyStyle}>
        {loading ? (
          <div className="animated-card-loading-content">
            <div className="animated-loading-block" style={{ width: '94%' }}></div>
            <div className="animated-loading-block" style={{ width: '78%' }}></div>
            <div className="animated-loading-block" style={{ width: '63%' }}></div>
          </div>
        ) : children}
      </div>
    </div>
  );
}

// 带有动画效果的列表项
export function AnimatedListItem({ 
  children, 
  index = 0, 
  className = '', 
  ...props 
}) {
  const [visible, setVisible] = useState(false);
  
  // 组件挂载时触发动画，根据索引延迟显示
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setVisible(true);
    }, 100 + index * 50);
    
    return () => clearTimeout(timeoutId);
  }, [index]);
  
  // 构建类名
  const classes = [
    'animated-list-item',
    visible ? 'animated-list-item-visible' : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

// 带有加载动画的图像
export function AnimatedImage({ 
  src, 
  alt = '', 
  className = '', 
  width, 
  height,
  lazy = true,
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZmlsbD0iI2FhYSI+SW1hZ2Ugbm90IGZvdW5kPC90ZXh0Pjwvc3ZnPg==',
  ...props 
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(lazy ? fallback : src);
  
  // 处理图像加载
  const handleLoad = () => {
    setLoading(false);
  };
  
  // 处理图像加载错误
  const handleError = () => {
    setLoading(false);
    setError(true);
    setImageSrc(fallback);
  };
  
  // 懒加载图像
  useEffect(() => {
    if (!lazy) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    
    const currentImage = document.getElementById(`animated-image-${src}`);
    if (currentImage) {
      observer.observe(currentImage);
    }
    
    return () => {
      if (currentImage) {
        observer.unobserve(currentImage);
      }
    };
  }, [src, lazy]);
  
  // 构建类名
  const classes = [
    'animated-image',
    loading ? 'animated-image-loading' : '',
    error ? 'animated-image-error' : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={classes} 
      style={{ width, height }}
      {...props}
    >
      {loading && <div className="animated-image-skeleton"></div>}
      <img
        id={`animated-image-${src}`}
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{ opacity: loading ? 0 : 1 }}
      />
    </div>
  );
}

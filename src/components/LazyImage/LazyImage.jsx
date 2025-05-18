/**
 * 图像懒加载优化
 * 提供高效的图像懒加载实现，减少初始加载时间
 */
import React, { useState, useEffect, useRef } from 'react';
import './LazyImage.module.scss';

/**
 * 懒加载图像组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 懒加载图像组件
 */
export function LazyImage({
  src,
  alt = '',
  width,
  height,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZmlsbD0iI2FhYSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4=',
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZmlsbD0iI2FhYSI+SW1hZ2Ugbm90IGZvdW5kPC90ZXh0Pjwvc3ZnPg==',
  threshold = 0.1,
  effect = 'blur', // blur, fade
  className = '',
  onLoad,
  onError,
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef(null);
  
  useEffect(() => {
    // 重置状态
    setIsLoaded(false);
    setIsError(false);
    setCurrentSrc(placeholder);
    
    // 创建 IntersectionObserver 实例
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当图像进入视口时
          if (entry.isIntersecting) {
            // 预加载图像
            const img = new Image();
            img.src = src;
            
            img.onload = () => {
              setCurrentSrc(src);
              setIsLoaded(true);
              if (onLoad) onLoad();
            };
            
            img.onerror = () => {
              setCurrentSrc(fallback);
              setIsError(true);
              if (onError) onError();
            };
            
            // 停止观察
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );
    
    // 开始观察
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    // 清理
    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, placeholder, fallback, threshold, onLoad, onError]);
  
  // 构建类名
  const classes = [
    'lazy-image',
    `lazy-image-effect-${effect}`,
    isLoaded ? 'lazy-image-loaded' : '',
    isError ? 'lazy-image-error' : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div
      className={classes}
      style={{ width, height }}
      ref={imgRef}
      {...props}
    >
      <img
        src={currentSrc}
        alt={alt}
        className="lazy-image-img"
      />
    </div>
  );
}

/**
 * 背景图像懒加载组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 背景图像懒加载组件
 */
export function LazyBackgroundImage({
  src,
  placeholder = '#f0f0f0',
  fallback = '#f0f0f0',
  threshold = 0.1,
  effect = 'blur', // blur, fade
  className = '',
  children,
  onLoad,
  onError,
  style = {},
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const bgRef = useRef(null);
  
  useEffect(() => {
    // 重置状态
    setIsLoaded(false);
    setIsError(false);
    setCurrentSrc(placeholder);
    
    // 创建 IntersectionObserver 实例
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当元素进入视口时
          if (entry.isIntersecting) {
            // 预加载图像
            const img = new Image();
            img.src = src;
            
            img.onload = () => {
              setCurrentSrc(src);
              setIsLoaded(true);
              if (onLoad) onLoad();
            };
            
            img.onerror = () => {
              setCurrentSrc(fallback);
              setIsError(true);
              if (onError) onError();
            };
            
            // 停止观察
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );
    
    // 开始观察
    if (bgRef.current) {
      observer.observe(bgRef.current);
    }
    
    // 清理
    return () => {
      if (bgRef.current) {
        observer.unobserve(bgRef.current);
      }
    };
  }, [src, placeholder, fallback, threshold, onLoad, onError]);
  
  // 构建类名
  const classes = [
    'lazy-bg-image',
    `lazy-bg-image-effect-${effect}`,
    isLoaded ? 'lazy-bg-image-loaded' : '',
    isError ? 'lazy-bg-image-error' : '',
    className,
  ].filter(Boolean).join(' ');
  
  // 合并样式
  const mergedStyle = {
    ...style,
    backgroundImage: `url(${currentSrc})`,
  };
  
  return (
    <div
      className={classes}
      style={mergedStyle}
      ref={bgRef}
      {...props}
    >
      {children}
    </div>
  );
}

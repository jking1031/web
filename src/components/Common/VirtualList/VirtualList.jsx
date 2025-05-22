/**
 * 虚拟列表组件
 * 高效渲染大量数据，只渲染可视区域内的元素
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './VirtualList.module.scss';

/**
 * 虚拟列表组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 虚拟列表组件
 */
export function VirtualList({
  items = [],
  height = 400,
  itemHeight = 50,
  overscan = 5,
  renderItem,
  className = '',
  onScroll,
  onItemsRendered,
  ...props
}) {
  // 容器引用
  const containerRef = useRef(null);
  
  // 滚动位置
  const [scrollTop, setScrollTop] = useState(0);
  
  // 计算总高度
  const totalHeight = items.length * itemHeight;
  
  // 计算可见范围内的起始和结束索引
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight) + overscan
  );
  
  // 可见元素
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  // 处理滚动事件
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    
    if (onScroll) {
      onScroll(e);
    }
  }, [onScroll]);
  
  // 通知渲染的元素范围
  useEffect(() => {
    if (onItemsRendered) {
      onItemsRendered({
        startIndex,
        endIndex,
        visibleStartIndex: Math.floor(scrollTop / itemHeight),
        visibleEndIndex: Math.floor((scrollTop + height) / itemHeight),
      });
    }
  }, [startIndex, endIndex, scrollTop, height, itemHeight, onItemsRendered]);
  
  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
      {...props}
    >
      <div
        className="virtual-list-inner"
        style={{ height: totalHeight, position: 'relative' }}
      >
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          return (
            <div
              key={actualIndex}
              className="virtual-list-item"
              style={{
                position: 'absolute',
                top: actualIndex * itemHeight,
                height: itemHeight,
                left: 0,
                right: 0,
              }}
            >
              {renderItem({ item, index: actualIndex, style: { height: itemHeight } })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 虚拟网格组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 虚拟网格组件
 */
export function VirtualGrid({
  items = [],
  height = 400,
  width = '100%',
  columnCount = 3,
  rowHeight = 200,
  gap = 16,
  overscan = 1,
  renderItem,
  className = '',
  onScroll,
  onItemsRendered,
  ...props
}) {
  // 容器引用
  const containerRef = useRef(null);
  
  // 滚动位置
  const [scrollTop, setScrollTop] = useState(0);
  
  // 计算行数
  const rowCount = Math.ceil(items.length / columnCount);
  
  // 计算总高度
  const totalHeight = rowCount * (rowHeight + gap) - gap;
  
  // 计算可见范围内的起始和结束行索引
  const startRowIndex = Math.max(0, Math.floor(scrollTop / (rowHeight + gap)) - overscan);
  const endRowIndex = Math.min(
    rowCount - 1,
    Math.floor((scrollTop + height) / (rowHeight + gap)) + overscan
  );
  
  // 计算可见元素的索引范围
  const startIndex = startRowIndex * columnCount;
  const endIndex = Math.min(items.length - 1, (endRowIndex + 1) * columnCount - 1);
  
  // 可见元素
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  // 处理滚动事件
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    
    if (onScroll) {
      onScroll(e);
    }
  }, [onScroll]);
  
  // 通知渲染的元素范围
  useEffect(() => {
    if (onItemsRendered) {
      onItemsRendered({
        startIndex,
        endIndex,
        visibleStartIndex: Math.floor(scrollTop / (rowHeight + gap)) * columnCount,
        visibleEndIndex: Math.min(
          items.length - 1,
          (Math.floor((scrollTop + height) / (rowHeight + gap)) + 1) * columnCount - 1
        ),
      });
    }
  }, [startIndex, endIndex, scrollTop, height, rowHeight, gap, columnCount, items.length, onItemsRendered]);
  
  return (
    <div
      ref={containerRef}
      className={`virtual-grid-container ${className}`}
      style={{ height, width, overflow: 'auto' }}
      onScroll={handleScroll}
      {...props}
    >
      <div
        className="virtual-grid-inner"
        style={{ height: totalHeight, position: 'relative' }}
      >
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          const rowIndex = Math.floor(actualIndex / columnCount);
          const columnIndex = actualIndex % columnCount;
          
          // 计算元素位置
          const top = rowIndex * (rowHeight + gap);
          const left = `calc(${(100 / columnCount) * columnIndex}% + ${gap / 2}px)`;
          const width = `calc(${100 / columnCount}% - ${gap}px)`;
          
          return (
            <div
              key={actualIndex}
              className="virtual-grid-item"
              style={{
                position: 'absolute',
                top,
                left,
                width,
                height: rowHeight,
              }}
            >
              {renderItem({ 
                item, 
                index: actualIndex, 
                rowIndex, 
                columnIndex,
                style: { height: rowHeight } 
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 无限滚动组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 无限滚动组件
 */
export function InfiniteScroll({
  items = [],
  loadMore,
  hasMore = false,
  loading = false,
  height = 400,
  itemHeight = 50,
  threshold = 250,
  loadingComponent,
  endComponent,
  renderItem,
  className = '',
  ...props
}) {
  // 使用虚拟列表
  const virtualListRef = useRef(null);
  
  // 处理滚动事件
  const handleScroll = useCallback(
    (e) => {
      if (loading || !hasMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      const scrollBottom = scrollHeight - scrollTop - clientHeight;
      
      if (scrollBottom < threshold) {
        loadMore();
      }
    },
    [loading, hasMore, threshold, loadMore]
  );
  
  return (
    <div className={`infinite-scroll ${className}`} {...props}>
      <VirtualList
        ref={virtualListRef}
        items={items}
        height={height}
        itemHeight={itemHeight}
        renderItem={renderItem}
        onScroll={handleScroll}
      />
      
      {loading && loadingComponent}
      {!hasMore && !loading && endComponent}
    </div>
  );
}

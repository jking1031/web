/* 响应式布局组件
 * 提供自适应不同屏幕尺寸的布局容器
 */
import React from 'react';
import './ResponsiveLayout.module.scss';

export function ResponsiveContainer({ children, fluid = false, className = '', ...props }) {
  const containerClass = fluid ? 'responsive-container-fluid' : 'responsive-container';
  return (
    <div className={`${containerClass} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function ResponsiveRow({ children, gutter = [16, 16], className = '', ...props }) {
  const style = {
    marginLeft: -gutter[0] / 2,
    marginRight: -gutter[0] / 2,
  };
  
  return (
    <div className={`responsive-row ${className}`} style={style} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            style: {
              ...child.props.style,
              paddingLeft: gutter[0] / 2,
              paddingRight: gutter[0] / 2,
              paddingTop: gutter[1] / 2,
              paddingBottom: gutter[1] / 2,
            },
          });
        }
        return child;
      })}
    </div>
  );
}

export function ResponsiveCol({ 
  children, 
  span = 24, 
  xs, 
  sm, 
  md, 
  lg, 
  xl, 
  xxl,
  className = '',
  ...props 
}) {
  const classes = [
    'responsive-col',
    `responsive-col-${span}`,
    xs && `responsive-col-xs-${xs}`,
    sm && `responsive-col-sm-${sm}`,
    md && `responsive-col-md-${md}`,
    lg && `responsive-col-lg-${lg}`,
    xl && `responsive-col-xl-${xl}`,
    xxl && `responsive-col-xxl-${xxl}`,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function ResponsiveCard({ 
  children, 
  title, 
  extra,
  bordered = true,
  hoverable = false,
  loading = false,
  className = '',
  bodyStyle = {},
  ...props 
}) {
  const classes = [
    'responsive-card',
    bordered ? 'responsive-card-bordered' : '',
    hoverable ? 'responsive-card-hoverable' : '',
    loading ? 'responsive-card-loading' : '',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={classes} {...props}>
      {(title || extra) && (
        <div className="responsive-card-header">
          {title && <div className="responsive-card-title">{title}</div>}
          {extra && <div className="responsive-card-extra">{extra}</div>}
        </div>
      )}
      <div className="responsive-card-body" style={bodyStyle}>
        {loading ? (
          <div className="responsive-card-loading-content">
            <div className="responsive-loading-block" style={{ width: '94%' }}></div>
            <div className="responsive-loading-block" style={{ width: '78%' }}></div>
            <div className="responsive-loading-block" style={{ width: '63%' }}></div>
          </div>
        ) : children}
      </div>
    </div>
  );
}

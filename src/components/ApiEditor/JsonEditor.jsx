import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as monaco from 'monaco-editor';
import './JsonEditor.scss';

/**
 * JSON编辑器组件
 * 基于Monaco Editor实现
 */
const JsonEditor = ({ value, onChange, readOnly, height }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);

  // 初始化编辑器
  useEffect(() => {
    if (containerRef.current) {
      // 创建编辑器
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
        language: 'json',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        readOnly: readOnly,
        fontSize: 14,
        tabSize: 2,
        wordWrap: 'on',
        lineNumbers: 'on',
        glyphMargin: false,
        folding: true,
        lineDecorationsWidth: 10,
        lineNumbersMinChars: 3
      });

      // 添加onChange事件监听
      if (onChange && !readOnly) {
        editorRef.current.onDidChangeModelContent(() => {
          try {
            const editorValue = editorRef.current.getValue();
            const jsonValue = JSON.parse(editorValue);
            onChange(jsonValue);
          } catch (error) {
            // 忽略JSON解析错误
            console.warn('JSON解析错误:', error);
          }
        });
      }

      // 添加格式化快捷键
      editorRef.current.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
        editorRef.current.getAction('editor.action.formatDocument').run();
      });
    }

    // 清理函数
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, [readOnly]);

  // 更新编辑器值
  useEffect(() => {
    if (editorRef.current) {
      const editorValue = editorRef.current.getValue();
      const newValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

      // 只有当值发生变化时才更新
      if (editorValue !== newValue) {
        editorRef.current.setValue(newValue);
      }
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="json-editor-container"
      style={{ height: height || '300px' }}
    />
  );
};

JsonEditor.propTypes = {
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onChange: PropTypes.func,
  readOnly: PropTypes.bool,
  height: PropTypes.string
};

JsonEditor.defaultProps = {
  value: {},
  onChange: null,
  readOnly: false,
  height: '300px'
};

export default JsonEditor;

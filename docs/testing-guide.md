# 数据填报中心测试指南

## 概述
本文档提供数据填报中心的完整测试策略和实施指南，包括单元测试、集成测试和端到端测试。

## 测试策略

### 测试金字塔
```
    ┌─────────────────┐
    │   E2E Tests     │  ← 少量，覆盖关键用户流程
    │   (Cypress)     │
    ├─────────────────┤
    │ Integration     │  ← 中等数量，测试组件交互
    │ Tests (RTL)     │
    ├─────────────────┤
    │  Unit Tests     │  ← 大量，测试单个函数/组件
    │  (Jest + RTL)   │
    └─────────────────┘
```

## 环境配置

### 1. 测试依赖安装
```bash
# 安装测试相关依赖
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev cypress @cypress/react @cypress/webpack-dev-server
npm install --save-dev jest-environment-jsdom
npm install --save-dev msw  # Mock Service Worker
```

### 2. Jest配置
创建 `jest.config.js`：
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.stories.{js,jsx}',
    '!src/**/*.test.{js,jsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### 3. 测试环境设置
创建 `src/setupTests.js`：
```javascript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// 启动 MSW 服务器
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
```

## 单元测试

### 1. 组件测试示例

#### 1.1 FormRenderer 组件测试
```javascript
// src/features/dataEntry/components/FormRenderer/__tests__/FormRenderer.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormRenderer from '../FormRenderer';
import { sampleFormTemplates } from '../../data/sampleTemplates';

// Mock 依赖
jest.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test User' }
  })
}));

jest.mock('../../services/formSubmissionService', () => ({
  submitForm: jest.fn()
}));

describe('FormRenderer', () => {
  const mockTemplate = sampleFormTemplates[0];
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form template correctly', () => {
    render(
      <FormRenderer
        template={mockTemplate}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(mockTemplate.name)).toBeInTheDocument();
    expect(screen.getByText(mockTemplate.description)).toBeInTheDocument();
  });

  test('displays form fields based on schema', () => {
    render(
      <FormRenderer
        template={mockTemplate}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // 检查基本信息字段
    expect(screen.getByLabelText('化验日期')).toBeInTheDocument();
    expect(screen.getByLabelText('站点')).toBeInTheDocument();
    expect(screen.getByLabelText('化验员')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <FormRenderer
        template={mockTemplate}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // 尝试提交空表单
    const submitButton = screen.getByText('提交表单');
    await user.click(submitButton);

    // 检查验证错误
    await waitFor(() => {
      expect(screen.getByText('请选择化验日期')).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    const formSubmissionService = require('../../services/formSubmissionService');
    formSubmissionService.submitForm.mockResolvedValue({
      success: true,
      data: { id: 'submission-123' }
    });

    render(
      <FormRenderer
        template={mockTemplate}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // 填写表单
    await user.type(screen.getByLabelText('化验员'), 'Test User');
    // ... 填写其他必填字段

    // 提交表单
    const submitButton = screen.getByText('提交表单');
    await user.click(submitButton);

    await waitFor(() => {
      expect(formSubmissionService.submitForm).toHaveBeenCalled();
      expect(mockOnSubmit).toHaveBeenCalledWith(
        { id: 'submission-123' },
        'submitted'
      );
    });
  });

  test('handles readonly mode', () => {
    render(
      <FormRenderer
        template={mockTemplate}
        readonly={true}
        showActions={false}
      />
    );

    expect(screen.getByText('只读模式')).toBeInTheDocument();
    expect(screen.queryByText('提交表单')).not.toBeInTheDocument();
  });
});
```

#### 1.2 FormTemplateManager 组件测试
```javascript
// src/features/dataEntry/components/FormTemplateManager/__tests__/FormTemplateManager.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormTemplateManager from '../FormTemplateManager';

// Mock 依赖
jest.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin', name: 'Admin User' },
    isAdmin: true
  })
}));

const mockTemplates = [
  {
    id: 'template-1',
    name: '测试模板1',
    description: '测试描述1',
    category: 'lab_data',
    status: 'published',
    version: '1.0.0',
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

jest.mock('../../services/formTemplateService', () => ({
  getTemplates: jest.fn(),
  getCategories: jest.fn(),
  deleteTemplate: jest.fn(),
  publishTemplate: jest.fn()
}));

describe('FormTemplateManager', () => {
  beforeEach(() => {
    const formTemplateService = require('../../services/formTemplateService');
    formTemplateService.getTemplates.mockResolvedValue({
      success: true,
      data: { items: mockTemplates, total: 1 }
    });
    formTemplateService.getCategories.mockResolvedValue({
      success: true,
      data: []
    });
  });

  test('renders template list', async () => {
    render(<FormTemplateManager />);

    await waitFor(() => {
      expect(screen.getByText('测试模板1')).toBeInTheDocument();
      expect(screen.getByText('测试描述1')).toBeInTheDocument();
    });
  });

  test('filters templates by search', async () => {
    const user = userEvent.setup();
    const formTemplateService = require('../../services/formTemplateService');
    
    render(<FormTemplateManager />);

    const searchInput = screen.getByPlaceholderText('搜索模板名称');
    await user.type(searchInput, '测试');

    await waitFor(() => {
      expect(formTemplateService.getTemplates).toHaveBeenCalledWith(
        expect.objectContaining({ search: '测试' })
      );
    });
  });

  test('deletes template', async () => {
    const user = userEvent.setup();
    const formTemplateService = require('../../services/formTemplateService');
    formTemplateService.deleteTemplate.mockResolvedValue({ success: true });

    render(<FormTemplateManager />);

    await waitFor(() => {
      expect(screen.getByText('测试模板1')).toBeInTheDocument();
    });

    // 点击删除按钮
    const deleteButton = screen.getByRole('button', { name: /删除/i });
    await user.click(deleteButton);

    // 确认删除
    const confirmButton = screen.getByText('确定');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(formTemplateService.deleteTemplate).toHaveBeenCalledWith('template-1');
    });
  });
});
```

### 2. 服务层测试

#### 2.1 API服务测试
```javascript
// src/features/dataEntry/services/__tests__/formTemplateService.test.js

import formTemplateService from '../formTemplateService';
import apiManager from '../../../../services/api/core/apiManager';

// Mock apiManager
jest.mock('../../../../services/api/core/apiManager', () => ({
  registry: {
    register: jest.fn()
  },
  call: jest.fn()
}));

describe('FormTemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registers APIs on initialization', () => {
    expect(apiManager.registry.register).toHaveBeenCalledWith(
      'getFormTemplates',
      expect.objectContaining({
        name: '获取表单模板列表',
        url: 'http://localhost:1880/api/form-templates',
        method: 'GET'
      })
    );
  });

  test('getTemplates calls API with correct parameters', async () => {
    const mockResponse = {
      success: true,
      data: { items: [], total: 0 }
    };
    apiManager.call.mockResolvedValue(mockResponse);

    const params = { page: 1, pageSize: 10 };
    const result = await formTemplateService.getTemplates(params);

    expect(apiManager.call).toHaveBeenCalledWith(
      'getFormTemplates',
      params,
      { showError: true }
    );
    expect(result).toEqual(mockResponse);
  });

  test('createTemplate handles API errors', async () => {
    const error = new Error('API Error');
    apiManager.call.mockRejectedValue(error);

    await expect(
      formTemplateService.createTemplate({})
    ).rejects.toThrow('API Error');
  });
});
```

## 集成测试

### 1. 组件交互测试
```javascript
// src/features/dataEntry/__tests__/DataEntryFlow.test.jsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DataEntryCenter from '../pages/DataEntryCenter';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Data Entry Flow Integration', () => {
  test('complete form submission flow', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<DataEntryCenter />);

    // 等待页面加载
    await waitFor(() => {
      expect(screen.getByText('数据填报中心')).toBeInTheDocument();
    });

    // 选择表单模板
    const formButton = screen.getByText('开始填写');
    await user.click(formButton);

    // 填写表单
    await waitFor(() => {
      expect(screen.getByLabelText('化验日期')).toBeInTheDocument();
    });

    // 提交表单
    const submitButton = screen.getByText('提交表单');
    await user.click(submitButton);

    // 验证提交结果
    await waitFor(() => {
      expect(screen.getByText('表单提交成功')).toBeInTheDocument();
    });
  });
});
```

### 2. API集成测试
```javascript
// src/features/dataEntry/__tests__/ApiIntegration.test.js

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import formTemplateService from '../services/formTemplateService';

const server = setupServer(
  rest.get('http://localhost:1880/api/form-templates', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          items: [
            {
              id: 'template-1',
              name: '测试模板',
              status: 'published'
            }
          ],
          total: 1
        }
      })
    );
  }),

  rest.post('http://localhost:1880/api/form-templates', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          id: 'new-template',
          ...req.body
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Integration Tests', () => {
  test('fetches templates successfully', async () => {
    const result = await formTemplateService.getTemplates();
    
    expect(result.success).toBe(true);
    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0].name).toBe('测试模板');
  });

  test('creates template successfully', async () => {
    const templateData = {
      name: '新模板',
      description: '测试描述',
      category: 'lab_data'
    };

    const result = await formTemplateService.createTemplate(templateData);
    
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('新模板');
  });
});
```

## 端到端测试 (E2E)

### 1. Cypress配置
创建 `cypress.config.js`：
```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true
  },
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack'
    }
  }
});
```

### 2. E2E测试用例
```javascript
// cypress/e2e/form-management.cy.js

describe('Form Management E2E', () => {
  beforeEach(() => {
    // 登录
    cy.visit('/login');
    cy.get('[data-testid=username]').type('admin');
    cy.get('[data-testid=password]').type('password');
    cy.get('[data-testid=login-button]').click();
    
    // 导航到数据填报中心
    cy.visit('/data-entry');
  });

  it('should create and publish a form template', () => {
    // 进入模板管理
    cy.get('[data-testid=template-management]').click();
    
    // 创建新模板
    cy.get('[data-testid=create-template]').click();
    
    // 填写模板信息
    cy.get('[data-testid=template-name]').type('E2E测试模板');
    cy.get('[data-testid=template-description]').type('端到端测试模板');
    cy.get('[data-testid=template-category]').select('lab_data');
    
    // 设计表单
    cy.get('[data-testid=form-designer]').should('be.visible');
    
    // 拖拽输入框组件
    cy.get('[data-testid=input-component]')
      .drag('[data-testid=design-canvas]');
    
    // 保存模板
    cy.get('[data-testid=save-template]').click();
    cy.get('[data-testid=confirm-save]').click();
    
    // 验证模板创建成功
    cy.contains('模板创建成功').should('be.visible');
    
    // 发布模板
    cy.get('[data-testid=publish-template]').click();
    cy.contains('模板发布成功').should('be.visible');
  });

  it('should fill and submit a form', () => {
    // 选择表单模板
    cy.get('[data-testid=form-template]').first().click();
    cy.get('[data-testid=start-form]').click();
    
    // 填写表单
    cy.get('[data-testid=form-field-date]').type('2024-01-15');
    cy.get('[data-testid=form-field-site]').select('site_001');
    cy.get('[data-testid=form-field-operator]').type('测试用户');
    
    // 提交表单
    cy.get('[data-testid=submit-form]').click();
    
    // 验证提交成功
    cy.contains('表单提交成功').should('be.visible');
    
    // 返回首页
    cy.get('[data-testid=back-home]').click();
    cy.url().should('include', '/data-entry');
  });

  it('should handle form validation errors', () => {
    // 选择表单模板
    cy.get('[data-testid=form-template]').first().click();
    cy.get('[data-testid=start-form]').click();
    
    // 尝试提交空表单
    cy.get('[data-testid=submit-form]').click();
    
    // 验证错误信息
    cy.contains('请选择化验日期').should('be.visible');
    cy.contains('请选择站点').should('be.visible');
    cy.contains('请输入化验员姓名').should('be.visible');
  });
});
```

### 3. 性能测试
```javascript
// cypress/e2e/performance.cy.js

describe('Performance Tests', () => {
  it('should load form designer within acceptable time', () => {
    cy.visit('/data-entry');
    
    // 测试页面加载时间
    cy.window().its('performance').then((performance) => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      expect(loadTime).to.be.lessThan(3000); // 3秒内加载完成
    });
    
    // 测试表单设计器加载
    cy.get('[data-testid=template-management]').click();
    cy.get('[data-testid=create-template]').click();
    
    cy.get('[data-testid=form-designer]', { timeout: 5000 })
      .should('be.visible');
  });
});
```

## 测试数据管理

### 1. 测试数据工厂
```javascript
// src/test-utils/factories.js

export const createMockTemplate = (overrides = {}) => ({
  id: 'template-123',
  name: '测试模板',
  description: '测试描述',
  category: 'lab_data',
  version: '1.0.0',
  status: 'published',
  createdBy: 'admin',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  permissions: ['user', 'admin'],
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: '姓名',
        'x-component': 'Input'
      }
    }
  },
  ...overrides
});

export const createMockSubmission = (overrides = {}) => ({
  id: 'submission-123',
  templateId: 'template-123',
  templateName: '测试模板',
  data: { name: '测试用户' },
  status: 'pending',
  submittedBy: 'user123',
  submittedAt: '2024-01-15T10:00:00Z',
  ...overrides
});
```

### 2. 测试工具函数
```javascript
// src/test-utils/index.js

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

export const renderWithProviders = (ui, options = {}) => {
  const { initialEntries = ['/'], user = null, ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider value={{ user, isAdmin: user?.role === 'admin' }}>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from '@testing-library/react';
export { renderWithProviders as render };
```

## 测试执行

### 1. 运行测试命令
```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test FormRenderer.test.jsx

# 监听模式运行测试
npm test -- --watch

# 运行E2E测试
npm run cypress:open
npm run cypress:run
```

### 2. CI/CD集成
```yaml
# .github/workflows/test.yml

name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Run E2E tests
      run: |
        npm start &
        npm run cypress:run
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## 测试最佳实践

### 1. 测试原则
- **AAA模式**: Arrange (准备) → Act (执行) → Assert (断言)
- **单一职责**: 每个测试只验证一个功能点
- **独立性**: 测试之间不应相互依赖
- **可重复性**: 测试结果应该一致

### 2. 命名规范
```javascript
// 好的测试命名
describe('FormRenderer', () => {
  test('should display validation error when required field is empty', () => {
    // 测试内容
  });
  
  test('should submit form successfully with valid data', () => {
    // 测试内容
  });
});
```

### 3. Mock策略
- 对外部依赖进行Mock
- 保持Mock的简单性
- 验证Mock的调用

### 4. 测试覆盖率目标
- 行覆盖率: ≥ 80%
- 分支覆盖率: ≥ 70%
- 函数覆盖率: ≥ 80%
- 语句覆盖率: ≥ 80% 
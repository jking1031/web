// 简单的数据提供者，使用内存数据
const data = {
  posts: [
    { id: 1, title: '第一篇文章', body: '这是第一篇文章的内容' },
    { id: 2, title: '第二篇文章', body: '这是第二篇文章的内容' },
    { id: 3, title: '第三篇文章', body: '这是第三篇文章的内容' },
  ],
  users: [
    { id: 1, name: '张三', email: 'zhangsan@example.com' },
    { id: 2, name: '李四', email: 'lisi@example.com' },
  ],
};

const simpleDataProvider = {
  // 获取资源列表
  getList: (resource, params) => {
    console.log(`simpleDataProvider.getList(${resource})`, params);
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
    const start = (page - 1) * perPage;
    const end = page * perPage;
    
    const items = data[resource] || [];
    
    return Promise.resolve({
      data: items.slice(start, end),
      total: items.length,
    });
  },
  
  // 获取一个资源
  getOne: (resource, params) => {
    console.log(`simpleDataProvider.getOne(${resource})`, params);
    const item = (data[resource] || []).find(item => item.id === params.id);
    
    return Promise.resolve({
      data: item || null,
    });
  },
  
  // 获取多个资源
  getMany: (resource, params) => {
    console.log(`simpleDataProvider.getMany(${resource})`, params);
    const items = (data[resource] || []).filter(item => params.ids.includes(item.id));
    
    return Promise.resolve({
      data: items,
    });
  },
  
  // 获取引用的多个资源
  getManyReference: (resource, params) => {
    console.log(`simpleDataProvider.getManyReference(${resource})`, params);
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
    const start = (page - 1) * perPage;
    const end = page * perPage;
    
    const items = (data[resource] || []).filter(item => item[params.target] === params.id);
    
    return Promise.resolve({
      data: items.slice(start, end),
      total: items.length,
    });
  },
  
  // 创建资源
  create: (resource, params) => {
    console.log(`simpleDataProvider.create(${resource})`, params);
    const newId = Math.max(0, ...(data[resource] || []).map(item => item.id)) + 1;
    const newItem = { ...params.data, id: newId };
    
    if (!data[resource]) {
      data[resource] = [];
    }
    
    data[resource].push(newItem);
    
    return Promise.resolve({
      data: newItem,
    });
  },
  
  // 更新资源
  update: (resource, params) => {
    console.log(`simpleDataProvider.update(${resource})`, params);
    const index = (data[resource] || []).findIndex(item => item.id === params.id);
    
    if (index === -1) {
      return Promise.reject(new Error(`Resource ${resource} with id ${params.id} not found`));
    }
    
    data[resource][index] = { ...data[resource][index], ...params.data };
    
    return Promise.resolve({
      data: data[resource][index],
    });
  },
  
  // 更新多个资源
  updateMany: (resource, params) => {
    console.log(`simpleDataProvider.updateMany(${resource})`, params);
    const updates = params.ids.map(id => {
      const index = (data[resource] || []).findIndex(item => item.id === id);
      
      if (index !== -1) {
        data[resource][index] = { ...data[resource][index], ...params.data };
        return id;
      }
      
      return null;
    }).filter(id => id !== null);
    
    return Promise.resolve({
      data: updates,
    });
  },
  
  // 删除资源
  delete: (resource, params) => {
    console.log(`simpleDataProvider.delete(${resource})`, params);
    const index = (data[resource] || []).findIndex(item => item.id === params.id);
    
    if (index === -1) {
      return Promise.reject(new Error(`Resource ${resource} with id ${params.id} not found`));
    }
    
    const deletedItem = data[resource][index];
    data[resource].splice(index, 1);
    
    return Promise.resolve({
      data: deletedItem,
    });
  },
  
  // 删除多个资源
  deleteMany: (resource, params) => {
    console.log(`simpleDataProvider.deleteMany(${resource})`, params);
    const deletedIds = [];
    
    params.ids.forEach(id => {
      const index = (data[resource] || []).findIndex(item => item.id === id);
      
      if (index !== -1) {
        deletedIds.push(id);
        data[resource].splice(index, 1);
      }
    });
    
    return Promise.resolve({
      data: deletedIds,
    });
  },
};

export default simpleDataProvider;

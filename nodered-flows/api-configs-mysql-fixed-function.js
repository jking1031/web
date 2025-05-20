// 检查记录是否存在
const exists = msg.payload && msg.payload[0] && msg.payload[0].count > 0;

// 从之前的节点获取API配置数据
const apiConfigsData = msg._apiConfigs;

// 准备SQL语句 - 不使用参数绑定，直接构建SQL语句
// 注意：这种方式不是最佳实践（可能有SQL注入风险），但可以解决当前的语法错误
if (exists) {
    // 更新现有记录 - 直接在SQL中包含值
    const configsEscaped = apiConfigsData.configsJson.replace(/'/g, "''"); // 转义单引号
    msg.topic = `UPDATE api_configs SET 
                configs = '${configsEscaped}', 
                timestamp = '${apiConfigsData.timestamp}', 
                count = ${apiConfigsData.count} 
                WHERE id = 1`;
    
    // 清除参数，因为我们直接在SQL中包含了值
    msg.params = [];
} else {
    // 插入新记录 - 直接在SQL中包含值
    const configsEscaped = apiConfigsData.configsJson.replace(/'/g, "''"); // 转义单引号
    msg.topic = `INSERT INTO api_configs (id, configs, timestamp, count) 
                VALUES (1, '${configsEscaped}', '${apiConfigsData.timestamp}', ${apiConfigsData.count})`;
    
    // 清除参数，因为我们直接在SQL中包含了值
    msg.params = [];
}

// 添加调试信息
node.warn({
    action: exists ? 'update' : 'insert',
    sql: msg.topic.substring(0, 100) + '...', // 只显示SQL的前100个字符
    timestamp: apiConfigsData.timestamp,
    count: apiConfigsData.count,
    configsJsonLength: apiConfigsData.configsJson.length
});

return msg;

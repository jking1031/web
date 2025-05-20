// 检查记录是否存在
const exists = msg.payload && msg.payload[0] && msg.payload[0].count > 0;

// 从之前的节点获取API配置数据
const apiConfigsData = msg._apiConfigs;

// 使用正确的预处理语句方式
if (exists) {
    // 更新现有记录
    msg.topic = "UPDATE api_configs SET configs = ?, timestamp = ?, count = ? WHERE id = 1";
    
    // 设置参数数组
    msg.payload = [
        apiConfigsData.configsJson,
        apiConfigsData.timestamp,
        apiConfigsData.count
    ];
} else {
    // 插入新记录
    msg.topic = "INSERT INTO api_configs (id, configs, timestamp, count) VALUES (1, ?, ?, ?)";
    
    // 设置参数数组
    msg.payload = [
        apiConfigsData.configsJson,
        apiConfigsData.timestamp,
        apiConfigsData.count
    ];
}

// 添加调试信息
node.warn({
    action: exists ? 'update' : 'insert',
    sql: msg.topic,
    paramsCount: msg.payload.length,
    timestamp: apiConfigsData.timestamp,
    count: apiConfigsData.count,
    configsJsonLength: apiConfigsData.configsJson.length
});

// 设置MySQL节点需要的特殊属性
msg.queryType = "prepared";

return msg;

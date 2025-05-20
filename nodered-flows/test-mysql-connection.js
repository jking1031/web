/**
 * Node-RED MySQL连接测试脚本
 * 
 * 使用方法：
 * 1. 在Node-RED中创建一个函数节点
 * 2. 将此脚本的内容复制到函数节点中
 * 3. 修改配置信息
 * 4. 连接一个inject节点作为输入
 * 5. 连接一个debug节点作为输出
 * 6. 部署并触发inject节点
 */

// 配置信息
const config = {
    host: 'localhost',      // MySQL主机名
    port: 3306,             // MySQL端口
    user: 'your_username',  // MySQL用户名
    password: 'your_password', // MySQL密码
    database: 'nodered_db'  // 数据库名称
};

// 创建测试表的SQL
const createTableSQL = `
CREATE TABLE IF NOT EXISTS test_connection (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    test_value VARCHAR(100)
)
`;

// 插入测试数据的SQL
const insertDataSQL = `
INSERT INTO test_connection (test_value) VALUES (?)
`;

// 查询测试数据的SQL
const queryDataSQL = `
SELECT * FROM test_connection ORDER BY id DESC LIMIT 5
`;

// 测试连接
function testConnection() {
    return new Promise((resolve, reject) => {
        const mysql = global.get('mysql');
        if (!mysql) {
            reject(new Error('MySQL模块未加载，请确保已安装node-red-node-mysql'));
            return;
        }
        
        const connection = mysql.createConnection(config);
        
        connection.connect((err) => {
            if (err) {
                reject(new Error(`连接失败: ${err.message}`));
                return;
            }
            
            resolve('连接成功');
            connection.end();
        });
    });
}

// 测试创建表
function testCreateTable() {
    return new Promise((resolve, reject) => {
        const mysql = global.get('mysql');
        const connection = mysql.createConnection(config);
        
        connection.query(createTableSQL, (err, results) => {
            if (err) {
                connection.end();
                reject(new Error(`创建表失败: ${err.message}`));
                return;
            }
            
            resolve('创建表成功');
            connection.end();
        });
    });
}

// 测试插入数据
function testInsertData() {
    return new Promise((resolve, reject) => {
        const mysql = global.get('mysql');
        const connection = mysql.createConnection(config);
        const testValue = `测试值 ${new Date().toISOString()}`;
        
        connection.query(insertDataSQL, [testValue], (err, results) => {
            if (err) {
                connection.end();
                reject(new Error(`插入数据失败: ${err.message}`));
                return;
            }
            
            resolve(`插入数据成功，ID: ${results.insertId}`);
            connection.end();
        });
    });
}

// 测试查询数据
function testQueryData() {
    return new Promise((resolve, reject) => {
        const mysql = global.get('mysql');
        const connection = mysql.createConnection(config);
        
        connection.query(queryDataSQL, (err, results) => {
            if (err) {
                connection.end();
                reject(new Error(`查询数据失败: ${err.message}`));
                return;
            }
            
            resolve({
                message: `查询数据成功，获取到 ${results.length} 条记录`,
                data: results
            });
            connection.end();
        });
    });
}

// 执行所有测试
async function runAllTests() {
    const results = {
        connection: null,
        createTable: null,
        insertData: null,
        queryData: null
    };
    
    try {
        results.connection = await testConnection();
        results.createTable = await testCreateTable();
        results.insertData = await testInsertData();
        results.queryData = await testQueryData();
        results.success = true;
    } catch (error) {
        results.error = error.message;
        results.success = false;
    }
    
    return results;
}

// 主函数
async function main() {
    try {
        const results = await runAllTests();
        node.status({
            fill: results.success ? "green" : "red",
            shape: "dot",
            text: results.success ? "测试成功" : "测试失败"
        });
        return { payload: results };
    } catch (error) {
        node.status({
            fill: "red",
            shape: "ring",
            text: "测试出错"
        });
        return { payload: { success: false, error: error.message } };
    }
}

// 执行主函数并返回结果
return main();

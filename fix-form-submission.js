/**
 * Node-RED 表单提交修复脚本
 * 将此脚本复制到 Node-RED 的函数节点中，替换原有的表单提交处理代码
 */

// 表单提交处理函数 - 替换原有的 submit-form-handler 节点
const formId = msg.req.params.id;
const formData = msg.payload;

if (!formId) {
    msg.statusCode = 400;
    msg.payload = {
        success: false,
        message: "提交表单数据需要提供表单ID"
    };
    return [null, msg];
}

// 准备提交数据
const now = new Date().toISOString();
const submissionId = 'submission_' + Date.now();

// 将表单数据转换为JSON字符串
let dataJson;
try {
    if (typeof formData === 'object') {
        dataJson = JSON.stringify(formData);
    } else {
        dataJson = JSON.stringify({rawData: formData});
    }
} catch (e) {
    dataJson = JSON.stringify({error: "数据格式错误", message: e.message});
}

// 设置SQL插入语句
msg.topic = `INSERT INTO form_submissions (id, formId, data, submittedBy, submittedAt, status) VALUES (?, ?, ?, ?, ?, ?)`;

const submittedBy = msg.req.headers['x-user-id'] || 'anonymous';

msg.params = [
    submissionId,
    formId,
    dataJson,
    submittedBy,
    now,
    'processed'
];

// 保存原始数据用于返回
msg.submissionData = {
    id: submissionId,
    formId: formId,
    data: formData,
    submittedBy: submittedBy,
    submittedAt: now,
    status: 'processed'
};

// 保存数据到全局变量，以便验证时使用
try {
    // 初始化全局变量（如果不存在）
    const formSubmissions = global.get("formSubmissions") || {};
    
    // 初始化这个表单的提交数组（如果不存在）
    if (!formSubmissions[formId]) {
        formSubmissions[formId] = [];
    }
    
    // 添加新的提交到数组开头
    formSubmissions[formId].unshift({
        id: submissionId,
        data: {
            submission: formData  // 使用验证逻辑期望的格式
        }
    });
    
    // 限制每个表单最多保存10条记录
    if (formSubmissions[formId].length > 10) {
        formSubmissions[formId] = formSubmissions[formId].slice(0, 10);
    }
    
    // 保存回全局变量
    global.set("formSubmissions", formSubmissions);
    
    // 添加调试信息
    node.warn(`表单提交已保存到全局变量，formId: ${formId}, submissionId: ${submissionId}`);
    node.warn(`全局变量中该表单的提交记录数: ${formSubmissions[formId].length}`);
} catch (error) {
    node.error(`保存表单提交到全局变量失败: ${error.message}`);
}

// 返回结果
return [msg, null];

// ------------------------------------------------------------------------

// 验证表单提交处理函数 - 替换原有的 verify-submission-handler 节点
/**
 * 此函数处理表单提交验证请求
 * 先检查全局变量中是否有该表单的提交记录
 * 如果没有，再从数据库查询
 */
if (!msg.req.params.id) {
    msg.statusCode = 400;
    msg.payload = { 
        success: false, 
        message: '验证提交需要提供表单ID' 
    };
    return [null, msg];
}

const formId = msg.req.params.id;

// 首先检查全局变量中是否有该表单的提交记录
const formSubmissions = global.get("formSubmissions") || {};
const submissions = formSubmissions[formId] || [];

if (submissions.length > 0) {
    // 全局变量中有记录，直接返回
    node.warn(`从全局变量中找到表单(${formId})的提交记录，共${submissions.length}条`);
    
    msg.payload = {
        success: true,
        message: "验证成功，找到提交记录",
        data: {
            found: true,
            source: "global_variable",
            submission: submissions[0]
        }
    };
    
    return [null, msg];
} else {
    // 全局变量中没有记录，查询数据库
    node.warn(`全局变量中没有表单(${formId})的提交记录，尝试从数据库查询`);
    
    // 设置SQL查询 - 获取最近的提交记录
    msg.topic = "SELECT * FROM form_submissions WHERE formId = ? ORDER BY submittedAt DESC LIMIT 1";
    msg.params = [formId];
    
    return [msg, null];
} 
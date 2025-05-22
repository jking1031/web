#!/bin/bash

# 修复 ApiDataPage.jsx 中的导入路径
sed -i.bak 's|../../services/apiManager|../../../services/apiManager|g; s|../../components/JsonEditor/JsonEditor|../../../components/JsonEditor/JsonEditor|g' ./src/features/apiManagement/pages/ApiDataPage.jsx

# 修复 DataSourceManager.jsx 中的导入路径
sed -i.bak 's|../../components/JsonEditor/JsonEditor|../../../components/JsonEditor/JsonEditor|g; s|../../services/dbService|../../../services/dbService|g; s|../../utils/EventEmitter|../../../utils/EventEmitter|g' ./src/features/apiManagement/pages/DataSourceManager.jsx

# 修复 DatabaseManager.jsx 中的导入路径
sed -i.bak 's|../../services/dbService|../../../services/dbService|g; s|../../utils/EventEmitter|../../../utils/EventEmitter|g; s|../../components/DatabaseTest/DatabaseTest|../../../components/DatabaseTest/DatabaseTest|g' ./src/features/apiManagement/pages/DatabaseManager.jsx

# 修复 QueryManager.jsx 中的导入路径
sed -i.bak 's|../../components/JsonEditor/JsonEditor|../../../components/JsonEditor/JsonEditor|g; s|../../services/dbService|../../../services/dbService|g' ./src/features/apiManagement/pages/QueryManager.jsx

# 删除备份文件
find ./src/features/apiManagement -name "*.bak" -delete

echo "导入路径修复完成"

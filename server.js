const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const port = 3300;
const wbMappingPath = path.join(__dirname, 'wb-mapping.json');

// 允许解析 JSON 请求体
app.use(express.json());

// 静态文件服务
app.use(express.static('public'));

// 读取 wb-mapping.json 文件
function readWBMapping() {
    if (fs.existsSync(wbMappingPath)) {
        const data = fs.readFileSync(wbMappingPath, 'utf-8');
        return JSON.parse(data);
    }
    return {};
}

// 写入 wb-mapping.json 文件
function writeWBMapping(data) {
    fs.writeFileSync(wbMappingPath, JSON.stringify(data, null, 2), 'utf-8');
}

// 获取 wb-mapping.json 数据
app.get('/wb-mapping', (req, res) => {
    const wbMapping = readWBMapping();
    res.json(wbMapping);
});

// 追加键值对到 wb-mapping.json
app.post('/add-mapping', (req, res) => {
    const newMapping = req.body; // 用户输入的键值对
    if (!newMapping || Object.keys(newMapping).length === 0) {
        return res.status(400).json({ error: '请输入有效的键值对！' });
    }

    // 读取现有数据
    const wbMapping = readWBMapping();

    // 合并新键值对
    Object.assign(wbMapping, newMapping);

    // 写回文件
    writeWBMapping(wbMapping);

    res.json({ success: true, message: '键值对已追加到 wb-mapping.json 文件！' });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
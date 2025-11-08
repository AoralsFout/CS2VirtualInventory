/**
 * 解决跨域问题：代理Steam Web API - 获取Steam用户信息
*/

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 中间件配置
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体

// Steam API代理路由 - 获取Steam用户信息
app.get('/getSteamUserInfo', async (req, res) => {
    try {
        const { steamId } = req.query;
        
        if (!steamId) {
            return res.status(400).json({ 
                error: '缺少steamId参数',
                usage: 'http://localhost:3000/getSteamUserInfo?steamId=STEAM_ID'
            });
        }

        // 调用Steam Web API获取用户信息
        const response = await axios.get(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`, {
            params: {
                key: process.env.STEAM_API_KEY || 'DAB8E9390FACD978F4A89A222F50F71B',
                steamids: steamId
            },
            timeout: 10000 // 10秒超时
        });

        const data = response.data;
        
        if (data.response && data.response.players && data.response.players.length > 0) {
            res.json({
                success: true,
                data: data.response.players[0]
            });
        } else {
            res.status(404).json({
                success: false,
                error: '未找到该Steam用户'
            });
        }

    } catch (error) {
        console.error('Steam API请求错误:', error);
        
        if (error.response) {
            // Steam API返回的错误
            res.status(error.response.status).json({
                success: false,
                error: `Steam API错误: ${error.response.status} - ${error.response.statusText}`
            });
        } else if (error.request) {
            // 网络错误
            res.status(500).json({
                success: false,
                error: '网络连接错误，请检查网络连接'
            });
        } else {
            // 其他错误
            res.status(500).json({
                success: false,
                error: '服务器内部错误'
            });
        }
    }
});

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'VirtualInventory Proxy Server'
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: 'VirtualInventory 代理服务器运行中',
        endpoints: {
            '/getSteamUserInfo': '获取Steam用户信息',
            '/proxy/*': '通用API代理',
            '/health': '健康检查'
        },
        usage: 'http://localhost:3000/getSteamUserInfo?steamId=STEAM_ID'
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('服务器错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 代理服务器运行在 http://localhost:${PORT}`);
    console.log('📋 可用端点:');
    console.log('   GET  /getSteamUserInfo?steamId=ID - 获取Steam用户信息');
    console.log('   GET  /health - 健康检查');
    console.log('   GET  / - 服务器信息');
});

module.exports = app;
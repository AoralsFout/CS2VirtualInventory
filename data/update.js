const fs = require('fs');
const axios = require('axios');
const path = require('path');

// 远程数据URL
const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/zh-CN/all.json';
// 本地存储路径
const LOCAL_DATA_PATH = 'data/json/all.json';

async function downloadAndProcessData() {
    try {
        console.log('🚀 开始下载远程数据...');
        console.log(`📥 下载地址: ${REMOTE_DATA_URL}`);
        
        // 下载远程数据
        const response = await axios.get(REMOTE_DATA_URL, {
            timeout: 30000, // 30秒超时
            headers: {
                'User-Agent': 'VirtualInventory/1.0'
            }
        });

        console.log('✅ 远程数据下载成功');
        console.log(`📊 数据大小: ${JSON.stringify(response.data).length} 字符`);

        // 确保目录存在
        const dirPath = path.dirname(LOCAL_DATA_PATH);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`📁 创建目录: ${dirPath}`);
        }

        // 保存到本地文件
        fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(response.data, null, 2));
        console.log(`💾 数据已保存到: ${LOCAL_DATA_PATH}`);

        // 处理数据
        await processData(response.data);

    } catch (error) {
        console.error('❌ 下载或处理数据时出错:', error.message);
        if (error.code === 'ENOTFOUND') {
            console.error('🌐 网络连接错误，请检查网络连接');
        } else if (error.response) {
            console.error(`📡 HTTP错误: ${error.response.status} - ${error.response.statusText}`);
        }
        process.exit(1);
    }
}

async function processData(jsonData) {
    console.log('🔧 开始处理数据...');
    
    try {
        // 创建一个空对象来存储分类后的数据
        const tabel = {};
        let totalItems = Object.keys(jsonData).length;
        let processedItems = 0;
        let skinItems = 0;
        let otherItems = 0;

        console.log(`📋 总共需要处理 ${totalItems} 个物品`);

        // 遍历原始数据中的每个条目
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                processedItems++;
                const item = jsonData[key];
                const { id, name, rarity } = item;

                // 显示进度
                if (processedItems % 100 === 0) {
                    console.log(`📈 处理进度: ${processedItems}/${totalItems} (${Math.round(processedItems/totalItems*100)}%)`);
                }

                // 检查 name 是否存在
                if (!name) {
                    console.warn(`⚠️ 跳过物品 ${key}: name 未定义`);
                    continue;
                }

                // 处理 skin 前缀的数据
                if (key.startsWith('skin-')) {
                    skinItems++;
                    // 解析 name 字段
                    const nameParts = name.split(' | ');

                    // 检查 nameParts 是否符合预期格式
                    if (nameParts.length < 2) {
                        console.warn(`⚠️ 跳过皮肤物品 ${key}: 名称格式无效`);
                        continue;
                    }

                    let weaponName = nameParts[0].trim(); // 提取武器名称

                    // 去除子类信息（例如 StatTrak™、Souvenir 等）
                    weaponName = weaponName.replace(/（[^）]+）/, '').trim(); // 去除中文括号及其内容
                    weaponName = weaponName.replace(/\([^)]+\)/, '').trim(); // 去除英文括号及其内容

                    const skinName = nameParts[1].split(' (')[0].trim(); // 提取皮肤名称

                    // 如果 skin 分类不存在，初始化一个空对象
                    if (!tabel.skin) {
                        tabel.skin = {};
                    }

                    // 如果武器名称不存在，初始化一个空数组
                    if (!tabel.skin[weaponName]) {
                        tabel.skin[weaponName] = [];
                    }

                    // 检查是否已存在相同的皮肤名称
                    const existingSkin = tabel.skin[weaponName].find(
                        (skin) => skin.skinName === `${weaponName} | ${skinName}`
                    );

                    // 如果不存在相同的皮肤名称，则添加到数组中
                    if (!existingSkin) {
                        tabel.skin[weaponName].push({
                            skinName: `${weaponName} | ${skinName}`, // 输出格式为 "weaponName | skinName"
                            skinId: id.split('_')[0], // 提取 skinId（去掉后缀，如 _0, _1）
                            color: rarity?.color || '#ccc',
                        });
                    }
                } else {
                    otherItems++;
                    // 处理其他前缀的数据
                    const prefix = id.split('-')[0]; // 提取前缀
                    if (!tabel[prefix]) {
                        tabel[prefix] = {}; // 如果前缀不存在，初始化一个空对象
                    }
                    tabel[prefix][id] = {
                        id,
                        name,
                        color: rarity?.color || '#ccc',
                    };
                }
            }
        }

        console.log('✅ 数据处理完成');
        console.log(`📊 统计信息:`);
        console.log(`   - 皮肤物品: ${skinItems}`);
        console.log(`   - 其他物品: ${otherItems}`);
        console.log(`   - 总处理: ${processedItems}`);

        // 将分类后的数据保存到 tabel.json 文件中
        fs.writeFile('data/json/tabel.json', JSON.stringify(tabel, null, 2), (err) => {
            if (err) {
                console.error('❌ 保存 tabel.json 时出错:', err);
            } else {
                console.log('💾 Data successfully saved to tabel.json');
                console.log('🎉 所有操作完成！');
            }
        });
    } catch (parseError) {
        console.error('❌ 解析JSON时出错:', parseError);
    }
}

// 检查是否需要安装axios
try {
    require('axios');
} catch (error) {
    console.error('❌ 未找到axios模块，请先安装:');
    console.error('npm install axios');
    process.exit(1);
}

// 执行主函数
downloadAndProcessData();
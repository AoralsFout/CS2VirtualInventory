/**
 * 获取Buff的3D模型贴图，保存到data/paint.json
 */

const fs = require('fs');
const dotenv = require('dotenv');
const { BuffAccount } = require('./BuffApi');
dotenv.config();

const session = process.env.BUFF_SESSION;

// 本地存储路径
const LOCAL_DATA_PATH = 'data/json/all.json';

async function downloadAndProcessData() {
    try {
        const jsonData = JSON.parse(fs.readFileSync(LOCAL_DATA_PATH, 'utf8'));

        // 处理数据
        await processData(jsonData);

    } catch (error) {
        console.error('出错:', error.message);
        process.exit(1);
    }
}

async function processData(jsonData) {
    console.log('🔧 开始处理数据...');

    try {
        // 创建一个空对象来存储分类后的数据
        const paint = {};
        const weapon_name = {}

        // 遍历原始数据中的每个条目
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                const item = jsonData[key];
                const { original, legacy_model, weapon, pattern } = item;
                // 处理 skin 前缀的数据
                if (key.startsWith('skin-') && weapon && pattern) {
                    const k = `${weapon.name}\|${pattern.name}`.replace(/\s/g, "");
                    weapon_name[original.name] = original.name;
                    paint[k] = {
                        legacy_model
                    }
                }
            }
        }

        let account = null;

        try {
            account = await BuffAccount.create(session);
            console.log("登录账号:" + account.username);
        } catch (error) {
            console.error('❌ 登录账号时出错:', error.message);
        }

        // 获取材质贴图
        for (const key in weapon_name) {
            try {
                console.log(`获取${key}材质贴图`);
                const customInspect = await account.getCustomInspect(key);
                if (!customInspect.skins.length || !customInspect.skins[0].hasOwnProperty('texture_url')) {
                    continue;
                }
                customInspect.skins.forEach(skin => {
                    const k = `${skin.weapon_name_desc}\|${skin.skin_name}`.replace(/\s/g, "");
                    paint[k] = {
                        ...paint[k],
                        texture_url: skin.texture_url,
                        model_name: key
                    }
                });
            } catch (error) {
                console.error('❌ 获取材质时出错:', error.message);
            }
        }

        // 将分类后的数据保存到 paint.json 文件中
        fs.writeFile('data/json/paint.json', JSON.stringify(paint, null, 2), (err) => {
            if (err) {
                console.error('❌ 保存 paint.json 时出错:', err);
            } else {
                console.log('💾 Data successfully saved to paint.json');
                console.log('🎉 所有操作完成！');
            }
        });
    } catch (parseError) {
        console.error('❌ 解析JSON时出错:', parseError);
    }
}

// 执行主函数
downloadAndProcessData();
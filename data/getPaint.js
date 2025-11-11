const { default: axios } = require('axios');
const fs = require('fs');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const dotenv = require('dotenv');
dotenv.config();

const session = process.env.BUFF_SESSION;

class BuffAccount {
    constructor(buffCookie, userAgent = BuffAccount.getRandomUA()) {
        this.jar = new CookieJar();
        this.client = wrapper(
            axios.create({
                headers: {
                    "User-Agent": userAgent,
                    Cookie: buffCookie,
                },
                jar: this.jar,
                withCredentials: true,
            })
        );
    }

    static getRandomUA() {
        const firstNum = Math.floor(Math.random() * (62 - 55 + 1)) + 55;
        const osType = [
            "(Windows NT 6.1; WOW64)",
            "(Windows NT 10.0; WOW64)",
            "(X11; Linux x86_64)",
            "(Macintosh; Intel Mac OS X 10_12_6)",
        ];
        return `Mozilla/5.0 ${osType[Math.floor(Math.random() * osType.length)]
            } AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${firstNum}.0.${Math.floor(
                Math.random() * 3200
            )}.${Math.floor(Math.random() * 140)} Safari/537.36`;
    }

    async initialize() {
        try {
            const response = await this.client.get("https://buff.163.com/account/api/user/info");
            this.username = response.data.data.nickname;
            return this;
        } catch (error) {
            throw new Error("Buff登录失败！请检查cookie");
        }
    }

    static async create(buffCookie, userAgent) {
        const instance = new BuffAccount(buffCookie, userAgent);
        return instance.initialize();
    }

    async getHistoryPrice(goods_id, game = "csgo", currency = "CNY", days = 7) {
        const params = {
            goods_id: goods_id,
            game,
            currency,
            days,
        };
        const response = await this.client.get(
            "https://buff.163.com/api/market/goods/price_history/buff/v2",
            {
                params,
            }
        );
        return response.data.data;
    }

    async getCustomInspect(weapon_name) {
        const params = {
            weapon_name: weapon_name,
        };
        const response = await this.client.get(
            "https://buff.163.com/api/market/custom_inspect/get_skins",
            {
                params,
            }
        );
        return response.data.data;
    }
}

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
                const { original } = item;

                // 处理 skin 前缀的数据
                if (key.startsWith('skin-')) {
                    weapon_name[original.name] = original.name
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
                    paint[`${skin.weapon_name_desc} | ${skin.skin_name}`] = {
                        texture_url: skin.texture_url,
                        model_name: key
                    }
                });
                await new Promise(resolve => setTimeout(resolve, 500));
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
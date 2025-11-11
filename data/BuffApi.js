/**
 * Buff账号类，用于登录Buff账号并通过Buff API获取饰品信息
 * Written By AoralsFout
*/

const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const axios = require('axios');

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
            goods_id,
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
            weapon_name,
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

module.exports = { BuffAccount };
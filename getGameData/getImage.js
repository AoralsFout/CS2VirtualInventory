const SteamUser = require("steam-user");
const fs = require("fs");
const vpk = require("vpk");
const util = require("util");

const appId = 730;
const depotId = 2347770;
const dir = `csTools/VirtualInventory/getGameData/static`;
const temp = "csTools/VirtualInventory/getGameData/temp";
const manifestIdFile = "manifestId.txt";

const vpkFolders = [
    "panorama/images/econ/characters",
    "panorama/images/econ/default_generated",
    "panorama/images/econ/music_kits",
    "panorama/images/econ/patches",
    "panorama/images/econ/season_icons",
    "panorama/images/econ/set_icons",
    "panorama/images/econ/status_icons",
    "panorama/images/econ/stickers",
    "panorama/images/econ/tools",
    "panorama/images/econ/weapons",
    "panorama/images/econ/weapon_cases",
    "panorama/images/econ/tournaments",
    "panorama/images/econ/premier_seasons",
];

const delay = util.promisify(setTimeout);

async function downloadVPKDir(user, manifest) {
    const dirFile = manifest.manifest.files.find((file) =>
        file.filename.endsWith("csgo\\pak01_dir.vpk")
    );

    console.log(`正在下载 pak01_dir.vpk`);

    try {
        await user.downloadFile(appId, depotId, dirFile, `${temp}/pak01_dir.vpk`);
    } catch (error) {
        console.error(`❌ 下载 pak01_dir.vpk 失败: ${error.message}`);
        return null;
    }

    const vpkDir = new vpk(`${temp}/pak01_dir.vpk`);
    vpkDir.load();

    return vpkDir;
}

function getRequiredVPKFiles(vpkDir) {
    const requiredIndices = [];

    for (const fileName of vpkDir.files) {
        for (const f of vpkFolders) {
            if (fileName.startsWith(f)) {

                const archiveIndex = vpkDir.tree[fileName].archiveIndex;

                if (!requiredIndices.includes(archiveIndex)) {
                    requiredIndices.push(archiveIndex);
                }

                break;
            }
        }
    }

    return requiredIndices.sort((a, b) => a - b);
}

async function downloadVPKArchives(user, manifest, vpkDir) {
    if (!vpkDir) {
        console.error("⚠️ Skipping VPK archive downloads due to previous failure.");
        return;
    }

    const requiredIndices = getRequiredVPKFiles(vpkDir);

    for (let index = 0; index < requiredIndices.length; index++) {
        const archiveIndex = requiredIndices[index];

        // Pad index with zeroes (e.g., 001, 002)
        const paddedIndex = archiveIndex.toString().padStart(3, "0");
        const fileName = `pak01_${paddedIndex}.vpk`;

        const file = manifest.manifest.files.find((f) =>
            f.filename.endsWith(fileName)
        );
        const filePath = `${temp}/${fileName}`;

        const status = `[${index + 1}/${requiredIndices.length}]`;

        console.log(`${status} 正在下载 ${fileName}`);

        try {
            await user.downloadFile(appId, depotId, file, filePath);
            console.log(`✅ 成功下载 ${fileName}`);
        } catch (error) {
            console.error(`❌下载 ${fileName} 失败: ${error.message}`);
        }

        // Add a delay of 3 seconds between downloads to avoid rate limiting
        await delay(3000);
    }
}

if (process.argv.length != 4) {
    console.error(
        `请正确输入机器人账号密码！`
    );
    process.exit(1);
}

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

if (!fs.existsSync(temp)) {
    fs.mkdirSync(temp);
}

const user = new SteamUser();

console.log("登录Steam....");

user.logOn({
    accountName: process.argv[2],
    password: process.argv[3],
    rememberPassword: true,
    logonID: 2121,
});

user.once("loggedOn", async () => {
    console.log("✅ Steam登录成功");

    let latestManifestId;
    try {
        const cs = (await user.getProductInfo([appId], [], true)).apps[appId]
            .appinfo;
        const commonDepot = cs.depots[depotId];
        latestManifestId = commonDepot.manifests.public.gid;

        console.log(`📦 获取最新 manifest ID: ${latestManifestId}`);
    } catch (error) {
        console.error(`❌ 检索不到 manifest ID: ${error.message}`);
        process.exit(1);
    }

    let existingManifestId = "";

    try {
        existingManifestId = fs.readFileSync(`${dir}/${manifestIdFile}`);
    } catch (err) {
        if (err.code !== "ENOENT") {
            console.error(`❌ 读取 manifest ID 文件失败: ${err.message}`);
            throw err;
        }
    }

    if (existingManifestId == latestManifestId) {
        console.log("⚠️ 最新的 manifest ID 与已有的 manifest ID 匹配, 程序已关闭.");
        process.exit(0);
    }

    console.log("🔄 Manifest ID 发生变动, 下载新文件...");

    let manifest;
    try {
        manifest = await user.getManifest(appId, depotId, latestManifestId, "public");
    } catch (error) {
        console.error(`❌ 获取manifest失败: ${error.message}`);
        process.exit(1);
    }

    const vpkDir = await downloadVPKDir(user, manifest);
    await downloadVPKArchives(user, manifest, vpkDir);

    try {
        fs.writeFileSync(`${dir}/${manifestIdFile}`, latestManifestId);
        console.log("✅ 成功更新manifest.");
    } catch (error) {
        console.error(`❌ 写入manifest错误: ${error.message}`);
    }

    console.log("🎉 运行完毕！");
    process.exit(0);
});

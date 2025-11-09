// 页面加载完成后显示加载页面

// 全局设置
let appSettings = {};
let isSettingLoaded = false;

// 初始化设置
async function initSettings() {
    if (!isSettingLoaded) {
        try {
            const response = await fetch('config/setting.json');
            const settingData = await response.json();
            appSettings = settingData.setting;
            appSettings.inventoryData = settingData.inventoryData; // 添加库存数据
            isSettingLoaded = true;
            applySettings();
            console.log("加载设置成功");
            console.log(appSettings);
        } catch (error) {
            echo(null, 'ERROR', null, '加载设置失败: ' + error.message);
        }
    }
}

initSettings()

// 加载资源
document.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.getElementById('loading-progress');
    const loadingInfo = document.getElementById('loading-info');
    if (loadingScreen && progressBar && loadingInfo) {
        // 获取所有图片元素和背景图片
        const images = document.querySelectorAll('img');
        const bgImages = getBackgroundImages();
        const dynamicPages = ['addItems', 'regular'];
        let loadedResources = 0;
        let settingImages = [];
        let totalResources = 0; // 初始化为0

        // 初始化设置并预加载图像
        // 在initSettings().then(() => { 代码块中
        initSettings().then(() => {
            // 获取所有资源类型
            settingImages = [
                appSettings.userAvatar,
                ...appSettings.inventoryData.map(item => item.image),
                ...appSettings.inventoryData.flatMap(item =>
                    (item.sticker || []).map(sticker => sticker.image) // 添加空数组保护
                )
            ];

            // 统一计算总资源（添加视频计数）
            totalResources =
                images.length +
                bgImages.length +
                dynamicPages.length +
                settingImages.length +
                1; // +1 视频文件

            // 启动所有加载任务
            startLoadingTasks();
        });

        function startLoadingTasks() {
            // 预加载视频（新增位置）
            const videoPath = 'images/intro.webm';
            const video = document.createElement('video');
            video.src = videoPath;
            video.preload = 'auto';
            video.addEventListener('canplaythrough', () => updateProgress(videoPath));
            video.addEventListener('error', () => updateProgress(videoPath));

            // 如果没有资源，直接隐藏加载页面
            if (totalResources === 0) {
                hideLoadingScreen(loadingScreen);
                return;
            }

            // 预加载setting.json中的图像
            settingImages.forEach(imageUrl => {
                const img = new Image();
                img.src = imageUrl;
                img.onload = () => updateProgress(imageUrl);
                img.onerror = () => updateProgress(imageUrl);
            });

            // 监听普通图片加载
            images.forEach(img => {
                if (img.complete) {
                    updateProgress(img.src);
                } else {
                    img.addEventListener('load', () => updateProgress(img.src));
                    img.addEventListener('error', () => updateProgress(img.src));
                }
            });

            // 监听背景图片加载
            bgImages.forEach(bgImage => {
                const img = new Image();
                img.src = bgImage;
                img.onload = () => updateProgress(bgImage);
                img.onerror = () => updateProgress(bgImage);
            });

            // 预加载动态页面
            dynamicPages.forEach(page => {
                fetch(`requestHtml/${page}.html`)
                    .then(() => {
                        updateProgress(`${page}.html`);
                    })
                    .catch(() => {
                        updateProgress(`${page}.html`);
                    });
            });

            // 更新进度条和加载信息
            function updateProgress(currentResource) {
                // 立即显示当前资源名称
                loadingInfo.textContent = `正在加载: ${currentResource}`;
                echo(null, 'INFO', null, `正在加载: ${currentResource}`);

                // 原子操作：先递增再计算
                const newCount = loadedResources + 1;
                loadedResources = Math.min(newCount, totalResources); // 防止超过总数

                const currentProgress = Math.round((loadedResources / totalResources) * 100);
                progressBar.style.width = `${currentProgress}%`;
                progressBar.textContent = `${currentProgress}%`;

                if (loadedResources >= totalResources) {
                    setTimeout(() => hideLoadingScreen(loadingScreen), 300);
                }
            }
        }
    }
});

// 获取页面中所有元素的背景图片
function getBackgroundImages() {
    const bgImages = new Set();
    const elements = document.querySelectorAll('*');

    elements.forEach(el => {
        const bgImage = window.getComputedStyle(el).backgroundImage;
        if (bgImage && bgImage !== 'none') {
            const url = bgImage.match(/url\(["']?(.*?)["']?\)/);
            if (url && url[1]) {
                bgImages.add(url[1]);
            }
        }
    });

    return Array.from(bgImages);
}

// 隐藏加载页面的函数
function hideLoadingScreen(loadingScreen) {
    // 播放视频
    const introVideo = document.getElementById('intro-video');
    if (introVideo) {
        introVideo.play();
        introVideo.addEventListener('ended', () => {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                introVideo.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    introVideo.style.display = 'none';
                }, 500);
            }, 500);
        });
    }

    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

// 顶部导航栏文字选项点击事件
document.querySelector('.text-options').addEventListener('click', (e) => {
    const option = e.target.closest('.option');
    if (option) {
        const pageId = option.dataset.page;
        switchPage(pageId);
    }
});

// 切换页面
function switchPage(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });

    // 显示目标页面
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.style.display = 'block';
    }

    switch (pageId) {
        case 'inventory':
            renderInventory(inventoryData);
            break;

        default:
            break;
    }

}

// 默认显示开始页面
switchPage('start');

const sildMap = ["sild-friends", "sild-broadcast", "sild-lastestTeammates"]
let nowSild = 0;

function openSild(mapIndex) {
    document.getElementById(sildMap[nowSild]).style.height = "0vh"
    nowSild = mapIndex;
    document.getElementById(sildMap[nowSild]).style.height = "82vh"
}

function listenSild() {
    const friends = document.getElementById("sild-friends-title")
    const broadcast = document.getElementById("sild-broadcast-title")
    const lastestTeammates = document.getElementById("sild-lastestTeammates-title")
    friends.addEventListener("click", function () {
        openSild(0)
    })
    broadcast.addEventListener("click", function () {
        openSild(1)
    })
    lastestTeammates.addEventListener("click", function () {
        openSild(2)
    })
}

listenSild()
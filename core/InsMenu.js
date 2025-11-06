let isFristOpen = false

//监听ins键触发窗口
document.addEventListener('keydown', function (event) {
    if (event.key === 'Insert') {
        toggleWindow();
        if (!isFristOpen) {
            updateContent(0)
            isFristOpen = !isFristOpen
        }
    }
});

//监听关闭键
document.getElementById('close-btn').addEventListener('click', function () {
    closeWindow();
});

//拖拽逻辑
let isDragging = false;
let offsetX, offsetY;

document.getElementById('window-header').addEventListener('mousedown', function (event) {
    isDragging = true;
    offsetX = event.clientX - document.getElementById('draggable-window').offsetLeft;
    offsetY = event.clientY - document.getElementById('draggable-window').offsetTop;
});

document.addEventListener('mousemove', function (event) {
    if (isDragging) {
        let x = event.clientX - offsetX;
        let y = event.clientY - offsetY;
        document.getElementById('draggable-window').style.left = x + 'px';
        document.getElementById('draggable-window').style.top = y + 'px';
    }
});

document.addEventListener('mouseup', function () {
    isDragging = false;
});

// 切换窗口开启/关闭
function toggleWindow() {
    const windowElement = document.getElementById('draggable-window');
    if (windowElement.classList.contains('open')) {
        closeWindow();
    } else {
        openWindow();
    }
}

//打开窗口
function openWindow() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('draggable-window').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('draggable-window').classList.add('open');
    }, 10);
}

//关闭窗口
function closeWindow() {
    const windowElement = document.getElementById('draggable-window');
    // 移除 open 类以触发收起动画
    windowElement.classList.remove('open');
    setTimeout(() => {
        windowElement.style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    }, 300); // 等待动画完成
}

// 导航按钮点击动态添加active类
document.getElementById('navigation').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li) {
        document.querySelectorAll('#navigation li').forEach(li => li.classList.remove('active'));
        li.classList.add('active');
        updateContent([...li.parentNode.children].indexOf(li));
    }
});

// 更新界面设置
function updateSettingsUI() {
    if (document.getElementById('fullscreen-toggle')) {
        document.getElementById('fullscreen-toggle').checked = appSettings.isFullScreen;
    }
    if (document.getElementById('ratio-select')) {
        document.getElementById('ratio-select').value = appSettings.userAspectRatio.replace('/', ':');
    }
    if (document.getElementById('setUserName')) {
        document.getElementById('setUserName').value = appSettings.userName;
    }
    if (document.getElementById('setUserAvatar')) {
        document.getElementById('setUserAvatar').value = appSettings.userAvatar;
        document.getElementById('setPerviewUserAvatar').src = appSettings.userAvatar;
    }
}

let isSavingStatus = false;

// 保存设置
function saveSettings() {
    const status = document.getElementById('saveingStatus');
    if (isSavingStatus) {
        return
    } else {
        isSavingStatus = true
        appSettings = {
            ...appSettings,
            isFullScreen: document.getElementById('fullscreen-toggle').checked,
            userAspectRatio: document.getElementById('ratio-select').value.replace(':', '/'),
            userName: document.getElementById('setUserName').value,
            userAvatar: document.getElementById('setUserAvatar').value
        };
        status.innerHTML = '保存中...'
        setTimeout(() => {
            isSavingStatus = false;
            echo('client', 'INFO', null, '设置已更新:'+ JSON.stringify(appSettings));
            status.innerHTML = '保存成功!想要下次进入页面时使用您的设置，请前往‘设置导入/导出’栏保存您的设置文件到本地'
            applySettings();
        }, 500);
    }
}

// 绑定设置事件
function bindSettingEvents() {
    document.getElementById("save-settings").addEventListener('click', saveSettings);
    document.getElementById('getUserInfoBtn').addEventListener('click', getSteamUserInfo);
}

// 获取steam用户信息
function getSteamUserInfo() {
    const btn = document.getElementById('getUserInfoBtn');
    const status = document.getElementById('requestStatus');
    btn.disabled = true;
    status.innerHTML = '请求中...';

    const id = document.getElementById("userId64").value;
    //id合法性判断
    if (!/^[0-9]{17}$/.test(id)) {
        status.innerHTML = '<span style="color:#ffbf00">请输入正确的SteamID64</span>';
        btn.disabled = false;
        return;
    }
    const proxyUrl = `http://localhost:3000/getSteamUserInfo?steamId=${id}`;

    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) {
                echo("sever", 'ERROR', null, '请求失败:'+ response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const player = data.response.players[0];
            document.getElementById("setUserName").value = player.personaname;
            document.getElementById("setUserAvatar").value = player.avatarfull;
            document.getElementById("setPerviewUserAvatar").setAttribute("src", player.avatarfull);
            status.innerHTML = '请求成功';
        })
        .catch(error => {
            echo(null, 'ERROR', null, '请求失败:'+ error.message);
            status.innerHTML = '<span style="color:#ffbf00">请求失败，请尝试使用加速器加速Steam社区后再试。<br>请求资源有时间间隔限制，如果您之前进行过一次成功请求，请稍后重试。</span>';
        })
        .finally(() => {
            btn.disabled = false;
        });
}

// 通用页面请求方法（requestHtml文件夹）
async function loadContent(url) {
    try {
        const response = await fetch(`requestHtml/${url}`);
        if (!response.ok) echo("sever", 'ERROR', null, `requestHtml/${url} 请求失败: ${response.statusText}`);
        return await response.text();
    } catch (error) {
        echo("sever", 'ERROR', null, `requestHtml/${url} 请求失败: ${error.message}`);
        return '<p>内容加载失败，请刷新重试</p>';
    }
}

// 更新右侧内容
async function updateContent(index) {
    const contentElement = document.getElementById('content-body');
    let urlMap = ['regular.html', 'addItems.html'];
    if (index < urlMap.length) {
        contentElement.innerHTML = await loadContent(urlMap[index]);
    }
    switch (index) {
        case 0: //常规设置页
            updateSettingsUI();//更新设置UI
            bindSettingEvents();//保存设置按钮
            break;
        case 1:
            fetch('getGameData/json/tabel.json')
                .then(response => response.json())
                .then(data => {
                    echo("sever", 'INFO', null, '加载数据成功');
                    initializeAddItems(data)//初始化新增物品界面
                })
                .catch(error => echo(null, 'ERROR', null, '加载数据失败:'+ error.message));
            break;
        default:
            break;
    }
}

// 应用设置
function applySettings() {
    updateWindowRatio(appSettings.userAspectRatio)
    fullScreen()
}

// 更新窗口比例
function updateWindowRatio(ratio) {
    const windowElement = document.getElementById('window');
    if (ratio === '16/9') {
        windowElement.style.aspectRatio = '16 / 9';
        windowElement.style.transform = 'scale(1, 1)';
    } else if (ratio === '4/3') {
        windowElement.style.aspectRatio = '4 / 3';
        windowElement.style.transform = 'scale(1.333333, 1)';
    } else {
        echo(null, 'ERROR', null, `无效的窗口比例: ${ratio}`);
    }
}

//全屏
function fullScreen() {
    const windowElement = document.getElementById('window');
    if (appSettings.isFullScreen) {
        windowElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}
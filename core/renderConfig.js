function initializeConfig() {
    // 绑定文件选择按钮事件
    document.getElementById('load-config-btn').addEventListener('click', () => {
        document.getElementById('config-file-input').click();
    });

    // 绑定文件输入变化事件
    document.getElementById('config-file-input').addEventListener('change', handleFileSelect);

    // 绑定保存配置按钮事件
    document.getElementById('save-config-btn').addEventListener('click', saveConfig);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('selected-file-name').textContent = file.name;
        loadConfig(file);
    }
}

function loadConfig(file) {
    const statusElement = document.getElementById('load-status');
    statusElement.textContent = '正在加载配置文件...';
    statusElement.className = 'status-message info';

    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const configData = JSON.parse(e.target.result);

            // 验证配置文件格式
            if (!configData.inventoryData) {
                throw new Error('配置文件格式错误：缺少inventoryData字段');
            }

            // 更新appSettings
            if (typeof appSettings !== 'undefined') {
                appSettings.userName = configData.setting.userName || appSettings.userName;
                appSettings.userAvatar = configData.setting.userAvatar || appSettings.userAvatar;
                appSettings.isFullScreen = configData.setting.isFullScreen || appSettings.isFullScreen;
                appSettings.userAspectRatio = configData.setting.userAspectRatio || appSettings.userAspectRatio;
            }

            // 更新全局inventoryData
            if (typeof inventoryData !== 'undefined') {
                inventoryData = configData.inventoryData;
                appSettings.inventoryData = inventoryData;

                // 重新渲染库存
                if (typeof renderInventory === 'function') {
                    renderInventory(inventoryData);
                }

                statusElement.textContent = '配置文件加载成功！库存已更新。';
                statusElement.className = 'status-message success';

                echo('client', 'INFO', null, `配置文件加载成功，共加载 ${configData.inventoryData.length} 个物品`);
            } else {
                throw new Error('库存数据未初始化');
            }

            console.log("更新设置成功");
            console.log(appSettings);
        } catch (error) {
            statusElement.textContent = `加载失败：${error.message}`;
            statusElement.className = 'status-message error';
            echo('client', 'ERROR', null, `配置文件加载失败：${error.message}`);
        }
    };

    reader.onerror = function () {
        statusElement.textContent = '文件读取失败';
        statusElement.className = 'status-message error';
        echo('client', 'ERROR', null, '配置文件读取失败');
    };

    reader.readAsText(file);
}

function saveConfig() {
    const fileNameInput = document.getElementById('save-file-name');
    const fileName = fileNameInput.value.trim() || 'setting';
    const statusElement = document.getElementById('save-status');

    if (!window.inventoryData) {
        statusElement.textContent = '错误：没有可保存的库存数据';
        statusElement.className = 'status-message error';
        echo('client', 'ERROR', null, '保存配置失败：没有库存数据');
        return;
    }

    statusElement.textContent = '正在保存配置文件...';
    statusElement.className = 'status-message info';

    try {
        // 准备配置数据，按照setting1.json的格式
        const configData = {
            setting: {
                userName: appSettings.userName,
                userAvatar: appSettings.userAvatar,
                isFullScreen: appSettings.isFullScreen,
                userAspectRatio: appSettings.userAspectRatio,
            },
            inventoryData: window.inventoryData
        };

        // 创建JSON字符串
        const jsonString = JSON.stringify(configData, null, 2);

        // 创建Blob对象
        const blob = new Blob([jsonString], { type: 'application/json' });

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.json`;

        // 触发下载
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // 释放URL对象
        URL.revokeObjectURL(url);

        statusElement.textContent = `配置文件已保存为 ${fileName}.json`;
        statusElement.className = 'status-message success';

        echo('client', 'INFO', null, `配置文件保存成功：${fileName}.json，包含 ${window.inventoryData.length} 个物品`);

    } catch (error) {
        statusElement.textContent = `保存失败：${error.message}`;
        statusElement.className = 'status-message error';
        echo('client', 'ERROR', null, `配置文件保存失败：${error.message}`);
    }
}
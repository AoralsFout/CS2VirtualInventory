/**
 * 渲染库存
 * */

var filterButtons = document.querySelectorAll('.filter-btn');
var sortBySelect = document.querySelector('.sort-by');
var inventoryGrid = document.querySelector('.inventory-grid');

var currentFilter = 'all';
var currentSortBy = 'time';
var inventoryData = [];

// 筛选按钮点击事件
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.getAttribute('data-filter');
        renderInventory(inventoryData);
    });
});

sortBySelect.addEventListener('change', () => {
    currentSortBy = sortBySelect.value;
    renderInventory(inventoryData);
})

// 贴纸磨损转换为不透明度百分比
function stickerWearToOpacityPercentage(wear) {
    return 0.8 * wear + 0.4
}

// 渲染默认库存
fetch('config/setting.json')
    .then(response => response.json())
    .then(data => {
        echo("sever", 'INFO', null, '加载设置成功');
        inventoryData = data["inventoryData"]
        renderInventory(inventoryData)
    })
    .catch(error => echo(null, 'ERROR', null, '加载设置失败:' + error.message));

// 渲染库存
function renderInventory(data) {
    let filteredData = data.filter(item => currentFilter === 'all' || item.type === currentFilter);

    // 排序
    switch (currentSortBy) {
        case 'time':
            filteredData.sort((a, b) => b.timestamp - a.timestamp);
            break;
        case 'quality':
            const qualityOrder = ['#e4ae39', '#eb4b4b', '#d32ce6', '#8847ff', '#4b69ff', '#5e98d9', '#ded6cc', '#ccc', '#b0c3d9'];
            filteredData.sort((a, b) => {
                const aIndex = qualityOrder.indexOf(a.quality);
                const bIndex = qualityOrder.indexOf(b.quality);
                return aIndex - bIndex;
            });
            break;
    }

    inventoryGrid.innerHTML = '';

    filteredData.forEach(item => {
        // 创建物品元素
        const itemElement = document.createElement('div');
        itemElement.classList.add('inventory-item');
        itemElement.setAttribute('data-item-type', item.addType);
        itemElement.setAttribute('onmouseup', `clickTigger(this,event)`);
        // 避免显示null
        if (item.nameTag == null) {
            item.nameTag = '';
        }
        switch (item.addType) {
            case "skin":
                // 增加贴纸显示
                var stickers = '';
                item.sticker.forEach(sticker => {
                    stickers += `
                        <div class="sticker" style="background-image:url('${sticker.image}');opacity:${stickerWearToOpacityPercentage(sticker.wear)}"></div>
                        `
                });
                // 基础内容
                itemElement.innerHTML = `
                        <div class="item-background">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="quality-bar" style="background-color: ${item.quality};"></div>
                        <div class="stickers">
                            ${stickers}
                        </div>
                        <div class="item-type">${item.subType}&nbsp${item.weaponType}</div>
                        <div class="item-name">${item.name}</div>
                        <div class="item-name">${item.nameTag}</div>
                    `;
                break;
            default:
                // 基础内容
                itemElement.innerHTML = `
                        <div class="item-background">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="quality-bar" style="background-color: ${item.quality};"></div>
                        <div class="stickers"></div>
                        <div class="item-type">${item.subType}</div>
                        <div class="item-name">${item.nextType}</div>
                        <div class="item-name">${item.nameTag}</div>
                    `;
                break;
        }
        inventoryGrid.appendChild(itemElement);
    });
}
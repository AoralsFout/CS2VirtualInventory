/**
 * 渲染库存
 */
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

function stickerWearToOpacityPercentage(wear) {
    return 0.8 * wear + 0.4
}

// 渲染库存
fetch('config/setting.json')
    .then(response => response.json())
    .then(data => {
        echo("sever", 'INFO', null, '加载设置成功');
        inventoryData = data["inventoryData"]
        renderInventory(inventoryData)
    })
    .catch(error => echo(null, 'ERROR', null, '加载设置失败:'+ error.message));

function renderInventory(data) {
    let filteredData = data.filter(item => currentFilter === 'all' || item.type === currentFilter);

    if (currentSortBy === 'time') {
        filteredData.sort((a, b) => b.timestamp - a.timestamp);
    } else if (currentSortBy === 'quality') {
        const qualityOrder = ['yellow', 'red', 'pink', 'purple', 'blue', 'lightblue', 'white'];
        filteredData.sort((a, b) => {
            const aIndex = qualityOrder.indexOf(a.quality);
            const bIndex = qualityOrder.indexOf(b.quality);
            return bIndex - aIndex;
        });
    }

    inventoryGrid.innerHTML = '';
    filteredData.forEach(item => {
        if (item.addType=="skin") {
            if (item.weaponType == null) {
                item.weaponType = '';
            }
            if (item.nameTag == null || item.nameTag == null) {
                item.nameTag = '';
            }
            var stickers = '';
            item.sticker.forEach(sticker => {
                stickers += `
                        <div class="sticker" style="background-image:url('${sticker.image}');opacity:${stickerWearToOpacityPercentage(sticker.wear)}"></div>
                        `
            });
            const itemElement = document.createElement('div');
            itemElement.classList.add('inventory-item');
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
            inventoryGrid.appendChild(itemElement);
        }
        if (item.addType=="other") {
            if (item.nameTag == null || item.nameTag == null) {
                item.nameTag = '';
            }
            const itemElement = document.createElement('div');
            itemElement.classList.add('inventory-item');
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
            inventoryGrid.appendChild(itemElement);
        }
    });
}
/**
 * INS 菜单新增物品页面
*/

let currentPage = 1;
const itemsPerPage = 30;

let nowFilter;

const categoryTranslation = {
    "agent": "探员",
    "collectible": "收藏品",
    "collection": "收藏系列",
    "crate": "箱子",
    "graffiti": "涂鸦",
    "skin": "武器",
    "key": "钥匙",
    "music_kit": "音乐盒",
    "patch": "布章",
    "sticker": "贴纸",
    "keychain": "挂件",
    "tool": "工具"
};

function initializeAddItems(data) {
    document.getElementById('search-button').addEventListener('click', () => {
        currentPage = 1
        filterAndDisplayResults(data);
    });

    populateCategoryButtons(data);
    // 绑定分页按钮
    document.getElementById('next-page').addEventListener('click', () => {
        const category = document.querySelector('.category-button.active')?.dataset.category;
        const weapon = document.querySelector('.weapon-option.active')?.dataset.weapon;
        const searchTerm = document.getElementById('search-input').value;
        const results = filterResults(category, searchTerm, weapon, data);
        if (currentPage < Math.ceil(results.length / itemsPerPage)) {
            currentPage++;
            displayResults(results, currentPage);
        }
    });

    document.getElementById('prev-page').addEventListener('click', () => {
        const category = document.querySelector('.category-button.active')?.dataset.category;
        const weapon = document.querySelector('.weapon-option.active')?.dataset.weapon;
        const searchTerm = document.getElementById('search-input').value;
        const results = filterResults(category, searchTerm, weapon, data);
        if (currentPage > 1) {
            currentPage--;
            displayResults(results, currentPage);
        }
    });
}

// 动态生成分类选项
function populateCategoryButtons(data) {
    const categoryButtonGroup = document.getElementById('category-button-group');
    categoryButtonGroup.innerHTML = '';
    Object.keys(data).forEach(category => {
        if (category == 'collection') {
            return
        }
        const button = document.createElement('button');
        button.className = 'category-button';
        // 使用对照表获取中文名称
        button.textContent = categoryTranslation[category] || category; // 如果对照表中没有，则显示英文
        button.dataset.category = category;

        button.addEventListener('click', () => {
            document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            if (category === 'skin') {
                document.getElementById('weapon-select-container').style.display = 'block';
                populateWeaponOptions(data);
            } else {
                document.getElementById('weapon-select-container').style.display = 'none';
                filterAndDisplayResults(data);
            }
        });

        categoryButtonGroup.appendChild(button);
    });
}

// 动态生成武器选项
function populateWeaponOptions(data) {  // <-- Add data parameter
    const weaponOptions = document.getElementById('weapon-options');
    weaponOptions.innerHTML = '';
    if (data.skin) {
        Object.keys(data.skin).forEach(weapon => {
            const option = document.createElement('div');
            option.className = 'weapon-option';
            option.textContent = weapon;
            option.dataset.weapon = weapon;

            option.addEventListener('click', () => {
                // 移除所有武器选项的 active 类
                document.querySelectorAll('.weapon-option').forEach(opt => opt.classList.remove('active'));
                // 为当前武器选项添加 active 类
                option.classList.add('active');
                // 更新下拉框标题为当前武器名
                const dropdownHeader = document.querySelector('.dropdown-header span');
                dropdownHeader.textContent = weapon;
                // 手动触发过滤
                filterAndDisplayResults(data);
                toggleDropdown()
            });

            weaponOptions.appendChild(option);
        });
    }
}

// 切换下拉菜单显示/隐藏
function toggleDropdown() {
    const dropdownContent = document.getElementById('weapon-options');
    dropdownContent.classList.toggle('show');
}

// 过滤并显示结果
function filterAndDisplayResults(data) {
    const category = document.querySelector('.category-button.active')?.dataset.category;
    const weapon = document.querySelector('.weapon-option.active')?.dataset.weapon;
    const searchTerm = document.getElementById('search-input').value;

    const results = filterResults(category, searchTerm, weapon, data);
    currentPage = 1;
    displayResults(results, currentPage);
}

// 过滤结果
function filterResults(category, searchTerm, weapon = null, data) {
    nowFilter = category
    let filtered = [];
    if (category === 'skin' && weapon) {
        filtered = data[category][weapon].filter(item =>
            item.skinName.toLowerCase().includes(searchTerm.toLowerCase())

        );
    } else {
        filtered = Object.values(data[category]).filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    return filtered;
}

// 显示结果
function displayResults(results, page) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedResults = results.slice(start, end);

    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    paginatedResults.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'result-item';
        itemElement.textContent = item.skinName || item.name;
        itemElement.dataset.id = item.skinId || item.id;
        itemElement.style.color = item.color
        itemElement.style.borderLeft = `inset ${item.color} 1vh`
        resultsContainer.appendChild(itemElement);
    });

    // 绑定点击事件
    bindResultItemClick()

    document.getElementById('page-info').textContent = `第 ${page} 页，共 ${Math.ceil(results.length / itemsPerPage)} 页`;
}

// 绑定结果项的点击事件
function bindResultItemClick() {
    document.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', () => {
            const itemId = item.dataset.id; // 获取物品 id
            showDetailPage(itemId); // 跳转到新页面并传递 id
        });
    });
}

var object;

// 显示新页面并传递 id
function showDetailPage(itemId) {
    // 隐藏当前页面
    document.getElementById('main-page').style.display = 'none';
    // 显示新页面
    document.getElementById('detail-page').style.display = 'block';
    document.getElementById("detail-page").innerHTML = "加载中，请稍候..."
    fetch('data/json/all.json')
        .then(response => response.json())
        .then(data => {
            echo("sever", 'INFO', null, '加载数据成功');
            console.log(data);
            
            if (nowFilter === "skin") {
                object = data[itemId + "_0"];
                document.getElementById('detail-page').innerHTML = `
                <div class="container">
                    <div class="detail-top-section">
                            <div class="thumbnail" style="border-bottom: inset ${object.rarity.color} 0.5vh;">
                                <img src="${object.image}" class="perview">
                            </div>
                            <div class="info">
                                <span style="color:${object.rarity.color};">${object.weapon.name} | ${object.pattern.name}</span>
                                <input type="number" id="itemQuantity" placeholder="添加数量" value="1">
                                <span style="font-size:2vh;color:'red'" id="addtip"></span>
                            </div>
                        </div>
                        <div class="detail-middle-section">
                            <div class="attributes">
                                <div class="attribute-row">
                                    <label for="patternTemplate">图案模板</label>
                                    <input type="number" id="patternTemplate">
                                </div>
                                <div class="attribute-row">
                                    <label for="skinNumber">皮肤编号</label>
                                    <input disabled type="number" id="skinNumber" value="${object.paint_index}">
                                </div>
                                <div class="attribute-row">
                                    <label for="wear">磨损</label>
                                    <span>0.</span><input type="number" id="wear" min="0" max="99999999999999999">
                                    <input type="button" id="randomWear" value="随机">
                                </div>
                                <div class="attribute-row wearContext">
                                    <div>
                                        <label>磨损等级</label>
                                        <span class="wear-label">崭新出厂</span>
                                    </div>
                                    <div class="wear-bar">
                                        <div class="wear-pointer"></div>
                                    </div>
                                </div>
                                <div class="attribute-row">
                                    <label for="type">类型</label>
                                    <select id="type">
                                        <option value="普通">普通</option>
                                        <option value="StatTrak™">StatTrak™</option>
                                        <option value="★">★</option>
                                        <option value="★ StatTrak™">★ StatTrak™</option>
                                        <option value="纪念品">纪念品</option>
                                    </select>
                                </div>
                                <div class="attribute-row" id="stattrakRow" style="display: none;">
                                    <label for="stattrakCount">StatTrak™ 数目</label>
                                    <input type="number" id="stattrakCount">
                                </div>
                            </div>
                        </div>
                        <div class="detail-bottom-section">
                            <button id="backBtn">返回</button>
                            <button id="confirmBtn">确认</button>
                        </div>
                    </div>
                </div>
                `
                const wearInput = document.getElementById('wear');
                const wearPointer = document.querySelector('.wear-pointer');
                const wearLabel = document.querySelector('.wear-label');
                const typeSelect = document.getElementById('type');
                const stattrakRow = document.getElementById('stattrakRow');
                const confirmBtn = document.getElementById('confirmBtn');
                const backBtn = document.getElementById('backBtn');
                const randomWear = document.getElementById("randomWear")

                randomWear.addEventListener('click', function () {
                    const res = Math.random().toString().split('.')[1].slice(0, 17);
                    wearInput.value = res;
                    const wearValue = parseFloat("0." + wearInput.value) || 0;
                    const pointerPosition = Math.min(Math.max(wearValue, 0), 1) * 100;
                    wearPointer.style.left = `${pointerPosition}%`;

                    if (wearValue <= 0.07) {
                        wearLabel.textContent = '崭新出厂';
                    } else if (wearValue <= 0.15) {
                        wearLabel.textContent = '略有磨损';
                    } else if (wearValue <= 0.38) {
                        wearLabel.textContent = '久经沙场';
                    } else if (wearValue <= 0.45) {
                        wearLabel.textContent = '破损不堪';
                    } else {
                        wearLabel.textContent = '战痕累累';
                    }
                })

                wearInput.addEventListener('input', function () {
                    const wearValue = parseFloat("0." + wearInput.value) || 0;
                    const pointerPosition = Math.min(Math.max(wearValue, 0), 1) * 100;
                    wearPointer.style.left = `${pointerPosition}%`;

                    if (wearValue <= 0.07) {
                        wearLabel.textContent = '崭新出厂';
                    } else if (wearValue <= 0.15) {
                        wearLabel.textContent = '略有磨损';
                    } else if (wearValue <= 0.38) {
                        wearLabel.textContent = '久经沙场';
                    } else if (wearValue <= 0.45) {
                        wearLabel.textContent = '破损不堪';
                    } else {
                        wearLabel.textContent = '战痕累累';
                    }
                });

                typeSelect.addEventListener('change', function () {
                    if (typeSelect.value === 'StatTrak™' || typeSelect.value === '★ StatTrak™') {
                        stattrakRow.style.display = 'flex';
                    } else {
                        stattrakRow.style.display = 'none';
                    }
                });

                backBtn.addEventListener('click', function () {
                    document.getElementById('main-page').style.display = 'flex';
                    document.getElementById('detail-page').style.display = 'none';
                })

                confirmBtn.addEventListener('click', function () {
                    console.log(object);

                    const tip = document.getElementById("addtip")

                    if (document.getElementById('patternTemplate').value == '') {
                        tip.innerHTML = '请输入模板编号'
                    }
                    if (document.getElementById('type').value == '') {
                        tip.innerHTML = '请选择武器类型'
                    }
                    if (stattrakRow.style.display == "flex") {
                        if (document.getElementById('stattrakCount').value == '') {
                            tip.innerHTML = '请输入statTrak数目'
                        }
                    }
                    if (document.getElementById('itemQuantity').value == '') {
                        tip.innerHTML = '请输入数量'
                    }
                    if (wearInput.value == '') {
                        tip.innerHTML = '请输入磨损值'
                    }
                    let itemId = inventoryData.length
                    for (let i = 0; i < document.getElementById("itemQuantity").value; i++) {
                        const itemData = {
                            itemId: itemId,
                            name: object.pattern.name,
                            nameTag: null,
                            type: "equipment",
                            addType: "skin",
                            subType: object.weapon.name,
                            quality: object.rarity.color,
                            rarity: object.rarity.name,
                            itemset: [],
                            image: object.image,
                            timestamp: Date.now,
                            paint_seed: document.getElementById('patternTemplate').value,
                            paint_index: document.getElementById('skinNumber').value,
                            wear: Number("0." + wearInput.value),
                            exterior: wearLabel.textContent,
                            weaponType: "(" + document.getElementById('type').value + ")",
                            sticker: [],
                            stattrakCount: document.getElementById('stattrakCount').value || null,
                            isnew: true
                        };
                        inventoryData.push(itemData)
                        itemId++
                        console.log(JSON.stringify(itemData, null, 2));
                    }
                    // closeWindow()
                    renderInventory(inventoryData)
                    showNewItem("SKIN",object.rarity.color, object.name, object.legacy_model)
                });
            } else {
                object = data[itemId];
                if (object.id.split("-")[0] == "crate" || object.id.split("-")[0] == "key" || object.id.split("-")[0] == "tool") {
                    object.rarity = {
                        color: "#ccc"
                    }
                }
                console.log(object);
                document.getElementById('detail-page').innerHTML = `
                <div class="container">
                    <div class="detail-top-section">
                            <div class="thumbnail" style="border-bottom: inset ${object.rarity.color} 0.5vh;">
                                <img src="${object.image}" class="perview">
                            </div>
                            <div class="info">
                                <span style="color:${object.rarity.color};">${object.name}</span>
                                <input type="number" id="itemQuantity" placeholder="添加数量" value="1">
                                <span style="font-size:2vh;color:'red'" id="addtip"></span>
                            </div>
                        </div>
                        <div class="detail-bottom-section">
                            <button id="backBtn">返回</button>
                            <button id="confirmBtn">确认</button>
                        </div>
                    </div>
                </div>
                `
                const confirmBtn = document.getElementById('confirmBtn');
                const backBtn = document.getElementById('backBtn');

                backBtn.addEventListener('click', function () {
                    document.getElementById('main-page').style.display = 'flex';
                    document.getElementById('detail-page').style.display = 'none';
                })

                confirmBtn.addEventListener('click', function () {
                    console.log(object);
                    const tip = document.getElementById("addtip")
                    if (document.getElementById('itemQuantity').value == '') {
                        tip.innerHTML = '请输入数量'
                    }

                    let subType
                    let nextType

                    if (object.id.split("-")[0] == "agent") {
                        subType = "探员"
                        nextType = object.name
                    }
                    if (object.id.split("-")[0] == "collectible") {
                        subType = object.name
                        nextType = ''
                    }
                    if (object.id.split("-")[0] == "crate") {
                        subType = object.name
                        nextType = ''
                    }
                    if (object.id.split("-")[0] == "graffiti") {
                        subType = "封装的涂鸦"
                        nextType = object.name.split(" | ")[1]
                    }
                    if (object.id.split("-")[0] == "key") {
                        subType = object.name
                        nextType = ''
                    }
                    if (object.id.split("-")[0] == "music_kit") {
                        subType = "音乐盒"
                        nextType = object.name
                    }
                    if (object.id.split("-")[0] == "patch") {
                        subType = "布章"
                        nextType = object.name.split(" | ")[1]
                    }
                    if (object.id.split("-")[0] == "sticker") {
                        subType = "印花"
                        nextType = object.name.split(" | ")[1]
                    }
                    if (object.id.split("-")[0] == "keychain") {
                        subType = "挂件"
                        nextType = object.name.split(" | ")[1]
                    }
                    if (object.id.split("-")[0] == "tool") {
                        subType = object.name
                        nextType = ''
                    }

                    let itemId = inventoryData.length
                    for (let i = 0; i < document.getElementById("itemQuantity").value; i++) {
                        const itemData = {
                            itemId: itemId,
                            name: object.name,
                            subType: subType,
                            nextType: nextType,
                            addType: "other",
                            quality: object.rarity.color,
                            rarity: object.rarity.name,
                            itemset: [],
                            image: object.image,
                            timestamp: Date.now,
                            isnew: true
                        };
                        inventoryData.push(itemData)
                        itemId++
                        console.log(JSON.stringify(itemData, null, 2));
                    }
                    // closeWindow()
                    renderInventory(inventoryData)
                    showNewItem("OTHER", object.rarity.color, object.name, object.image)
                });
            }
        })
        .catch(error => echo(null, 'ERROR', null, '加载数据失败:' + error.message));
}
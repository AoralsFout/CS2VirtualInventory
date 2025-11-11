/**
 * 鼠标菜单管理器
*/

// 全局变量
let isMenuOpen = false;
let currentMenuOptions = {}
let currentAcitveElement = null;

// 箱子菜单选项
let crateOptions = {
    '开启': function () {
        console.log("开启");
        closeMenu();
    },
}

// 皮肤菜单选项
let skinOptions = {
    '检视': function () {
        console.log("检视");
        closeMenu();
    },
}

// 默认菜单选项
let defaultOptions = {
    '关闭': function () {
        console.log("关闭");
        closeMenu();
    },
}

// 禁用上下文菜单
document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});

// 点击物品触发器
function clickTigger(element, event) {
    if (event.button == 2) {
        switch (element.getAttribute('data-item-type')) {
            case 'crate':
                applyMenuOptions(crateOptions);
                break;
            case 'skin':
                applyMenuOptions(skinOptions);
                break;
            default:
                applyMenuOptions(defaultOptions);
                break;
        }
        openMenu();
    }
}

// 点击其他地方关闭菜单
document.addEventListener('mouseup', checkCloseMenu);
function checkCloseMenu() {
    if (isMenuOpen) {
        // 范围检测
        const menu = document.getElementById('mouse-menu');
        const menuRect = menu.getBoundingClientRect();
        if (mousePostion.x < menuRect.left || mousePostion.x > menuRect.right || mousePostion.y < menuRect.top || mousePostion.y > menuRect.bottom) {
            closeMenu();
        }
    }
}

// 应用菜单选项
function applyMenuOptions(options) {
    currentMenuOptions = options;
    const menu = document.getElementById('mouse-menu');
    menu.innerHTML = '';
    for (const option in options) {
        const optionElement = document.createElement('div');
        optionElement.textContent = option;
        optionElement.classList.add('mouse-menu-option');
        optionElement.addEventListener('click', options[option]);
        menu.appendChild(optionElement);
    }
}

// 关闭菜单
function closeMenu() {
    isMenuOpen = false;
    const menu = document.getElementById('mouse-menu');
    menu.style.display = 'none';
}

// 打开菜单
function openMenu() {
    isMenuOpen = true;
    const menu = document.getElementById('mouse-menu');
    menu.style.display = 'flex';
    menu.style.left = `${mousePostion.x}px`;
    menu.style.top = `${mousePostion.y}px`;
}

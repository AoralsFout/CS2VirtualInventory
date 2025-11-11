/**
 * 导航栏聚焦动画
*/

const canvas = document.getElementById('canvasNav');
const ctx = canvas.getContext('2d');

// 配置参数
const CONFIG_NAV = {
    blockSizeVH: 1.65,
    spacingVH: 0.2,
    rows: 3,
    cols: 34,
};

// 状态管理
let state = {
    blocks: [],//所有方块属性
    buttons: [],
    isSwitching: false,//是否正在改变中心
    switchTo: 0,//中心改到哪
    switchStep: 2,//修改的步长
    isTransoform: false,
    newFrame: 0,
    nowCenterX: 17,//当前中心
    timestamp: 0,//动画总帧数
    v: 0.5//方格随机衰减速度
};

// 初始化系统
function init() {
    calculateSizes();
    initializeBlocks();
    window.addEventListener('resize', handleResize);
    requestAnimationFrame(animate);
}

// 尺寸计算
function calculateSizes() {
    const toPx = vh => (vh * window.innerHeight) / 100;

    state.blockSize = toPx(CONFIG_NAV.blockSizeVH);
    state.spacing = toPx(CONFIG_NAV.spacingVH);

    canvas.width = CONFIG_NAV.cols * (state.blockSize + state.spacing) - state.spacing;
    canvas.height = CONFIG_NAV.rows * (state.blockSize + state.spacing) - state.spacing;
}

//背景
function background(x, center) {
    return 0.2 * Math.exp(-Math.pow(x - center, 2) / 10);
}

//噪声
function noise(x, w, timestamp, random) {
    const res = 1 * background(x, state.nowCenterX) * (Math.sin((w * timestamp / 10) + random) - 1)
    return res < -0.3 ? -0.3 : res;
}

// 初始化方块
function initializeBlocks() {
    state.blocks = Array.from({ length: CONFIG_NAV.rows }, (_, row) =>
        Array.from({ length: CONFIG_NAV.cols }, (_, col) => ({
            baseX: col * (state.blockSize + state.spacing),
            baseY: row * (state.blockSize + state.spacing),
            alpha: background(col, state.nowCenterX),
            random: Math.random() * Math.random() * 100
        }))
    );
}

// 绘制方法
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制方块
    for (let i = 0; i < state.blocks.length; i++) {
        for (let j = 0; j < state.blocks[i].length; j++) {
            ctx.fillStyle = `rgba(126, 169, 204,${state.blocks[i][j].alpha})`;
            ctx.fillRect(state.blocks[i][j].baseX, state.blocks[i][j].baseY, state.blockSize, state.blockSize);
        }
    }
}

//导航栏按钮点击触发
function switchTo(x) {
    state.isSwitching = true;
    state.switchTo = x
}

// 更新透明度
function updateAlpha() {
    if (state.isSwitching) {
        for (let i = 0; i < state.blocks.length; i++) {
            for (let j = 0; j < state.blocks[i].length; j++) {
                state.blocks[i][j].alpha = background(j, state.nowCenterX) - noise(j, state.v, state.timestamp, i + state.blocks[i][j].random)
            }
        }
    } else {
        for (let i = 0; i < state.blocks.length; i++) {
            for (let j = 0; j < state.blocks[i].length; j++) {
                state.blocks[i][j].alpha = background(j, state.nowCenterX) - noise(j, state.v, state.timestamp, i + state.blocks[i][j].random)
            }
        }
    }
}

// 动画循环
function animate() {
    state.timestamp++
    updateAlpha()
    if (state.isSwitching) {
        if (state.nowCenterX > state.switchTo) {
            state.nowCenterX -= state.switchStep
        } else if (state.nowCenterX < state.switchTo) {
            state.nowCenterX += state.switchStep
        } else if (state.nowCenterX = state.switchTo) {
            state.isSwitching = false
        }
    }
    draw();
    requestAnimationFrame(animate);
}

// 窗口大小变化处理
function handleResize() {
    calculateSizes();
    initializeBlocks();
    draw();
}

const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

function xToBlockIndex(x) {
    return Math.floor((x - state.spacing) / (state.blockSize + state.spacing))
}

init();
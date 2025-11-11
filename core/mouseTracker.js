/**
 * 提供全局变量 mousePostion
 * 用于记录鼠标位置
*/

let mousePostion = {
    x: 0,
    y: 0,
}

window.addEventListener('mousemove', (e) => {
    mousePostion.x = e.clientX;
    mousePostion.y = e.clientY;
})
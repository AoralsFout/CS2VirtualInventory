// 交互逻辑
(function () {
    const consolePanel = document.querySelector('.ConsolePanel');
    const header = document.getElementById('Header');
    const resizeHandle = document.getElementById('ResizeDragTarget');

    // 拖拽控制台
    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    // 调整大小
    let isResizing = false;
    resizeHandle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);

    function startDrag(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = parseFloat(consolePanel.style.left) || 20;
        initialY = parseFloat(consolePanel.style.top) || 20;
        consolePanel.style.position = 'fixed';
    }

    function drag(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        consolePanel.style.left = `${initialX + dx}px`;
        consolePanel.style.top = `${initialY + dy}px`;
    }

    function endDrag() {
        isDragging = false;
    }

    function startResize(e) {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = consolePanel.getBoundingClientRect();
        initialWidth = rect.width;
        initialHeight = rect.height;
    }

    function resize(e) {
        if (!isResizing) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newWidth = Math.max(300, initialWidth + dx);
        const newHeight = Math.max(300, initialHeight + dy);
        consolePanel.style.width = `${newWidth}px`;
        consolePanel.style.height = `${newHeight}px`;
    }

    function stopResize() {
        isResizing = false;
    }

    // 命令行交互
    const inputElement = document.getElementById('ConsoleInput');
    const consoleOutput = document.getElementById('ConsoleText');
    let commandHistory = [];
    let historyIndex = -1;

    // 输入事件处理
    inputElement.addEventListener('keydown', function (e) {
        // 执行命令
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = this.textContent.trim();
            if (command) {
                executeCommand(command);
                commandHistory = [command, ...commandHistory.slice(0, 49)]; // 保留最近50条
            }
            document.getElementById('ConsoleInput').textContent = '';
            this.textContent = '';
            historyIndex = -1;
        }

        // 历史记录导航
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (commandHistory.length === 0) return;

            historyIndex = Math.max(-1, Math.min(historyIndex + (e.key === 'ArrowUp' ? 1 : -1), commandHistory.length - 1));
            this.textContent = historyIndex === -1 ? '' : commandHistory[historyIndex];
        }
    });

    // 自动补全
    inputElement.addEventListener('input', function () {
        showAutocompleteSuggestions(this.textContent);
    });

    function executeCommand(cmd) {
        const result = `> ${cmd}`;
        echo(null, "command", null, result);
        processCommand(cmd)
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    function processCommand(cmd) {
        const args = cmd.split(' ');
        switch (args[0].toLowerCase()) {
            case 'echo':
                if (args.length < 5) {
                    echo(null, 'ERROR', null, '需要参数 [源] [类型] [函数名] [信息]');
                    return;
                }
                // 新增null参数转换逻辑
                const sourceParam = args[1].toLowerCase() === 'null' ? null : args[1];
                const typeParam = args[2].toLowerCase() === 'null' ? null : args[2];
                const funcParam = args[3].toLowerCase() === 'null' ? null : args[3];
                
                echo(sourceParam, typeParam, funcParam, args.slice(4).join(' '));
                break;
            case 'clear':
                consoleOutput.innerHTML = '';
                break;
            default:
                if (Object.keys(CONFIG).includes(args[0])) {
                    if (args.length === 1) {
                        echo('console', 'INFO', null, `${args[0]} = ${CONFIG[args[0]]}`);
                    } else if (args.length >= 2) {
                        //只接受true和false,1转为true,0转为false
                        if (args[1] !== 'true' && args[1] !== 'false' && isNaN(args[1])) {
                            echo('console', 'ERROR', null, `无效的配置值: ${args[1]}`);
                            return; 
                        }else{
                            args[1] == 1 ? args[1] = 'true' : 0;
                            args[1] == 0 ? args[1] = 'false' : 0;
                            CONFIG[args[0]] = parseConfigValue(args[1]);
                        }
                    }
                } else {
                    echo(null, 'ERROR', null, `Unknown command: ${cmd}`);
                }
    }
}

    // 新增配置值类型转换函数
    function parseConfigValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;
        if (!isNaN(value)) return Number(value);
        return value;
    }

    function showAutocompleteSuggestions(input) {
        const suggestions = ['help', 'clear', 'version','sv_cheat'];
        renderAutocomplete(suggestions.filter(s => s.startsWith(input)));
    }

    // 新增自动补全渲染函数
    function renderAutocomplete(suggestions) {
        let dropdown = document.querySelector('.autocomplete-suggestions');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'autocomplete-suggestions';
            document.body.appendChild(dropdown);
        }

        dropdown.innerHTML = suggestions.map(s =>
            `<div class="autocomplete-suggestion">${s}</div>`
        ).join('');

        // 定位到输入框下方
        const inputRect = inputElement.getBoundingClientRect();
        dropdown.style.left = `${inputRect.left}px`;
        dropdown.style.top = `${inputRect.bottom}px`;
        dropdown.style.display = suggestions.length ? 'block' : 'none';

        // 添加点击事件处理
        dropdown.onclick = (e) => {
            if (e.target.classList.contains('autocomplete-suggestion')) {
                inputElement.textContent = e.target.textContent;
                dropdown.style.display = 'none';
            }
        };
    }

})(); // IIFE结束

let CONFIG = {
    "sv_cheat": false
}

// 基本格式
// echo('Network', 'INFO', 'Received data packet'); 
// 输出 "[Network] INFO: Received data packet"

// 带函数名
// echo('Database', 'WARN', 'Connection timeout', 'connect'); 
// 输出 "[Database] connect: WARN: Connection timeout"

// 无来源
// echo(null, 'ERROR', 'System crash');
// 输出 "ERROR: System crash"

window.echo = function (source, type, functionName, message) {
    const parts = [];
    if (source) parts.push(`[${source}]`);
    if (functionName) parts.push(`${functionName}:`);
    if (message) parts.push(message);

    const line = document.createElement('div');
    line.className = `echo-line${type ? ' echo-' + type.toLowerCase() : ''}`;
    line.textContent = parts.join(' ');

    const consoleOutput = document.getElementById('ConsoleText');
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
};

// 关闭控制台
function CloseConsole() {
    document.getElementById('ConsolePanel').style.display = 'none';
}

// 监听按下~打开/关闭控制台
document.addEventListener('keydown', function (event) {
    if (event.key === '~') {
        const consolePanel = document.getElementById('ConsolePanel');
        if (consolePanel.style.display === 'none') {
            consolePanel.style.display = 'block';
        } else {
            consolePanel.style.display = 'none';
        }
    }
})
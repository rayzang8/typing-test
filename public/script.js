document.addEventListener('DOMContentLoaded', () => {
    const settingsElement = document.getElementById('settings');
    const gameContainer = document.getElementById('game-container');
    const characterElement = document.getElementById('character');
    const hintArea = document.getElementById('hint-area');
    const hintButton = document.getElementById('hint-button');
    const skipButton = document.getElementById('skip-button');
    const speedElement = document.getElementById('speed');
    const accuracyElement = document.getElementById('accuracy');
    const charactersInput = document.getElementById('characters');
    const modeCharRadio = document.getElementById('mode-char');
    const modeWbRadio = document.getElementById('mode-wb');
    const saveCharactersButton = document.getElementById('save-characters');
    const startButton = document.getElementById('start-button');
    const endButton = document.getElementById('end-button');
    const hiddenInput = document.getElementById('hidden-input');
    const addMappingButton = document.getElementById('add-mapping');
    const mappingFieldsContainer = document.getElementById('mapping-fields');
    const saveMappingButton = document.getElementById('save-mapping');

    let characters = '`1234567890-=[]\\;\',./{}|:"<>?~!@#$%^&*()_+';
    let currentCharacter = '';
    let correctCount = 0;
    let totalCount = 0;
    let startTime = Date.now();
    let wbMapping = {};
    let velocity = { x: 2, y: 2 }; // 字符飘动速度
    let isGameRunning = false;
    let currentMode = 'char'; // 当前模式：char（字符练习）或 wb（五笔练习）
    let isComposing = false; // 是否正在输入
    let hinted = false; //

    // 检测操作系统
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    // 加载五笔编码映射表
    function loadWBMapping() {
        fetch('/wb-mapping')
            .then(response => response.json())
            .then(data => {
                wbMapping = data;
                console.log('五笔映射表加载成功:', wbMapping);
                toggleHint();
            })
            .catch(error => {
                console.error('加载五笔映射表失败:', error);
            });
    }

    // 保存字符到 wb-mapping.json
    function saveCharacters() {
        const inputCharacters = charactersInput.value.trim();
        if (!inputCharacters) {
            alert('请输入要练习的字符！');
            return;
        }

        // 发送到服务器
        fetch('/add-characters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ characters: inputCharacters }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('字符已成功追加到 wb-mapping.json 文件！');
                } else {
                    alert('保存失败：' + data.error);
                }
            })
            .catch(error => {
                console.error('保存失败：', error);
                alert('保存失败，请检查服务器是否运行！');
            });
    }

    // 动态添加键值对输入框
    function addMappingField() {
        const field = document.createElement('div');
        field.innerHTML = `
            <input type="text" class="mapping-key" placeholder="字符">
            <input type="text" class="mapping-value" placeholder="五笔编码">
            <button class="remove-mapping">删除</button>
        `;
        mappingFieldsContainer.appendChild(field);

        // 绑定删除按钮事件
        const removeButton = field.querySelector('.remove-mapping');
        removeButton.addEventListener('click', () => {
            mappingFieldsContainer.removeChild(field);
        });
    }

    // 保存键值对到 wb-mapping.json
    function saveMapping() {
        const mappingFields = mappingFieldsContainer.querySelectorAll('.mapping-key');
        const newMapping = {};

        mappingFields.forEach(field => {
            const key = field.value.trim();
            const value = field.nextElementSibling.value.trim();
            if (key && value) {
                newMapping[key] = value;
            }
        });

        if (Object.keys(newMapping).length === 0) {
            alert('请输入有效的键值对！');
            return;
        }

        // 发送到服务器
        fetch('/add-mapping', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newMapping),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('键值对已成功保存到 wb-mapping.json 文件！');
                    loadWBMapping(); // 重新加载映射表
                } else {
                    alert('保存失败：' + data.error);
                }
            })
            .catch(error => {
                console.error('保存失败：', error);
                alert('保存失败，请检查服务器是否运行！');
            });
    }

    // 初始化游戏
    function startGame() {
        window.focus(); // 让页面获得焦点
        hiddenInput.focus(); // 聚焦到隐藏输入框
        currentMode = modeCharRadio.checked ? 'char' : 'wb'; // 获取当前模式
        characters = charactersInput.value || characters;
        correctCount = 0;
        totalCount = 0;
        startTime = Date.now();
        isGameRunning = true;
        settingsElement.style.display = 'none';
        gameContainer.style.display = 'block';
        nextCharacter();
        moveCharacter();
    }

    // 结束游戏
    function endGame() {
        isGameRunning = false;
        gameContainer.style.display = 'none';
        settingsElement.style.display = 'block';
        alert(`游戏结束！\n速度: ${speedElement.textContent} 字符/分钟\n正确率: ${accuracyElement.textContent}`);
    }

    // 生成下一个字符
    function nextCharacter() {
        if (!isGameRunning) return;

        if (currentMode === 'char') {
            // 字符练习：从字符集中随机选择
            currentCharacter = characters[Math.floor(Math.random() * characters.length)];
        } else if (currentMode === 'wb') {
            // 五笔练习：从五笔映射表中随机选择中文字符
            const keys = Object.keys(wbMapping);
            currentCharacter = keys[Math.floor(Math.random() * keys.length)];
        }

        characterElement.textContent = currentCharacter;
        characterElement.style.left = `${Math.random() * 500}px`;
        characterElement.style.top = `${Math.random() * 350}px`;
        totalCount++;
        showHint();
        updateStats();
    }
    // 随机选择一个动画效果
function getRandomAnimation() {
    const animations = [
        'animate-fade-out',
        'animate-shrink',
        'animate-rotate-out',
        'animate-float-up',
    ];
    return animations[Math.floor(Math.random() * animations.length)];
}

    // 处理输入
    hiddenInput.addEventListener('compositionstart', () => {
        isComposing = true;
    });

   // 处理输入
hiddenInput.addEventListener('compositionend', (event) => {
    isComposing = false;
    const userInput = event.target.value;
    if (userInput === currentCharacter) {
        correctCount++;

        // 添加随机动画效果
        const animationClass = getRandomAnimation();
        characterElement.classList.add(animationClass);

        // 动画结束后移除字符
        characterElement.addEventListener('animationend', () => {
            characterElement.textContent = '';
            characterElement.classList.remove(animationClass);
            nextCharacter();
        }, { once: true });
    }
    event.target.value = ''; // 清空输入框
});


hiddenInput.addEventListener('input', (event) => {
    if (isComposing) return; // 忽略正在输入的情况
    const userInput = event.target.value;
    if (userInput === currentCharacter) {
        correctCount++;

        // 添加随机动画效果
        const animationClass = getRandomAnimation();
        characterElement.classList.add(animationClass);

        // 动画结束后移除字符
        characterElement.addEventListener('animationend', () => {
            characterElement.textContent = '';
            characterElement.classList.remove(animationClass);
            nextCharacter();
        }, { once: true });
    }
    event.target.value = ''; // 清空输入框
});

    function toggleHint() {
        hinted = !hinted;
        showHint();
    }
    // 显示五笔提示
    function showHint() {
        if (currentMode === 'wb') {
            if (hinted) {
                const wbCode = wbMapping[currentCharacter] || '无五笔编码';
                hintArea.textContent = `五笔编码: ${wbCode}`;
            } else {
                hintArea.textContent = '';
            }
        } else {
            hintArea.textContent = '当前模式为字符练习，无五笔提示';
        }
        window.focus(); // 让页面获得焦点
        hiddenInput.focus(); // 聚焦到隐藏输入框
    }

    // 跳过字符
    function skipCharacter() {
        nextCharacter();
        window.focus(); // 让页面获得焦点
        hiddenInput.focus(); // 聚焦到隐藏输入框
    }

    // 更新统计信息
    function updateStats() {
        const elapsedTime = (Date.now() - startTime) / 60000; // 分钟
        const speed = Math.round(correctCount / elapsedTime);
        const accuracy = Math.round((correctCount / totalCount) * 100);
        speedElement.textContent = speed;
        accuracyElement.textContent = `${accuracy}%`;
    }

    // 字符飘动逻辑
    function moveCharacter() {
        if (!isGameRunning) return;
        let x = parseFloat(characterElement.style.left) || 0;
        let y = parseFloat(characterElement.style.top) || 0;

        x += velocity.x;
        y += velocity.y;

        // 边界检测和反弹
        if (x < 0 || x > 550) velocity.x = -velocity.x;
        if (y < 0 || y > 350) velocity.y = -velocity.y;

        characterElement.style.left = `${x}px`;
        characterElement.style.top = `${y}px`;

        requestAnimationFrame(moveCharacter);
    }

    // 绑定按钮事件
    startButton.addEventListener('click', startGame);
    endButton.addEventListener('click', endGame);
    hintButton.addEventListener('click', toggleHint);
    skipButton.addEventListener('click', skipCharacter);
    saveCharactersButton.addEventListener('click', saveCharacters);
    addMappingButton.addEventListener('click', addMappingField);
    saveMappingButton.addEventListener('click', saveMapping);

    // 监听快捷键
    document.addEventListener('keydown', (event) => {
        if (!isGameRunning) return;

        // 提示：Command + H (Mac) / Ctrl + H (Windows)
        if ((isMac && event.metaKey && event.key === 'h') || (!isMac && event.ctrlKey && event.key === 'h')) {
            showHint();
        }

        // 跳过：Command + S (Mac) / Ctrl + S (Windows)
        if ((isMac && event.metaKey && event.key === 's') || (!isMac && event.ctrlKey && event.key === 's')) {
            skipCharacter();
        }
    });

    // 初始化
    loadWBMapping(); // 加载五笔映射表
    charactersInput.value = localStorage.getItem('practiceCharacters') || characters; // 加载保存的字符
});
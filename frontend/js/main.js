document.addEventListener('DOMContentLoaded', () => {
    // === КОНФИГУРАЦИЯ СЕТИ ===
    // При развертывании на Render, эти URL будут динамическими.
    // На Render мы будем использовать переменные окружения.
    const BACKEND_BASE_URL = 'http://localhost:8080';
    const FRONTEND_BASE_URL = 'http://localhost:3000'; // Используется для CORS в бэкенде

    // URL WebSocket эндпоинта
    const WEBSOCKET_URL = `${BACKEND_BASE_URL}/ws`;
    // ========================

    const characterNameInput = document.getElementById('characterName');
    const proficiencyBonusInput = document.getElementById('proficiencyBonus');

    const abilityScoreInputs = {
        strength: document.getElementById('strengthScore'),
        dexterity: document.getElementById('dexterityScore'),
        constitution: document.getElementById('constitutionScore'),
        intell: document.getElementById('intellScore'),
        wisdom: document.getElementById('wisdomScore'),
        charisma: document.getElementById('charismaScore')
    };
    const abilityModifierInputs = {
        strength: document.getElementById('strengthModifier'),
        dexterity: document.getElementById('dexterityModifier'),
        constitution: document.getElementById('constitutionModifier'),
        intell: document.getElementById('intellModifier'),
        wisdom: document.getElementById('wisdomModifier'),
        charisma: document.getElementById('charismaModifier')
    };

    const savingThrowCheckboxes = {
        strength: document.getElementById('strengthSaveProficient'),
        dexterity: document.getElementById('dexteritySaveProficient'),
        constitution: document.getElementById('constitutionSaveProficient'),
        intell: document.getElementById('intellSaveProficient'),
        wisdom: document.getElementById('wisdomSaveProficient'),
        charisma: document.getElementById('charismaSaveProficient')
    };
    const savingThrowValues = {
        strength: document.getElementById('strengthSave'),
        dexterity: document.getElementById('dexteritySave'),
        constitution: document.getElementById('constitutionSave'),
        intell: document.getElementById('intellSave'),
        wisdom: document.getElementById('wisdomSave'),
        charisma: document.getElementById('charismaSave')
    };

    const skillsConfig = {
        acrobatics: { ability: 'dexterity', proficientCheckbox: document.getElementById('acrobaticsProficient'), valueDisplay: document.getElementById('acrobaticsSkill') },
        animalHandling: { ability: 'wisdom', proficientCheckbox: document.getElementById('animalHandlingProficient'), valueDisplay: document.getElementById('animalHandlingSkill') },
        arcana: { ability: 'intell', proficientCheckbox: document.getElementById('arcanaProficient'), valueDisplay: document.getElementById('arcanaSkill') },
        athletics: { ability: 'strength', proficientCheckbox: document.getElementById('athleticsProficient'), valueDisplay: document.getElementById('athleticsSkill') },
        deception: { ability: 'charisma', proficientCheckbox: document.getElementById('deceptionProficient'), valueDisplay: document.getElementById('deceptionSkill') },
        history: { ability: 'intell', proficientCheckbox: document.getElementById('historyProficient'), valueDisplay: document.getElementById('historySkill') },
        insight: { ability: 'wisdom', proficientCheckbox: document.getElementById('insightProficient'), valueDisplay: document.getElementById('insightSkill') },
        intimidation: { ability: 'charisma', proficientCheckbox: document.getElementById('intimidationProficient'), valueDisplay: document.getElementById('intimidationSkill') },
        investigation: { ability: 'intell', proficientCheckbox: document.getElementById('investigationProficient'), valueDisplay: document.getElementById('investigationSkill') },
        medicine: { ability: 'wisdom', proficientCheckbox: document.getElementById('medicineProficient'), valueDisplay: document.getElementById('medicineSkill') },
        nature: { ability: 'intell', proficientCheckbox: document.getElementById('natureProficient'), valueDisplay: document.getElementById('natureSkill') },
        perception: { ability: 'wisdom', proficientCheckbox: document.getElementById('perceptionProficient'), valueDisplay: document.getElementById('perceptionSkill') },
        performance: { ability: 'charisma', proficientCheckbox: document.getElementById('performanceProficient'), valueDisplay: document.getElementById('performanceSkill') },
        persuasion: { ability: 'charisma', proficientCheckbox: document.getElementById('persuasionProficient'), valueDisplay: document.getElementById('persuasionSkill') },
        religion: { ability: 'intell', proficientCheckbox: document.getElementById('religionProficient'), valueDisplay: document.getElementById('religionSkill') },
        sleightOfHand: { ability: 'dexterity', proficientCheckbox: document.getElementById('sleightOfHandProficient'), valueDisplay: document.getElementById('sleightOfHandSkill') },
        stealth: { ability: 'dexterity', proficientCheckbox: document.getElementById('stealthProficient'), valueDisplay: document.getElementById('stealthSkill') },
        survival: { ability: 'wisdom', proficientCheckbox: document.getElementById('survivalProficient'), valueDisplay: document.getElementById('survivalSkill') }
    };

    const equipmentListDiv = document.getElementById('equipmentList');
    const addEquipmentBtn = document.getElementById('addEquipmentBtn');
    const spellsListDiv = document.getElementById('spellsList');
    const addSpellBtn = document.getElementById('addSpellBtn');

    // Элементы для карты
    const battleMapCanvas = document.getElementById('battleMap');
    const ctx = battleMapCanvas.getContext('2d');
    const gridSizeInput = document.getElementById('gridSize');
    const mapBackgroundInput = document.getElementById('mapBackground');
    const loadMapBackgroundBtn = document.getElementById('loadMapBackground');
    const resetMapBtn = document.getElementById('resetMap');

    let currentCharacterData = {};
    let mapData = {
        gridSize: parseInt(gridSizeInput.value) || 50,
        backgroundUrl: '',
        backgroundImage: null,
        characters: []
    };

    let stompClient = null;

    let selectedCharacterForMove = null;
    let hoveredCell = null;
    let mouseX_current = 0;
    let mouseY_current = 0;

    let animationFrameId = null;
    let targetX, targetY;
    const moveSpeed = 10;


    function calculateModifier(score) {
        const modifier = Math.floor((score - 10) / 2);
        return modifier >= 0 ? `+${modifier}` : `${modifier}`;
    }

    function calculateSavingThrow(abilityScore, isProficient, proficiencyBonus) {
        let value = Math.floor((abilityScore - 10) / 2);
        if (isProficient) {
            value += proficiencyBonus;
        }
        return value >= 0 ? `+${value}` : `${value}`;
    }

    function calculateSkill(abilityScore, isProficient, proficiencyBonus) {
        let value = Math.floor((abilityScore - 10) / 2);
        if (isProficient) {
            value += proficiencyBonus;
        }
        return value >= 0 ? `+${value}` : `${value}`;
    }

    function updateDerivedValues() {
        const currentProficiencyBonus = parseInt(proficiencyBonusInput.value) || 0;

        for (const key in abilityScoreInputs) {
            const score = parseInt(abilityScoreInputs[key].value);
            if (!isNaN(score)) {
                abilityModifierInputs[key].value = calculateModifier(score);
            }
        }

        for (const key in savingThrowCheckboxes) {
            const score = parseInt(abilityScoreInputs[key].value);
            const isProficient = savingThrowCheckboxes[key].checked;
            savingThrowValues[key].textContent = calculateSavingThrow(score, isProficient, currentProficiencyBonus);
        }

        for (const skillKey in skillsConfig) {
            const config = skillsConfig[skillKey];
            const abilityScore = parseInt(abilityScoreInputs[config.ability].value);
            const isProficient = config.proficientCheckbox.checked;
            config.valueDisplay.textContent = calculateSkill(abilityScore, isProficient, currentProficiencyBonus);
        }
    }

    function renderEquipment() {
        equipmentListDiv.innerHTML = '';
        currentCharacterData.equipment.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('equipment-item');
            itemDiv.innerHTML = `
                <label>Имя: <input type="text" class="item-name" value="${item.name || ''}" data-index="${index}" data-field="name"></label>
                <label>Кол-во: <input type="number" class="item-quantity" value="${item.quantity || 1}" data-index="${index}" data-field="quantity"></label>
                <label>Описание: <textarea class="item-description" data-index="${index}" data-field="description">${item.description || ''}</textarea></label>
                <button type="button" class="delete-btn" data-type="equipment" data-index="${index}">Удалить</button>
            `;
            equipmentListDiv.appendChild(itemDiv);

            itemDiv.querySelectorAll('input, textarea').forEach(input => {
                input.addEventListener('change', (event) => {
                    const idx = parseInt(event.target.dataset.index);
                    const field = event.target.dataset.field;
                    if (field === 'quantity') {
                        currentCharacterData.equipment[idx][field] = parseInt(event.target.value) || 0;
                    } else {
                        currentCharacterData.equipment[idx][field] = event.target.value;
                    }
                    saveCharacterData();
                });
            });
        });
    }

    function renderSpells() {
        spellsListDiv.innerHTML = '';
        const spellLevels = ["Заговор", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        currentCharacterData.spells.forEach((spell, index) => {
            const spellDiv = document.createElement('div');
            spellDiv.classList.add('spell-item');

            const levelOptions = spellLevels.map(level =>
                `<option value="${level}" ${spell.level === level ? 'selected' : ''}>${level}</option>`
            ).join('');

            spellDiv.innerHTML = `
                <label>Имя: <input type="text" class="spell-name" value="${spell.name || ''}" data-index="${index}" data-field="name"></label>
                <label>Уровень: <select class="spell-level" data-index="${index}" data-field="level">${levelOptions}</select></label>
                <label>Описание: <textarea class="spell-description" data-index="${index}" data-field="description">${spell.description || ''}</textarea></label>
                <button type="button" class="delete-btn" data-type="spell" data-index="${index}">Удалить</button>
            `;
            spellsListDiv.appendChild(spellDiv);

            spellDiv.querySelectorAll('input, textarea, select').forEach(input => {
                input.addEventListener('change', (event) => {
                    const idx = parseInt(event.target.dataset.index);
                    const field = event.target.dataset.field;
                    currentCharacterData.spells[idx][field] = event.target.value;
                    saveCharacterData();
                });
            });
        });
    }

    addEquipmentBtn.addEventListener('click', () => {
        if (!currentCharacterData.equipment) {
            currentCharacterData.equipment = [];
        }
        currentCharacterData.equipment.push({ name: '', quantity: 1, description: '' });
        renderEquipment();
        saveCharacterData();
    });

    addSpellBtn.addEventListener('click', () => {
        if (!currentCharacterData.spells) {
            currentCharacterData.spells = [];
        }
        currentCharacterData.spells.push({ name: '', level: 'Заговор', description: '' });
        renderSpells();
        saveCharacterData();
    });

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const type = event.target.dataset.type;
            const index = parseInt(event.target.dataset.index);

            if (type === 'equipment') {
                currentCharacterData.equipment.splice(index, 1);
                renderEquipment();
            } else if (type === 'spell') {
                currentCharacterData.spells.splice(index, 1);
                renderSpells();
            }
            saveCharacterData();
        }
    });

    // --- Функции для работы с картой ---

    function drawMap() {
        ctx.clearRect(0, 0, battleMapCanvas.width, battleMapCanvas.height);

        if (mapData.backgroundImage) {
            ctx.drawImage(mapData.backgroundImage, 0, 0, battleMapCanvas.width, battleMapCanvas.height);
        } else {
            ctx.fillStyle = '#e0e0e0';
            ctx.fillRect(0, 0, battleMapCanvas.width, battleMapCanvas.height);
        }

        if (hoveredCell) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.fillRect(hoveredCell.x, hoveredCell.y, mapData.gridSize, mapData.gridSize);
        }
        
        ctx.strokeStyle = '#a0a0a0';
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= battleMapCanvas.width; x += mapData.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, battleMapCanvas.height);
            ctx.stroke();
        }

        for (let y = 0; y <= battleMapCanvas.height; y += mapData.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(battleMapCanvas.width, y);
            ctx.stroke();
        }

        mapData.characters.forEach(char => {
            const charX = char.mapX;
            const charY = char.mapY;
            const radius = mapData.gridSize / 3;
            const color = char.id === currentCharacterData.id ? 'blue' : 'green';

            ctx.beginPath();
            ctx.arc(charX, charY, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.stroke();

            if (selectedCharacterForMove === char.id) {
                ctx.strokeStyle = 'yellow';
                ctx.lineWidth = 3;
                ctx.stroke();

                if (hoveredCell) {
                    const targetX_draw = hoveredCell.x + mapData.gridSize / 2;
                    const targetY_draw = hoveredCell.y + mapData.gridSize / 2;

                    ctx.beginPath();
                    ctx.setLineDash([5, 5]);
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
                    ctx.lineWidth = 2;
                    ctx.moveTo(charX, charY);
                    ctx.lineTo(targetX_draw, targetY_draw);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    const distancePx = Math.sqrt(
                        Math.pow(targetX_draw - charX, 2) + Math.pow(targetY_draw - charY, 2)
                    );
                    const distanceFeet = (distancePx / mapData.gridSize) * 5;

                    ctx.fillStyle = 'red';
                    ctx.font = 'bold 16px Montserrat';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';

                    const textX = charX + (targetX_draw - charX) / 2;
                    const textY = charY + (targetY_draw - charY) / 2 - 10;

                    ctx.fillText(`${distanceFeet.toFixed(0)} ft`, textX, textY);
                }
            }

            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Montserrat';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(char.name, charX, charY);
        });
    }

    function loadMapBackground(url) {
        if (!url) {
            mapData.backgroundImage = null;
            mapData.backgroundUrl = '';
            drawMap();
            saveMapData();
            return;
        }

        const img = new Image();
        img.onload = () => {
            mapData.backgroundImage = img;
            mapData.backgroundUrl = url;
            drawMap();
            saveMapData();
        };
        img.onerror = () => {
            console.error('Failed to load map background image from URL:', url);
            mapData.backgroundImage = null;
            mapData.backgroundUrl = '';
            drawMap();
            alert('Не удалось загрузить фоновое изображение. Проверьте URL.');
            saveMapData();
        };
        img.src = url;
    }

    loadMapBackgroundBtn.addEventListener('click', () => {
        const url = mapBackgroundInput.value.trim();
        loadMapBackground(url);
    });

    resetMapBtn.addEventListener('click', () => {
        mapData.backgroundUrl = '';
        mapData.backgroundImage = null;
        mapData.gridSize = parseInt(gridSizeInput.value) || 50;
        mapData.characters = [];
        currentCharacterData.mapX = battleMapCanvas.width / 2;
        currentCharacterData.mapY = battleMapCanvas.height / 2;
        mapBackgroundInput.value = '';
        drawMap();
        saveMapData();
        saveCharacterData();
    });

    gridSizeInput.addEventListener('change', () => {
        const newSize = parseInt(gridSizeInput.value);
        if (!isNaN(newSize) && newSize > 0) {
            mapData.gridSize = newSize;
            drawMap();
            saveMapData();
        } else {
            alert('Размер сетки должен быть положительным числом.');
            gridSizeInput.value = mapData.gridSize;
        }
    });

    battleMapCanvas.addEventListener('mousemove', (e) => {
        const rect = battleMapCanvas.getBoundingClientRect();
        mouseX_current = e.clientX - rect.left;
        mouseY_current = e.clientY - rect.top;

        const cellX = Math.floor(mouseX_current / mapData.gridSize) * mapData.gridSize;
        const cellY = Math.floor(mouseY_current / mapData.gridSize) * mapData.gridSize;

        if (!hoveredCell || hoveredCell.x !== cellX || hoveredCell.y !== cellY) {
            hoveredCell = { x: cellX, y: cellY };
            drawMap();
        }
    });

    battleMapCanvas.addEventListener('mouseleave', () => {
        hoveredCell = null;
        mouseX_current = 0;
        mouseY_current = 0;
        drawMap();
    });

    battleMapCanvas.addEventListener('click', (e) => {
        const rect = battleMapCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        let clickedOnCharacter = false;
        const clickedChar = mapData.characters.find(char => {
            const charX = char.mapX;
            const charY = char.mapY;
            const radius = mapData.gridSize / 3;
            const distanceToChar = Math.sqrt(Math.pow(clickX - charX, 2) + Math.pow(clickY - charY, 2));
            return distanceToChar <= radius;
        });

        if (clickedChar) {
            clickedOnCharacter = true;
            if (!selectedCharacterForMove) {
                selectedCharacterForMove = clickedChar.id;
                console.log(`Character ${clickedChar.name} selected for movement.`);
            } else if (selectedCharacterForMove === clickedChar.id) {
                selectedCharacterForMove = null;
                console.log(`Character ${clickedChar.name} deselected.`);
            } else {
                selectedCharacterForMove = clickedChar.id;
                console.log(`Character ${clickedChar.name} selected for movement.`);
            }
            drawMap();
        } else if (selectedCharacterForMove) {
            const targetCellCenterX = hoveredCell.x + mapData.gridSize / 2;
            const targetCellCenterY = hoveredCell.y + mapData.gridSize / 2;

            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }

            targetX = targetCellCenterX;
            targetY = targetCellCenterY;
            
            const charToMove = mapData.characters.find(char => char.id === selectedCharacterForMove);
            if (charToMove) {
                animateMovement(charToMove);
            }

            selectedCharacterForMove = null;
            drawMap();
        } else {
            hoveredCell = null;
            drawMap();
        }
    });

    function animateMovement(charToAnimate) {
        const charX = charToAnimate.mapX;
        const charY = charToAnimate.mapY;

        const dx = targetX - charX;
        const dy = targetY - charY;
        const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

        if (distanceToTarget > moveSpeed) {
            const angle = Math.atan2(dy, dx);
            charToAnimate.mapX += Math.cos(angle) * moveSpeed;
            charToAnimate.mapY += Math.sin(angle) * moveSpeed;
            drawMap();
            animationFrameId = requestAnimationFrame(() => animateMovement(charToAnimate));
        } else {
            charToAnimate.mapX = targetX;
            charToAnimate.mapY = targetY;
            drawMap();
            if (stompClient && stompClient.connected) {
                stompClient.send("/app/map.moveCharacter", {}, JSON.stringify(charToAnimate));
                console.log(`Sent WebSocket update for character ${charToAnimate.id}: X=${charToAnimate.mapX}, Y=${charToAnimate.mapY}`);
            } else {
                console.warn("STOMP client not connected. Saving character data via HTTP.");
                if (charToAnimate.id === currentCharacterData.id) {
                    saveCharacterData();
                }
            }
            console.log(`Character ${charToAnimate.name} moved to X: ${charToAnimate.mapX}, Y: ${charToAnimate.mapY}`);
        }
    }


    async function loadCharacterData() {
        console.log('Attempting to load character data from backend...');
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/character`);
            if (response.ok) {
                const data = await response.json();
                console.log('Character data loaded from backend:', data);
                currentCharacterData = data;

                if (!currentCharacterData.equipment) {
                    currentCharacterData.equipment = [];
                }
                if (!currentCharacterData.spells) {
                    currentCharacterData.spells = [];
                }
                if (currentCharacterData.mapX === undefined || currentCharacterData.mapX === null || currentCharacterData.mapX === 0) currentCharacterData.mapX = battleMapCanvas.width / 2;
                if (currentCharacterData.mapY === undefined || currentCharacterData.mapY === null || currentCharacterData.mapY === 0) currentCharacterData.mapY = battleMapCanvas.height / 2;


                if (characterNameInput) characterNameInput.value = data.name || 'Либериус';
                if (proficiencyBonusInput) proficiencyBonusInput.value = data.proficiencyBonus || 2;

                for (const key in abilityScoreInputs) {
                    const value = data[key];
                    if (abilityScoreInputs[key] && value !== undefined) {
                        abilityScoreInputs[key].value = value;
                    }
                }

                for (const key in savingThrowCheckboxes) {
                    const propName = `${key}SaveProficient`;
                    if (savingThrowCheckboxes[key]) {
                        savingThrowCheckboxes[key].checked = data[propName] ?? false;
                    }
                }

                for (const skillKey in skillsConfig) {
                    const config = skillsConfig[skillKey];
                    const propName = `${skillKey}Proficient`;
                    if (config.proficientCheckbox) {
                        config.proficientCheckbox.checked = data[propName] ?? false;
                    }
                }

                renderEquipment();
                renderSpells();
                updateDerivedValues();
            } else {
                console.error('Failed to load character data:', response.statusText);
                currentCharacterData = { equipment: [], spells: [], mapX: battleMapCanvas.width / 2, mapY: battleMapCanvas.height / 2 };
                if (characterNameInput) characterNameInput.value = 'Либериус';
                if (proficiencyBonusInput) proficiencyBonusInput.value = 2;
                for (const key in abilityScoreInputs) {
                    if (abilityScoreInputs[key]) {
                        abilityScoreInputs[key].value = 10;
                    }
                }
                for (const key in savingThrowCheckboxes) {
                    if (savingThrowCheckboxes[key]) {
                        savingThrowCheckboxes[key].checked = false;
                    }
                }
                for (const skillKey in skillsConfig) {
                    const config = skillsConfig[skillKey];
                    if (config.proficientCheckbox) {
                        config.proficientCheckbox.checked = false;
                    }
                }
                renderEquipment();
                renderSpells();
                updateDerivedValues();
            }
        } catch (error) {
            console.error('Error loading character data:', error);
            currentCharacterData = { equipment: [], spells: [], mapX: battleMapCanvas.width / 2, mapY: battleMapCanvas.height / 2 };
            if (characterNameInput) characterNameInput.value = 'Либериус';
            if (proficiencyBonusInput) proficiencyBonusInput.value = 2;
            for (const key in abilityScoreInputs) {
                if (abilityScoreInputs[key]) {
                    abilityScoreInputs[key].value = 10;
                }
            }
            for (const key in savingThrowCheckboxes) {
                if (savingThrowCheckboxes[key]) {
                    savingThrowCheckboxes[key].checked = false;
                }
            }
            for (const skillKey in skillsConfig) {
                const config = skillsConfig[skillKey];
                if (config.proficientCheckbox) {
                    config.proficientCheckbox.checked = false;
                }
            }
            renderEquipment();
            renderSpells();
            updateDerivedValues();
        }
    }

    async function saveCharacterData() {
        currentCharacterData.name = characterNameInput.value;
        console.log('Attempting to save character data:', currentCharacterData);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/character`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(currentCharacterData)
            });

            if (response.ok) {
                console.log('Character data saved successfully!');
                if (stompClient && stompClient.connected) {
                    stompClient.send("/app/map.moveCharacter", {}, JSON.stringify(currentCharacterData));
                }
            } else {
                const errorText = await response.text();
                console.error('Failed to save character data:', response.status, errorText);
            }
        } catch (error) {
            console.error('Error saving character data:', error);
        }
    }

    async function loadMapData() {
        console.log('Attempting to load map data from backend...');
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/map`);
            if (response.ok) {
                const data = await response.json();
                console.log('Map data loaded from backend:', data);
                mapData.gridSize = data.gridSize || 50;
                mapData.backgroundUrl = data.backgroundUrl || '';

                gridSizeInput.value = mapData.gridSize;
                mapBackgroundInput.value = mapData.backgroundUrl;

                if (mapData.backgroundUrl) {
                    loadMapBackground(mapData.backgroundUrl);
                } else {
                    drawMap();
                }

            } else {
                console.error('Failed to load map data:', response.statusText);
                mapData = {
                    gridSize: 50,
                    backgroundUrl: '',
                    backgroundImage: null,
                    characters: []
                };
                gridSizeInput.value = mapData.gridSize;
                mapBackgroundInput.value = mapData.backgroundUrl;
                drawMap();
            }
        } catch (error) {
            console.error('Error loading map data:', error);
            mapData = {
                gridSize: 50,
                backgroundUrl: '',
                backgroundImage: null,
                characters: []
            };
            gridSizeInput.value = mapData.gridSize;
            mapBackgroundInput.value = mapData.backgroundUrl;
            drawMap();
        }
    }

    async function saveMapData() {
        console.log('Attempting to save map data:', mapData);
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/api/map`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gridSize: mapData.gridSize,
                    backgroundUrl: mapData.backgroundUrl,
                })
            });

            if (response.ok) {
                console.log('Map data saved successfully!');
            } else {
                const errorText = await response.text();
                console.error('Failed to save map data:', response.status, errorText);
            }
        } catch (error) {
            console.error('Error saving map data:', error);
        }
    }

    function connectWebSocket() {
        if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
            console.error("SockJS or Stomp.js library not loaded. Check index.html script tags.");
            return;
        }

        const socket = new SockJS(WEBSOCKET_URL);
        stompClient = Stomp.over(socket);
        stompClient.connect({}, frame => {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/map.characterMoved', message => {
                const receivedChar = JSON.parse(message.body);
                console.log('Received character update:', receivedChar);

                let found = false;
                for (let i = 0; i < mapData.characters.length; i++) {
                    if (mapData.characters[i].id === receivedChar.id) {
                        mapData.characters[i].mapX = receivedChar.mapX;
                        mapData.characters[i].mapY = receivedChar.mapY;
                        mapData.characters[i].name = receivedChar.name;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    mapData.characters.push(receivedChar);
                }
                drawMap();
            });
            if (currentCharacterData && currentCharacterData.id) {
                stompClient.send("/app/map.moveCharacter", {}, JSON.stringify(currentCharacterData));
                console.log(`Sent initial WebSocket presence for character ID: ${currentCharacterData.id}`);
            }

        }, error => {
            console.error('WebSocket connection error: ' + error);
            setTimeout(connectWebSocket, 5000);
        });
    }

    function disconnectWebSocket() {
        if (stompClient !== null) {
            stompClient.disconnect();
        }
        console.log("Disconnected from WebSocket.");
    }

    loadCharacterData().then(() => {
        if (currentCharacterData && currentCharacterData.id) {
            const existingCharIndex = mapData.characters.findIndex(char => char.id === currentCharacterData.id);
            if (existingCharIndex === -1) {
                mapData.characters.push({
                    id: currentCharacterData.id,
                    name: currentCharacterData.name,
                    mapX: currentCharacterData.mapX,
                    mapY: currentCharacterData.mapY
                });
            } else {
                mapData.characters[existingCharIndex].mapX = currentCharacterData.mapX;
                mapData.characters[existingCharIndex].mapY = currentCharacterData.mapY;
                mapData.characters[existingCharIndex].name = currentCharacterData.name;
            }
        }
        loadMapData();
        connectWebSocket();
    });

    characterNameInput.addEventListener('change', saveCharacterData);
    proficiencyBonusInput.addEventListener('change', saveCharacterData);

    for (const key in abilityScoreInputs) {
        abilityScoreInputs[key].addEventListener('change', (event) => {
            currentCharacterData[key] = parseInt(event.target.value) || 0;
            updateDerivedValues();
            saveCharacterData();
        });
    }

    for (const key in savingThrowCheckboxes) {
        savingThrowCheckboxes[key].addEventListener('change', (event) => {
            currentCharacterData[`${key}SaveProficient`] = event.target.checked;
            updateDerivedValues();
            saveCharacterData();
        });
    }

    for (const skillKey in skillsConfig) {
        const config = skillsConfig[skillKey];
        config.proficientCheckbox.addEventListener('change', (event) => {
            currentCharacterData[`${skillKey}Proficient`] = event.target.checked;
            updateDerivedValues();
            saveCharacterData();
        });
    }

    window.addEventListener('beforeunload', () => {
        disconnectWebSocket();
    });
});
document.addEventListener('DOMContentLoaded', () => {
    // === КОНФИГУРАЦИЯ СЕТИ ===
    const BACKEND_URL = 'http://localhost:8080';
    let socket = io(BACKEND_URL);

    // --- ОБЪЯВЛЕНИЕ ПЕРЕМЕННЫХ ---
    const characterNameInput = document.getElementById('characterName');
    const proficiencyBonusInput = document.getElementById('proficiencyBonus');
    const abilityScoreInputs = { strength: document.getElementById('strengthScore'), dexterity: document.getElementById('dexterityScore'), constitution: document.getElementById('constitutionScore'), intell: document.getElementById('intellScore'), wisdom: document.getElementById('wisdomScore'), charisma: document.getElementById('charismaScore') };
    const abilityModifierInputs = { strength: document.getElementById('strengthModifier'), dexterity: document.getElementById('dexterityModifier'), constitution: document.getElementById('constitutionModifier'), intell: document.getElementById('intellModifier'), wisdom: document.getElementById('wisdomModifier'), charisma: document.getElementById('charismaModifier') };
    const savingThrowCheckboxes = { strength: document.getElementById('strengthSaveProficient'), dexterity: document.getElementById('dexteritySaveProficient'), constitution: document.getElementById('constitutionSaveProficient'), intell: document.getElementById('intellSaveProficient'), wisdom: document.getElementById('wisdomSaveProficient'), charisma: document.getElementById('charismaSaveProficient') };
    const savingThrowValues = { strength: document.getElementById('strengthSave'), dexterity: document.getElementById('dexteritySave'), constitution: document.getElementById('constitutionSave'), intell: document.getElementById('intellSave'), wisdom: document.getElementById('wisdomSave'), charisma: document.getElementById('charismaSave') };
    const skillsConfig = { acrobatics: { ability: 'dexterity', proficientCheckbox: document.getElementById('acrobaticsProficient'), valueDisplay: document.getElementById('acrobaticsSkill') }, animalHandling: { ability: 'wisdom', proficientCheckbox: document.getElementById('animalHandlingProficient'), valueDisplay: document.getElementById('animalHandlingSkill') }, arcana: { ability: 'intell', proficientCheckbox: document.getElementById('arcanaProficient'), valueDisplay: document.getElementById('arcanaSkill') }, athletics: { ability: 'strength', proficientCheckbox: document.getElementById('athleticsProficient'), valueDisplay: document.getElementById('athleticsSkill') }, deception: { ability: 'charisma', proficientCheckbox: document.getElementById('deceptionProficient'), valueDisplay: document.getElementById('deceptionSkill') }, history: { ability: 'intell', proficientCheckbox: document.getElementById('historyProficient'), valueDisplay: document.getElementById('historySkill') }, insight: { ability: 'wisdom', proficientCheckbox: document.getElementById('insightProficient'), valueDisplay: document.getElementById('insightSkill') }, intimidation: { ability: 'charisma', proficientCheckbox: document.getElementById('intimidationProficient'), valueDisplay: document.getElementById('intimidationSkill') }, investigation: { ability: 'intell', proficientCheckbox: document.getElementById('investigationProficient'), valueDisplay: document.getElementById('investigationSkill') }, medicine: { ability: 'wisdom', proficientCheckbox: document.getElementById('medicineProficient'), valueDisplay: document.getElementById('medicineSkill') }, nature: { ability: 'intell', proficientCheckbox: document.getElementById('natureProficient'), valueDisplay: document.getElementById('natureSkill') }, perception: { ability: 'wisdom', proficientCheckbox: document.getElementById('perceptionProficient'), valueDisplay: document.getElementById('perceptionSkill') }, performance: { ability: 'charisma', proficientCheckbox: document.getElementById('performanceProficient'), valueDisplay: document.getElementById('performanceSkill') }, persuasion: { ability: 'charisma', proficientCheckbox: document.getElementById('persuasionProficient'), valueDisplay: document.getElementById('persuasionSkill') }, religion: { ability: 'intell', proficientCheckbox: document.getElementById('religionProficient'), valueDisplay: document.getElementById('religionSkill') }, sleightOfHand: { ability: 'dexterity', proficientCheckbox: document.getElementById('sleightOfHandProficient'), valueDisplay: document.getElementById('sleightOfHandSkill') }, stealth: { ability: 'dexterity', proficientCheckbox: document.getElementById('stealthProficient'), valueDisplay: document.getElementById('stealthSkill') }, survival: { ability: 'wisdom', proficientCheckbox: document.getElementById('survivalProficient'), valueDisplay: document.getElementById('survivalSkill') } };
    const equipmentListDiv = document.getElementById('equipmentList');
    const addEquipmentBtn = document.getElementById('addEquipmentBtn');
    const spellsListDiv = document.getElementById('spellsList');
    const addSpellBtn = document.getElementById('addSpellBtn');
    const battleMapCanvas = document.getElementById('battleMap');
    const ctx = battleMapCanvas.getContext('2d');
    const gridSizeInput = document.getElementById('gridSize');
    const mapBackgroundInput = document.getElementById('mapBackground');
    const loadMapBackgroundBtn = document.getElementById('loadMapBackground');
    const resetMapBtn = document.getElementById('resetMap');

    let currentCharacterData = {};
    let mapData = { gridSize: 50, backgroundUrl: '', backgroundImage: null, characters: [] };
    let selectedCharacterForMove = null;
    let hoveredCell = null;
    let animationFrameId = null;
    
    // --- WebSocket Listeners ---
    socket.on('connect', () => {
        console.log('Successfully connected to WebSocket server with ID:', socket.id);
        socket.emit('map:get'); 
    });
    socket.on('map:update', (allCharacters) => {
        mapData.characters = allCharacters;
        drawMap();
    });
    
    // --- ОСНОВНЫЕ ФУНКЦИИ ---
    function calculateModifier(score) { const modifier = Math.floor((score - 10) / 2); return modifier >= 0 ? `+${modifier}` : `${modifier}`; }
    function calculateSavingThrow(abilityScore, isProficient, proficiencyBonus) { let value = Math.floor((abilityScore - 10) / 2); if (isProficient) { value += proficiencyBonus; } return value >= 0 ? `+${value}` : `${value}`; }
    function calculateSkill(abilityScore, isProficient, proficiencyBonus) { let value = Math.floor((abilityScore - 10) / 2); if (isProficient) { value += proficiencyBonus; } return value >= 0 ? `+${value}` : `${value}`; }
    function updateDerivedValues() { const currentProficiencyBonus = parseInt(proficiencyBonusInput.value) || 0; for (const key in abilityScoreInputs) { const score = parseInt(abilityScoreInputs[key].value); if (!isNaN(score)) { abilityModifierInputs[key].value = calculateModifier(score); } } for (const key in savingThrowCheckboxes) { const score = parseInt(abilityScoreInputs[key].value); const isProficient = savingThrowCheckboxes[key].checked; savingThrowValues[key].textContent = calculateSavingThrow(score, isProficient, currentProficiencyBonus); } for (const skillKey in skillsConfig) { const config = skillsConfig[skillKey]; const abilityScore = parseInt(abilityScoreInputs[config.ability].value); const isProficient = config.proficientCheckbox.checked; config.valueDisplay.textContent = calculateSkill(abilityScore, isProficient, currentProficiencyBonus); } }
    
    function renderEquipment() { equipmentListDiv.innerHTML = ''; if (!currentCharacterData.equipment) currentCharacterData.equipment = []; currentCharacterData.equipment.forEach((item, index) => { const itemDiv = document.createElement('div'); itemDiv.classList.add('equipment-item'); itemDiv.innerHTML = `<label>Имя: <input type="text" class="item-name" value="${item.name || ''}" data-index="${index}" data-field="name"></label><label>Кол-во: <input type="number" class="item-quantity" value="${item.quantity || 1}" data-index="${index}" data-field="quantity"></label><label>Описание: <textarea class="item-description" data-index="${index}" data-field="description">${item.description || ''}</textarea></label><button type="button" class="delete-btn" data-type="equipment" data-index="${index}">Удалить</button>`; equipmentListDiv.appendChild(itemDiv); }); }
    function renderSpells() { spellsListDiv.innerHTML = ''; if (!currentCharacterData.spells) currentCharacterData.spells = []; const spellLevels = ["Заговор", "1", "2", "3", "4", "5", "6", "7", "8", "9"]; currentCharacterData.spells.forEach((spell, index) => { const spellDiv = document.createElement('div'); spellDiv.classList.add('spell-item'); const levelOptions = spellLevels.map(level => `<option value="${level}" ${spell.level === level ? 'selected' : ''}>${level}</option>`).join(''); spellDiv.innerHTML = `<label>Имя: <input type="text" class="spell-name" value="${spell.name || ''}" data-index="${index}" data-field="name"></label><label>Уровень: <select class="spell-level" data-index="${index}" data-field="level">${levelOptions}</select></label><label>Описание: <textarea class="spell-description" data-index="${index}" data-field="description">${spell.description || ''}</textarea></label><button type="button" class="delete-btn" data-type="spell" data-index="${index}">Удалить</button>`; spellsListDiv.appendChild(spellDiv); }); }
    
    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    equipmentListDiv.addEventListener('change', (event) => { if (event.target.matches('input, textarea')) { const idx = parseInt(event.target.dataset.index); const field = event.target.dataset.field; currentCharacterData.equipment[idx][field] = field === 'quantity' ? parseInt(event.target.value) : event.target.value; saveCharacterData(); } });
    spellsListDiv.addEventListener('change', (event) => { if (event.target.matches('input, textarea, select')) { const idx = parseInt(event.target.dataset.index); const field = event.target.dataset.field; currentCharacterData.spells[idx][field] = event.target.value; saveCharacterData(); } });
    addEquipmentBtn.addEventListener('click', () => { if (!currentCharacterData.equipment) currentCharacterData.equipment = []; currentCharacterData.equipment.push({ name: '', quantity: 1, description: '' }); renderEquipment(); saveCharacterData(); });
    addSpellBtn.addEventListener('click', () => { if (!currentCharacterData.spells) currentCharacterData.spells = []; currentCharacterData.spells.push({ name: '', level: 'Заговор', description: '' }); renderSpells(); saveCharacterData(); });
    document.addEventListener('click', (event) => { if (event.target.classList.contains('delete-btn')) { const type = event.target.dataset.type; const index = parseInt(event.target.dataset.index); if (type === 'equipment') { currentCharacterData.equipment.splice(index, 1); renderEquipment(); } else if (type === 'spell') { currentCharacterData.spells.splice(index, 1); renderSpells(); } saveCharacterData(); } });

    // --- ЛОГИКА КАРТЫ ---
    function drawMap() {
        ctx.clearRect(0, 0, battleMapCanvas.width, battleMapCanvas.height);
        if (mapData.backgroundImage) { ctx.drawImage(mapData.backgroundImage, 0, 0, battleMapCanvas.width, battleMapCanvas.height); } else { ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0, 0, battleMapCanvas.width, battleMapCanvas.height); }
        if (hoveredCell) { ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'; ctx.fillRect(hoveredCell.x, hoveredCell.y, mapData.gridSize, mapData.gridSize); }
        ctx.strokeStyle = '#a0a0a0'; ctx.lineWidth = 0.5;
        for (let x = 0; x <= battleMapCanvas.width; x += mapData.gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, battleMapCanvas.height); ctx.stroke(); }
        for (let y = 0; y <= battleMapCanvas.height; y += mapData.gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(battleMapCanvas.width, y); ctx.stroke(); }
        mapData.characters.forEach(char => {
            const radius = mapData.gridSize / 3; const color = char._id === currentCharacterData._id ? 'blue' : 'green'; 
            ctx.beginPath(); ctx.arc(char.mapX, char.mapY, radius, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = 'black'; ctx.lineWidth = 1; ctx.stroke();
            if (selectedCharacterForMove === char._id && hoveredCell) {
                ctx.strokeStyle = 'yellow'; ctx.lineWidth = 3; ctx.stroke();
                const targetX_draw = hoveredCell.x + mapData.gridSize / 2; const targetY_draw = hoveredCell.y + mapData.gridSize / 2;
                ctx.beginPath(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; ctx.lineWidth = 2; ctx.moveTo(char.mapX, char.mapY); ctx.lineTo(targetX_draw, targetY_draw); ctx.stroke(); ctx.setLineDash([]);
                const distancePx = Math.sqrt(Math.pow(targetX_draw - char.mapX, 2) + Math.pow(targetY_draw - char.mapY, 2));
                const distanceFeet = (distancePx / mapData.gridSize) * 5;
                ctx.fillStyle = 'red'; ctx.font = 'bold 16px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
                const textX = char.mapX + (targetX_draw - char.mapX) / 2; const textY = char.mapY + (targetY_draw - char.mapY) / 2 - 10;
                ctx.fillText(`${distanceFeet.toFixed(0)} ft`, textX, textY);
            }
            ctx.fillStyle = 'white'; ctx.font = 'bold 12px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(char.name, char.mapX, char.mapY);
        });
    }
    
    function animateMovement(charToAnimate, targetX, targetY) {
        const moveSpeed = 5; const charX = charToAnimate.mapX; const charY = charToAnimate.mapY; const dx = targetX - charX; const dy = targetY - charY; const distanceToTarget = Math.sqrt(dx * dx + dy * dy);
        if (distanceToTarget > moveSpeed) { const angle = Math.atan2(dy, dx); charToAnimate.mapX += Math.cos(angle) * moveSpeed; charToAnimate.mapY += Math.sin(angle) * moveSpeed; drawMap(); animationFrameId = requestAnimationFrame(() => animateMovement(charToAnimate, targetX, targetY)); } else { charToAnimate.mapX = targetX; charToAnimate.mapY = targetY; drawMap(); socket.emit('character:move', { _id: charToAnimate._id, mapX: charToAnimate.mapX, mapY: charToAnimate.mapY, }); }
    }
    
    function loadMapBackground(url) {
        if (!url) {
            mapData.backgroundImage = null; mapData.backgroundUrl = '';
            drawMap(); saveMapData();
            return;
        }
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            mapData.backgroundImage = img; mapData.backgroundUrl = url;
            drawMap(); saveMapData();
        };
        img.onerror = () => {
            alert('Не удалось загрузить фон. Проверьте URL и CORS-политику изображения.');
            mapData.backgroundImage = null; mapData.backgroundUrl = '';
            mapBackgroundInput.value = '';
            drawMap(); saveMapData();
        };
        img.src = url;
    }
    
    loadMapBackgroundBtn.addEventListener('click', () => loadMapBackground(mapBackgroundInput.value.trim()));
    gridSizeInput.addEventListener('change', () => { mapData.gridSize = parseInt(gridSizeInput.value) || 50; drawMap(); saveMapData(); });
    battleMapCanvas.addEventListener('mousemove', (e) => { const rect = battleMapCanvas.getBoundingClientRect(); const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top; const cellX = Math.floor(mouseX / mapData.gridSize) * mapData.gridSize; const cellY = Math.floor(mouseY / mapData.gridSize) * mapData.gridSize; if (!hoveredCell || hoveredCell.x !== cellX || hoveredCell.y !== cellY) { hoveredCell = { x: cellX, y: cellY }; drawMap(); } });
    battleMapCanvas.addEventListener('mouseleave', () => { hoveredCell = null; drawMap(); });
    battleMapCanvas.addEventListener('click', (e) => { const rect = battleMapCanvas.getBoundingClientRect(); const clickX = e.clientX - rect.left; const clickY = e.clientY - rect.top; const clickedChar = mapData.characters.find(char => { const distance = Math.sqrt(Math.pow(clickX - char.mapX, 2) + Math.pow(clickY - char.mapY, 2)); return distance <= mapData.gridSize / 3; }); if (clickedChar && clickedChar._id === currentCharacterData._id) { selectedCharacterForMove = selectedCharacterForMove === clickedChar._id ? null : clickedChar._id; drawMap(); } else if (selectedCharacterForMove) { const charToMove = mapData.characters.find(c => c._id === selectedCharacterForMove); if (charToMove) { if (animationFrameId) cancelAnimationFrame(animationFrameId); const targetX = hoveredCell.x + mapData.gridSize / 2; const targetY = hoveredCell.y + mapData.gridSize / 2; animateMovement(charToMove, targetX, targetY); } selectedCharacterForMove = null; } });
    
    // --- ЗАГРУЗКА И СОХРАНЕНИЕ ДАННЫХ ---
    async function loadCharacterData() { try { const response = await fetch(`${BACKEND_URL}/api/character`); if (!response.ok) throw new Error('Failed to load character'); currentCharacterData = await response.json(); characterNameInput.value = currentCharacterData.name; proficiencyBonusInput.value = currentCharacterData.proficiencyBonus; Object.keys(abilityScoreInputs).forEach(key => { abilityScoreInputs[key].value = currentCharacterData[key]; }); Object.keys(savingThrowCheckboxes).forEach(key => { savingThrowCheckboxes[key].checked = currentCharacterData[`${key}SaveProficient`]; }); Object.keys(skillsConfig).forEach(key => { skillsConfig[key].proficientCheckbox.checked = currentCharacterData[`${key}Proficient`]; }); renderEquipment(); renderSpells(); updateDerivedValues(); socket.emit('character:join', currentCharacterData); } catch (error) { console.error(error); } }
    async function saveCharacterData() { 
        // Собираем данные с формы
        currentCharacterData.name = characterNameInput.value; 
        currentCharacterData.proficiencyBonus = parseInt(proficiencyBonusInput.value); 
        Object.keys(abilityScoreInputs).forEach(key => { currentCharacterData[key] = parseInt(abilityScoreInputs[key].value); }); 
        Object.keys(savingThrowCheckboxes).forEach(key => { currentCharacterData[`${key}SaveProficient`] = savingThrowCheckboxes[key].checked; }); 
        Object.keys(skillsConfig).forEach(key => { currentCharacterData[`${key}Proficient`] = skillsConfig[key].proficientCheckbox.checked; }); 
        // Отправляем на сервер
        try { 
            await fetch(`${BACKEND_URL}/api/character`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentCharacterData) }); 
            socket.emit('character:move', { _id: currentCharacterData._id, name: currentCharacterData.name, mapX: currentCharacterData.mapX, mapY: currentCharacterData.mapY }); 
        } catch (error) { console.error('Failed to save character:', error); } 
    }
    async function loadMapData() { try { const response = await fetch(`${BACKEND_URL}/api/map`); if (!response.ok) throw new Error('Failed to load map'); const data = await response.json(); mapData.gridSize = data.gridSize; gridSizeInput.value = data.gridSize; if(data.backgroundUrl) { mapBackgroundInput.value = data.backgroundUrl; loadMapBackground(data.backgroundUrl); } } catch (error) { console.error(error); } }
    async function saveMapData() { try { await fetch(`${BACKEND_URL}/api/map`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gridSize: mapData.gridSize, backgroundUrl: mapData.backgroundUrl }) }); } catch (error) { console.error('Failed to save map data:', error); } }

    // --- ИНИЦИАЛИЗАЦИЯ ---
    document.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('change', saveCharacterData);
    });
    
    loadCharacterData();
    loadMapData();
});
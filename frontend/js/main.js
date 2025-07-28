document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = '';
    let socket = io(BACKEND_URL);

    // --- DOM Элементы ---
    const authContainer = document.getElementById('auth-container');
    const mainAppContainer = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const authMessage = document.getElementById('authMessage');
    const characterSheet = document.getElementById('app');
    const characterSelector = document.getElementById('characterSelector');
    const loadCharacterBtn = document.getElementById('loadCharacterBtn');
    const newCharacterBtn = document.getElementById('newCharacterBtn');
    const deleteCharacterBtn = document.getElementById('deleteCharacterBtn');
    const characterNameInput = document.getElementById('characterName');
    const proficiencyBonusInput = document.getElementById('proficiencyBonus');
    const abilityScoreInputs = { strength: document.getElementById('strengthScore'), dexterity: document.getElementById('dexterityScore'), constitution: document.getElementById('constitutionScore'), intell: document.getElementById('intellScore'), wisdom: document.getElementById('wisdomScore'), charisma: document.getElementById('charismaScore') };
    const abilityModifierInputs = { strength: document.getElementById('strengthModifier'), dexterity: document.getElementById('dexterityModifier'), constitution: document.getElementById('constitutionModifier'), intell: document.getElementById('intellModifier'), wisdom: document.getElementById('wisdomModifier'), charisma: document.getElementById('charismaModifier') };
    const savingThrowCheckboxes = { strength: document.getElementById('strengthSaveProficient'), dexterity: document.getElementById('dexteritySaveProficient'), constitution: document.getElementById('constitutionSaveProficient'), intell: document.getElementById('intellSaveProficient'), wisdom: document.getElementById('wisdomSaveProficient'), charisma: document.getElementById('charismaSaveProficient') };
    const savingThrowValues = { strength: document.getElementById('strengthSave'), dexterity: document.getElementById('dexteritySave'), constitution: document.getElementById('constitutionSave'), intell: document.getElementById('intellSave'), wisdom: document.getElementById('wisdomSave'), charisma: document.getElementById('charismaSave') };
    const skillsConfig = { acrobatics: { ability: 'dexterity', proficientCheckbox: document.getElementById('acrobaticsProficient')}, animalHandling: { ability: 'wisdom', proficientCheckbox: document.getElementById('animalHandlingProficient')}, arcana: { ability: 'intell', proficientCheckbox: document.getElementById('arcanaProficient')}, athletics: { ability: 'strength', proficientCheckbox: document.getElementById('athleticsProficient')}, deception: { ability: 'charisma', proficientCheckbox: document.getElementById('deceptionProficient')}, history: { ability: 'intell', proficientCheckbox: document.getElementById('historyProficient')}, insight: { ability: 'wisdom', proficientCheckbox: document.getElementById('insightProficient')}, intimidation: { ability: 'charisma', proficientCheckbox: document.getElementById('intimidationProficient')}, investigation: { ability: 'intell', proficientCheckbox: document.getElementById('investigationProficient')}, medicine: { ability: 'wisdom', proficientCheckbox: document.getElementById('medicineProficient')}, nature: { ability: 'intell', proficientCheckbox: document.getElementById('natureProficient')}, perception: { ability: 'wisdom', proficientCheckbox: document.getElementById('perceptionProficient')}, performance: { ability: 'charisma', proficientCheckbox: document.getElementById('performanceProficient')}, persuasion: { ability: 'charisma', proficientCheckbox: document.getElementById('persuasionProficient')}, religion: { ability: 'intell', proficientCheckbox: document.getElementById('religionProficient')}, sleightOfHand: { ability: 'dexterity', proficientCheckbox: document.getElementById('sleightOfHandProficient')}, stealth: { ability: 'dexterity', proficientCheckbox: document.getElementById('stealthProficient')}, survival: { ability: 'wisdom', proficientCheckbox: document.getElementById('survivalProficient')} };
    const equipmentListDiv = document.getElementById('equipmentList');
    const addEquipmentBtn = document.getElementById('addEquipmentBtn');
    const spellsListDiv = document.getElementById('spellsList');
    const addSpellBtn = document.getElementById('addSpellBtn');
    const battleMapCanvas = document.getElementById('battleMap');
    const ctx = battleMapCanvas.getContext('2d');
    const gridSizeInput = document.getElementById('gridSize');
    const mapBackgroundInput = document.getElementById('mapBackground');
    const loadMapBackgroundBtn = document.getElementById('loadMapBackground');
    const eventLogDisplay = document.getElementById('eventLogDisplay');
    const eventLogInput = document.getElementById('eventLogInput');
    const eventLogSendBtn = document.getElementById('eventLogSendBtn');
    const startCombatBtn = document.getElementById('startCombatBtn');
    const combatTrackerPanel = document.getElementById('combatTrackerPanel');
    const initiativeTracker = document.getElementById('initiativeTracker');
    const nextTurnBtn = document.getElementById('nextTurnBtn');
    const endCombatBtn = document.getElementById('endCombatBtn');
    const addNpcBtn = document.getElementById('addNpcBtn');
    const npcNameInput = document.getElementById('npcNameInput');
    const npcInitiativeInput = document.getElementById('npcInitiativeInput');
    
    // --- Состояние приложения ---
    let userData = { token: null, userId: null, username: null };
    let activeCharacterId = null;
    let currentCharacterData = {};
    let currentCombatState = null;
    let mapData = { gridSize: 50, backgroundUrl: '', backgroundImage: null, characters: [] };
    let selectedCharacterForMove = null;
    let hoveredCell = null;
    let animationFrameId = null;

    // --- ЛОГИКА АУТЕНТИФИКАЦИИ ---
    function setupAuthEventListeners() {
        showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); authMessage.textContent = ''; });
        showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); authMessage.textContent = ''; });

        registerBtn.addEventListener('click', async () => {
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            try {
                const response = await fetch(`${BACKEND_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
                const data = await response.json();
                authMessage.textContent = data.message;
                if (response.ok) {
                    authMessage.style.color = 'green';
                    document.getElementById('registerUsername').value = '';
                    document.getElementById('registerPassword').value = '';
                    setTimeout(() => showLoginLink.click(), 1000);
                } else {
                    authMessage.style.color = 'red';
                }
            } catch (e) { authMessage.textContent = 'Ошибка сети'; }
        });

        loginBtn.addEventListener('click', async () => {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            try {
                const response = await fetch(`${BACKEND_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
                const data = await response.json();
                if (response.ok) {
                    login(data);
                } else {
                    authMessage.textContent = data.message;
                    authMessage.style.color = 'red';
                }
            } catch (e) { authMessage.textContent = 'Ошибка сети'; }
        });

        logoutBtn.addEventListener('click', logout);
    }
    
    function login({ token, userId, username }) {
        userData = { token, userId, username };
        localStorage.setItem('userData', JSON.stringify(userData));
        authContainer.classList.add('hidden');
        mainAppContainer.classList.remove('hidden');
        usernameDisplay.textContent = username;
        initializeApp();
    }
    
    function logout() {
        userData = { token: null, userId: null, username: null };
        localStorage.removeItem('userData');
        window.location.reload();
    }

    function checkAuthState() {
        const storedData = localStorage.getItem('userData');
        if (storedData) {
            const data = JSON.parse(storedData);
            if (data.token) {
                login(data);
            }
        } else {
            authContainer.classList.remove('hidden');
            mainAppContainer.classList.add('hidden');
        }
    }

    // --- WebSocket ---
    socket.on('connect', () => { socket.emit('map:get'); socket.emit('combat:get'); });
    socket.on('map:update', (allCharacters) => { mapData.characters = allCharacters; drawMap(); });
    socket.on('log:new_message', (messageData) => { const messageElement = document.createElement('p'); const prefix = messageData.charName ? `<strong>${messageData.charName}:</strong>` : ''; messageElement.innerHTML = `${prefix} ${messageData.text}`; eventLogDisplay.appendChild(messageElement); eventLogDisplay.scrollTop = eventLogDisplay.scrollHeight; });
    socket.on('combat:update', (newState) => {
        currentCombatState = newState;
        renderCombatTracker();
    });

    // --- ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ ---
    function initializeApp() {
        loadCharacterList();
        loadMapData();
        setupMainEventListeners();
    }
    
    async function loadCharacterList() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/characters`, { headers: { 'Authorization': `Bearer ${userData.token}` } });
            if (!response.ok) {
                if (response.status === 401) return logout();
                throw new Error('Failed to fetch characters');
            }
            const characters = await response.json();
            characterSelector.innerHTML = '';
            if (characters.length > 0) {
                characters.forEach(char => {
                    const option = document.createElement('option');
                    option.value = char._id;
                    option.textContent = char.name;
                    characterSelector.appendChild(option);
                });
                loadCharacter(characterSelector.value);
            } else {
                characterSheet.style.display = 'none';
            }
        } catch (error) { console.error("Failed to load character list:", error); }
    }

    async function loadCharacter(id) {
        if (!id) { characterSheet.style.display = 'none'; return; };
        try {
            const response = await fetch(`${BACKEND_URL}/api/characters/${id}`, { headers: { 'Authorization': `Bearer ${userData.token}` } });
            if (!response.ok) throw new Error('Character not found');
            currentCharacterData = await response.json();
            activeCharacterId = id;
            populateFormWithData();
            socket.emit('character:join', currentCharacterData);
            characterSheet.style.display = 'grid';
        } catch (error) { console.error("Failed to load character:", error); }
    }

    async function createNewCharacter() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/characters`, { method: 'POST', headers: { 'Authorization': `Bearer ${userData.token}` } });
            const newCharacter = await response.json();
            await loadCharacterList();
            characterSelector.value = newCharacter._id;
            await loadCharacter(newCharacter._id);
        } catch (error) { console.error("Failed to create character:", error); }
    }

    async function deleteCharacter() {
        const selectedId = characterSelector.value;
        if (!selectedId) { alert("Персонаж не выбран."); return; }
        const characterName = characterSelector.options[characterSelector.selectedIndex].text;
        if (confirm(`Вы уверены, что хотите удалить персонажа "${characterName}"?`)) {
            try {
                await fetch(`${BACKEND_URL}/api/characters/${selectedId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${userData.token}` } });
                await loadCharacterList();
            } catch (error) { console.error("Failed to delete character:", error); }
        }
    }
    
    function populateFormWithData() {
        characterNameInput.value = currentCharacterData.name;
        proficiencyBonusInput.value = currentCharacterData.proficiencyBonus;
        Object.keys(abilityScoreInputs).forEach(key => { abilityScoreInputs[key].value = currentCharacterData[key]; });
        Object.keys(savingThrowCheckboxes).forEach(key => { savingThrowCheckboxes[key].checked = currentCharacterData[`${key}SaveProficient`]; });
        Object.keys(skillsConfig).forEach(key => { skillsConfig[key].proficientCheckbox.checked = currentCharacterData[`${key}Proficient`]; });
        renderEquipment();
        renderSpells();
        updateDerivedValues();
    }
    
    async function saveCharacterData() {
        if (!activeCharacterId) return;
        const formData = {
            name: characterNameInput.value,
            proficiencyBonus: parseInt(proficiencyBonusInput.value),
            ...Object.fromEntries(Object.keys(abilityScoreInputs).map(key => [key, parseInt(abilityScoreInputs[key].value)])),
            ...Object.fromEntries(Object.keys(savingThrowCheckboxes).map(key => [`${key}SaveProficient`, savingThrowCheckboxes[key].checked])),
            ...Object.fromEntries(Object.keys(skillsConfig).map(key => [`${key}Proficient`, skillsConfig[key].proficientCheckbox.checked])),
            equipment: currentCharacterData.equipment,
            spells: currentCharacterData.spells
        };
        try {
            const response = await fetch(`${BACKEND_URL}/api/characters/${activeCharacterId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userData.token}` }, body: JSON.stringify(formData) });
            const updatedChar = await response.json();
            socket.emit('character:join', updatedChar);
        } catch (error) { console.error('Failed to save character:', error); }
    }

    function sendLogMessage() {
        const messageText = eventLogInput.value.trim();
        if (messageText) {
            const messageData = { text: messageText, charName: currentCharacterData ? currentCharacterData.name : 'Система' };
            socket.emit('log:send', messageData);
            eventLogInput.value = '';
        }
    }
    
    function updateDerivedValues() { const currentProficiencyBonus = parseInt(proficiencyBonusInput.value) || 0; for (const key in abilityScoreInputs) { const score = parseInt(abilityScoreInputs[key].value); if (!isNaN(score)) { document.getElementById(`${key}Modifier`).value = Math.floor((score - 10) / 2) >= 0 ? `+${Math.floor((score - 10) / 2)}` : `${Math.floor((score - 10) / 2)}`; } } for (const key in savingThrowCheckboxes) { const score = parseInt(abilityScoreInputs[key].value); const isProficient = savingThrowCheckboxes[key].checked; document.getElementById(`${key}Save`).textContent = (isProficient ? parseInt(proficiencyBonusInput.value) : 0) + Math.floor((score - 10) / 2); } for (const skillKey in skillsConfig) { const config = skillsConfig[skillKey]; const abilityScore = parseInt(abilityScoreInputs[config.ability].value); const isProficient = config.proficientCheckbox.checked; document.getElementById(`${skillKey}Skill`).textContent = (isProficient ? parseInt(proficiencyBonusInput.value) : 0) + Math.floor((abilityScore - 10) / 2); } }
    function renderEquipment() { equipmentListDiv.innerHTML = ''; if (!currentCharacterData.equipment) currentCharacterData.equipment = []; currentCharacterData.equipment.forEach((item, index) => { const itemDiv = document.createElement('div'); itemDiv.classList.add('equipment-item'); itemDiv.innerHTML = `<label>Имя: <input type="text" class="item-name" value="${item.name || ''}" data-index="${index}" data-field="name"></label><label>Кол-во: <input type="number" class="item-quantity" value="${item.quantity || 1}" data-index="${index}" data-field="quantity"></label><label>Описание: <textarea class="item-description" data-index="${index}" data-field="description">${item.description || ''}</textarea></label><button type="button" class="delete-btn" data-type="equipment" data-index="${index}">Удалить</button>`; equipmentListDiv.appendChild(itemDiv); }); }
    function renderSpells() { spellsListDiv.innerHTML = ''; if (!currentCharacterData.spells) currentCharacterData.spells = []; const spellLevels = ["Заговор", "1", "2", "3", "4", "5", "6", "7", "8", "9"]; currentCharacterData.spells.forEach((spell, index) => { const spellDiv = document.createElement('div'); spellDiv.classList.add('spell-item'); const levelOptions = spellLevels.map(level => `<option value="${level}" ${spell.level === level ? 'selected' : ''}>${level}</option>`).join(''); spellDiv.innerHTML = `<label>Имя: <input type="text" class="spell-name" value="${spell.name || ''}" data-index="${index}" data-field="name"></label><label>Уровень: <select class="spell-level" data-index="${index}" data-field="level">${levelOptions}</select></label><label>Описание: <textarea class="spell-description" data-index="${index}" data-field="description">${spell.description || ''}</textarea></label><button type="button" class="delete-btn" data-type="spell" data-index="${index}">Удалить</button>`; spellsListDiv.appendChild(spellDiv); }); }
    function drawMap() { ctx.clearRect(0, 0, battleMapCanvas.width, battleMapCanvas.height); if (mapData.backgroundImage) { ctx.drawImage(mapData.backgroundImage, 0, 0, battleMapCanvas.width, battleMapCanvas.height); } else { ctx.fillStyle = '#e0e0e0'; ctx.fillRect(0, 0, battleMapCanvas.width, battleMapCanvas.height); } if (hoveredCell) { ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'; ctx.fillRect(hoveredCell.x, hoveredCell.y, mapData.gridSize, mapData.gridSize); } ctx.strokeStyle = '#a0a0a0'; ctx.lineWidth = 0.5; for (let x = 0; x <= battleMapCanvas.width; x += mapData.gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, battleMapCanvas.height); ctx.stroke(); } for (let y = 0; y <= battleMapCanvas.height; y += mapData.gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(battleMapCanvas.width, y); ctx.stroke(); } mapData.characters.forEach(char => { const radius = mapData.gridSize / 3; const color = char._id === activeCharacterId ? 'blue' : 'green'; ctx.beginPath(); ctx.arc(char.mapX, char.mapY, radius, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = 'black'; ctx.lineWidth = 1; ctx.stroke(); if (selectedCharacterForMove === char._id && hoveredCell) { ctx.strokeStyle = 'yellow'; ctx.lineWidth = 3; ctx.stroke(); const targetX_draw = hoveredCell.x + mapData.gridSize / 2; const targetY_draw = hoveredCell.y + mapData.gridSize / 2; ctx.beginPath(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; ctx.lineWidth = 2; ctx.moveTo(char.mapX, char.mapY); ctx.lineTo(targetX_draw, targetY_draw); ctx.stroke(); ctx.setLineDash([]); const distancePx = Math.sqrt(Math.pow(targetX_draw - char.mapX, 2) + Math.pow(targetY_draw - char.mapY, 2)); const distanceFeet = (distancePx / mapData.gridSize) * 5; ctx.fillStyle = 'red'; ctx.font = 'bold 16px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; const textX = char.mapX + (targetX_draw - char.mapX) / 2; const textY = char.mapY + (targetY_draw - char.mapY) / 2 - 10; ctx.fillText(`${distanceFeet.toFixed(0)} ft`, textX, textY); } ctx.fillStyle = 'white'; ctx.font = 'bold 12px Montserrat'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(char.name, char.mapX, char.mapY); }); }
    function animateMovement(charToAnimate, targetX, targetY) { const moveSpeed = 5; const charX = charToAnimate.mapX; const charY = charToAnimate.mapY; const dx = targetX - charX; const dy = targetY - charY; const distanceToTarget = Math.sqrt(dx * dx + dy * dy); if (distanceToTarget > moveSpeed) { const angle = Math.atan2(dy, dx); charToAnimate.mapX += Math.cos(angle) * moveSpeed; charToAnimate.mapY += Math.sin(angle) * moveSpeed; drawMap(); animationFrameId = requestAnimationFrame(() => animateMovement(charToAnimate, targetX, targetY)); } else { charToAnimate.mapX = targetX; charToAnimate.mapY = targetY; drawMap(); socket.emit('character:move', { _id: charToAnimate._id, name: charToAnimate.name, mapX: charToAnimate.mapX, mapY: charToAnimate.mapY }); } }
    function loadMapBackground(url) { if (!url) { mapData.backgroundImage = null; mapData.backgroundUrl = ''; drawMap(); saveMapData(); return; } const img = new Image(); img.crossOrigin = "Anonymous"; img.onload = () => { mapData.backgroundImage = img; mapData.backgroundUrl = url; drawMap(); saveMapData(); }; img.onerror = () => { alert('Не удалось загрузить фон.'); mapData.backgroundImage = null; mapData.backgroundUrl = ''; mapBackgroundInput.value = ''; drawMap(); saveMapData(); }; img.src = url; }
    async function loadMapData() { try { const response = await fetch(`${BACKEND_URL}/api/map`); if (!response.ok) throw new Error('Failed to load map'); const data = await response.json(); mapData.gridSize = data.gridSize; gridSizeInput.value = data.gridSize; if(data.backgroundUrl) { mapBackgroundInput.value = data.backgroundUrl; loadMapBackground(data.backgroundUrl); } } catch (error) { console.error(error); } }
    async function saveMapData() { try { await fetch(`${BACKEND_URL}/api/map`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gridSize: mapData.gridSize, backgroundUrl: mapData.backgroundUrl }) }); } catch (error) { console.error('Failed to save map data:', error); } }
    function renderCombatTracker() { if (!currentCombatState || !currentCombatState.isActive) { combatTrackerPanel.style.display = 'none'; return; } combatTrackerPanel.style.display = 'block'; initiativeTracker.innerHTML = ''; currentCombatState.combatants.forEach((c, index) => { const li = document.createElement('li'); if (index === currentCombatState.turn) { li.classList.add('current-turn'); } const removeBtn = document.createElement('button'); removeBtn.className = 'remove-combatant-btn'; removeBtn.innerHTML = '&times;'; removeBtn.addEventListener('click', () => { socket.emit('combat:remove_combatant', c._id); }); li.appendChild(removeBtn); const nameSpan = document.createElement('span'); nameSpan.className = 'combatant-name'; nameSpan.textContent = c.name; li.appendChild(nameSpan); if (c.initiative === null) { const input = document.createElement('input'); input.type = 'number'; input.className = 'initiative-input'; input.dataset.id = c._id; input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const initiative = parseInt(e.target.value, 10); if (!isNaN(initiative)) { socket.emit('combat:set_initiative', { combatantId: c._id, initiative }); } } }); li.appendChild(input); } else { const valueSpan = document.createElement('span'); valueSpan.className = 'initiative-value'; valueSpan.textContent = c.initiative; li.appendChild(valueSpan); } initiativeTracker.appendChild(li); }); }
    
    function setupMainEventListeners() {
        loadCharacterBtn.addEventListener('click', () => loadCharacter(characterSelector.value));
        newCharacterBtn.addEventListener('click', createNewCharacter);
        deleteCharacterBtn.addEventListener('click', deleteCharacter);
        eventLogSendBtn.addEventListener('click', sendLogMessage);
        eventLogInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { sendLogMessage(); } });
        loadMapBackgroundBtn.addEventListener('click', () => loadMapBackground(mapBackgroundInput.value.trim()));
        gridSizeInput.addEventListener('change', () => { mapData.gridSize = parseInt(gridSizeInput.value) || 50; drawMap(); saveMapData(); });
        startCombatBtn.addEventListener('click', () => socket.emit('combat:start'));
        endCombatBtn.addEventListener('click', () => socket.emit('combat:end'));
        nextTurnBtn.addEventListener('click', () => socket.emit('combat:next_turn'));
        addNpcBtn.addEventListener('click', () => { const name = npcNameInput.value.trim(); const initiative = parseInt(npcInitiativeInput.value, 10); if (name) { socket.emit('combat:add_npc', { name, initiative: isNaN(initiative) ? null : initiative }); npcNameInput.value = ''; npcInitiativeInput.value = ''; } });
        document.querySelectorAll('#app input, #app select, #app textarea').forEach(element => { element.addEventListener('change', saveCharacterData); });
        equipmentListDiv.addEventListener('change', (event) => { if (event.target.matches('input, textarea')) { const idx = parseInt(event.target.dataset.index); const field = event.target.dataset.field; currentCharacterData.equipment[idx][field] = field === 'quantity' ? parseInt(event.target.value) : event.target.value; saveCharacterData(); } });
        spellsListDiv.addEventListener('change', (event) => { if (event.target.matches('input, textarea, select')) { const idx = parseInt(event.target.dataset.index); const field = event.target.dataset.field; currentCharacterData.spells[idx][field] = event.target.value; saveCharacterData(); } });
        addEquipmentBtn.addEventListener('click', () => { if (!currentCharacterData.equipment) currentCharacterData.equipment = []; currentCharacterData.equipment.push({ name: '', quantity: 1, description: '' }); renderEquipment(); saveCharacterData(); });
        addSpellBtn.addEventListener('click', () => { if (!currentCharacterData.spells) currentCharacterData.spells = []; currentCharacterData.spells.push({ name: '', level: 'Заговор', description: '' }); renderSpells(); saveCharacterData(); });
        battleMapCanvas.addEventListener('mousemove', (e) => { const rect = battleMapCanvas.getBoundingClientRect(); const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top; const cellX = Math.floor(mouseX / mapData.gridSize) * mapData.gridSize; const cellY = Math.floor(mouseY / mapData.gridSize) * mapData.gridSize; if (!hoveredCell || hoveredCell.x !== cellX || hoveredCell.y !== cellY) { hoveredCell = { x: cellX, y: cellY }; drawMap(); } });
        battleMapCanvas.addEventListener('mouseleave', () => { hoveredCell = null; drawMap(); });
        battleMapCanvas.addEventListener('click', (e) => { const rect = battleMapCanvas.getBoundingClientRect(); const clickX = e.clientX - rect.left; const clickY = e.clientY - rect.top; const clickedChar = mapData.characters.find(char => { const distance = Math.sqrt(Math.pow(clickX - char.mapX, 2) + Math.pow(clickY - char.mapY, 2)); return distance <= mapData.gridSize / 3; }); if (clickedChar && clickedChar._id === activeCharacterId) { selectedCharacterForMove = selectedCharacterForMove === clickedChar._id ? null : clickedChar._id; drawMap(); } else if (selectedCharacterForMove) { const charToMove = mapData.characters.find(c => c._id === selectedCharacterForMove); if (charToMove) { if (animationFrameId) cancelAnimationFrame(animationFrameId); const targetX = hoveredCell.x + mapData.gridSize / 2; const targetY = hoveredCell.y + mapData.gridSize / 2; animateMovement(charToMove, targetX, targetY); } selectedCharacterForMove = null; } });
    }

    setupAuthEventListeners();
    checkAuthState();
});
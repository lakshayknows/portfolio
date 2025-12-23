// ==================== PORTFOLIO GAME ====================
(function() {
    'use strict';

    // Config
    const API_KEY = window.CONFIG?.API_KEY || '';
    const API_URL = window.CONFIG?.API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const MODEL = window.CONFIG?.MODEL || 'google/gemini-2.0-flash-001';

    // Config validation on load
    const validateConfig = () => {
        const issues = [];
        if (!window.CONFIG) {
            issues.push('❌ config.js not loaded - copy config.example.js to config.js');
        } else {
            if (!API_KEY || API_KEY === 'your-openrouter-api-key-here') {
                issues.push('❌ API_KEY is missing or still a placeholder');
            }
            if (!API_URL) {
                issues.push('❌ API_URL is missing');
            }
        }
        if (issues.length > 0) {
            console.warn('🔧 LLM Chat Config Issues:\n' + issues.join('\n'));
            console.info('💡 Get your API key from: https://openrouter.ai/keys');
            return false;
        }
        console.log('✅ LLM Chat config loaded successfully');
        return true;
    };
    
    // Run validation after DOM loads
    document.addEventListener('DOMContentLoaded', validateConfig);

    // Skill coins at ground level
    const SKILL_COINS = [
        { id: 'python', icon: '🐍', name: 'Python', desc: 'Primary ML/AI language', xp: 200, x: 150 },
        { id: 'ml', icon: '🧠', name: 'Machine Learning', desc: 'TensorFlow, XGBoost', xp: 300, x: 350 },
        { id: 'data', icon: '📊', name: 'Data Engineering', desc: '6.2M+ records', xp: 250, x: 550 },
        { id: 'deploy', icon: '🚀', name: 'Deployment', desc: 'Streamlit, APIs', xp: 250, x: 750 },
    ];

    // Player state
    const player = { x: 50, level: 1, xp: 0, coins: 0, collectedCoins: new Set() };

    // Game state
    let gameStarted = false;
    let isModernMode = false;
    let coinElements = [];


    // DOM helper
    const $ = id => document.getElementById(id);

    // Audio
    let synth, coinSynth;
    const initAudio = async () => {
        if (synth) return;
        await Tone.start();
        synth = new Tone.Synth().toDestination();
        coinSynth = new Tone.PolySynth(Tone.Synth).toDestination();
        coinSynth.volume.value = -10;
    };
    const playSound = (type) => {
        if (!synth) initAudio();
        const now = Tone.now();
        switch (type) {
            case 'coin': coinSynth.triggerAttackRelease(["C5", "E5"], "8n", now); break;
            case 'jump': synth.triggerAttackRelease("C4", "8n", now); break;
            case 'level': coinSynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "4n", now); break;
        }
    };

    // Data
    const REGIONS = [
        { id: 'forest', name: 'Random Forest', icon: '🌲', desc: 'Ensemble learning methods', locked: false },
        { id: 'neural', name: 'Neural Network', icon: '🧠', desc: 'Deep learning architectures', locked: true },
        { id: 'data', name: 'Data Lake', icon: '🌊', desc: 'Big data storage', locked: true },
        { id: 'cloud', name: 'Cloud City', icon: '☁️', desc: 'Scalable deployment', locked: true }
    ];
    
    const ACHIEVEMENTS = [
        { id: 'novice', name: 'Novice Explorer', desc: 'Started the journey', icon: '🎒', unlocked: true },
        { id: 'collector', name: 'Coin Collector', desc: 'Collected all coins', icon: '💎', unlocked: false },
        { id: 'master', name: 'AI Master', desc: 'Reached max level', icon: '👑', unlocked: false }
    ];

    // Init
    document.addEventListener('DOMContentLoaded', () => {
        $('pressStartBtn')?.addEventListener('click', () => { initAudio(); startGame(); });
        $('chatInput')?.addEventListener('keypress', e => e.key === 'Enter' && sendMessage());
        $('modernChatInput')?.addEventListener('keypress', e => e.key === 'Enter' && sendModernMessage());
        document.addEventListener('keydown', handleKeyboard);
        
        // Populate Modals
        renderRegions();
        renderAchievements();
    });

    function renderRegions() {
        const grid = $('regionsGrid');
        if (!grid) return;
        grid.innerHTML = REGIONS.map(r => `
            <div class="region ${r.locked ? 'locked' : 'unlocked'}">
                <div class="region-header">
                    <span class="region-icon">${r.icon}</span>
                    <span class="region-title">${r.name}</span>
                    ${r.locked ? '<span class="region-lock">🔒</span>' : ''}
                </div>
                <div class="region-description">${r.desc}</div>
            </div>
        `).join('');
    }

    function renderAchievements() {
        const grid = $('achievementsList');
        if (!grid) return;
        grid.innerHTML = ACHIEVEMENTS.map(a => `
            <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}">
                <div class="ach-icon">${a.icon}</div>
                <div class="ach-info">
                    <div class="ach-name">${a.name}</div>
                    <div class="ach-desc">${a.desc}</div>
                </div>
            </div>
        `).join('');
    }

    function startGame() {
        if (gameStarted) return;
        gameStarted = true;
        $('pressStartOverlay')?.classList.add('hidden');
        spawnCoins();
        updateCharacterPosition();
        updateUI();
        setTimeout(() => appendChatMessage('bot', "🎮 Use arrow keys to move! Walk into coins to collect. Reach the portal!"), 1000);
    }

    // Spawn coins at ground level
    function spawnCoins() {
        const gameWorld = $('gameWorld');
        if (!gameWorld) return;
        document.querySelectorAll('.game-coin').forEach(c => c.remove());
        coinElements = [];
        
        SKILL_COINS.forEach(coin => {
            if (player.collectedCoins.has(coin.id)) return;
            const el = document.createElement('div');
            el.className = 'game-coin';
            el.dataset.id = coin.id;
            el.innerHTML = `<span class="coin-icon">${coin.icon}</span>`;
            el.style.left = `${coin.x}px`;
            el.style.bottom = '100px';
            gameWorld.appendChild(el);
            coinElements.push({ el, data: coin });
        });
    }

    // Keyboard movement
    function handleKeyboard(e) {
        if (!gameStarted || isModernMode) return;
        const step = 25;
        let moved = false;
        
        switch(e.key.toLowerCase()) {
            case 'arrowleft': case 'a':
                player.x = Math.max(0, player.x - step);
                moved = true;
                break;
            case 'arrowright': case 'd':
                player.x = Math.min(900, player.x + step);
                moved = true;
                break;
        }
        
        if (moved) {
            e.preventDefault();
            updateCharacterPosition();
            checkCollisions();
        }
    }

    // Mobile touch controls
    let mobileInterval = null;
    window.startMobileMove = function(direction) {
        if (!gameStarted || isModernMode) return;
        stopMobileMove(); // Clear any existing interval
        
        const move = () => {
            const step = 20;
            if (direction === 'left') {
                player.x = Math.max(0, player.x - step);
            } else {
                player.x = Math.min(900, player.x + step);
            }
            updateCharacterPosition();
            checkCollisions();
        };
        
        move(); // Move immediately
        mobileInterval = setInterval(move, 100); // Continue moving while held
    };
    
    window.stopMobileMove = function() {
        if (mobileInterval) {
            clearInterval(mobileInterval);
            mobileInterval = null;
        }
    };

    function updateCharacterPosition() {
        const char = $('character');
        if (char) char.style.left = `${player.x}px`;
    }

    // Collision detection - with debounce to prevent glitchy collection
    let lastCollectTime = 0;
    function checkCollisions() {
        const now = Date.now();
        if (now - lastCollectTime < 300) return; // Debounce
        
        for (let i = coinElements.length - 1; i >= 0; i--) {
            const coin = coinElements[i];
            if (player.collectedCoins.has(coin.data.id)) continue;
            if (Math.abs(player.x - coin.data.x) < 50) {
                lastCollectTime = now;
                collectCoin(coin, i);
                break; // Only collect one coin at a time
            }
        }
    }

    function collectCoin(coin, index) {
        player.collectedCoins.add(coin.data.id);
        player.xp += coin.data.xp;
        player.coins++;
        playSound('coin');
        coin.el.classList.add('collected');
        showSkillPopup(coin.data);
        setTimeout(() => coin.el.remove(), 400);
        coinElements.splice(index, 1);
        updateUI();
        updateInventory(coin.data.id);
        
        // Check if all 4 coins collected
        if (player.coins >= 4) {
            playSound('level');
            setTimeout(() => showPortalPrompt(), 500);
        }
    }
    
    function updateInventory(skillId) {
        const items = document.querySelectorAll('.inv-item');
        const skillMap = { 'python': 0, 'ml': 1, 'data': 2, 'deploy': 3 };
        const idx = skillMap[skillId];
        if (idx !== undefined && items[idx]) {
            items[idx].classList.remove('locked');
            items[idx].classList.add('unlocked');
        }
    }
    
    function showPortalPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'portal-prompt glass-panel';
        prompt.id = 'portalPrompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <div class="prompt-icon">🌀</div>
                <div class="prompt-title">All Skills Collected!</div>
                <div class="prompt-text">Ready to enter the Modern Portfolio?</div>
                <div class="prompt-buttons">
                    <button class="prompt-btn primary" onclick="confirmEnterPortal()">Enter New World</button>
                    <button class="prompt-btn secondary" onclick="dismissPrompt()">Keep Exploring</button>
                </div>
            </div>
        `;
        document.body.appendChild(prompt);
    }

    function showSkillPopup(skill) {
        const popup = document.createElement('div');
        popup.className = 'skill-popup glass-panel';
        popup.innerHTML = `<div class="popup-icon">${skill.icon}</div><div class="popup-name">${skill.name}</div><div class="popup-desc">${skill.desc}</div>`;
        document.body.appendChild(popup);
        setTimeout(() => { popup.classList.add('fade-out'); setTimeout(() => popup.remove(), 300); }, 2000);
    }

    function showNotification(title, desc) {
        const notif = $('levelUpNotification');
        if (notif) {
            const titleEl = $('leveledUpTo');
            const descEl = notif.querySelector('.notif-desc');
            if (titleEl) titleEl.textContent = title;
            if (descEl) descEl.textContent = desc;
            notif.style.display = 'block';
            setTimeout(() => notif.style.display = 'none', 3000);
        }
    }

    // Portal
    function enterPortal() {
        if (isModernMode) return;
        
        // Cleanup prompt if it exists (fixes leak)
        const prompt = $('portalPrompt');
        if (prompt) prompt.remove();

        if (player.coins < 4) {
            showNotification('🔒 Locked', 'Collect all 4 skill coins first!');
            return;
        }
        isModernMode = true;
        
        const container = $('transitionContainer');
        container?.classList.add('active');
        
        setTimeout(() => {
            $('gameContainer')?.classList.add('hidden');
            $('crtOverlay')?.classList.add('hidden');
            $('modernPortfolio')?.classList.add('active');
            document.body.classList.add('modern-mode');
            container?.classList.remove('active');
            window.scrollTo(0, 0); // Scroll to top of page
        }, 2000);
    }
    
    window.confirmEnterPortal = () => {
        const prompt = $('portalPrompt');
        if (prompt) prompt.remove();
        enterPortal();
    };
    
    window.dismissPrompt = () => {
        const prompt = $('portalPrompt');
        if (prompt) prompt.remove();
        showNotification('🎮 Keep Playing!', 'Enter portal when ready');
    };

    // UI Updates
    function updateUI() {
        const coinsEl = $('coinsCollected');
        const totalCoinsEl = $('totalCoinsCollected');
        const levelEl = $('level');
        const xpNextEl = $('xpToNextLevel');
        const xpFillEl = $('xpFill');
        
        if (coinsEl) coinsEl.textContent = player.xp;
        if (totalCoinsEl) totalCoinsEl.textContent = player.coins;
        if (levelEl) levelEl.textContent = player.level;
        
        const nextXp = player.level * 500;
        if (xpNextEl) xpNextEl.textContent = nextXp;
        const progress = (player.xp / nextXp) * 100;
        if (xpFillEl) xpFillEl.style.width = `${Math.min(100, progress)}%`;
        
        const portal = $('gamePortal');
        if (portal) portal.classList.toggle('active', player.coins >= 4);
    }

    // Chat - calls LangChain RAG backend (deployed on Render)
    const RAG_API_URL = window.CONFIG?.RAG_API_URL || 'https://portfolio-k64e.onrender.com/api/chat';
    
    async function callLLM(message) {
        try {
            console.log('🚀 Sending message to LangChain RAG backend...');
            const res = await fetch(RAG_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            
            console.log(`📡 API Response Status: ${res.status}`);
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('❌ RAG API Error:', errorData);
                return errorData.error || "⚠️ Something went wrong. Please try again.";
            }
            
            const data = await res.json();
            console.log('✅ RAG Response received');
            return data.response || "⚠️ Unexpected response. Please try again.";
            
        } catch (e) { 
            console.error('❌ LLM Chat Error:', e.message);
            if (e.message.includes('Failed to fetch')) {
                return "⚠️ Backend not running. Start with: cd server && npm start";
            }
            return "⚠️ Connection issue. Please try again.";
        }
    }


    async function sendMessage() {
        const input = $('chatInput');
        const msg = input?.value.trim();
        if (!msg) return;
        appendChatMessage('user', msg);
        input.value = '';
        input.disabled = true;
        appendChatMessage('bot', '💭 Thinking...');
        const response = await callLLM(msg);
        // Remove "Thinking..." message
        const container = $('chatbotMessages');
        if (container?.lastChild) container.lastChild.remove();
        appendChatMessage('bot', response);
        input.disabled = false;
        input.focus();
    }

    async function sendModernMessage() {
        const input = $('modernChatInput');
        const msg = input?.value.trim();
        if (!msg) return;
        appendModernMessage('user', msg);
        input.value = '';
        input.disabled = true;
        appendModernMessage('bot', '💭 Thinking...');
        const response = await callLLM(msg);
        // Remove "Thinking..." message
        const container = $('modernChatMessages');
        if (container?.lastChild) container.lastChild.remove();
        appendModernMessage('bot', response);
        input.disabled = false;
        input.focus();
    }

    function appendChatMessage(sender, text) {
        const container = $('chatbotMessages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        div.innerHTML = sender === 'bot' 
            ? `<div class="msg-avatar">🤖</div><div class="msg-content"><p>${text}</p></div>`
            : `<div class="msg-content"><p>${text}</p></div><div class="msg-avatar">👤</div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    function appendModernMessage(sender, text) {
        const container = $('modernChatMessages');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `modern-message ${sender}`;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    // Global functions
    window.startGame = startGame;
    window.openWorldMap = () => { const m = $('worldMapModal'); if (m) m.style.display = 'flex'; };
    window.closeWorldMap = () => { const m = $('worldMapModal'); if (m) m.style.display = 'none'; };
    window.toggleChatbot = () => { 
        const chat = $('chatbot');
        chat?.classList.toggle('minimized');
        const icon = $('chatbotToggleIcon');
        if (icon) icon.textContent = chat?.classList.contains('minimized') ? '+' : '−';
    };
    window.sendMessage = sendMessage;
    window.sendModernMessage = sendModernMessage;
    window.askQuestion = q => { const input = $('chatInput'); if (input) { input.value = q; sendMessage(); } };
    window.openAchievements = () => { const m = $('achievementsModal'); if (m) m.style.display = 'flex'; };
    window.closeAchievementsModal = () => { const m = $('achievementsModal'); if (m) m.style.display = 'none'; };
    window.enterPortal = enterPortal;
    window.returnToGame = () => {
        $('modernPortfolio')?.classList.remove('active');
        $('gameContainer')?.classList.remove('hidden');
        $('crtOverlay')?.classList.remove('hidden');
        document.body.classList.remove('modern-mode');
        isModernMode = false;
    };
    window.toggleModernChat = () => { $('modernChatWindow')?.classList.toggle('active'); };
    window.toggleHowToPlay = () => { $('howToPlayMenu')?.classList.toggle('visible'); };
})();

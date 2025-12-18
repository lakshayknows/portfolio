// ==================== PORTFOLIO GAME ====================
(function() {
    'use strict';

    // Config
    const API_KEY = window.CONFIG?.API_KEY || '';
    const API_URL = window.CONFIG?.API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    const MODEL = window.CONFIG?.MODEL || 'google/gemini-2.0-flash-001';

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

    // AI Context
    const AI_CONTEXT = `Lakshay's AI assistant. AI Engineer, Delhi. 99.95% fraud detection on 6.2M records. Skills: Python, TensorFlow, XGBoost, NLP, Rust. Be concise.`;

    // DOM helper
    const $ = id => document.getElementById(id);

    // Init
    document.addEventListener('DOMContentLoaded', () => {
        $('pressStartBtn')?.addEventListener('click', startGame);
        $('chatInput')?.addEventListener('keypress', e => e.key === 'Enter' && sendMessage());
        $('modernChatInput')?.addEventListener('keypress', e => e.key === 'Enter' && sendModernMessage());
        document.addEventListener('keydown', handleKeyboard);
    });

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
        coin.el.classList.add('collected');
        showSkillPopup(coin.data);
        setTimeout(() => coin.el.remove(), 400);
        coinElements.splice(index, 1);
        updateUI();
        updateInventory(coin.data.id);
        
        // Check if all 4 coins collected
        if (player.coins >= 4) {
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
        if (portal) portal.classList.toggle('active', player.coins >= 3);
    }

    // Chat
    async function callLLM(message) {
        if (!API_KEY) return getFallback(message);
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: MODEL, messages: [{ role: 'system', content: AI_CONTEXT }, { role: 'user', content: message }], max_tokens: 200 })
            });
            const data = await res.json();
            return data.choices?.[0]?.message?.content || getFallback(message);
        } catch (e) { return getFallback(message); }
    }

    function getFallback(msg) {
        const m = msg.toLowerCase();
        if (m.includes('project')) return "Key projects: Fraud Detection (99.95% accuracy), SMS Spam Classifier (97%), Sentiment Analysis (74K+ tweets).";
        if (m.includes('skill')) return "Skills: Python, TensorFlow, Scikit-Learn, XGBoost, NLP, Pandas, SQL, Rust.";
        return "I'm Lakshay's AI. Ask about projects, skills, or experience!";
    }

    async function sendMessage() {
        const input = $('chatInput');
        const msg = input?.value.trim();
        if (!msg) return;
        appendChatMessage('user', msg);
        input.value = '';
        const response = await callLLM(msg);
        appendChatMessage('bot', response);
    }

    async function sendModernMessage() {
        const input = $('modernChatInput');
        const msg = input?.value.trim();
        if (!msg) return;
        appendModernMessage('user', msg);
        input.value = '';
        const response = await callLLM(msg);
        appendModernMessage('bot', response);
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

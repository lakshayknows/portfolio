// Enhanced Portfolio Game Script
let gameState = {
    character: null,
    coins: [],
    coinsCollected: 0,
    level: 1,
    xpToNextLevel: 2000,
    totalCoinsCollected: 0,
    viewedRegions: 0,
    isMoving: false,
    powerUps: [],
    achievements: [],
    soundEnabled: true,
    musicEnabled: true,
    dayNightCycle: 'day',
    particleSystem: null,
    gameStarted: false,
    comboMultiplier: 1,
    lastCoinTime: 0,
    streakCount: 0
};

// Enhanced Sound System
class SoundManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.audioContext = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Initialize Tone.js
            await Tone.start();
            this.audioContext = Tone.context;
            this.initialized = true;
            
            // Create sound effects
            this.createSounds();
            this.createMusic();
        } catch (error) {
            console.log('Audio initialization failed:', error);
        }
    }

    createSounds() {
        // Coin collect sound
        this.sounds.coinCollect = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
        }).toDestination();

        // Level up sound
        this.sounds.levelUp = new Tone.Synth({
            oscillator: { type: "sawtooth" },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.3, release: 0.5 }
        }).toDestination();

        // Achievement sound
        this.sounds.achievement = new Tone.Synth({
            oscillator: { type: "square" },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.1, release: 0.3 }
        }).toDestination();

        // Power-up sound
        this.sounds.powerUp = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.3 }
        }).toDestination();
    }

    createMusic() {
        // Background music loop
        this.music = new Tone.Loop((time) => {
            if (!gameState.musicEnabled) return;
            
            const melody = ["C4", "E4", "G4", "C5", "G4", "E4"];
            const note = melody[Math.floor(Math.random() * melody.length)];
            
            const synth = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.1, release: 0.3 }
            }).toDestination();
            
            synth.triggerAttackRelease(note, "8n", time);
        }, "2n");
    }

    play(soundName, note = "C4") {
        if (!gameState.soundEnabled || !this.initialized) return;
        
        try {
            if (this.sounds[soundName]) {
                this.sounds[soundName].triggerAttackRelease(note, "8n");
            }
        } catch (error) {
            console.log('Sound play error:', error);
        }
    }

    startMusic() {
        if (this.music && gameState.musicEnabled && this.initialized) {
            this.music.start();
        }
    }

    stopMusic() {
        if (this.music) {
            this.music.stop();
        }
    }
}

// Enhanced Particle System
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.container = document.getElementById('particleSystem');
    }

    createParticle(x, y, type = 'default') {
        const particle = document.createElement('div');
        particle.className = `particle ${type}`;
        
        const configs = {
            default: { color: '#00ff88', size: 2, life: 3000 },
            coin: { color: '#ffd700', size: 4, life: 2000 },
            levelup: { color: '#ffff00', size: 6, life: 4000 },
            powerup: { color: '#ff00ff', size: 3, life: 2500 }
        };
        
        const config = configs[type] || configs.default;
        
        particle.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${config.size}px;
            height: ${config.size}px;
            background: ${config.color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 0 10px ${config.color};
        `;
        
        this.container.appendChild(particle);
        this.particles.push({ element: particle, life: config.life, created: Date.now() });
        
        // Animate particle
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity - 100;
        
        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
        ], {
            duration: config.life,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        setTimeout(() => this.removeParticle(particle), config.life);
    }

    removeParticle(particle) {
        if (particle && particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
        this.particles = this.particles.filter(p => p.element !== particle);
    }

    burst(x, y, count = 10, type = 'default') {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.createParticle(
                    x + (Math.random() - 0.5) * 20,
                    y + (Math.random() - 0.5) * 20,
                    type
                );
            }, i * 50);
        }
    }
}

// Enhanced Achievement System
class AchievementManager {
    constructor() {
        this.achievements = [
            {
                id: 'first_coin',
                title: 'First Steps',
                description: 'Collect your first coin',
                icon: '🪙',
                rarity: 'common',
                condition: () => gameState.totalCoinsCollected >= 1,
                reward: 100,
                unlocked: false
            },
            {
                id: 'coin_collector',
                title: 'Coin Collector',
                description: 'Collect 10 coins',
                icon: '💰',
                rarity: 'common',
                condition: () => gameState.totalCoinsCollected >= 10,
                reward: 250,
                unlocked: false
            },
            {
                id: 'level_up',
                title: 'Level Up!',
                description: 'Reach level 2',
                icon: '⬆️',
                rarity: 'rare',
                condition: () => gameState.level >= 2,
                reward: 500,
                unlocked: false
            },
            {
                id: 'explorer',
                title: 'Explorer',
                description: 'View 3 info regions',
                icon: '🗺️',
                rarity: 'rare',
                condition: () => gameState.viewedRegions >= 3,
                reward: 300,
                unlocked: false
            },
            {
                id: 'speed_demon',
                title: 'Speed Demon',
                description: 'Collect 5 coins in 10 seconds',
                icon: '⚡',
                rarity: 'epic',
                condition: () => gameState.streakCount >= 5,
                reward: 750,
                unlocked: false
            },
            {
                id: 'master_collector',
                title: 'Master Collector',
                description: 'Collect 50 coins total',
                icon: '👑',
                rarity: 'legendary',
                condition: () => gameState.totalCoinsCollected >= 50,
                reward: 1500,
                unlocked: false
            }
        ];
    }

    checkAchievements() {
        this.achievements.forEach(achievement => {
            if (!achievement.unlocked && achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    unlockAchievement(achievement) {
        achievement.unlocked = true;
        gameState.coinsCollected += achievement.reward;
        
        // Show achievement popup
        this.showAchievementPopup(achievement);
        
        // Play sound
        soundManager.play('achievement', 'E5');
        
        // Create particles
        particleSystem.burst(window.innerWidth / 2, window.innerHeight / 2, 15, 'levelup');
        
        // Update display
        updateHUD();
    }

    showAchievementPopup(achievement) {
        const popup = document.getElementById('achievementPopup');
        const description = document.getElementById('achievementPopupDescription');
        const reward = document.getElementById('achievementPopupReward');
        
        description.textContent = `${achievement.icon} ${achievement.title}: ${achievement.description}`;
        reward.textContent = `Reward: +${achievement.reward} XP`;
        
        popup.style.display = 'block';
        popup.classList.add('show');
        
        setTimeout(() => {
            popup.style.display = 'none';
            popup.classList.remove('show');
        }, 4000);
    }
}

// Enhanced Game Initialization
const soundManager = new SoundManager();
const particleSystem = new ParticleSystem();
const achievementManager = new AchievementManager();

// Enhanced Character Movement
function moveCharacterTo(targetX, targetY, callback) {
    if (gameState.isMoving) return;
    
    gameState.isMoving = true;
    const character = gameState.character;
    const currentX = parseInt(character.style.left) || 40;
    const currentY = parseInt(character.style.bottom) || 85;
    
    // Add walking animation
    character.classList.add('walking');
    
    // Calculate movement direction for sprite flipping
    if (targetX < currentX) {
        character.style.transform = 'scaleX(-1)';
    } else {
        character.style.transform = 'scaleX(1)';
    }
    
    // Smooth movement animation
    character.animate([
        { left: `${currentX}px`, bottom: `${currentY}px` },
        { left: `${targetX}px`, bottom: `${targetY}px` }
    ], {
        duration: 800,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
    }).onfinish = () => {
        character.style.left = `${targetX}px`;
        character.style.bottom = `${targetY}px`;
        character.classList.remove('walking');
        gameState.isMoving = false;
        
        if (callback) callback();
    };
}

// Enhanced Coin Collection
function collectCoin(coin) {
    const now = Date.now();
    const timeSinceLastCoin = now - gameState.lastCoinTime;
    
    // Update streak for speed achievements
    if (timeSinceLastCoin < 2000) {
        gameState.streakCount++;
    } else {
        gameState.streakCount = 1;
    }
    gameState.lastCoinTime = now;
    
    // Calculate combo multiplier
    if (timeSinceLastCoin < 1000) {
        gameState.comboMultiplier = Math.min(gameState.comboMultiplier + 0.5, 3);
    } else {
        gameState.comboMultiplier = 1;
    }
    
    const baseXP = 100;
    const earnedXP = Math.floor(baseXP * gameState.comboMultiplier);
    
    gameState.coinsCollected += earnedXP;
    gameState.totalCoinsCollected++;
    
    // Enhanced visual feedback
    coin.classList.add('collected');
    
    // Create floating text
    createFloatingText(coin.offsetLeft, coin.offsetTop, `+${earnedXP} XP`);
    
    // Create particles
    particleSystem.burst(coin.offsetLeft + 15, coin.offsetTop + 15, 8, 'coin');
    
    // Play sound with pitch variation
    const pitches = ['C4', 'D4', 'E4', 'F4', 'G4'];
    const pitch = pitches[Math.min(gameState.streakCount - 1, pitches.length - 1)];
    soundManager.play('coinCollect', pitch);
    
    // Remove coin after animation
    setTimeout(() => {
        if (coin.parentNode) {
            coin.parentNode.removeChild(coin);
        }
        gameState.coins = gameState.coins.filter(c => c !== coin);
    }, 1000);
    
    // Check for level up
    checkLevelUp();
    
    // Check achievements
    achievementManager.checkAchievements();
    
    // Update HUD
    updateHUD();
    
    // Spawn new coin
    setTimeout(() => spawnCoin(), 2000 + Math.random() * 3000);
}

// Enhanced Level Up System
function checkLevelUp() {
    const xpNeeded = gameState.level * 2000;
    if (gameState.coinsCollected >= xpNeeded) {
        levelUp();
    }
}

function levelUp() {
    gameState.level++;
    gameState.xpToNextLevel = gameState.level * 2000;
    
    // Enhanced level up effects
    const character = gameState.character;
    character.classList.add('level-up');
    
    // Show notification
    showLevelUpNotification();
    
    // Play sound
    soundManager.play('levelUp', 'C5');
    
    // Create massive particle burst
    particleSystem.burst(
        character.offsetLeft + 32,
        character.offsetTop + 48,
        25,
        'levelup'
    );
    
    // Screen flash effect
    createScreenFlash();
    
    // Remove level up class after animation
    setTimeout(() => {
        character.classList.remove('level-up');
    }, 2000);
    
    // Spawn power-up
    if (gameState.level % 3 === 0) {
        spawnPowerUp();
    }
}

// Enhanced Visual Effects
function createFloatingText(x, y, text) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = text;
    floatingText.style.left = `${x}px`;
    floatingText.style.top = `${y}px`;
    
    document.body.appendChild(floatingText);
    
    setTimeout(() => {
        if (floatingText.parentNode) {
            floatingText.parentNode.removeChild(floatingText);
        }
    }, 2000);
}

function createScreenFlash() {
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        z-index: 9999;
        pointer-events: none;
    `;
    
    document.body.appendChild(flash);
    
    flash.animate([
        { opacity: 0 },
        { opacity: 1 },
        { opacity: 0 }
    ], {
        duration: 500,
        easing: 'ease-out'
    }).onfinish = () => {
        if (flash.parentNode) {
            flash.parentNode.removeChild(flash);
        }
    };
}

// Enhanced Power-up System
function spawnPowerUp() {
    const gameWorld = document.getElementById('gameWorld');
    const powerUp = document.createElement('div');
    
    const types = ['speed', 'jump', 'shield'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUp.className = `power-up ${type}`;
    powerUp.style.left = `${100 + Math.random() * (gameWorld.offsetWidth - 200)}px`;
    powerUp.style.bottom = '120px';
    
    // Add power-up icon
    const icons = { speed: '⚡', jump: '🦘', shield: '🛡️' };
    powerUp.textContent = icons[type];
    powerUp.style.display = 'flex';
    powerUp.style.alignItems = 'center';
    powerUp.style.justifyContent = 'center';
    powerUp.style.fontSize = '16px';
    
    powerUp.onclick = () => collectPowerUp(powerUp, type);
    
    gameWorld.appendChild(powerUp);
    gameState.powerUps.push(powerUp);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
        if (powerUp.parentNode) {
            powerUp.parentNode.removeChild(powerUp);
            gameState.powerUps = gameState.powerUps.filter(p => p !== powerUp);
        }
    }, 15000);
}

function collectPowerUp(powerUp, type) {
    const character = gameState.character;
    
    // Apply power-up effect
    switch (type) {
        case 'speed':
            character.classList.add('powered-up');
            setTimeout(() => character.classList.remove('powered-up'), 10000);
            break;
        case 'jump':
            character.classList.add('jumping');
            setTimeout(() => character.classList.remove('jumping'), 1000);
            break;
        case 'shield':
            character.style.filter = 'drop-shadow(0 0 15px rgba(0, 255, 255, 0.8))';
            setTimeout(() => character.style.filter = '', 15000);
            break;
    }
    
    // Visual and audio feedback
    soundManager.play('powerUp', 'A4');
    particleSystem.burst(powerUp.offsetLeft + 12, powerUp.offsetTop + 12, 12, 'powerup');
    createFloatingText(powerUp.offsetLeft, powerUp.offsetTop, `${type.toUpperCase()} UP!`);
    
    // Remove power-up
    powerUp.parentNode.removeChild(powerUp);
    gameState.powerUps = gameState.powerUps.filter(p => p !== powerUp);
}

// Enhanced Coin Spawning
function spawnCoin() {
    const gameWorld = document.getElementById('gameWorld');
    const coin = document.createElement('div');
    coin.className = 'xp-coin';
    
    // Random position
    const minX = 80;
    const maxX = gameWorld.offsetWidth - 120;
    coin.style.left = `${minX + Math.random() * (maxX - minX)}px`;
    
    // Add click handler
    coin.onclick = () => {
        const coinX = parseInt(coin.style.left);
        const coinY = 85; // Character's bottom position
        
        moveCharacterTo(coinX - 20, coinY, () => {
            collectCoin(coin);
        });
    };
    
    gameWorld.appendChild(coin);
    gameState.coins.push(coin);
}

// Enhanced HUD Updates
function updateHUD() {
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('coinsCollected').textContent = gameState.coinsCollected;
    document.getElementById('xpToNextLevel').textContent = gameState.level * 2000;
    document.getElementById('totalCoinsCollected').textContent = gameState.totalCoinsCollected;
    document.getElementById('currentLevel').textContent = gameState.level;
    document.getElementById('totalCoinsCollectedStat').textContent = gameState.totalCoinsCollected;
    
    // Update XP bar
    const xpFill = document.getElementById('xpFill');
    const xpNeeded = gameState.level * 2000;
    const previousLevelXP = (gameState.level - 1) * 2000;
    const currentLevelProgress = gameState.coinsCollected - previousLevelXP;
    const currentLevelNeeded = xpNeeded - previousLevelXP;
    const percentage = Math.min((currentLevelProgress / currentLevelNeeded) * 100, 100);
    
    xpFill.style.width = `${percentage}%`;
}

// Enhanced Day/Night Cycle
function toggleDayNightCycle() {
    const body = document.body;
    const toggle = document.getElementById('dayNightToggle');
    
    const cycles = ['day', 'sunset', 'night'];
    const currentIndex = cycles.indexOf(gameState.dayNightCycle);
    const nextIndex = (currentIndex + 1) % cycles.length;
    gameState.dayNightCycle = cycles[nextIndex];
    
    // Remove all cycle classes
    cycles.forEach(cycle => body.classList.remove(`${cycle}-mode`));
    
    // Add new cycle class
    if (gameState.dayNightCycle !== 'day') {
        body.classList.add(`${gameState.dayNightCycle}-mode`);
    }
    
    // Update toggle appearance
    toggle.className = `day-night-cycle ${gameState.dayNightCycle}`;
    
    // Create atmospheric particles
    particleSystem.burst(window.innerWidth / 2, 100, 20, 'default');
}

// Enhanced Modal Functions
function openWorldMap() {
    document.getElementById('worldMapModal').style.display = 'flex';
    loadRegions();
}

function closeWorldMap() {
    document.getElementById('worldMapModal').style.display = 'none';
}

function loadRegions() {
    const regions = [
        {
            title: "🎓 EDUCATION SECTOR",
            icon: "🎓",
            description: "B.Tech in Computer Science from VIT Vellore (2020-2024)\n• CGPA: 8.5/10\n• Specialized in Data Science & Machine Learning\n• Active in coding competitions and hackathons"
        },
        {
            title: "💼 PROFESSIONAL EXPERIENCE",
            icon: "💼", 
            description: "Data Science Intern at TechCorp (Summer 2023)\n• Developed ML models for customer segmentation\n• Improved prediction accuracy by 25%\n• Worked with Python, SQL, and cloud platforms"
        },
        {
            title: "🛠️ TECHNICAL SKILLS",
            icon: "🛠️",
            description: "Programming: Python, R, SQL, JavaScript\nML/AI: TensorFlow, PyTorch, Scikit-learn\nData: Pandas, NumPy, Matplotlib, Seaborn\nCloud: AWS, Azure, Google Cloud Platform\nTools: Git, Docker, Jupyter, VS Code"
        },
        {
            title: "🚀 MAJOR PROJECTS",
            icon: "🚀",
            description: "1. Predictive Analytics Dashboard\n2. NLP Sentiment Analysis Tool\n3. Computer Vision Image Classifier\n4. Real-time Data Pipeline\n5. Interactive Portfolio Game (This!)"
        },
        {
            title: "🏆 ACHIEVEMENTS",
            icon: "🏆",
            description: "• Winner - College Data Science Hackathon 2023\n• Published research paper on ML optimization\n• Kaggle Competition Bronze Medal\n• Dean's List for Academic Excellence\n• Open Source Contributor (500+ commits)"
        },
        {
            title: "🎯 INTERESTS",
            icon: "🎯",
            description: "• Machine Learning & AI Research\n• Data Visualization & Storytelling\n• Game Development & Interactive Media\n• Open Source Contributions\n• Tech Blogging & Knowledge Sharing"
        },
        {
            title: "📞 CONTACT INFO",
            icon: "📞",
            description: "📧 lakshay.handa@email.com\n💼 linkedin.com/in/lakshayhanda\n🐙 github.com/lakshayhanda\n🌐 lakshayhanda.dev\n📱 +91-XXXXX-XXXXX"
        }
    ];
    
    const regionsGrid = document.getElementById('regionsGrid');
    regionsGrid.innerHTML = '';
    
    regions.forEach((region, index) => {
        const regionElement = document.createElement('div');
        regionElement.className = 'region';
        regionElement.innerHTML = `
            <div class="region-icon">${region.icon}</div>
            <div class="region-title">${region.title}</div>
            <div class="region-description">${region.description}</div>
        `;
        
        regionElement.onclick = () => {
            regionElement.classList.add('viewed');
            if (!regionElement.hasAttribute('data-viewed')) {
                gameState.viewedRegions++;
                regionElement.setAttribute('data-viewed', 'true');
                document.getElementById('viewedRegions').textContent = gameState.viewedRegions;
                
                // Award XP for viewing regions
                gameState.coinsCollected += 150;
                createFloatingText(regionElement.offsetLeft, regionElement.offsetTop, '+150 XP');
                updateHUD();
                achievementManager.checkAchievements();
            }
        };
        
        regionsGrid.appendChild(regionElement);
    });
}

// Enhanced Chatbot
function toggleChatbot() {
    const chatbot = document.getElementById('chatbot');
    const icon = document.getElementById('chatbotToggleIcon');
    
    chatbot.classList.toggle('minimized');
    icon.textContent = chatbot.classList.contains('minimized') ? '▲' : '_';
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const response = generateAIResponse(message);
        addMessage(response, 'bot');
    }, 1000 + Math.random() * 2000);
}

function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateAIResponse(message) {
    const responses = {
        skills: "🛠️ Lakshay is proficient in Python, R, SQL, JavaScript, and various ML frameworks like TensorFlow and PyTorch. He's also experienced with cloud platforms!",
        projects: "🚀 Some notable projects include a Predictive Analytics Dashboard, NLP Sentiment Analysis Tool, and this very interactive portfolio game you're playing!",
        experience: "💼 Lakshay has internship experience at TechCorp where he improved ML model accuracy by 25% and worked on customer segmentation projects.",
        education: "🎓 He graduated from VIT Vellore with a B.Tech in Computer Science, maintaining an 8.5 CGPA and specializing in Data Science.",
        contact: "📞 You can reach Lakshay at lakshay.handa@email.com or connect on LinkedIn at linkedin.com/in/lakshayhanda",
        achievements: "🏆 Winner of College Data Science Hackathon 2023, published researcher, Kaggle medalist, and active open source contributor!",
        default: "🤖 That's an interesting question! Try asking about Lakshay's skills, projects, experience, education, achievements, or contact information. I'm here to help you learn more about his data science journey!"
    };
    
    const lowerMessage = message.toLowerCase();
    
    for (const [key, response] of Object.entries(responses)) {
        if (key !== 'default' && lowerMessage.includes(key)) {
            return response;
        }
    }
    
    return responses.default;
}

// Enhanced Achievement Modal
function openAchievements() {
    const modal = document.getElementById('achievementsModal');
    const achievementsList = document.getElementById('achievementsList');
    
    achievementsList.innerHTML = '';
    
    achievementManager.achievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement-badge ${achievement.rarity} ${achievement.unlocked ? '' : 'locked'}`;
        
        achievementElement.innerHTML = `
            <div class="achievement-icon ${achievement.rarity}">${achievement.icon}</div>
            <div class="achievement-details">
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-progress">
                    ${achievement.unlocked ? 'COMPLETED' : 'LOCKED'} • Reward: ${achievement.reward} XP
                </div>
            </div>
        `;
        
        achievementsList.appendChild(achievementElement);
    });
    
    modal.style.display = 'flex';
}

function closeAchievementsModal() {
    document.getElementById('achievementsModal').style.display = 'none';
}

// Enhanced Sound Controls
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const button = document.getElementById('soundToggle');
    button.classList.toggle('active', gameState.soundEnabled);
    button.querySelector('.sound-icon').textContent = gameState.soundEnabled ? '🔊' : '🔇';
}

function toggleMusic() {
    gameState.musicEnabled = !gameState.musicEnabled;
    const button = document.getElementById('musicToggle');
    button.classList.toggle('active', gameState.musicEnabled);
    button.querySelector('.sound-icon').textContent = gameState.musicEnabled ? '🎵' : '🎶';
    
    if (gameState.musicEnabled) {
        soundManager.startMusic();
    } else {
        soundManager.stopMusic();
    }
}

function toggleHowToPlay() {
    const menu = document.getElementById('howToPlayMenu');
    menu.classList.toggle('visible');
}

// Enhanced Game Reset
function resetGame() {
    if (confirm('Are you sure you want to reset your progress? This cannot be undone!')) {
        // Reset game state
        gameState.coinsCollected = 0;
        gameState.totalCoinsCollected = 0;
        gameState.level = 1;
        gameState.viewedRegions = 0;
        gameState.streakCount = 0;
        gameState.comboMultiplier = 1;
        
        // Reset achievements
        achievementManager.achievements.forEach(achievement => {
            achievement.unlocked = false;
        });
        
        // Clear coins and power-ups
        gameState.coins.forEach(coin => {
            if (coin.parentNode) coin.parentNode.removeChild(coin);
        });
        gameState.powerUps.forEach(powerUp => {
            if (powerUp.parentNode) powerUp.parentNode.removeChild(powerUp);
        });
        gameState.coins = [];
        gameState.powerUps = [];
        
        // Reset character position
        const character = gameState.character;
        character.style.left = '40px';
        character.style.bottom = '85px';
        character.className = 'character sprite1';
        
        // Update display
        updateHUD();
        
        // Spawn initial coin
        setTimeout(() => spawnCoin(), 2000);
        
        // Show reset confirmation
        createFloatingText(window.innerWidth / 2, window.innerHeight / 2, 'GAME RESET!');
    }
}

// Enhanced Level Up Notification
function showLevelUpNotification() {
    const notification = document.getElementById('levelUpNotification');
    const levelSpan = document.getElementById('leveledUpTo');
    
    levelSpan.textContent = gameState.level;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Enhanced Game Initialization
async function initGame() {
    // Initialize audio
    await soundManager.init();
    
    // Get character element
    gameState.character = document.getElementById('character');
    
    // Initialize particle system
    setInterval(() => {
        if (Math.random() < 0.3) {
            particleSystem.createParticle(
                Math.random() * window.innerWidth,
                window.innerHeight + 10
            );
        }
    }, 1000);
    
    // Start background music
    soundManager.startMusic();
    
    // Spawn initial coin
    setTimeout(() => spawnCoin(), 3000);
    
    // Update HUD
    updateHUD();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'm':
            case 'M':
                toggleMusic();
                break;
            case 's':
            case 'S':
                toggleSound();
                break;
            case 'r':
            case 'R':
                if (e.ctrlKey) {
                    e.preventDefault();
                    resetGame();
                }
                break;
        }
    });
    
    // Add chat input enter key support
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    console.log('🎮 Enhanced Portfolio Game Initialized!');
    console.log('🎯 Collect coins, unlock achievements, and explore the data science journey!');
}

// Start the enhanced game
document.addEventListener('DOMContentLoaded', initGame);

// Enhanced window resize handler
window.addEventListener('resize', () => {
    // Reposition elements if needed
    const character = gameState.character;
    const gameWorld = document.getElementById('gameWorld');
    
    if (character && gameWorld) {
        const maxX = gameWorld.offsetWidth - 80;
        const currentX = parseInt(character.style.left) || 40;
        
        if (currentX > maxX) {
            character.style.left = `${maxX}px`;
        }
    }
});
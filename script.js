
// Enhanced Game with Character Movement and Custom Audio
(async () => {
    // --- Global Constants & Game State Variables ---
    const player = {
        level: 1,
        xp: 0,
        viewedRegions: new Set(),
        totalCoinsCollected: 0,
        position: { x: 60, y: 95 }, // Character position
        selectedSprite: 'sprite1',
        isJumping: false,
        jumpVelocity: 0,
        platformsJumped: 0,
        powerUps: {
            speed: false,
            jump: false,
            shield: false
        },
        inventory: []
    };

    const gameSettings = {
        maxCoins: 4,
        coinSpawnInterval: 4000,
        xpPerCoin: 300,
        characterSpeed: 0.5, // seconds to move to coin (faster for Mario-like movement)
        xpLevels: {
            1: 0,
            2: 2000,
            3: 5000,
            4: 9000,
            5: 14000,
            6: 20000,
        },
        soundEnabled: true,
        musicEnabled: true,
        gravity: 0.5,      // Gravity force for jumping
        jumpPower: 12,     // Initial jump velocity
        platformSpeed: 1.5, // Speed of moving platforms
        maxPlatforms: 3,   // Maximum number of platforms
        maxObstacles: 2,   // Maximum number of obstacles
        maxPowerUps: 1     // Maximum number of power-ups
    };

    const xpCoins = [];
    let coinSpawnTimer;
    let isMoving = false;
    let targetCoin = null;
    let walkAnimationFrame = 1;
    let walkAnimationInterval;

    // --- DOM Elements ---
    const levelDisplay = document.getElementById('level');
    const coinsCollectedDisplay = document.getElementById('coinsCollected');
    const xpToNextLevelDisplay = document.getElementById('xpToNextLevel');
    const xpFill = document.getElementById('xpFill');
    const characterElement = document.getElementById('character');
    const gameWorld = document.getElementById('gameWorld');
    const worldMapModal = document.getElementById('worldMapModal');
    const regionsGrid = document.getElementById('regionsGrid');
    const viewedRegionsStat = document.getElementById('viewedRegions');
    const currentLevelStat = document.getElementById('currentLevel');
    const totalRegionsStat = document.getElementById('totalRegions');
    const totalCoinsCollectedDisplay = document.getElementById('totalCoinsCollected');
    const totalCoinsCollectedStat = document.getElementById('totalCoinsCollectedStat');
    const chatbot = document.getElementById('chatbot');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatInput = document.getElementById('chatInput');
    const chatbotToggleIcon = document.getElementById('chatbotToggleIcon');
    const levelUpNotification = document.getElementById('levelUpNotification');
    const leveledUpToDisplay = document.getElementById('leveledUpTo');
    const soundToggle = document.getElementById('soundToggle');
    const musicToggle = document.getElementById('musicToggle');

    // --- Enhanced Region Data ---
    const regionsData = {
        profile: {
            icon: '👤',
            title: 'PROFILE HUB',
            description: `
                <strong style="color: #ffff00;">LAKSHAY HANDA</strong><br>
                📞 PHONE: 9818575939<br>
                📍 LOCATION: DELHI, INDIA<br>
                🔬 DATA SCIENTIST & AI SPECIALIST<br>
                📊 STRONG MATHEMATICAL FOUNDATION<br><br>
                🔗 CONNECT: <a href="https://www.linkedin.com/in/lakshayhanda" target="_blank" style="color:#00bfff;">LINKEDIN</a> | <a href="https://github.com/lakshayknows" target="_blank" style="color:#00bfff;">GITHUB</a> | <a href="mailto:connect.lakshay@outlook.com" style="color:#00bfff;">EMAIL</a>
            `,
        },
        education: {
            icon: '🎓',
            title: 'EDUCATION REALM',
            description: `
                <strong style="color: #ffff00;">UNIVERSITY OF DELHI</strong><br>
                📚 BACHELOR OF COMMERCE (HONS)<br>
                📅 2023-2026/27<br><br>
                <strong style="color: #00bfff;">CORE SUBJECTS:</strong><br>
                • BUSINESS STATISTICS & ANALYTICS<br>
                • ADVANCED MATHEMATICS<br>
                • FINANCIAL MODELING<br>
                • DATA SCIENCE APPLICATIONS<br>
                • MACHINE LEARNING FOUNDATIONS
            `
        },
        skills: {
            icon: '⚔️',
            title: 'SKILL ARSENAL',
            description: `
                <strong style="color: #ffff00;">FRAMEWORKS:</strong><br>
                🐍 NUMPY • PANDAS • SCIKIT-LEARN<br>
                🧠 TENSORFLOW • PLOTLY • STREAMLIT<br><br>
                <strong style="color: #00bfff;">SPECIALIZATIONS:</strong><br>
                🤖 MACHINE LEARNING • NLP • DEEP LEARNING<br>
                📊 DATA VISUALIZATION • PREDICTIVE MODELING<br><br>
                <strong style="color: #ff6600;">TOOLS:</strong><br>
                💻 PYTHON • C++ • JUPYTER • VS CODE<br>
                🔧 GIT • MYSQL • MONGODB • GOOGLE COLAB
            `
        },
        experience: {
            icon: '💼',
            title: 'EXPERIENCE ZONE',
            description: `
                <strong style="color: #ffff00;">DATA SCIENCE INTERN - PRODIGY INFOTECH</strong><br>
                📅 NOV 2024 - DEC 2024<br>
                • 📈 PREDICTIVE ANALYTICS FOR BUSINESS INSIGHTS<br>
                • 🔍 ADVANCED EDA & DATA PREPROCESSING<br>
                • 🎯 ML MODEL DEPLOYMENT (92% ACCURACY)<br>
                • 💬 SENTIMENT ANALYSIS (74K+ RESPONSES)<br><br>
                <strong style="color: #00bfff;">OPEN SOURCE CONTRIBUTOR - ASKAGE</strong><br>
                • 🤖 AI-POWERED TERMINAL CHATBOT DEVELOPMENT<br>
                • 🔐 AUTHENTICATION & API INTEGRATION<br>
                • ✨ USER EXPERIENCE OPTIMIZATION<br><br>
                <strong style="color: #ff6600;">EVENT COORDINATOR - FRENCH EMBASSY</strong><br>
                🇫🇷 CHOOSE FRANCE TOUR 2023<br>
                • 🎪 LARGE-SCALE EVENT MANAGEMENT<br>
                • 🤝 STAKEHOLDER ENGAGEMENT (1000+ ATTENDEES)<br>
                • 📊 PROCESS OPTIMIZATION (+25% SATISFACTION)
            `
        },
        projects_spam: {
            icon: '📧',
            title: 'PROJECT: SMS SPAM CLASSIFIER',
            description: `
                <strong style="color: #ffff00;">ADVANCED NLP PROJECT</strong><br><br>
                📊 PROCESSED 5,572 SMS MESSAGES<br>
                🔤 TF-IDF VECTORIZATION IMPLEMENTATION<br>
                🎯 97% ACCURACY ACHIEVED<br>
                💯 100% PRECISION USING VOTING CLASSIFIER<br>
                🌳 EXTRATREES + MULTINOMIALNB + RANDOM FOREST<br>
                🚀 DEPLOYED VIA STREAMLIT FOR REAL-TIME DETECTION<br><br>
                <strong style="color: #00ff88;">TECH STACK:</strong> Python, Scikit-Learn, Streamlit
            `
        },
        projects_fraud: {
            icon: '💰',
            title: 'PROJECT: FRAUD DETECTION MODEL',
            description: `
                <strong style="color: #ffff00;">FINANCIAL SECURITY AI</strong><br><br>
                📊 ANALYZED 6.2M+ TRANSACTION DATASET<br>
                🛡️ MACHINE LEARNING FRAUD DETECTION<br>
                🎯 99.95% ACCURACY ACHIEVED<br>
                🔧 LOGISTIC REGRESSION + DECISION TREE + XGBOOST<br>
                ⚖️ PRECISION, RECALL & F1-SCORE OPTIMIZATION<br>
                🚀 STREAMLIT DEPLOYMENT FOR REAL-TIME DETECTION<br><br>
                <strong style="color: #00ff88;">TECH STACK:</strong> Python, XGBoost, Streamlit
            `
        },
        achievements: {
            icon: '🏆',
            title: 'ACHIEVEMENTS HALL',
            description: `
                <strong style="color: #ffff00;">EPIC ACCOMPLISHMENTS</strong><br><br>
                🥇 <strong>DATA VISUALIZATION MAESTRO</strong><br>
                📊 Master of Advanced EDA Techniques<br><br>
                🥈 <strong>MACHINE LEARNING CHAMPION</strong><br>
                🤖 97%+ Accuracy in Multiple Projects<br><br>
                🥉 <strong>OPEN SOURCE WARRIOR</strong><br>
                💻 Contributing to AI Community<br><br>
                🏅 <strong>EVENT MANAGEMENT PRO</strong><br>
                🎪 Coordinated 1000+ Attendee Events<br><br>
                ⭐ <strong>SENTIMENT ANALYSIS EXPERT</strong><br>
                💬 Processed 74K+ Social Media Responses
            `
        }
    };

    const achievementMessages = [
        "🎯 ACHIEVEMENT: Data Visualization Maestro! (+INSIGHTS)",
        "📊 ACHIEVEMENT: Advanced EDA Complete! (+CLEAN DATA)",
        "🌳 ACHIEVEMENT: Decision Tree Deployed! (92% ACCURACY)",
        "💬 ACHIEVEMENT: Sentiment Analysis Master! (74K+ RESPONSES)",
        "🔐 ACHIEVEMENT: Auth Token Secured! (+CYBER DEFENSE)",
        "💾 ACHIEVEMENT: New Conversation API! (+LLM MEMORY)",
        "🎨 ACHIEVEMENT: User Login Interface! (+ACCESSIBILITY)",
        "🤝 ACHIEVEMENT: Open Source Contributor! (+COLLABORATION)",
        "🎪 ACHIEVEMENT: Event Management Pro! (+COORDINATION)",
        "📧 ACHIEVEMENT: SMS Spam Classifier! (+REAL-TIME AI)",
        "💰 ACHIEVEMENT: Fraud Detection Model! (+FINANCIAL SECURITY)",
        "🏆 ACHIEVEMENT: Portfolio Mastery! (+PRESENTATION SKILLS)",
    ];
    let lastAchievementIndex = -1;

    // --- Enhanced Audio Synths ---
    let coinSynth, levelUpSynth, walkSynth, ambientSynth, backgroundMusic;

    async function setupAudio() {
        try {
            if (typeof Tone === 'undefined') {
                console.warn('Tone.js not loaded, audio will be disabled');
                return;
            }
            
            await Tone.start();
            console.log("Enhanced AudioContext started");

            // Coin collection sound - more musical (Super Mario style)
            coinSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "triangle" },
                envelope: {
                    attack: 0.001,
                    decay: 0.1,
                    sustain: 0.05,
                    release: 0.1
                },
                volume: -5
            }).toDestination();

            // Level up sound - triumphant chord progression
            levelUpSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sawtooth" },
                envelope: {
                    attack: 0.02,
                    decay: 0.3,
                    sustain: 0.2,
                    release: 0.8
                },
                volume: -3
            }).toDestination();

            // Walking sound - subtle steps
            walkSynth = new Tone.NoiseSynth({
                noise: { type: "brown" },
                envelope: {
                    attack: 0.001,
                    decay: 0.05,
                    sustain: 0,
                    release: 0.05
                },
                volume: -15
            }).toDestination();

            // Ambient background - very subtle
            ambientSynth = new Tone.AutoFilter({
                frequency: 0.1,
                baseFrequency: 200,
                octaves: 2
            }).toDestination();

            const ambientOsc = new Tone.Oscillator({
                frequency: 55,
                type: "sine",
                volume: -25
            }).connect(ambientSynth);
            
            ambientOsc.start();
            
            // Background music - 8-bit style
            const synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "square" },
                envelope: {
                    attack: 0.01,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.1
                },
                volume: -15
            }).toDestination();
            
            // Create a simple 8-bit style melody
            const notes = ["C4", "E4", "G4", "C5", "G4", "E4", "A4", "F4", "G4", "C4"];
            const durations = ["8n", "8n", "8n", "4n", "8n", "8n", "4n", "8n", "8n", "4n"];
            
            backgroundMusic = new Tone.Sequence((time, i) => {
                synth.triggerAttackRelease(notes[i], durations[i], time);
            }, [...Array(notes.length).keys()], "4n");
            
            Tone.Transport.bpm.value = 120;
            
            if (gameSettings.musicEnabled) {
                Tone.Transport.start();
                backgroundMusic.start(0);
            }

        } catch (e) {
            console.error("Error setting up enhanced audio:", e);
            coinSynth = levelUpSynth = walkSynth = ambientSynth = backgroundMusic = null;
        }
    }

    function playCoinSound() {
        if (coinSynth && gameSettings.soundEnabled) {
            // Super Mario style coin sound
            coinSynth.triggerAttackRelease("B5", "16n");
            coinSynth.triggerAttackRelease("E6", "8n", Tone.now() + 0.05);
        }
    }

    function playLevelUpSound() {
        if (levelUpSynth && gameSettings.soundEnabled) {
            // Epic level up fanfare
            const now = Tone.now();
            levelUpSynth.triggerAttackRelease(["C4", "E4", "G4"], "4n", now);
            levelUpSynth.triggerAttackRelease(["D4", "F#4", "A4"], "4n", now + 0.2);
            levelUpSynth.triggerAttackRelease(["E4", "G#4", "B4"], "4n", now + 0.4);
            levelUpSynth.triggerAttackRelease(["C5", "E5", "G5"], "2n", now + 0.6);
        }
    }

    function playWalkSound() {
        if (walkSynth && gameSettings.soundEnabled) {
            walkSynth.triggerAttack();
            setTimeout(() => walkSynth.triggerRelease(), 50);
        }
    }
    
    // Sound toggle functions
    window.toggleSound = function() {
        gameSettings.soundEnabled = !gameSettings.soundEnabled;
        soundToggle.classList.toggle('active');
        soundToggle.querySelector('.sound-icon').textContent = gameSettings.soundEnabled ? '🔊' : '🔇';
    }
    
    window.toggleMusic = function() {
        gameSettings.musicEnabled = !gameSettings.musicEnabled;
        musicToggle.classList.toggle('active');
        
        if (backgroundMusic) {
            if (gameSettings.musicEnabled) {
                Tone.Transport.start();
                backgroundMusic.start(0);
            } else {
                backgroundMusic.stop();
            }
        }
    }
    
    // Sprite change function
    window.changeSprite = function(spriteType) {
        player.selectedSprite = spriteType;
        
        // Update character sprite if not currently moving
        if (!isMoving) {
            updateCharacterSprite(spriteType);
        }
        
        // Update selected sprite in UI
        document.querySelectorAll('.sprite-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const spriteOptions = {
            'sprite1': '.sprite-1',
            'sprite2': '.sprite-2',
            'sprite3': '.sprite-3',
            'sprite4': '.sprite-4'
        };
        
        document.querySelector(spriteOptions[spriteType]).classList.add('selected');
    }

    // --- Enhanced Utility Functions ---
    function getRandomPosition(elementWidth, elementHeight) {
        const gameWorldWidth = gameWorld.offsetWidth;
        const gameWorldHeight = gameWorld.offsetHeight;
        
        if (!gameWorldWidth || !gameWorldHeight) {
            return {
                left: Math.random() * 200 + 100,
                bottom: Math.random() * 200 + 120
            };
        }
        
        const minX = 80;
        const maxX = gameWorldWidth - elementWidth - 80;
        const minY = 140;
        const maxY = gameWorldHeight - elementHeight - 140;

        const x = Math.random() * (maxX - minX) + minX;
        const y = Math.random() * (maxY - minY) + minY;

        return {
            left: x,
            bottom: gameWorldHeight - y - elementHeight
        };
    }

    function showFloatingText(x, y, text, color = '#ffff00') {
        const floatingText = document.createElement('div');
        floatingText.classList.add('floating-text');
        floatingText.textContent = text;
        floatingText.style.left = `${x}px`;
        floatingText.style.bottom = `${y + 50}px`;
        floatingText.style.color = color;
        gameWorld.appendChild(floatingText);
        
        setTimeout(() => floatingText.remove(), 2000);
    }

    function showNotification(message, type = 'level-up') {
        levelUpNotification.textContent = message;
        levelUpNotification.className = `level-up-notification ${type}`;
        levelUpNotification.style.display = 'block';
        setTimeout(() => {
            levelUpNotification.style.display = 'none';
        }, 3000);
    }

    function getNextAchievementMessage() {
        lastAchievementIndex = (lastAchievementIndex + 1) % achievementMessages.length;
        return achievementMessages[lastAchievementIndex];
    }

    // --- Enhanced Character Movement ---
    function moveCharacterTo(targetX, targetY, callback) {
        if (isMoving) return;
        
        isMoving = true;
        
        // Start walking animation
        startWalkingAnimation();
        
        // Play walking sound
        const walkInterval = setInterval(playWalkSound, 200);
        
        // Calculate direction (flip character if moving left)
        const movingLeft = targetX < player.position.x;
        if (movingLeft) {
            characterElement.style.transform = 'scaleX(-1)';
        } else {
            characterElement.style.transform = 'scaleX(1)';
        }
        
        characterElement.classList.add('moving');
        characterElement.style.left = `${targetX}px`;
        characterElement.style.bottom = `${targetY}px`;
        
        player.position.x = targetX;
        player.position.y = targetY;
        
        setTimeout(() => {
            clearInterval(walkInterval);
            stopWalkingAnimation();
            characterElement.classList.remove('moving');
            updateCharacterSprite(player.selectedSprite);
            isMoving = false;
            if (callback) callback();
        }, gameSettings.characterSpeed * 1000);
    }
    
    // Mario-like walking animation
    function startWalkingAnimation() {
        // Clear any existing animation
        if (walkAnimationInterval) {
            clearInterval(walkAnimationInterval);
        }
        
        // Start with sprite2 (walking sprite)
        function updateCharacterSprite(spriteNumber) {
            const character = document.getElementById('character');
            // Remove all sprite classes
            character.classList.remove('sprite1', 'sprite2', 'sprite3', 'sprite4', 'sprite5', 'sprite6', 'sprite7', 'sprite8', 'sprite9');
            // Add the new sprite class
            character.classList.add(`sprite${spriteNumber}`);
        }
        
        
        // Alternate between walking sprites for animation
        walkAnimationInterval = setInterval(() => {
            walkAnimationFrame = walkAnimationFrame === 1 ? 2 : 1;
            updateCharacterSprite(walkAnimationFrame === 1 ? 'sprite2' : 'sprite5');
        }, 150); // Change sprite every 150ms for a good walking animation speed
    }
    
    function stopWalkingAnimation() {
        if (walkAnimationInterval) {
            clearInterval(walkAnimationInterval);
            walkAnimationInterval = null;
        }
    }

    // --- Enhanced Character Sprite Management ---
    function updateCharacterSprite(state) {
        characterElement.classList.remove('sprite1', 'sprite2', 'sprite3', 'sprite4', 'sprite5', 'sprite6', 'sprite7', 'sprite8', 'sprite9', 'walking', 'level-up');
        characterElement.classList.add(state);
    }

    // --- Enhanced Game Logic Functions ---
    function updateHUD() {
        levelDisplay.textContent = player.level;
        coinsCollectedDisplay.textContent = player.xp;
        totalCoinsCollectedDisplay.textContent = player.totalCoinsCollected;
        totalCoinsCollectedStat.textContent = player.totalCoinsCollected;
        xpToNextLevelDisplay.textContent = gameSettings.xpLevels[player.level + 1] || 'MAX';
        
        const currentLevelXPThreshold = gameSettings.xpLevels[player.level];
        const nextLevelXPThreshold = gameSettings.xpLevels[player.level + 1];

        let xpProgress = 0;
        if (nextLevelXPThreshold) {
            xpProgress = ((player.xp - currentLevelXPThreshold) / (nextLevelXPThreshold - currentLevelXPThreshold)) * 100;
        } else {
            xpProgress = 100;
        }
        xpFill.style.width = `${Math.min(100, xpProgress)}%`;

        viewedRegionsStat.textContent = player.viewedRegions.size;
        currentLevelStat.textContent = player.level;
        totalRegionsStat.textContent = Object.keys(regionsData).length;
    }

    
    // Power-up creation function
    function createPowerUp() {
        const powerUps = document.querySelectorAll('.power-up');
        if (powerUps.length >= gameSettings.maxPowerUps) return;
        
        const powerUp = document.createElement('div');
        powerUp.classList.add('power-up');
        
        // Random power-up type
        const types = ['speed', 'jump', 'shield'];
        const type = types[Math.floor(Math.random() * types.length)];
        powerUp.classList.add(type);
        powerUp.dataset.type = type;
        
        const position = getRandomPosition(25, 25);
        powerUp.style.left = `${position.left}px`;
        powerUp.style.bottom = `${position.bottom + 50}px`; // Higher up
        
        // Click handler for power-up collection
        powerUp.addEventListener('click', () => {
            if (!isMoving) {
                const powerUpX = parseInt(powerUp.style.left);
                const powerUpY = parseInt(powerUp.style.bottom);
                moveCharacterTo(powerUpX, powerUpY, () => collectPowerUp(powerUp));
            }
        });
        
        gameWorld.appendChild(powerUp);
        
        // Remove power-up after some time
        setTimeout(() => {
            powerUp.style.opacity = '0';
            setTimeout(() => powerUp.remove(), 1000);
        }, 15000); // Power-up lasts for 15 seconds
    }
    
    // Power-up collection function
    function collectPowerUp(powerUp) {
        const type = powerUp.dataset.type;
        
        // Apply power-up effect
        switch (type) {
            case 'speed':
                gameSettings.characterSpeed = 0.3; // Faster movement
                setTimeout(() => {
                    gameSettings.characterSpeed = 0.5; // Reset after 10 seconds
                }, 10000);
                showNotification('⚡ Speed Boost Activated!');
                break;
            case 'jump':
                gameSettings.jumpPower = 18; // Higher jumps
                setTimeout(() => {
                    gameSettings.jumpPower = 12; // Reset after 10 seconds
                }, 10000);
                showNotification('🚀 Super Jump Activated!');
                break;
            case 'shield':
                // Add shield effect
                characterElement.style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.8)';
                setTimeout(() => {
                    characterElement.style.boxShadow = ''; // Reset after 10 seconds
                }, 10000);
                showNotification('🛡️ Shield Activated!');
                break;
        }
        
        // Play power-up sound
        if (levelUpSynth && gameSettings.soundEnabled) {
            levelUpSynth.triggerAttackRelease(["C5", "E5", "G5"], "8n");
        }
        
        // Remove power-up
        powerUp.remove();
        
        // Add XP
        player.xp += 500;
        updateHUD();
        checkLevelUp();
        
        // Show floating text
        const powerUpRect = powerUp.getBoundingClientRect();
        const gameWorldRect = gameWorld.getBoundingClientRect();
        const relativeX = powerUpRect.left - gameWorldRect.left;
        const relativeY = gameWorldRect.bottom - powerUpRect.bottom;
        
        showFloatingText(relativeX, relativeY, '+500 XP!', '#00ffff');
        
        // Spawn new power-up after some time
        setTimeout(createPowerUp, 15000);
    }
    
    // Character jump function
    function jumpCharacter() {
        if (isMoving || isJumping) return;
        
        isJumping = true;
        characterElement.classList.add('jumping');
        
        // Play jump sound
        if (walkSynth && gameSettings.soundEnabled) {
            walkSynth.triggerAttackRelease("G4", "16n");
        }
        
        setTimeout(() => {
            characterElement.classList.remove('jumping');
            isJumping = false;
        }, 500);
    }
    
    // Create power-ups
    function createPowerUp() {
        const powerUps = document.querySelectorAll('.power-up');
        if (powerUps.length >= gameSettings.maxPowerUps) return;
        
        const powerUp = document.createElement('div');
        powerUp.classList.add('power-up');
        
        // Random power-up type
        const types = ['speed', 'jump', 'shield'];
        const type = types[Math.floor(Math.random() * types.length)];
        powerUp.classList.add(type);
        powerUp.dataset.type = type;
        
        const position = getRandomPosition(25, 25);
        powerUp.style.left = `${position.left}px`;
        powerUp.style.bottom = `${position.bottom + 50}px`; // Higher up
        
        // Click handler for power-up collection
        powerUp.addEventListener('click', () => {
            if (!isMoving) {
                const powerUpX = parseInt(powerUp.style.left);
                const powerUpY = parseInt(powerUp.style.bottom);
                moveCharacterTo(powerUpX, powerUpY, () => collectPowerUp(powerUp));
            }
        });
        
        gameWorld.appendChild(powerUp);
        
        // Remove power-up after some time
        setTimeout(() => {
            powerUp.remove();
            createPowerUp();
        }, 12000);
    }
    
    // Collect power-up
    function collectPowerUp(powerUpElement) {
        const type = powerUpElement.dataset.type;
        
        // Apply power-up effect
        player.powerUps[type] = true;
        
        // Show floating text
        const powerUpRect = powerUpElement.getBoundingClientRect();
        const gameWorldRect = gameWorld.getBoundingClientRect();
        const relativeX = powerUpRect.left - gameWorldRect.left;
        const relativeY = gameWorldRect.bottom - powerUpRect.bottom;
        
        let effectText = '';
        let effectColor = '';
        
        switch(type) {
            case 'speed':
                effectText = 'SPEED BOOST!';
                effectColor = '#00ccff';
                // Apply speed effect
                gameSettings.characterSpeed = 0.3; // Faster movement
                setTimeout(() => {
                    gameSettings.characterSpeed = 0.5; // Reset after 10 seconds
                    player.powerUps.speed = false;
                }, 10000);
                break;
            case 'jump':
                effectText = 'SUPER JUMP!';
                effectColor = '#ff00ff';
                // Apply jump effect
                gameSettings.jumpPower = 18; // Higher jumps
                setTimeout(() => {
                    gameSettings.jumpPower = 12; // Reset after 10 seconds
                    player.powerUps.jump = false;
                }, 10000);
                break;
            case 'shield':
                effectText = 'SHIELD ACTIVE!';
                effectColor = '#ffcc00';
                // Apply shield effect
                characterElement.style.boxShadow = '0 0 20px rgba(255, 204, 0, 0.7)';
                setTimeout(() => {
                    characterElement.style.boxShadow = '';
                    player.powerUps.shield = false;
                }, 10000);
                break;
        }
        
        showFloatingText(relativeX, relativeY, effectText, effectColor);
        
        // Play power-up sound
        if (levelUpSynth && gameSettings.soundEnabled) {
            levelUpSynth.triggerAttackRelease(["C5", "E5", "G5"], "8n");
        }
        
        // Remove power-up
        powerUpElement.remove();
        
        // Create new power-up after delay
        setTimeout(createPowerUp, 5000);
    }
    
    // Character jump function
    function jump() {
        if (player.isJumping) return;
        
        player.isJumping = true;
        player.jumpVelocity = gameSettings.jumpPower;
        
        // Add jumping class for animation
        characterElement.classList.add('jumping');
        
        // Play jump sound
        if (walkSynth && gameSettings.soundEnabled) {
            walkSynth.triggerAttackRelease("G4", "16n");
        }
        
        // Apply gravity
        const jumpInterval = setInterval(() => {
            // Update position
            player.position.y += player.jumpVelocity;
            player.jumpVelocity -= gameSettings.gravity;
            
            // Update character position
            characterElement.style.bottom = `${player.position.y}px`;
            
            // Check if landed
            if (player.position.y <= 95 && player.jumpVelocity < 0) {
                player.position.y = 95;
                characterElement.style.bottom = '95px';
                player.isJumping = false;
                player.jumpVelocity = 0;
                clearInterval(jumpInterval);
                characterElement.classList.remove('jumping');
                
                // Play landing sound
                if (walkSynth && gameSettings.soundEnabled) {
                    walkSynth.triggerAttackRelease("C3", "16n");
                }
            }
            
            // Check for platform collision
            checkPlatformCollision();
            
        }, 30);
    }
    
    // Check for platform collision
    function checkPlatformCollision() {
        if (!player.isJumping || player.jumpVelocity >= 0) return;
        
        const characterRect = characterElement.getBoundingClientRect();
        
        document.querySelectorAll('.platform').forEach(platform => {
            const platformRect = platform.getBoundingClientRect();
            
            // Check if character is above platform and falling onto it
            if (characterRect.bottom <= platformRect.top + 10 && 
                characterRect.bottom >= platformRect.top - 10 &&
                characterRect.right > platformRect.left &&
                characterRect.left < platformRect.right) {
                
                // Land on platform
                player.position.y = (gameWorld.getBoundingClientRect().bottom - platformRect.top) + characterRect.height;
                characterElement.style.bottom = `${player.position.y}px`;
                player.jumpVelocity = 0;
                
                // Increment platforms jumped counter
                player.platformsJumped++;
                
                // Check achievements
                checkAchievements();
                
                // Play landing sound
                if (walkSynth && gameSettings.soundEnabled) {
                    walkSynth.triggerAttackRelease("E3", "16n");
                }
            }
        });
    }
    
    function createXPCoin() {
        if (xpCoins.length >= gameSettings.maxCoins) return;

        const coin = document.createElement('div');
        coin.classList.add('xp-coin');
        const position = getRandomPosition(28, 28);
        
        coin.style.left = `${position.left}px`;
        coin.style.bottom = `${position.bottom}px`;
        coin.dataset.value = gameSettings.xpPerCoin;

        // Click handler for coin collection
        coin.addEventListener('click', () => {
            if (!isMoving) {
                const coinX = parseInt(coin.style.left) - 10;
                const coinY = parseInt(coin.style.bottom) - 5;
                moveCharacterTo(coinX, coinY, () => collectXPCoin(coin));
            }
        });

        gameWorld.appendChild(coin);
        xpCoins.push(coin);
    }

    function collectXPCoin(coinElement) {
        playCoinSound();

        // Show floating XP text
        const coinRect = coinElement.getBoundingClientRect();
        const gameWorldRect = gameWorld.getBoundingClientRect();
        const relativeX = coinRect.left - gameWorldRect.left;
        const relativeY = gameWorldRect.bottom - coinRect.bottom;
        
        showFloatingText(relativeX, relativeY, `+${coinElement.dataset.value} XP!`, '#ffd700');

        coinElement.classList.add('collected');

        const index = xpCoins.indexOf(coinElement);
        if (index > -1) {
            xpCoins.splice(index, 1);
        }

        setTimeout(() => coinElement.remove(), 1000);

        player.xp += parseInt(coinElement.dataset.value);
        player.totalCoinsCollected++;
        updateHUD();

        showNotification(getNextAchievementMessage(), 'achievement');
        checkLevelUp();
        
        setTimeout(createXPCoin, gameSettings.coinSpawnInterval);
    }

    function checkLevelUp() {
        const nextLevelXP = gameSettings.xpLevels[player.level + 1];
        if (nextLevelXP && player.xp >= nextLevelXP) {
            player.level++;
            updateHUD();
            levelUp();
        } else if (!nextLevelXP && player.level < Object.keys(gameSettings.xpLevels).length) {
            const maxLevel = Object.keys(gameSettings.xpLevels).length;
            const maxLevelXPThreshold = gameSettings.xpLevels[maxLevel];
            if (player.xp >= maxLevelXPThreshold && player.level < maxLevel) {
                 player.level = maxLevel;
                 updateHUD();
                 levelUp();
            }
        }
    }

    function levelUp() {
        playLevelUpSound();
        leveledUpToDisplay.textContent = `LVL ${player.level} DATA SCIENTIST`;
        showNotification(`🎉 LEVEL UP! LVL ${player.level} 🎉`);
        updateCharacterSprite('level-up');
        
        // Show level up floating text
        showFloatingText(player.position.x, player.position.y, `LEVEL ${player.level}!`, '#ffff00');
        
        const maxLevel = Object.keys(gameSettings.xpLevels).length;
        if (player.level === maxLevel) {
            appendMessage('bot', `🏆 LEGENDARY! You've reached MAX LEVEL ${maxLevel} and unlocked Lakshay's ULTIMATE DATA SCIENTIST FORM! 🚀`);
            showNotification('🏆 ULTIMATE FORM UNLOCKED! 🏆');
            
            // Change to energy sprite for max level
            setTimeout(() => {
                player.selectedSprite = 'sprite4';
                updateCharacterSprite('sprite4');
                
                // Update selected sprite in UI
                document.querySelectorAll('.sprite-option').forEach(option => {
                    option.classList.remove('selected');
                });
                document.querySelector('.sprite-4').classList.add('selected');
            }, 2500);
        } else {
            setTimeout(() => updateCharacterSprite(player.selectedSprite), 2500);
        }
    }

    // --- Enhanced World Map Functions ---
    window.openWorldMap = function() {
        worldMapModal.style.display = 'flex';
        loadRegions();
    }

    window.closeWorldMap = function() {
        worldMapModal.style.display = 'none';
    }

    function loadRegions() {
        regionsGrid.innerHTML = '';
        for (const key in regionsData) {
            const region = regionsData[key];
            const regionElement = document.createElement('div');
            regionElement.classList.add('region');
            regionElement.dataset.region = key;
            if (player.viewedRegions.has(key)) {
                regionElement.classList.add('viewed');
            }
            regionElement.innerHTML = `
                <div class="region-icon">${region.icon}</div>
                <div class="region-title">${region.title}</div>
                <div class="region-description">${region.description}</div>
            `;
            regionElement.addEventListener('click', () => viewRegion(key));
            regionsGrid.appendChild(regionElement);
        }
    }

    function viewRegion(regionName) {
        if (!player.viewedRegions.has(regionName)) {
            player.viewedRegions.add(regionName);
            updateHUD();
            appendMessage('bot', `🗺️ Accessing ${regionsData[regionName].title}! Data successfully unlocked and added to your knowledge base.`);
            const regionElement = document.querySelector(`.region[data-region="${regionName}"]`);
            if (regionElement) {
                regionElement.classList.add('viewed');
            }
        } else {
            appendMessage('bot', `📚 You've already mastered the ${regionsData[regionName].title}. All data has been absorbed!`);
        }
    }

    // --- Enhanced Chatbot Functions ---
    window.toggleChatbot = function() {
        chatbot.classList.toggle('minimized');
        chatbotToggleIcon.textContent = chatbot.classList.contains('minimized') ? '+' : '_';
        if (!chatbot.classList.contains('minimized')) {
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
    }

    window.sendMessage = async function() {
        const messageText = chatInput.value.trim();
        if (messageText === '') return;

        appendMessage('user', messageText);
        chatInput.value = '';

        // Enhanced AI responses with more personality
        let botResponse = "🤖 Processing your epic query through the data matrix...";

        const lowerMessage = messageText.toLowerCase();
        
        if (lowerMessage.includes('level') || lowerMessage.includes('xp')) {
            botResponse = `⚡ Current Status: Level ${player.level} Data Scientist! You have ${player.xp} XP and need ${gameSettings.xpLevels[player.level + 1] ? gameSettings.xpLevels[player.level + 1] - player.xp : 'MAX LEVEL ACHIEVED'} more XP to advance. You've collected ${player.totalCoinsCollected} coins so far! 💰`;
        } else if (lowerMessage.includes('skills') || lowerMessage.includes('tech') || lowerMessage.includes('python')) {
            botResponse = "⚔️ Lakshay's skill arsenal is legendary! Python mastery with ML/DL frameworks like TensorFlow, Scikit-Learn, and advanced data visualization tools. His weapon of choice: statistical modeling and predictive analytics! Check the SKILL ARSENAL in INFO MAP for the complete inventory! 🐍📊";
        } else if (lowerMessage.includes('experience') || lowerMessage.includes('internship') || lowerMessage.includes('work')) {
            botResponse = "💼 Epic work experience achieved! Data Science Intern at Prodigy InfoTech with 92% ML model accuracy, plus open-source contributions to Askage AI chatbot. Also coordinated massive French Embassy events! Quest for more details: INFO MAP → EXPERIENCE ZONE! 🚀";
        } else if (lowerMessage.includes('projects') || lowerMessage.includes('spam') || lowerMessage.includes('fraud')) {
            botResponse = "🛡️ Legendary projects completed! SMS Spam Classifier with 97% accuracy and 100% precision, plus a Fraud Detection Model analyzing 6.2M+ transactions with 99.95% accuracy! Both deployed with Streamlit for real-time AI power! Full quest details in INFO MAP! ⚡";
        } else if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('email') || lowerMessage.includes('linkedin')) {
            botResponse = "📞 Ready to connect? All contact portals are available in the PROFILE HUB region! Direct teleportation links for LinkedIn, GitHub, email, and portfolio included. The adventure continues beyond this game! 🌐";
        } else if (lowerMessage.includes('reset') || lowerMessage.includes('restart')) {
            botResponse = "🔄 Want to restart your adventure? Use the RESET button in the action panel to begin a new journey through Lakshay's data universe! 🎮";
        } else if (lowerMessage.includes('education') || lowerMessage.includes('university') || lowerMessage.includes('college')) {
            botResponse = "🎓 Currently leveling up at University of Delhi with Bachelor of Commerce (Hons)! Mastering advanced mathematics, business statistics, and data science applications. The academic quest continues until 2026/27! 📚";
        } else if (lowerMessage.includes('sound') || lowerMessage.includes('audio') || lowerMessage.includes('music')) {
            botResponse = "🔊 Sound controls activated! Toggle sound effects with the speaker button and background music with the music note button at the bottom left of your screen. Enhance your adventure with epic audio! 🎵";
        } else if (lowerMessage.includes('sprite') || lowerMessage.includes('character') || lowerMessage.includes('avatar')) {
            botResponse = "👾 Character customization unlocked! Choose your preferred sprite from the selector at the bottom of the screen. Each sprite has unique visual effects - try the energy sprite for an epic glow effect! 🎮";
        } else if (lowerMessage.includes('how') && lowerMessage.includes('play')) {
            botResponse = "🎮 Game Controls: Click on coins to collect them! Your character will move to the coin and collect it. Change your sprite appearance using the selector at the bottom. Toggle sound effects and music with the buttons at the bottom left. Open the info map to learn more about Lakshay's skills and experience! 🚀";
        } else {
            const responses = [
                "🤖 Interesting query! Try asking about Lakshay's epic level, legendary skills, heroic experience, or magnificent projects!",
                "⚡ Data processing complete! Ask me about specific regions like skills, projects, or experience for detailed intel!",
                "🎮 Quest unclear! Try commands like 'tell me about skills', 'what projects', or 'contact info' for epic responses!",
                "🚀 Ready to assist! Ask about Lakshay's journey through the realms of data science, machine learning, or his legendary achievements!"
            ];
            botResponse = responses[Math.floor(Math.random() * responses.length)];
        }
        
        // Simulate realistic typing delay
        setTimeout(() => {
            appendMessage('bot', botResponse);
        }, 800 + Math.random() * 1200);
    }

    function appendMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        messageDiv.innerHTML = text;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // --- Reset Game Function ---
    window.resetGame = function() {
        // Reset player state
        player.level = 1;
        player.xp = 0;
        player.viewedRegions.clear();
        player.totalCoinsCollected = 0;
        player.position = { x: 60, y: 95 };
        player.selectedSprite = 'sprite1';
        
        // Reset character position and sprite
        characterElement.style.left = '60px';
        characterElement.style.bottom = '95px';
        characterElement.style.transform = 'scaleX(1)'; // Reset any flipping
        updateCharacterSprite('sprite1');
        
        // Clear all coins
        xpCoins.forEach(coin => coin.remove());
        xpCoins.length = 0;
        
        // Clear floating texts
        document.querySelectorAll('.floating-text').forEach(text => text.remove());
        
        // Reset viewed regions in modal
        document.querySelectorAll('.region.viewed').forEach(region => {
            region.classList.remove('viewed');
        });
        
        // Reset sprite selector
        document.querySelectorAll('.sprite-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('.sprite-1').classList.add('selected');
        
        updateHUD();
        appendMessage('bot', '🔄 Game reset complete! Welcome back to the beginning of your data science adventure! 🎮');
        
        // Restart coin spawning
        setTimeout(() => {
            for (let i = 0; i < gameSettings.maxCoins; i++) {
                createXPCoin();
            }
        }, 1000);
    }

    // --- Enhanced Particle System ---
    function createParticle() {
        const existingParticles = document.querySelectorAll('.particle');
        if (existingParticles.length >= 60) return;
        
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 4 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random colors for variety
        const colors = ['#00ff88', '#00bfff', '#ffff00', '#ff6600'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        const startX = Math.random() * window.innerWidth;
        const animationDuration = Math.random() * 6 + 6;
        const delay = Math.random() * 10;

        particle.style.left = `${startX}px`;
        particle.style.animationDuration = `${animationDuration}s`;
        particle.style.animationDelay = `${delay}s`;

        document.getElementById('particleSystem').appendChild(particle);

        particle.addEventListener('animationend', () => {
            particle.remove();
            if (document.querySelectorAll('.particle').length < 40) {
                createParticle();
            }
        });
    }

    function initParticles(count = 40) {
        const existingParticles = document.querySelectorAll('.particle');
        existingParticles.forEach(p => p.remove());
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => createParticle(), i * 100);
        }
    }

    // --- Enhanced Game Initialization ---
    async function initializeGame() {
        // Set character to idle sprite initially
        updateCharacterSprite(player.selectedSprite);
        
        updateHUD();
        initParticles();
        
        try {
            await setupAudio();
        } catch (error) {
            console.warn('Enhanced audio initialization failed:', error);
        }

        loadRegions();

        chatInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });
        
        window.addEventListener('beforeunload', cleanupGame);
        
        // Welcome message
        setTimeout(() => {
            appendMessage('bot', '🎮 Welcome to Lakshay\'s Data Science RPG! I\'m your AI guide. Click on coins to collect them and gain XP. Ask me anything! 🚀');
        }, 1500);
        
        // Start the game world
        setTimeout(() => {
            for (let i = 0; i < gameSettings.maxCoins; i++) {
                setTimeout(() => createXPCoin(), i * 500);
            }
            
            coinSpawnTimer = setInterval(() => {
                if (xpCoins.length < gameSettings.maxCoins) {
                    createXPCoin();
                }
            }, gameSettings.coinSpawnInterval);
        }, 2000);
    }
    
    // --- Enhanced Cleanup Function ---
    function cleanupGame() {
        if (coinSpawnTimer) {
            clearInterval(coinSpawnTimer);
        }
        
        if (walkAnimationInterval) {
            clearInterval(walkAnimationInterval);
        }
        
        document.querySelectorAll('.particle').forEach(p => p.remove());
        document.querySelectorAll('.floating-text').forEach(text => text.remove());
        
        xpCoins.forEach(coin => coin.remove());
        xpCoins.length = 0;
        
        if (coinSynth) coinSynth.dispose();
        if (levelUpSynth) levelUpSynth.dispose();
        if (walkSynth) walkSynth.dispose();
        if (ambientSynth) ambientSynth.dispose();
        if (backgroundMusic) backgroundMusic.dispose();
    }

    // Day/Night Cycle Toggle
    function toggleDayNightCycle() {
        const body = document.body;
        const dayNightToggle = document.getElementById('dayNightToggle');
        
        if (body.classList.contains('day-mode')) {
            // Switch to sunset mode
            body.classList.remove('day-mode');
            body.classList.add('sunset-mode');
            dayNightToggle.classList.remove('day');
            dayNightToggle.classList.add('sunset');
        } else if (body.classList.contains('sunset-mode')) {
            // Switch to night mode (default)
            body.classList.remove('sunset-mode');
            dayNightToggle.classList.remove('sunset');
        } else {
            // Switch to day mode
            body.classList.add('day-mode');
            dayNightToggle.classList.add('day');
        }
        
        // Play transition sound if available
        if (ambientSynth && gameSettings.soundEnabled) {
            ambientSynth.triggerAttackRelease("C5", "16n");
            ambientSynth.triggerAttackRelease("G5", "16n", Tone.now() + 0.1);
        }
    }
    
    // Mini-map Toggle
    function toggleMiniMap() {
        const miniMap = document.getElementById('miniMap');
        if (miniMap.style.display === 'none') {
            miniMap.style.display = 'flex';
        } else {
            miniMap.style.display = 'none';
        }
    }
    
    // Update Mini-map
    function updateMiniMap() {
        const miniMapContent = document.getElementById('miniMapContent');
        const miniMapPlayer = document.createElement('div');
        
        // Clear previous content
        miniMapContent.innerHTML = '';
        
        // Add player marker
        miniMapPlayer.className = 'mini-map-player';
        
        // Calculate relative position (percentage)
        const worldWidth = gameWorld.offsetWidth;
        const worldHeight = gameWorld.offsetHeight;
        const relativeX = (player.position.x / worldWidth) * 100;
        const relativeY = (player.position.y / worldHeight) * 100;
        
        miniMapPlayer.style.left = `${relativeX}%`;
        miniMapPlayer.style.top = `${100 - relativeY}%`; // Invert Y-axis
        
        miniMapContent.appendChild(miniMapPlayer);
        
        // Add coin markers
        xpCoins.forEach(coin => {
            const coinRect = coin.getBoundingClientRect();
            const gameWorldRect = gameWorld.getBoundingClientRect();
            
            const coinX = ((coinRect.left - gameWorldRect.left) / worldWidth) * 100;
            const coinY = ((gameWorldRect.bottom - coinRect.bottom) / worldHeight) * 100;
            
            const miniMapCoin = document.createElement('div');
            miniMapCoin.className = 'mini-map-coin';
            miniMapCoin.style.left = `${coinX}%`;
            miniMapCoin.style.top = `${coinY}%`;
            
            miniMapContent.appendChild(miniMapCoin);
        });
        
        // Add platform markers
        document.querySelectorAll('.platform').forEach(platform => {
            const platformRect = platform.getBoundingClientRect();
            const gameWorldRect = gameWorld.getBoundingClientRect();
            
            const platformX = ((platformRect.left - gameWorldRect.left) / worldWidth) * 100;
            const platformY = ((gameWorldRect.bottom - platformRect.bottom) / worldHeight) * 100;
            const platformWidth = (platformRect.width / worldWidth) * 100;
            
            const miniMapPlatform = document.createElement('div');
            miniMapPlatform.className = 'mini-map-platform';
            miniMapPlatform.style.left = `${platformX}%`;
            miniMapPlatform.style.top = `${platformY}%`;
            miniMapPlatform.style.width = `${platformWidth}%`;
            
            miniMapContent.appendChild(miniMapPlatform);
        });
        
        // Add obstacle markers
        document.querySelectorAll('.obstacle').forEach(obstacle => {
            const obstacleRect = obstacle.getBoundingClientRect();
            const gameWorldRect = gameWorld.getBoundingClientRect();
            
            const obstacleX = ((obstacleRect.left - gameWorldRect.left) / worldWidth) * 100;
            const obstacleY = ((gameWorldRect.bottom - obstacleRect.bottom) / worldHeight) * 100;
            
            const miniMapObstacle = document.createElement('div');
            miniMapObstacle.className = 'mini-map-obstacle';
            miniMapObstacle.style.left = `${obstacleX}%`;
            miniMapObstacle.style.top = `${obstacleY}%`;
            
            miniMapContent.appendChild(miniMapObstacle);
        });
        
        // Add power-up markers
        document.querySelectorAll('.power-up').forEach(powerUp => {
            const powerUpRect = powerUp.getBoundingClientRect();
            const gameWorldRect = gameWorld.getBoundingClientRect();
            
            const powerUpX = ((powerUpRect.left - gameWorldRect.left) / worldWidth) * 100;
            const powerUpY = ((gameWorldRect.bottom - powerUpRect.bottom) / worldHeight) * 100;
            
            const miniMapPowerUp = document.createElement('div');
            miniMapPowerUp.className = 'mini-map-power-up';
            miniMapPowerUp.style.left = `${powerUpX}%`;
            miniMapPowerUp.style.top = `${powerUpY}%`;
            
            miniMapContent.appendChild(miniMapPowerUp);
        });
    }
    
    // Achievement System
    const achievements = [
        {
            id: 'coin_collector_1',
            title: 'Coin Collector I',
            description: 'Collect 5 coins',
            icon: '💰',
            rarity: 'common',
            requirement: () => player.totalCoinsCollected >= 5,
            reward: 500,
            progress: () => Math.min(player.totalCoinsCollected / 5, 1),
            unlocked: false
        },
        {
            id: 'coin_collector_2',
            title: 'Coin Collector II',
            description: 'Collect 15 coins',
            icon: '💰',
            rarity: 'rare',
            requirement: () => player.totalCoinsCollected >= 15,
            reward: 1000,
            progress: () => Math.min(player.totalCoinsCollected / 15, 1),
            unlocked: false
        },
        {
            id: 'explorer',
            title: 'Explorer',
            description: 'View all regions in the info map',
            icon: '🗺️',
            rarity: 'epic',
            requirement: () => player.viewedRegions.size >= Object.keys(regionsData).length,
            reward: 2000,
            progress: () => Math.min(player.viewedRegions.size / Object.keys(regionsData).length, 1),
            unlocked: false
        },
        {
            id: 'master_data_scientist',
            title: 'Master Data Scientist',
            description: 'Reach level 5',
            icon: '🏆',
            rarity: 'legendary',
            requirement: () => player.level >= 5,
            reward: 5000,
            progress: () => Math.min(player.level / 5, 1),
            unlocked: false
        }
    ];
    
    function checkAchievements() {
        let newAchievementUnlocked = false;
        
        achievements.forEach(achievement => {
            if (!achievement.unlocked && achievement.requirement()) {
                achievement.unlocked = true;
                newAchievementUnlocked = true;
                
                // Add XP reward
                player.xp += achievement.reward;
                updateHUD();
                checkLevelUp();
                
                // Show achievement popup
                showAchievementPopup(achievement);
            }
        });
        
        return newAchievementUnlocked;
    }
    
    function showAchievementPopup(achievement) {
        const popup = document.getElementById('achievementPopup');
        const description = document.getElementById('achievementPopupDescription');
        const reward = document.getElementById('achievementPopupReward');
        
        description.textContent = `${achievement.title}: ${achievement.description}`;
        reward.textContent = `Reward: +${achievement.reward} XP`;
        
        popup.style.display = 'block';
        
        // Play achievement sound
        if (levelUpSynth && gameSettings.soundEnabled) {
            const now = Tone.now();
            levelUpSynth.triggerAttackRelease(["C5", "E5", "G5"], "8n", now);
            levelUpSynth.triggerAttackRelease(["D5", "F#5", "A5"], "8n", now + 0.2);
            levelUpSynth.triggerAttackRelease(["E5", "G#5", "B5"], "8n", now + 0.4);
        }
        
        setTimeout(() => {
            popup.style.display = 'none';
        }, 5000);
    }
    
    function openAchievementsModal() {
        const modal = document.getElementById('achievementsModal');
        const achievementsList = document.getElementById('achievementsList');
        
        // Clear previous content
        achievementsList.innerHTML = '';
        
        // Add achievements
        achievements.forEach(achievement => {
            const badge = document.createElement('div');
            badge.className = `achievement-badge ${achievement.rarity} ${achievement.unlocked ? '' : 'locked'}`;
            
            const icon = document.createElement('div');
            icon.className = `achievement-icon ${achievement.rarity}`;
            icon.textContent = achievement.icon;
            
            const details = document.createElement('div');
            details.className = 'achievement-details';
            
            const title = document.createElement('div');
            title.className = 'achievement-title';
            title.textContent = achievement.title;
            
            const description = document.createElement('div');
            description.className = 'achievement-description';
            description.textContent = achievement.description;
            
            const progress = document.createElement('div');
            progress.className = 'achievement-progress';
            progress.textContent = achievement.unlocked ? 'Completed!' : 'In Progress';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'achievement-progress-bar';
            
            const progressFill = document.createElement('div');
            progressFill.className = 'achievement-progress-fill';
            progressFill.style.width = `${achievement.progress() * 100}%`;
            
            progressBar.appendChild(progressFill);
            details.appendChild(title);
            details.appendChild(description);
            details.appendChild(progress);
            details.appendChild(progressBar);
            
            badge.appendChild(icon);
            badge.appendChild(details);
            
            achievementsList.appendChild(badge);
        });
        
        modal.style.display = 'flex';
    }
    
    function closeAchievementsModal() {
        const modal = document.getElementById('achievementsModal');
        modal.style.display = 'none';
    }
    
    // Global function attachments
    window.openWorldMap = openWorldMap;
    window.closeWorldMap = closeWorldMap;
    window.viewRegion = viewRegion;
    window.toggleChatbot = toggleChatbot;
    window.sendMessage = sendMessage;
    window.resetGame = resetGame;
    window.toggleDayNightCycle = toggleDayNightCycle;
    window.toggleMiniMap = toggleMiniMap;
    window.openAchievements = openAchievementsModal;
    window.closeAchievementsModal = closeAchievementsModal;

    // Initialize the enhanced game
    document.addEventListener('DOMContentLoaded', () => {
        initializeGame();
        
        // Add keyboard controls for movement and jumping
        document.addEventListener('keydown', function(event) {
            if (isMoving || player.isJumping) return; // Don't allow movement while already moving or jumping
            
            const step = 50; // Movement step size
            let newX = player.position.x;
            
            switch (event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    newX -= step;
                    characterElement.style.transform = 'scaleX(-1)'; // Flip character left
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    newX += step;
                    characterElement.style.transform = 'scaleX(1)'; // Face character right
                    break;
                case 'ArrowUp':
                case 'w':
                case 'W':
                case ' ': // Spacebar
                    jump();
                    return;
            }
            
            // Check boundaries
            const gameWorldRect = gameWorld.getBoundingClientRect();
            if (newX < 0) newX = 0;
            if (newX > gameWorldRect.width - 40) newX = gameWorldRect.width - 40;
            
            // Move character if position changed
            if (newX !== player.position.x) {
                moveCharacterTo(newX, player.position.y);
            }
        });
        
        // Create initial platforms, obstacles and power-ups
        for (let i = 0; i < gameSettings.maxPlatforms; i++) {
            setTimeout(() => createPlatform(), i * 1000);
        }
        
        setTimeout(() => createObstacle(), 5000);
        setTimeout(() => createPowerUp(), 10000);
        
        // Update mini-map periodically
        setInterval(updateMiniMap, 1000);
        
        // Check achievements periodically
        setInterval(checkAchievements, 5000);
    });
})();
// Add this to your existing JavaScript
function toggleHowToPlay() {
    const menu = document.getElementById('howToPlayMenu');
    menu.classList.toggle('visible');
}

// Optional: Close menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('howToPlayMenu');
    const button = document.querySelector('.how-to-play-button');
    
    if (!menu.contains(event.target) && !button.contains(event.target)) {
        menu.classList.remove('visible');
    }
});
// ==================== EXAMPLE CONFIG ====================
// Copy this file to config.js and add your API key
// DO NOT commit config.js to git!

const CONFIG = {
    // Get your API key from: https://openrouter.ai/keys
    API_KEY: 'your-openrouter-api-key-here',
    API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    MODEL: 'google/gemini-2.0-flash-001',
    
    // Game Settings
    maxCoins: 5,
    coinRespawnTime: 5000,
    soundEnabled: true,
    musicEnabled: true
};

window.CONFIG = CONFIG;

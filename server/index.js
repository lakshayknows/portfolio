
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Use dynamic import for pdf-parse (CommonJS module)
const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// Try server folder first (for Render), fallback to assets folder (for local)
const PDF_NAME = 'lakshayhanda_AIEngineer.pdf';
const PDF_PATH = fs.existsSync(path.join(__dirname, PDF_NAME)) 
    ? path.join(__dirname, PDF_NAME)
    : path.join(__dirname, '..', 'assets', PDF_NAME);
const PORT = process.env.PORT || 3001;

let resumeContent = '';
let resumeChunks = [];

// Simple text chunking
function chunkText(text, chunkSize = 500, overlap = 100) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end).trim());
        start += chunkSize - overlap;
    }
    return chunks.filter(chunk => chunk.length > 50);
}

// Simple keyword-based retrieval
function retrieveChunks(query, chunks, topK = 4) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    const scored = chunks.map((chunk, idx) => {
        const chunkLower = chunk.toLowerCase();
        let score = 0;
        queryWords.forEach(word => {
            if (chunkLower.includes(word)) score += 1;
            // Boost for exact word match
            if (chunkLower.split(/\s+/).includes(word)) score += 2;
        });
        return { chunk, score, idx };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).filter(s => s.score > 0).map(s => s.chunk);
}

// Initialize - load and parse PDF
async function initialize() {
    console.log('🚀 Initializing RAG backend...');
    
    if (!OPENROUTER_API_KEY) {
        console.error('❌ OPENROUTER_API_KEY not found in .env file');
        console.log('💡 Add OPENROUTER_API_KEY=your-key to your .env file');
        return false;
    }
    console.log('✅ OpenRouter API key found');
    
    try {
        // Load and parse PDF
        console.log('📄 Loading PDF:', PDF_PATH);
        const pdfBuffer = fs.readFileSync(PDF_PATH);
        const pdfData = await pdfParse(pdfBuffer);
        resumeContent = pdfData.text;
        console.log(`✅ Loaded PDF: ${resumeContent.length} characters`);
        
        // Chunk the content
        resumeChunks = chunkText(resumeContent);
        console.log(`✅ Created ${resumeChunks.length} chunks`);
        
        console.log('✅ RAG backend ready!');
        return true;
        
    } catch (error) {
        console.error('❌ Initialization failed:', error.message);
        return false;
    }
}

// Call OpenRouter API
async function callOpenRouter(systemPrompt, userMessage) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'Lakshay Portfolio RAG'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            max_tokens: 300
        })
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response generated';
}

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    if (resumeChunks.length === 0) {
        return res.status(503).json({ 
            error: 'Resume not loaded. Check server logs.',
            response: '⚠️ Backend not ready. Please check server logs.'
        });
    }
    
    try {
        console.log(`\n📨 Question: "${message}"`);
        
        // Retrieve relevant chunks
        const relevantChunks = retrieveChunks(message, resumeChunks, 4);
        const context = relevantChunks.length > 0 
            ? relevantChunks.join('\n\n---\n\n')
            : resumeContent.substring(0, 2000); // Fallback to first part
        
        console.log(`📚 Retrieved ${relevantChunks.length} relevant chunks`);
        
        // Build prompt with structured output format
        const systemPrompt = `You are Lakshay Handa's AI assistant on his portfolio website.
Answer questions based ONLY on the following context from his resume.

RESPONSE FORMAT (always follow this structure):
1. Start with 1-2 introductory sentences
2. List key points as bullet points (use • for bullets)
3. End with a brief conclusion or call-to-action

Example format:
"Here's what I found about [topic]:

• Point one
• Point two
• Point three

Feel free to ask more about [related topics]!"

Context from resume:
${context}

If the question cannot be answered from the context, say you can only answer questions about Lakshay's professional background.`;
        
        // Call OpenRouter
        const answer = await callOpenRouter(systemPrompt, message);
        console.log(`✅ Answer: ${answer.substring(0, 100)}...`);
        
        res.json({ 
            response: answer,
            chunksUsed: relevantChunks.length
        });
        
    } catch (error) {
        console.error('❌ Chat error:', error.message);
        res.status(500).json({ 
            error: error.message,
            response: '⚠️ An error occurred. Please try again.'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        ready: resumeChunks.length > 0,
        chunksLoaded: resumeChunks.length,
        resumeLength: resumeContent.length,
        timestamp: new Date().toISOString()
    });
});

// Start server
async function start() {
    const ready = await initialize();
    
    app.listen(PORT, () => {
        console.log(`\n🌐 Server running at http://localhost:${PORT}`);
        console.log(`📡 Chat endpoint: POST http://localhost:${PORT}/api/chat`);
        console.log(`❤️  Health check: GET http://localhost:${PORT}/api/health`);
        if (!ready) {
            console.log('⚠️  Backend not fully initialized - check logs above');
        }
    });
}

start();

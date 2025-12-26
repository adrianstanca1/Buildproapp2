
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import { analyzeProjectDocument } from '../services/aiService.js';
import { logger } from '../utils/logger.js';
import { getDb } from '../database.js';

const router = express.Router();

// Configure Multer for memory storage (file buffer)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const apiKey = process.env.GEMINI_API_KEY;

router.post('/chat', async (req: any, res: any) => {
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    try {
        const { history, newMessage, imageData, mimeType, config, projectId, contextType } = req.body;
        const ai = new GoogleGenAI({ apiKey });

        // Default model
        const model = config?.model || "gemini-2.0-flash-exp";

        let systemInstruction = config?.systemInstruction || "You are a helpful, witty, and precise AI assistant for the BuildPro construction platform.";

        // --- Context Injection ---
        if (projectId || contextType) {
            try {
                const db = getDb();
                const contextParts = [];

                if (projectId) {
                    const project = await db.all('SELECT * FROM projects WHERE id = ?', [projectId]);
                    if (project.length) contextParts.push(`Current Project Metadata: ${JSON.stringify(project[0])}`);

                    const transactions = await db.all('SELECT * FROM transactions WHERE projectId = ? ORDER BY date DESC LIMIT 20', [projectId]);
                    if (transactions.length) contextParts.push(`Recent Financial Transactions: ${JSON.stringify(transactions)}`);

                    const tasks = await db.all('SELECT * FROM tasks WHERE projectId = ? AND status != "Done" LIMIT 20', [projectId]);
                    if (tasks.length) contextParts.push(`Active Tasks: ${JSON.stringify(tasks)}`);

                    const pos = await db.all('SELECT * FROM purchase_orders WHERE projectId = ? AND status != "rejected" LIMIT 10', [projectId]);
                    if (pos.length) contextParts.push(`Active Purchase Orders: ${JSON.stringify(pos)}`);
                }

                if (contextType === 'SAFETY') {
                    const incidents = await db.all('SELECT * FROM safety_incidents WHERE status != "Resolved" ORDER BY date DESC LIMIT 50');
                    if (incidents.length) contextParts.push(`Active Safety Incidents: ${JSON.stringify(incidents)}`);
                }

                if (contextParts.length > 0) {
                    systemInstruction += `\n\n=== REAL-TIME DATABASE CONTEXT ===\nUse the following live data to answer user questions authentically. Do not hallucinate data if it's not here.\n\n${contextParts.join('\n\n')}\n==================================`;
                }
            } catch (e) {
                logger.error("Failed to inject DB context into AI chat", e);
            }
        }

        const chatConfig: any = {
            systemInstruction: systemInstruction,
        };

        // Thinking/Tools config
        if (config?.thinkingConfig?.thinkingBudget) {
            chatConfig.thinkingConfig = config.thinkingConfig;
        }
        if (config?.tools) {
            chatConfig.tools = config.tools;
        }

        const chat = ai.chats.create({
            model: model,
            config: chatConfig,
            history: history || []
        });

        const parts: any[] = [];
        if (newMessage && newMessage.trim()) {
            parts.push({ text: newMessage });
        }
        if (imageData) {
            // imageData is expected to be raw base64 data here, or we parse it
            parts.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: imageData } });
        }

        const result = await chat.sendMessageStream(parts as any);

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of result) {
            const chunkText = chunk.text; // Fixed: accessing as property
            if (chunkText) {
                res.write(chunkText);
            }
        }
        res.end();

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        // If headers already sent, we can't send JSON error, but query failed.
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || 'Internal AI Error' });
        } else {
            res.end();
        }
    }
});

router.post('/image', async (req: any, res: any) => {
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    try {
        const { prompt, aspectRatio, config } = req.body;
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp', // Or 'gemini-3-pro-image-preview' if available/configured
            contents: {
                role: 'user',
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio || "1:1",
                    imageSize: "1K"
                }
            },
        });

        // Extract image
        let imageUri = null;
        if (response) {
            // Logic to extract image URI depending on response structure
            // Usually it's in candidates[0].content.parts 
            // But for image gen it might be different or return a URI?
            // Inspecting previous geminiService code:
            // for (const part of response.candidates?.[0]?.content?.parts || []) { ... part.inlineData ... }
            const parts = response.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
                if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                    imageUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }

        res.json({ imageUri });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// New Endpoint for Phase Analysis
router.post('/analyze-phase', upload.single('file'), async (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { name, type } = req.body;
        const projectContext = { name, type };

        const result = await analyzeProjectDocument(
            req.file.buffer,
            req.file.mimetype,
            projectContext
        );

        res.json(result);
    } catch (error: any) {
        logger.error("Analyze Phase Error:", error);
        res.status(500).json({ error: error.message || "Failed to analyze document" });
    }
});

export default router;


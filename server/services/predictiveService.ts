import { getDb } from '../database.js';
import { AppError } from '../utils/AppError.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class PredictiveService {
    /**
     * Analyze a project for potential delays
     */
    static async analyzeProjectDelays(companyId: string, projectId: string) {
        const db = getDb();

        // 1. Fetch relevant data
        const [tasks, safety, weather] = await Promise.all([
            db.all('SELECT * FROM tasks WHERE projectId = ? AND companyId = ?', [projectId, companyId]),
            db.all('SELECT * FROM safety_incidents WHERE projectId = ? AND companyId = ?', [projectId, companyId]),
            db.all('SELECT * FROM daily_logs WHERE projectId = ? AND companyId = ? ORDER BY date DESC LIMIT 7', [projectId, companyId])
        ]);

        if (tasks.length === 0) return { delayProbability: 0, reasoning: "No tasks to analyze." };

        // 2. Simple statistical analysis
        const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'Done');
        const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date());
        const completionRate = completedTasks.length / tasks.length;
        const safetyIncidentCount = safety.length;

        // 3. AI Reasoning (Gemini)
        let aiReasoning = "AI analysis skipped (API key missing).";
        let predictedDelayDays = 0;

        if (process.env.GEMINI_API_KEY) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = `
                    Analyze the following construction project data and predict potential delays:
                    - Project ID: ${projectId}
                    - Total Tasks: ${tasks.length}
                    - Overdue Tasks: ${overdueTasks.length}
                    - Completion Rate: ${(completionRate * 100).toFixed(1)}%
                    - Safety Incidents: ${safetyIncidentCount}
                    - Recent Weather/Logs: ${JSON.stringify(weather.map(w => w.weather || 'Clear'))}

                    Provide a JSON response with:
                    1. "delayProbability" (0-100)
                    2. "predictedDelayDays" (number)
                    3. "reasoning" (short paragraph explanation)
                    4. "riskFactors" (array of strings)
                `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Extract JSON from response (handling potential markdown)
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const aiData = JSON.parse(jsonMatch[0]);
                    return {
                        ...aiData,
                        analyzedAt: new Date().toISOString()
                    };
                }
            } catch (error) {
                console.error("[Predictive] Gemini AI Error:", error);
                aiReasoning = "AI analysis failed due to system error.";
            }
        }

        // Fallback simple logic
        if (!process.env.GEMINI_API_KEY) {
            // Import logger dynamically or assume global logger if available. 
            // Since we didn't import logger at top, let's stick to console.warn or import it.
            // Better to be safe and just log to console here as this is a service class.
            console.warn('[PredictiveService] GEMINI_API_KEY missing. Using heuristic fallback.');
        }

        predictedDelayDays = overdueTasks.length * 1.5 + (safetyIncidentCount * 2);
        const delayProbability = Math.min(100, (overdueTasks.length / tasks.length) * 100 + (safetyIncidentCount * 5));

        return {
            delayProbability: Math.round(delayProbability),
            predictedDelayDays: Math.round(predictedDelayDays),
            reasoning: "Statistical analysis based on current overdue tasks and safety record.",
            riskFactors: overdueTasks.length > 0 ? ["Overdue Tasks"] : [],
            analyzedAt: new Date().toISOString()
        };
    }
}

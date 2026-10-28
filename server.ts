import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini AI client with telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/gemini/chat
// Natural language data analyst chat grounded in deterministic computed stats
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { question, datasetMeta, computedStats, sampleRows, history } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in server environment.',
      });
    }

    const systemInstruction = `You are "Datalytics AI", an elite Senior Data Analyst and Business Intelligence Advisor.
Your objective is to provide precise, actionable, and mathematically grounded answers about the user's dataset.

CRITICAL RULES:
1. Grounding: All numbers, metrics, averages, totals, and counts must be strictly derived from the provided computed statistics, aggregates, and data summary. NEVER invent, extrapolate, or hallucinate missing data or values.
2. Measured vs Explanatory: Always distinguish strictly measured findings (e.g., "North region revenue was $45,200") from business interpretations or hypotheses (e.g., "This could indicate strong seasonal demand...").
3. Missing Information: If the dataset does not contain columns or records needed to answer the question, explicitly explain what is missing.
4. Structure & Polish: Use clean markdown with clear headers, bold metrics, bullet points, and concise key takeaways. Avoid long rambles.
5. Tone: Objective, authoritative, business-focused, and friendly.`;

    const userPrompt = `DATASET METADATA:
- Name: ${datasetMeta?.name || 'Uploaded Dataset'}
- Total Rows: ${datasetMeta?.rowCount ?? 'Unknown'}
- Total Columns: ${datasetMeta?.columnCount ?? 'Unknown'}
- Columns & Types: ${JSON.stringify(datasetMeta?.columns || [])}

DETERMINISTIC COMPUTED AGGREGATES & STATISTICS:
${JSON.stringify(computedStats || {}, null, 2)}

SAMPLE REPRESENTATIVE ROWS (first few rows for format context):
${JSON.stringify(sampleRows || [], null, 2)}

CONVERSATION CONTEXT / RECENT HISTORY:
${(history || []).map((h: { role: string; content: string }) => `${h.role === 'user' ? 'User' : 'Analyst'}: ${h.content}`).join('\n')}

USER QUESTION:
"${question}"

Provide a comprehensive, factual answer based on the computed data above. If applicable, recommend 2-3 brief follow-up questions the user might want to explore next.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for high analytical accuracy
      },
    });

    const replyText = response.text || 'Unable to generate an analysis response.';
    return res.json({ reply: replyText });
  } catch (err: any) {
    console.error('Error in /api/gemini/chat:', err);
    return res.status(500).json({
      error: err.message || 'An error occurred while analyzing the dataset.',
    });
  }
});

// POST /api/gemini/insights
// Generates an Executive Briefing: Key Findings, Trends, Anomalies/Risks, Recommendations
app.post('/api/gemini/insights', async (req: Request, res: Response) => {
  try {
    const { datasetMeta, numericStats, categoricalStats, qualityReport, correlations } = req.body;

    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in server environment.',
      });
    }

    const systemInstruction = `You are a Principal Data Scientist and Executive Strategic Consultant.
Generate an Executive Analytics Briefing based strictly on the computed mathematical statistics provided.

You must output in structured format:
1. Executive Summary (2-3 sentences high-level synthesis)
2. Key Measured Findings (3-5 bullet points with exact metrics, totals, distributions)
3. Trends & Segment Insights (patterns identified in categories, dates, or numeric relationships)
4. Data Quality & Risk Factors (missing values, skewed outliers, anomalies discovered)
5. Strategic Recommendations & Action Items (concrete business decisions or next steps based on the findings)
6. Analysis Limitations & Uncertainty (variables not captured, sample constraints)

Format cleanly in Markdown with bold key metrics. Never invent any numbers not present in the stats.`;

    const prompt = `DATASET METADATA:
Name: ${datasetMeta?.name || 'Dataset'}
Total Rows: ${datasetMeta?.rowCount}
Total Columns: ${datasetMeta?.columnCount}
Columns: ${JSON.stringify(datasetMeta?.columns || [])}

NUMERIC SUMMARY STATISTICS:
${JSON.stringify(numericStats || {}, null, 2)}

CATEGORICAL DISTRIBUTIONS & TOP FREQUENCIES:
${JSON.stringify(categoricalStats || {}, null, 2)}

DATA QUALITY ASSESSMENT:
${JSON.stringify(qualityReport || {}, null, 2)}

CORRELATION & SEGMENT METRICS:
${JSON.stringify(correlations || {}, null, 2)}

Generate the executive analytics report now.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const markdown = response.text || 'No insights could be generated.';
    return res.json({ insights: markdown });
  } catch (err: any) {
    console.error('Error in /api/gemini/insights:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate executive insights.',
    });
  }
});

// POST /api/gemini/suggest-questions
// Generates intelligent, dataset-specific sample questions
app.post('/api/gemini/suggest-questions', async (req: Request, res: Response) => {
  try {
    const { datasetMeta, topNumericCols, topCategoryCols } = req.body;

    if (!apiKey) {
      return res.json({
        questions: [
          'What are the key statistical highlights in this dataset?',
          'Which category represents the largest share?',
          'Are there any notable outliers or missing records?',
          'What trends appear over time or across segments?',
        ],
      });
    }

    const prompt = `Given a dataset named "${datasetMeta?.name || 'Dataset'}" with ${datasetMeta?.rowCount} rows and columns:
${JSON.stringify(datasetMeta?.columns || [])}
Numeric columns: ${JSON.stringify(topNumericCols || [])}
Categorical columns: ${JSON.stringify(topCategoryCols || [])}

Suggest 4 to 5 concise, high-value, highly specific business and analytical questions that a user should ask about this specific data.
Format your output as a simple JSON array of strings, e.g. ["Question 1?", "Question 2?", ...]
Output ONLY the raw JSON array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    });

    let questions: string[] = [];
    try {
      questions = JSON.parse(response.text?.trim() || '[]');
    } catch {
      questions = [
        'Which category generates the highest total value?',
        'What is the distribution of the primary numeric metrics?',
        'Are there any anomalies or quality issues?',
        'How do metrics vary across different segments?',
      ];
    }

    return res.json({ questions });
  } catch (err: any) {
    console.error('Error in /api/gemini/suggest-questions:', err);
    return res.json({
      questions: [
        'Which category has the highest total performance?',
        'What is the distribution and average across key metrics?',
        'Are there any missing values or unusual records?',
        'What are the most significant trends in this dataset?',
      ],
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Datalytics AI server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

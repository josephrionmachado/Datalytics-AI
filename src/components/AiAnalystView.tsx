import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Copy,
  Check,
  FileSpreadsheet,
  Calculator,
  RefreshCw,
  Lightbulb,
  Database,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Dataset, ChatMessage } from '../types/data';
import { computeDeterministicInsights } from '../utils/dataProcessor';

interface AiAnalystViewProps {
  dataset: Dataset | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
  initialPrompt?: string;
}

export const AiAnalystView: React.FC<AiAnalystViewProps> = ({
  dataset,
  onOpenUpload,
  onLoadSample,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestedQuestions] = useState<string[]>([
    'Which category has the highest total sales or revenue?',
    'What is the monthly revenue trend over time?',
    'Which region performs best overall?',
    'Are there any unusual values or data quality issues?',
    'Summarize the most important findings and top drivers.',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (dataset) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I am your **Datalytics AI Analyst**. I have indexed **${dataset.name}** (${dataset.rowCount.toLocaleString()} rows, ${dataset.columnCount} columns).\n\nAll numerical conclusions are computed strictly using deterministic aggregations before interpretation. Select a suggested topic or ask any specific question.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [dataset?.id]);

  // If initialPrompt provided, auto send
  useEffect(() => {
    if (initialPrompt && dataset) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading || !dataset) return;

    const userMsgId = `user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const computedStats = computeDeterministicInsights(dataset, query);
      const sampleRows = dataset.rows.slice(0, 5);

      const datasetMeta = {
        name: dataset.name,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        columns: dataset.columns.map((c) => ({ name: c.name, type: c.type })),
      };

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          datasetMeta,
          computedStats,
          sampleRows,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No analysis could be completed for this query.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('AI Analyst chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        isError: true,
        content: `**Analysis Error:** ${err.message || 'Unable to connect to AI analysis engine.'}\n\nPlease verify that your server is running and your Gemini API credentials are valid.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!dataset) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
          <Bot className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">AI Data Analyst</h3>
        <p className="text-xs text-slate-500">
          Upload a CSV or load the sample sales data to start an interactive question-and-answer session.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={onOpenUpload}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
          >
            Upload CSV
          </button>
          <button
            onClick={onLoadSample}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Load Sample Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-8.5rem)] grid grid-cols-1 lg:grid-cols-12 gap-4 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* BENTO SIDEBAR PANEL (Span 4 Cols on Large)                     */}
      {/* ============================================================== */}
      <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 overflow-y-auto">
        {/* Bento Cell 1: Grounding telemetry */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Grounding Context
            </h3>
            <span className="text-[10px] font-mono font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Deterministic Core
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Target Dataset:</span>
              <span className="font-semibold text-slate-900 font-mono truncate max-w-[140px]">
                {dataset.name}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Verified Records:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {dataset.rowCount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Schema Columns:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {dataset.columnCount}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Health Score:</span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {dataset.quality.healthScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Bento Cell 2: Quick Prompts Bank */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex-1 flex flex-col space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Suggested Questions
            </h3>
          </div>

          <div className="space-y-2 flex-1">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/80 hover:text-indigo-900 text-slate-700 border border-slate-200/80 text-xs font-medium transition flex items-center justify-between group disabled:opacity-50 cursor-pointer"
              >
                <span className="leading-snug">{q}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition shrink-0 ml-1.5" />
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Click any question to compute exact metrics and query Gemini.
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BENTO CHAT CONSOLE (Span 8 Cols on Large)                      */}
      {/* ============================================================== */}
      <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-[#00ffd7] flex items-center justify-center font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Datalytics AI Analyst</div>
              <div className="text-[11px] text-slate-500">
                Grounded calculations · Zero hallucination
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setMessages([
                {
                  id: `reset_${Date.now()}`,
                  role: 'assistant',
                  content: `Conversation reset. Ready for new questions about **${dataset.name}**.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }}
            className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            title="Clear conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-slate-800 text-white'
                      : msg.isError
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-slate-950 text-[#00ffd7]'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`rounded-2xl p-4 text-xs leading-relaxed group relative shadow-2xs ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : msg.isError
                      ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap space-y-2">{msg.content}</div>

                  <div
                    className={`mt-2 flex items-center justify-between text-[10px] pt-1.5 border-t ${
                      isUser ? 'border-slate-800 text-slate-400' : 'border-slate-200/60 text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-xl mr-auto">
              <div className="w-7 h-7 rounded-lg bg-slate-950 text-[#00ffd7] flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-50 text-slate-700 border border-slate-200/80 rounded-2xl rounded-tl-xs p-3.5 text-xs flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-[#00ffd7] rounded-full animate-spin" />
                <span className="font-medium text-slate-600">
                  Computing deterministic stats & querying Gemini...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              placeholder="Ask about highest categories, trends, outliers, or drivers..."
              className="flex-1 text-xs px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#00ffd7] focus:border-[#00ffd7] focus:bg-white text-slate-900 transition disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="p-2.5 rounded-xl bg-[#00ffd7] hover:bg-[#00ffd7]/90 text-slate-950 shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

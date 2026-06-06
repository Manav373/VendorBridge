import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, User, MessageSquare, ChevronDown } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export function AIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your VendorBridge AI Procurement Assistant. I analyze quotations, assess vendor risks, track approval bottlenecks, and scan for cost-saving opportunities. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested Prompts
  const suggestedPrompts = [
    { text: 'Who is the recommended vendor for office furniture?', query: 'office furniture' },
    { text: 'Analyze procurement risk factors', query: 'risk factors' },
    { text: 'Identify Q3 cost saving opportunities', query: 'saving' },
    { text: 'Show approval timeline bottlenecks', query: 'approvals' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      let aiResponseText = '';
      const query = textToSend.toLowerCase();

      if (query.includes('furniture') || query.includes('office') || query.includes('qt-2025-001')) {
        aiResponseText = `Based on my multi-objective evaluation of **RFQ-2025-001 (Office Furniture)**:
* **Recommendation:** **Infra Supplies Pvt Ltd (QT-2025-001)** is highly recommended (Score: **91/100**).
* **Cost Factor:** Saves **10% ($26,500)** compared to the maximum bid ($265,000, Global Furniture).
* **Delivery Factor:** Delivered in 15 days, leaving a 7-day safety buffer before the June 15th deadline.
* **Alternative Option:** If delivery speed is the absolute priority, **Global Furniture Co (QT-2025-002)** delivers in 10 days but at a **11% cost premium**.`;
      } else if (query.includes('risk') || query.includes('warning') || query.includes('alert')) {
        aiResponseText = `I have detected **3 procurement risk items** requiring attention:
1. **Critical Timeline Risk (High):** **Office Depot Pro (QT-2025-003)** quoted a 20-day delivery. With the RFQ deadline on June 15th, there is a risk margin of less than 48 hours for unexpected delays.
2. **Budget Threshold Risk (Medium):** **Global Furniture Co (QT-2025-002)** bid is **$265,000**, which exceeds the internal estimated procurement reference budget by **6% ($15,000)**.
3. **Contract SLA Risk (Low):** **Office Depot Pro** manages its warranty claims via third-party providers. Compliance audit recommended.`;
      } else if (query.includes('save') || query.includes('opportunity') || query.includes('cost') || query.includes('discount')) {
        aiResponseText = `Here are the top **Cost Saving Opportunities** analyzed for Q3:
* **IT Purchase Consolidation:** Consolidating standard PC/laptop refresh orders between *Infra Supplies* & *TechCore* into a single volume contract can secure a **12% volume discount**, saving an estimated **$38,400**.
* **Stationery Contract Renegotiation:** *Office Depot Pro* contract is expiring. Historic audit reports indicate we can renegotiate a **5% price reduction** based on higher yearly procurement value.`;
      } else if (query.includes('approval') || query.includes('bottleneck') || query.includes('timeline') || query.includes('delay')) {
        aiResponseText = `According to historical approval cycle logs:
* **Workflow Congestion:** The **Legal Review** and **CEO Office** steps account for **66% ($38.5 hours)** of total approval duration.
* **Optimization Action:** Implementing pre-approved template agreements for standard purchase orders under **$50,000** would bypass Legal Review, reducing total cycle time by **42%**.`;
      } else {
        aiResponseText = `I can help you review bids and optimize procurement. Here are some queries you can try:
* *"Who is the recommended vendor for office furniture?"*
* *"Analyze procurement risk factors"*
* *"Identify Q3 cost saving opportunities"*
* *"Show approval timeline bottlenecks"*`;
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-[0_8px_32px_0_rgba(16,185,129,0.3)] hover:bg-emerald-500 transition-all duration-300 z-50 border border-emerald-400/30 active:scale-95 group"
        aria-label="AI Assistant"
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6 transition-transform duration-300 rotate-180" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-emerald-600 animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] sm:w-[420px] max-h-[580px] h-[80vh] bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-[0_12px_40px_0_rgba(0,0,0,0.5)] flex flex-col z-50 overflow-hidden animate-slide-in">
          {/* Header */}
          <div className="p-4 bg-emerald-950/40 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  VendorBridge AI Assistant
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/20" />
                </h3>
                <p className="text-[10px] text-emerald-400/80 font-medium">Copilot Agent active</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const isAI = msg.sender === 'ai';
              return (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center border text-xs ${
                    isAI ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400' : 'bg-blue-500/15 border-blue-500/25 text-blue-400'
                  }`}>
                    {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                    isAI
                      ? 'bg-muted/30 border-border/40 text-foreground rounded-tl-none'
                      : 'bg-emerald-600/10 border-emerald-500/30 text-foreground rounded-tr-none'
                  }`}>
                    {/* Simplified markdown formatter for response bullets */}
                    {msg.text.split('\n').map((line, lIdx) => {
                      if (line.startsWith('* **') || line.startsWith('1. **') || line.startsWith('2. **') || line.startsWith('3. **')) {
                        // Bold formatting
                        const parts = line.split('**');
                        return (
                          <p key={lIdx} className="mb-1">
                            {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-emerald-400 font-bold">{p}</strong> : p)}
                          </p>
                        );
                      }
                      if (line.startsWith('* ') || line.startsWith('- ')) {
                        return <p key={lIdx} className="pl-3 mb-1 select-none text-muted-foreground">• {line.substring(2)}</p>;
                      }
                      return <p key={lIdx} className={line ? 'mb-2' : ''}>{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}

            {/* Typing Loader */}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-muted/30 border border-border/40 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts List */}
          {messages.length === 1 && !isTyping && (
            <div className="px-4 py-2 border-t border-border/40 space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Suggested Prompts</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt.text)}
                    className="text-[10px] font-medium text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30 border border-border/60 bg-muted/20 px-2.5 py-1.5 rounded-lg text-left transition-all max-w-full truncate"
                  >
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input */}
          <div className="p-3 border-t border-border/60 bg-muted/10 flex gap-2">
            <input
              type="text"
              placeholder="Ask AI Assistant..."
              className="flex-1 bg-input border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend(input);
              }}
            />
            <button
              onClick={() => handleSend(input)}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 transition-colors shadow-md shadow-emerald-950/20 active:scale-95 flex items-center justify-center w-8.5 h-8.5"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

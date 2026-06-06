import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, Bot, User, Check, GitCommit, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const COPILOT_SUGGESTIONS = [
  { text: 'Explain score for Rahul', key: 'explain_rahul' },
  { text: 'Compare Rahul vs Rohan', key: 'compare_candidates' },
  { text: 'Show top candidates', key: 'top_candidates' },
  { text: 'Draft interview questions', key: 'draft_questions' }
];

const COPILOT_RESPONSES = {
  explain_rahul: `### AI Score Analysis: Rahul (87%)

**Rahul** is a **Strong Match** for the Senior Frontend Engineer position. Here is the scoring reasoning breakdown:

* **Core Skills (92% match)**: Possesses advanced experience in React.js, Node.js, and state management.
* **Relevant Projects**: Built responsive dashboards with complex data grids.
* **Risk Factor**: Has a 10-month employment gap in 2024 (indicated as self-study and open-source contributions).
* **Missing stack**: Lacks Kubernetes and AWS cloud deployments.

**Recommendation**: Proceed to Technical Interview round. Focus questions on system design and deployment practices.`,

  compare_candidates: `### Candidate Comparison: Rahul (87%) vs Rohan (72%)

| Feature | Rahul (87%) | Rohan (72%) |
| :--- | :--- | :--- |
| **Primary Stack** | React, Python, FastAPI | React, Node, SQL |
| **Experience** | 5+ Years (Mid-Senior) | 3 Years (Mid) |
| **Strengths** | FastAPI backend integration, system design | Front-end animations, UI polish |
| **Key Gaps** | Cloud Deployments (K8s, AWS) | Deep API architecture, MySQL |
| **AI Assessment** | Ready for Senior technical interviews | Good match for Mid-level Frontend role |

**AI Decision**: **Rahul** is the stronger match for the Senior lead position due to advanced system architecture experience.`,

  top_candidates: `### Top Evaluated Candidates (AI Ranked)

Based on evaluated resume matching scores:

1. **Rahul** (87%) — *Hiring Recommendation: Strong Match*. Exceptional React & Python/FastAPI skills.
2. **Karan** (85%) — *Hiring Recommendation: Strong Match*. Excellent database structures & Django developer.
3. **Priya** (76%) — *Hiring Recommendation: Good Match*. Strong HTML/CSS/React capabilities, slightly junior backend knowledge.
4. **Rohan** (72%) — *Hiring Recommendation: Potential Fit*. Creative UI/JS skills, lacks SQL/API design depth.`,

  draft_questions: `### AI Generated Technical Interview Guide: Front-End

Based on the core missing skill tags identified in evaluations (Kubernetes, AWS, API Design):

1. **Reconciliation & Key Prop**: *"Explain the Virtual DOM reconciliation process in React and how the key prop affects list re-rendering."*
2. **Cache Synchronization**: *"How do caching libraries like TanStack Query handle server-state synchronizations compared to traditional Redux state?"*
3. **Deployment Scaling**: *"Although you focus on front-end, describe how you would bundle and containerize a React SPA using Docker for Kubernetes deployments."*`
};

export function CopilotPanel({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am your AegisHire Recruitment Copilot. Ask me to compare candidates, summarize match scores, or draft interview guides.'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMsgId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: text }
    ]);
    setInputValue('');
    setIsTyping(true);

    // Find response or default
    const matchedKey = Object.keys(COPILOT_RESPONSES).find(key => 
      text.toLowerCase().includes(key.replace('_', ' ').replace('candidates', '').trim()) || 
      text.toLowerCase().includes(key.split('_')[0]) ||
      text.toLowerCase().includes(key.split('_')[1])
    );

    const replyText = matchedKey 
      ? COPILOT_RESPONSES[matchedKey] 
      : `I parsed your query: "${text}". \n\nI can analyze candidates, job requirements, and evaluation matrices. Try clicking one of the predefined quick actions above for detailed analysis.`;

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'bot', text: replyText }
      ]);
    }, 1200);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied text to clipboard');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible Backdrop to close on outer click */}
          <div className="fixed inset-0 z-40" onClick={onClose} />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[460px] bg-[#0c1622] border-l border-[#1b2b3a] shadow-2xl z-50 flex flex-col text-slate-200 overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#1b2b3a] flex items-center justify-between bg-[#08101a]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#3B82F6] animate-pulse" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">AI Recruiter Copilot</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#1b2b3a]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Suggestions Bar */}
            <div className="p-3 border-b border-[#1b2b3a] bg-[#08101a]/50">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2 block">Quick Actions</span>
              <div className="flex flex-wrap gap-1.5">
                {COPILOT_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug.key}
                    onClick={() => handleSend(sug.text)}
                    className="text-[10px] bg-[#11243b] hover:bg-[#1a385b] border border-[#1b2b3a] text-[#3B82F6] font-semibold py-1 px-2.5 rounded-full transition-all duration-200"
                  >
                    {sug.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a1420]/30 thin-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'bot' && (
                    <div className="h-8 w-8 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/25 flex items-center justify-center flex-shrink-0 text-[#3B82F6]">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] rounded-xl p-3 border text-xs leading-relaxed relative group ${
                    msg.sender === 'user'
                      ? 'bg-[#1b3453] border-[#294c77] text-white rounded-tr-none'
                      : 'bg-[#112030] border-[#1b2b3a] text-slate-300 rounded-tl-none'
                  }`}>
                    {/* Copy Button for bot responses */}
                    {msg.sender === 'bot' && (
                      <button
                        onClick={() => copyToClipboard(msg.text)}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white"
                        title="Copy Response"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                    
                    {/* Render Formatted Markdown Block (Simplified) */}
                    <div className="space-y-2 whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="h-8 w-8 rounded-lg bg-[#11243b] border border-[#1b2b3a] flex items-center justify-center flex-shrink-0 text-[#3B82F6]">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/25 flex items-center justify-center flex-shrink-0 text-[#3B82F6]">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-[#112030] border border-[#1b2b3a] rounded-xl rounded-tl-none p-3 text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="p-3 border-t border-[#1b2b3a] bg-[#08101a] flex gap-2"
            >
              <Input
                placeholder="Ask Copilot a question..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-[#112030] border-[#1b2b3a] text-xs text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:border-[#3B82F6]"
              />
              <Button
                type="submit"
                size="icon"
                className="bg-[#3B82F6] hover:bg-accent/90 text-[#0a1727] h-8 w-8 rounded-lg flex-shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CopilotPanel;

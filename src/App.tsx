/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  GraduationCap, 
  BookOpen, 
  MapPin, 
  Info, 
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getChatResponse } from './lib/gemini';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { ScrollArea } from './components/ui/scroll-area';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Separator } from './components/ui/separator';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { icon: GraduationCap, label: "Admissions", query: "Tell me about B.Tech admissions" },
  { icon: BookOpen, label: "Courses", query: "What courses are offered at TIOT?" },
  { icon: MapPin, label: "Campus Life", query: "What is campus life like at TIOT?" },
  { icon: Info, label: "Scholarships", query: "Are there any scholarships available?" },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm the TIOT Assistant. How can I help you today? You can ask me about admissions, courses, or campus life at TIOT.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await getChatResponse(text, history);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Institute Info */}
      <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">
            T
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-slate-900">TIOT</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Institute of Technology</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Quick Inquiries</h2>
          <div className="grid gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.label}
                variant="ghost"
                className="justify-start gap-3 h-11 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                onClick={() => handleSend(action.query)}
              >
                <action.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{action.label}</span>
                <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6">
          <Card className="bg-blue-600 text-white p-4 border-none shadow-xl shadow-blue-100 relative overflow-hidden group">
            <Sparkles className="absolute -right-2 -top-2 w-16 h-16 opacity-10 group-hover:rotate-12 transition-transform duration-500" />
            <p className="text-xs font-medium opacity-80 mb-1">Admissions Open</p>
            <p className="text-sm font-bold mb-3">Batch 2026-27</p>
            <Button size="sm" variant="secondary" className="w-full text-xs font-bold bg-white text-blue-600 hover:bg-slate-100">
              Apply Now
            </Button>
          </Card>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-80px)] md:h-screen relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-8 h-8 border-2 border-blue-100">
                <AvatarFallback className="bg-blue-600 text-white text-xs">AI</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">TIOT Support Bot</h2>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Always Online</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold text-slate-400 border-slate-200">
            v1.0.4
          </Badge>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 md:p-8" viewportRef={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className={`w-8 h-8 shrink-0 ${message.role === 'user' ? 'border-2 border-blue-200' : 'border-2 border-slate-100'}`}>
                    {message.role === 'user' ? (
                      <AvatarFallback className="bg-slate-200 text-slate-600"><User className="w-4 h-4" /></AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-blue-600 text-white"><Bot className="w-4 h-4" /></AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className={`flex flex-col gap-1 max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}>
                      <div className="markdown-body">
                        <ReactMarkdown>{message.text}</ReactMarkdown>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium px-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <Avatar className="w-8 h-8 shrink-0 border-2 border-slate-100">
                  <AvatarFallback className="bg-blue-600 text-white"><Bot className="w-4 h-4" /></AvatarFallback>
                </Avatar>
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-xs font-medium text-slate-400">Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto relative">
            <Input
              placeholder="Ask about admissions, courses, hostels..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="pr-12 h-12 rounded-xl border-slate-200 focus-visible:ring-blue-600 focus-visible:border-blue-600 shadow-sm"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 top-1.5 w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
            AI-powered assistant for TIOT students. Responses may vary.
          </p>
        </div>
      </main>
    </div>
  );
}


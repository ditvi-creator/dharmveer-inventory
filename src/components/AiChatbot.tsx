import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, MicOff, Send, X, MessageSquare, Loader2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { StockItem } from '../types';
import { toast } from 'sonner';

interface AiChatbotProps {
  items: StockItem[];
  onOpenAddItem: () => void;
  onPageChange: (page: 'dashboard' | 'settings' | 'analytics' | 'profile') => void;
  onToggleTheme: (theme: 'light' | 'dark') => void;
}

interface Message {
  role: 'user' | 'model';
  content: string;
  isAction?: boolean;
}

export const AiChatbot: React.FC<AiChatbotProps> = ({ 
  items, 
  onOpenAddItem, 
  onPageChange, 
  onToggleTheme 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I'm your AI Inventory Assistant. You can ask me about stock balances, bookings, or tell me to perform actions like opening the 'Add Item' box or switching to dark mode." }
  ]);
  const [loading, setLoading] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check for API key on mount
  useEffect(() => {
    if (!process.env.GEMINI_API_KEY) {
      toast.error('Gemini API key is not set. Please add it in Settings > Secrets.', {
        duration: 5000,
      });
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission denied.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is missing from environment. Please set GEMINI_API_KEY in Secrets.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const functionDeclarations: FunctionDeclaration[] = [
        {
          name: "get_stock_balance",
          description: "Get the current balance of a specific stock item",
          parameters: {
            type: Type.OBJECT,
            properties: {
              item_name: { type: Type.STRING, description: "The name of the item to check" }
            },
            required: ["item_name"]
          }
        },
        {
          name: "get_item_bookings",
          description: "Get details of parties who have booked a particular item and the quantities they booked",
          parameters: {
            type: Type.OBJECT,
            properties: {
              item_name: { type: Type.STRING, description: "The name of the item to check bookings for" }
            },
            required: ["item_name"]
          }
        },
        {
          name: "open_ui_component",
          description: "Open a specific part of the application UI",
          parameters: {
            type: Type.OBJECT,
            properties: {
              component: { 
                type: Type.STRING, 
                enum: ["add_item", "settings", "analytics", "dashboard", "profile"],
                description: "The UI component or page to open" 
              }
            },
            required: ["component"]
          }
        },
        {
          name: "set_theme",
          description: "Change the application theme to dark or light mode",
          parameters: {
            type: Type.OBJECT,
            properties: {
              mode: { type: Type.STRING, enum: ["dark", "light"], description: "The theme mode to set" }
            },
            required: ["mode"]
          }
        }
      ];

      // Important: Gemini conversation must start with a 'user' role.
      // We skip the initial model greeting message in the history.
      const history = messages
        .filter((m, i) => i > 0 || m.role === 'user')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

      const result = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [
          ...history,
          { role: 'user', parts: [{ text }] }
        ],
        config: {
          systemInstruction: `You are an AI Inventory Assistant. You help users manage their stock and navigate the app.
          Use the provided functions to get data from the inventory or perform UI actions.
          The current inventory has ${items.length} items.
          If the user asks about a specific item, use the get_stock_balance or get_item_bookings functions.
          If multiple items match a name roughly, you can mention them in your response.
          Be professional, concise, and helpful.`,
          tools: [{ functionDeclarations }]
        }
      });
      
      let finalContent = result.text || "";
      const calls = result.functionCalls;

      if (calls) {
        for (const call of calls) {
          if (call.name === 'get_stock_balance') {
            const itemName = (call.args as any).item_name.toLowerCase();
            const matchingItems = items.filter(i => i.name.toLowerCase().includes(itemName));
            if (matchingItems.length === 0) {
              finalContent += `\nI couldn't find any item named "${itemName}" in the inventory.`;
            } else {
              matchingItems.forEach(item => {
                finalContent += `\nThe current balance for ${item.name} (${item.size}) is ${item.balance} ${item.unit || 'BOX'}.`;
              });
            }
          } else if (call.name === 'get_item_bookings') {
            const itemName = (call.args as any).item_name.toLowerCase();
            const matchingItems = items.filter(i => i.name.toLowerCase().includes(itemName));
            if (matchingItems.length === 0) {
              finalContent += `\nI couldn't find any item named "${itemName}" to check bookings for.`;
            } else {
              matchingItems.forEach(item => {
                const bookings = item.bookings || [];
                if (bookings.length === 0) {
                  finalContent += `\nThere are no bookings for ${item.name}.`;
                } else {
                  finalContent += `\nBookings for ${item.name}:`;
                  bookings.forEach(b => {
                    finalContent += `\n- ${b.partyName}: ${b.qty} units`;
                  });
                }
              });
            }
          } else if (call.name === 'open_ui_component') {
            const comp = (call.args as any).component;
            if (comp === 'add_item') {
              onOpenAddItem();
              finalContent += "\nOpening the 'Add Item' dialog for you.";
            } else {
              onPageChange(comp);
              finalContent += `\nSwitching to the ${comp} page.`;
            }
          } else if (call.name === 'set_theme') {
            const mode = (call.args as any).mode;
            onToggleTheme(mode);
            finalContent += `\nSwitching the theme to ${mode} mode.`;
          }
        }
      }

      const modelMessage: Message = { role: 'model', content: finalContent || "I've performed the requested action." };
      setMessages(prev => [...prev, modelMessage]);

      if (speechEnabled && finalContent) {
        speak(finalContent);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('AI error. Please check your Gemini API key.');
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I've encountered an error processing that request." }]);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-[400px] max-w-[90vw] h-[600px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-linear-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Inventory AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title={speechEnabled ? "Mute" : "Unmute"}
                >
                  {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm font-medium ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="relative flex items-center gap-2">
                <button
                  onClick={toggleListening}
                  className={`p-3 rounded-xl transition-all ${
                    isListening 
                      ? 'bg-red-100 text-red-600 animate-pulse' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title="Talk to me"
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                  placeholder="Ask something..."
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
                />
                <button
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3 px-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Powered by Gemini AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center text-white relative group"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-gray-950 rounded-full" />
      </motion.button>
    </div>
  );
};

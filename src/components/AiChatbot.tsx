import React, { useState, useEffect, useRef } from 'react';
import { Bot, Mic, MicOff, Send, X, MessageSquare, Loader2, Sparkles, Volume2, VolumeX, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
        } else if (event.error === 'network') {
          toast.error('Network error during speech recognition.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Update recognition language if user changes it or we detect it
  // For now, let's just use the browser's language as default
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = navigator.language || 'en-US';
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      // Ensure we use the latest browser language
      if (recognitionRef.current) {
        recognitionRef.current.lang = navigator.language || 'en-US';
      }
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
      const history = messages
        .filter((m, i) => i > 0 || m.role === 'user')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history,
          systemInstruction: `You are an AI Inventory Assistant for a business management app. 
          You help users manage stock, check bookings, and navigate the app UI.
          
          MULTILINGUAL SUPPORT:
          - You can understand and respond in ANY language (Hindi, English, Spanish, etc.).
          - ALWAYS respond in the SAME language the user used to speak or type.
          
          INVENTORY CONTEXT:
          - The current inventory has ${items.length} items.
          - Items often have names, sizes, balances, and bookings.
          - If a user asks "what is the balance of X", use get_stock_balance.
          - If a user asks "booked party name for X", use get_item_bookings.
          - If you find multiple matching items, list them all clearly.
          
          UI ACTIONS:
          - If a user says "open add item box" or "add new item", use open_ui_component(component="add_item").
          - If a user says "switch to dark mode", use set_theme(mode="dark").
          
          PERSONALITY:
          - Be professional, warm, and helpful.
          - Keep answers concise for a chat interface.`,
          tools: [
            { 
              functionDeclarations: [
                {
                  name: "get_stock_balance",
                  description: "Get the current balance and size of a specific stock item. Use this when the user asks 'what is the balance of X' or 'how many of X is left'.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      item_name: { type: "STRING", description: "The name of the item to check" }
                    },
                    required: ["item_name"]
                  }
                },
                {
                  name: "get_item_bookings",
                  description: "Get details of parties who have booked a particular item and the quantities they booked. Use this when the user asks 'who booked X' or 'party name for X'.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      item_name: { type: "STRING", description: "The name of the item to check bookings for" }
                    },
                    required: ["item_name"]
                  }
                },
                {
                  name: "open_ui_component",
                  description: "Open a specific part of the application UI like the add item box, settings, or analytics page.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      component: { 
                        type: "STRING", 
                        enum: ["add_item", "settings", "analytics", "dashboard", "profile"],
                        description: "The UI component or page to open" 
                      }
                    },
                    required: ["component"]
                  }
                },
                {
                  name: "set_theme",
                  description: "Change the application theme to dark or light mode.",
                  parameters: {
                    type: "OBJECT",
                    properties: {
                      mode: { type: "STRING", enum: ["dark", "light"], description: "The theme mode to set" }
                    },
                    required: ["mode"]
                  }
                }
              ]
            }
          ]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI assistant');
      }

      const data = await response.json();
      let finalContent = data.text || "";
      const calls = data.functionCalls;

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
                    finalContent += `\n- Party: ${b.partyName}, Quantity: ${b.qty}`;
                  });
                }
              });
            }
          } else if (call.name === 'open_ui_component') {
            const comp = (call.args as any).component;
            if (comp === 'add_item') {
              onOpenAddItem();
              finalContent += "\nSure, I've opened the 'Add Item' box for you.";
            } else {
              onPageChange(comp);
              finalContent += `\nDone! Navigating to the ${comp} page.`;
            }
          } else if (call.name === 'set_theme') {
            const mode = (call.args as any).mode;
            onToggleTheme(mode);
            finalContent += `\nUnderstood. Switching to ${mode} mode.`;
          }
        }
      }

      const modelMessage: Message = { role: 'model', content: finalContent || "I've handled that for you." };
      setMessages(prev => [...prev, modelMessage]);

      if (speechEnabled && finalContent) {
        speak(finalContent);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      let errorMessage = "Sorry, I've encountered an error processing that request.";
      let showKeyButton = false;
      
      const errorStr = error.message || error.toString() || "";
      
      if (errorStr.includes('API key')) {
        errorMessage = 'AI error. Please check your Gemini API key in Secrets.';
        showKeyButton = true;
      } else if (errorStr.includes('PERMISSION_DENIED') || errorStr.includes('403')) {
        errorMessage = 'Permission denied. Please ensure your Gemini API key is valid and has billing enabled if required.';
        showKeyButton = true;
      } else if (errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('429')) {
        errorMessage = 'API quota exhausted. You can connect your own paid API key for higher limits using the key icon at the top.';
        showKeyButton = true;
      } else if (errorStr.includes('NOT_FOUND') || errorStr.includes('404')) {
        errorMessage = 'Model not found. Please check your Gemini API configuration.';
      }

      toast.error(errorMessage, {
        action: showKeyButton ? {
          label: 'Setup Key',
          onClick: () => (window as any).aistudio?.openSelectKey()
        } : undefined
      });
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a better, more natural human-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    
    // Priority: 1. Natural/Premium voices, 2. Google voices, 3. Any voice matching language
    // Try to match voice language to current browser language first
    const langMatch = navigator.language || 'en-US';
    
    let selectedVoice = voices.find(v => v.lang === langMatch && (v.name.includes('Natural') || v.name.includes('Neural')));
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith(langMatch.split('-')[0]) && v.name.includes('Google'));
    }
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith(langMatch.split('-')[0]));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
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
                  onClick={() => (window as any).aistudio?.openSelectKey()}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Connect API Key"
                >
                  <Key className="w-4 h-4" />
                </button>
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
                  className={`py-3 px-[10px] rounded-xl transition-all ${
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

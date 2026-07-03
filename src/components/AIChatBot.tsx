import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, User, MessageSquare, Send,
  HelpCircle, ArrowRight, Loader2, RefreshCw,
  Volume2, VolumeX, Mic, MicOff
} from 'lucide-react';
// @ts-ignore
import premiumAiIcon from '../assets/images/premium_ai_icon_1782547354655.jpg';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const STARTER_PROMPTS = [
  { label: '📦 How to add stock?', text: 'How do I add a new stock item in Stockify?' },
  { label: '💬 Contact Support', text: 'open contact support' },
  { label: '📊 Analytics Page', text: 'open analytics section' },
  { label: '⚙️ Settings Page', text: 'open settings' },
  { label: '📅 Bookings Dialog', text: 'open bookings dialogue' }
];

export const AIChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "👋 Hello! I am your Stockify AI Assistant. I am equipped with voice controls and instant commands.\n\nYou can say or type **'open settings'** to go to settings, **'open bookings dialogue'** to view active item bookings, or **'search item [name]'** to find stock immediately!\n\nHow can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Let's default to false (unmuted, will speak)
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Speech Recognition (Speech-to-Text) Initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        window.dispatchEvent(new CustomEvent('listening-state', { detail: { system: 'chatbot', isListening: true } }));
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(prev => {
            const cleanedPrev = prev.trim();
            return cleanedPrev ? `${cleanedPrev} ${transcript}` : transcript;
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        window.dispatchEvent(new CustomEvent('listening-state', { detail: { system: 'chatbot', isListening: false } }));
      };

      rec.onend = () => {
        setIsListening(false);
        window.dispatchEvent(new CustomEvent('listening-state', { detail: { system: 'chatbot', isListening: false } }));
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Text-To-Speech Output helper
  const speakText = (text: string) => {
    if (isMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // cancel any active speech first
      
      // Clean text from markdown bold, italic, list markers, and raw command tags
      const cleanText = text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/[-*]\s+/g, '')
        .replace(/\[COMMAND:[^\]]+\]/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Stop speaking when closed or muted
  useEffect(() => {
    if (!isOpen || isMuted) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen, isMuted]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser or environment.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Executes matched actions and strips COMMAND tags from AI's output
  const executeAndCleanCommands = (responseText: string) => {
    let cleanText = responseText;
    
    const settingsRegex = /\[COMMAND:\s*OPEN_SETTINGS\s*\]/gi;
    const bookingsRegex = /\[COMMAND:\s*OPEN_BOOKINGS\s*\]/gi;
    const helpRegex = /\[COMMAND:\s*OPEN_HELP\s*\]/gi;
    const analyticsRegex = /\[COMMAND:\s*OPEN_ANALYTICS\s*\]/gi;
    const dashboardRegex = /\[COMMAND:\s*OPEN_DASHBOARD\s*\]/gi;
    const profileRegex = /\[COMMAND:\s*OPEN_PROFILE\s*\]/gi;
    const contactRegex = /\[COMMAND:\s*OPEN_CONTACT\s*\]/gi;
    const searchRegex = /\[COMMAND:\s*SEARCH_ITEM:\s*([^\]]+)\]/gi;

    if (settingsRegex.test(responseText)) {
      window.dispatchEvent(new CustomEvent('chatbot-open-settings'));
      cleanText = cleanText.replace(settingsRegex, '');
    }
    if (bookingsRegex.test(responseText)) {
      window.dispatchEvent(new CustomEvent('chatbot-open-bookings'));
      cleanText = cleanText.replace(bookingsRegex, '');
    }
    if (helpRegex.test(responseText)) {
      window.dispatchEvent(new CustomEvent('chatbot-open-help'));
      cleanText = cleanText.replace(helpRegex, '');
    }
    if (analyticsRegex.test(responseText)) {
      window.dispatchEvent(new CustomEvent('chatbot-open-analytics'));
      cleanText = cleanText.replace(analyticsRegex, '');
    }
    if (dashboardRegex.test(responseText)) {
      window.dispatchEvent(new CustomEvent('chatbot-open-dashboard'));
      cleanText = cleanText.replace(dashboardRegex, '');
    }
    if (profileRegex.test(responseText)) {
      window.dispatchEvent(new CustomEvent('chatbot-open-profile'));
      cleanText = cleanText.replace(profileRegex, '');
    }
    if (contactRegex.test(responseText)) {
      window.dispatchEvent(new CustomEvent('chatbot-open-contact'));
      cleanText = cleanText.replace(contactRegex, '');
    }
    
    let searchMatch;
    // We use a clean loop to replace and trigger all search commands
    while ((searchMatch = searchRegex.exec(responseText)) !== null) {
      const query = searchMatch[1]?.trim();
      if (query) {
        window.dispatchEvent(new CustomEvent('chatbot-search-item', { detail: { query } }));
      }
    }
    cleanText = cleanText.replace(searchRegex, '');

    return cleanText.trim();
  };

  // Intercepts client-side user entries to trigger actions instantly
  const interceptLocalUserQuery = (text: string) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('open setting') || lowerText.includes('open settings') || lowerText.includes('go to settings')) {
      window.dispatchEvent(new CustomEvent('chatbot-open-settings'));
    } else if (lowerText.includes('open bookings') || lowerText.includes('open booking') || lowerText.includes('bookings dialogue') || lowerText.includes('bookings box')) {
      window.dispatchEvent(new CustomEvent('chatbot-open-bookings'));
    } else if (lowerText.includes('open help') || lowerText.includes('go to help') || lowerText.includes('help page') || lowerText.includes('help section') || lowerText.includes('tutorials') || lowerText.includes('faq')) {
      window.dispatchEvent(new CustomEvent('chatbot-open-help'));
    } else if (lowerText.includes('open analytics') || lowerText.includes('go to analytics') || lowerText.includes('analytics section') || lowerText.includes('charts') || lowerText.includes('reports') || lowerText.includes('valuation')) {
      window.dispatchEvent(new CustomEvent('chatbot-open-analytics'));
    } else if (lowerText.includes('open dashboard') || lowerText.includes('go to dashboard') || lowerText.includes('open home') || lowerText.includes('go to home') || lowerText.includes('stock list')) {
      window.dispatchEvent(new CustomEvent('chatbot-open-dashboard'));
    } else if (lowerText.includes('open profile') || lowerText.includes('go to profile') || lowerText.includes('my profile') || lowerText.includes('open account') || lowerText.includes('my account') || lowerText.includes('user profile')) {
      window.dispatchEvent(new CustomEvent('chatbot-open-profile'));
    } else if (lowerText.includes('contact support') || lowerText.includes('open support') || lowerText.includes('contact us') || lowerText.includes('open contact') || lowerText.includes('support team') || lowerText.includes('help desk')) {
      window.dispatchEvent(new CustomEvent('chatbot-open-contact'));
    } else if (lowerText.includes('search') || lowerText.includes('find') || lowerText.includes('details of') || lowerText.includes('detail of')) {
      let query = '';
      if (lowerText.includes('search item')) query = lowerText.split('search item')[1];
      else if (lowerText.includes('search for')) query = lowerText.split('search for')[1];
      else if (lowerText.includes('search')) query = lowerText.split('search')[1];
      else if (lowerText.includes('find item')) query = lowerText.split('find item')[1];
      else if (lowerText.includes('find')) query = lowerText.split('find')[1];
      else if (lowerText.includes('details of')) query = lowerText.split('details of')[1];
      else if (lowerText.includes('detail of')) query = lowerText.split('detail of')[1];
      
      query = (query || '').replace(/[?.,!]/g, '').trim();
      if (query) {
        window.dispatchEvent(new CustomEvent('chatbot-search-item', { detail: { query } }));
      }
    }
  };

  const handleSend = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text) return;

    // Check and trigger local commands instantly for faster response
    interceptLocalUserQuery(text);

    // Stop speaking user input or previous speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Add user message to state
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          systemInstruction: `You are the Stockify AI Assistant, a professional, friendly, and expert support companion for the Stockify web application.
Stockify is a cloud-native, high-performance Full-Stack Inventory Management suite.

IMPORTANT VOICE AND REDIRECT AUTOMATION GUIDELINES:
- If the user says "open settings" or asks to open/go to settings, include the instruction: [COMMAND:OPEN_SETTINGS] in your text reply and friendly say that you are opening it.
- If the user says "open bookings dialogue" or "open booking" or similar bookings dialogue query, include the instruction: [COMMAND:OPEN_BOOKINGS] in your text reply and say you are opening it.
- If the user asks to open/go to help, tutorials, or FAQ, include the instruction: [COMMAND:OPEN_HELP] in your text reply and say you are taking them there.
- If the user asks to open/go to analytics, charts, or reports, include the instruction: [COMMAND:OPEN_ANALYTICS] in your text reply and say you are showing them the charts.
- If the user asks to open/go to dashboard, home, or main list, include the instruction: [COMMAND:OPEN_DASHBOARD] in your text reply and say you are navigating to the main dashboard.
- If the user asks to open/go to user profile or account settings, include the instruction: [COMMAND:OPEN_PROFILE] in your text reply and say you are taking them to their profile.
- If the user says "open contact support", "contact us", "open contact us", "talk to support", or similar contact/support query, include the instruction: [COMMAND:OPEN_CONTACT] in your text reply and say you are opening the customer support form.
- If the user asks to find/search an item or asks for its details (e.g. "find item steel", "show details of hammer"), determine the search query and include [COMMAND:SEARCH_ITEM:item_name] (replace "item_name" with the actual search word) in your reply, and inform them you have found the matching items.

Keep your answers concise, clear, and highly practical. Use bold formatting and clean bullet points for readability.

Core features of Stockify that you know about:
1. **Real-time Inventory Tracking Dashboard**:
   - Access from the main screen.
   - Allows tracking materials across multiple godowns (physical warehouses).
   - Capture batch numbers, manufacturing dates, expiry dates, and packaging units.
   - Low stock warnings are color-coded in yellow/red when inventory falls below defined safety reorder thresholds.
   - Immediate search, sort, and godown filtering.

2. **Smart Delivery Challan Generation**:
   - Compiles formal shipping documents from active inventory records without double entry.
   - Simply click the "Challan" button on any inventory row to open the form.
   - Pre-fills material details, quantities, and batch codes.
   - Custom fields for Recipient Details, Dispatch Mode (e.g., Road, Air), Vehicle Number, and L.R./B.L. reference numbers.
   - Generates beautifully formatted delivery challans with standard terms and formal signature blocks. Supports clean printing or PDF export.

3. **Bulk Printable Barcodes & Storage Labels**:
   - Select multiple checkbox items on the main dashboard to display the floating blueprint bar, then click "Print Labels".
   - Generates high-resolution sticker grids with SVG barcodes/QR codes dynamically.
   - Custom templates, sizing configs, and custom branding headers.
   - Choose from 4 professional label styles: "Warehouse Tags", "Industrial Labels", "Specification Cards", and "Minimalist QR Tags".
   - Perfectly optimized for Avery multi-label sticker sheets.

4. **Bulk Updates & Smart Multi-Row Assignments**:
   - Allows users to re-assign categories, packaging units, and reorder levels for multiple items at once.
   - Check the items on the main dashboard, then click "Bulk Update" in the floating action bar.
   - Safely executed in a single atomic database batch (using secure Firestore writeBatch operations).

5. **Premium ₹90 Monthly Subscription**:
   - Flat rate of ₹90 per month.
   - Starts with a strict 72-hour free trial countdown shown prominently in the header banner.
   - Once trial ends, upgrading is required to unlock full access.
   - Secure and instant upgrade via GPay / PhonePe / UPI QR code.
   - Integrated with hands-free automated monthly auto-debit billing (no manual monthly renewals required).

Avoid mentioning technical jargon like "Firebase/Firestore", "Express", "Node.js", "React code" or internal paths. Focus on helping the user navigate and use Stockify features.`
        })
      });

      if (!response.ok) {
        let serverErrorMsg = 'Failed to get response from AI';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrorMsg = errData.error;
          }
        } catch (e) {
          // fallback to generic message if parsing failed
        }
        throw new Error(serverErrorMsg);
      }

      const data = await response.json();
      
      const rawText = data.text || "I am sorry, I couldn't formulate a response. Please try again.";
      
      // Execute the command in the response and clean up the COMMAND tag
      const cleanText = executeAndCleanCommands(rawText);
      
      setMessages(prev => [...prev, {
        role: 'model',
        content: cleanText
      }]);

      // Speak back response
      speakText(cleanText);

    } catch (err: any) {
      console.error(err);
      const isConfigError = err.message && (err.message.includes("GEMINI_API_KEY") || err.message.includes("not configured"));
      const errMessage = isConfigError 
        ? `⚠️ Error: ${err.message}`
        : "⚠️ Sorry, I'm having trouble connecting right now. Please check your internet connection or try again in a moment.";
      setMessages(prev => [...prev, {
        role: 'model',
        content: errMessage
      }]);
      speakText(isConfigError ? "API Key is not configured." : errMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'model',
        content: "👋 Hello again! Chat history cleared. What can I help you with today?"
      }
    ]);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-[92px] z-50">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white relative group focus:outline-none focus:ring-2 focus:ring-indigo-500/50 overflow-hidden animate-fadeIn"
          title="Stockify AI Chatbot"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <img 
              src={premiumAiIcon} 
              alt="Stockify Premium AI" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          
          {/* Tooltip */}
          <span className="absolute right-0 -top-12 scale-0 transition-all rounded-lg bg-gray-900 dark:bg-gray-800 p-2 text-xs font-bold text-white group-hover:scale-100 whitespace-nowrap shadow-md">
            Ask AI Assistant ✨
          </span>
        </motion.button>
      </div>

      {/* Chat Popover Window */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-[92px] z-50 flex items-center justify-center p-4 sm:p-0 pointer-events-none">
            {/* Mobile Backdrop */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs sm:hidden pointer-events-auto" 
              onClick={() => setIsOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md h-[80vh] sm:h-[570px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden pointer-events-auto z-10"
            >
              {/* Premium Header */}
              <div className="p-5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-md overflow-hidden border border-white/20 shadow-inner shrink-0">
                    <img 
                      src={premiumAiIcon} 
                      alt="AI Logo" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                      Stockify AI Voice Copilot
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-100 border border-indigo-400/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Live Voice
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-100 font-medium">Equipped with speech & automation commands</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* Speech output voice toggle (mute/unmute) */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Unmute Bot Voice" : "Mute Bot Voice"}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                  >
                    {isMuted ? <VolumeX className="w-4.5 h-4.5 text-indigo-200" /> : <Volume2 className="w-4.5 h-4.5 text-white" />}
                  </button>

                  <button
                    onClick={handleClearHistory}
                    title="Clear Chat History"
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-900/40">
                {messages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {/* Avatar icon */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs overflow-hidden ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <img 
                          src={premiumAiIcon} 
                          alt="AI Avatar" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>

                    {/* Chat Bubble */}
                    <div className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none font-semibold'
                        : 'bg-white dark:bg-gray-800 dark:text-gray-200 text-gray-800 rounded-tl-none border border-gray-100 dark:border-gray-800'
                    }`}>
                      {msg.content.split('\n').map((line, lIdx) => (
                        <p key={lIdx} className={lIdx > 0 ? 'mt-2' : ''}>
                          {line.split('**').map((part, pIdx) => 
                            pIdx % 2 === 1 ? <strong key={pIdx} className="font-extrabold text-indigo-600 dark:text-indigo-400">{part}</strong> : part
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Loading state indicator */}
                {isLoading && (
                  <div className="flex gap-3 max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                      <img 
                        src={premiumAiIcon} 
                        alt="AI Avatar" 
                        className="w-full h-full object-cover animate-bounce"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 rounded-tl-none">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Formulating answer...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions / Starter Prompts footer */}
              {messages.length === 1 && (
                <div className="px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800/80 shrink-0">
                  <div className="flex items-center gap-1 mb-2">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Suggested Actions & Prompts
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTER_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(prompt.text)}
                        className="text-[11px] font-bold px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30 transition-all cursor-pointer"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input Bar with Voice Recording Controls */}
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend(input);
                  }}
                  className="flex gap-2 items-center"
                >
                  {/* Microphone Button */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? "Listening... Click to Stop" : "Click to Speak"}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border shrink-0 cursor-pointer ${
                      isListening 
                        ? 'bg-red-500 border-red-600 text-white animate-pulse shadow-md shadow-red-500/20' 
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask AI or speak a command..."}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white font-semibold disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

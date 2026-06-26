import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, X, Send, User, MessageSquare, Headphones, 
  CheckCircle, ArrowRight, MessageCircle, AlertCircle
} from 'lucide-react';

export const ContactUs: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;

    setIsSending(true);

    // Prepare mailto link parameters
    const recipient = 'veer.ud.1012@gmail.com';
    const mailtoSubject = encodeURIComponent(`[Stockify Support] ${subject}`);
    const mailtoBody = encodeURIComponent(
      `Hello Support,\n\nMessage from: ${name}\nEmail: ${email}\n\nMessage Details:\n${message}\n\n--\nSent via Stockify Customer Portal`
    );
    
    // Simulate a premium sending loader for 1s then open mailto
    setTimeout(() => {
      setIsSending(false);
      setIsSubmitted(true);
      
      // Trigger the mailto redirect
      window.location.href = `mailto:${recipient}?subject=${mailtoSubject}&body=${mailtoBody}`;
      
      // Reset form fields after brief delay
      setTimeout(() => {
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }, 1000);
    }, 1200);
  };

  const handleWhatsappRedirect = () => {
    const whatsappUrl = `https://wa.me/919953575628?text=${encodeURIComponent(
      `Hello Support, I need instant assistance with Stockify inventory tracking. My name is: `
    )}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setIsOpen(!isOpen);
            if (isSubmitted) setIsSubmitted(false);
          }}
          className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center text-white relative group focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          title="Contact Us Support"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
          
          {/* Tooltip */}
          <span className="absolute right-0 -top-12 scale-0 transition-all rounded-lg bg-gray-900 dark:bg-gray-800 p-2 text-xs font-bold text-white group-hover:scale-100 whitespace-nowrap shadow-md">
            Support Desk 🎧
          </span>
        </motion.button>
      </div>

      {/* Floating Contact Form Popover */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 flex items-center justify-center p-4 sm:p-0 pointer-events-none">
            {/* Backdrop overlay for mobile screen view */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs sm:hidden pointer-events-auto" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden pointer-events-auto z-10"
            >
              {/* Premium Header */}
              <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white relative">
                <div className="absolute top-0 right-0 p-4">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight">Customer Support</h3>
                    <p className="text-xs text-emerald-100 font-medium">We usually reply within a couple of hours</p>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 overflow-y-auto max-h-[75vh] sm:max-h-[500px]">
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Intro */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-1">
                      Have a query, feature request, or technical error? Please fill out the form below. Clicking "Send Message" will launch your mail client automatically.
                    </p>

                    {/* Name input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white font-semibold"
                        />
                      </div>
                    </div>

                    {/* Email input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          required
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white font-semibold"
                        />
                      </div>
                    </div>

                    {/* Subject input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Subject</label>
                      <input
                        type="text"
                        required
                        placeholder="What do you need help with?"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white font-semibold"
                      />
                    </div>

                    {/* Message input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Message Details</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Write your issue or query details here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white font-semibold resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      {isSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Preparing Email...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-6 text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-gray-900 dark:text-white">Message Compiled!</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold px-4">
                        We have opened your primary email client with a pre-formatted message draft addressed to <strong>veer.ud.1012@gmail.com</strong>. Just press send in your mail app!
                      </p>
                    </div>

                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline"
                    >
                      Send another message
                    </button>
                  </motion.div>
                )}

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100 dark:border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-900 px-3 text-[10px] font-black tracking-wider text-gray-400">Instant Reply</span>
                  </div>
                </div>

                {/* WhatsApp Section */}
                <div className="space-y-3">
                  <p className="text-center text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                    Need an immediate response?
                  </p>
                  
                  <button
                    onClick={handleWhatsappRedirect}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-green-500/10 transition-all active:scale-98 cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 fill-white text-green-500 shrink-0" />
                    <span>Message us on WhatsApp</span>
                  </button>
                  
                  <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <AlertCircle className="w-3.5 h-3.5 text-green-500" />
                    <span>Active Support: +91 99535 75628</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

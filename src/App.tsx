/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layout } from './components/Layout';
import { StockTable } from './components/StockTable';
import { ItemModal } from './components/ItemModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { BookingsModal } from './components/BookingsModal';
import { ChallanModal } from './components/ChallanModal';
import { HistoryModal } from './components/HistoryModal';
import { Settings as SettingsPage } from './components/Settings';
import { Analytics as AnalyticsPage } from './components/Analytics';
import { UserProfile } from './components/UserProfile';
import { StockItem, Booking } from './types';
import { Search, AlertTriangle, TrendingDown, TrendingUp, Boxes, Loader2, LogIn, PackageCheck, ShieldCheck, Box, FileText, Filter, X, Mic, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { useSettingsContext } from './SettingsContext';
import { useTheme } from './ThemeContext';
import { AiChatbot } from './components/AiChatbot';
import { Pricing } from './components/Pricing';
import { PaymentStatus } from './components/PaymentStatus';
import axios from 'axios';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function LandingPage({ onSignIn, onPricing, appName }: { onSignIn: () => void, onPricing: () => void, appName: string }) {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950 font-sans overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -50, 0], rotate: [0, 45, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[100px]"
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, 50, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-indigo-400/10 blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-400/5 blur-[150px]"
        />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 bg-white dark:bg-gray-800/70 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <img src="/favicon.png" alt="Pro Inventory Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/20" />
          <span className="font-bold text-[17px] text-gray-900 dark:text-white tracking-tight">{appName}</span>
        </motion.div>
        
        <div className="flex items-center gap-6">
          <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={onPricing}
            className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Pricing
          </motion.button>
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSignIn} 
            className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900/50 transition-colors shadow-sm"
          >
            Sign In
          </motion.button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 backdrop-blur-sm border border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 font-medium text-sm mb-8 shadow-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          Secure inventory management
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
          className="text-4xl xs:text-5xl sm:text-6xl md:text-[5rem] font-extrabold text-gray-900 dark:text-white leading-[1.05] mb-6 tracking-tighter"
        >
          Manage your stock<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            with confidence.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[1.125rem] md:text-[1.25rem] text-gray-500 dark:text-gray-400 max-w-[600px] mb-10 leading-relaxed"
        >
          Track items, manage bookings, generate delivery challans, and stay on top of your inventory — all in one secure, animated workspace.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full mb-24"
        >
          <motion.button 
            animate={{ rotate: [0, -1.5, 1.5, -1.5, 1.5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)", rotate: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPricing} 
            className="w-full sm:w-auto px-8 py-3.5 text-[16px] font-medium text-white bg-[#2563eb] rounded-xl hover:bg-blue-700 transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]"
          >
            Try Free for 3 Days
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSignIn} 
            className="w-full sm:w-auto px-8 py-3.5 text-[16px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:bg-gray-900/50 transition-all shadow-sm"
          >
            Sign In
          </motion.button>
        </motion.div>

        {/* Feature Grid with Staggered Animation */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.6
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          {[
            { icon: Box, title: "Item Tracking", desc: "Track opening stock, stock in/out, and real-time balance with reorder alerts." },
            { icon: TrendingUp, title: "Booking Management", desc: "Manage multiple bookings per item with party name, address, and quantity." },
            { icon: FileText, title: "Challan Generation", desc: "Generate and print professional delivery challans instantly for any booking." }
          ].map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
              }}
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              className="bg-white dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-left flex flex-col transition-all cursor-default relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-[#2563eb]" />
                </div>
                <h3 className="text-[19px] font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-[#64748b] text-[15px] leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}

export default function App() {
  const { settings } = useSettingsContext();
  const { setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [activeMerchantTransactionId, setActiveMerchantTransactionId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [trialStartedAt, setTrialStartedAt] = useState<number | null>(null);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'settings' | 'analytics' | 'profile'>('dashboard');

  const [godowns, setGodowns] = useState<{id: string, name: string}[]>(() => {
    const saved = localStorage.getItem('app_godowns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'MP', name: 'MP' },
      { id: 'KL', name: 'KL' }
    ];
  });
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedItemForBookings, setSelectedItemForBookings] = useState<StockItem | null>(null);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<StockItem | null>(null);
  const [selectedChallanBooking, setSelectedChallanBooking] = useState<{item: StockItem, booking: Booking} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all-bookings');
  const [partyFilter, setPartyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeReminderPopup, setActiveReminderPopup] = useState<{item: StockItem, booking: Booking} | null>(null);
  const [dismissedReminders, setDismissedReminders] = useState<{item: StockItem, booking: Booking}[]>([]);

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.info('Listening...', { duration: 2000 });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone permissions in your browser.', { duration: 4000 });
      } else if (event.error !== 'no-speech') {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const allPartyNames = useMemo(() => {
    const names = new Set<string>();
    items.forEach(item => {
      if (item.partyName) names.add(item.partyName);
      item.bookings?.forEach(b => {
        if (b.partyName) names.add(b.partyName);
      });
    });
    return Array.from(names).filter(Boolean).sort();
  }, [items]);

  const allCategories = useMemo(() => {
    const categories = new Set<string>();
    items.forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories).filter(Boolean).sort();
  }, [items]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      let foundPopup = false;
      const newDismissed: {item: StockItem, booking: Booking}[] = [];
      
      items.forEach(item => {
        item.bookings?.forEach(b => {
          if (b.reminderActive && b.dateOfSend) {
            const sendDate = new Date(b.dateOfSend);
            if (now >= sendDate) {
              if (!b.reminderDismissed) {
                if (!foundPopup) {
                  // Only set if we aren't already showing one
                  setActiveReminderPopup(prev => prev || { item, booking: b });
                  foundPopup = true;
                }
              } else {
                newDismissed.push({ item, booking: b });
              }
            }
          }
        });
      });
      setDismissedReminders(newDismissed);
    };

    // Check immediately and then set interval
    checkReminders();
    const interval = setInterval(checkReminders, 1000);

    return () => clearInterval(interval);
  }, [items]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let playInterval: NodeJS.Timeout;
    let customAudioElement: HTMLAudioElement | null = null;
    let isPlayingCustom = false;

    if (activeReminderPopup) {
      const customSoundDataUrl = localStorage.getItem('customReminderSound');
      
      if (customSoundDataUrl) {
        customAudioElement = new Audio(customSoundDataUrl);
      } else if (!audioCtxRef.current) {
        try {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.error(e);
        }
      }

      const playSound = () => {
        if (customAudioElement) {
          if (!isPlayingCustom) {
            isPlayingCustom = true;
            customAudioElement.currentTime = 0;
            customAudioElement.play().catch(e => console.error('Audio playback failed', e)).finally(() => {
              isPlayingCustom = false;
            });
          }
          return;
        }

        if (!audioCtxRef.current) return;
        try {
          // Resume if suspended
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }

          const oscillator = audioCtxRef.current.createOscillator();
          const gainNode = audioCtxRef.current.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtxRef.current.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(880, audioCtxRef.current.currentTime); // A5
          oscillator.frequency.setValueAtTime(1046.50, audioCtxRef.current.currentTime + 0.15); // C6
          
          gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.5, audioCtxRef.current.currentTime + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.4);
          
          oscillator.start(audioCtxRef.current.currentTime);
          oscillator.stop(audioCtxRef.current.currentTime + 0.5);
        } catch (e) {
          console.error('Audio playback failed', e);
        }
      };

      playSound(); // Play immediately
      playInterval = setInterval(playSound, 2000); // Play every 2 seconds
    }

    return () => {
      if (playInterval) {
        clearInterval(playInterval);
      }
      if (customAudioElement) {
        customAudioElement.pause();
        customAudioElement.currentTime = 0;
      }
    };
  }, [activeReminderPopup]);

  const handleDismissReminder = (item: StockItem, booking: Booking) => {
    const updatedBookings = item.bookings?.map(b => 
      b.id === booking.id ? { ...b, reminderDismissed: true } : b
    ) || [];
    updateItem(item.id, { bookings: updatedBookings });
    setActiveReminderPopup(null);
  };

  const handleCompleteReminder = (item: StockItem, booking: Booking) => {
    const updatedBookings = item.bookings?.map(b => 
      b.id === booking.id ? { ...b, reminderActive: false, reminderDismissed: false } : b
    ) || [];
    updateItem(item.id, { bookings: updatedBookings });
    setActiveReminderPopup(prev => (prev?.booking.id === booking.id) ? null : prev);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        openAddModal();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        fetchStock(currentUser.uid);
        fetchUserSubscription(currentUser.uid);
      } else {
        setItems([]);
        setIsSubscribed(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('id');
    if (transactionId) {
      setActiveMerchantTransactionId(transactionId);
      // Remove the id from URL without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const fetchUserSubscription = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setIsSubscribed(!!userData.isSubscribed);
        
        if (userData.trialStartedAt) {
          const startTime = typeof userData.trialStartedAt === 'number' 
            ? userData.trialStartedAt 
            : userData.trialStartedAt.toMillis();
          setTrialStartedAt(startTime);
          
          const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
          if (Date.now() - startTime > threeDaysInMs) {
            setIsTrialExpired(true);
          }
        }
      } else {
        // New user or no profile, set as not subscribed by default
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error("Error fetching subscription status", err);
      // For safety in this tool, I'll default to true if it fails or just false. 
      // User requested "only subscribed user can use". I'll set false if check fails.
      setIsSubscribed(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      setShowLogin(true);
      setShowPricing(false);
      setAuthMode('signup');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/payment/initiate', {
        amount: 500,
        uid: user.uid
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      toast.error("Payment initiation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    if (!user) {
      setShowLogin(true);
      setShowPricing(false);
      setAuthMode('signup');
      return;
    }

    if (trialStartedAt) {
      toast.error("You have already used your trial.");
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { 
        trialStartedAt: serverTimestamp(),
        fullName: user.displayName || user.email?.split('@')[0] || 'Member',
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setTrialStartedAt(Date.now());
      setIsTrialExpired(false);
      setShowPricing(false);
      toast.success("Trial started! You have 3 days of full access.");
    } catch (err) {
      toast.error("Failed to start trial. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in popup closed by user.');
      } else if (err.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized for Google Sign-In. Please add it to your Firebase Console -> Authentication -> Settings -> Authorized domains.');
      } else {
        alert(`Google Sign-In Error: ${err.message}`);
      }
    }
  };

  const loginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }
    try {
      // Trying to sign in
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        // If not found, let's try to create them instead? Or just give an error.
        alert('Invalid email or password, or user does not exist.');
      } else if (err.code === 'auth/operation-not-allowed') {
        alert('Email/Password sign-in is not enabled. Please enable it in Firebase Console -> Authentication -> Sign-in method.');
      } else {
        alert(`Sign-in Error: ${err.message}`);
      }
    }
  };

  const signUpWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupName) {
      toast.error("Please enter Name, Email and Password to sign up.");
      return;
    }
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      await updateProfile(userCredential.user, { displayName: signupName });
      toast.success("Account created Successfully! You are now logged in.");
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        toast.error('This email is already in use. Please try logging in.');
      } else if (err.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password sign-in is not enabled. Please enable it in Firebase Console.');
      } else if (err.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please use at least 6 characters.');
      } else {
        toast.error(`Sign-up Error: ${err.message}`);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const fetchStock = async (uid: string) => {
    setLoading(true);
    try {
      const q = query(collection(db, 'stockItems'), where('ownerId', '==', uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as StockItem));
      setItems(data);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'stockItems');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: StockItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (data: any) => {
    if (itemToEdit) {
      await updateItem(itemToEdit.id, data);
    } else {
      await addItem(data);
    }
  };

  const addItem = async (data: any) => {
    if (!user) return;
    
    // We create a new doc ref to get an ID
    const docRef = doc(collection(db, 'stockItems'));
    
    // Determine openingStock variables properly from UI form structure
    const openingStockMP = data.openingStockMP || 0;
    const openingStockKL = data.openingStockKL || 0;
    const godownStocks = data.godownStocks || {};
    const totalGodowns = (data.openingStockMP || 0) + (data.openingStockKL || 0) + Object.values(godownStocks).reduce((a: any, b: any) => a + Number(b || 0), 0);
    const stockIn = 0;
    const stockOut = 0;
    
    const newItem = {
      ...data,
      ownerId: user.uid,
      stockIn,
      stockOut,
      booked: 0,
      balance: totalGodowns,
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(docRef, newItem);
      // Wait actually in real app this updates the UI optimistic or fetch again
      setItems(prevItems => [...prevItems, { ...newItem, id: docRef.id }]);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'stockItems');
    }
  };

  const updateItem = async (id: string, updates: Partial<StockItem>) => {
    if (!user) return;
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Recalculate balance
    const merged = { ...item, ...updates };
    const stockIn = merged.stockIn ?? 0;
    const stockOut = merged.stockOut ?? 0;
    const totalG = (merged.openingStockMP || 0) + (merged.openingStockKL || 0) + Object.values(merged.godownStocks || {}).reduce((a: any, b: any) => a + Number(b || 0), 0);
    const balance = (totalG + stockIn) - stockOut;
    const currentReorderLevel = merged.reorderLevel || 0;

    if (balance <= currentReorderLevel && item.balance > currentReorderLevel) {
      toast.warning(`Low Stock Alert: ${item.name}`, {
        description: `Balance dropped to ${balance} (Reorder level: ${currentReorderLevel})`,
      });
    }

    // Track Movements
    const newMovements = [...(item.movements || [])];
    
    if (updates.stockIn !== undefined && updates.stockIn !== item.stockIn) {
      const diff = updates.stockIn - (item.stockIn || 0);
      newMovements.unshift({
        id: Date.now().toString() + '-in',
        type: 'IN',
        qty: diff,
        date: Date.now()
      });
    }

    if (updates.stockOut !== undefined && updates.stockOut !== item.stockOut) {
      const diff = updates.stockOut - (item.stockOut || 0);
      newMovements.unshift({
        id: Date.now().toString() + '-out',
        type: 'OUT',
        qty: diff,
        date: Date.now()
      });
    }

    // keep last 100 movements
    const trimmedMovements = newMovements.slice(0, 100);

    const finalUpdates = { ...updates, balance, movements: trimmedMovements, updatedAt: serverTimestamp() };

    // Optimistic update
    const previousItems = [...items];
    setItems(items.map(i => i.id === id ? { ...i, ...finalUpdates } : i));

    try {
      const docRef = doc(db, 'stockItems', id);
      await updateDoc(docRef, finalUpdates);
    } catch (err) {
      setItems(previousItems);
      handleFirestoreError(err, OperationType.UPDATE, `stockItems/${id}`);
    }
  };

  const deleteItem = async () => {
    if (!user || !itemToDelete) return;
    const id = itemToDelete;
    setItemToDelete(null);
    
    // Optimistic delete
    const previousItems = [...items];
    setItems(items.filter(i => i.id !== id));

    try {
      await deleteDoc(doc(db, 'stockItems', id));
    } catch (err) {
      setItems(previousItems);
      handleFirestoreError(err, OperationType.DELETE, `stockItems/${id}`);
    }
  };

  const deleteAllItems = async () => {
    if (!user) return;
    setIsDeleteAllModalOpen(false);
    
    // Optimistic delete all
    const previousItems = [...items];
    setItems([]);

    try {
      // Chunked batch delete
      const chunks = [];
      let batch = writeBatch(db);
      let count = 0;
      
      for (const item of previousItems) {
        batch.delete(doc(db, 'stockItems', item.id));
        count++;
        if (count === 500) {
          chunks.push(batch);
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) chunks.push(batch);
      
      for (const chunk of chunks) {
        await chunk.commit();
      }
    } catch (err) {
      setItems(previousItems);
      handleFirestoreError(err, OperationType.DELETE, `stockItems (batch)`);
    }
  };

  const saveBookings = async (id: string, bookings: Booking[]) => {
    const totalBooked = bookings.reduce((sum, b) => sum + (Number(b.qty) || 0), 0);
    await updateItem(id, { bookings, booked: totalBooked });
  };

  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter(item => {
      // 1. Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        item.name?.toLowerCase().includes(searchLower) ||
        item.size?.toLowerCase().includes(searchLower) ||
        item.partyName?.toLowerCase().includes(searchLower);
        
      if (!matchesSearch) return false;

      // 2. Status filter
      if (statusFilter !== 'all') {
        const balance = item.balance || 0;
        const reorderLevel = item.reorderLevel || 0;
        
        if (statusFilter === 'in-stock' && balance <= 0) return false;
        if (statusFilter === 'low-stock' && (balance > reorderLevel || balance <= 0)) return false;
        if (statusFilter === 'out-of-stock' && balance > 0) return false;
      }

      // 3. Date range filter
      if (dateFilterStart || dateFilterEnd) {
        // Safe access to updatedAt timestamp
        const itemDateVal = (item.updatedAt as any)?.toMillis?.() || Date.now();
        
        if (dateFilterStart) {
          const startTimestamp = new Date(dateFilterStart).setHours(0, 0, 0, 0);
          if (itemDateVal < startTimestamp) return false;
        }
        
        if (dateFilterEnd) {
          const endTimestamp = new Date(dateFilterEnd).setHours(23, 59, 59, 999);
          if (itemDateVal > endTimestamp) return false;
        }
      }

      // 4. Booking filter
      if (bookingFilter === 'no-bookings' && item.bookings && item.bookings.length > 0) return false;
      if (bookingFilter === 'has-bookings' && (!item.bookings || item.bookings.length === 0)) return false;

      // 5. Party Name filter
      if (partyFilter !== 'all' && item.partyName !== partyFilter) return false;

      // 6. Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      return true;
    });

    switch (sortBy) {
      case 'name-asc': result.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      case 'name-desc': result.sort((a, b) => (b.name || '').localeCompare(a.name || '')); break;
      case 'size-asc': result.sort((a, b) => (a.size || '').localeCompare(b.size || '')); break;
      case 'size-desc': result.sort((a, b) => (b.size || '').localeCompare(a.size || '')); break;
      case 'balance-asc': result.sort((a, b) => (a.balance || 0) - (b.balance || 0)); break;
      case 'balance-desc': result.sort((a, b) => (b.balance || 0) - (a.balance || 0)); break;
      case 'reorder-asc': result.sort((a, b) => (a.reorderLevel || 0) - (b.reorderLevel || 0)); break;
      case 'reorder-desc': result.sort((a, b) => (b.reorderLevel || 0) - (a.reorderLevel || 0)); break;
    }

    return result;
  }, [items, searchTerm, sortBy, statusFilter, dateFilterStart, dateFilterEnd, bookingFilter, partyFilter, categoryFilter]);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalStockIn = items.reduce((sum, item) => sum + (item.stockIn || 0), 0);
    const totalStockOut = items.reduce((sum, item) => sum + (item.stockOut || 0), 0);
    const lowStockItems = items.filter(item => (item.balance || 0) <= (item.reorderLevel || 0)).length;
    return { totalItems, totalStockIn, totalStockOut, lowStockItems };
  }, [items]);

  const downloadTemplate = () => {
    const headers = ['Item Name', 'Size', 'Unit', 'Opening Stock MP', 'Opening Stock KL', 'Reorder Level', 'Party Name'];
    const sampleRows = [
      ['Sample Item 1', '8*48', 'BOX', '10', '5', '2', 'Supplier A'],
      ['Sample Item 2', '2*4', 'BOX', '20', '10', '5', 'Supplier B'],
    ];
    const csvContent = [headers, ...sampleRows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCSV = () => {
    if (items.length === 0) {
      alert('No data to export');
      return;
    }
    const headers = ['Item Name', 'Size', 'Unit', 'Opening Stock MP', 'Opening Stock KL', 'Stock In', 'Stock Out', 'Balance', 'Reorder Level', 'Booked', 'Party Name', 'Last Updated'];
    const rows = items.map(item => [
      item.name,
      item.size,
      item.unit || 'BOX',
      item.openingStockMP,
      item.openingStockKL,
      item.stockIn,
      item.stockOut,
      item.balance,
      item.reorderLevel,
      item.booked,
      item.partyName || '',
      new Date((item.updatedAt as any)?.toMillis?.() || Date.now()).toLocaleString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(field => `"${field}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setLoading(true);
        try {
          // Chunked batch imports
          let batch = writeBatch(db);
          let count = 0;
          
          for (const row of results.data as any[]) {
            const item: any = {};
            
            Object.keys(row).forEach(key => {
              const normalizedKey = key.toLowerCase().trim();
              const val = row[key];

              if (normalizedKey.includes('item name') || normalizedKey === 'name') item.name = val;
              else if (normalizedKey.includes('size')) item.size = val;
              else if (normalizedKey.includes('unit')) item.unit = val;
              else if (normalizedKey.includes('mp')) item.openingStockMP = Number(val) || 0;
              else if (normalizedKey.includes('kl')) item.openingStockKL = Number(val) || 0;
              else if (normalizedKey.includes('reorder')) item.reorderLevel = Number(val) || 0;
              else if (normalizedKey.includes('party')) item.partyName = val;
            });

            const newItem = {
              name: item.name || 'Unnamed Item',
              size: item.size || 'N/A',
              unit: item.unit || 'BOX',
              openingStockMP: item.openingStockMP || 0,
              openingStockKL: item.openingStockKL || 0,
              reorderLevel: item.reorderLevel || 0,
              partyName: item.partyName || '',
              stockIn: 0,
              stockOut: 0,
              booked: 0,
              balance: (item.openingStockMP || 0) + (item.openingStockKL || 0),
              ownerId: user.uid,
              updatedAt: serverTimestamp()
            };

            const docRef = doc(collection(db, 'stockItems'));
            batch.set(docRef, newItem);
            
            count++;
            if (count === 500) {
              await batch.commit();
              batch = writeBatch(db);
              count = 0;
            }
          }
          
          if (count > 0) {
            await batch.commit();
          }
          alert(`Successfully imported items`);
          fetchStock(user.uid);
        } catch (err) {
          console.error('Bulk upload failed', err);
          alert('Failed to import items. Please check the console for details.');
        } finally {
          setLoading(false);
          event.target.value = '';
        }
      },
      error: (error) => {
        console.error('CSV Parsing Error:', error);
        alert('Error parsing CSV file');
      }
    });
  };

  const handleOpenChallan = async (item: StockItem, booking: Booking) => {
    let currentBooking = booking;
    if (typeof booking.challanNo === 'undefined') {
      let maxChallan = 0;
      items.forEach(i => {
        i.bookings?.forEach(b => {
          if (b.challanNo && b.challanNo > maxChallan) {
            maxChallan = b.challanNo;
          }
        });
      });
      const newChallanNo = maxChallan + 1;
      
      const updatedBookings = item.bookings?.map(b => 
        b.id === booking.id ? { ...b, challanNo: newChallanNo } : b
      ) || [];
      
      currentBooking = { ...booking, challanNo: newChallanNo };
      await updateItem(item.id, { bookings: updatedBookings });
    }
    setSelectedChallanBooking({ item, booking: currentBooking });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="mt-4 text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest">Checking Authentication...</p>
      </div>
    );
  }

  if (!user) {
    if (activeMerchantTransactionId) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-gray-950">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Authenticating...</p>
          </div>
        </div>
      );
    }
    if (showPricing) {
      return (
        <Pricing 
          onBack={() => setShowPricing(false)} 
          onSubscribe={() => { setShowPricing(false); setShowLogin(true); setAuthMode('signup'); }}
          onStartTrial={() => { setShowPricing(false); setShowLogin(true); setAuthMode('signup'); }}
          isLoggedIn={false}
          isTrialUsed={false}
        />
      );
    }
    
    if (!showLogin) {
      return (
        <LandingPage 
          onSignIn={() => setShowLogin(true)} 
          onPricing={() => setShowPricing(true)}
          appName={settings.companyName} 
        />
      );
    }

    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 left-4">
          <button 
            onClick={() => setShowLogin(false)}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            ← Back to Home
          </button>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          className="w-full max-w-[400px]"
        >
          <Toaster position="top-right" />
          
          {/* Logo Section */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-50 dark:border-gray-800/50 flex flex-col items-center justify-center">
              <div className="bg-[#1a56db] rounded-lg p-2 mb-1 flex items-center justify-center">
                <PackageCheck className="w-6 h-6 text-white" />
              </div>
              <div className="text-[#1a56db] font-bold text-xs tracking-tight leading-none text-center">
                stockflow
                <div className="flex items-center justify-center mt-0.5">
                  <div className="h-[1px] w-1.5 bg-[#1a56db]"></div>
                  <span className="text-[8px] font-bold text-[#1a56db] px-0.5 leading-none">manager</span>
                  <div className="h-[1px] w-1.5 bg-[#1a56db]"></div>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {authMode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white mb-2 tracking-tight">Welcome Back</h1>
                  <p className="text-[#64748b] dark:text-gray-400 text-[15px]">Sign in to manage your inventory</p>
                </div>

                <button 
                  onClick={login}
                  className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 text-[#334155] dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors mb-6 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">OR</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                </div>

                <form onSubmit={loginWithEmail} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#334155] dark:text-gray-300 mb-1.5">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-[15px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#334155] dark:text-gray-300 mb-1.5">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-[15px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:text-white"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#0f172a] dark:bg-blue-600 text-white rounded-xl py-3.5 font-semibold text-[15px] hover:bg-[#1e293b] dark:hover:bg-blue-700 active:scale-[0.98] transition-all mt-4"
                  >
                    Sign in
                  </button>
                </form>

                <div className="flex flex-col gap-3 text-center text-[14px]">
                  <button className="text-[#64748b] hover:text-[#0f172a] dark:hover:text-white font-medium transition-colors">
                    Forgot password?
                  </button>
                  <p className="text-[#64748b] dark:text-gray-400">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => setAuthMode('signup')}
                      className="text-[#1a56db] dark:text-blue-400 font-semibold hover:underline"
                    >
                      Create account
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white mb-2 tracking-tight">Join StockFlow</h1>
                  <p className="text-[#64748b] dark:text-gray-400 text-[15px]">Create your free account today</p>
                </div>

                <form onSubmit={signUpWithEmail} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#334155] dark:text-gray-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-[15px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#334155] dark:text-gray-300 mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </div>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-[15px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#334155] dark:text-gray-300 mb-1.5">Create Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <input
                        type="password"
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-[15px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none placeholder:text-gray-400 dark:text-white"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#1a56db] text-white rounded-xl py-3.5 font-semibold text-[15px] hover:bg-blue-700 active:scale-[0.98] transition-all mt-4"
                  >
                    Create Account
                  </button>
                </form>

                <div className="text-center text-[14px]">
                  <p className="text-[#64748b] dark:text-gray-400">
                    Already have an account?{' '}
                    <button 
                      onClick={() => setAuthMode('login')}
                      className="text-[#1a56db] dark:text-blue-400 font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
        <p className="mt-4 text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest">Loading Catalog...</p>
      </div>
    );
  }

  // Render Dashboard or Pricing (Subscription Gate)
  if (user && activeMerchantTransactionId) {
    return (
      <PaymentStatus 
        transactionId={activeMerchantTransactionId} 
        uid={user.uid} 
        onFinish={(success) => {
          setActiveMerchantTransactionId(null);
          if (success) {
            setIsSubscribed(true);
            setIsTrialExpired(false);
            setShowPricing(false);
          }
        }} 
      />
    );
  }

  if (user && isSubscribed === false && (!trialStartedAt || isTrialExpired)) {
    return (
      <Pricing 
        onBack={logout} 
        onSubscribe={handleSubscribe}
        onStartTrial={handleStartTrial}
        isLoggedIn={true}
        isTrialUsed={!!trialStartedAt}
      />
    );
  }

  return (
    <Layout 
      onAddItem={openAddModal}
      onDeleteAll={() => setIsDeleteAllModalOpen(true)}
      onDownloadTemplate={downloadTemplate}
      onImportCSV={handleImportCSV}
      onExportCSV={exportCSV}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    >
      <Toaster position="top-right" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          className="w-full flex flex-col h-full"
        >
          {currentPage === 'dashboard' ? (
            <>
              {/* Reminder Banner */}
              {dismissedReminders.length > 0 && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="font-bold text-red-800 text-sm tracking-wide">PENDING REMINDERS ({dismissedReminders.length})</h3>
              </div>
              <div className="flex flex-col gap-2">
                {dismissedReminders.map((r, i) => (
                  <div key={`${r.item.id}-${r.booking.id}-${i}`} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-100 dark:border-red-800 shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-white">{r.item.name} - {r.booking.partyName || 'Unknown Party'}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs">Scheduled Send: {new Date(r.booking.dateOfSend!).toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => handleCompleteReminder(r.item, r.booking)}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:bg-red-900/40 rounded-lg text-xs font-bold transition-colors"
                    >
                      Mark Done
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reminder Popup */}
          <AnimatePresence>
            {activeReminderPopup && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm relative z-50 flex flex-col overflow-hidden"
                >
                  <div className="bg-amber-500 dark:bg-amber-600 p-6 flex flex-col items-center justify-center text-center">
                    <div className="bg-white/20 p-3 rounded-full mb-3">
                      <BellRing className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Time to Send!</h2>
                  </div>
                  <div className="p-6 flex flex-col items-center text-center gap-2">
                    <p className="text-gray-900 dark:text-white font-bold text-lg">{activeReminderPopup.booking.partyName || 'Unknown Party'}</p>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">Item: {activeReminderPopup.item.name}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                      Amount: <span className="font-bold text-gray-800 dark:text-gray-100">{activeReminderPopup.booking.qty}</span>
                    </p>
                    <div className="flex flex-col w-full gap-2 mt-6">
                      <button 
                        onClick={() => handleCompleteReminder(activeReminderPopup.item, activeReminderPopup.booking)}
                        className="w-full py-3 bg-amber-500 dark:bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors"
                      >
                        Mark as Done
                      </button>
                      <button 
                        onClick={() => handleDismissReminder(activeReminderPopup.item, activeReminderPopup.booking)}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                      >
                        Close & Keep in Banner
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Removed float logout */}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            <StatsCard 
              icon={<Boxes className="text-blue-500 w-5 h-5" />} 
              bg="bg-blue-100 dark:bg-blue-900/40"
              label="TOTAL ITEMS" 
              value={stats.totalItems} 
              delay={0.1}
            />
            <StatsCard 
              icon={<TrendingUp className="text-green-500 w-5 h-5" />} 
              bg="bg-green-100 dark:bg-green-900/40"
              label="TOTAL STOCK IN" 
              value={stats.totalStockIn} 
              delay={0.2}
            />
            <StatsCard 
              icon={<TrendingDown className="text-orange-500 w-5 h-5" />} 
              bg="bg-orange-100 dark:bg-orange-900/40"
              label="TOTAL STOCK OUT" 
              value={stats.totalStockOut} 
              delay={0.3}
            />
            <StatsCard 
              icon={<AlertTriangle className="text-red-500 w-5 h-5" />} 
              bg="bg-red-100 dark:bg-red-900/40"
              label="LOW STOCK" 
              value={stats.lowStockItems} 
              delay={0.4}
            />
          </div>

          {/* Filters & Search */}
          <div className="space-y-6 mb-8 flex flex-col">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-400" />
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Search by item name, size or party... (Ctrl+S)" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button
                    onClick={handleMicClick}
                    className={`flex-1 sm:flex-none flex items-center justify-center p-4 rounded-xl border transition-all ${
                      isListening
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-500 animate-pulse'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900/50 hover:text-gray-600 dark:text-gray-300'
                    }`}
                    title={isListening ? "Stop listening" : "Search by voice"}
                  >
                    <Mic className="w-5 h-5" />
                    <span className="sm:hidden ml-2 font-medium">Voice</span>
                  </button>

                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 px-6 py-4 rounded-xl border text-sm font-medium transition-all ${
                      showFilters 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-900/50 hover:border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {(statusFilter !== 'all' || bookingFilter !== 'all-bookings' || partyFilter !== 'all' || categoryFilter !== 'all' || dateFilterStart || dateFilterEnd) && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold ml-1">
                        {
                          (statusFilter !== 'all' ? 1 : 0) +
                          (bookingFilter !== 'all-bookings' ? 1 : 0) +
                          (partyFilter !== 'all' ? 1 : 0) +
                          (categoryFilter !== 'all' ? 1 : 0) +
                          (dateFilterStart || dateFilterEnd ? 1 : 0)
                        }
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, y: -10 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -10 }}
                    transition={{ 
                      duration: 0.3, 
                      ease: [0.04, 0.62, 0.23, 0.98]
                    }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-wrap items-center gap-6 shadow-sm mt-1">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</label>
                        <select 
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                        >
                          <option value="all">All Status</option>
                          <option value="in-stock">In Stock</option>
                          <option value="low-stock">Low Stock</option>
                          <option value="out-of-stock">Out of Stock</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Bookings</label>
                        <select 
                          value={bookingFilter}
                          onChange={(e) => setBookingFilter(e.target.value)}
                          className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                        >
                          <option value="all-bookings">All Bookings</option>
                          <option value="no-bookings">No Bookings</option>
                          <option value="has-bookings">Has Bookings</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Party</label>
                        <select 
                          value={partyFilter}
                          onChange={(e) => setPartyFilter(e.target.value)}
                          className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-colors max-w-[160px] truncate"
                        >
                          <option value="all">All Parties</option>
                          {allPartyNames.map(party => (
                            <option key={party} value={party}>{party}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Category</label>
                        <select 
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-colors max-w-[160px] truncate"
                        >
                          <option value="all">All Categories</option>
                          {allCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Updated Date</label>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white dark:bg-gray-800 transition-colors">
                          <input 
                            type="date"
                            value={dateFilterStart}
                            onChange={(e) => setDateFilterStart(e.target.value)}
                            className="text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent border-none outline-none focus:ring-0 w-[125px]"
                          />
                          <span className="text-gray-400 dark:text-gray-400 text-xs">-</span>
                          <input 
                            type="date"
                            value={dateFilterEnd}
                            onChange={(e) => setDateFilterEnd(e.target.value)}
                            className="text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent border-none outline-none focus:ring-0 w-[125px]"
                          />
                        </div>
                      </div>
                      
                      {(statusFilter !== 'all' || bookingFilter !== 'all-bookings' || partyFilter !== 'all' || categoryFilter !== 'all' || dateFilterStart || dateFilterEnd) && (
                        <div className="flex flex-col gap-2 ml-auto self-end">
                          <button
                            onClick={() => {
                              setStatusFilter('all');
                              setBookingFilter('all-bookings');
                              setPartyFilter('all');
                              setCategoryFilter('all');
                              setDateFilterStart('');
                              setDateFilterEnd('');
                            }}
                            className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:text-red-400 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 dark:bg-red-900/20 border border-transparent hover:border-red-100 dark:border-red-800 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Clear All Filters
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap items-center gap-2 pr-10">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest mr-2">Sort by:</span>
              <SortPill active={sortBy === 'default'} onClick={() => setSortBy('default')}>Default</SortPill>
              <SortPill active={sortBy === 'name-asc'} onClick={() => setSortBy('name-asc')}>Name A&rarr;Z</SortPill>
              <SortPill active={sortBy === 'name-desc'} onClick={() => setSortBy('name-desc')}>Name Z&rarr;A</SortPill>
              <SortPill active={sortBy === 'size-asc'} onClick={() => setSortBy('size-asc')}>Size A&rarr;Z</SortPill>
              <SortPill active={sortBy === 'size-desc'} onClick={() => setSortBy('size-desc')}>Size Z&rarr;A</SortPill>
              <SortPill active={sortBy === 'balance-asc'} onClick={() => setSortBy('balance-asc')}>Balance &uarr;</SortPill>
              <SortPill active={sortBy === 'balance-desc'} onClick={() => setSortBy('balance-desc')}>Balance &darr;</SortPill>
              <SortPill active={sortBy === 'reorder-asc'} onClick={() => setSortBy('reorder-asc')}>Reorder Level &uarr;</SortPill>
              <SortPill active={sortBy === 'reorder-desc'} onClick={() => setSortBy('reorder-desc')}>Reorder Level &darr;</SortPill>
            </div>
          </div>

          <StockTable godowns={godowns} 
            items={settings.itemsPerPage === 'all' ? filteredAndSortedItems : filteredAndSortedItems.slice(0, parseInt(settings.itemsPerPage) || 10)} 
            onEditItem={openEditModal}
            onUpdateItem={updateItem}
            onDeleteItem={(id) => setItemToDelete(id)}
            onOpenBookings={(item) => setSelectedItemForBookings(item)}
            onOpenChallan={handleOpenChallan}
            onOpenHistory={(item) => setSelectedItemForHistory(item)}
          />
        </>
      ) : currentPage === 'analytics' ? (
        <AnalyticsPage items={items} />
      ) : currentPage === 'profile' ? (
        <UserProfile user={user} onLogout={logout} />
      ) : (
        <SettingsPage godowns={godowns} setGodowns={(g) => { setGodowns(g); localStorage.setItem('app_godowns', JSON.stringify(g)); }} onClearData={() => setIsDeleteAllModalOpen(true)} />
      )}
        </motion.div>
      </AnimatePresence>

      <HistoryModal
        isOpen={!!selectedItemForHistory}
        onClose={() => setSelectedItemForHistory(null)}
        item={selectedItemForHistory!}
      />

      <ItemModal godowns={godowns} 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setItemToEdit(null);
        }} 
        onSave={handleSaveItem} 
        itemToEdit={itemToEdit}
        partyNames={allPartyNames}
        showImageUpload={settings.showProductImages}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={deleteAllItems}
        title="Delete All Items?"
        description={`This will permanently delete all ${items.length} stock items. This action cannot be undone.`}
      />

      <DeleteConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={deleteItem}
        title="Delete Item?"
        description="This will permanently delete this stock item. This action cannot be undone."
      />

      <BookingsModal
        isOpen={!!selectedItemForBookings}
        onClose={() => setSelectedItemForBookings(null)}
        item={selectedItemForBookings}
        onSave={saveBookings}
        partyNames={allPartyNames}
      />

      <ChallanModal
        isOpen={!!selectedChallanBooking}
        onClose={() => setSelectedChallanBooking(null)}
        item={selectedChallanBooking?.item || null}
        booking={selectedChallanBooking?.booking || null}
      />
      
      <AiChatbot 
        items={items}
        onOpenAddItem={openAddModal}
        onPageChange={setCurrentPage}
        onToggleTheme={setTheme}
      />
    </Layout>
  );
}

const StatsCard = ({ icon, label, value, bg, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center`}>
      {icon}
    </div>
    <div className="pr-10">
      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
    </div>
  </motion.div>
);

const SortPill = ({ children, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border ${
      active 
      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
      : 'bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:border-gray-600'
    }`}
  >
    {children}
  </button>
);


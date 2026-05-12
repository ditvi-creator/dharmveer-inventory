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
import { StockItem, Booking } from './types';
import { Search, AlertTriangle, TrendingDown, TrendingUp, Boxes, Loader2, LogIn, PackageCheck, ShieldCheck, Box, FileText, Filter, X, Mic, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Toaster, toast } from 'sonner';

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

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

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

    if (activeReminderPopup) {
      if (!audioCtxRef.current) {
        try {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
          console.error(e);
        }
      }

      const playSound = () => {
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
      } else {
        setItems([]);
      }
    });
    return () => unsubscribe();
  }, []);

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

  const signUpWithEmail = async () => {
    if (!email || !password) {
      alert("Please enter both email and password to sign up.");
      return;
    }
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        alert('Email/Password sign-in is not enabled. Please enable it in Firebase Console -> Authentication -> Sign-in method.');
      } else {
        alert(`Sign-up Error: ${err.message}`);
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
    const stockIn = 0;
    const stockOut = 0;
    
    const newItem = {
      ...data,
      ownerId: user.uid,
      stockIn,
      stockOut,
      booked: 0,
      balance: openingStockMP + openingStockKL,
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
    const balance = (merged.openingStockMP + merged.openingStockKL + stockIn) - stockOut;
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Checking Authentication...</p>
      </div>
    );
  }

  if (!user) {
    if (!showLogin) {
      return (
        <div className="min-h-screen bg-[#fafafa] font-sans">
          <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="bg-[#1a56db] rounded p-1.5 flex items-center justify-center">
                <PackageCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-[17px] text-gray-900">Dharmveer Inventory</span>
            </div>
            <button onClick={() => setShowLogin(true)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Sign In
            </button>
          </nav>

          <main className="max-w-6xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-medium text-sm mb-8">
              <ShieldCheck className="w-4 h-4" />
              Secure inventory management
            </div>

            <h1 className="text-[56px] font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              Manage your stock<br />
              <span className="text-[#2563eb]">with confidence</span>
            </h1>

            <p className="text-[18px] text-gray-500 max-w-[600px] mb-10 leading-relaxed">
              Track items, manage bookings, generate delivery challans, and stay on top of your inventory — all in one secure place.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24 w-full">
              <button onClick={() => setShowLogin(true)} className="w-full sm:w-auto px-6 py-3 text-[15px] font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Get Started Free
              </button>
              <button onClick={() => setShowLogin(true)} className="w-full sm:w-auto px-6 py-3 text-[15px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                Sign In
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-left flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
                  <Box className="w-5 h-5 text-[#2563eb]" />
                </div>
                <h3 className="text-[18px] font-bold text-gray-900 mb-2">Item Tracking</h3>
                <p className="text-[#64748b] text-[15px] leading-relaxed">Track opening stock, stock in/out, and real-time balance with reorder alerts.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-left flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
                  <TrendingUp className="w-5 h-5 text-[#2563eb]" />
                </div>
                <h3 className="text-[18px] font-bold text-gray-900 mb-2">Booking Management</h3>
                <p className="text-[#64748b] text-[15px] leading-relaxed">Manage multiple bookings per item with party name, address, and quantity.</p>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-left flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
                  <FileText className="w-5 h-5 text-[#2563eb]" />
                </div>
                <h3 className="text-[18px] font-bold text-gray-900 mb-2">Challan Generation</h3>
                <p className="text-[#64748b] text-[15px] leading-relaxed">Generate and print professional delivery challans instantly for any booking.</p>
              </div>
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]"
        >
          {/* Logo Section */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-full bg-white shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-gray-50 flex flex-col items-center justify-center">
              <div className="bg-[#1a56db] rounded-lg p-2 mb-1 flex items-center justify-center">
                <PackageCheck className="w-6 h-6 text-white" />
              </div>
              <div className="text-[#1a56db] font-bold text-xs tracking-tight leading-none text-center">
                inventory
                <div className="flex items-center justify-center mt-0.5">
                  <div className="h-[1px] w-1.5 bg-[#1a56db]"></div>
                  <span className="text-[8px] font-bold text-[#1a56db] px-0.5 leading-none">manager</span>
                  <div className="h-[1px] w-1.5 bg-[#1a56db]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-[28px] font-bold text-[#0f172a] mb-2 tracking-tight">Welcome to StockFlow</h1>
            <p className="text-[#64748b] text-[15px]">Sign in to continue</p>
          </div>

          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#334155] border border-gray-200 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors mb-6 shadow-sm"
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
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs font-semibold text-gray-400">OR</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <form onSubmit={loginWithEmail} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5 text-center">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-[15px] focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] transition-all outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5 text-center">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="........"
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-[15px] focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a] transition-all outline-none placeholder:text-gray-400 tracking-widest"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-[#0f172a] text-white rounded-xl py-3.5 font-semibold text-[15px] hover:bg-[#1e293b] active:scale-[0.98] transition-all mt-4"
            >
              Sign in
            </button>
          </form>

          <div className="flex items-center justify-between text-[14px]">
            <button className="text-[#64748b] hover:text-[#0f172a] font-medium transition-colors">
              Forgot password?
            </button>
            <div className="text-[#64748b]">
              Need an account?{' '}
              <button onClick={signUpWithEmail} className="text-[#334155] font-semibold hover:text-[#0f172a] transition-colors">
                Sign up
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Catalog...</p>
      </div>
    );
  }

  return (
    <Layout 
      onAddItem={openAddModal}
      onDeleteAll={() => setIsDeleteAllModalOpen(true)}
      onDownloadTemplate={downloadTemplate}
      onImportCSV={handleImportCSV}
      onExportCSV={exportCSV}
      // Assuming layout handles logout if we pass it, but if not we can add a simple button here or inject it
    >
      <Toaster position="top-right" />
      
      {/* Reminder Banner */}
      {dismissedReminders.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-800 text-sm tracking-wide">PENDING REMINDERS ({dismissedReminders.length})</h3>
          </div>
          <div className="flex flex-col gap-2">
            {dismissedReminders.map((r, i) => (
              <div key={`${r.item.id}-${r.booking.id}-${i}`} className="flex items-center justify-between text-sm bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{r.item.name} - {r.booking.partyName || 'Unknown Party'}</span>
                  <span className="text-gray-500 text-xs">Scheduled Send: {new Date(r.booking.dateOfSend!).toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => handleCompleteReminder(r.item, r.booking)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
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
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-50 flex flex-col overflow-hidden"
            >
              <div className="bg-amber-500 p-6 flex flex-col items-center justify-center text-center">
                <div className="bg-white/20 p-3 rounded-full mb-3">
                  <BellRing className="w-8 h-8 text-white animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Time to Send!</h2>
              </div>
              <div className="p-6 flex flex-col items-center text-center gap-2">
                <p className="text-gray-900 font-bold text-lg">{activeReminderPopup.booking.partyName || 'Unknown Party'}</p>
                <p className="text-gray-600 font-medium">Item: {activeReminderPopup.item.name}</p>
                <p className="text-gray-500 text-sm mt-2">
                  Amount: <span className="font-bold text-gray-800">{activeReminderPopup.booking.qty}</span>
                </p>
                <div className="flex flex-col w-full gap-2 mt-6">
                  <button 
                    onClick={() => handleCompleteReminder(activeReminderPopup.item, activeReminderPopup.booking)}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
                  >
                    Mark as Done
                  </button>
                  <button 
                    onClick={() => handleDismissReminder(activeReminderPopup.item, activeReminderPopup.booking)}
                    className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Close & Keep in Banner
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* We can inject Logout in Header via a portal or just float it if Layout doesn't take it... Wait, Layout is shared. Let's add a logout button. */}
      <div className="flex justify-end mb-4">
        <button onClick={logout} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <LogIn className="w-4 h-4 rotate-180" /> Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatsCard 
          icon={<Boxes className="text-blue-500 w-5 h-5" />} 
          bg="bg-blue-100/50"
          label="TOTAL ITEMS" 
          value={stats.totalItems} 
          delay={0.1}
        />
        <StatsCard 
          icon={<TrendingUp className="text-green-500 w-5 h-5" />} 
          bg="bg-green-100/50"
          label="TOTAL STOCK IN" 
          value={stats.totalStockIn} 
          delay={0.2}
        />
        <StatsCard 
          icon={<TrendingDown className="text-orange-500 w-5 h-5" />} 
          bg="bg-orange-100/50"
          label="TOTAL STOCK OUT" 
          value={stats.totalStockOut} 
          delay={0.3}
        />
        <StatsCard 
          icon={<AlertTriangle className="text-red-500 w-5 h-5" />} 
          bg="bg-red-100/50"
          label="LOW STOCK" 
          value={stats.lowStockItems} 
          delay={0.4}
        />
      </div>

      {/* Filters & Search */}
      <div className="space-y-6 mb-8 flex flex-col">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search by item name, size or party... (Ctrl+S)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
            
            <button
              onClick={handleMicClick}
              className={`flex items-center justify-center p-4 rounded-xl border transition-all ${
                isListening
                  ? 'bg-red-50 border-red-200 text-red-500 animate-pulse'
                  : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'
              }`}
              title={isListening ? "Stop listening" : "Search by voice"}
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-4 rounded-xl border text-sm font-medium transition-all ${
                showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {(statusFilter !== 'all' || bookingFilter !== 'all-bookings' || partyFilter !== 'all' || categoryFilter !== 'all' || dateFilterStart || dateFilterEnd) && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold ml-1">
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
                <div className="p-5 bg-white border border-gray-200 rounded-xl flex flex-wrap items-center gap-6 shadow-sm mt-1">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</label>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors"
                    >
                      <option value="all">All Status</option>
                      <option value="in-stock">In Stock</option>
                      <option value="low-stock">Low Stock</option>
                      <option value="out-of-stock">Out of Stock</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bookings</label>
                    <select 
                      value={bookingFilter}
                      onChange={(e) => setBookingFilter(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors"
                    >
                      <option value="all-bookings">All Bookings</option>
                      <option value="no-bookings">No Bookings</option>
                      <option value="has-bookings">Has Bookings</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Party</label>
                    <select 
                      value={partyFilter}
                      onChange={(e) => setPartyFilter(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors max-w-[160px] truncate"
                    >
                      <option value="all">All Parties</option>
                      {allPartyNames.map(party => (
                        <option key={party} value={party}>{party}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</label>
                    <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-colors max-w-[160px] truncate"
                    >
                      <option value="all">All Categories</option>
                      {allCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Updated Date</label>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-colors">
                      <input 
                        type="date"
                        value={dateFilterStart}
                        onChange={(e) => setDateFilterStart(e.target.value)}
                        className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none focus:ring-0 w-[125px]"
                      />
                      <span className="text-gray-400 text-xs">-</span>
                      <input 
                        type="date"
                        value={dateFilterEnd}
                        onChange={(e) => setDateFilterEnd(e.target.value)}
                        className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none focus:ring-0 w-[125px]"
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
                        className="text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Sort by:</span>
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

      <StockTable 
        items={filteredAndSortedItems} 
        onEditItem={openEditModal}
        onUpdateItem={updateItem}
        onDeleteItem={(id) => setItemToDelete(id)}
        onOpenBookings={(item) => setSelectedItemForBookings(item)}
        onOpenChallan={(item, booking) => setSelectedChallanBooking({ item, booking })}
        onOpenHistory={(item) => setSelectedItemForHistory(item)}
      />

      <HistoryModal
        isOpen={!!selectedItemForHistory}
        onClose={() => setSelectedItemForHistory(null)}
        item={selectedItemForHistory!}
      />

      <ItemModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setItemToEdit(null);
        }} 
        onSave={handleSaveItem} 
        itemToEdit={itemToEdit}
        partyNames={allPartyNames}
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
    </Layout>
  );
}

const StatsCard = ({ icon, label, value, bg, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 leading-none">{value}</p>
    </div>
  </motion.div>
);

const SortPill = ({ children, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border ${
      active 
      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
      : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
    }`}
  >
    {children}
  </button>
);


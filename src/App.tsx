/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { StockTable } from './components/StockTable';
import { ItemModal } from './components/ItemModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { BookingsModal } from './components/BookingsModal';
import { ChallanModal } from './components/ChallanModal';
import { StockItem, Booking } from './types';
import { Search, AlertTriangle, TrendingDown, TrendingUp, Boxes, Loader2, LogIn, PackageCheck, ShieldCheck, Box, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import Papa from 'papaparse';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';

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
  const [selectedChallanBooking, setSelectedChallanBooking] = useState<{item: StockItem, booking: Booking} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');

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
      if (err.code === 'auth/unauthorized-domain') {
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

    const finalUpdates = { ...updates, balance, updatedAt: serverTimestamp() };

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
    let result = items.filter(item => 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
  }, [items, searchTerm, sortBy]);

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

            <div className="flex items-center justify-center gap-4 mb-24">
              <button onClick={() => setShowLogin(true)} className="px-6 py-3 text-[15px] font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Get Started Free
              </button>
              <button onClick={() => setShowLogin(true)} className="px-6 py-3 text-[15px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
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
      <div className="space-y-6 mb-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by item name, size or party..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
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


import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2 } from 'lucide-react';
import { StockItem, Booking } from '../types';

interface BookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem | null;
  onSave: (id: string, bookings: Booking[]) => void;
  partyNames?: string[];
}

export const BookingsModal: React.FC<BookingsModalProps> = ({ isOpen, onClose, item, onSave, partyNames = [] }) => {
  const [bookings, setBookings] = React.useState<Booking[]>([]);

  const allAvailablePartyNames = React.useMemo(() => {
    const names = new Set(partyNames);
    bookings.forEach(b => {
      if (b.partyName) names.add(b.partyName);
    });
    return Array.from(names).filter(Boolean).sort();
  }, [partyNames, bookings]);

  React.useEffect(() => {
    if (item && item.bookings) {
      setBookings(item.bookings);
    } else {
      setBookings([]);
    }
  }, [item, isOpen]);

  const addBooking = () => {
    const newBooking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      partyName: '',
      address: '',
      qty: 0,
    };
    setBookings([...bookings, newBooking]);
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBooking = (id: string) => {
    setBookings(bookings.filter(b => b.id !== id));
  };

  const totalBooked = bookings.reduce((sum, b) => sum + (Number(b.qty) || 0), 0);

  const handleSave = () => {
    if (item) {
      onSave(item.id, bookings);
      onClose();
    }
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#f8f9fa] rounded-[16px] shadow-2xl w-full max-w-[540px] relative z-10 flex flex-col"
          >
            <div className="pt-6 px-6 flex items-start justify-between border-b border-transparent">
              <h2 className="text-[22px] font-bold text-[#111827] tracking-tight">
                Bookings — <span className="text-[#2962d9]">{item.name}</span>
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors -mt-1 -mr-1 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto max-h-[75vh]">
              <div className="grid grid-cols-[1.5fr_1.5fr_80px_32px] gap-3 mb-2">
                <div className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Party Name</div>
                <div className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Address</div>
                <div className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Qty</div>
                <div></div>
              </div>

              <div className="space-y-3">
                <datalist id={`party-names-${item.id}`}>
                  {allAvailablePartyNames.map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>

                {bookings.map((booking, index) => (
                  <div key={booking.id} className="grid grid-cols-[1.5fr_1.5fr_80px_32px] gap-3 items-center group">
                    <input
                      type="text"
                      list={`party-names-${item.id}`}
                      placeholder="Party name"
                      value={booking.partyName}
                      onChange={(e) => updateBooking(booking.id, { partyName: e.target.value })}
                      className={`w-full bg-white border ${index === 0 && booking.partyName === '' ? 'border-[#2962d9]' : 'border-gray-200'} rounded-[8px] px-3.5 py-2.5 text-[14px] text-gray-900 focus:outline-none focus:border-[#2962d9] focus:ring-1 focus:ring-[#2962d9] placeholder:text-gray-400`}
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={booking.address}
                      onChange={(e) => updateBooking(booking.id, { address: e.target.value })}
                      className="w-full bg-transparent border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-gray-900 focus:outline-none focus:border-[#2962d9] focus:ring-1 focus:ring-[#2962d9] placeholder:text-[#6b7280]"
                    />
                    <div className="relative">
                       <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={booking.qty === 0 ? '' : booking.qty}
                        onChange={(e) => updateBooking(booking.id, { qty: e.target.value === '' ? 0 : Number(e.target.value) })}
                        className="w-full bg-transparent border border-gray-200 rounded-[8px] px-3 py-2.5 text-[14px] text-center text-gray-900 focus:outline-none focus:border-[#2962d9] focus:ring-1 focus:ring-[#2962d9] placeholder:text-gray-900"
                      />
                    </div>
                    <button 
                      onClick={() => removeBooking(booking.id)}
                      className="text-[#f87171] hover:text-red-700 transition-colors flex items-center justify-center p-1"
                    >
                      <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={addBooking}
                  className="w-full bg-transparent border border-gray-200 hover:bg-gray-100 rounded-[8px] py-2.5 flex items-center justify-center gap-2 text-[14px] font-medium text-[#111827] transition-colors mt-2"
                >
                  <Plus className="w-[16px] h-[16px] text-[#111827]" strokeWidth={2} />
                  Add Party
                </button>
              </div>
              
              <div className="mt-6 pt-5 border-t border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[#6b7280] text-[15px]">Total Booked</span>
                  <span className="text-[18px] font-bold text-[#111827]">{totalBooked}</span>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-transparent border border-gray-200 text-[#374151] rounded-[8px] text-[14px] font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-[#2962d9] text-white rounded-[8px] text-[14px] font-medium hover:bg-blue-700 transition-colors"
                  >
                    Save Bookings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

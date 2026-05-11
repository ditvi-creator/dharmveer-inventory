import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2 } from 'lucide-react';
import { StockItem, Booking } from '../types';

const DateTimeInput = ({ 
  value, 
  onChange, 
  label,
  rootStyle,
  labelStyle,
  timeContainerStyle
}: { 
  value: string; 
  onChange: (val: string) => void; 
  label: string; 
  rootStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  timeContainerStyle?: React.CSSProperties;
}) => {
  const datePart = value ? value.split('T')[0] : '';
  const timePart = value ? value.split('T')[1] : '';
  const hour24 = timePart ? parseInt(timePart.split(':')[0]) : 12;
  const minute = timePart ? timePart.split(':')[1] : '00';
  const ampm = timePart ? (hour24 >= 12 ? 'PM' : 'AM') : 'AM';
  const hour12 = timePart ? (hour24 % 12 || 12).toString().padStart(2, '0') : '12';

  const handleDateChange = (newDate: string) => {
    if (!newDate) {
      onChange('');
      return;
    }
    const h24 = ampm === 'PM' ? (hour12 === '12' ? 12 : parseInt(hour12) + 12) : (hour12 === '12' ? 0 : parseInt(hour12));
    onChange(`${newDate}T${h24.toString().padStart(2, '0')}:${minute || '00'}`);
  };

  const handleTimeChange = (newHour12: string, newMinute: string, newAmpm: string) => {
    if (!datePart) return; // Need date first
    const h24 = newAmpm === 'PM' ? (newHour12 === '12' ? 12 : parseInt(newHour12) + 12) : (newHour12 === '12' ? 0 : parseInt(newHour12));
    onChange(`${datePart}T${h24.toString().padStart(2, '0')}:${newMinute.padStart(2, '0')}`);
  }

  return (
    <div className="w-full border-t border-gray-100 pt-3 md:border-none md:pt-0" style={rootStyle}>
      <label className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide mb-1.5 block" style={labelStyle}>{label}</label>
      <div className="flex flex-col lg:flex-row gap-2">
        <input 
          type="date" 
          value={datePart} 
          onChange={e => handleDateChange(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-[8px] px-3.5 py-2 text-[14px] text-gray-900 focus:outline-none focus:border-[#2962d9] focus:ring-1 focus:ring-[#2962d9] h-[38px] w-full"
        />
        {datePart && (
           <div className="flex bg-white border border-gray-200 rounded-[8px] items-center justify-center px-3 py-1 text-[14px] focus-within:border-[#2962d9] focus-within:ring-1 focus-within:ring-[#2962d9] h-[38px] shrink-0 w-full lg:w-auto" style={timeContainerStyle}>
             <select 
               value={hour12} 
               onChange={e => handleTimeChange(e.target.value, minute, ampm)}
               className="bg-transparent focus:outline-none cursor-pointer appearance-none text-center outline-none min-w-[20px]"
             >
               {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                 <option key={h} value={h.toString().padStart(2, '0')}>{h.toString().padStart(2, '0')}</option>
               ))}
             </select>
             <span className="mx-0.5 text-gray-400 font-medium">:</span>
             <select 
               value={minute} 
               onChange={e => handleTimeChange(hour12, e.target.value, ampm)}
               className="bg-transparent focus:outline-none cursor-pointer appearance-none text-center outline-none min-w-[20px]"
             >
               {['00', '15', '30', '45'].map(m => (
                 <option key={m} value={m}>{m}</option>
               ))}
               {/* Include current minute if it's not one of the standard intervals */}
               {!['00', '15', '30', '45'].includes(minute) && (
                 <option value={minute}>{minute}</option>
               )}
             </select>
             <select 
               value={ampm} 
               onChange={e => handleTimeChange(hour12, minute, e.target.value)}
               className="ml-2 bg-transparent focus:outline-none text-[#2962d9] font-bold cursor-pointer appearance-none outline-none"
             >
               <option value="AM">AM</option>
               <option value="PM">PM</option>
             </select>
           </div>
        )}
      </div>
    </div>
  );
}

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
      dateOfBooking: '',
      dateOfSend: '',
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
      const now = new Date();
      const formattedNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      
      const updatedBookings = bookings.map(b => ({
        ...b,
        dateOfBooking: b.dateOfBooking || formattedNow
      }));
      onSave(item.id, updatedBookings);
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
              <div className="hidden md:block mb-2">
                <div className="grid grid-cols-[1.5fr_1.5fr_120px_32px] gap-3">
                  <div className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Party Name</div>
                  <div className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Address</div>
                  <div className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide">Qty</div>
                  <div></div>
                </div>
              </div>

              <div className="space-y-3">
                <datalist id={`party-names-${item.id}`}>
                  {allAvailablePartyNames.map((name, i) => (
                    <option key={i} value={name} />
                  ))}
                </datalist>

                {bookings.map((booking, index) => (
                  <div key={booking.id} className="flex flex-col gap-3 p-3 md:p-0 bg-white border border-gray-200 md:border-transparent md:bg-transparent rounded-xl md:rounded-none mb-4 md:mb-6">
                    <div className="flex flex-col md:grid md:grid-cols-[1.5fr_1.5fr_120px_32px] gap-3 items-start md:items-center">
                      <div className="w-full">
                        <label className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide mb-1 block md:hidden">Party Name</label>
                        <input
                          type="text"
                          list={`party-names-${item.id}`}
                          placeholder="Party name"
                          value={booking.partyName}
                          onChange={(e) => updateBooking(booking.id, { partyName: e.target.value })}
                          className={`w-full bg-white border ${index === 0 && booking.partyName === '' ? 'border-[#2962d9]' : 'border-gray-200'} rounded-[8px] px-3.5 py-2.5 text-[14px] text-gray-900 focus:outline-none focus:border-[#2962d9] focus:ring-1 focus:ring-[#2962d9] placeholder:text-gray-400`}
                        />
                      </div>
                      <div className="w-full">
                        <label className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide mb-1 block md:hidden">Address</label>
                        <input
                          type="text"
                          placeholder="Address"
                          value={booking.address}
                          onChange={(e) => updateBooking(booking.id, { address: e.target.value })}
                          className="w-full bg-white md:bg-transparent border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[14px] text-gray-900 focus:outline-none focus:border-[#2962d9] focus:ring-1 focus:ring-[#2962d9] placeholder:text-[#6b7280]"
                        />
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex-1 md:w-full relative">
                          <label className="text-[12px] font-medium text-[#6b7280] uppercase tracking-wide mb-1 block md:hidden">Qty</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={booking.qty === 0 ? '' : booking.qty}
                            onChange={(e) => updateBooking(booking.id, { qty: e.target.value === '' ? 0 : Number(e.target.value) })}
                            className="w-full bg-white md:bg-transparent border border-gray-200 rounded-[8px] px-3 py-2.5 text-[14px] text-center text-gray-900 focus:outline-none focus:border-[#2962d9] focus:ring-1 focus:ring-[#2962d9] placeholder:text-gray-900"
                          />
                        </div>
                        <button 
                          onClick={() => removeBooking(booking.id)}
                          className="text-[#f87171] hover:text-red-700 bg-red-50 md:bg-transparent rounded-lg md:rounded-none transition-colors flex items-center justify-center p-2.5 md:p-1 md:mt-0 mt-[22px]"
                        >
                          <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col md:grid md:grid-cols-2 gap-4 mt-2">
                       <DateTimeInput 
                        label="Date of booking"
                        value={booking.dateOfBooking || ''}
                        onChange={(val) => updateBooking(booking.id, { dateOfBooking: val })}
                        rootStyle={{
                          marginRight: '0px',
                          width: '200px'
                        }}
                        timeContainerStyle={{
                          width: '90px',
                          paddingLeft: '10px',
                          marginLeft: '-5px'
                        }}
                      />
                      <DateTimeInput 
                        label="Date of send"
                        value={booking.dateOfSend || ''}
                        onChange={(val) => updateBooking(booking.id, { dateOfSend: val })}
                        rootStyle={{
                          width: '200px',
                          paddingLeft: '10px',
                          marginLeft: '-8px'
                        }}
                        labelStyle={{
                          marginLeft: '0px'
                        }}
                        timeContainerStyle={{
                          width: '100px',
                          paddingLeft: '1px',
                          marginRight: '0px',
                          marginLeft: '-7px',
                          paddingRight: '-10px'
                        }}
                      />
                    </div>
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

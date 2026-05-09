import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X, Download, Package } from 'lucide-react';
import { StockItem, Booking } from '../types';
import html2pdf from 'html2pdf.js';

interface ChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  item: StockItem | null;
}

export const ChallanModal: React.FC<ChallanModalProps> = ({ isOpen, onClose, booking, item }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const challanNo = React.useMemo(() => {
    return 'CH-' + Math.floor(100000 + Math.random() * 900000);
  }, [isOpen]);

  const currentDate = React.useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [isOpen]);

  if (!booking || !item) return null;

  const handleExportPDF = () => {
    const element = componentRef.current;
    if (!element) return;
    
    const opt = {
      margin: 10,
      filename: `challan-${booking.partyName}.pdf`,
      image: { type: 'jpeg', quality: 0.95 } as any,
      html2canvas: { scale: 1.5, logging: false, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    } as any;
    html2pdf().set(opt).from(element).save();
  };

  const handlePrint = () => {
    const originalContent = componentRef.current;
    if (!originalContent) return;

    // Get all standard styles
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n');

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // If popups are blocked by the browser (or iframe sandbox), fallback to downloading the PDF
    if (!printWindow) {
      handleExportPDF();
      return;
    }

    // Write the document structure for the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Challan - ${challanNo}</title>
          ${styles}
          <style>
            @page { size: auto; margin: 15mm; }
            body { 
              background-color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              padding: 20px;
            }
            #challan-content {
              border: none !important;
              box-shadow: none !important;
              max-width: 800px;
              margin: 0 auto;
            }
            /* Hide the standard borders inside print out */
            .border { border-color: #e5e7eb !important; }
          </style>
        </head>
        <body>
          ${originalContent.outerHTML}
          <script>
            // Wait for styles to finish rendering, then print and close
            setTimeout(() => {
              window.focus();
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
            className="bg-[#f8f9fa] rounded-[16px] shadow-2xl w-full max-w-[600px] relative z-10 flex flex-col"
          >
            <div className="pt-6 px-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#111827]">
                <Printer className="w-6 h-6" strokeWidth={2} />
                <h2 className="text-[20px] font-bold tracking-tight">
                  Delivery Challan
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors -mt-1 -mr-1 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-2">
              <div ref={componentRef} id="challan-content" className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-[#2962d9] p-5 flex items-center justify-between text-[#ffffff]">
                  <div className="flex items-center gap-2">
                    <Package className="w-6 h-6" />
                    <span className="text-[20px] font-bold tracking-wide">Dharmveer Inventory</span>
                  </div>
                  <div className="text-[12px] font-bold tracking-wider uppercase">
                    Delivery Challan
                  </div>
                </div>

                {/* Details Section */}
                <div className="bg-[#f8f9fa]">
                  <div className="px-6 py-4 flex justify-between items-center text-[14px] border-b border-[#e5e7eb]">
                    <div className="text-[#4b5563]">
                      Challan No.: <span className="font-bold text-[#111827]">{challanNo}</span>
                    </div>
                    <div className="text-[#4b5563]">
                      Date: <span className="font-bold text-[#111827]">{currentDate}</span>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-b border-[#e5e7eb]">
                    <div className="text-[12px] font-medium text-[#6b7280] uppercase tracking-widest mb-2">BILL TO</div>
                    <div className="text-[18px] font-bold text-[#111827]">{booking.partyName || 'Unknown Party'}</div>
                    {booking.address && (
                      <div className="text-[14px] text-[#4b5563] mt-1">{booking.address}</div>
                    )}
                  </div>

                  {/* Table */}
                  <div className="w-full">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#e5e7eb] text-[13px] font-medium text-[#6b7280]">
                          <th className="py-3 px-6 text-left font-medium w-12">#</th>
                          <th className="py-3 px-6 text-left font-medium">Item Name</th>
                          <th className="py-3 px-6 text-left font-medium">Size</th>
                          <th className="py-3 px-6 text-right font-medium">QTY (Booked)</th>
                          <th className="py-3 px-6 text-left font-medium w-20">Unit</th>
                        </tr>
                      </thead>
                      <tbody className="bg-[#ffffff] text-[14px]">
                        <tr className="border-b border-[#f3f4f6]">
                          <td className="py-4 px-6 text-[#6b7280]">1</td>
                          <td className="py-4 px-6 font-bold text-[#111827]">{item.name}</td>
                          <td className="py-4 px-6 text-[#4b5563]">{item.size}</td>
                          <td className="py-4 px-6 text-right font-bold text-[#2962d9] text-[16px]">{booking.qty}</td>
                          <td className="py-4 px-6 text-[#4b5563]">{item.unit || 'BOX'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Total */}
                  <div className="px-6 py-4 border-b border-[#e5e7eb] bg-[#ffffff] flex justify-end items-center gap-2">
                    <span className="text-[15px] font-bold text-[#374151]">Total Quantity:</span>
                    <span className="text-[18px] font-bold text-[#2962d9]">{booking.qty} {item.unit || 'BOX'}</span>
                  </div>

                  {/* Signatures */}
                  <div className="px-6 py-8 flex justify-between bg-[#f8f9fa]">
                    <div>
                      <div className="text-[13px] text-[#6b7280] mb-8">Authorised Signature:</div>
                      <div className="w-48 border-b border-[#9ca3af]"></div>
                    </div>
                    <div>
                      <div className="text-[13px] text-[#6b7280] mb-8">Received By:</div>
                      <div className="w-48 border-b border-[#9ca3af]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-[8px] text-[15px] font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleExportPDF}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-[8px] text-[15px] font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={() => handlePrint()}
                className="px-6 py-2.5 bg-[#2962d9] text-white rounded-[8px] text-[15px] font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Challan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

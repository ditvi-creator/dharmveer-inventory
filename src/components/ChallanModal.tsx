import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X, Download, Package, Loader2, MessageCircle } from 'lucide-react';
import { StockItem, Booking } from '../types';
import html2pdf from 'html2pdf.js';
import { toJpeg } from 'html-to-image';
import { toast } from 'sonner';

interface ChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  item: StockItem | null;
}

export const ChallanModal: React.FC<ChallanModalProps> = ({ isOpen, onClose, booking, item }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);

  const challanNo = React.useMemo(() => {
    return booking?.challanNo || '';
  }, [isOpen, booking]);

  const currentDate = React.useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, [isOpen]);

  if (!booking || !item) return null;

  const handleExportPDF = async () => {
    const element = componentRef.current;
    if (!element) return;
    
    setIsExporting(true);
    try {
      const opt = {
        margin: 10,
        filename: `challan-${booking.partyName}.pdf`,
        image: { type: 'jpeg', quality: 0.95 } as any,
        html2canvas: { scale: 1.5, logging: false, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      } as any;
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = async () => {
    const element = componentRef.current;
    if (!element) return;

    setIsSharing(true);
    try {
      const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff', skipFonts: true });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `challan-${challanNo}.jpg`, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Delivery Challan - ${challanNo}`,
          text: `Delivery Challan for ${booking.partyName}`,
          files: [file]
        });
      } else {
        // Fallback to downloading
        const link = document.createElement('a');
        link.download = `challan-${challanNo}.jpg`;
        link.href = dataUrl;
        link.click();
        toast.success("JPG Downloaded! You can share it to WhatsApp manually.");
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast.error("Could not share. Try again.");
    } finally {
      setIsSharing(false);
    }
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
                  transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
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
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 transition-colors -mt-1 -mr-1 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-2 pb-6">
              <div ref={componentRef} id="challan-content" className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
                
                <div className="p-8 pb-0">
                  {/* Header Row */}
                  <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-7 h-7 text-blue-600" />
                        <h1 className="text-2xl font-black tracking-tighter text-gray-900 uppercase">Delivery Challan</h1>
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Original for Recipient</p>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">Challan No.</div>
                      <div className="text-xl font-bold text-gray-900">{challanNo}</div>
                      <div className="text-gray-500 text-sm mt-1">Date: <span className="text-gray-800 font-medium">{currentDate}</span></div>
                    </div>
                  </div>

                  {/* Bill To Section */}
                  <div className="mb-8">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</div>
                    <div className="text-lg font-bold text-gray-900">{booking.partyName || 'Unknown Party'}</div>
                    {booking.address && (
                      <div className="text-sm text-gray-600 mt-1 max-w-sm">{booking.address}</div>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto px-8">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b-2 border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 pr-4 text-left w-12">#</th>
                        <th className="py-3 px-4 text-left">Item Name</th>
                        <th className="py-3 px-4 text-left">Size</th>
                        <th className="py-3 px-4 text-center w-24">Unit</th>
                        <th className="py-3 pl-4 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-gray-100">
                        <td className="py-4 pr-4 text-gray-500 font-medium">1</td>
                        <td className="py-4 px-4 font-bold text-gray-900">{item.name}</td>
                        <td className="py-4 px-4 text-gray-600">{item.size}</td>
                        <td className="py-4 px-4 text-center text-gray-600 font-medium">{item.unit || 'BOX'}</td>
                        <td className="py-4 pl-4 text-right font-bold text-blue-600 text-lg">{booking.qty}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="px-8 py-4 bg-gray-50 border-t border-b border-gray-200 flex justify-end items-center gap-4 mt-8">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Quantity:</span>
                  <span className="text-2xl font-black text-gray-900">{booking.qty} <span className="text-lg font-bold text-gray-500 ml-1">{item.unit || 'BOX'}</span></span>
                </div>

                {/* Signatures */}
                <div className="px-8 py-10 flex justify-between flex-wrap gap-8 bg-white pb-12">
                  <div className="flex flex-col">
                    <div className="w-40 border-b-2 border-gray-300 mb-3"></div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Authorised Signatory</div>
                  </div>
                  <div className="flex flex-col">
                    <div className="w-40 border-b-2 border-gray-300 mb-3"></div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Receiver's Signature</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 flex flex-col sm:flex-row justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-[8px] text-[15px] font-medium hover:bg-gray-50 dark:bg-gray-900/50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleShareWhatsApp}
                disabled={isSharing}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#25D366] text-white rounded-[8px] text-[15px] font-medium hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-[20px] h-[20px]" />
                    Share WhatsApp
                  </>
                )}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-[8px] text-[15px] font-medium hover:bg-gray-50 dark:bg-gray-900/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export PDF
                  </>
                )}
              </button>
              <button
                onClick={() => handlePrint()}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#2962d9] text-white rounded-[8px] text-[15px] font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

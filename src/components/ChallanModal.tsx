import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Printer, X, Download, Package, Loader2, MessageCircle } from 'lucide-react';
import { StockItem, Booking } from '../types';
import { toJpeg } from 'html-to-image';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
import { useSettingsContext } from '../SettingsContext';

interface ChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  item: StockItem | null;
}

export const ChallanModal: React.FC<ChallanModalProps> = ({ isOpen, onClose, booking, item }) => {
  const { settings } = useSettingsContext();
  const componentRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [printSize, setPrintSize] = React.useState<'full' | 'half' | 'quarter'>('full');

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

  const handlePrint = () => {
    const printContent = componentRef.current;
    if (!printContent) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // If popup blocker blocked it, fallback to PDF
      toast.info("Popups are blocked. Exporting PDF instead. Please allow popups to print directly.");
      handleExportPDF();
      return;
    }

    // Capture current styles to inject into the print window
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('');

    let scaleStyle = '';
    if (printSize === 'half') {
      scaleStyle = `
        #print-container {
          transform: scale(0.707);
          transform-origin: top left;
        }
      `;
    } else if (printSize === 'quarter') {
      scaleStyle = `
        #print-container {
          transform: scale(0.5);
          transform-origin: top left;
        }
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Challan_${challanNo}</title>
          ${styleTags}
          <style>
            @media print {
              body { 
                margin: 0; 
                padding: 20px; 
              }
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              ${scaleStyle}
            }
          </style>
        </head>
        <body class="bg-white">
          <div id="print-container">
            ${printContent.outerHTML}
          </div>
          <script>
            // Wait for styles to load
            setTimeout(() => {
              window.print();
              setTimeout(() => {
                window.close();
              }, 200);
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!booking || !item) return null;

  const handleExportPDF = async () => {
    const element = componentRef.current;
    if (!element) return;
    
    setIsExporting(true);
    try {
      const opt = {
        margin: 10,
        filename: `challan-${booking.partyName}.pdf`,
        image: { type: 'jpeg', quality: 0.8 } as any,
        html2canvas: { scale: 1, logging: false, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      } as any;
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error("Could not export PDF.");
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

  const oldHandlePrintRemoved = true;

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

            <div className="pl-6 pr-6 py-2 pb-6">
              <div ref={componentRef} id="challan-content" className="bg-[#ffffff] border border-[#e5e7eb] rounded-xl overflow-hidden flex flex-col shadow-sm">
                
                <div className="p-8 pb-0">
                  {/* Header Row */}
                  <div className="flex justify-between items-start border-b border-[#e5e7eb] pb-6 mb-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-7 h-7 text-[#2563eb]" />
                        <h1 className="text-2xl font-black tracking-tighter text-[#111827] uppercase">{settings.companyName}</h1>
                      </div>
                      <p className="text-[#6b7280] text-sm font-medium">Delivery Challan - Original</p>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="text-[#6b7280] text-sm font-medium uppercase tracking-wider">Challan No.</div>
                      <div className="text-xl font-bold text-[#111827]">{settings.challanPrefix}{challanNo}</div>
                      <div className="text-[#6b7280] text-sm mt-1">Date: <span className="text-[#1f2937] font-medium">{currentDate}</span></div>
                    </div>
                  </div>

                  {/* Bill To Section */}
                  <div className="mb-8">
                    <div className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Billed To</div>
                    <div className="text-lg font-bold text-[#111827]">{booking.partyName || 'Unknown Party'}</div>
                    {booking.address && (
                      <div className="text-sm text-[#4b5563] mt-1 max-w-sm">{booking.address}</div>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="w-full overflow-x-auto px-8">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b-2 border-[#1f2937] text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                        <th className="py-3 pr-4 text-left w-12">#</th>
                        <th className="py-3 px-4 text-left">Item Name</th>
                        <th className="py-3 px-4 text-left">Size</th>
                        <th className="py-3 px-4 text-center w-24">Unit</th>
                        <th className="py-3 pl-4 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-[#f3f4f6]">
                        <td className="py-4 pr-4 text-[#6b7280] font-medium">1</td>
                        <td className="py-4 px-4 font-bold text-[#111827]">{item.name}</td>
                        <td className="py-4 px-4 text-[#4b5563]">{item.size}</td>
                        <td className="py-4 px-4 text-center text-[#4b5563] font-medium">{item.unit || 'BOX'}</td>
                        <td className="py-4 pl-4 text-right font-bold text-[#2563eb] text-lg">{booking.qty}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div className="px-8 py-4 bg-[#f9fafb] border-t border-b border-[#e5e7eb] flex justify-end items-center gap-4 mt-8">
                  <span className="text-sm font-bold text-[#6b7280] uppercase tracking-wider">Total Quantity:</span>
                  <span className="text-2xl font-black text-[#111827]">{booking.qty} <span className="text-lg font-bold text-[#6b7280] ml-1">{item.unit || 'BOX'}</span></span>
                </div>

                {/* Terms and Conditions */}
                {settings.challanTerms && settings.challanPrintTerms && (
                  <div className="px-8 mt-6 challan-terms">
                    <div className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest mb-2">Terms & Conditions</div>
                    <div className="text-xs text-[#6b7280] whitespace-pre-wrap leading-relaxed">{settings.challanTerms}</div>
                  </div>
                )}

                {/* Signatures */}
                <div className="px-8 py-10 flex justify-between flex-wrap gap-8 bg-[#ffffff] pt-12 pb-8">
                  {settings.challanShowSignature ? (
                    <div className="flex flex-col">
                      <div className="w-40 border-b-2 border-[#d1d5db] mb-3"></div>
                      <div className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest text-center">Authorised Signatory</div>
                    </div>
                  ) : <div></div>}
                  <div className="flex flex-col">
                    <div className="w-40 border-b-2 border-[#d1d5db] mb-3"></div>
                    <div className="text-xs font-bold text-[#9ca3af] uppercase tracking-widest text-center">Receiver's Signature</div>
                  </div>
                </div>

                {/* Footer */}
                {settings.challanFooter && settings.challanPrintFooter && (
                  <div className="px-8 py-4 bg-[#f3f4f6] text-center text-xs font-medium text-[#6b7280] challan-footer">
                    {settings.challanFooter}
                  </div>
                )}
              </div>
            </div>

            <div className="pl-5 pr-6 py-6 flex flex-col sm:flex-row justify-end gap-3 mt-2">
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
                    WhatsApp
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
                    PDF
                  </>
                )}
              </button>
              <div className="flex w-full sm:w-auto gap-2">
                <select
                  value={printSize}
                  onChange={(e) => setPrintSize(e.target.value as any)}
                  className="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-[8px] text-[14px] font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="full">Full Page</option>
                  <option value="half">Half (1/2)</option>
                  <option value="quarter">Quarter (1/4)</option>
                </select>
                <button
                  onClick={() => handlePrint()}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-[#2962d9] text-white rounded-[8px] text-[15px] font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

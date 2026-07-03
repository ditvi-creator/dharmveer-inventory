import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Settings, Eye, Check, Columns, Grid, Layout, BookOpen, AlertCircle, FileText, Badge } from 'lucide-react';
import { StockItem, Godown } from '../types';
import { toast } from 'sonner';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface BulkPrintLabelsModalProps {
  selectedItems: StockItem[];
  onClose: () => void;
  godowns?: Godown[];
}

export const BarcodeRenderer: React.FC<{
  value: string;
  labelText: string;
  lightTheme?: boolean;
}> = ({ value, labelText, lightTheme = true }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 0.8, // adjusted slightly for standard scannability
          height: 25,
          displayValue: true,
          text: labelText,
          fontSize: 7.5,
          margin: 1,
          background: "transparent",
          lineColor: lightTheme ? "#000000" : "#9ca3af"
        });
      } catch (err) {
        console.error("Failed to render barcode", err);
      }
    }
  }, [value, labelText, lightTheme]);

  return (
    <svg 
      ref={svgRef} 
      className="max-w-full h-auto max-h-[45px] shrink-0 mx-auto"
    />
  );
};

export const QRCodeRenderer: React.FC<{
  value: string;
  lightTheme?: boolean;
  className?: string;
}> = ({ value, lightTheme = true, className = "w-10 h-10 shrink-0" }) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      margin: 1,
      color: {
        dark: lightTheme ? '#000000' : '#ffffff',
        light: '#ffffff00'
      }
    })
      .then(url => {
        if (active) setSrc(url);
      })
      .catch(err => {
        console.error("Failed to render QR", err);
      });
    return () => {
      active = false;
    };
  }, [value, lightTheme]);

  if (!src) {
    return <div className={`${className} bg-gray-100 dark:bg-gray-800 animate-pulse rounded`} />;
  }

  return (
    <img 
      src={src} 
      className={className} 
      alt="QR Code" 
      referrerPolicy="no-referrer" 
    />
  );
};

type LabelStyle = 'industrial' | 'warehouse' | 'specs' | 'minimalist';

export const BulkPrintLabelsModal: React.FC<BulkPrintLabelsModalProps> = ({ selectedItems, onClose, godowns }) => {
  const [style, setStyle] = useState<LabelStyle>('warehouse');
  const [columns, setColumns] = useState<number>(3);
  const [showImage, setShowImage] = useState<boolean>(true);
  const [showStockBalance, setShowStockBalance] = useState<boolean>(true);
  const [showReorderLevel, setShowReorderLevel] = useState<boolean>(true);
  const [showPartyName, setShowPartyName] = useState<boolean>(true);
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [showQR, setShowQR] = useState<boolean>(true);
  const [labelSize, setLabelSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [customTitle, setCustomTitle] = useState<string>('STOCKIFY INVENTORY');

  const getGodownStocksString = (item: StockItem) => {
    const list = godowns || [];
    if (list.length === 0) {
      try {
        const saved = localStorage.getItem('app_godowns');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            list.push(...parsed);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    if (list.length === 0) {
      if (!item.godownStocks) return '0';
      return Object.entries(item.godownStocks)
        .map(([id, qty]) => `${id}: ${qty}`)
        .join(', ');
    }
    
    return list
      .map(g => {
        const qty = item.godownStocks?.[g.id] || 0;
        return `${g.name}: ${qty}`;
      })
      .join(', ');
  };

  const getBarcodeData = (item: StockItem) => {
    const godownQtyStr = getGodownStocksString(item);
    return `Name: ${item.name} | Size: ${item.size} | Unit: ${item.unit || 'BOX'} | Godowns: ${godownQtyStr} | Balance: ${item.balance} | Min: ${item.reorderLevel} | Party: ${item.partyName || 'N/A'}`;
  };

  const getBarcodeSVGString = (text: string, labelText: string, lightTheme = true) => {
    try {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      JsBarcode(svg, text, {
        format: "CODE128",
        width: 0.8,
        height: 25,
        displayValue: true,
        text: labelText,
        fontSize: 7.5,
        margin: 2,
        background: "transparent",
        lineColor: lightTheme ? "#000000" : "#9ca3af"
      });
      return svg.outerHTML;
    } catch (e) {
      console.error("Barcode generation error", e);
      return '';
    }
  };


  // Build high-fidelity printer HTML page and execute native print
  const handlePrint = async () => {
    if (selectedItems.length === 0) {
      toast.error("No items selected for printing.");
      return;
    }

    const toastId = toast.loading("Generating scannable high-res print labels...");

    const sizeClasses = {
      sm: 'padding: 8px; font-size: 11px; height: 110px;',
      md: 'padding: 16px; font-size: 13px; height: 160px;',
      lg: 'padding: 24px; font-size: 15px; height: 210px;'
    };

    const gridCols = {
      1: 'grid-template-columns: repeat(1, minmax(0, 1fr));',
      2: 'grid-template-columns: repeat(2, minmax(0, 1fr));',
      3: 'grid-template-columns: repeat(3, minmax(0, 1fr));',
      4: 'grid-template-columns: repeat(4, minmax(0, 1fr));'
    }[columns] || 'grid-template-columns: repeat(3, minmax(0, 1fr));';

    try {
      // Generate inner items HTML asynchronously to fetch QR codes
      const itemsHTMLArray = await Promise.all(selectedItems.map(async (item) => {
        const barcodeData = getBarcodeData(item);
        const labelText = `* ${item.name.substring(0, 15).toUpperCase()} (${item.id.substring(0, 4).toUpperCase()}) *`;

        // Setup dynamic variables
        const barcodeHTML = showBarcode ? `
          <div style="display: flex; flex-direction: column; align-items: center; margin-top: 6px; font-family: monospace; font-size: 8px; width: 100%;">
            ${getBarcodeSVGString(barcodeData, labelText, true)}
          </div>
        ` : '';

        let qrHTML = '';
        if (showQR) {
          const qrUrl = await QRCode.toDataURL(barcodeData, {
            margin: 1,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          qrHTML = `
            <img src="${qrUrl}" style="width: 44px; height: 44px; flex-shrink: 0;" />
          `;
        }

        const imgHTML = (showImage && item.imageUrl) ? `
          <div style="width: 44px; height: 44px; border-radius: 6px; overflow: hidden; border: 1px solid #e5e7eb; margin-right: 8px; flex-shrink: 0;">
            <img src="${item.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        ` : '';

        const specsHTML = `
          <div style="font-size: 11px; color: #4b5563; margin-top: 4px; display: flex; flex-direction: column; gap: 2px; flex-grow: 1;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #f3f4f6; padding-bottom: 2px;">
              <span>Size/Unit:</span>
              <strong style="color: #111827;">${item.size} / ${item.unit || 'BOX'}</strong>
            </div>
            ${showStockBalance ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #f3f4f6; padding-bottom: 2px;">
                <span>Stock Balance:</span>
                <strong style="color: #111827;">${item.balance}</strong>
              </div>
            ` : ''}
            ${showReorderLevel ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #f3f4f6; padding-bottom: 2px;">
                <span>Reorder Level:</span>
                <strong style="color: #111827;">${item.reorderLevel}</strong>
              </div>
            ` : ''}
            ${showPartyName && item.partyName ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #f3f4f6; padding-bottom: 2px; text-overflow: truncate;">
                <span>Default Supplier:</span>
                <strong style="color: #111827; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.partyName}</strong>
              </div>
            ` : ''}
          </div>
        `;

        if (style === 'industrial') {
          return `
            <div class="label-card" style="border: 2px solid #111827; border-radius: 4px; background: white; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; ${sizeClasses[labelSize]}">
              <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 1.5px solid #111827; padding-bottom: 4px; margin-bottom: 4px;">
                <span style="font-size: 8px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">${customTitle}</span>
                ${item.category ? `<span style="font-size: 8px; font-weight: 700; background: #e5e7eb; padding: 1px 4px; border-radius: 2px; text-transform: uppercase;">${item.category}</span>` : ''}
              </div>
              <div style="font-size: 14px; font-weight: 900; color: black; line-height: 1.1; margin-bottom: 2px; text-transform: uppercase;">${item.name}</div>
              <div style="font-size: 11px; font-weight: 800; color: #1f2937;">SIZE: ${item.size}</div>
              <div style="display: flex; justify-content: space-between; align-items: end; margin-top: auto;">
                ${barcodeHTML}
                ${showStockBalance ? `<div style="text-align: right;"><span style="font-size: 8px; display: block; color: #4b5563;">QTY</span><strong style="font-size: 14px; font-weight: 900; color: black;">${item.balance} ${item.unit || 'BOX'}</strong></div>` : ''}
              </div>
            </div>
          `;
        }

        if (style === 'minimalist') {
          return `
            <div class="label-card" style="border: 1px solid #d1d5db; border-radius: 6px; background: white; box-sizing: border-box; display: flex; align-items: center; gap: 12px; page-break-inside: avoid; ${sizeClasses[labelSize]}">
              ${qrHTML}
              <div style="display: flex; flex-direction: column; flex-grow: 1; overflow: hidden;">
                <span style="font-size: 12px; font-weight: 800; color: #111827; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${item.name}</span>
                <span style="font-size: 10px; font-weight: 600; color: #4b5563; margin-top: 2px;">Size: ${item.size} | ${item.unit || 'BOX'}</span>
                ${showStockBalance ? `<span style="font-size: 9px; color: #6b7280; margin-top: 2px;">Bal: <strong>${item.balance}</strong> | Min: ${item.reorderLevel}</span>` : ''}
              </div>
            </div>
          `;
        }

        if (style === 'specs') {
          return `
            <div class="label-card" style="border: 1.5px solid #3b82f6; border-radius: 8px; background: white; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; ${sizeClasses[labelSize]}">
              <div style="background: #eff6ff; margin: -12px -12px 8px -12px; padding: 6px 12px; border-bottom: 1.5px solid #bfdbfe; border-top-left-radius: 6px; border-top-right-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 9px; font-weight: 800; color: #1d4ed8; letter-spacing: 0.5px;">SPECIFICATION LABEL</span>
                <span style="font-size: 8px; font-weight: 600; color: #1d4ed8;">ID: ${item.id.substring(0, 6)}</span>
              </div>
              <div style="font-size: 13px; font-weight: 800; color: #111827; margin-bottom: 2px;">${item.name}</div>
              ${specsHTML}
              <div style="display: flex; justify-content: flex-end; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #bfdbfe;">
                ${barcodeHTML}
              </div>
            </div>
          `;
        }

        // Warehouse style (Default)
        return `
          <div class="label-card" style="border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; box-shadow: 0 1px 3px rgba(0,0,0,0.05); ${sizeClasses[labelSize]}">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
              <div style="display: flex; align-items: center; overflow: hidden;">
                ${imgHTML}
                <div style="overflow: hidden;">
                  <span style="font-size: 8px; font-weight: 700; color: #9ca3af; display: block; letter-spacing: 0.5px; text-transform: uppercase;">${customTitle}</span>
                  <span style="font-size: 13px; font-weight: 800; color: #111827; line-height: 1.2; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; max-width: 140px;">${item.name}</span>
                </div>
              </div>
              ${qrHTML}
            </div>
            
            ${specsHTML}
            
            <div style="display: flex; justify-content: space-between; align-items: end; margin-top: 6px; border-top: 1px solid #f3f4f6; padding-top: 4px;">
              ${barcodeHTML}
              <div style="font-size: 9px; color: #9ca3af; text-align: right; font-family: sans-serif;">
                VERIFIED
              </div>
            </div>
          </div>
        `;
      }));

      const itemsHTML = itemsHTMLArray.join('');

      // Print iframe technique
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <title>Print Inventory Labels - ${selectedItems.length} items</title>
              <style>
                @page {
                  size: portrait;
                  margin: 10mm;
                }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  margin: 0;
                  padding: 0;
                  background-color: white;
                  color: #111827;
                }
                .grid-container {
                  display: grid;
                  ${gridCols}
                  gap: 12px;
                  width: 100%;
                }
                .label-card {
                  box-sizing: border-box;
                  overflow: hidden;
                }
                @media print {
                  body {
                    background-color: white;
                  }
                  .no-print {
                    display: none;
                  }
                }
              </style>
            </head>
            <body>
              <div class="grid-container">
                ${itemsHTML}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() {
                      window.parent.document.body.removeChild(window.frameElement);
                    }, 1000);
                  }, 500);
                };
              </script>
            </body>
          </html>
        `);
        doc.close();
        toast.dismiss(toastId);
        toast.success("Sending labels to your printer. Check your print preview modal.");
      }
    } catch (err) {
      toast.dismiss(toastId);
      console.error(err);
      toast.error("An error occurred during barcode label compilation.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-gray-150 dark:border-gray-800 shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20">
              <Printer className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                Bulk Label PDF Printer
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {selectedItems.length} Items Selected
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Design, preview, and generate clean barcodes, specs, and storage tags for printing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Controls Panel */}
          <div className="w-full md:w-[350px] border-r border-gray-100 dark:border-gray-800 p-6 overflow-y-auto space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/20">
            {/* Style Selection */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-500" />
                <span>Label Template Style</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'warehouse', label: 'Warehouse Tag', desc: 'Comprehensive details' },
                  { id: 'industrial', label: 'Industrial Tag', desc: 'High-contrast black' },
                  { id: 'specs', label: 'Specs Sheet', desc: 'Specification layout' },
                  { id: 'minimalist', label: 'Minimalist QR', desc: 'Compact tag size' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setStyle(item.id as LabelStyle)}
                    className={`p-3 text-left rounded-xl border text-xs flex flex-col gap-1 transition-all ${
                      style === item.id
                        ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <span className="font-extrabold">{item.label}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Header Label */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Header Branding Text
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="STOCKIFY INVENTORY"
                className="w-full text-xs font-bold border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Layout Options */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Columns className="w-3.5 h-3.5 text-blue-500" />
                <span>Page Grid Columns</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((colNum) => (
                  <button
                    key={colNum}
                    onClick={() => setColumns(colNum)}
                    className={`py-2 px-1 text-center font-bold text-xs rounded-lg border transition-all ${
                      columns === colNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {colNum} {colNum === 1 ? 'Col' : 'Cols'}
                  </button>
                ))}
              </div>
            </div>

            {/* Label Sizing */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                Label Height / Padding
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setLabelSize(size)}
                    className={`py-2 px-1 text-center font-bold text-xs rounded-lg border transition-all uppercase ${
                      labelSize === size
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility Toggles */}
            <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
              <label className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                Card Contents & Metadata
              </label>
              {[
                { state: showImage, setter: setShowImage, label: 'Include Product Image' },
                { state: showStockBalance, setter: setShowStockBalance, label: 'Show Stock Quantity' },
                { state: showReorderLevel, setter: setShowReorderLevel, label: 'Show Reorder Safety Level' },
                { state: showPartyName, setter: setShowPartyName, label: 'Show Preferred Supplier' },
                { state: showBarcode, setter: setShowBarcode, label: 'Render Scannable Barcode' },
                { state: showQR, setter: setShowQR, label: 'Render Scannable QR Code' },
              ].map((toggle, tIdx) => (
                <button
                  key={tIdx}
                  onClick={() => toggle.setter(!toggle.state)}
                  className="w-full flex items-center justify-between py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/40 px-2 rounded-lg transition-colors"
                >
                  <span>{toggle.label}</span>
                  <div className={`w-8 h-5 rounded-full transition-colors flex items-center p-0.5 ${toggle.state ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${toggle.state ? 'translate-x-3' : 'translate-x-0'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Preview Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-100/50 dark:bg-gray-950/40 custom-scrollbar">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 mb-4">
              <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-500" />
                <span>Live Sticker Grid Preview</span>
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                *Renders using high-resolution SVG tags
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 dark:text-gray-500">
                <AlertCircle className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm italic font-medium">No items chosen. Choose items in the dashboard first.</p>
              </div>
            ) : (
              <div 
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
                }}
              >
                {selectedItems.map((item) => {
                  const isLowStock = item.balance <= item.reorderLevel;

                  // Template Rendering Styles
                  if (style === 'industrial') {
                    return (
                      <div 
                        key={item.id} 
                        className={`border-2 border-gray-900 dark:border-white p-4 bg-white text-black rounded-sm flex flex-col justify-between select-none ${
                          labelSize === 'sm' ? 'h-28' : labelSize === 'md' ? 'h-40' : 'h-52'
                        }`}
                      >
                        <div className="flex justify-between items-start border-b border-gray-900 pb-1.5 mb-1.5">
                          <span className="text-[8px] font-black tracking-widest text-black uppercase">{customTitle}</span>
                          {item.category && (
                            <span className="text-[8px] font-black bg-gray-200 px-1 py-0.5 rounded text-black text-transform uppercase">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black tracking-tight leading-tight uppercase line-clamp-1">{item.name}</h4>
                        <div className="text-[11px] font-extrabold">SIZE: {item.size}</div>
                        
                        <div className="flex justify-between items-end mt-auto w-full">
                          {showBarcode && (
                            <div className="w-full pr-2">
                              <BarcodeRenderer value={getBarcodeData(item)} labelText={`* ${item.name.substring(0, 15).toUpperCase()} *`} lightTheme={true} />
                            </div>
                          )}
                          {showStockBalance && (
                            <div className="text-right shrink-0">
                              <span className="text-[8px] block text-gray-500 font-bold">QTY</span>
                              <strong className="text-sm font-black leading-none">{item.balance} {item.unit || 'BOX'}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (style === 'minimalist') {
                    return (
                      <div 
                        key={item.id} 
                        className={`border border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-900 rounded-xl flex items-center gap-3 transition-colors select-none ${
                          labelSize === 'sm' ? 'h-24' : labelSize === 'md' ? 'h-32' : 'h-40'
                        }`}
                      >
                        {showQR && <QRCodeRenderer value={getBarcodeData(item)} lightTheme={true} />}
                        <div className="flex flex-col flex-1 overflow-hidden">
                          <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white leading-tight truncate">{item.name}</h4>
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1">
                            Size: {item.size} | {item.unit || 'BOX'}
                          </span>
                          {showStockBalance && (
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5 font-semibold">
                              Bal: <strong className="text-gray-700 dark:text-gray-300 font-bold">{item.balance}</strong> | Safe: {item.reorderLevel}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (style === 'specs') {
                    return (
                      <div 
                        key={item.id} 
                        className={`border border-blue-500/30 dark:border-blue-400/20 p-4 bg-white dark:bg-gray-900 rounded-2xl flex flex-col justify-between transition-all select-none ${
                          labelSize === 'sm' ? 'h-28' : labelSize === 'md' ? 'h-40' : 'h-52'
                        }`}
                      >
                        <div className="bg-blue-50 dark:bg-blue-900/10 -mx-4 -mt-4 px-4 py-2 border-b border-blue-100 dark:border-blue-900/30 rounded-t-2xl flex justify-between items-center">
                          <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 tracking-wider">SPECIFICATION LABEL</span>
                          <span className="text-[8px] font-bold text-blue-500 dark:text-blue-400">ID: {item.id.substring(0, 6).toUpperCase()}</span>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 mt-2 flex-grow">
                          <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate">{item.name}</h4>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5">
                            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-0.5">
                              <span>Spec Specs:</span>
                              <strong className="text-gray-800 dark:text-gray-200">{item.size} / {item.unit || 'BOX'}</strong>
                            </div>
                            {showStockBalance && (
                              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-0.5">
                                <span>Total Balance:</span>
                                <strong className="text-gray-800 dark:text-gray-200">{item.balance}</strong>
                              </div>
                            )}
                            {showPartyName && item.partyName && (
                              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-0.5">
                                <span>Supplier:</span>
                                <strong className="text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{item.partyName}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {showBarcode && (
                          <div className="pt-2 mt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                            <BarcodeRenderer value={getBarcodeData(item)} labelText={`* ${item.name.substring(0, 15).toUpperCase()} *`} lightTheme={true} />
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Default Warehouse Style
                  return (
                    <div 
                      key={item.id} 
                      className={`border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 rounded-2xl flex flex-col justify-between shadow-xs transition-colors select-none ${
                        labelSize === 'sm' ? 'h-28' : labelSize === 'md' ? 'h-40' : 'h-52'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {showImage && item.imageUrl && (
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 dark:border-gray-800 shrink-0">
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">{customTitle}</span>
                            <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white leading-tight truncate">{item.name}</h4>
                          </div>
                        </div>
                        {showQR && <QRCodeRenderer value={getBarcodeData(item)} lightTheme={true} />}
                      </div>

                      <div className="text-[10px] text-gray-500 dark:text-gray-400 flex flex-col gap-0.5 mt-2">
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-0.5">
                          <span>Size / Unit:</span>
                          <strong className="text-gray-800 dark:text-gray-200">{item.size} / {item.unit || 'BOX'}</strong>
                        </div>
                        {showStockBalance && (
                          <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-0.5">
                            <span>Stock Balance:</span>
                            <strong className="text-gray-800 dark:text-gray-200">{item.balance}</strong>
                          </div>
                        )}
                        {showReorderLevel && (
                          <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-0.5">
                            <span>Reorder Trigger:</span>
                            <strong className="text-gray-800 dark:text-gray-200">{item.reorderLevel}</strong>
                          </div>
                        )}
                        {showPartyName && item.partyName && (
                          <div className="flex justify-between">
                            <span>Primary Partner:</span>
                            <strong className="text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{item.partyName}</strong>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                        {showBarcode && <BarcodeRenderer value={getBarcodeData(item)} labelText={`* ${item.name.substring(0, 15).toUpperCase()} *`} lightTheme={true} />}
                        <span className="text-[8px] font-black text-gray-400 tracking-wider">VERIFIED STICKER</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-bold hidden sm:block">
            Tip: Adjust columns and layout spacing to match your Avery labels sheets!
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-850 border border-gray-200 dark:border-gray-800 transition-colors bg-white dark:bg-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Send to Printer / Save PDF</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

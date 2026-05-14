const fs = require('fs');
let file = './src/components/StockTable.tsx';
let txt = fs.readFileSync(file, 'utf8');

// 1. Remove bg-gray-50 from header TR
txt = txt.replace(/<tr className="bg-gray-50 dark:bg-gray-900\/50 border-b border-gray-200 dark:border-gray-700">/g, 
'<tr className="border-b border-gray-200 dark:border-gray-700">');

// 2. Fix the row hover and isLowStock
txt = txt.replace(/className={`hover:bg-gray-50 dark:bg-gray-900\/50 transition-colors group \${isLowStock \? 'bg-red-50 dark:bg-red-900\/20' : ''}`}/g, 
'className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${isLowStock ? \'bg-red-50 dark:bg-red-900/30\' : \'\'}`}');

// 3. Remove bg-gray-50 from MP and KL columns
txt = txt.replace(/border-r border-gray-50 dark:border-gray-800\/50 bg-gray-50 dark:bg-gray-900\/50/g, 
'border-r border-gray-50 dark:border-gray-800/50');

// 4. Fix input focus:bg-white dark:bg-gray-800
txt = txt.replace(/focus:bg-white dark:bg-gray-800/g, 'focus:bg-white dark:focus:bg-gray-800');

// 5. Fix printer
txt = txt.replace(/bg-white dark:bg-gray-800 rounded-none/g, '');

// Also fix the absolute red marker on low stock which had dark:bg-red-900/200, wait, it's 20 now.
// I already replaced 200 with 20. But just in case.

fs.writeFileSync(file, txt, 'utf8');
console.log('Fixed');

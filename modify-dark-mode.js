import fs from 'fs';

const replacements = [
  { regex: /bg-white/g, replace: 'bg-white dark:bg-gray-800' },
  { regex: /bg-\[\#fafafa\]/g, replace: 'bg-[#fafafa] dark:bg-gray-950' },
  { regex: /bg-gray-50/g, replace: 'bg-gray-50 dark:bg-gray-900/50' },
  { regex: /bg-gray-100/g, replace: 'bg-gray-100 dark:bg-gray-800/80' },
  { regex: /text-gray-900/g, replace: 'text-gray-900 dark:text-white' },
  { regex: /text-gray-800/g, replace: 'text-gray-800 dark:text-gray-100' },
  { regex: /text-gray-700/g, replace: 'text-gray-700 dark:text-gray-200' },
  { regex: /text-gray-600/g, replace: 'text-gray-600 dark:text-gray-300' },
  { regex: /text-gray-500/g, replace: 'text-gray-500 dark:text-gray-400' },
  { regex: /text-gray-400/g, replace: 'text-gray-400 dark:text-gray-500' },
  { regex: /border-gray-50/g, replace: 'border-gray-50 dark:border-gray-800/50' },
  { regex: /border-gray-100/g, replace: 'border-gray-100 dark:border-gray-800' },
  { regex: /border-gray-200/g, replace: 'border-gray-200 dark:border-gray-700' },
  { regex: /border-gray-300/g, replace: 'border-gray-300 dark:border-gray-600' },
  { regex: /text-\[\#334155\]/g, replace: 'text-[#334155] dark:text-gray-200' },
  { regex: /bg-\[\#0f172a\]/g, replace: 'bg-[#0f172a] dark:bg-blue-600' },
  { regex: /bg-red-50/g, replace: 'bg-red-50 dark:bg-red-900/20' },
  { regex: /border-red-100/g, replace: 'border-red-100 dark:border-red-800' },
  { regex: /border-red-200/g, replace: 'border-red-200 dark:border-red-800' },
  { regex: /text-red-[67]00/g, replace: 'text-red-600 dark:text-red-400' },
  { regex: /bg-red-[12]00/g, replace: 'bg-red-100 dark:bg-red-900/40' },
  { regex: /bg-amber-500/g, replace: 'bg-amber-500 dark:bg-amber-600' },
  { regex: /text-amber-600/g, replace: 'text-amber-600 dark:text-amber-400' },
  { regex: /bg-amber-50/g, replace: 'bg-amber-50 dark:bg-amber-900/20' },
  { regex: /bg-blue-50/g, replace: 'bg-blue-50 dark:bg-blue-900/20' },
  { regex: /bg-blue-100/g, replace: 'bg-blue-100 dark:bg-blue-900/40' },
  { regex: /text-blue-[67]00/g, replace: 'text-blue-600 dark:text-blue-400' },
  { regex: /border-blue-[12]00/g, replace: 'border-blue-200 dark:border-blue-800' },
  { regex: /bg-green-50/g, replace: 'bg-green-50 dark:bg-green-900/20' },
  { regex: /bg-green-100/g, replace: 'bg-green-100 dark:bg-green-900/40' },
  { regex: /text-green-[67]00/g, replace: 'text-green-600 dark:text-green-400' },
  { regex: /border-green-[12]00/g, replace: 'border-green-200 dark:border-green-800' },
  { regex: /bg-orange-100/g, replace: 'bg-orange-100 dark:bg-orange-900/40' },
  { regex: /border-orange-200/g, replace: 'border-orange-200 dark:border-orange-800' },
  { regex: /text-orange-[67]00/g, replace: 'text-orange-600 dark:text-orange-400' },
  { regex: /bg-white\/[0-9]+/g, replace: (match) => match + ' ' + match.replace('bg-white', 'dark:bg-gray-900') },
];

function processPath(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = dir + '/' + f;
        if (fs.statSync(fullPath).isDirectory()) {
            processPath(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Avoid duplicate replacements roughly
            if (content.includes('dark:bg-gray-800') && content.includes('dark:text-white') && content.includes('dark:border-gray-700')) {
                console.log(`Skipping ${fullPath}`);
                continue;
            }

            // some specific skips to avoid breaking
            // settings.tsx was already partially modified by us previously
            // layout.tsx was also modified
            if (fullPath.includes('Layout.tsx')) continue;

            replacements.forEach(({ regex, replace }) => {
                content = content.replace(regex, replace);
            });

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processPath('./src');

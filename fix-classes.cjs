const fs = require('fs');

function processPath(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const fullPath = dir + '/' + f;
        if (fs.statSync(fullPath).isDirectory()) {
            processPath(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // fix invalid tailwind string matches
            content = content.replace(/dark:bg-gray-900\/50\/50/g, 'dark:bg-gray-900/50');
            content = content.replace(/dark:bg-gray-900\/50\/30/g, 'dark:bg-gray-900/50');
            content = content.replace(/dark:bg-red-900\/20\/20/g, 'dark:bg-red-900/20');
            content = content.replace(/dark:bg-red-900\/200/g, 'dark:bg-red-900/20');
            content = content.replace(/dark:bg-gray-900\/50\/80/g, 'dark:bg-gray-900/50');
            content = content.replace(/dark:bg-blue-900\/20\/50/g, 'dark:bg-blue-900/20');
            content = content.replace(/dark:bg-blue-900\/20\/80/g, 'dark:bg-blue-900/20');
            
            content = content.replace(/dark:bg-blue-900\/40\/50/g, 'dark:bg-blue-900/40');
            content = content.replace(/dark:bg-green-900\/40\/50/g, 'dark:bg-green-900/40');
            content = content.replace(/dark:bg-orange-900\/40\/50/g, 'dark:bg-orange-900/40');
            content = content.replace(/dark:bg-red-900\/40\/50/g, 'dark:bg-red-900/40');
            
            content = content.replace(/dark:border-gray-800\/80/g, 'dark:border-gray-800');
            content = content.replace(/bg-amber-50 dark:bg-amber-900\/200 dark:bg-amber-600/g, 'bg-amber-50 dark:bg-amber-900/20');
            
            // fix double texts
            content = content.replace(/dark:text-gray-400 dark:text-gray-400/g, 'dark:text-gray-400');
            content = content.replace(/dark:text-red-400 dark:text-red-400/g, 'dark:text-red-400');
            content = content.replace(/dark:text-white dark:text-white/g, 'dark:text-white');
            content = content.replace(/dark:bg-blue-900\/40 dark:text-blue-400/g, 'dark:bg-blue-900/40');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Fixed formatting in ${fullPath}`);
            }
        }
    }
}

processPath('./src');

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

            // fix double dark classes caused by chained regex replacements
            content = content.replace(/dark:text-gray-[45]00 dark:text-gray-500/g, 'dark:text-gray-400');
            content = content.replace(/dark:text-gray-[45]00 dark:text-gray-400/g, 'dark:text-gray-400');
            
            // promote text-gray-500 in dark mode to text-gray-400 for better visibility
            content = content.replace(/dark:text-gray-500/g, 'dark:text-gray-400');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Fixed ${fullPath}`);
            }
        }
    }
}

processPath('./src');

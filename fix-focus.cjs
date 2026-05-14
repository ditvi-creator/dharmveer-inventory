const fs = require('fs');

function fixFocusBg(file) {
    let txt = fs.readFileSync(file, 'utf8');
    let original = txt;
    txt = txt.replace(/focus:bg-white dark:bg-gray-800/g, 'focus:bg-white dark:focus:bg-gray-800');
    if (txt !== original) {
        fs.writeFileSync(file, txt, 'utf8');
        console.log('Fixed focus bg in ' + file);
    }
}

fixFocusBg('./src/App.tsx');
fixFocusBg('./src/components/ItemModal.tsx');
fixFocusBg('./src/components/BookingsModal.tsx');
fixFocusBg('./src/components/ChallanModal.tsx');
fixFocusBg('./src/components/Settings.tsx');

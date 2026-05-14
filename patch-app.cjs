const fs = require('fs');

let file = './src/App.tsx';
let txt = fs.readFileSync(file, 'utf8');

if (!txt.includes('const [godowns, setGodowns]')) {
  txt = txt.replace(
    "const [items, setItems] = useState<StockItem[]>([]);",
    `const [godowns, setGodowns] = useState<{id: string, name: string}[]>(() => {
    const saved = localStorage.getItem('app_godowns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'MP', name: 'MP' },
      { id: 'KL', name: 'KL' }
    ];
  });
  const [items, setItems] = useState<StockItem[]>([]);`
  );

  txt = txt.replace(
    "const openingStockMP = data.openingStockMP || 0;\n    const openingStockKL = data.openingStockKL || 0;",
    `const openingStockMP = data.openingStockMP || 0;
    const openingStockKL = data.openingStockKL || 0;
    const godownStocks = data.godownStocks || {};
    const totalGodowns = (data.openingStockMP || 0) + (data.openingStockKL || 0) + Object.values(godownStocks).reduce((a: any, b: any) => a + Number(b || 0), 0);`
  );

  txt = txt.replace(
    "balance: openingStockMP + openingStockKL,",
    "balance: totalGodowns,"
  );

  txt = txt.replace(
    "const balance = (merged.openingStockMP + merged.openingStockKL + stockIn) - stockOut;",
    `const totalG = (merged.openingStockMP || 0) + (merged.openingStockKL || 0) + Object.values(merged.godownStocks || {}).reduce((a: any, b: any) => a + Number(b || 0), 0);
    const balance = (totalG + stockIn) - stockOut;`
  );
  
  txt = txt.replace(
    "<StockTable ",
    "<StockTable godowns={godowns} "
  );
  
  txt = txt.replace(
    "<ItemModal",
    "<ItemModal godowns={godowns}"
  );
  
  txt = txt.replace(
    "<SettingsPage onClearData={() => setIsDeleteAllModalOpen(true)} />",
    "<SettingsPage godowns={godowns} setGodowns={(g) => { setGodowns(g); localStorage.setItem('app_godowns', JSON.stringify(g)); }} onClearData={() => setIsDeleteAllModalOpen(true)} />"
  );
  
  fs.writeFileSync(file, txt, 'utf8');
  console.log('App.tsx patched');
}

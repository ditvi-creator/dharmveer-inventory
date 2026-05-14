const fs = require('fs');

let file = './src/components/Settings.tsx';
let txt = fs.readFileSync(file, 'utf8');

// Update props
txt = txt.replace(
  "interface SettingsProps {",
  "import { Godown } from '../types';\nimport { Plus, Trash2 } from 'lucide-react';\n\ninterface SettingsProps {\n  godowns?: Godown[];\n  setGodowns?: (g: Godown[]) => void;"
);

txt = txt.replace(
  "export const Settings: React.FC<SettingsProps> = ({ onClearData }) => {",
  "export const Settings: React.FC<SettingsProps> = ({ onClearData, godowns = [], setGodowns }) => {\n  const [localGodowns, setLocalGodowns] = useState<Godown[]>(godowns.length > 0 ? godowns : [{id: 'MP', name: 'MP'}, {id: 'KL', name: 'KL'}]);\n  const [newGodownName, setNewGodownName] = useState('');"
);

const godownsUI = `
                  <div className="flex flex-col gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Godowns (Opening Stock Columns)</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Add up to 5 godowns. These will appear as sub-columns under Opening Stock.</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 max-w-sm">
                      {localGodowns.map((g, index) => (
                        <div key={g.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={g.name}
                            onChange={(e) => {
                              const newG = [...localGodowns];
                              newG[index].name = e.target.value;
                              newG[index].id = e.target.value.toUpperCase().replace(/\\s+/g, '_');
                              setLocalGodowns(newG);
                              if (setGodowns) setGodowns(newG);
                            }}
                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:border-blue-500 font-medium text-sm outline-none"
                          />
                          {localGodowns.length > 1 && (
                            <button
                              onClick={() => {
                                const newG = localGodowns.filter((_, i) => i !== index);
                                setLocalGodowns(newG);
                                if (setGodowns) setGodowns(newG);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {localGodowns.length < 5 && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            value={newGodownName}
                            onChange={(e) => setNewGodownName(e.target.value)}
                            placeholder="New Godown Name"
                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:border-blue-500 text-sm outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newGodownName.trim()) {
                                const newG = [...localGodowns, { id: newGodownName.trim().toUpperCase().replace(/\\s+/g, '_'), name: newGodownName.trim() }];
                                setLocalGodowns(newG);
                                if (setGodowns) setGodowns(newG);
                                setNewGodownName('');
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              if (newGodownName.trim()) {
                                const newG = [...localGodowns, { id: newGodownName.trim().toUpperCase().replace(/\\s+/g, '_'), name: newGodownName.trim() }];
                                setLocalGodowns(newG);
                                if (setGodowns) setGodowns(newG);
                                setNewGodownName('');
                              }
                            }}
                            disabled={!newGodownName.trim()}
                            className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
`;

txt = txt.replace(
  "{/* Setting Item */}\n                  <div className=\"flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50\">\n                    <div>\n                      <h4 className=\"font-medium text-gray-900 dark:text-white\">Default Export Format</h4>",
  godownsUI + "\n\n                  {/* Setting Item */}\n                  <div className=\"flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-50 dark:border-gray-800/50\">\n                    <div>\n                      <h4 className=\"font-medium text-gray-900 dark:text-white\">Default Export Format</h4>"
);

fs.writeFileSync(file, txt, 'utf8');
console.log('Settings.tsx patched');

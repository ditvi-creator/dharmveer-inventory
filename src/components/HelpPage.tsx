import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  HelpCircle, BookOpen, Search, Sparkles, MessageSquare, 
  ArrowRight, CheckCircle2, ChevronDown, Compass, Mail,
  ShieldAlert, Star, Terminal, Zap, ShieldCheck, Keyboard
} from 'lucide-react';

interface HelpPageProps {
  onPageChange: (page: 'dashboard' | 'settings' | 'analytics' | 'profile' | 'help') => void;
  onUpgradeClick?: () => void;
  isSubscribed?: boolean | null;
}

export const HelpPage: React.FC<HelpPageProps> = ({ 
  onPageChange, 
  onUpgradeClick = () => {},
  isSubscribed 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'inventory' | 'billing' | 'docs'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Feature sections with details and customized screenshots
  const features = [
    {
      id: 'dashboard',
      category: 'inventory',
      title: 'Real-time Inventory Tracking Dashboard',
      subtitle: 'Add, update, search, and manage your stock with instant low-stock alerts.',
      description: 'The Inventory Dashboard is the core workspace of Stockify. It allows warehouse managers to capture real-time material flows across multiple storage locations (godowns) seamlessly. Key capabilities include specifying batch codes, tracking manufacturing/expiry dates, setting safety reorder thresholds, and filtering by godowns.',
      image: '/src/assets/images/dashboard_guide_1782477252527.jpg',
      bullets: [
        'Quick Filter by physical warehouse/godown location.',
        'Color-coded Low Stock and Expired item status labels.',
        'Universal searching across product names, batch codes, or descriptions.',
        'Keyboard shortcut support (Ctrl+I to instantly trigger the Add Item modal).'
      ],
      primaryAction: {
        label: 'Go to Dashboard',
        onClick: () => onPageChange('dashboard')
      }
    },
    {
      id: 'challan',
      category: 'docs',
      title: 'Smart Delivery Challan Generation',
      subtitle: 'Instantly compile formal shipping documentation from any inventory entry.',
      description: 'Avoid manual calculations or double-entry mistakes. In Stockify, every inventory item row contains a smart "Challan" button. This compiles a beautifully formatted, legal delivery note complete with recipient info, dispatch mode, vehicle details, custom items lists, and formal authorization blocks.',
      image: '/src/assets/images/challan_guide_1782477267452.jpg',
      bullets: [
        'Pre-fills material quantities and batch codes directly from your active records.',
        'Custom fields for Transporter name, Vehicle Number, and L.R. / B.L. reference.',
        'Fully responsive digital layout optimized for print-to-PDF or direct email sharing.',
        'Audit-ready layout complying with Indian warehouse regulations.'
      ],
      primaryAction: {
        label: 'View Stock Records',
        onClick: () => onPageChange('dashboard')
      }
    },
    {
      id: 'subscriptions',
      category: 'billing',
      title: 'Auto-Recurring ₹90 Monthly Pro Subscriptions',
      subtitle: '72-Hour automatic trial countdown, instant UPI QR scan, and hands-free renewals.',
      description: 'Stockify runs on a hassle-free premium subscription. Every new user signing up starts with a strict 72-hour free trial countdown shown in the header banner. Once completed, a premium upgrade is required to continue using the application. Upgrading takes 10 seconds via Google Pay QR code and is configured for automatic, hands-free monthly auto-debit billing of ₹90.',
      image: '/src/assets/images/auto_debit_guide_1782477282272.jpg',
      bullets: [
        'Transparent ₹90/month flat rate with no hidden fees or contracts.',
        'Automated Monthly Auto-Debit: Billed automatically; no manual monthly renewal required.',
        'Interactive GPay checkout pre-filled with UPI merchant intent payloads.',
        'Real-time trial ticker visible globally to prevent unexpected workflow disruptions.'
      ],
      primaryAction: {
        label: isSubscribed ? 'Manage Subscription' : 'Upgrade to Pro Now',
        onClick: isSubscribed ? () => onPageChange('profile') : onUpgradeClick
      }
    }
  ];

  // FAQs List
  const faqs = [
    {
      q: 'How does the 72-hour trial work?',
      a: 'When you first register or log in with a new Google account, your 72-hour trial starts immediately. You can track your remaining time via the countdown ticker at the top of the page. Once the 72 hours finish, you will need to purchase the Pro subscription to continue managing your stock.',
      category: 'billing'
    },
    {
      q: 'Will I be charged manually every month?',
      a: 'No! The subscription is fully automated. After you make the initial purchase, the monthly recurring billing of ₹90 is handled automatically, ensuring continuous, uninterrupted pro access without needing manual transactions.',
      category: 'billing'
    },
    {
      q: 'Can I export my stock records for offline backups?',
      a: 'Absolutely. Stockify provides native bulk operations. Click the "Export" button in the dashboard to instantly download your entire inventory history as a CSV file. You can also import CSVs or download our standard template for easy onboarding.',
      category: 'inventory'
    },
    {
      q: 'What is a "Godown" in Stockify?',
      a: 'A godown is a physical storage warehouse. In the Settings tab, you can register as many distinct godowns as you operate (e.g., Godown A, Central Hub, South Depot). This allows you to categorize and filter inventory by precise physical location.',
      category: 'inventory'
    }
  ];

  // Filters logic
  const filteredFeatures = features.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || f.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || faq.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-12 animate-fadeIn max-w-[1400px] mx-auto pb-16">
      {/* Top Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white p-8 sm:p-12 border border-white/5 shadow-xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-bold text-blue-300">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Official Guide & Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">help you</span> today?
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium">
            Explore feature walk-throughs, view visual step-by-step screenshots, and master your stock management workflow with ease.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search help articles, features, or FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/10 dark:bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-slate-400 text-xs sm:text-sm font-semibold transition-all"
            />
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 flex-wrap gap-4">
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200/50 dark:border-gray-800">
          {(['all', 'inventory', 'billing', 'docs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs border border-gray-100 dark:border-gray-700'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab === 'docs' ? 'Challans / Docs' : tab}
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono font-bold flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-500" />
          <span>v1.2.0 Stable Build</span>
        </div>
      </div>

      {/* Features Walkthrough Grid */}
      <div className="space-y-16">
        {filteredFeatures.length > 0 ? (
          filteredFeatures.map((feature, idx) => (
            <div 
              key={feature.id} 
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
                idx % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Image side */}
              <div className={`lg:col-span-6 ${idx % 2 === 1 ? 'lg:order-last' : ''}`}>
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg bg-gray-50 dark:bg-gray-900"
                >
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-auto max-h-[360px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/20 to-transparent pointer-events-none" />
                </motion.div>
              </div>

              {/* Text side */}
              <div className="lg:col-span-6 space-y-5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                  {feature.category} feature
                </span>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {feature.subtitle}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {feature.description}
                </p>

                {/* Bullets lists */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {feature.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold leading-tight">
                        {bullet}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <button
                    onClick={feature.primaryAction.onClick}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    <span>{feature.primaryAction.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-gray-50 dark:bg-gray-900/40 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <Compass className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin-slow" />
            <h4 className="text-base font-extrabold text-gray-950 dark:text-white">No feature articles match your search</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Try clearing search filters or entering different keywords.</p>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Section */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/60 dark:to-slate-900/20 rounded-3xl p-6 sm:p-10 border border-gray-150 dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-200/60 dark:border-gray-800/60 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Pro Power-User Tools</span>
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Keyboard Shortcuts & Productivity
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
              Speed up your warehouse workflow. Trigger key operations hands-free from anywhere.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-2.5 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            <span className="text-xs text-indigo-900 dark:text-indigo-300 font-bold">Press modifiers together with the letters below.</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { keys: ['Ctrl', 'I'], action: 'Add Material Row', desc: 'Instantly opens the modal to register a new stock item with size, unit, and location.' },
            { keys: ['Ctrl', 'S'], action: 'Focus Search Bar', desc: 'Auto-focuses the global search input so you can instantly filter by name, party, or brand.' },
            { keys: ['Ctrl', 'B'], action: 'Open Bookings Dialog', desc: 'Directly opens active booking quantities, schedules, and transporter details for the first list item.' },
            { keys: ['Ctrl', 'H'], action: 'View Item History', desc: 'Displays full historical transaction logs, edit history, and stock ledger for the top item row.' },
            { keys: ['Ctrl', 'E'], action: 'Edit Material Row', desc: 'Loads the edit configuration and adjustments menu for the top visible row item instantly.' },
            { keys: ['Ctrl', 'M'], action: 'Manage Item Bookings', desc: 'Opens active booking management popover for allocating stock, delivery alerts, and alerts.' },
          ].map((shortcut, sIdx) => (
            <div 
              key={sIdx}
              className="p-4 sm:p-5 bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-150 dark:border-gray-800 flex flex-col justify-between gap-4 hover:border-indigo-500/30 transition-all group"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {shortcut.action}
                  </h4>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((k, kIdx) => (
                      <kbd 
                        key={kIdx}
                        className="px-2 py-1 rounded-md text-[10px] font-black uppercase bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-xs"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {shortcut.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs Section */}
      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-3xl p-6 sm:p-10 border border-gray-100 dark:border-gray-800">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
            Find immediate answers to standard billing, system limits, and inventory workflows.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-900/80 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full text-left p-4 sm:p-5 flex justify-between items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                      {faq.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
                  </button>

                  <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[300px] border-t border-gray-50 dark:border-gray-800' : 'max-h-0'}`}>
                    <div className="p-4 sm:p-5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-xs text-gray-400 py-4">No matching FAQs found.</p>
          )}
        </div>
      </div>

      {/* Support CTA card */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Still need assistance?
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Our support engineers are online 24/7. Get dedicated technical help for your enterprise storage tracking.
          </p>
        </div>

        <a 
          href="mailto:support@stockify.io" 
          className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 shrink-0 active:scale-95 transition-all"
        >
          <Mail className="w-4 h-4 text-emerald-500" />
          <span>Contact Support</span>
        </a>
      </div>
    </div>
  );
};

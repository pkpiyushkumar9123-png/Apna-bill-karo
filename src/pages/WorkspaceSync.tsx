import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { WorkspaceService } from '../services/workspaceService';
import { 
  Building2, 
  Cloud, 
  HardDrive, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen,
  FolderSync,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Trash2,
  FolderPlus,
  HelpCircle,
  ExternalLink,
  Zap,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const WorkspaceSync: React.FC = () => {
  const { 
    workspaceConnected, 
    workspaceName, 
    workspaceError,
    needsPermission,
    connectWorkspace, 
    connectDriveWorkspace,
    requestWorkspacePermission,
    disconnectWorkspace,
    gdriveSyncEnabled,
    setGdriveSyncEnabled,
    syncCloudData,
    isSyncingCloud,
    lastSyncTime,
    invoices,
    customers,
    products,
    expenses,
    profile,
    init
  } = useStore();

  const [isPushing, setIsPushing] = useState(false);
  const [initSuccess, setInitSuccess] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const [customConfig, setCustomConfig] = useState(() => {
    return localStorage.getItem('novabill_custom_firebase_config') || '';
  });
  const [configError, setConfigError] = useState<string | null>(null);

  const handleSaveCustomConfig = () => {
    try {
      if (!customConfig.trim()) {
        localStorage.removeItem('novabill_custom_firebase_config');
        alert('Custom configuration cleared! Resetting default credentials...');
        window.location.reload();
        return;
      }
      
      const parsed = JSON.parse(customConfig);
      if (!parsed || typeof parsed !== 'object' || !parsed.apiKey || !parsed.authDomain) {
        throw new Error('Config JSON must contain at least "apiKey" and "authDomain" parameters.');
      }
      
      localStorage.setItem('novabill_custom_firebase_config', JSON.stringify(parsed, null, 2));
      alert('Custom Firebase credentials successfully updated! The app will reload now to apply settings.');
      window.location.reload();
    } catch (err: any) {
      setConfigError(err.message || 'Invalid JSON format. Please paste your complete Firebase credentials JSON config.');
    }
  };

  const handleResetConfig = () => {
    if (window.confirm('Reset and use NovaBill\'s default Firebase sandbox credentials?')) {
      localStorage.removeItem('novabill_custom_firebase_config');
      setCustomConfig('');
      window.location.reload();
    }
  };

  const isDrive = localStorage.getItem('novabill_workspace_type') === 'gdrive';
  const isIframe = window.self !== window.top;

  // Handle building new empty templates into connected workspace (the "Create New" part)
  const handleCreateNewTemplates = async () => {
    if (!workspaceConnected) {
      alert('You must connect a workspace folder or Drive first.');
      return;
    }

    const confirmInit = window.confirm(
      'Initialize New Excel DB?\nThis will create fresh, empty Excel Database sheets (invoices.xlsx, customers.xlsx, products.xlsx, expenses.xlsx, settings.xlsx) inside your connected folder. If files exist, they will be initialized. Unsaved local cache will be synchronized. Continue?'
    );

    if (!confirmInit) return;

    setIsPushing(true);
    setInitSuccess(false);

    try {
      // Create empty/templated sheets or upload what is in cache
      await Promise.all([
        WorkspaceService.syncData('invoices', invoices),
        WorkspaceService.syncData('customers', customers),
        WorkspaceService.syncData('products', products),
        WorkspaceService.syncData('expenses', expenses),
        WorkspaceService.saveSettings({ theme: 'dark', accentColor: '#FF4444', density: 'comfortable', language: 'en', currencyDefault: 'INR', autoBackup: true, profile: profile || undefined })
      ]);

      setInitSuccess(true);
      setTimeout(() => setInitSuccess(false), 5000);
      alert('Pristine spreadsheet files successfully written to your connected workspace folder!');
      
      // Reload everything in store
      await init();
    } catch (err: any) {
      console.error('Failed to initialize database folder', err);
      alert('Initialization error: ' + (err.message || err));
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 font-sans" id="workspace_sync_dashboard">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/[0.01] p-8 md:p-10 rounded-[32px] border border-white/5 relative overflow-hidden">
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-md bg-white/5 text-muted-foreground border border-white/10 text-[9px] font-bold uppercase tracking-wider leading-none">
              Off-Grid Ledgers
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider leading-none flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Synced Database
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-3">
            Workspace Sync
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            Configure local folders or Google Drive to serve as direct spreadsheet repositories. Your data remains completely yours—stored locally and synced peer-to-peer.
          </p>
        </div>

        <button 
          onClick={() => setShowExplanation(!showExplanation)}
          className={cn(
            "p-3 px-5 rounded-xl border border-white/10 text-xs font-semibold tracking-wide transition-all flex items-center gap-2 relative z-10 self-start lg:self-center cursor-pointer hover:border-white/25 hover:bg-white/5",
            showExplanation ? "bg-white/10 text-white" : "bg-transparent text-zinc-300"
          )}
        >
          <HelpCircle size={15} />
          Technical Overview
        </button>
      </div>

      {/* Guide Card collapsible */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/[0.01] border border-white/5 rounded-[24px] p-6 md:p-8 space-y-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Zap className="text-primary" size={16} /> Direct Spreadsheet Local DB Setup
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
                Instead of storing proprietary financial spreadsheets in an external database, this workspace formats and reads ledger columns directly as raw **Excel XLSX spreadsheets**. This keeps your accounts universally compatible.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1 p-4 bg-white/[0.01] border border-white/5 rounded-xl">
                  <p className="font-semibold text-xs text-zinc-200">1. Offline Cache</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Runs on high-speed browser-local cache with reliable state persistence.</p>
                </div>
                <div className="space-y-1 p-4 bg-white/[0.01] border border-white/5 rounded-xl">
                  <p className="font-semibold text-xs text-zinc-200">2. Spreadsheet Export</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Generates real Excel documents containing perfect tabular billing structures dynamically.</p>
                </div>
                <div className="space-y-1 p-4 bg-white/[0.01] border border-white/5 rounded-xl">
                  <p className="font-semibold text-xs text-zinc-200">3. Unified Storage</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Synchronize with internal Google Drive paths to organize invoices offline or collaborate.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Connection Setup and Database management */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Workspace Status Panel */}
          <div className="bg-zinc-900/40 rounded-[28px] border border-white/5 shadow-md p-6 md:p-8 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border",
                  workspaceConnected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                )}>
                  {workspaceConnected ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Active Storage Target</p>
                  <h3 className="font-semibold text-base text-white">
                    {workspaceConnected ? 'Connected & Operational' : 'Offline Mode Only'}
                  </h3>
                </div>
              </div>

              {workspaceConnected && (
                <button
                  onClick={disconnectWorkspace}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-red-500/20 transition-all cursor-pointer"
                >
                  Disconnect
                </button>
              )}
            </div>

            {workspaceConnected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">Connected Folder:</span>
                    <span className="font-bold text-zinc-100 max-w-xs truncate">{workspaceName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">Storage Driver:</span>
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-zinc-300 uppercase tracking-wide">
                      {isDrive ? 'Google Drive' : 'Local Workspace'}
                    </span>
                  </div>
                  {isDrive && (
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                      <span className="text-zinc-500 font-medium">Authorized Account:</span>
                      <span className="font-mono text-[11px] text-primary">{localStorage.getItem('novabill_gdrive_email') || 'Connected'}</span>
                    </div>
                  )}
                </div>

                {needsPermission && (
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <AlertCircle size={14} />
                      <span>Security Permission Required</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Your browser needs permission to read and write spreadsheet files in **{workspaceName}**. Click below to authorize keys.
                    </p>
                    <button 
                      onClick={requestWorkspacePermission}
                      className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-black font-bold uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-[11px] transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={15} />
                      Grant Browser Access
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  You are currently saving data inside your browser's private local cache. 
                  Connect an Excel Database folder to unlock instant backup, sharing, and multi-device cloud sync.
                </p>
              </div>
            )}

            {workspaceError && (
              <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-4">
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle size={14} />
                  <span>{workspaceError.includes('unauthorized-domain') ? 'Domain Authorization Required' : 'Connection Interrupted'}</span>
                </div>
                
                {workspaceError.includes('unauthorized-domain') ? (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Your application is hosted at <strong className="text-white font-semibold">{window.location.origin}</strong> (domain: <strong className="text-white font-semibold">{window.location.hostname}</strong>), which is not listed as an **Authorized Domain** in your Firebase authentication config under project ID (<code className="text-[11px] font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">unique-ensign-g9z5m</code>).
                    </p>
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 text-xs text-zinc-400 leading-relaxed">
                      <p className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Zap size={10} className="text-primary fill-primary" /> Setup in 30 seconds:
                      </p>
                      <ol className="list-decimal pl-4 space-y-2 text-[11px] text-zinc-400">
                        <li>
                          Open your Firebase Console Auth settings:
                          <a 
                            href="https://console.firebase.google.com/project/unique-ensign-g9z5m/authentication/settings" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 hover:underline ml-1 font-bold uppercase text-[9px] bg-primary/10 px-1.5 py-0.5 rounded"
                          >
                            <span>Open Auth Console</span>
                            <ExternalLink size={9} />
                          </a>
                        </li>
                        <li>Scroll down to the <strong className="text-white font-normal">Authorized domains</strong> panel.</li>
                        <li>Click <strong className="text-white font-normal">Add domain</strong>.</li>
                        <li>Enter exactly: <span className="px-1 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] select-all font-bold">{window.location.hostname}</span></li>
                        <li>Click <strong className="text-white font-normal">Add</strong> to save changes.</li>
                      </ol>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Once saved, return here and click <strong className="text-zinc-300 font-normal">Connect GDrive</strong> to link up!
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {workspaceError}
                  </p>
                )}
                
                {isIframe && (
                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <a 
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-[10px] text-white font-bold uppercase tracking-wider rounded-lg transition-all"
                    >
                      <span>Connect In New Tab</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manage Storage Directory: Choose Existing or Connect/Authenticate (Create New) */}
          <div className="bg-zinc-900/40 rounded-[28px] border border-white/5 shadow-md p-6 space-y-6">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-3">
              <FolderOpen size={16} className="text-primary" /> Setup Directory Connection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {/* Card 1: Google Drive */}
              <div className="flex flex-col justify-between p-5 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 hover:border-white/10 transition-all group">
                <div className="space-y-2 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-102 transition-transform">
                    <Cloud size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-xs">Google Drive Directory</h4>
                    <p className="text-[9px] text-primary uppercase tracking-wider font-bold mt-0.5">Real-Time Cloud Backups</p>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Automatically initializes and reads/writes dynamic spreadsheet folders securely synced with your Google Cloud account storage.
                  </p>
                </div>
                
                <button 
                  onClick={connectDriveWorkspace}
                  className="w-full py-2.5 px-4 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 cursor-pointer"
                >
                  <span>{workspaceConnected && isDrive ? 'Switch Google Account' : 'Connect Drive'}</span>
                  <ArrowRight size={10} />
                </button>
              </div>

              {/* Card 2: Local Hard Drive Folder */}
              <div className="flex flex-col justify-between p-5 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 hover:border-white/10 transition-all group">
                <div className="space-y-2 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:scale-102 transition-transform">
                    <HardDrive size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-xs">Local Storage Folder</h4>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mt-0.5">Physical Sandbox System</p>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Keeps raw spreadsheets organized completely on your local computer. Runs locally using secure browser File System Access integrations.
                  </p>
                </div>

                {isIframe ? (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <HelpCircle size={10} /> Iframe Sandbox
                    </p>
                    <p className="text-[9px] text-zinc-500 leading-normal">
                      To select direct physical local folders, open the application in a new tab.
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={connectWorkspace}
                    className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{workspaceConnected && !isDrive ? 'Switch Folder' : 'Connect Folder'}</span>
                    <ArrowRight size={10} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white">Initialize Spreadsheet Templates</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">Write clean empty XLSX workbooks inside your active folder directly.</p>
              </div>
              <button
                onClick={handleCreateNewTemplates}
                disabled={!workspaceConnected || isPushing}
                className={cn(
                  "py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                  !workspaceConnected 
                    ? "bg-white/5 text-zinc-500 cursor-not-allowed border border-transparent"
                    : "bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/10 cursor-pointer"
                )}
              >
                {isPushing ? (
                  <RefreshCw className="animate-spin text-black" size={12} />
                ) : initSuccess ? (
                  <Check size={12} className="text-black" />
                ) : (
                  <FolderPlus size={12} className="text-black" />
                )}
                <span>Initialize Templates</span>
              </button>
            </div>
          </div>

          {/* Custom Firebase Configuration for Self-Hosting */}
          <div className="bg-zinc-900/40 rounded-[28px] border border-white/5 shadow-md p-6 space-y-6 relative overflow-hidden">
            <div className="border-b border-white/5 pb-3 space-y-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/10 text-[8px] font-semibold uppercase tracking-wider leading-none">
                Self Deployment Key Override
              </span>
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-500" /> Custom Auth Config
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Running your own replica of Apna Bill Karo on a personal domain? Paste your own free Firebase configurations below to run Google sign-in.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 text-xs leading-relaxed text-zinc-400">
                <p className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Self-hosting requirements:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                  <li>
                    Create a web project at the{' '}
                    <a 
                      href="https://console.firebase.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-bold inline-flex items-center gap-1 inline"
                    >
                      Firebase Console <ExternalLink size={9} />
                    </a>
                  </li>
                  <li>In Auth &gt; Sign-In Methods, enable **Google Account Authentication**.</li>
                  <li>Add your current domain to Firebase Settings' **Authorized Domains list**: <span className="px-1 py-0.5 rounded bg-white/10 text-white font-mono font-semibold select-all text-[10px]">{window.location.hostname}</span></li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Firebase Config JavaScript Object JSON</label>
                <textarea
                  value={customConfig}
                  onChange={(e) => {
                    setCustomConfig(e.target.value);
                    setConfigError(null);
                  }}
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-app-id",\n  "storageBucket": "your-app.appspot.com",\n  "messagingSenderId": "12345678",\n  "appId": "1:1234..."\n}`}
                  rows={5}
                  className="w-full bg-black/50 border border-white/5 focus:border-primary/45 rounded-xl p-3 font-mono text-[11px] text-zinc-200 placeholder-zinc-700 focus:outline-none transition-all resize-none"
                />
              </div>

              {configError && (
                <p className="text-[11px] text-red-400 bg-red-400/5 border border-red-400/10 p-3 rounded-lg leading-relaxed">
                  {configError}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSaveCustomConfig}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold uppercase tracking-wider text-[10px] rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-primary/15"
                >
                  <Check size={12} />
                  <span>Update Keys</span>
                </button>
                {localStorage.getItem('novabill_custom_firebase_config') && (
                  <button
                    onClick={handleResetConfig}
                    className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold uppercase tracking-wider text-[10px] rounded-lg border border-red-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={12} />
                    <span>Reset Settings</span>
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Google Drive replication status & DB integrity diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Cloud Sync Dashboard Controls */}
          <div className="bg-zinc-900/40 rounded-[28px] border border-white/5 shadow-md p-6 space-y-6 relative overflow-hidden">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-3">
              <Cloud size={16} className="text-primary" /> Cloud Sync
            </h3>

            {workspaceConnected && isDrive ? (
              <div className="space-y-5">
                
                {/* Auto Synchronize Switch */}
                <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-xl">
                  <div className="space-y-0.5 pr-2">
                    <p className="text-xs font-semibold text-white">Background Auto-Sync</p>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      Polls Google Drive periodically for background updates.
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setGdriveSyncEnabled(!gdriveSyncEnabled)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative p-1 cursor-pointer shrink-0",
                      gdriveSyncEnabled ? "bg-primary" : "bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white shadow transition-all",
                      gdriveSyncEnabled ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Cloud Diagnostics */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-zinc-500">Sync Pipeline</span>
                    <span className={cn("font-semibold", gdriveSyncEnabled ? "text-emerald-400" : "text-zinc-500")}>
                      {gdriveSyncEnabled ? 'ACTIVE POLLING' : 'PAUSED'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-zinc-500">Cloud Link</span>
                    <span className={cn("font-semibold", isSyncingCloud ? "text-primary animate-pulse" : "text-emerald-400")}>
                      {isSyncingCloud ? 'SYNCING...' : 'STEADY'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Last Checked</span>
                    <span className="font-mono text-zinc-400">
                      {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Not synced'}
                    </span>
                  </div>
                </div>

                {/* Force sync action button */}
                <button
                  onClick={() => syncCloudData(true)}
                  disabled={isSyncingCloud}
                  className={cn(
                    "w-full py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer border",
                    isSyncingCloud 
                      ? "bg-white/5 border-white/5 text-zinc-500 cursor-not-allowed" 
                      : "bg-primary hover:bg-primary/95 border-transparent shadow shadow-primary/10"
                  )}
                >
                  <RefreshCw size={12} className={isSyncingCloud ? 'animate-spin' : ''} />
                  {isSyncingCloud ? 'Synchronizing Ledgers...' : 'Synchronize Now'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 space-y-3">
                <Cloud size={32} className="text-zinc-700/50" />
                <p className="text-xs max-w-xs leading-relaxed text-zinc-500">
                  Google Drive synchronization is inactive. Connect a remote storage account to start syncing spreadsheet sheets.
                </p>
              </div>
            )}
          </div>

          {/* Database Tables and Health */}
          <div className="bg-zinc-900/40 rounded-[28px] border border-white/5 shadow-md p-6 space-y-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-3">
              <ShieldCheck size={16} className="text-emerald-500" /> Database Cache Health
            </h3>

            <div className="space-y-2">
              <TableStatusRow name="invoices.xlsx" keyName="Invoices Ledger" count={invoices.length} />
              <TableStatusRow name="customers.xlsx" keyName="Client Registry" count={customers.length} />
              <TableStatusRow name="products.xlsx" keyName="Inventory Catalog" count={products.length} />
              <TableStatusRow name="expenses.xlsx" keyName="Expenses Register" count={expenses.length} />
              <TableStatusRow name="settings.xlsx" keyName="Command Settings Profile" count={1} statusText="Configured" />
            </div>

            <div className="pt-2 flex justify-between items-center text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
              <span>Status Validation</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" /> Verified Offline Cash
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const TableStatusRow: React.FC<{ name: string; keyName: string; count: number; statusText?: string }> = ({ name, keyName, count, statusText }) => (
  <div className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl text-xs hover:bg-white/[0.02] transition-all">
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
        <FileSpreadsheet size={14} />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-white truncate text-xs">{name}</p>
        <p className="text-[9px] text-zinc-500 uppercase tracking-wider truncate">{keyName}</p>
      </div>
    </div>
    <div className="text-right shrink-0">
      <p className="font-mono font-bold text-zinc-300 text-xs">{statusText || `${count} items`}</p>
      <p className="text-[8px] text-emerald-400 uppercase tracking-widest font-black leading-none">Healthy</p>
    </div>
  </div>
);

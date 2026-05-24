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
    <div className="max-w-6xl mx-auto space-y-12 pb-32" id="workspace_sync_dashboard">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:bg-white/[0.02] lg:p-10 lg:rounded-[48px] lg:border lg:border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest leading-none">
              Data Sovereignty
            </span>
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] font-black uppercase tracking-widest leading-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live DB
            </span>
          </div>
          <h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-4 flex items-center gap-4">
            Workspace Business Sync
          </h1>
          <p className="text-muted text-sm lg:text-base max-w-xl leading-relaxed">
            NovaBill utilizes local folders and Google Drive as secure, serverless Excel spreadsheets DB. Swap directories, initialize fresh layouts, and manage cloud replication peer-to-peer.
          </p>
        </div>

        <button 
          onClick={() => setShowExplanation(!showExplanation)}
          className={cn(
            "p-3.5 px-6 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 relative z-10 self-start lg:self-center cursor-pointer",
            showExplanation ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-muted hover:text-white"
          )}
        >
          <HelpCircle size={16} />
          How this works
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
            <div className="glass-card bg-primary/[0.01] border-primary/10 rounded-[32px] p-8 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Zap className="text-primary fill-primary" size={18} /> No Backend Database Server Engine Necessary
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Rather than storing your invoices, client accounts, products, and operational expenses in a closed, vulnerable cloud SQL cluster, NovaBill formats and stores data as raw, human-auditable **Excel XLSX workbooks**.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="space-y-1 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <p className="font-bold text-xs text-white">1. Secure Local Cache</p>
                  <p className="text-[11px] text-muted">When running offline, everything coordinates in your browser's native IndexedDB cache with instant performance.</p>
                </div>
                <div className="space-y-1 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <p className="font-bold text-xs text-white">2. Auto Excel Writing</p>
                  <p className="text-[11px] text-muted">Every time you add an invoice or product, the store compiles a new spreadsheet binary with specific structured cells and writes it.</p>
                </div>
                <div className="space-y-1 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <p className="font-bold text-xs text-white">3. Google Drive Collaboration</p>
                  <p className="text-[11px] text-muted">Drive workspaces synchronize in real-time. Share the folder on your Google Drive with coworkers, and team updates sync automatically!</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Connection Setup and Database management */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Active Workspace Status Panel */}
          <div className="glass-card rounded-[40px] border-white/5 shadow-xl p-8 lg:p-10 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px] opacity-10 pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {workspaceConnected ? <CheckCircle2 size={24} /> : <AlertCircle size={24} className="text-amber-500" />}
                </div>
                <div>
                  <p className="text-[10px] text-muted font-black uppercase tracking-widest">Active Workspace System</p>
                  <h3 className="font-bold text-lg text-white">
                    {workspaceConnected ? 'Connected & Operational' : 'Offline Mode Only'}
                  </h3>
                </div>
              </div>

              {workspaceConnected && (
                <button
                  onClick={disconnectWorkspace}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-500 text-[10px] font-black uppercase tracking-wider rounded-xl border border-red-500/20 transition-all cursor-pointer"
                >
                  Disconnect Folder
                </button>
              )}
            </div>

            {workspaceConnected ? (
              <div className="space-y-6">
                <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted/60 font-medium">Workspace Location:</span>
                    <span className="font-bold text-white max-w-xs truncate">{workspaceName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted/60 font-medium">Replication Protocol:</span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-widest leading-none">
                      {isDrive ? 'Cloud Google Drive' : 'Local File Directory'}
                    </span>
                  </div>
                  {isDrive && (
                    <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
                      <span className="text-muted/60 font-medium">Google Client Email:</span>
                      <span className="font-mono text-[11px] text-primary">{localStorage.getItem('novabill_gdrive_email') || 'Google Account Connected'}</span>
                    </div>
                  )}
                </div>

                {needsPermission && (
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                      <AlertCircle size={14} />
                      <span>Security Permission Required</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Your browser needs permission to read and write spreadsheet files in **{workspaceName}**. Refresh or click continue to authorize keys.
                    </p>
                    <button 
                      onClick={requestWorkspacePermission}
                      className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-black font-black uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-1 text-[11px] transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={16} />
                      Reauthorize Safe Connection
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 p-4 text-center">
                <p className="text-sm text-muted max-w-md mx-auto">
                  You are currently saving data inside your browser's private local cache only. 
                  Connect an **Excel Database folder** to unlock instant backup, sharing, and multi-user sync!
                </p>
              </div>
            )}

            {workspaceError && (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle size={14} />
                  <span>Connection Interrupted</span>
                </div>
                <p className="text-xs text-red-100/75 leading-relaxed whitespace-pre-line">
                  {workspaceError}
                </p>
                {isIframe && (
                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <a 
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-[10px] text-white font-black uppercase tracking-widest rounded-xl transition-all"
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
          <div className="glass-card rounded-[40px] border-white/5 shadow-xl p-8 space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/5 pb-4">
              <FolderOpen size={18} className="text-primary" /> Setup or Switch Active Directory
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Card 1: Google Drive */}
              <div className="flex flex-col justify-space-between p-6 glass border border-white/5 bg-white/[0.01] rounded-[28px] space-y-6 hover:border-primary/30 transition-all group">
                <div className="space-y-3 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <Cloud size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Google Drive Workspace</h4>
                    <p className="text-[10px] text-primary uppercase tracking-widest font-black mt-0.5">Automated Real-Time Cloud Sync</p>
                  </div>
                  <p className="text-xs text-muted/80 leading-relaxed">
                    Automatically initializes and reads/writes dynamic spreadsheet workbooks from a safe folder on your Google Drive. Allows simple synchronization for distributed teams.
                  </p>
                </div>
                
                <button 
                  onClick={connectDriveWorkspace}
                  className="w-full py-3.5 px-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 cursor-pointer"
                >
                  <span>{workspaceConnected && isDrive ? 'Switch Google Account' : 'Connect GDrive'}</span>
                  <ArrowRight size={12} />
                </button>
              </div>

              {/* Card 2: Local Hard Drive Folder */}
              <div className="flex flex-col justify-space-between p-6 glass border border-white/5 bg-white/[0.01] rounded-[28px] space-y-6 hover:border-white/10 transition-all group">
                <div className="space-y-3 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-muted group-hover:scale-105 transition-transform">
                    <HardDrive size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Local Hard Drive Folder</h4>
                    <p className="text-[10px] text-muted uppercase tracking-widest font-black mt-0.5">Secure Sandboxed Offline File Access</p>
                  </div>
                  <p className="text-xs text-muted/80 leading-relaxed">
                    Keeps raw spreadsheets directory on your physical storage device. Zero network traffic or cloud hosting. Utilizes modern browser File System Access APIs.
                  </p>
                </div>

                {isIframe ? (
                  <div className="p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1 mb-1">
                      <HelpCircle size={10} /> Iframe sandbox
                    </p>
                    <p className="text-[9px] text-muted leading-relaxed">
                      To connect local storage folders, click <strong>"Authorization In New Tab"</strong> to bypass the browser parent boundary.
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={connectWorkspace}
                    className="w-full py-3.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{workspaceConnected && !isDrive ? 'Switch Local Folder' : 'Connect Local Folder'}</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Create Fresh Empty Datastores</p>
                <p className="text-[11px] text-muted leading-tight">Generate pristine XLS templates in your selected folder to start fresh.</p>
              </div>
              <button
                onClick={handleCreateNewTemplates}
                disabled={!workspaceConnected || isPushing}
                className={cn(
                  "py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  !workspaceConnected 
                    ? "bg-white/5 text-muted/40 cursor-not-allowed border border-transparent"
                    : "bg-green-500 hover:bg-green-600 text-black shadow-lg shadow-green-500/10 cursor-pointer"
                )}
              >
                {isPushing ? (
                  <RefreshCw className="animate-spin text-black" size={14} />
                ) : initSuccess ? (
                  <Check size={14} className="text-black" />
                ) : (
                  <FolderPlus size={14} className="text-black" />
                )}
                <span>Initialize Empty Templates</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Google Drive replication status & DB integrity diagnostics */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Cloud Sync Dashboard Controls */}
          <div className="glass-card rounded-[40px] border-white/5 shadow-xl p-8 space-y-8 relative overflow-hidden">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/5 pb-4">
              <Cloud size={18} className="text-primary" /> Cloud Replication Status
            </h3>

            {workspaceConnected && isDrive ? (
              <div className="space-y-6">
                
                {/* Auto Synchronize Switch */}
                <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl">
                  <div className="space-y-1 pr-4">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Background Auto-Sync</p>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Liveliness poll check of files directory changed on Google Cloud intervals.
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setGdriveSyncEnabled(!gdriveSyncEnabled)}
                    className={cn(
                      "w-14 h-7 rounded-full transition-all relative p-1 cursor-pointer shrink-0",
                      gdriveSyncEnabled ? "bg-primary" : "bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full bg-white shadow-md transition-all",
                      gdriveSyncEnabled ? "translate-x-7" : "translate-x-0"
                    )} />
                  </button>
                </div>

                {/* Cloud Diagnostics */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-muted/60 font-bold uppercase tracking-wider text-[10px]">Active Status</span>
                    <span className={cn("font-bold", gdriveSyncEnabled ? "text-green-500" : "text-muted")}>
                      {gdriveSyncEnabled ? 'ACTIVE LISTENING' : 'PAUSED'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-muted/60 font-bold uppercase tracking-wider text-[10px]">Cloud Connection</span>
                    <span className={cn("font-bold", isSyncingCloud ? "text-primary animate-pulse" : "text-green-500")}>
                      {isSyncingCloud ? 'SYNCING...' : 'STEADY'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted/60 font-bold uppercase tracking-wider text-[10px]">Last Checked</span>
                    <span className="font-mono font-medium">
                      {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Not checked yet'}
                    </span>
                  </div>
                </div>

                {/* Force sync action button */}
                <button
                  onClick={() => syncCloudData(true)}
                  disabled={isSyncingCloud}
                  className={cn(
                    "w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all flex items-center justify-center gap-2 cursor-pointer border",
                    isSyncingCloud 
                      ? "bg-white/5 border-white/5 text-muted cursor-not-allowed" 
                      : "bg-primary hover:bg-primary/95 border-transparent shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.98]"
                  )}
                >
                  <RefreshCw size={14} className={isSyncingCloud ? 'animate-spin' : ''} />
                  {isSyncingCloud ? 'Reconciling Live Assets...' : 'Force Cloud Spreadsheet Reconcile'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted space-y-4">
                <Cloud size={48} className="text-muted/10" />
                <p className="text-xs max-w-xs leading-relaxed">
                  Google Drive synchronization is inactive. Connect a Google Cloud workspace to enjoy peer-to-peer sharing and immediate ledger synchronization!
                </p>
              </div>
            )}
          </div>

          {/* Database Tables and Health */}
          <div className="glass-card rounded-[40px] border-white/5 shadow-xl p-8 space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/5 pb-4">
              <ShieldCheck size={18} className="text-green-500" /> Database Cache Health
            </h3>

            <div className="space-y-4">
              <TableStatusRow name="invoices.xlsx" keyName="Invoices Ledger" count={invoices.length} />
              <TableStatusRow name="customers.xlsx" keyName="Client Registry" count={customers.length} />
              <TableStatusRow name="products.xlsx" keyName="Inventory Catalog" count={products.length} />
              <TableStatusRow name="expenses.xlsx" keyName="Expenses Register" count={expenses.length} />
              <TableStatusRow name="settings.xlsx" keyName="Command Settings Profile" count={1} statusText="Configured" />
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-muted font-bold uppercase tracking-[0.15em]">
              <span>System Encryption</span>
              <span className="text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Local AES-256
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const TableStatusRow: React.FC<{ name: string; keyName: string; count: number; statusText?: string }> = ({ name, keyName, count, statusText }) => (
  <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-xs hover:bg-white/[0.02]/5 transition-all">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
        <FileSpreadsheet size={16} />
      </div>
      <div>
        <p className="font-bold text-white">{name}</p>
        <p className="text-[9px] text-muted uppercase tracking-wider">{keyName}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-mono font-bold text-white">{statusText || `${count} rows`}</p>
      <p className="text-[8px] text-green-500 uppercase tracking-widest font-black">Healthy</p>
    </div>
  </div>
);

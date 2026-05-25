import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  PlusCircle, 
  LogOut,
  Bell,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  HardDrive,
  ExternalLink,
  FolderSync,
  ShoppingCart,
  Receipt,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore.ts';
import { WorkspaceGuardian, SaveIndicator } from './WorkspaceGuardian';
import { GoogleDriveSyncIndicator } from './GoogleDriveSyncIndicator';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const profile = useStore((state) => state.profile);
  const { 
    workspaceName, 
    workspaceConnected, 
    disconnectWorkspace,
    gdriveSyncEnabled,
    setGdriveSyncEnabled,
    syncCloudData,
    isSyncingCloud,
    lastSyncTime
  } = useStore();

  const isDrive = localStorage.getItem('novabill_workspace_type') === 'gdrive';

  React.useEffect(() => {
    if (!workspaceConnected || !isDrive || !gdriveSyncEnabled) return;

    // Background cloud change detection loop (every 12 seconds)
    const interval = setInterval(() => {
      syncCloudData();
    }, 12000);

    return () => clearInterval(interval);
  }, [workspaceConnected, isDrive, gdriveSyncEnabled, syncCloudData]);
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <WorkspaceGuardian />
      
      {/* Command Palette Overlay */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="glass-card w-full max-w-2xl !p-2 shadow-[0_0_100px_rgba(255,68,68,0.3)] animate-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                 <Search className="text-muted" size={20} />
                 <input 
                  autoFocus
                  placeholder="Type a command or search..." 
                  className="flex-1 bg-transparent border-none focus:outline-none text-lg"
                 />
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded border border-white/10 text-[10px] font-bold text-muted uppercase">
                    <span className="text-[14px]">⌘</span> K
                 </div>
              </div>
              <div className="p-2 space-y-1">
                 <CommandItem icon={<PlusCircle size={18} />} label="Create New Invoice" shortcut="N" onClick={() => setShowCommandPalette(false)} />
                 <CommandItem icon={<Users size={18} />} label="Add New Customer" shortcut="C" onClick={() => setShowCommandPalette(false)} />
                 <CommandItem icon={<Package size={18} />} label="Add New Product" shortcut="P" onClick={() => setShowCommandPalette(false)} />
                 <CommandItem icon={<Search size={18} />} label="Search All Invoices" onClick={() => setShowCommandPalette(false)} />
                 <div className="h-[1px] bg-white/5 my-2 mx-2" />
                 <CommandItem icon={<Settings size={18} />} label="Open Settings" shortcut="S" onClick={() => setShowCommandPalette(false)} />
                 <CommandItem icon={<LayoutDashboard size={18} />} label="Go to Dashboard" shortcut="D" onClick={() => setShowCommandPalette(false)} />
              </div>
              <div className="px-4 py-2 bg-white/[0.02] mt-2 rounded-xl flex items-center justify-between text-[10px] text-muted font-bold uppercase tracking-widest">
                 <span>Navigate with arrows</span>
                 <span>Select with enter</span>
              </div>
           </div>
        </div>
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 transform lg:relative lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} bg-[#111214] border-r border-white/5 flex flex-col`}
      >
        <div className="p-5 flex items-center justify-between overflow-hidden border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-white/10 bg-white/5">
              {profile?.logoUrl ? (
                <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Zap className="text-[#FF4D57] fill-[#FF4D57]/5" size={18} />
              )}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-semibold tracking-tight text-white whitespace-nowrap"
                >
                  {profile?.name || 'Enterprise Workspace'}
                </motion.span>
                <span className="text-[9px] text-[#A1A1AA] uppercase tracking-wider font-medium leading-none mt-0.5">Admin Desk</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded hover:bg-white/5 text-[#A1A1AA] transition-all"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded hover:bg-white/5 text-[#A1A1AA] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4 overflow-hidden">
          <NavItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Overview" collapsed={isCollapsed} />
          <NavItem to="/invoices" icon={<FileText size={18} />} label="Invoices" collapsed={isCollapsed} />
          <NavItem to="/expenses" icon={<Wallet size={18} />} label="Expense Management" collapsed={isCollapsed} />
          <NavItem to="/customers" icon={<Users size={18} />} label="Client Accounts" collapsed={isCollapsed} />
          <NavItem to="/products" icon={<Package size={18} />} label="Inventory Control" collapsed={isCollapsed} />
          <NavItem to="/reports" icon={<BarChart3 size={18} />} label="Analytics Center" collapsed={isCollapsed} />
          <NavItem to="/workspace-sync" icon={<FolderSync size={18} />} label="Cloud Workspace" collapsed={isCollapsed} />
          <NavItem to="/settings" icon={<Settings size={18} />} label="Workspace Preferences" collapsed={isCollapsed} />
        </nav>

        <div className="p-3 space-y-3 mt-auto">
          {workspaceConnected && !isCollapsed && (
            <div className="p-3.5 bg-[#15171A] rounded-xl border border-white/5 space-y-2.5 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={disconnectWorkspace}
                  className="p-1 hover:bg-white/5 rounded text-red-400"
                  title="Disconnect Workspace"
                >
                  <X size={10} />
                </button>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-white/5 flex items-center justify-center text-[#FF4D57]">
                  <HardDrive size={14} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[8px] font-black text-[#A1A1AA] uppercase tracking-widest leading-none">Connected Drive</p>
                  <p className="text-xs font-semibold text-white truncate mt-0.5">{workspaceName}</p>
                </div>
              </div>
              {isDrive ? (
                <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] font-medium text-[#A1A1AA]">
                    <span className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${gdriveSyncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                      Cloud Connected
                    </span>
                    <button
                      onClick={() => setGdriveSyncEnabled(!gdriveSyncEnabled)}
                      className="text-[9px] text-[#FF4D57] hover:underline font-semibold cursor-pointer"
                    >
                      {gdriveSyncEnabled ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1">
                    <span className="text-[8px] text-[#A1A1AA]/60 truncate mr-2 leading-none">
                      {lastSyncTime ? `Synced: ${new Date(lastSyncTime).toLocaleTimeString()}` : 'Not synced'}
                    </span>
                    <button
                      onClick={() => syncCloudData(true)}
                      disabled={isSyncingCloud}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded text-[9px] font-bold text-white transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={8} className={`${isSyncingCloud ? 'animate-spin text-[#FF4D57]' : ''}`} />
                      Sync
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[8px] font-bold text-[#A1A1AA] uppercase tracking-[0.1em] pt-1.5 border-t border-white/5 leading-none">
                  <span className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    Live Sync
                  </span>
                  <span className="flex items-center gap-1">
                    Excel DB
                  </span>
                </div>
              )}
            </div>
          )}

          <div className={`bg-[#15171A] border border-white/5 rounded-xl transition-all duration-300 ${isCollapsed ? 'p-1.5' : 'p-3'} flex items-center gap-2.5 overflow-hidden`}>
            <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden shrink-0 border border-white/5">
              <img 
                src={profile?.logoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'User'}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-none">{profile?.name || 'Guest User'}</p>
                <p className="text-[9px] text-[#A1A1AA] truncate leading-none mt-1">{profile?.email || 'local@novabill.app'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#0A0A0B]">
        {/* Header */}
        <header className="h-14 bg-[#111214] border-b border-white/5 flex items-center justify-between px-4 md:px-6 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded bg-white/5 text-[#A1A1AA]"
            >
              <Menu size={16} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">{profile?.name || 'Enterprise Desk'}</span>
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-[8px] font-semibold text-emerald-400 border border-emerald-500/10 uppercase tracking-widest leading-none flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400" /> Executive Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <GoogleDriveSyncIndicator />
            <SaveIndicator />
            <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
            <button className="p-1.5 rounded-full hover:bg-white/5 text-[#A1A1AA] transition-all relative hidden sm:block">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#FF4D57] rounded-full" />
            </button>
            <NavLink to="/invoices/new" className="px-3 py-1.5 bg-[#FF4D57] hover:bg-[#ff3c47] text-white font-semibold rounded text-xs transition-all flex items-center gap-1.5">
              <PlusCircle size={14} />
              <span>New Invoice</span>
            </NavLink>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label, collapsed }: { to: string; icon: React.ReactNode; label: string; collapsed?: boolean }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
    flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative
    ${isActive 
      ? 'bg-[#15171A] text-white border-l-2 border-[#FF4D57]' 
      : 'text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-white/[0.01]'}
    ${collapsed ? 'justify-center px-0' : ''}
  `}
  >
    <div className={`transition-transform duration-200 shrink-0`}>
      {icon}
    </div>
    {!collapsed && (
      <span className="truncate tracking-wide">
        {label}
      </span>
    )}
    {collapsed && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-background border border-white/10 rounded text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </div>
    )}
  </NavLink>
);

const CommandItem = ({ icon, label, shortcut, onClick }: { icon: React.ReactNode; label: string; shortcut?: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-xs transition-all group"
  >
    <div className="flex items-center gap-2.5">
      <div className="text-[#A1A1AA] group-hover:text-[#FF4D57] transition-colors">
        {icon}
      </div>
      <span className="font-medium text-white">{label}</span>
    </div>
    {shortcut && (
      <div className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-[8px] font-bold text-[#A1A1AA] group-hover:text-white uppercase transition-all">
        {shortcut}
      </div>
    )}
  </button>
);

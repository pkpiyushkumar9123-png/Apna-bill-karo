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
  LayoutTemplate
} from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore.ts';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const profile = useStore((state) => state.profile);
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
    <div className="flex h-screen bg-background overflow-hidden">
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
                    <span className="text-[14px]">â</span> K
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
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} glass border-r border-white/5 flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Zap className="text-white fill-white" size={24} />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold tracking-tight whitespace-nowrap"
              >
                NovaBill
              </motion.span>
            )}
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/5 text-muted transition-all"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-muted transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-hidden">
          <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" collapsed={isCollapsed} />
          <NavItem to="/invoices" icon={<FileText size={20} />} label="Invoices" collapsed={isCollapsed} />
          <NavItem to="/customers" icon={<Users size={20} />} label="Customers" collapsed={isCollapsed} />
          <NavItem to="/products" icon={<Package size={20} />} label="Products" collapsed={isCollapsed} />
          <NavItem to="/templates" icon={<LayoutTemplate size={20} />} label="Templates" collapsed={isCollapsed} />
          <NavItem to="/analytics" icon={<BarChart3 size={20} />} label="Analytics" collapsed={isCollapsed} />
          <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" collapsed={isCollapsed} />
        </nav>

        <div className="p-4 mt-auto">
          <div className={`glass rounded-2xl transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'} flex items-center gap-3 overflow-hidden`}>
            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0">
              <img 
                src={profile?.logoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'User'}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden min-w-0">
                <p className="text-sm font-medium truncate">{profile?.name || 'Guest User'}</p>
                <p className="text-xs text-muted truncate">{profile?.email || 'guest@novabill.app'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 glass-card !rounded-none border-b border-white/5 flex items-center justify-between px-4 md:px-8 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-white/5 text-muted"
            >
              <Menu size={20} />
            </button>
            <div className="relative w-72 md:w-96 hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Search invoices, clients, tasks..." 
                className="w-full py-2.5 pl-12 pr-4 bg-white/5 border border-white/10 rounded-full text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="p-2.5 rounded-full hover:bg-white/5 text-muted transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="h-6 w-[1px] bg-white/10 mx-1 md:mx-2" />
            <NavLink to="/invoices/new" className="btn-primary py-2.5 px-3 md:px-6 flex items-center gap-2 text-xs md:text-sm">
              <PlusCircle size={18} />
              <span className="hidden md:inline">New Invoice</span>
            </NavLink>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
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
      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative
      ${isActive 
        ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5' 
        : 'text-muted hover:text-white hover:bg-white/5'}
      ${collapsed ? 'justify-center px-0' : ''}
    `}
  >
    <div className={`transition-transform duration-300 ${collapsed ? 'group-hover:scale-110' : ''}`}>
      {icon}
    </div>
    {!collapsed && (
      <motion.span 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="truncate"
      >
        {label}
      </motion.span>
    )}
    {collapsed && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-background border border-white/10 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {label}
      </div>
    )}
  </NavLink>
);

const CommandItem = ({ icon, label, shortcut, onClick }: { icon: React.ReactNode; label: string; shortcut?: string; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-sm transition-all group"
  >
    <div className="flex items-center gap-3">
      <div className="text-muted group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="font-medium">{label}</span>
    </div>
    {shortcut && (
      <div className="px-2 py-0.5 bg-white/5 rounded border border-white/10 text-[10px] font-bold text-muted group-hover:text-white uppercase transition-all">
        {shortcut}
      </div>
    )}
  </button>
);

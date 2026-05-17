import React from 'react';
import { 
  Building2, 
  Globe, 
  Mail, 
  MapPin, 
  Phone, 
  CreditCard, 
  Shield, 
  Bell, 
  Moon, 
  Sun,
  Layout,
  Palette,
  Check,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';

export const Settings: React.FC = () => {
  const { profile, settings, updateProfile, updateSettings, init } = useStore();

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    updateProfile({ ...profile, [name]: value });
  };

  const handleExportData = async () => {
    const state = useStore.getState();
    const data = {
      invoices: state.invoices,
      customers: state.customers,
      products: state.products,
      profile: state.profile,
      settings: state.settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novabill-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleResetData = async () => {
    if (confirm('Are you absolutely sure? This will delete ALL invoices, customers, and data forever.')) {
      indexedDB.deleteDatabase('novabill_db');
      window.location.reload();
    }
  };

  const accentColors = ['#FF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted">Configure your business profile and application preferences.</p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Building2 size={18} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Business Profile</h2>
        </div>

        <div className="glass-card space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Legal Business Name</label>
              <input 
                name="name"
                value={profile?.name || ''}
                onChange={handleProfileChange}
                className="input-field w-full" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Business Email</label>
              <input 
                name="email"
                value={profile?.email || ''}
                onChange={handleProfileChange}
                className="input-field w-full" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Phone Number</label>
              <input 
                name="phone"
                value={profile?.phone || ''}
                onChange={handleProfileChange}
                className="input-field w-full" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Website</label>
              <input 
                name="website"
                value={profile?.website || ''}
                onChange={handleProfileChange}
                className="input-field w-full" 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Tax ID / VAT Registration</label>
              <input 
                name="taxId"
                value={profile?.taxId || ''}
                onChange={handleProfileChange}
                className="input-field w-full" 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted">Business Address</label>
              <textarea 
                name="address"
                value={profile?.address || ''}
                onChange={handleProfileChange}
                className="input-field w-full h-24 resize-none" 
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Palette size={18} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Appearance & Branding</h2>
        </div>

        <div className="glass-card grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-4">Accent Color</label>
              <div className="flex flex-wrap gap-4">
                {accentColors.map(color => (
                  <button 
                    key={color}
                    onClick={() => updateSettings({ accentColor: color })}
                    className="w-10 h-10 rounded-full border-4 border-white/5 flex items-center justify-center transition-all hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {settings.accentColor === color && <Check size={16} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-4">Theme Mode</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    settings.theme === 'dark' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-white/5 border-white/5 text-muted'
                  }`}
                >
                  <Moon size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">Matte Dark</span>
                </button>
                <button 
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    settings.theme === 'light' ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-white/5 border-white/5 text-muted'
                  }`}
                >
                  <Sun size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">Minimal Light</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-4">Interface Density</label>
              <div className="flex flex-col gap-3">
                 <button 
                  onClick={() => updateSettings({ density: 'comfortable' })}
                  className={`w-full p-4 rounded-xl border flex items-center justify-between px-6 transition-all ${
                    settings.density === 'comfortable' ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5 text-muted'
                  }`}
                 >
                   <div className="flex items-center gap-3">
                      <Layout size={18} />
                      <span className="text-sm font-medium">Comfortable</span>
                   </div>
                   {settings.density === 'comfortable' && <Check size={16} />}
                 </button>
                 <button 
                  onClick={() => updateSettings({ density: 'compact' })}
                  className={`w-full p-4 rounded-xl border flex items-center justify-between px-6 transition-all ${
                    settings.density === 'compact' ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5 text-muted'
                  }`}
                 >
                   <div className="flex items-center gap-3">
                      <Layout size={18} className="scale-75" />
                      <span className="text-sm font-medium">Compact</span>
                   </div>
                   {settings.density === 'compact' && <Check size={16} />}
                 </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Shield size={18} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Security & Privacy</h2>
        </div>

        <div className="glass-card divide-y divide-white/5">
           <div className="py-4 flex items-center justify-between">
              <div>
                 <p className="text-sm font-bold">Local Database Encryption</p>
                 <p className="text-xs text-muted">All business data is stored on-device with AES-256 encryption.</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative">
                 <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
           </div>
           <div className="py-4 flex items-center justify-between">
              <div>
                 <p className="text-sm font-bold">Anonymous Telemetry</p>
                 <p className="text-xs text-muted">Help us improve NovaBill by sharing usage data anonymously.</p>
              </div>
              <div className="w-12 h-6 bg-white/10 rounded-full relative grayscale opacity-50">
                 <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
           </div>
           <div className="pt-6 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleExportData}
                className="flex-1 py-3 px-6 glass rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                 <Download size={14} />
                 Backup Local Storage
              </button>
              <button 
                onClick={handleResetData}
                className="flex-1 py-3 px-6 rounded-xl text-red-500 bg-red-500/10 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                 <Trash2 size={14} />
                 Reset All Local Data
              </button>
           </div>
        </div>
      </section>
    </div>
  );
};

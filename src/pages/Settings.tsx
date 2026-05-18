import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Upload,
  Plus,
  X,
  StickyNote,
  ScrollText,
  Save,
  FileSpreadsheet
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { DEFAULT_NOTE_PRESETS, DEFAULT_TERM_PRESETS } from '../constants/presets.ts';
import { BusinessProfile } from '../types.ts';
import * as XLSX from 'xlsx';

export const Settings: React.FC = () => {
  const { profile, settings, updateProfile, updateSettings, isSaving, workspaceConnected, workspaceName, requestWorkspacePermission } = useStore();
  const [profileData, setProfileData] = useState<BusinessProfile>(profile || {
    id: 'default',
    name: '',
    email: '',
    currency: 'INR',
    address: '',
    website: '',
    phone: '',
    logoUrl: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Sync store profile to local state only once or when store profile clearly changes from what we have
    if (profile && (!profileData.name && !profileData.email)) {
      setProfileData(profile);
    }
  }, [profile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    await updateProfile(profileData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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

  const handleExportExcel = () => {
    if (!profileData) return;
    const ws = XLSX.utils.json_to_sheet([{
      'Company Name': profileData.name,
      'Email': profileData.email,
      'Phone': profileData.phone,
      'Website': profileData.website,
      'Address': profileData.address,
      'Tax ID': profileData.taxId,
      'Currency': profileData.currency,
      'Bank Name': profileData.bankName,
      'Account Number': profileData.bankAccount,
      'IFSC/Swift': profileData.ifscCode
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Profile');
    XLSX.writeFile(wb, `business-profile-${Date.now()}.xlsx`);
  };

  const handleResetData = async () => {
    if (confirm('Are you absolutely sure? This will delete ALL invoices, customers, and data forever.')) {
      indexedDB.deleteDatabase('novabill_db');
      window.location.reload();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileData) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileData(prev => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setProfileData(prev => ({ ...prev, logoUrl: '' }));
  };

  const addPreset = async (type: 'note' | 'term', value: string) => {
    if (!profile) return;
    const presets = type === 'note' ? [...(profile.notePresets || [])] : [...(profile.termPresets || [])];
    const trimmed = value.trim();
    if (trimmed && !presets.includes(trimmed)) {
      await updateProfile({ 
        ...profile, 
        [type === 'note' ? 'notePresets' : 'termPresets']: [...presets, trimmed] 
      });
    }
  };

  const removePreset = async (type: 'note' | 'term', index: number) => {
    if (!profile) return;
    const presets = type === 'note' ? [...(profile.notePresets || [])] : [...(profile.termPresets || [])];
    const updated = presets.filter((_, i) => i !== index);
    await updateProfile({ 
      ...profile, 
      [type === 'note' ? 'notePresets' : 'termPresets']: updated 
    });
  };

  const accentColors = ['#FF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted">Configure your business profile and application preferences.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          {isSaving && (
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-primary/20">
              <RefreshCw size={12} className="animate-spin" />
              Syncing Workspace...
            </div>
          )}
          {showSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
              <Check size={12} />
              Saved Successfully
            </div>
          )}
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 size={18} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Business Profile</h2>
          </div>
          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="btn-primary py-2 px-6 flex items-center gap-2 text-xs shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>

        <div className="glass-card space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
             <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-muted block">Business Logo</label>
                <div className="relative group">
                   <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-white/10 bg-white/5 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary/50">
                      {profileData?.logoUrl ? (
                        <img src={profileData.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                      ) : (
                        <Upload size={32} className="text-muted group-hover:text-primary transition-colors" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                   </div>
                   {profileData?.logoUrl && (
                      <button 
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white shadow-xl hover:scale-110 transition-all"
                      >
                         <X size={12} />
                      </button>
                   )}
                </div>
                <p className="text-[10px] text-muted uppercase tracking-widest text-center">PNG, JPG up to 2MB</p>
             </div>

             <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted">Legal Business Name</label>
                 <input 
                   name="name"
                   placeholder="Enter business name"
                   value={profileData.name}
                   onChange={handleProfileChange}
                   className="input-field w-full" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted">Business Email</label>
                 <input 
                   name="email"
                   placeholder="billing@company.com"
                   value={profileData.email}
                   onChange={handleProfileChange}
                   className="input-field w-full" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted">Phone Number</label>
                 <input 
                   name="phone"
                   placeholder="+1 000 000 0000"
                   value={profileData.phone || ''}
                   onChange={handleProfileChange}
                   className="input-field w-full" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted">Website</label>
                 <input 
                   name="website"
                   placeholder="www.business.com"
                   value={profileData.website || ''}
                   onChange={handleProfileChange}
                   className="input-field w-full" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted">Currency (e.g. USD, INR)</label>
                 <select
                   name="currency"
                   value={profileData.currency || 'USD'}
                   onChange={handleProfileChange}
                   className="input-field w-full bg-transparent"
                 >
                   <option value="USD" className="bg-[#0A0A0A]">USD - Dollar ($)</option>
                   <option value="INR" className="bg-[#0A0A0A]">INR - Rupee (₹)</option>
                   <option value="EUR" className="bg-[#0A0A0A]">EUR - Euro (€)</option>
                   <option value="GBP" className="bg-[#0A0A0A]">GBP - Pound (£)</option>
                   <option value="CAD" className="bg-[#0A0A0A]">CAD - Canadian Dollar ($)</option>
                   <option value="AUD" className="bg-[#0A0A0A]">AUD - Australian Dollar ($)</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted">Tax ID / VAT Registration</label>
                 <input 
                   name="taxId"
                   placeholder="GSTIN / VAT / TAX Number"
                   value={profileData.taxId || ''}
                   onChange={handleProfileChange}
                   className="input-field w-full" 
                 />
               </div>
               <div className="md:col-span-2 space-y-2">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted">Business Address</label>
                 <textarea 
                   name="address"
                   placeholder="Street, City, State, Country, Zip"
                   value={profileData.address || ''}
                   onChange={handleProfileChange}
                   className="input-field w-full h-24 resize-none" 
                 />
               </div>

               <div className="md:col-span-2 pt-4 border-t border-white/5">
                 <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Bank Details (For Invoices)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-widest text-muted">Bank Name</label>
                     <input 
                       name="bankName"
                       placeholder="e.g. HDFC Bank"
                       value={profileData.bankName || ''}
                       onChange={handleProfileChange}
                       className="input-field w-full" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-widest text-muted">Account Number</label>
                     <input 
                       name="bankAccount"
                       placeholder="0000 0000 0000"
                       value={profileData.bankAccount || ''}
                       onChange={handleProfileChange}
                       className="input-field w-full" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-widest text-muted">IFSC / Swift Code</label>
                     <input 
                       name="ifscCode"
                       placeholder="IFSC12345"
                       value={profileData.ifscCode || ''}
                       onChange={handleProfileChange}
                       className="input-field w-full" 
                     />
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ScrollText size={18} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Invoice Presets</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Note Presets */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted">Note Presets</label>
                 <button 
                   onClick={() => {
                     const val = prompt('Enter new note preset:');
                     if (val) addPreset('note', val);
                   }}
                   className="p-1 px-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-2"
                 >
                    <Plus size={14} />
                    <span className="text-[10px] font-bold uppercase">Add New</span>
                 </button>
              </div>
              <div className="glass-card max-h-60 overflow-y-auto space-y-2 p-4">
                 {[...(profile?.notePresets || [])].map((preset, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 group">
                       <span className="text-xs truncate mr-4">{preset}</span>
                       <button 
                         onClick={() => removePreset('note', i)}
                         className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                       >
                          <X size={14} />
                       </button>
                    </div>
                 ))}
                 {(!profile?.notePresets || profile.notePresets.length === 0) && (
                    <p className="text-center py-4 text-xs text-muted">No custom presets yet.</p>
                 )}
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                 <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">System Defaults</p>
                 <div className="flex flex-wrap gap-2">
                    {DEFAULT_NOTE_PRESETS.slice(0, 3).map((p, i) => (
                       <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-muted">{p}</span>
                    ))}
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-muted">+{DEFAULT_NOTE_PRESETS.length - 3} more</span>
                 </div>
              </div>
           </div>

           {/* Term Presets */}
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <label className="text-xs font-bold uppercase tracking-widest text-muted">Terms Presets</label>
                 <button 
                   onClick={() => {
                     const val = prompt('Enter new term preset:');
                     if (val) addPreset('term', val);
                   }}
                   className="p-1 px-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-2"
                 >
                    <Plus size={14} />
                    <span className="text-[10px] font-bold uppercase">Add New</span>
                 </button>
              </div>
              <div className="glass-card max-h-60 overflow-y-auto space-y-2 p-4">
                 {[...(profile?.termPresets || [])].map((preset, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 group">
                       <span className="text-xs truncate mr-4">{preset}</span>
                       <button 
                         onClick={() => removePreset('term', i)}
                         className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                       >
                          <X size={14} />
                       </button>
                    </div>
                 ))}
                 {(!profile?.termPresets || profile.termPresets.length === 0) && (
                    <p className="text-center py-4 text-xs text-muted">No custom presets yet.</p>
                 )}
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                 <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">System Defaults</p>
                 <div className="flex flex-wrap gap-2">
                    {DEFAULT_TERM_PRESETS.slice(0, 3).map((p, i) => (
                       <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-muted">{p}</span>
                    ))}
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-muted">+{DEFAULT_TERM_PRESETS.length - 3} more</span>
                 </div>
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
          <h2 className="text-xl font-bold tracking-tight">Security & Management</h2>
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
           
           <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={handleExportData}
                className="py-3 px-6 glass rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                 <Download size={14} />
                 Backup (JSON)
              </button>
              <button 
                onClick={handleExportExcel}
                className="py-3 px-6 glass rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                 <FileSpreadsheet size={14} />
                 Profile (Excel)
              </button>
              <button 
                onClick={handleResetData}
                className="sm:col-span-2 py-3 px-6 rounded-xl text-red-500 bg-red-500/10 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                 <Trash2 size={14} />
                 Permanent Data Reset
              </button>
           </div>
        </div>
      </section>
    </div>
  );
};

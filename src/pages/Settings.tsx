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
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { DEFAULT_NOTE_PRESETS, DEFAULT_TERM_PRESETS } from '../constants/presets.ts';
import { BusinessProfile } from '../types.ts';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils.ts';
import { motion } from 'motion/react';

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
    logoUrl: '',
    taxId: '',
    bankName: '',
    bankAccount: '',
    ifscCode: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Use a ref to track if we've initialized the local state from the profile
  const isInitialized = React.useRef(false);

  useEffect(() => {
    // Only initialize once when profile is available
    if (profile && !isInitialized.current) {
      setProfileData(profile);
      isInitialized.current = true;
    }
  }, [profile]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save profile. Please check if workspace is ready.");
    }
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
    a.download = `novabill-vault-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExportExcel = () => {
    if (!profileData) return;
    const ws = XLSX.utils.json_to_sheet([{
      'BUSINESS_IDENTITY': profileData.name || 'UNNAMED',
      'CONTACT_EMAIL': profileData.email || 'N/A',
      'MOBILE_ID': profileData.phone || 'N/A',
      'DIGITAL_RESIDENCE': profileData.website || 'N/A',
      'PHYSICAL_LOCATION': profileData.address || 'N/A',
      'FISCAL_ID': profileData.taxId || 'N/A',
      'CURRENCY_UNIT': profileData.currency || 'USD',
      'FINANCIAL_ENTITY': profileData.bankName || 'N/A',
      'SECURE_ACCOUNT': profileData.bankAccount || 'N/A',
      'TRANSIT_CODE': profileData.ifscCode || 'N/A'
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CORE_PROFILE');
    XLSX.writeFile(wb, `nova-profile-manifest-${Date.now()}.xlsx`);
  };

  const handleResetData = async () => {
    if (confirm('CRITICAL ACTION: This will permanently purge all encrypted local assets. Continue?')) {
      indexedDB.deleteDatabase('novabill_db');
      window.location.reload();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileData) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Asset payload exceeds 2MB limit.');
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
      const updatedProfile = { 
        ...profileData, 
        [type === 'note' ? 'notePresets' : 'termPresets']: [...presets, trimmed] 
      };
      setProfileData(updatedProfile);
      await updateProfile(updatedProfile);
    }
  };

  const removePreset = async (type: 'note' | 'term', index: number) => {
    if (!profile) return;
    const presets = type === 'note' ? [...(profile.notePresets || [])] : [...(profile.termPresets || [])];
    const updatedPresets = presets.filter((_, i) => i !== index);
    const updatedProfile = { 
      ...profileData, 
      [type === 'note' ? 'notePresets' : 'termPresets']: updatedPresets 
    };
    setProfileData(updatedProfile);
    await updateProfile(updatedProfile);
  };

  const accentColors = ['#FF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-32">
      {/* Settings Header - Desktop Enhanced */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:bg-white/[0.02] lg:p-10 lg:rounded-[48px] lg:border lg:border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <h1 className="text-3xl lg:text-5xl font-black tracking-tight mb-4 flex items-center gap-4">
            Command Center
            {isInitialized.current && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />}
          </h1>
          <p className="text-muted text-sm lg:text-base max-w-md leading-relaxed">Refine your business infrastructure, branding assets, and security protocols.</p>
        </div>
        <div className="flex flex-col items-end gap-4 relative">
          <button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="btn-primary py-4 px-10 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all lg:min-w-[240px] justify-center"
          >
            {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Commit Changes
          </button>
          
          <div className="flex items-center gap-3">
            {isSaving && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse border border-primary/20">
                <RefreshCw size={10} className="animate-spin" />
                Synchronizing
              </div>
            )}
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-500/20"
              >
                <Check size={10} />
                Profile Updated
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Navigation / Navigation Sidebar on Desktop */}
        <div className="lg:col-span-3 lg:sticky lg:top-8 space-y-4 hidden lg:block">
           {['Identity', 'Manifests', 'Aesthetics', 'Security'].map((tab) => (
             <button key={tab} className="w-full text-left px-8 py-5 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/5 border border-transparent hover:border-white/5 text-muted hover:text-white flex items-center justify-between group">
                {tab}
                <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
             </button>
           ))}
        </div>

        <div className="lg:col-span-9 space-y-16">
          {/* Identity Section */}
          <section className="space-y-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <Building2 size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Business Identity</h2>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em]">Core Organizational Details</p>
              </div>
            </div>

            <div className="glass-card !p-0 rounded-[48px] overflow-hidden border-white/5 shadow-2xl relative group/id-card">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent" />
              <div className="p-8 lg:p-12 space-y-12">
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                  <div className="space-y-6 lg:w-48 shrink-0">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted/60 pl-2">Vessels / Logo</label>
                    <div className="relative group/logo">
                      <div className="w-48 h-48 rounded-[40px] border-2 border-dashed border-white/5 bg-white/[0.02] overflow-hidden flex items-center justify-center transition-all group-hover/logo:border-primary/40 group-hover/logo:bg-primary/5 shadow-inner">
                        {profileData?.logoUrl ? (
                          <img src={profileData.logoUrl} alt="Logo" className="w-full h-full object-contain p-8 animate-in zoom-in-95" />
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <Upload size={40} className="text-muted/40 group-hover/logo:text-primary transition-all group-hover/logo:scale-110" />
                            <span className="text-[9px] font-black uppercase text-muted/30 tracking-widest">Add Brand Asset</span>
                          </div>
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
                          className="absolute -top-3 -right-3 p-3 bg-red-500 rounded-2xl text-white shadow-2xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all border border-red-400/20"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/40 pl-2">Legal Registry Name</label>
                      <input 
                        name="name"
                        placeholder="Company Corp Inc."
                        value={profileData.name}
                        onChange={handleProfileChange}
                        className="input-field w-full h-14 bg-white/[0.01] font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/40 pl-2">Command Email</label>
                      <input 
                        name="email"
                        placeholder="billing@company.app"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        className="input-field w-full h-14 bg-white/[0.01] font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/40 pl-2">Mobile Interface</label>
                      <input 
                        name="phone"
                        placeholder="+1 (555) 000-0000"
                        value={profileData.phone || ''}
                        onChange={handleProfileChange}
                        className="input-field w-full h-14 bg-white/[0.01] font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/40 pl-2">Digital Domain</label>
                      <input 
                        name="website"
                        placeholder="www.entity.io"
                        value={profileData.website || ''}
                        onChange={handleProfileChange}
                        className="input-field w-full h-14 bg-white/[0.01] font-bold" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/40 pl-2">Currency Protocol</label>
                      <div className="relative">
                        <select
                          name="currency"
                          value={profileData.currency || 'INR'}
                          onChange={handleProfileChange}
                          className="input-field w-full h-14 bg-white/[0.01] font-black uppercase text-xs tracking-widest appearance-none cursor-pointer"
                        >
                          <option value="INR" className="bg-surface">INR - Rupee (₹)</option>
                          <option value="USD" className="bg-surface">USD - Dollar ($)</option>
                          <option value="EUR" className="bg-surface">EUR - Euro (€)</option>
                          <option value="GBP" className="bg-surface">GBP - Pound (£)</option>
                          <option value="CAD" className="bg-surface">CAD - Canadian ($)</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted/40 rotate-90" size={16} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/40 pl-2">Fiscal/Tax Identifier</label>
                      <input 
                        name="taxId"
                        placeholder="VAT-000-XX-000"
                        value={profileData.taxId || ''}
                        onChange={handleProfileChange}
                        className="input-field w-full h-14 bg-white/[0.01] font-bold border-primary/10" 
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/40 pl-2">Operational Headquarters</label>
                      <textarea 
                        name="address"
                        placeholder="Full physical address for document rendering..."
                        value={profileData.address || ''}
                        onChange={handleProfileChange}
                        className="input-field w-full h-32 resize-none bg-white/[0.01] p-6 text-sm" 
                      />
                    </div>

                    <div className="md:col-span-2 pt-8 border-t border-white/5 space-y-8">
                      <div className="flex items-center gap-3">
                         <CreditCard className="text-primary" size={18} />
                         <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Financial Routing Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted/40 pl-2">Entity Name</label>
                          <input 
                            name="bankName"
                            placeholder="Nexus Financial"
                            value={profileData.bankName || ''}
                            onChange={handleProfileChange}
                            className="input-field w-full h-12 bg-white/[0.01] text-sm" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted/40 pl-2">Account Vault</label>
                          <input 
                            name="bankAccount"
                            placeholder="0000 0000 0000"
                            value={profileData.bankAccount || ''}
                            onChange={handleProfileChange}
                            className="input-field w-full h-12 bg-white/[0.01] font-mono text-sm" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-muted/40 pl-2">Swift / Branch ID</label>
                          <input 
                            name="ifscCode"
                            placeholder="NXFS12345"
                            value={profileData.ifscCode || ''}
                            onChange={handleProfileChange}
                            className="input-field w-full h-12 bg-white/[0.01] font-mono text-sm" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Presets Section */}
          <section className="space-y-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <ScrollText size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Document Fragments</h2>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em]">Automated Text Blocks</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Note Presets */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">Gratitude / Footnotes</label>
                     <button 
                       onClick={() => {
                         const val = prompt('Enter protocol footnote:');
                         if (val) addPreset('note', val);
                       }}
                       className="p-2 px-4 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-all flex items-center gap-2 border border-primary/10 text-[10px] font-black uppercase"
                     >
                        <Plus size={14} />
                        Add New
                     </button>
                  </div>
                  <div className="glass-card !p-4 rounded-[32px] max-h-72 overflow-y-auto space-y-3 custom-scrollbar border-white/5 shadow-xl">
                     {[...(profileData?.notePresets || [])].map((preset, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={i} 
                          className="flex items-center justify-between p-4 rounded-[20px] bg-white/[0.02] hover:bg-white/[0.04] group border border-white/5 transition-all"
                        >
                           <span className="text-xs truncate mr-4 italic text-white/80">"{preset}"</span>
                           <button 
                             onClick={() => removePreset('note', i)}
                             className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                           >
                              <X size={16} />
                           </button>
                        </motion.div>
                     ))}
                     {(!profileData?.notePresets || profileData.notePresets.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-20">
                           <StickyNote size={40} />
                           <p className="text-[10px] font-black uppercase tracking-widest">No custom fragments</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Term Presets */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/60">Legal Terms</label>
                     <button 
                       onClick={() => {
                         const val = prompt('Enter legal clause:');
                         if (val) addPreset('term', val);
                       }}
                       className="p-2 px-4 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 transition-all flex items-center gap-2 border border-primary/10 text-[10px] font-black uppercase"
                     >
                        <Plus size={14} />
                        Add New
                     </button>
                  </div>
                  <div className="glass-card !p-4 rounded-[32px] max-h-72 overflow-y-auto space-y-3 custom-scrollbar border-white/5 shadow-xl">
                     {[...(profileData?.termPresets || [])].map((preset, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={i} 
                          className="flex items-center justify-between p-4 rounded-[20px] bg-white/[0.02] hover:bg-white/[0.04] group border border-white/5 transition-all"
                        >
                           <span className="text-xs truncate mr-4 text-white/80">{preset}</span>
                           <button 
                             onClick={() => removePreset('term', i)}
                             className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                           >
                              <X size={16} />
                           </button>
                        </motion.div>
                     ))}
                     {(!profileData?.termPresets || profileData.termPresets.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-20">
                           <ScrollText size={40} />
                           <p className="text-[10px] font-black uppercase tracking-widest">No legal templates</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </section>

          {/* Appearance Section */}
          <section className="space-y-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <Palette size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Aesthetic Configuration</h2>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em]">Visual Environment Controls</p>
              </div>
            </div>

            <div className="glass-card !p-10 lg:!p-16 rounded-[48px] grid grid-cols-1 md:grid-cols-2 gap-20 border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px]" />
              <div className="space-y-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/60 block mb-8">Atmosphere Color</label>
                  <div className="flex flex-wrap gap-5">
                    {accentColors.map(color => (
                      <button 
                        key={color}
                        onClick={() => updateSettings({ accentColor: color })}
                        className={cn(
                          "w-12 h-12 rounded-2xl border-4 transition-all hover:scale-110 active:scale-95 shadow-xl p-1",
                          settings.accentColor === color ? "border-white shadow-primary/30" : "border-transparent opacity-60"
                        )}
                        style={{ backgroundColor: color }}
                      >
                         {settings.accentColor === color && <div className="w-full h-full rounded-xl bg-white/20 animate-in zoom-in-50" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/60 block">Lighting Protocol</label>
                  <div className="flex gap-4">
                    {['dark', 'light'].map((mode) => (
                      <button 
                        key={mode}
                        onClick={() => updateSettings({ theme: mode as any })}
                        className={cn(
                          "flex-1 p-6 rounded-[32px] border flex flex-col items-center gap-3 transition-all relative overflow-hidden group",
                          settings.theme === mode ? "bg-primary border-primary shadow-2xl shadow-primary/30" : "bg-white/[0.02] border-white/5 text-muted/50 hover:text-white"
                        )}
                      >
                        {settings.theme === mode && <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent group-hover:scale-110 transition-transform" />}
                        {mode === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">{mode} Environment</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/60 block">Structural Density</label>
                  <div className="flex flex-col gap-4">
                     {['comfortable', 'compact'].map((d) => (
                        <button 
                        key={d}
                        onClick={() => updateSettings({ density: d as any })}
                        className={cn(
                          "w-full p-6 rounded-[32px] border flex items-center justify-between px-8 group transition-all",
                          settings.density === d ? "bg-primary border-primary shadow-xl shadow-primary/20 text-white" : "bg-white/[0.02] border-white/5 text-muted/60 hover:text-white"
                        )}
                       >
                         <div className="flex items-center gap-5">
                            <Layout size={24} className={d === 'compact' ? 'scale-75' : ''} />
                            <span className="text-xs font-black uppercase tracking-widest">{d} Layout</span>
                         </div>
                         {settings.density === d && <Check size={20} className="animate-in slide-in-from-right-4" />}
                       </button>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="space-y-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <Shield size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Asset Security</h2>
                <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em]">Maintenance & Vault Management</p>
              </div>
            </div>

            <div className="glass-card !p-0 rounded-[48px] divide-y divide-white/5 border-white/5 shadow-2xl overflow-hidden">
               <div className="p-10 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 bg-gradient-to-br from-white/[0.02] to-transparent">
                  <div className="space-y-2">
                     <p className="text-lg font-black italic tracking-tight">On-Device Cryptography</p>
                     <p className="text-xs text-muted/60 leading-relaxed max-w-sm">Organizational intelligence is localized using hardware-accelerated AES-256 protocols. Your data never traverses our infrastructure.</p>
                  </div>
                  <div className="w-20 h-10 bg-primary/20 rounded-full relative p-2 shadow-inner border border-primary/20">
                     <div className="absolute right-2 top-2 w-6 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] flex items-center justify-center"><Check size={12} className="text-white" /></div>
                  </div>
               </div>
               
               <div className="p-10 lg:p-12 grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-10">
                  <button 
                    onClick={handleExportData}
                    className="py-6 px-8 glass rounded-[32px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all flex items-center justify-center gap-4 group border-white/5 hover:border-primary/20"
                  >
                     <Download size={20} className="group-hover:translate-y-1 transition-transform text-primary" />
                     Full Vault Backup
                  </button>
                  <button 
                    onClick={handleExportExcel}
                    className="py-6 px-8 glass rounded-[32px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all flex items-center justify-center gap-4 group border-white/5 hover:border-primary/20"
                  >
                     <FileSpreadsheet size={20} className="group-hover:scale-110 transition-transform text-primary" />
                     Identity Manifest (Excel)
                  </button>
                  <button 
                    onClick={handleResetData}
                    className="sm:col-span-2 py-6 px-8 rounded-[32px] text-red-500 bg-red-500/5 text-[11px] font-black uppercase tracking-[0.4em] hover:bg-red-500/10 transition-all flex items-center justify-center gap-4 border border-transparent hover:border-red-500/20"
                  >
                     <Trash2 size={20} className="group-hover:animate-bounce" />
                     Purge All Records
                  </button>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

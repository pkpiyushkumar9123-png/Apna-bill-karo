import React, { useState } from 'react';
import { 
  LayoutTemplate, 
  Check, 
  Star, 
  Zap, 
  Settings, 
  ArrowLeft, 
  Eye, 
  Type, 
  Palette, 
  Move3d, 
  SquareDot, 
  FileText, 
  Building2, 
  Signature, 
  Coins, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore.ts';

const prebuiltTemplates = [
  { id: 'modern', name: 'Elite Modern', desc: 'Minimalist layout with a bold focus on typography and high-end aesthetics.', image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=600' },
  { id: 'luxury', name: 'Onyx Luxury', desc: 'Deep matte backgrounds with elegant serif font pairings for high-ticket services.', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600' },
  { id: 'corporate', name: 'Swiss Professional', desc: 'Grid-based precision designed for corporate compliance and global standards.', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=600' },
  { id: 'creative', name: 'Neon Creative', desc: 'High-contrast vibrant accents for agencies, designers, and innovative startups.', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=600' },
  { id: 'minimal', name: 'Nano Minimal', desc: 'Ultra-clean, information-dense layout emphasizing clarity and fast scannability.', image: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=600' },
  { id: 'classic', name: 'Vintage Heritage', desc: 'Comfortable, time-tested balanced arrangement tailored for traditional consulting.', image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600' },
];

const fontFamilies = [
  { id: 'Inter', name: 'Inter (Modern Symmetrical)', css: '"Inter", sans-serif' },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech & Editorial)', css: '"Space Grotesk", sans-serif' },
  { id: 'Playfair Display', name: 'Playfair Display (Luxury Serif)', css: '"Playfair Display", serif' },
  { id: 'JetBrains Mono', name: 'JetBrains Mono (Developer Brutalist)', css: '"JetBrains Mono", monospace' },
];

const colorPalettes = [
  { id: '#FF4D57', name: 'Elite Ruby', bg: 'bg-[#FF4D57]' },
  { id: '#3B82F6', name: 'Ocean Sapphire', bg: 'bg-blue-500' },
  { id: '#10B981', name: 'Emerald Jade', bg: 'bg-emerald-500' },
  { id: '#F59E0B', name: 'Amber Sun', bg: 'bg-amber-500' },
  { id: '#8B5CF6', name: 'Matte Violet', bg: 'bg-purple-500' },
  { id: '#EC4899', name: 'Creative Quartz', bg: 'bg-pink-500' },
];

export const Templates: React.FC = () => {
  const { settings, updateSettings, profile } = useStore();
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);

  // Local state initialized from store settings
  const [localTemplateId, setLocalTemplateId] = useState(settings.invoiceTemplateId || 'modern');
  const [localFont, setLocalFont] = useState(settings.invoiceFontFamily || 'Inter');
  const [localColor, setLocalColor] = useState(settings.invoiceAccentColor || '#FF4D57');
  const [localMargins, setLocalMargins] = useState<any>(settings.invoiceMargins || 'comfortable');
  const [localShowTaxId, setLocalShowTaxId] = useState(settings.invoiceShowTaxId !== false);
  const [localShowSignature, setLocalShowSignature] = useState(settings.invoiceShowSignature !== false);
  const [localShowBankDetails, setLocalShowBankDetails] = useState(settings.invoiceShowBankDetails !== false);

  // Quick select a template from gallery
  const handleSelectTemplate = async (templateId: string, templateName: string) => {
    try {
      await updateSettings({ invoiceTemplateId: templateId });
      setLocalTemplateId(templateId);
      triggerBanner(`Successfully set layout template to "${templateName}"!`);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerBanner = (message: string) => {
    setSuccessBanner(message);
    setTimeout(() => {
      setSuccessBanner(null);
    }, 4000);
  };

  const saveStudioConfigurations = async () => {
    setCommitting(true);
    try {
      await updateSettings({
        invoiceTemplateId: localTemplateId,
        invoiceFontFamily: localFont,
        invoiceAccentColor: localColor,
        invoiceMargins: localMargins,
        invoiceShowTaxId: localShowTaxId,
        invoiceShowSignature: localShowSignature,
        invoiceShowBankDetails: localShowBankDetails,
      });
      triggerBanner('Committed aesthetic studio rules to business ledger cloud preferences successfully!');
      setIsStudioOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setCommitting(false);
    }
  };

  // Get active font CSS object
  const activeFontFamily = fontFamilies.find(f => f.id === localFont)?.css || '"Inter", sans-serif';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 w-full">
      {/* Toast Banner */}
      <AnimatePresence>
        {successBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 p-4 bg-emerald-500 border border-emerald-400 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-semibold text-xs py-3 max-w-sm tracking-wide"
          >
            <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Check size={12} className="text-white" />
            </div>
            <span>{successBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isStudioOpen ? (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <LayoutTemplate className="text-[#FF4D57]" size={24} />
                  <span>Design Templates Gallery</span>
                </h1>
                <p className="text-muted text-xs font-medium tracking-wide mt-1">
                  Choose or custom-craft a layout optimized to project elite professionalism.
                </p>
              </div>
              <button 
                onClick={() => setIsStudioOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#FF4D57] to-pink-500 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:opacity-95 shadow-xl shadow-pink-500/10 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Sparkles size={14} className="animate-pulse" />
                <span>Open Customizer Studio</span>
              </button>
            </div>

            {/* Current Selected Template Indicator */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                <Check size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-[#A1A1AA] tracking-widest">Active Invoice Layout</p>
                <p className="text-xs font-bold text-white mt-0.5">
                  Template ID: <span className="text-primary font-mono lowercase">{settings.invoiceTemplateId || 'modern'}</span> (with customized options)
                </p>
              </div>
              <button 
                onClick={() => {
                  // Prepopulate state
                  setLocalTemplateId(settings.invoiceTemplateId || 'modern');
                  setLocalFont(settings.invoiceFontFamily || 'Inter');
                  setLocalColor(settings.invoiceAccentColor || '#FF4D57');
                  setLocalMargins(settings.invoiceMargins || 'comfortable');
                  setLocalShowTaxId(settings.invoiceShowTaxId !== false);
                  setLocalShowSignature(settings.invoiceShowSignature !== false);
                  setLocalShowBankDetails(settings.invoiceShowBankDetails !== false);
                  setIsStudioOpen(true);
                }}
                className="text-xs font-bold text-muted hover:text-white underline cursor-pointer"
              >
                Tweak Active Styles
              </button>
            </div>

            {/* Grid of Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prebuiltTemplates.map((template, idx) => {
                const isActive = (settings.invoiceTemplateId || 'modern') === template.id;
                return (
                  <motion.div 
                    key={template.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative p-1.5 rounded-3xl bg-[#15171A] border transition-all duration-300 flex flex-col justify-between group overflow-hidden ${
                      isActive ? 'border-[#FF4D57] shadow-[0_0_30px_rgba(255,77,87,0.06)]' : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    {/* Visual Preview */}
                    <div className="aspect-[4/5] relative rounded-2xl overflow-hidden bg-background">
                      <img 
                        src={template.image} 
                        alt={template.name} 
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                      
                      {isActive && (
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                          <Check size={8} /> Selected
                        </div>
                      )}

                      {/* Floating actions */}
                      <div className="absolute inset-x-4 bottom-4 flex flex-col gap-2">
                        <button 
                          onClick={() => handleSelectTemplate(template.id, template.name)}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                            isActive ? 'bg-emerald-500 text-white' : 'bg-[#FF4D57] hover:bg-[#ff3c47] text-white'
                          }`}
                        >
                          <span>{isActive ? 'Active Blueprint' : 'Activate Layout'}</span>
                        </button>
                        <button 
                          onClick={() => {
                            setLocalTemplateId(template.id);
                            setIsStudioOpen(true);
                          }}
                          className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Settings size={10} />
                          <span>Customize in Studio</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-4 pt-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="text-sm font-bold tracking-tight text-white">{template.name}</h3>
                          <p className="text-[10px] text-[#A1A1AA] leading-normal mt-0.5 max-w-[200px]">{template.desc}</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star size={10} className="fill-amber-400" />
                          <span className="text-[10px] font-bold font-mono">Elite</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Custom Studio Banner */}
            <div className="p-8 rounded-3xl bg-[#111214] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-primary/5 blur-3xl rounded-full" />
              <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4D57] to-pink-500 flex items-center justify-center text-white shadow-xl shadow-primary/10">
                  <LayoutTemplate size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Full-featured Interactive Studio Customizer</h3>
                  <p className="text-xs text-[#A1A1AA] leading-normal max-w-md mt-0.5">
                    Want absolute design parity? Toggle layouts, modify brand typography, select precise color palettes, margins, signatures, and watch your changes reflect live.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsStudioOpen(true)}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-wider active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap z-10"
              >
                Go to Builder Workspace
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="studio"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Studio Navigation & Commits */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsStudioOpen(false)}
                  className="p-2 bg-[#15171A] hover:bg-white/5 border border-white/5 rounded-xl text-white cursor-pointer transition-all"
                  title="Back to gallery"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-[#FF4D57]" size={18} />
                    <span>Aesthetic Layout Studio</span>
                  </h1>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-0.5">Custom template builder & live renderer</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setIsStudioOpen(false)}
                  className="px-4 py-2 bg-transparent text-[#A1A1AA] hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Discard
                </button>
                <button 
                  onClick={saveStudioConfigurations}
                  disabled={committing}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xl shadow-emerald-500/10 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {committing ? <RefreshCw size={12} className="animate-spin" /> : <Check size={14} />}
                  <span>Commit Layout Configuration</span>
                </button>
              </div>
            </div>

            {/* Split screen content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
              
              {/* Left Column: Visual Controls (5 Cols) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* Section 1: Template Structure */}
                <div className="p-5 rounded-2xl bg-[#111214] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <LayoutTemplate size={14} className="text-[#FF4D57]" />
                    <span>1. Template Preset Structure</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['modern', 'luxury', 'corporate', 'creative', 'minimal', 'classic'].map((styleId) => {
                      const isSelected = localTemplateId === styleId;
                      return (
                        <button
                          key={styleId}
                          onClick={() => setLocalTemplateId(styleId)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-20 ${
                            isSelected 
                              ? 'bg-[#FF4D57]/5 border-[#FF4D57] shadow-lg shadow-primary/5' 
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="text-[10px] font-black text-[#A1A1AA] capitalize">{styleId} structure</span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                            isSelected ? 'text-white' : 'text-zinc-500'
                          }`}>
                            {isSelected ? <Check size={8} className="text-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />}
                            {styleId === 'modern' ? 'Elite Symmetrical' : 
                             styleId === 'luxury' ? 'Midnight Matte' : 
                             styleId === 'corporate' ? 'Swiss Matrix' : 
                             styleId === 'creative' ? 'Vibrant Quartz' : 
                             styleId === 'minimal' ? 'Nano Information' : 'Heritage Vintage'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Typography Pairings */}
                <div className="p-5 rounded-2xl bg-[#111214] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <Type size={14} className="text-blue-400" />
                    <span>2. Brand Typography System</span>
                  </h3>
                  <div className="space-y-2">
                    {fontFamilies.map((font) => {
                      const isSelected = localFont === font.id;
                      return (
                        <button
                          key={font.id}
                          onClick={() => setLocalFont(font.id)}
                          className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                            isSelected 
                              ? 'bg-blue-500/5 border-blue-500' 
                              : 'bg-white/[0.02] border-white/5 hover:bg-[#15171A]'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white" style={{ fontFamily: font.css }}>
                              {font.name}
                            </span>
                            <span className="text-[9px] text-[#A1A1AA] mt-0.5">The quick brown fox jumps over the lazy dog.</span>
                          </div>
                          {isSelected && <Check size={14} className="text-blue-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Accent Brand Palette */}
                <div className="p-5 rounded-2xl bg-[#111214] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <Palette size={14} className="text-emerald-400" />
                    <span>3. Brand Primary Accent</span>
                  </h3>
                  <div className="grid grid-cols-6 gap-2">
                    {colorPalettes.map((palette) => {
                      const isSelected = localColor === palette.id;
                      return (
                        <button
                          key={palette.id}
                          onClick={() => setLocalColor(palette.id)}
                          className={`aspect-square rounded-xl cursor-pointer flex items-center justify-center transition-all ${palette.bg} ${
                            isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110 shadow-lg' : 'opacity-80 hover:opacity-100 hover:scale-105'
                          }`}
                          title={palette.name}
                        >
                          {isSelected && <Check size={14} className="text-white drop-shadow-md" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Spacing Densities */}
                <div className="p-5 rounded-2xl bg-[#111214] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <Move3d size={14} className="text-amber-400" />
                    <span>4. Spacing Margin Density</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'compact', label: 'Compact', sub: 'Information dense' },
                      { id: 'comfortable', label: 'Comfortable', sub: 'Gold standard' },
                      { id: 'spacious', label: 'Spacious', sub: 'Generous blanking' },
                    ].map((mOption) => {
                      const isSelected = localMargins === mOption.id;
                      return (
                        <button
                          key={mOption.id}
                          onClick={() => setLocalMargins(mOption.id as any)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected 
                              ? 'bg-amber-500/5 border-amber-500' 
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="text-xs font-bold text-white">{mOption.label}</span>
                          <span className="text-[8px] text-[#A1A1AA] leading-none mt-1">{mOption.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 5: Layer Toggles */}
                <div className="p-5 rounded-2xl bg-[#111214] border border-white/5 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <SquareDot size={14} className="text-purple-400" />
                    <span>5. Component Metadata Overlays</span>
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Building2 size={14} className="text-zinc-400" />
                        <span className="text-xs text-white font-medium">Show Tax Registration & ID Lines</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={localShowTaxId} 
                        onChange={(e) => setLocalShowTaxId(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-transparent bg-[#111214] border-white/10"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Signature size={14} className="text-zinc-400" />
                        <span className="text-xs text-white font-medium">Render Authorized Signatory Box</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={localShowSignature} 
                        onChange={(e) => setLocalShowSignature(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-transparent bg-[#111214] border-white/10"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Coins size={14} className="text-zinc-400" />
                        <span className="text-xs text-white font-medium">Include Wire Instructions & Banking Details</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={localShowBankDetails} 
                        onChange={(e) => setLocalShowBankDetails(e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-transparent bg-[#111214] border-white/10"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Live Aesthetic Preview Canvas (7 Cols) */}
              <div className="lg:col-span-7 bg-[#111214] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Eye size={16} className="text-[#FF4D57]" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Aesthetic Billing rendering Engine</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] font-black uppercase text-[#A1A1AA] tracking-widest bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Sandbox preview
                  </div>
                </div>

                {/* Simulated Sheet Paper */}
                <div 
                  className={`bg-white rounded-2xl border shadow-2xl transition-all duration-300 relative text-[#1F2937] leading-relaxed overflow-hidden ${
                    localMargins === 'compact' ? 'p-4 md:p-6 text-xs' : 
                    localMargins === 'spacious' ? 'p-10 text-sm' : 
                    'p-6 md:p-8 text-xs'
                  }`}
                  style={{ 
                    fontFamily: activeFontFamily, 
                    borderColor: 'rgba(0,0,0,0.06)' 
                  }}
                >
                  {/* Decorative Preset Header overlay according to structure selected */}
                  {localTemplateId === 'luxury' && (
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-[#1F2937]" />
                  )}
                  {localTemplateId === 'creative' && (
                    <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: localColor }} />
                  )}

                  {/* Header Block */}
                  <div className={`flex flex-col ${localTemplateId === 'minimal' ? 'items-start gap-4' : 'sm:flex-row justify-between items-start gap-6'} border-b border-gray-100 pb-5 mb-5`}>
                    
                    {/* Brand Meta */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-white" style={{ backgroundColor: localColor }}>
                          <FileText size={12} />
                        </div>
                        <span className="text-sm font-black tracking-tight" style={{ color: localColor }}>
                          {profile?.name || 'GENIUS INC'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {profile?.email || 'payments@geniusinc.co'} • {profile?.phone || '+91 98765 43210'}
                      </p>
                      <p className="text-[9px] text-gray-400 leading-normal max-w-[200px]">
                        {profile?.address || '7th Block Cosmic Towers, Tech Park Phase 2, Bangalore, India'}
                      </p>
                      {localShowTaxId && (
                        <p className="text-[9px] font-bold text-gray-600 mt-1 uppercase tracking-wider bg-gray-50 inline-block px-1.5 py-0.5 rounded border border-gray-100 leading-none">
                          Tax Registration ID (GSTIN): {profile?.taxId || '29AAAAA1111A1Z1'}
                        </p>
                      )}
                    </div>

                    {/* Invoice Basics */}
                    <div className={`text-left ${localTemplateId === 'minimal' ? '' : 'sm:text-right'} space-y-1`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tax Invoice / Bill</p>
                      <p className="text-base font-extrabold" style={{ color: localColor }}>#INV-2026-608</p>
                      <div className="flex flex-col text-[10px] text-gray-500 font-semibold gap-0.5 pt-1">
                        <p>Date: <span className="font-bold text-gray-700">25 May 2026</span></p>
                        <p>Due Date: <span className="font-bold text-gray-700" style={{ color: localColor }}>09 Jun 2026</span></p>
                      </div>
                    </div>

                  </div>

                  {/* Customer Segment */}
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl mb-5 space-y-1">
                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Invoiced Recipient Client</p>
                    <p className="text-xs font-bold text-gray-800">Acme Global Conglomerate Ltd.</p>
                    <p className="text-[9px] text-gray-500 leading-normal">
                      Acme Campus, Hitech Boulevard Suite 404, San Francisco, CA 94103
                    </p>
                    {localShowTaxId && (
                      <p className="text-[9px] text-gray-400 font-medium pt-0.5 leading-none">Tax Reg: US-987654321</p>
                    )}
                  </div>

                  {/* Items Grid Table */}
                  <div className="space-y-2 mb-5">
                    <div className="grid grid-cols-12 text-[8px] font-black uppercase text-gray-400 tracking-wider border-b border-gray-100 pb-1.5">
                      <span className="col-span-6">Service Line item description</span>
                      <span className="col-span-2 text-right">Rate</span>
                      <span className="col-span-1 text-right">Qty</span>
                      <span className="col-span-1 text-right">Tax</span>
                      <span className="col-span-2 text-right">Line Fee</span>
                    </div>

                    {/* Dummy Row 1 */}
                    <div className="grid grid-cols-12 text-[10px] font-medium text-gray-800 border-b border-gray-50 py-1.5">
                      <div className="col-span-6">
                        <p className="font-bold">Enterprise Cloud Architecture Consulting</p>
                        <p className="text-[8px] text-gray-400 leading-normal">DevOps pipeline orchestration, high-end VM autoscaling blueprints</p>
                      </div>
                      <span className="col-span-2 text-right font-mono text-[9px]">{profile?.currency || 'INR'} 15,000</span>
                      <span className="col-span-1 text-right font-bold text-gray-400">8</span>
                      <span className="col-span-1 text-right font-bold text-gray-400">18%</span>
                      <span className="col-span-2 text-right font-bold">{profile?.currency || 'INR'} 1,20,000</span>
                    </div>

                    {/* Dummy Row 2 */}
                    <div className="grid grid-cols-12 text-[10px] font-medium text-gray-800 border-b border-gray-50 py-1.5">
                      <div className="col-span-6">
                        <p className="font-bold">Automated Excel Ledger Ledger Sync Engine</p>
                        <p className="text-[8px] text-gray-400 leading-normal">Bespoke local-first offline syncing connector for Google Drive</p>
                      </div>
                      <span className="col-span-2 text-right font-mono text-[9px]">{profile?.currency || 'INR'} 45,000</span>
                      <span className="col-span-1 text-right font-bold text-gray-400">1</span>
                      <span className="col-span-1 text-right font-bold text-gray-400">12%</span>
                      <span className="col-span-2 text-right font-bold">{profile?.currency || 'INR'} 45,000</span>
                    </div>
                  </div>

                  {/* Calculations breakdown */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-1 mb-5">
                    {/* General Terms Preset stub */}
                    <div className="flex-1 space-y-1 max-w-[240px]">
                      <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest leading-none">Terms & Notices</p>
                      <p className="text-[9px] text-gray-500 leading-normal">
                        Please pay invoice total securely within 14 calendar days from the issuance date. A late penalty fee of 1.5% will apply monthly thereafter. Thank you for your continued operations with our enterprise workspace.
                      </p>
                    </div>

                    {/* Math Columns */}
                    <div className="w-full sm:w-[150px] space-y-1.5 font-medium text-gray-500 text-right">
                      <div className="flex justify-between gap-2 text-[10px]">
                        <span>Subtotal:</span>
                        <span className="font-bold text-gray-800">{profile?.currency || 'INR'} 1,65,000</span>
                      </div>
                      <div className="flex justify-between gap-2 text-[10px]">
                        <span>Tax Total:</span>
                        <span className="font-bold text-gray-800">{profile?.currency || 'INR'} 27,000</span>
                      </div>
                      <div className="flex justify-between gap-2 text-[10px] border-b border-gray-100 pb-1.5">
                        <span>Discounts:</span>
                        <span className="font-bold text-emerald-600">-{profile?.currency || 'INR'} 5,000</span>
                      </div>
                      <div className="flex justify-between gap-2 text-xs font-black text-gray-800">
                        <span>Total Due:</span>
                        <span style={{ color: localColor }}>{profile?.currency || 'INR'} 1,87,000</span>
                      </div>
                    </div>
                  </div>

                  {/* Optional Bank Wire Instructions Segment */}
                  {localShowBankDetails && (
                    <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50 space-y-1 mb-5">
                      <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1">
                        <Coins size={10} style={{ color: localColor }} />
                        <span>Direct Settlement Bank Transfer Details</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[9px] text-gray-500 font-medium">
                        <p>Bank: <span className="font-bold text-gray-700">{profile?.bankName || 'State Bank of India'}</span></p>
                        <p>A/C Holder: <span className="font-bold text-gray-700">{profile?.holderName || 'Piyush Kumar'}</span></p>
                        <p>Account No: <span className="font-bold text-gray-700 font-mono text-[9px]">{profile?.bankAccount || '39948577483'}</span></p>
                        <p>IFSC / SWIFT: <span className="font-bold text-gray-700 font-mono text-[9px]">{profile?.ifscCode || 'SBIN0008453'}</span></p>
                        {profile?.upiId && (
                          <p className="col-span-2">UPI Identifier: <span className="font-bold text-gray-800 tracking-wide font-mono text-[9px]">{profile.upiId}</span></p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Signatory Footer segment */}
                  {localShowSignature && (
                    <div className="flex justify-end pt-4 border-t border-gray-50">
                      <div className="text-right space-y-1.5">
                        <div className="h-6 w-24 border-b border-gray-200 ml-auto flex items-center justify-center relative overflow-hidden">
                          {profile?.signature ? (
                            <img src={profile.signature} alt="Sign" className="h-full object-contain" />
                          ) : (
                            <span className="text-[8px] tracking-wide text-gray-300 font-mono">Authorized Seal</span>
                          )}
                        </div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Authorized Signatory</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

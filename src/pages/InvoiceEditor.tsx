import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Search,
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Eye, 
  LayoutTemplate, 
  ArrowLeft,
  ChevronRight,
  Info,
  QrCode,
  Type,
  Palette,
  Copy,
  BookOpen,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore.ts';
import { Invoice, InvoiceItem } from '../types.ts';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../services/pdfService.ts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DEFAULT_NOTE_PRESETS, DEFAULT_TERM_PRESETS } from '../constants/presets.ts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const itemSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1),
  price: z.number().min(0),
  taxRate: z.number().min(0).max(100),
  discount: z.number().min(0).max(100),
});

const invoiceSchema = z.object({
  number: z.string().min(1),
  date: z.number(),
  dueDate: z.number(),
  customerId: z.string().min(1, 'Please select a customer'),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  category: z.string().optional(),
  templateId: z.string(),
  accentColor: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export const InvoiceEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, customers, products, profile, addInvoice, updateInvoice, addCustomer, addProduct } = useStore();
  const [isPreview, setIsPreview] = useState(false);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', companyName: '', address: '' });
  const [showQuickProduct, setShowQuickProduct] = useState<{ index: number } | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, taxRate: 0 });
  const [showNotePresets, setShowNotePresets] = useState(false);
  const [showTermPresets, setShowTermPresets] = useState(false);
  const [stockWarning, setStockWarning] = useState<{ name: string; needed: number; available: number } | null>(null);

  const getProductAvailability = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    
    const pendingQty = invoices
      .filter(inv => inv.id !== id && inv.status !== 'paid' && inv.status !== 'draft')
      .reduce((sum, inv) => {
        const item = inv.items.find(i => i.productId === productId);
        return sum + (item?.quantity || 0);
      }, 0);
      
    return Math.max(0, product.stockLevel - pendingQty);
  };

  const handleQuickCustomer = async () => {
    if (!newCustomer.name || !newCustomer.email) return;
    const cid = Math.random().toString(36).substr(2, 9);
    await addCustomer({ ...newCustomer, id: cid, createdAt: Date.now() });
    setValue('customerId', cid);
    setShowQuickCustomer(false);
    setNewCustomer({ name: '', email: '', companyName: '', address: '' });
  };

  const handleQuickProduct = async (index: number) => {
    if (!newProduct.name) return;
    const pid = Math.random().toString(36).substr(2, 9);
    await addProduct({ 
      ...newProduct, 
      id: pid, 
      unit: 'Item', 
      sku: `PROD-${pid.toUpperCase()}`,
      stockLevel: 100, // Default for quick add
      minStockLevel: 10,
      createdAt: Date.now() 
    });
    setValue(`items.${index}.description`, newProduct.name);
    setValue(`items.${index}.productId`, pid);
    setValue(`items.${index}.price`, newProduct.price);
    setValue(`items.${index}.taxRate`, newProduct.taxRate);
    setShowQuickProduct(null);
    setNewProduct({ name: '', price: 0, taxRate: 0 });
  };

  const initialInvoice = useMemo(() => {
    if (id) return invoices.find(inv => inv.id === id);
    return null;
  }, [id, invoices]);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialInvoice ? {
      number: initialInvoice.number,
      date: initialInvoice.date,
      dueDate: initialInvoice.dueDate,
      customerId: initialInvoice.customerId,
      items: initialInvoice.items,
      notes: initialInvoice.notes,
      terms: initialInvoice.terms,
      category: initialInvoice.category || '',
      templateId: initialInvoice.templateId || 'modern',
      accentColor: (initialInvoice as any).accentColor || '#3B82F6',
    } : {
      number: `INV-${Date.now().toString().slice(-6)}`,
      date: Date.now(),
      dueDate: Date.now() + 86400000 * 7,
      customerId: '',
      items: [{ id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, price: 0, taxRate: 0, discount: 0 }],
      notes: '',
      terms: '',
      category: '',
      templateId: 'modern',
      accentColor: '#3B82F6',
    }
  });

  useEffect(() => {
    if (initialInvoice) {
      reset({
        number: initialInvoice.number,
        date: initialInvoice.date,
        dueDate: initialInvoice.dueDate,
        customerId: initialInvoice.customerId,
        items: initialInvoice.items,
        notes: initialInvoice.notes,
        terms: initialInvoice.terms,
        category: initialInvoice.category || '',
        templateId: initialInvoice.templateId || 'modern',
        accentColor: (initialInvoice as any).accentColor || '#3B82F6',
      });
    } else if (!id) {
      reset({
        number: `INV-${Date.now().toString().slice(-6)}`,
        date: Date.now(),
        dueDate: Date.now() + 86400000 * 7,
        customerId: '',
        items: [{ id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, price: 0, taxRate: 0, discount: 0 }],
        notes: '',
        terms: '',
        category: '',
        templateId: 'modern',
        accentColor: '#3B82F6',
      });
    }
  }, [id, initialInvoice, reset]);

  const onInvalid = (errors: any) => {
    console.error('Form Validation Errors:', errors);
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = useWatch({
    control,
    name: 'items'
  }) || [];
  
  const watchedNumber = watch('number');
  const watchedCustomerId = watch('customerId');

  const totals = useMemo(() => {
    if (!watchedItems || !Array.isArray(watchedItems)) {
      return { subtotal: 0, taxTotal: 0, discountTotal: 0, total: 0 };
    }

    const calculated = watchedItems.reduce((acc, item) => {
      const qty = parseFloat(String(item?.quantity)) || 0;
      const price = parseFloat(String(item?.price)) || 0;
      const taxRate = parseFloat(String(item?.taxRate)) || 0;
      const discount = parseFloat(String(item?.discount)) || 0;

      const itemSubtotal = qty * price;
      const discountAmount = itemSubtotal * (discount / 100);
      const afterDiscount = Math.max(0, itemSubtotal - discountAmount);
      const taxAmount = Math.max(0, afterDiscount * (taxRate / 100));
      
      acc.subtotal += itemSubtotal;
      acc.discountTotal += discountAmount;
      acc.taxTotal += taxAmount;
      acc.total += afterDiscount + taxAmount;
      return acc;
    }, { subtotal: 0, taxTotal: 0, discountTotal: 0, total: 0 });

    return {
      subtotal: isNaN(calculated.subtotal) ? 0 : Math.max(0, calculated.subtotal),
      taxTotal: isNaN(calculated.taxTotal) ? 0 : Math.max(0, calculated.taxTotal),
      discountTotal: isNaN(calculated.discountTotal) ? 0 : Math.max(0, calculated.discountTotal),
      total: isNaN(calculated.total) ? 0 : Math.max(0, calculated.total)
    };
  }, [watchedItems]);

  const [isFormSaving, setIsFormSaving] = useState(false);
  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setIsFormSaving(true);
      const invoiceData: Invoice = {
        ...data,
        id: id || Math.random().toString(36).substr(2, 9),
        businessId: profile?.id || 'default',
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        discountTotal: totals.discountTotal,
        total: totals.total,
        status: initialInvoice?.status || 'draft',
        templateId: data.templateId || 'modern',
        accentColor: data.accentColor,
        currency: profile?.currency || 'USD',
        createdAt: initialInvoice?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      if (id) {
        await updateInvoice(invoiceData);
      } else {
        await addInvoice(invoiceData);
      }

      if ((window as any)._saveAndNew) {
        (window as any)._saveAndNew = false;
        navigate('/invoices/new', { replace: true });
        window.location.reload();
      } else {
        navigate('/invoices');
      }
    } catch (err) {
      console.error('Failed to save invoice:', err);
      alert('Failed to save invoice. Please check the console for details.');
    } finally {
      setIsFormSaving(false);
    }
  };

  const handleDownload = () => {
    const data = watch();
    const invoiceData: Invoice = {
      ...data,
      id: id || 'temp',
      businessId: profile?.id || 'default',
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      status: initialInvoice?.status || 'draft',
      templateId: data.templateId || 'modern',
      accentColor: data.accentColor,
      currency: profile?.currency || 'USD',
      createdAt: initialInvoice?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    generateInvoicePDF(invoiceData, profile, selectedCustomer);
  };

  const selectedCustomer = customers.find(c => c.id === watchedCustomerId);

  const renderPreviewContent = () => (
    <div className="glass-card min-h-[800px] w-full max-w-4xl mx-auto p-8 md:p-12 bg-white text-black shadow-2xl relative overflow-hidden">
        {/* Decorative background for template differentiation */}
        {watch('templateId') === 'bold' && (
           <div 
             className="absolute top-0 right-0 w-1/2 h-full -mr-20 -mt-20 opacity-5 rotate-12"
             style={{ backgroundColor: watch('accentColor') }}
           />
        )}
        
        {/* PDF Content Mockup */}
        <div className={cn(
           "flex mb-12 md:mb-20 items-start",
           watch('templateId') === 'minimal' ? "flex-col gap-8" : "justify-between"
        )}>
          <div className="flex gap-6 items-center">
            {profile?.logoUrl && (
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-contain p-2" />
              </div>
            )}
            <div>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4" style={{ color: watch('templateId') === 'bold' ? watch('accentColor') : 'inherit' }}>
                 {profile?.name || 'BUSINESS NAME'}
              </h2>
              <div className="text-xs text-gray-500 leading-relaxed uppercase tracking-widest">
                 <p>{profile?.address || 'Your Street, City'}</p>
                 <p>{profile?.email || 'email@company.com'}</p>
                 <p>{profile?.taxId && `Tax ID: ${profile.taxId}`}</p>
              </div>
            </div>
          </div>
          <div className={watch('templateId') === 'minimal' ? "text-left" : "text-right"}>
            <p className={cn(
               "text-4xl md:text-5xl font-black uppercase absolute pointer-events-none select-none",
               watch('templateId') === 'bold' ? "-right-2 top-20 text-gray-200/50" : "-right-2 top-10 text-gray-100"
            )}>Invoice</p>
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Invoice Number</p>
              <p className="text-xl md:text-2xl font-black font-mono" style={{ color: watch('accentColor') }}>{watchedNumber}</p>
            </div>
          </div>
        </div>

        <div className={cn(
           "grid grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-20 border-y py-8 md:py-12",
           watch('templateId') === 'classic' ? "border-black" : "border-gray-100"
        )}>
           <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Billed to</p>
              <p className="text-base md:text-lg font-black uppercase">{selectedCustomer?.name || 'CLIENT NAME'}</p>
              <div className="text-xs text-gray-500 mt-2 leading-relaxed">
                <p>{selectedCustomer?.address || 'Client Address'}</p>
                <p>{selectedCustomer?.email || 'client@email.com'}</p>
              </div>
           </div>
           <div className="text-right space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Invoice Date</p>
                <p className="text-sm font-bold uppercase">{format(watch('date'), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Due Date</p>
                <p className="text-sm font-bold uppercase">{format(watch('dueDate'), 'MMM dd, yyyy')}</p>
              </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full mb-12 md:mb-20 min-w-[600px]">
             <thead>
                <tr className="border-b-2 border-black">
                   <th className="py-4 text-xs font-bold uppercase tracking-widest text-left">Description</th>
                   <th className="py-4 text-xs font-bold uppercase tracking-widest text-center">Qty</th>
                   <th className="py-4 text-xs font-bold uppercase tracking-widest text-right">Price</th>
                   <th className="py-4 text-xs font-bold uppercase tracking-widest text-right">Amount</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {watchedItems.map((item, idx) => {
                  const q = parseFloat(String(item?.quantity)) || 0;
                  const p = parseFloat(String(item?.price)) || 0;
                  const d = parseFloat(String(item?.discount)) || 0;
                  const t = parseFloat(String(item?.taxRate)) || 0;
                  
                  const sub = q * p;
                  const discAmt = sub * (d / 100);
                  const afterDisc = sub - discAmt;
                  const taxAmt = afterDisc * (t / 100);
                  const lineTotal = afterDisc + taxAmt;

                  return (
                    <tr key={idx}>
                       <td className="py-6">
                          <p className="font-bold text-gray-900">{item.description || 'Service Description'}</p>
                          {(t > 0 || d > 0) && (
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                               {t > 0 && `Tax: ${t}% `}
                               {d > 0 && `Disc: ${d}%`}
                            </p>
                          )}
                       </td>
                       <td className="py-6 text-center text-gray-600">{q}</td>
                       <td className="py-6 text-right font-mono text-gray-600">${p.toFixed(2)}</td>
                       <td className="py-6 text-right font-bold font-mono text-gray-900">${lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
             </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t-2 border-black pt-8 mb-12 md:mb-20">
           <div className="w-64 space-y-4">
              <div className="flex justify-between text-xs text-gray-500 uppercase font-bold tracking-widest">
                 <span>Subtotal</span>
                 <span>${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 uppercase font-bold tracking-widest">
                 <span>Tax Total</span>
                 <span>${totals.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-gray-100 text-2xl font-black uppercase">
                 <span>Total</span>
                 <span style={{ color: watch('accentColor') }}>${totals.total.toFixed(2)}</span>
              </div>
           </div>
        </div>

        <div className="mt-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-12 border-t border-gray-100 italic text-xs text-gray-400">
           <div>
              <p className="font-bold text-gray-600 mb-2 not-italic uppercase tracking-widest">Notes</p>
              <p className="whitespace-pre-wrap">{watch('notes') || 'No special notes.'}</p>
           </div>
           <div className="text-right">
              <p className="font-bold text-gray-600 mb-2 not-italic uppercase tracking-widest">Terms</p>
              <p className="whitespace-pre-wrap">{watch('terms') || 'Payment upon receipt.'}</p>
           </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-10 h-full relative">
      {/* Editor Header - Desktop Refinement */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:bg-white/[0.02] lg:p-6 lg:rounded-[32px] lg:border lg:border-white/5 lg:shadow-2xl">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate(-1)} 
            className="p-3.5 glass rounded-2xl hover:text-primary transition-all hover:scale-110 active:scale-95 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight tracking-tight uppercase tracking-[0.1em]">{id ? 'Edit Document' : 'Generate Invoice'}</h1>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-black uppercase tracking-widest">{id ? 'Revision' : 'Original'}</span>
              <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] flex items-center gap-2 translate-y-px">
                Ref No: <span className="text-white opacity-80 font-mono tracking-tight">{watchedNumber}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          <button 
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={cn(
              "btn-secondary py-3.5 px-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all",
              isPreview ? "bg-primary text-white border-primary" : "hover:bg-white/10"
            )}
          >
            <Eye size={18} />
            <span className="hidden sm:inline">{isPreview ? 'Edit Mode' : 'Live Preview'}</span>
            <span className="sm:hidden">{isPreview ? 'Edit' : 'View'}</span>
          </button>
          
          <div className="lg:h-10 lg:w-[1px] lg:bg-white/10 lg:mx-2 hidden lg:block" />

          <button 
            type="button" 
            onClick={handleDownload}
            className="btn-secondary py-3.5 px-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export Assets</span>
            <span className="sm:hidden">PDF</span>
          </button>
          
          <button 
            type="submit" 
            form="invoice-form"
            disabled={isFormSaving}
            className="btn-primary py-3.5 px-10 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 active:scale-95 transition-all lg:min-w-[200px] justify-center"
          >
            {isFormSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            {isFormSaving ? 'Processing...' : id ? 'Finalize Changes' : 'Issue Invoice'}
          </button>
          
          {!id && (
            <button 
              type="button" 
              disabled={isFormSaving}
              onClick={() => {
                (window as any)._saveAndNew = true;
                const form = document.querySelector('#invoice-form') as HTMLFormElement;
                if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }}
              className="btn-secondary py-3.5 px-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-widest border-primary/20 hover:border-primary/50 transition-all"
            >
              <Plus size={18} />
              Save & Duplicate
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative pb-20">
        {/* Stock Warning Dialog */}
        <AnimatePresence>
          {stockWarning && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass-card max-w-md w-full border-red-500/30 p-10 text-center shadow-[0_0_80px_rgba(239,68,68,0.3)] rounded-[40px] bg-surface relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-500 border border-red-500/20 rotate-12 transition-transform">
                  <Info size={40} />
                </div>
                <h3 className="text-2xl font-black mb-3 italic uppercase tracking-tighter">Inventory Block</h3>
                <p className="text-muted text-[13px] mb-8 leading-relaxed px-4">
                  Request exceeds vault capacity for <span className="text-white font-black">{stockWarning.name}</span>.
                  <br /><br />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-500 font-black text-[10px] uppercase tracking-widest border border-red-500/20">
                    Deficit: {stockWarning.needed} units
                  </span>
                </p>
                <button 
                  onClick={() => setStockWarning(null)}
                  className="w-full py-5 btn-primary bg-red-500 hover:bg-red-600 text-white rounded-[20px] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                >
                  Adjust Request
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Editor Area */}
        <div className={cn(
          "lg:col-span-7 space-y-10 transition-all duration-500",
          isPreview && "hidden lg:block lg:opacity-30 lg:pointer-events-none lg:blur-sm"
        )}>
          <form id="invoice-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8 pb-24">
            {/* Basic Info */}
            <div className="glass-card grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-10 !p-10 rounded-[48px]">
              <div className="space-y-3 lg:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/50 pl-2">Reference ID</label>
                <input {...register('number')} className="input-field w-full font-mono text-base tracking-tighter h-14 bg-white/[0.01]" placeholder="INV-001" />
                {errors.number && <p className="text-red-500 text-[9px] uppercase font-black mt-2 ml-2">{errors.number.message}</p>}
              </div>
              <div className="space-y-3 lg:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/50 pl-2">Classification</label>
                <div className="relative group">
                  <select {...register('category')} className="input-field w-full text-xs font-black uppercase tracking-widest bg-white/[0.01] h-14 px-5 appearance-none cursor-pointer">
                    <option value="">UNCATEGORIZED</option>
                    <option value="Business">BUSINESS</option>
                    <option value="Personal">PERSONAL</option>
                    <option value="Freelance">FREELANCE</option>
                    <option value="Subscription">SUBSRIPTION</option>
                    <option value="Other">OTHER</option>
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted rotate-90" size={16} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/50 pl-2">Issue Date</label>
                <input 
                  type="date" 
                  value={format(watch('date'), 'yyyy-MM-dd')}
                  onChange={(e) => setValue('date', new Date(e.target.value).getTime())}
                  className="input-field w-full h-14 bg-white/[0.01] font-bold text-sm" 
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/50 pl-2">Final Deadline</label>
                <input 
                  type="date" 
                  value={format(watch('dueDate'), 'yyyy-MM-dd')}
                  onChange={(e) => setValue('dueDate', new Date(e.target.value).getTime())}
                  className="input-field w-full h-14 bg-white/[0.01] font-bold text-sm border-primary/20 text-primary" 
                />
              </div>
            </div>

            {/* Customer Selection */}
            <div className="glass-card !p-10 rounded-[48px] relative group/client overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none group-hover/client:bg-primary/10 transition-all duration-700" />
               <div className="flex justify-between items-center mb-8 relative">
                 <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted/60">Recipient Identity</label>
                 </div>
                 <button 
                  type="button" 
                  onClick={() => setShowQuickCustomer(!showQuickCustomer)}
                  className="text-primary text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all bg-primary/5 px-5 py-2 rounded-2xl border border-primary/10"
                >
                  {showQuickCustomer ? 'Cancel Operation' : '+ Quick Register'}
                </button>
              </div>

              {showQuickCustomer ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-[40px] bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-4 shadow-inner relative">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1 opacity-60">Legal Alias</label>
                      <input 
                        placeholder="Full Name*" 
                        className="input-field py-4 h-14 text-sm font-bold bg-background/50" 
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1 opacity-60">Official Email</label>
                      <input 
                        placeholder="Email Address*" 
                        className="input-field py-4 h-14 text-sm font-bold bg-background/50" 
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1 opacity-60">Associated Entity</label>
                      <input 
                        placeholder="Company Name" 
                        className="input-field py-4 h-14 text-sm font-bold bg-background/50" 
                        value={newCustomer.companyName}
                        onChange={(e) => setNewCustomer({...newCustomer, companyName: e.target.value})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-primary tracking-widest ml-1 opacity-60">Physical Coordinates</label>
                      <div className="flex gap-3">
                        <input 
                          placeholder="Postal Address" 
                          className="input-field py-4 h-14 text-sm font-bold flex-1 bg-background/50" 
                          value={newCustomer.address}
                          onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                        />
                        <button 
                          type="button" 
                          onClick={handleQuickCustomer}
                          className="btn-primary px-8 text-[11px] font-black uppercase tracking-widest shadow-xl"
                        >
                          Verify
                        </button>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="relative group/sel">
                  <select {...register('customerId')} className="input-field w-full h-16 px-14 font-black uppercase text-xs tracking-widest appearance-none bg-white/[0.01] hover:bg-white/[0.03] transition-all border-white/5 hover:border-primary/30 rounded-[28px]">
                    <option value="">PROCEED TO IDENTIFY DESTINATION...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {c.companyName || 'INDEPENDENT'}</option>
                    ))}
                  </select>
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted/30 group-focus-within/sel:text-primary transition-colors" size={20} />
                  <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-muted/30 rotate-90" size={20} />
                  {errors.customerId && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-3 ml-2">{errors.customerId.message}</p>}
                </div>
              )}
              
              {selectedCustomer && !showQuickCustomer && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-8 rounded-[40px] bg-white/[0.03] border border-white/5 flex items-start justify-between group/info hover:bg-white/[0.05] transition-all hover:border-white/10 shadow-inner"
                >
                  <div className="flex gap-6">
                    <div className="w-20 h-20 rounded-[32px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover/info:rotate-6 transition-transform shadow-inner">
                      <Search size={32} />
                    </div>
                    <div className="space-y-1 pt-1">
                      <p className="text-xl font-black text-white/90 tracking-tight">{selectedCustomer.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">{selectedCustomer.email} • {selectedCustomer.companyName || 'RESERVED'}</p>
                      <p className="text-sm text-muted/60 mt-3 font-medium italic opacity-60 leading-relaxed max-w-sm">{selectedCustomer.address}</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setValue('customerId', '')} 
                    className="p-4 rounded-full bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 size={24} />
                  </button>
                </motion.div>
              )}
            </div>

            {/* Line Items */}
            <div className="glass-card md:space-y-6 !p-0 md:!p-8 overflow-hidden">
              <div className="flex justify-between items-center sticky top-0 z-30 px-6 py-4 md:px-0 md:py-0 glass md:bg-transparent md:backdrop-blur-none border-b border-white/5 md:border-none md:static">
                <div className="flex items-center gap-3">
                   <div className="flex flex-col">
                      <h3 className="font-bold text-base md:text-lg">Line Items</h3>
                      <span className="text-[9px] text-muted uppercase font-bold tracking-widest md:hidden">{fields.length} Items</span>
                   </div>
                   <div className="hidden md:flex px-2 py-0.5 bg-primary/10 rounded text-primary text-[10px] font-black uppercase tracking-tighter">
                      Vat Inclusive
                   </div>
                </div>
                
                <div className="flex flex-col items-end gap-0.5">
                  <div className="md:hidden">
                    <span className="text-xs font-black font-mono text-primary" style={{ color: watch('accentColor') }}>
                      Total: ${totals.total.toFixed(2)}
                    </span>
                  </div>
                  <span className="hidden md:block text-[10px] text-muted uppercase font-bold tracking-widest">{fields.length} Items</span>
                </div>
              </div>
 
              <div className="space-y-4 p-6 md:p-0">
                {fields.map((field, index) => (
                  <React.Fragment key={field.id}>
                    <div className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start p-5 md:p-6 rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all group animate-in fade-in slide-in-from-left-4 focus-within:z-50 relative focus-within:bg-white/[0.08] focus-within:border-primary/30 shadow-lg mb-4">
                      <div className="w-full md:col-span-5 space-y-2 relative">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Description</label>
                        <div className="relative group/search">
                           <input 
                             {...register(`items.${index}.description` as const)} 
                             placeholder="Enter service or product..."
                             className="input-field w-full text-sm pl-10 h-11"
                           />
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within/search:text-primary transition-colors" size={14} />
                           
                           {/* Quick Product Results Dropdown */}
                           <div className="absolute top-[calc(100%+8px)] left-0 w-full glass-card !p-2 z-[110] opacity-0 invisible group-focus-within/search:opacity-100 group-focus-within/search:visible transition-all max-h-72 overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-primary/30 scale-95 group-focus-within/search:scale-100 origin-top backdrop-blur-3xl bg-surface/95">
                              <div className="flex justify-between items-center px-3 py-1 border-b border-white/5 mb-1">
                                 <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Select or Add Product</p>
                                 <button 
                                   type="button"
                                   onMouseDown={() => {
                                     setNewProduct({ name: watchedItems[index]?.description || '', price: 0, taxRate: 0 });
                                     setShowQuickProduct({ index });
                                   }}
                                   className="text-[10px] font-black uppercase text-primary hover:underline"
                                 >
                                    + Create New
                                  </button>
                              </div>

                              {showQuickProduct?.index === index ? (
                                 <div className="p-3 space-y-3 bg-primary/5 rounded-xl border border-primary/20 m-1">
                                    <input 
                                      className="input-field w-full py-1.5 text-xs bg-surface/50" 
                                      placeholder="Product Name" 
                                      value={newProduct.name}
                                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                    />
                                    <div className="flex gap-2">
                                       <input 
                                        type="number"
                                        className="input-field w-full py-1.5 text-xs bg-surface/50" 
                                        placeholder="Price" 
                                        value={newProduct.price || ''}
                                        onChange={e => setNewProduct({...newProduct, price: +e.target.value})}
                                       />
                                       <button 
                                        type="button"
                                        onMouseDown={() => handleQuickProduct(index)}
                                        className="btn-primary px-4 py-1.5 text-[10px] font-bold uppercase transition-transform active:scale-95"
                                       >
                                          Save
                                       </button>
                                    </div>
                                 </div>
                              ) : products.length > 0 ? (
                                 products.filter(p => {
                                   const search = watchedItems[index]?.description?.toLowerCase() || '';
                                   return p.name.toLowerCase().includes(search);
                                 }).map(p => {
                                   const availability = getProductAvailability(p.id);
                                   return (
                                    <button 
                                      key={p.id}
                                      type="button"
                                      onMouseDown={() => {
                                        setValue(`items.${index}.description`, p.name);
                                        setValue(`items.${index}.productId`, p.id);
                                        setValue(`items.${index}.price`, p.price);
                                        setValue(`items.${index}.taxRate`, p.taxRate || 0);
                                        
                                        const avail = getProductAvailability(p.id);
                                        if (avail < 1) {
                                          setStockWarning({ name: p.name, needed: 1, available: avail });
                                        }
                                      }}
                                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-primary/10 text-sm flex justify-between items-center group/item transition-colors border border-transparent hover:border-primary/20 mb-1"
                                    >
                                      <div className="flex flex-col gap-0.5">
                                         <span className="font-bold">{p.name}</span>
                                         <div className="flex items-center gap-2">
                                            <div className={cn(
                                              "w-1.5 h-1.5 rounded-full",
                                              availability > 10 ? "bg-green-500" : availability > 0 ? "bg-orange-500" : "bg-red-500"
                                            )} />
                                            <span className="text-[9px] text-muted uppercase font-black tracking-widest opacity-60">
                                              Stock: {availability} {p.unit}
                                            </span>
                                         </div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black font-mono text-muted group-hover/item:text-primary transition-colors">${p.price}</span>
                                        {p.sku && <span className="text-[8px] text-muted/40 font-mono">{p.sku}</span>}
                                      </div>
                                    </button>
                                   );
                                 })
                              ) : (
                                <p className="px-3 py-4 text-center text-[10px] font-black uppercase text-muted tracking-widest leading-relaxed">No products found in matrix.<br/>Start typing or use Quick Register.</p>
                              )}
                           </div>
                        </div>
                      </div>
                      
                      <div className="w-full flex-1 flex flex-col md:grid md:grid-cols-7 gap-4">
                         <div className="md:col-span-1 space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Quantity</label>
                            <div className="relative group/qty">
                              <input 
                                type="number"
                                {...register(`items.${index}.quantity` as const, { 
                                  valueAsNumber: true,
                                  onChange: (e) => {
                                    const qty = parseInt(e.target.value);
                                    const prodId = watchedItems[index]?.productId;
                                    if (prodId) {
                                      const avail = getProductAvailability(prodId);
                                      if (qty > avail) {
                                        setStockWarning({ 
                                          name: watchedItems[index]?.description || 'Item', 
                                          needed: qty - avail, 
                                          available: avail 
                                        });
                                      }
                                    }
                                  }
                                })} 
                                className="input-field w-full text-sm text-center font-bold h-11"
                              />
                              {watchedItems[index]?.productId && (
                                <div className="absolute -bottom-5 left-1 flex items-center gap-1.5 opacity-60 group-focus-within/qty:opacity-100 transition-opacity">
                                   <div className={cn(
                                     "w-1 h-1 rounded-full",
                                     getProductAvailability(watchedItems[index].productId!) > 0 ? "bg-green-500 animate-pulse" : "bg-red-500"
                                   )} />
                                   <span className="text-[8px] font-black uppercase tracking-[0.1em] text-muted">
                                     Stock: {getProductAvailability(watchedItems[index].productId!)}
                                   </span>
                                </div>
                              )}
                            </div>
                         </div>
                         
                         <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Unit Price</label>
                            <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-xs font-bold">$</span>
                               <input 
                                 type="number"
                                 step="0.01"
                                 {...register(`items.${index}.price` as const, { valueAsNumber: true })} 
                                 className="input-field w-full text-sm pl-8 font-mono font-bold h-11"
                               />
                            </div>
                         </div>

                         <div className="md:col-span-1 space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Tax (%)</label>
                            <input 
                              type="number"
                              {...register(`items.${index}.taxRate` as const, { valueAsNumber: true })} 
                              className="input-field w-full text-xs text-center h-11"
                            />
                         </div>

                         <div className="md:col-span-1 space-y-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 text-green-500">Disc (%)</label>
                            <input 
                              type="number"
                              {...register(`items.${index}.discount` as const, { valueAsNumber: true })} 
                              className="input-field w-full text-xs text-center text-green-500 border-green-500/20 h-11 font-bold"
                            />
                         </div>

                         <div className="md:col-span-2 flex flex-col items-end justify-center pt-2">
                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1" style={{ color: watch('accentColor') }}>Line Total</label>
                            <div className="flex items-center gap-3">
                               <p className="text-sm font-black font-mono text-primary" style={{ color: watch('accentColor') }}>
                                 ${(() => {
                                   const qty = Number(watchedItems[index]?.quantity) || 0;
                                   const prc = Number(watchedItems[index]?.price) || 0;
                                   const disc = Number(watchedItems[index]?.discount) || 0;
                                   const tax = Number(watchedItems[index]?.taxRate) || 0;
                                   const sub = qty * prc;
                                   const afterDisc = sub - (sub * (disc / 100));
                                   return (afterDisc + (afterDisc * (tax / 100))).toFixed(2);
                                 })()}
                               </p>
                               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   type="button" 
                                   onClick={() => append({ ...watchedItems[index], id: Math.random().toString(36).substr(2, 9) })}
                                   className="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-all"
                                   title="Duplicate"
                                 >
                                   <Copy size={14} />
                                 </button>
                                 <button 
                                   type="button" 
                                   onClick={() => remove(index)}
                                   className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-all"
                                   title="Delete"
                                 >
                                   <Trash2 size={14} />
                                 </button>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  </React.Fragment>
))}
              </div>

              <button 
                type="button"
                onClick={() => append({ id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, price: 0, taxRate: 0, discount: 0 })}
                className="w-full py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all text-sm font-bold uppercase tracking-widest"
                style={{ 
                  borderColor: `${watch('accentColor')}20`,
                  color: watch('accentColor'),
                  '--tw-hover-border': watch('accentColor')
                } as any}
              >
                <Plus size={18} />
                Add Line Item
              </button>
            </div>

            {/* Notes & Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-xs font-bold uppercase tracking-widest text-muted">Additional Notes</label>
                   <div className="relative">
                     <button 
                       type="button" 
                       onClick={() => setShowNotePresets(!showNotePresets)}
                       className="p-1 px-2 rounded-lg bg-white/5 text-muted hover:text-primary transition-all flex items-center gap-2 border border-white/5"
                     >
                        <BookOpen size={12} />
                        <span className="text-[10px] font-bold uppercase">Presets</span>
                     </button>
                     {showNotePresets && (
                       <>
                         <div className="fixed inset-0 z-40" onClick={() => setShowNotePresets(false)} />
                         <div className="absolute bottom-full right-0 mb-2 w-64 glass shadow-2xl rounded-xl border border-white/10 z-50 p-2 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-[9px] font-black text-muted uppercase tracking-tighter p-2 border-b border-white/5 mb-1">Quick Apply Notes</p>
                            {[...(profile?.notePresets || []), ...DEFAULT_NOTE_PRESETS].map((p, i) => (
                               <button 
                                 key={i} 
                                 type="button"
                                 onClick={() => {
                                   setValue('notes', p, { shouldDirty: true });
                                   setShowNotePresets(false);
                                 }}
                                 className="w-full text-left p-2 hover:bg-primary/10 rounded-lg text-xs truncate transition-all text-white"
                               >
                                 {p}
                               </button>
                            ))}
                         </div>
                       </>
                     )}
                   </div>
                </div>
                <textarea 
                  {...register('notes')}
                  placeholder="e.g. Thank you for your business!"
                  className="input-field w-full h-32 resize-none text-sm"
                />
              </div>
              <div className="glass-card space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-xs font-bold uppercase tracking-widest text-muted">Terms & Conditions</label>
                   <div className="relative">
                     <button 
                       type="button" 
                       onClick={() => setShowTermPresets(!showTermPresets)}
                       className="p-1 px-2 rounded-lg bg-white/5 text-muted hover:text-primary transition-all flex items-center gap-2 border border-white/5"
                     >
                        <BookOpen size={12} />
                        <span className="text-[10px] font-bold uppercase">Presets</span>
                     </button>
                     {showTermPresets && (
                       <>
                         <div className="fixed inset-0 z-40" onClick={() => setShowTermPresets(false)} />
                         <div className="absolute bottom-full right-0 mb-2 w-64 glass shadow-2xl rounded-xl border border-white/10 z-50 p-2 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-[9px] font-black text-muted uppercase tracking-tighter p-2 border-b border-white/5 mb-1">Quick Apply Terms</p>
                            {[...(profile?.termPresets || []), ...DEFAULT_TERM_PRESETS].map((p, i) => (
                               <button 
                                 key={i} 
                                 type="button"
                                 onClick={() => {
                                   setValue('terms', p, { shouldDirty: true });
                                   setShowTermPresets(false);
                                 }}
                                 className="w-full text-left p-2 hover:bg-primary/10 rounded-lg text-xs truncate transition-all text-white"
                               >
                                 {p}
                               </button>
                            ))}
                         </div>
                       </>
                     )}
                   </div>
                </div>
                <textarea 
                  {...register('terms')}
                  placeholder="e.g. Payment due in 7 days."
                  className="input-field w-full h-32 resize-none text-sm"
                />
              </div>
            </div>

            {/* Live Preview Section at the bottom */}
            <div className="space-y-6 pt-12">
               <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Eye size={16} />
                     </div>
                     <div>
                        <h3 className="font-bold text-lg">Live Invoice Preview</h3>
                        <p className="text-[10px] text-muted uppercase font-bold tracking-widest">Scroll down for real-time impact</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <p className="text-xs font-bold text-muted uppercase tracking-widest hidden sm:block">Real-time Rendering</p>
                  </div>
               </div>
               <div className="scale-90 md:scale-100 origin-top">
                  {renderPreviewContent()}
               </div>
            </div>
          </form>
        </div>

        {/* Sidebar / Permanent Preview (Desktop) */}
        <div className={cn(
          "lg:col-span-5 lg:sticky lg:top-8 transition-all duration-700",
          !isPreview && "hidden lg:block lg:opacity-95 lg:scale-[0.98] lg:hover:opacity-100 lg:hover:scale-100"
        )}>
          {/* Mobile Preview Overlay Header */}
          <div className="flex items-center justify-between mb-8 lg:hidden bg-surface p-6 rounded-[32px] border border-white/10 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Eye size={20} /></div>
              <h3 className="text-xl font-black uppercase tracking-tight">Full-Screen Vision</h3>
            </div>
            <button onClick={() => setIsPreview(false)} className="p-4 bg-white/5 rounded-2xl text-muted/60 hover:text-white transition-all"><X size={24} /></button>
          </div>
          
          <div className="space-y-8 lg:space-y-10">
             {/* Visual Strategy Panel */}
             <div className="glass-card !p-6 lg:!p-8 rounded-[40px] border-white/10 shadow-2xl relative overflow-hidden group/visual">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/visual:opacity-100 transition-opacity duration-700" />
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative">
                   <div className="flex flex-col gap-2">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/60 mb-2">Design Infrastructure</span>
                     <div className="flex gap-3">
                       {['modern', 'bold', 'minimal', 'classic'].map(tid => (
                         <button 
                           key={tid} 
                           type="button" 
                           onClick={() => setValue('templateId', tid)}
                           className={cn(
                             "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all hover:scale-105 active:scale-95",
                             watch('templateId') === tid ? "bg-primary border-primary text-white shadow-xl shadow-primary/30" : "bg-white/5 border-white/5 text-muted/40 hover:text-white"
                           )}
                         >
                           {tid.slice(0,3)}
                         </button>
                       ))}
                     </div>
                   </div>
                   
                   <div className="w-[1px] h-12 bg-white/10 hidden lg:block" />

                   <div className="flex flex-col gap-2">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted/60 mb-2">Primary Pigment</span>
                     <div className="flex gap-3 items-center">
                        {['#FF4444', '#3B82F6', '#10B981', '#F59E0B'].map(c => (
                          <button 
                            key={c} 
                            type="button" 
                            onClick={() => setValue('accentColor', c)}
                            className={cn(
                              "w-8 h-8 rounded-full border-2 transition-all p-1 hover:scale-125",
                              watch('accentColor') === c ? "border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" : "border-transparent opacity-40 hover:opacity-100"
                            )}
                          >
                            <div className="w-full h-full rounded-full shadow-inner" style={{ backgroundColor: c }} />
                          </button>
                        ))}
                     </div>
                   </div>
                </div>
             </div>

             <div className="lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto lg:rounded-[64px] shadow-[0_60px_150px_rgba(0,0,0,0.9)] custom-scrollbar lg:border lg:border-white/5 bg-white scale-[1.001]">
                {renderPreviewContent()}
             </div>

             <div className="glass-card !bg-primary/5 border-primary/20 !p-8 rounded-[40px] hidden lg:flex items-center gap-6 shadow-xl relative overflow-hidden group/save">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] opacity-0 group-hover/save:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover/save:scale-110 transition-transform">
                   <Info size={28} />
                </div>
                <div className="flex-1 space-y-1">
                   <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">Autonomous Redundancy</p>
                   <p className="text-xs text-muted/60 leading-relaxed italic opacity-80">
                      State integrity is maintained locally. You may exit the operation without data loss.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

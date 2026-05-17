import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
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
  Copy
} from 'lucide-react';
import { useStore } from '../store/useStore.ts';
import { Invoice, InvoiceItem } from '../types.ts';
import { format } from 'date-fns';
import { generateInvoicePDF } from '../services/pdfService.ts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const itemSchema = z.object({
  id: z.string(),
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
      createdAt: Date.now() 
    });
    setValue(`items.${index}.description`, newProduct.name);
    setValue(`items.${index}.price`, newProduct.price);
    setValue(`items.${index}.taxRate`, newProduct.taxRate);
    setShowQuickProduct(null);
    setNewProduct({ name: '', price: 0, taxRate: 0 });
  };

  const initialInvoice = useMemo(() => {
    if (id) return invoices.find(inv => inv.id === id);
    return null;
  }, [id, invoices]);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: initialInvoice ? {
      number: initialInvoice.number,
      date: initialInvoice.date,
      dueDate: initialInvoice.dueDate,
      customerId: initialInvoice.customerId,
      items: initialInvoice.items,
      notes: initialInvoice.notes,
      terms: initialInvoice.terms,
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
      templateId: 'modern',
      accentColor: '#3B82F6',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch('items');
  const watchedNumber = watch('number');
  const watchedCustomerId = watch('customerId');

  const totals = useMemo(() => {
    return watchedItems.reduce((acc, item) => {
      const itemSubtotal = item.quantity * item.price;
      const discountAmount = itemSubtotal * (item.discount / 100);
      const afterDiscount = itemSubtotal - discountAmount;
      const taxAmount = afterDiscount * (item.taxRate / 100);
      
      acc.subtotal += itemSubtotal;
      acc.discountTotal += discountAmount;
      acc.taxTotal += taxAmount;
      acc.total += afterDiscount + taxAmount;
      return acc;
    }, { subtotal: 0, taxTotal: 0, discountTotal: 0, total: 0 });
  }, [watchedItems]);

  const onSubmit = async (data: InvoiceFormData) => {
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
      window.location.reload(); // Hard reset for freshness
    } else {
      navigate('/invoices');
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

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 glass rounded-xl hover:text-primary transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{id ? 'Edit Invoice' : 'Create New Invoice'}</h1>
            <p className="text-xs text-muted flex items-center gap-1">
              Draft <ChevronRight size={12} /> {watchedNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          <button 
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="btn-secondary py-2.5 px-4 flex items-center gap-2 text-xs shrink-0"
          >
            {isPreview ? <ArrowLeft size={16} /> : <Eye size={16} />}
            <span className="hidden sm:inline">{isPreview ? 'Back to Edit' : 'Live Preview'}</span>
            <span className="sm:hidden">{isPreview ? 'Edit' : 'Preview'}</span>
          </button>
          <button 
            type="button"
            onClick={handleDownload}
            className="btn-secondary py-2.5 px-4 flex items-center gap-2 text-xs shrink-0"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button 
            type="submit" 
            form="invoice-form"
            className="btn-primary py-2.5 px-6 flex items-center gap-2 text-xs shadow-lg shadow-primary/20 shrink-0"
          >
            <Save size={16} />
            Save <span className="hidden sm:inline">Invoice</span>
          </button>
          {!id && (
            <button 
              type="submit" 
              form="invoice-form"
              onClick={() => {
                // We'll handle this in the submit handler by checking a flag
                (window as any)._saveAndNew = true;
              }}
              className="btn-secondary py-2.5 px-6 flex items-center gap-2 text-xs shrink-0"
            >
              Save & New
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Editor Area */}
        <div className={cn(
          "lg:col-span-8 space-y-8 transition-all duration-500",
          isPreview && "opacity-0 invisible absolute"
        )}>
          <form id="invoice-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-24">
            {/* Basic Info */}
            <div className="glass-card grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Invoice Number</label>
                <input {...register('number')} className="input-field w-full font-mono text-sm" placeholder="INV-001" />
                {errors.number && <p className="text-red-500 text-[10px] uppercase font-bold">{errors.number.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Invoice Date</label>
                <input 
                  type="date" 
                  value={format(watch('date'), 'yyyy-MM-dd')}
                  onChange={(e) => setValue('date', new Date(e.target.value).getTime())}
                  className="input-field w-full text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Due Date</label>
                <input 
                  type="date" 
                  value={format(watch('dueDate'), 'yyyy-MM-dd')}
                  onChange={(e) => setValue('dueDate', new Date(e.target.value).getTime())}
                  className="input-field w-full text-sm" 
                />
              </div>
            </div>

            {/* Customer Selection */}
            <div className="glass-card">
              <div className="flex justify-between items-center mb-6">
                <label className="text-xs font-bold uppercase tracking-widest text-muted">Bill To / Customer</label>
                <button 
                  type="button" 
                  onClick={() => setShowQuickCustomer(!showQuickCustomer)}
                  className="text-primary text-[10px] font-bold uppercase hover:underline"
                >
                  {showQuickCustomer ? 'Cancel' : 'Quick Add Customer'}
                </button>
              </div>

              {showQuickCustomer ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-6 rounded-2xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-4">
                   <input 
                    placeholder="Full Name*" 
                    className="input-field py-2 text-xs" 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                   />
                   <input 
                    placeholder="Email Address*" 
                    className="input-field py-2 text-xs" 
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                   />
                   <input 
                    placeholder="Company Name" 
                    className="input-field py-2 text-xs" 
                    value={newCustomer.companyName}
                    onChange={(e) => setNewCustomer({...newCustomer, companyName: e.target.value})}
                   />
                   <div className="flex gap-2">
                      <input 
                        placeholder="Address" 
                        className="input-field py-2 text-xs flex-1" 
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                      />
                      <button 
                        type="button" 
                        onClick={handleQuickCustomer}
                        className="btn-primary py-2 px-6 text-[10px] font-bold uppercase shadow-xl"
                      >
                        Add
                      </button>
                   </div>
                </div>
              ) : (
                <>
                  <select {...register('customerId')} className="input-field w-full text-sm mb-4 bg-background px-10 appearance-none">
                    <option value="">Select a customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.email || c.companyName})</option>
                    ))}
                  </select>
                  {errors.customerId && <p className="text-red-500 text-[10px] uppercase font-bold">{errors.customerId.message}</p>}
                </>
              )}
              
              {selectedCustomer && !showQuickCustomer && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-muted leading-relaxed flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold mb-1">{selectedCustomer.name}</p>
                    <p>{selectedCustomer.email} • {selectedCustomer.companyName}</p>
                    <p>{selectedCustomer.address}</p>
                  </div>
                  <button type="button" onClick={() => setValue('customerId', '')} className="text-[10px] font-bold uppercase text-red-500 hover:underline">Change</button>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="glass-card space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <h3 className="font-bold text-lg">Line Items</h3>
                   <div className="px-2 py-0.5 bg-primary/10 rounded text-primary text-[10px] font-black uppercase tracking-tighter">
                      Vat Inclusive
                   </div>
                </div>
                <span className="text-[10px] text-muted uppercase font-bold tracking-widest">{fields.length} Items</span>
              </div>
 
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-4 items-start p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group animate-in fade-in slide-in-from-left-4 focus-within:z-[30] relative focus-within:bg-white/[0.05] focus-within:border-primary/20">
                    <div className="col-span-12 md:col-span-5 space-y-2 relative group-focus-within:z-[50]">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Description</label>
                      <div className="relative group/search">
                         <input 
                           {...register(`items.${index}.description` as const)} 
                           placeholder="Service or Product name..."
                           className="input-field w-full text-sm pl-10"
                         />
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within/search:text-primary transition-colors" size={16} />
                         
                         {/* Quick Product Results (simplistic dropdown) */}
                         <div className="absolute top-full left-0 w-full mt-2 glass-card !p-2 z-[100] opacity-0 invisible group-focus-within/search:opacity-100 group-focus-within/search:visible transition-all max-h-64 overflow-y-auto shadow-2xl border-primary/20 scale-95 group-focus-within/search:scale-100 origin-top">
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
                                    className="input-field w-full py-1.5 text-xs" 
                                    placeholder="Product Name" 
                                    value={newProduct.name}
                                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                  />
                                  <div className="flex gap-2">
                                     <input 
                                      type="number"
                                      className="input-field w-full py-1.5 text-xs" 
                                      placeholder="Price" 
                                      value={newProduct.price || ''}
                                      onChange={e => setNewProduct({...newProduct, price: +e.target.value})}
                                     />
                                     <button 
                                      type="button"
                                      onMouseDown={() => handleQuickProduct(index)}
                                      className="btn-primary px-4 py-1.5 text-[10px] font-bold uppercase"
                                     >
                                        Save
                                     </button>
                                  </div>
                               </div>
                            ) : products.length > 0 ? (
                               products.filter(p => !watchedItems[index]?.description || p.name.toLowerCase().includes(watchedItems[index].description.toLowerCase())).map(p => (
                                <button 
                                  key={p.id}
                                  type="button"
                                  onMouseDown={() => {
                                    setValue(`items.${index}.description`, p.name);
                                    setValue(`items.${index}.price`, p.price);
                                    setValue(`items.${index}.taxRate`, p.taxRate || 0);
                                  }}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary/10 text-sm flex justify-between items-center group/item"
                                >
                                  <span>{p.name}</span>
                                  <span className="text-[10px] font-black font-mono text-muted group-hover/item:text-primary">${p.price}</span>
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-2 text-xs text-muted italic">No products found.</p>
                            )}
                         </div>
                      </div>
                    </div>
                    <div className="col-span-4 md:col-span-2 space-y-2">
                       <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Quantity</label>
                       <input 
                         type="number"
                         {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} 
                         className="input-field w-full text-sm text-center font-bold"
                       />
                    </div>
                    <div className="col-span-4 md:col-span-3 space-y-2">
                       <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Unit Price</label>
                       <div className="flex gap-2">
                          <div className="relative flex-1">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-xs font-bold">$</span>
                             <input 
                               type="number"
                               step="0.01"
                               {...register(`items.${index}.price` as const, { valueAsNumber: true })} 
                               className="input-field w-full text-sm pl-8 font-mono font-bold"
                             />
                          </div>
                          <div className="flex gap-1">
                             <div className="w-16 relative">
                                <input 
                                  type="number"
                                  placeholder="Tax %"
                                  {...register(`items.${index}.taxRate` as const, { valueAsNumber: true })} 
                                  className="input-field w-full text-[10px] px-1 text-center"
                                  title="Tax Rate %"
                                />
                                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-muted">%</span>
                             </div>
                             <div className="w-16 relative">
                                <input 
                                  type="number"
                                  placeholder="Disc %"
                                  {...register(`items.${index}.discount` as const, { valueAsNumber: true })} 
                                  className="input-field w-full text-[10px] px-1 text-center text-green-500 border-green-500/20"
                                  title="Discount %"
                                />
                                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-green-500/50">%</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="col-span-4 md:col-span-2 flex flex-col items-end justify-center h-full">
                       <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Total</label>
                       <div className="flex items-center gap-1">
                          <div className="text-right mr-2">
                             <p className="text-sm font-black font-mono text-primary">
                               ${(+(watchedItems[index]?.quantity || 0) * +(watchedItems[index]?.price || 0)).toFixed(2)}
                             </p>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => append({ ...watchedItems[index], id: Math.random().toString(36).substr(2, 9) })}
                            className="p-2 text-muted hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                            title="Duplicate Item"
                          >
                            <Copy size={16} />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => remove(index)}
                            className="p-2 text-muted hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                            title="Remove Item"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                type="button"
                onClick={() => append({ id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, price: 0, taxRate: 0, discount: 0 })}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-muted hover:border-primary/50 transition-all text-sm font-bold uppercase tracking-widest"
                style={{ '--tw-hover-text': watch('accentColor') } as any}
              >
                <Plus size={18} style={{ color: watch('accentColor') }} />
                Add Line Item
              </button>
            </div>

            {/* Notes & Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card">
                <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-4">Notes</label>
                <textarea 
                  {...register('notes')}
                  className="input-field w-full h-32 resize-none text-sm" 
                  placeholder="Thank you for your business!"
                />
              </div>
              <div className="glass-card">
                <label className="text-xs font-bold uppercase tracking-widest text-muted block mb-4">Terms & Conditions</label>
                <textarea 
                  {...register('terms')}
                  className="input-field w-full h-32 resize-none text-sm" 
                  placeholder="Payment is due within 7 days."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Sidebar Panel (Tools or Preview) */}
        <div className={cn(
          "lg:col-span-4 sticky top-8 transition-all duration-500",
          isPreview ? "lg:col-span-12 w-full" : "lg:col-span-4"
        )}>
           {isPreview ? (
             <div className="glass-card min-h-[800px] w-full max-w-4xl mx-auto p-12 bg-white text-black shadow-2xl relative overflow-hidden">
                {/* Decorative background for template differentiation */}
                {watch('templateId') === 'bold' && (
                   <div 
                     className="absolute top-0 right-0 w-1/2 h-full -mr-20 -mt-20 opacity-5 rotate-12"
                     style={{ backgroundColor: watch('accentColor') }}
                   />
                )}
                
                {/* PDF Content Mockup */}
                <div className={cn(
                   "flex mb-20",
                   watch('templateId') === 'minimal' ? "flex-col gap-8" : "justify-between items-start"
                )}>
                  <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4" style={{ color: watch('templateId') === 'bold' ? watch('accentColor') : 'inherit' }}>
                       {profile?.name || 'BUSINESS NAME'}
                    </h2>
                    <div className="text-xs text-gray-500 leading-relaxed uppercase tracking-widest">
                       <p>{profile?.address || 'Your Street, City'}</p>
                       <p>{profile?.email || 'email@company.com'}</p>
                       <p>{profile?.taxId && `Tax ID: ${profile.taxId}`}</p>
                    </div>
                  </div>
                  <div className={watch('templateId') === 'minimal' ? "text-left" : "text-right"}>
                    <p className={cn(
                       "text-5xl font-black uppercase absolute pointer-events-none select-none",
                       watch('templateId') === 'bold' ? "-right-2 top-20 text-gray-200/50" : "-right-2 top-10 text-gray-100"
                    )}>Invoice</p>
                    <div className="relative z-10">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Invoice Number</p>
                      <p className="text-2xl font-black font-mono" style={{ color: watch('accentColor') }}>{watchedNumber}</p>
                    </div>
                  </div>
                </div>

                <div className={cn(
                   "grid grid-cols-2 gap-12 mb-20 border-y py-12",
                   watch('templateId') === 'classic' ? "border-black" : "border-gray-100"
                )}>
                   <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Billed to</p>
                      <p className="text-lg font-black uppercase">{selectedCustomer?.name || 'CLIENT NAME'}</p>
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

                <table className="w-full mb-20">
                   <thead>
                      <tr className="border-b-2 border-black">
                         <th className="py-4 text-xs font-bold uppercase tracking-widest text-left">Description</th>
                         <th className="py-4 text-xs font-bold uppercase tracking-widest text-center">Qty</th>
                         <th className="py-4 text-xs font-bold uppercase tracking-widest text-right">Price</th>
                         <th className="py-4 text-xs font-bold uppercase tracking-widest text-right">Amount</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                      {watchedItems.map((item, idx) => (
                        <tr key={idx}>
                           <td className="py-6 font-bold">{item.description || 'Service Description'}</td>
                           <td className="py-6 text-center">{item.quantity}</td>
                           <td className="py-6 text-right font-mono">${(item.price || 0).toFixed(2)}</td>
                           <td className="py-6 text-right font-bold font-mono">${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>

                <div className="flex justify-end border-t-2 border-black pt-8 mb-20">
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

                <div className="mt-auto grid grid-cols-2 gap-12 pt-12 border-t border-gray-100 italic text-xs text-gray-400">
                   <div>
                      <p className="font-bold text-gray-600 mb-2 not-italic uppercase tracking-widest">Notes</p>
                      <p>{watch('notes') || 'No special notes.'}</p>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-gray-600 mb-2 not-italic uppercase tracking-widest">Terms</p>
                      <p>{watch('terms') || 'Payment upon receipt.'}</p>
                   </div>
                </div>
             </div>
           ) : (
             <div className="space-y-6">
                <div className="glass-card animate-in fade-in slide-in-from-right-4">
                  <h3 className="font-bold text-lg mb-6">Summary</h3>
                  <div className="space-y-4 mb-8">
                     <div className="flex justify-between text-sm">
                        <span className="text-muted">Subtotal</span>
                        <span className="font-mono font-bold">${totals.subtotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-muted">Discounts</span>
                        <span className="font-mono font-bold text-green-500">-${totals.discountTotal.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-muted">Taxes</span>
                        <span className="font-mono font-bold">${totals.taxTotal.toFixed(2)}</span>
                     </div>
                  </div>
                  <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                     <div className="text-xs text-muted uppercase font-bold tracking-widest">Total Amount</div>
                     <div 
                        className="text-3xl font-black font-mono tracking-tighter"
                        style={{ color: watch('accentColor') }}
                     >
                       ${totals.total.toFixed(2)}
                     </div>
                  </div>
                </div>

                <div className="glass-card animate-in fade-in slide-in-from-right-8">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <LayoutTemplate size={20} className="text-primary" />
                    Customization
                  </h3>
                  <div className="space-y-6">
                     <div>
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-3">Accent Color</label>
                        <div className="flex flex-wrap gap-2">
                           {['#FF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map(color => (
                              <button 
                                key={color}
                                type="button"
                                onClick={() => setValue('accentColor', color)}
                                className={cn(
                                  "w-8 h-8 rounded-full border-2 transition-all",
                                  watch('accentColor') === color ? "border-white scale-110 shadow-lg" : "border-transparent"
                                )}
                                style={{ backgroundColor: color }}
                              />
                           ))}
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] font-bold text-muted uppercase tracking-widest block mb-3">Template</label>
                        <div className="grid grid-cols-2 gap-2">
                           {['modern', 'minimal', 'classic', 'bold'].map(template => (
                              <button 
                                key={template}
                                type="button"
                                onClick={() => setValue('templateId', template)}
                                className={cn(
                                  "px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                                  watch('templateId') === template 
                                    ? "bg-primary/10 border-primary text-primary" 
                                    : "bg-white/5 border-white/10 text-muted hover:bg-white/10"
                                )}
                              >
                                 {template}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
                </div>

                <div className="glass-card !bg-primary/5 border-primary/20">
                   <div className="flex items-start gap-3">
                      <Info size={18} className="text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-muted leading-relaxed italic">
                        All changes are auto-saved to your local machine. You can safely reload this page.
                      </p>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

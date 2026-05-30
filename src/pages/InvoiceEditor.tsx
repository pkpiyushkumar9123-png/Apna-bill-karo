import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
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
  hsnSac: z.string().optional(),
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
  fontFamily: z.string().optional(),
  margins: z.enum(['compact', 'comfortable', 'spacious']).optional(),
  showTaxId: z.boolean().optional(),
  showSignature: z.boolean().optional(),
  showBankDetails: z.boolean().optional(),
  currency: z.string().optional(),
  exchangeRate: z.number().optional(),
  taxPreset: z.enum(['generic', 'india_gst', 'eu_vat']).optional(),
  gstType: z.enum(['cgst_sgst', 'igst']).optional(),
  isReverseCharge: z.boolean().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export const InvoiceEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    invoices, 
    customers, 
    products, 
    profile, 
    settings, 
    exchangeRates, 
    lastRatesUpdate, 
    fetchExchangeRates, 
    addInvoice, 
    updateInvoice, 
    addCustomer, 
    addProduct 
  } = useStore();
  const [isPreview, setIsPreview] = useState(false);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', companyName: '', address: '' });
  const [showQuickProduct, setShowQuickProduct] = useState<{ index: number } | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, taxRate: 0 });
  const [showNotePresets, setShowNotePresets] = useState(false);
  const [showTermPresets, setShowTermPresets] = useState(false);
  const [stockWarning, setStockWarning] = useState<{ name: string; needed: number; available: number } | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [qrType, setQrType] = useState<'upi' | 'bank'>('upi');
  const [zoomQr, setZoomQr] = useState(false);

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
      templateId: initialInvoice.templateId || settings.invoiceTemplateId || 'modern',
      accentColor: (initialInvoice as any).accentColor || settings.invoiceAccentColor || '#3B82F6',
      fontFamily: initialInvoice.fontFamily || settings.invoiceFontFamily || 'Inter',
      margins: initialInvoice.margins || settings.invoiceMargins || 'comfortable',
      showTaxId: initialInvoice.showTaxId !== undefined ? initialInvoice.showTaxId : (settings.invoiceShowTaxId !== false),
      showSignature: initialInvoice.showSignature !== undefined ? initialInvoice.showSignature : (settings.invoiceShowSignature !== false),
      showBankDetails: initialInvoice.showBankDetails !== undefined ? initialInvoice.showBankDetails : (settings.invoiceShowBankDetails !== false),
      currency: initialInvoice.currency || settings.currencyDefault || profile?.currency || 'INR',
      exchangeRate: initialInvoice.exchangeRate || 1.0,
      taxPreset: initialInvoice.taxPreset || 'generic',
      gstType: initialInvoice.gstType || 'cgst_sgst',
      isReverseCharge: initialInvoice.isReverseCharge || false,
    } : {
      number: `INV-${Date.now().toString().slice(-6)}`,
      date: Date.now(),
      dueDate: Date.now() + 86400000 * 7,
      customerId: '',
      items: [{ id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, price: 0, taxRate: 0, discount: 0, hsnSac: '' }],
      notes: '',
      terms: '',
      category: '',
      templateId: settings.invoiceTemplateId || 'modern',
      accentColor: settings.invoiceAccentColor || '#3B82F6',
      fontFamily: settings.invoiceFontFamily || 'Inter',
      margins: settings.invoiceMargins || 'comfortable',
      showTaxId: settings.invoiceShowTaxId !== false,
      showSignature: settings.invoiceShowSignature !== false,
      showBankDetails: settings.invoiceShowBankDetails !== false,
      currency: settings.currencyDefault || profile?.currency || 'INR',
      exchangeRate: 1.0,
      taxPreset: 'generic',
      gstType: 'cgst_sgst',
      isReverseCharge: false,
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
        templateId: initialInvoice.templateId || settings.invoiceTemplateId || 'modern',
        accentColor: (initialInvoice as any).accentColor || settings.invoiceAccentColor || '#3B82F6',
        fontFamily: initialInvoice.fontFamily || settings.invoiceFontFamily || 'Inter',
        margins: initialInvoice.margins || settings.invoiceMargins || 'comfortable',
        showTaxId: initialInvoice.showTaxId !== undefined ? initialInvoice.showTaxId : (settings.invoiceShowTaxId !== false),
        showSignature: initialInvoice.showSignature !== undefined ? initialInvoice.showSignature : (settings.invoiceShowSignature !== false),
        showBankDetails: initialInvoice.showBankDetails !== undefined ? initialInvoice.showBankDetails : (settings.invoiceShowBankDetails !== false),
        currency: initialInvoice.currency || settings.currencyDefault || profile?.currency || 'INR',
        exchangeRate: initialInvoice.exchangeRate || 1.0,
        taxPreset: initialInvoice.taxPreset || 'generic',
        gstType: initialInvoice.gstType || 'cgst_sgst',
        isReverseCharge: initialInvoice.isReverseCharge || false,
      });
    } else if (!id) {
      reset({
        number: `INV-${Date.now().toString().slice(-6)}`,
        date: Date.now(),
        dueDate: Date.now() + 86400000 * 7,
        customerId: '',
        items: [{ id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, price: 0, taxRate: 0, discount: 0, hsnSac: '' }],
        notes: '',
        terms: '',
        category: '',
        templateId: settings.invoiceTemplateId || 'modern',
        accentColor: settings.invoiceAccentColor || '#3B82F6',
        fontFamily: settings.invoiceFontFamily || 'Inter',
        margins: settings.invoiceMargins || 'comfortable',
        showTaxId: settings.invoiceShowTaxId !== false,
        showSignature: settings.invoiceShowSignature !== false,
        showBankDetails: settings.invoiceShowBankDetails !== false,
        currency: settings.currencyDefault || profile?.currency || 'INR',
        exchangeRate: 1.0,
        taxPreset: 'generic',
        gstType: 'cgst_sgst',
        isReverseCharge: false,
      });
    }
  }, [id, initialInvoice, reset, settings]);

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

  const watchedCurrency = watch('currency') || 'INR';
  const symbolsLookup: Record<string, string> = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'AED': 'AED ',
    'SGD': 'S$',
    'JPY': '¥',
  };
  const activeCurrencySymbol = symbolsLookup[watchedCurrency] || '$';

  const totals = useMemo(() => {
    if (!watchedItems || !Array.isArray(watchedItems)) {
      return { subtotal: 0, taxTotal: 0, discountTotal: 0, total: 0 };
    }

    const currentTaxPreset = watch('taxPreset') || 'generic';
    const currentIsReverseCharge = !!watch('isReverseCharge');

    const calculated = watchedItems.reduce((acc, item) => {
      const qty = parseFloat(String(item?.quantity)) || 0;
      const price = parseFloat(String(item?.price)) || 0;
      const taxRate = parseFloat(String(item?.taxRate)) || 0;
      const discount = parseFloat(String(item?.discount)) || 0;

      const itemSubtotal = qty * price;
      const discountAmount = itemSubtotal * (discount / 100);
      const afterDiscount = Math.max(0, itemSubtotal - discountAmount);
      
      // If EU VAT with reverse charge option selected, the taxCollected is zero because the buyer handles it
      const actualTaxRate = (currentTaxPreset === 'eu_vat' && currentIsReverseCharge) ? 0 : taxRate;
      const taxAmount = Math.max(0, afterDiscount * (actualTaxRate / 100));
      
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
  }, [watchedItems, watch('taxPreset'), watch('isReverseCharge')]);

  // Dynamically generate the QR Code when invoice details or payment type changes
  useEffect(() => {
    let active = true;
    const generateQR = async () => {
      try {
        let qrText = '';
        if (qrType === 'upi' && profile?.upiId) {
          const upiId = profile.upiId;
          const payeeName = profile.name || 'Merchant';
          const amt = totals.total.toFixed(2);
          const note = `Invoice ${watchedNumber || 'Payment'}`;
          const currency = profile.currency || 'INR';
          qrText = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amt}&cu=${currency}&tn=${encodeURIComponent(note)}`;
        } else {
          const bankName = profile?.bankName || '';
          const bankAcc = profile?.bankAccount || '';
          const ifsc = profile?.ifscCode || '';
          const amt = totals.total.toFixed(2);
          const payee = profile?.name || '';
          const identifier = watchedNumber || 'Invoice_Tx';

          if (bankAcc || ifsc) {
            qrText = `Payee: ${payee}\nBank: ${bankName}\nAccount: ${bankAcc}\nIFS Code: ${ifsc}\nAmount: ${amt}\nRef: ${identifier}`;
          }
        }

        if (qrText) {
          const url = await QRCode.toDataURL(qrText, {
            margin: 4,
            width: 256,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          if (active) setQrUrl(url);
        } else {
          if (active) setQrUrl('');
        }
      } catch (err) {
        console.error('Failed to generate QR Code:', err);
      }
    };

    generateQR();
    return () => {
      active = false;
    };
  }, [qrType, profile, totals.total, watchedNumber]);

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
        fontFamily: data.fontFamily,
        margins: data.margins,
        showTaxId: data.showTaxId,
        showSignature: data.showSignature,
        showBankDetails: data.showBankDetails,
        currency: data.currency || profile?.currency || 'INR',
        exchangeRate: Number(data.exchangeRate) || 1.0,
        taxPreset: data.taxPreset || 'generic',
        gstType: data.gstType || 'cgst_sgst',
        isReverseCharge: !!data.isReverseCharge,
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
      fontFamily: data.fontFamily,
      margins: data.margins,
      showTaxId: data.showTaxId,
      showSignature: data.showSignature,
      showBankDetails: data.showBankDetails,
      currency: data.currency || profile?.currency || 'INR',
      exchangeRate: Number(data.exchangeRate) || 1.0,
      taxPreset: data.taxPreset || 'generic',
      gstType: data.gstType || 'cgst_sgst',
      isReverseCharge: !!data.isReverseCharge,
      createdAt: initialInvoice?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    generateInvoicePDF(invoiceData, profile, selectedCustomer);
  };

  const selectedCustomer = customers.find(c => c.id === watchedCustomerId);

  const renderPreviewContent = () => {
    const fontLookup: Record<string, string> = {
      'Inter': '"Inter", sans-serif',
      'Space Grotesk': '"Space Grotesk", sans-serif',
      'Playfair Display': '"Playfair Display", serif',
      'JetBrains Mono': '"JetBrains Mono", monospace',
    };

    const curCode = watch('currency') || 'INR';
    const rateVal = parseFloat(String(watch('exchangeRate') || 1.0)) || 1.0;

    const formatCurrency = (val: number, code: string = curCode) => {
      const symbols: Record<string, string> = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'CAD': 'C$',
        'AUD': 'A$',
        'AED': 'AED ',
        'SGD': 'S$',
        'JPY': '¥',
      };
      const sym = symbols[code] || '$';
      return `${sym}${val.toFixed(2)}`;
    };

    const selTemplate = watch('templateId') || 'modern';
    const selFont = watch('fontFamily') || 'Inter';
    const selMargins = watch('margins') || 'comfortable';
    const selColor = watch('accentColor') || '#FF4D57';
    const isShowTax = watch('showTaxId') !== false;
    const isShowSignature = watch('showSignature') !== false;
    const isShowBank = watch('showBankDetails') !== false;

    return (
      <div 
        className={cn(
          "glass-card min-h-[800px] w-full max-w-4xl mx-auto bg-white text-black shadow-2xl relative overflow-hidden transition-all duration-300",
          selMargins === 'compact' ? "p-4 md:p-6 text-xs" : 
          selMargins === 'spacious' ? "p-10 md:p-16 text-sm" : 
          "p-8 md:p-12 text-xs"
        )}
        style={{
          fontFamily: fontLookup[selFont] || '"Inter", sans-serif',
        }}
      >
          {/* Top Bar for creative/luxury style */}
          {selTemplate === 'luxury' && (
            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#1F2937]" />
          )}
          {selTemplate === 'creative' && (
            <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: selColor }} />
          )}

          {/* Decorative background for template differentiation */}
          {(selTemplate === 'bold' || selTemplate === 'creative') && (
             <div 
               className="absolute top-0 right-0 w-1/2 h-full -mr-20 -mt-20 opacity-5 rotate-12"
               style={{ backgroundColor: selColor }}
             />
          )}
          
          {/* PDF Content Mockup */}
          <div className={cn(
             "flex mb-12 md:mb-16 items-start",
             (selTemplate === 'minimal' || selTemplate === 'corporate') ? "flex-col gap-6" : "justify-between"
          )}>
            <div className="flex gap-6 items-center">
              {profile?.logoUrl && (
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                  <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-contain p-2" />
                </div>
              )}
              <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-2" style={{ color: selTemplate === 'bold' || selTemplate === 'creative' ? selColor : 'inherit' }}>
                   {profile?.name || 'BUSINESS NAME'}
                </h2>
                <div className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-widest">
                   <p>{profile?.address || 'Your Street, City'}</p>
                   <p>{profile?.email || 'email@company.com'}</p>
                   {profile?.taxId && isShowTax && <p>{`Tax ID: ${profile.taxId}`}</p>}
                </div>
              </div>
            </div>
            <div className={(selTemplate === 'minimal' || selTemplate === 'corporate') ? "text-left" : "text-right"}>
              <p className={cn(
                 "text-4xl md:text-5xl font-black uppercase absolute pointer-events-none select-none",
                 (selTemplate === 'bold' || selTemplate === 'creative') ? "-right-2 top-20 text-gray-200/50" : "-right-2 top-10 text-gray-100"
              )}>Invoice</p>
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Invoice Number</p>
                <p className="text-xl md:text-2xl font-black font-mono" style={{ color: selColor }}>{watchedNumber}</p>
              </div>
            </div>
          </div>
  
          <div className={cn(
             "grid grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-16 border-y py-8 md:py-10",
             selTemplate === 'classic' ? "border-black" : "border-gray-100"
          )}>
             <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Billed to</p>
                <p className="text-base md:text-lg font-black uppercase">{selectedCustomer?.name || 'CLIENT NAME'}</p>
                <div className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  <p>{selectedCustomer?.address || 'Client Address'}</p>
                  <p>{selectedCustomer?.email || 'client@email.com'}</p>
                </div>
             </div>
             <div className="text-right space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Invoice Date</p>
                  <p className="text-xs font-bold uppercase">{format(watch('date'), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Due Date</p>
                  <p className="text-xs font-bold uppercase">{format(watch('dueDate'), 'MMM dd, yyyy')}</p>
                </div>
             </div>
          </div>
  
          <div className="overflow-x-auto">
            <table className="w-full mb-12 md:mb-16 min-w-[600px]">
               <thead>
                  <tr className={cn("border-b-2", selTemplate === 'classic' ? "border-black" : "border-gray-200")}>
                     <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-left">Description</th>
                     <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-center">Qty</th>
                     <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-right">Price</th>
                     <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-right">Amount</th>
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
                    
                    const currentTaxPreset = watch('taxPreset') || 'generic';
                    const currentIsReverseCharge = !!watch('isReverseCharge');
                    const actualTaxRate = (currentTaxPreset === 'eu_vat' && currentIsReverseCharge) ? 0 : t;
                    
                    const taxAmt = afterDisc * (actualTaxRate / 100);
                    const lineTotal = afterDisc + taxAmt;
  
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                         <td className="py-5">
                            <p className="font-bold text-gray-900">{item.description || 'Service Description'}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                               {item.hsnSac && (
                                 <span className="text-[8px] bg-gray-100 font-mono text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                   HSN/SAC: {item.hsnSac}
                                 </span>
                               )}
                               {(t > 0 || d > 0) && (
                                 <span className="text-[8px] text-gray-400 font-medium uppercase tracking-tighter">
                                    {t > 0 && `Tax: ${t}% `}
                                    {d > 0 && `Disc: ${d}%`}
                                 </span>
                               )}
                            </div>
                         </td>
                         <td className="py-5 text-center text-gray-600">{q}</td>
                         <td className="py-5 text-right font-mono text-gray-600">{formatCurrency(p)}</td>
                         <td className="py-5 text-right font-bold font-mono text-gray-900">{formatCurrency(lineTotal)}</td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
          </div>
  
          <div className="flex justify-end border-t border-gray-100 pt-6 mb-8">
             <div className="w-64 space-y-3">
                <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                   <span>Subtotal</span>
                   <span>{formatCurrency(totals.subtotal)}</span>
                </div>

                {watch('taxPreset') === 'india_gst' ? (
                   watch('gstType') === 'cgst_sgst' ? (
                     <>
                       <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-widest pl-2 border-l-2 border-primary/20">
                          <span>CGST (Central - 50%)</span>
                          <span>{formatCurrency(totals.taxTotal / 2)}</span>
                       </div>
                       <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-widest pl-2 border-l-2 border-primary/20">
                          <span>SGST (State - 50%)</span>
                          <span>{formatCurrency(totals.taxTotal / 2)}</span>
                       </div>
                     </>
                   ) : (
                     <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                        <span>IGST (Integrated)</span>
                        <span>{formatCurrency(totals.taxTotal)}</span>
                     </div>
                   )
                ) : watch('taxPreset') === 'eu_vat' && watch('isReverseCharge') ? (
                   <div className="flex flex-col text-[10px] text-right pl-2 border-l-2 border-green-500/30 text-green-600">
                      <div className="flex justify-between uppercase font-bold tracking-widest">
                         <span>Tax Total (Reverse Chg)</span>
                         <span>{formatCurrency(0)}</span>
                      </div>
                      <span className="text-[8px] italic text-gray-400 mt-1 uppercase leading-snug">Buyer liable for EU VAT import tax</span>
                   </div>
                ) : (
                   <div className="flex justify-between text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                      <span>Tax Total</span>
                      <span>{formatCurrency(totals.taxTotal)}</span>
                   </div>
                )}

                {totals.discountTotal > 0 && (
                   <div className="flex justify-between text-[10px] text-green-500 uppercase font-bold tracking-widest font-mono">
                      <span>Discount Total</span>
                      <span>-{formatCurrency(totals.discountTotal)}</span>
                   </div>
                )}

                <div className="flex justify-between pt-3 border-t border-gray-100 text-xl font-black uppercase">
                   <span>Total</span>
                   <span style={{ color: selColor }}>{formatCurrency(totals.total)}</span>
                </div>

                {/* Conversion Equivalent to home settlement currency (like INR) */}
                {curCode !== (settings.currencyDefault || profile?.currency || 'INR') && (
                   <div className="pt-2 mt-1 border-t border-dashed border-gray-100 text-[9px] text-gray-400 text-right uppercase tracking-wider font-mono">
                      <span>Exchange Equivalent ({settings.currencyDefault || profile?.currency || 'INR'} Settlement)</span>
                      <p className="text-gray-600 font-bold mt-1 text-[11px]">
                         {settings.currencyDefault || profile?.currency || 'INR'} {((totals.total * rateVal).toFixed(2))}
                      </p>
                      <p className="text-[7.5px] italic text-gray-400 font-sans tracking-normal mt-0.5">FX rate: 1 {curCode} = {rateVal} {settings.currencyDefault || profile?.currency || 'INR'}</p>
                   </div>
                )}
             </div>
          </div>

          {/* Optional Bank Wire Instructions Segment */}
          {isShowBank && (profile?.bankAccount || profile?.ifscCode) && (
            <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 space-y-1.5 mb-8">
              <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1">
                <span>Direct Settlement Bank Transfer Details</span>
              </p>
              <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-500 font-medium">
                <p>Bank: <span className="font-bold text-gray-700">{profile?.bankName || 'N/A'}</span></p>
                <p>A/C Holder: <span className="font-bold text-gray-700">{profile?.holderName || profile?.name}</span></p>
                <p>Account No: <span className="font-bold text-gray-700 font-mono">{profile?.bankAccount || 'N/A'}</span></p>
                <p>IFSC / SWIFT: <span className="font-bold text-gray-700 font-mono">{profile?.ifscCode || 'N/A'}</span></p>
                {profile?.upiId && (
                  <p className="col-span-2">UPI Identifier: <span className="font-bold text-gray-800 tracking-wide font-mono">{profile.upiId}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Signatory Footer segment */}
          {isShowSignature && (
            <div className="flex justify-end pt-4 border-t border-gray-100 mb-8">
              <div className="text-right space-y-1.5">
                <div className="h-8 w-28 border-b border-gray-200 ml-auto flex items-center justify-center relative overflow-hidden">
                  {profile?.signature ? (
                    <img src={profile.signature} alt="Sign" className="h-full object-contain" />
                  ) : (
                    <span className="text-[9px] tracking-wide text-gray-300 font-mono">Authorized Seal</span>
                  )}
                </div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Authorized Signatory</p>
              </div>
            </div>
          )}
  
          <div className="mt-auto grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-gray-100 text-[11px] text-gray-500">
             <div className="md:col-span-2 space-y-4">
                <div>
                   <p className="font-bold text-gray-700 uppercase tracking-widest mb-1.5">Notes</p>
                   <p className="whitespace-pre-wrap italic text-gray-500">{watch('notes') || 'No special notes.'}</p>
                </div>
                <div>
                   <p className="font-bold text-gray-700 uppercase tracking-widest mb-1.5">Terms & Conditions</p>
                   <p className="whitespace-pre-wrap italic text-gray-500">{watch('terms') || 'Payment upon receipt.'}</p>
                </div>
             </div>
             
             <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col items-center text-center">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2.5">Scan to Pay Instantly</span>
                {qrUrl ? (
                   <div 
                     onClick={() => setZoomQr(true)}
                     className="relative group/qr bg-white p-2 rounded-xl shadow-sm border border-gray-100 transition-all hover:scale-105 cursor-pointer"
                   >
                      <img src={qrUrl} alt="Invoice QR" className="w-24 h-24 object-contain" />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/qr:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                         <span className="text-[8px] bg-white text-black px-1.5 py-0.5 rounded font-black tracking-widest shadow-sm">Zoom</span>
                      </div>
                   </div>
                ) : (
                   <div className="w-24 h-24 rounded-xl pb-1 bg-white border border-dashed border-gray-200 flex flex-col items-center justify-center p-3 text-center text-gray-400 gap-1">
                      <QrCode size={18} />
                      <span className="text-[8px] font-black uppercase tracking-wider leading-tight">No Pay Credentials</span>
                   </div>
                )}
  
                <div className="mt-2.5 w-full">
                   <p className="text-[8px] font-bold text-gray-800 uppercase tracking-wider">
                      {profile?.upiId && qrType === 'upi' ? 'UPI Transfer Direct' : 'Bank Remittance'}
                   </p>
                   {profile?.upiId && qrType === 'upi' ? (
                      <p className="text-[8px] font-mono text-gray-500 truncate max-w-[130px] mx-auto mt-0.5 font-bold">{profile.upiId}</p>
                   ) : (
                      profile?.bankAccount && (
                         <div className="text-[7.5px] text-gray-500 font-mono mt-0.5 leading-tight">
                            <p className="truncate">A/C: {profile.bankAccount}</p>
                            <p>IFSC: {profile.ifscCode}</p>
                         </div>
                      )
                   )}
                </div>
             </div>
          </div>
      </div>
    );
  };

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

            {/* Local Compliance FX Pricing Card */}
            <div className="glass-card grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 !p-10 rounded-[48px]" id="compliance-fx-card">
              <div className="md:col-span-12 flex items-center gap-4 border-b border-white/5 pb-4 mb-2">
                 <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                 <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted/80">Compliance & Currency Conversion</h3>
              </div>

              {/* Currency Selector */}
              <div className="space-y-3 md:col-span-4">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/50 pl-2">Billing Currency</label>
                 <div className="relative group">
                    <select 
                      {...register('currency')}
                      onChange={(e) => {
                        const currencyVal = e.target.value;
                        setValue('currency', currencyVal);
                        const rate = exchangeRates[currencyVal] || 1.0;
                        setValue('exchangeRate', rate);
                      }}
                      className="input-field w-full text-xs font-black uppercase tracking-widest bg-white/[0.01] h-14 px-5 appearance-none cursor-pointer"
                    >
                      <option value="INR">INR — Indian Rupee</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="CAD">CAD — Canadian Dollar</option>
                      <option value="AUD">AUD — Australian Dollar</option>
                      <option value="AED">AED — UAE Dirham</option>
                      <option value="SGD">SGD — Singapore Dollar</option>
                      <option value="JPY">JPY — Japanese Yen</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted rotate-90" size={16} />
                 </div>
              </div>

              {/* Adjust Exchange Rate */}
              <div className="space-y-3 md:col-span-4">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/50 pl-2">
                    Exchange Rate ({watch('currency') || 'INR'} to Home)
                 </label>
                 <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="any"
                      {...register('exchangeRate', { valueAsNumber: true })} 
                      className="input-field w-full font-mono text-xs tracking-tighter h-14 bg-white/[0.01]" 
                      placeholder="1.0" 
                    />
                    <button 
                      type="button"
                      onClick={async () => {
                        const baseCurr = settings.currencyDefault || 'INR';
                        await fetchExchangeRates(baseCurr);
                        const currentSelected = watch('currency') || 'INR';
                        const freshRate = useStore.getState().exchangeRates[currentSelected] || 1.0;
                        setValue('exchangeRate', freshRate);
                      }}
                      title="Fetch live rates from global API feed and cache locally"
                      className="h-14 px-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-black text-primary hover:bg-primary/10 transition-colors uppercase tracking-widest"
                    >
                      Sync
                    </button>
                 </div>
                 {lastRatesUpdate && (
                    <p className="text-[9px] text-gray-500 font-mono pl-2">
                       Rates cached: {format(lastRatesUpdate, 'HH:mm:ss')}
                    </p>
                 )}
              </div>

              {/* TaxationPreset Selection */}
              <div className="space-y-3 md:col-span-4">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/50 pl-2">Tax Profile Preset</label>
                 <div className="relative group p-0">
                    <select 
                      {...register('taxPreset')} 
                      className="input-field w-full text-xs font-black uppercase tracking-widest bg-white/[0.01] h-14 px-5 appearance-none cursor-pointer"
                    >
                      <option value="generic">GENERIC (Tax rate only)</option>
                      <option value="india_gst">INDIA GST presets</option>
                      <option value="eu_vat">EU VAT rules</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-muted rotate-90" size={16} />
                 </div>
              </div>

              {/* Conditional Dual Indian GST options */}
              {watch('taxPreset') === 'india_gst' && (
                 <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1">GST Transaction Mode</label>
                       <select 
                         {...register('gstType')} 
                         className="input-field w-full py-4 h-14 text-xs font-black bg-background/50 appearance-none uppercase"
                       >
                         <option value="cgst_sgst">Intra-State (CGST + SGST splitting)</option>
                         <option value="igst">Inter-State (Consolidated IGST)</option>
                       </select>
                    </div>
                    <div className="flex flex-col justify-center pl-2">
                       <p className="text-[10px] uppercase font-black text-primary tracking-wide">Splitting Calculations Enabled</p>
                       <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">
                          Intrastate splices overall taxation percentages into CGST (Central GST) and SGST (State GST) equally. Directs HSN/SAC parameters into lines.
                       </p>
                    </div>
                 </div>
              )}

              {/* Conditional EU VAT features */}
              {watch('taxPreset') === 'eu_vat' && (
                 <div className="md:col-span-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                    <div>
                       <p className="text-[10px] uppercase font-black text-primary tracking-wide">EU VAT Rules Engine</p>
                       <p className="text-[9px] text-gray-500 mt-1 leading-relaxed">
                          Permits flag tracking for EU reverse-charge B2B imports/exports to zero liabilities on foreign transfers.
                       </p>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer self-end sm:self-center">
                       <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Apply Reverse Charge</span>
                       <input 
                         type="checkbox" 
                         {...register('isReverseCharge')} 
                         className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary focus:ring-offset-background" 
                       />
                    </label>
                 </div>
              )}
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
                    <div className="flex flex-col gap-5 p-5 md:p-6 rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all group animate-in fade-in slide-in-from-left-4 focus-within:z-50 relative focus-within:bg-white/[0.08] focus-within:border-primary/30 shadow-lg mb-4">
                      
                      {/* Row 1: Core Item Definition */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full items-start">
                        <div className="w-full md:col-span-9 space-y-2 relative">
                          <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Description / Product search</label>
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

                        {/* HSN/SAC Compliance Column */}
                        <div className="w-full md:col-span-3 space-y-2">
                          <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">HSN/SAC Code</label>
                          <input 
                            placeholder="HSN/SAC" 
                            {...register(`items.${index}.hsnSac` as const)} 
                            className="input-field w-full text-xs py-2 bg-white/[0.01] hover:bg-white/[0.03] transition-all font-mono h-11" 
                          />
                        </div>
                      </div>

                      {/* Row 2: Financial Computable variables inside a cohesive Box */}
                      <div className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Quantity</label>
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
                         
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Unit Price</label>
                            <div className="relative">
                               <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-xs font-bold">
                                 {activeCurrencySymbol}
                               </span>
                               <input 
                                 type="number"
                                 step="0.01"
                                 {...register(`items.${index}.price` as const, { valueAsNumber: true })} 
                                 className={`input-field w-full text-sm font-mono font-bold h-11 ${
                                   activeCurrencySymbol.length > 2 ? 'pl-14' : activeCurrencySymbol.length > 1 ? 'pl-9' : 'pl-7'
                                 }`}
                               />
                            </div>
                         </div>

                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Tax (%)</label>
                            <input 
                              type="number"
                              {...register(`items.${index}.taxRate` as const, { valueAsNumber: true })} 
                              className="input-field w-full text-xs text-center h-11"
                            />
                         </div>

                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1 text-green-500">Disc (%)</label>
                            <input 
                              type="number"
                              {...register(`items.${index}.discount` as const, { valueAsNumber: true })} 
                              className="input-field w-full text-xs text-center text-green-500 border-green-500/20 h-11 font-bold"
                            />
                         </div>

                         <div className="col-span-2 md:col-span-1 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center pt-2 md:pt-0 gap-4 md:gap-1">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest md:mb-1" style={{ color: watch('accentColor') }}>Line Total</label>
                            <div className="flex items-center gap-3">
                               <p className="text-sm font-black font-mono text-primary whitespace-nowrap" style={{ color: watch('accentColor') }}>
                                 {activeCurrencySymbol}
                                 {(() => {
                                   const qty = Number(watchedItems[index]?.quantity) || 0;
                                   const prc = Number(watchedItems[index]?.price) || 0;
                                   const disc = Number(watchedItems[index]?.discount) || 0;
                                   const tax = Number(watchedItems[index]?.taxRate) || 0;
                                   const sub = qty * prc;
                                   const afterDisc = sub - (sub * (disc / 100));
                                   return (afterDisc + (afterDisc * (tax / 100))).toFixed(2);
                                 })()}
                               </p>
                               <div className="flex gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all">
                                 <button 
                                   type="button" 
                                   onClick={() => append({ ...watchedItems[index], id: Math.random().toString(36).substr(2, 9) })}
                                   className="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-all cursor-pointer"
                                   title="Duplicate"
                                 >
                                   <Copy size={13} />
                                 </button>
                                 <button 
                                   type="button" 
                                   onClick={() => remove(index)}
                                   className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-all cursor-pointer"
                                   title="Delete"
                                 >
                                   <Trash2 size={13} />
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
             <div className="glass-card !p-6 lg:!p-8 rounded-[40px] border-white/10 shadow-2xl relative overflow-hidden group/visual space-y-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/visual:opacity-100 transition-opacity duration-700" />
                
                {/* Section header */}
                <div className="flex items-center gap-3 relative border-b border-white/5 pb-4">
                  <Palette size={16} className="text-primary" style={{ color: watch('accentColor') }} />
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Design & Aesthetics</h4>
                    <p className="text-[8px] text-muted uppercase tracking-widest">Aesthetic layout settings</p>
                  </div>
                </div>

                <div className="space-y-6 relative">
                   {/* Layout Preset selection */}
                   <div className="flex flex-col gap-2">
                     <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted/60">Layout Template Preset</span>
                     <div className="grid grid-cols-3 gap-2">
                       {[
                         { id: 'modern', label: 'Modern' },
                         { id: 'luxury', label: 'Luxury' },
                         { id: 'corporate', label: 'Swiss' },
                         { id: 'creative', label: 'Creative' },
                         { id: 'minimal', label: 'Nano' },
                         { id: 'classic', label: 'Heritage' }
                       ].map(t => (
                         <button 
                           key={t.id} 
                           type="button" 
                           onClick={() => setValue('templateId', t.id, { shouldDirty: true })}
                           className={cn(
                             "py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all hover:scale-105 active:scale-95",
                             watch('templateId') === t.id ? "bg-primary border-primary text-white shadow-lg" : "bg-white/5 border-white/5 text-muted/50 hover:text-white"
                           )}
                           style={{ backgroundColor: watch('templateId') === t.id ? watch('accentColor') : undefined, borderColor: watch('templateId') === t.id ? watch('accentColor') : undefined }}
                         >
                           {t.label}
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* Accent Primary Color selection */}
                   <div className="flex flex-col gap-2">
                     <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted/60">Primary Accent Pigment</span>
                     <div className="flex gap-2.5 items-center flex-wrap">
                        {['#FF4D57', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map(c => (
                          <button 
                            key={c} 
                            type="button" 
                            onClick={() => setValue('accentColor', c, { shouldDirty: true })}
                            className={cn(
                              "w-7 h-7 rounded-lg border transition-all p-1 hover:scale-115 shrink-0",
                              watch('accentColor') === c ? "border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "border-transparent opacity-60 hover:opacity-100"
                            )}
                          >
                            <div className="w-full h-full rounded shadow-inner" style={{ backgroundColor: c }} />
                          </button>
                        ))}
                     </div>
                   </div>

                   {/* Typography selection */}
                   <div className="flex flex-col gap-2">
                     <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted/60">Brand Typography Font</span>
                     <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'Inter', label: 'Inter Symmetrical' },
                          { id: 'Space Grotesk', label: 'Space Grotesk Tech' },
                          { id: 'Playfair Display', label: 'Playfair Luxe Serif' },
                          { id: 'JetBrains Mono', label: 'JetBrains Dev Mono' }
                        ].map(f => (
                          <button 
                            key={f.id} 
                            type="button" 
                            onClick={() => setValue('fontFamily', f.id, { shouldDirty: true })}
                            className={cn(
                              "py-1.5 px-2 rounded-xl text-[8.5px] font-bold text-left border transition-all truncate hover:bg-white/5",
                              watch('fontFamily') === f.id ? "bg-white/10 text-white border-white/20" : "bg-white/5 border-transparent text-muted/55 hover:text-white"
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                     </div>
                   </div>

                   {/* Margins Selection */}
                   <div className="flex flex-col gap-2">
                     <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted/60">Margins & Density</span>
                     <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                        {[
                          { id: 'compact', label: 'Compact' },
                          { id: 'comfortable', label: 'Comfortable' },
                          { id: 'spacious', label: 'Spacious' }
                        ].map(m => (
                          <button 
                            key={m.id} 
                            type="button" 
                            onClick={() => setValue('margins', m.id as any, { shouldDirty: true })}
                            className={cn(
                              "flex-1 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all text-center",
                              watch('margins') === m.id ? "bg-white/10 text-white border border-white/15" : "text-muted/60 hover:text-white"
                            )}
                          >
                            {m.label}
                          </button>
                        ))}
                     </div>
                   </div>

                   {/* Toggle fields */}
                   <div className="pt-2 border-t border-white/5 space-y-3">
                     {[
                       { id: 'showTaxId', label: 'Display Business Tax ID Line' },
                       { id: 'showSignature', label: 'Attach Authorized Signature Seal' },
                       { id: 'showBankDetails', label: 'Render Settlement Banking Details' }
                     ].map(opt => (
                       <label key={opt.id} className="flex items-center justify-between cursor-pointer select-none">
                         <span className="text-[10px] text-muted/80 font-medium">{opt.label}</span>
                         <input 
                           type="checkbox" 
                           checked={watch(opt.id as any) !== false}
                           onChange={(e) => setValue(opt.id as any, e.target.checked, { shouldDirty: true })}
                           className="rounded bg-white/5 border-white/10 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4"
                           style={{ color: watch('accentColor') }}
                         />
                       </label>
                     ))}
                   </div>
                </div>
             </div>

             {/* Dynamic QR Pay Terminal Card */}
             <div className="glass-card !p-6 lg:!p-8 rounded-[40px] border-white/10 shadow-2xl relative overflow-hidden group/qr-control">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/qr-control:opacity-100 transition-opacity duration-700" />
                <div className="relative space-y-6">
                   <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                         <QrCode className="text-primary animate-pulse" size={20} style={{ color: watch('accentColor') }} />
                         <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">QR Pay Routing</h4>
                            <p className="text-[8px] text-muted uppercase tracking-widest">Instant client settlement</p>
                         </div>
                      </div>
                      
                      <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
                         <button 
                           type="button"
                           onClick={() => setQrType('upi')}
                           className={cn(
                             "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                             qrType === 'upi' ? "bg-primary text-white" : "text-muted hover:text-white"
                           )}
                           style={{ backgroundColor: qrType === 'upi' ? watch('accentColor') : undefined }}
                         >
                            UPI
                         </button>
                         <button 
                           type="button"
                           onClick={() => setQrType('bank')}
                           className={cn(
                             "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                             qrType === 'bank' ? "bg-primary text-white" : "text-muted hover:text-white"
                           )}
                           style={{ backgroundColor: qrType === 'bank' ? watch('accentColor') : undefined }}
                         >
                            Bank
                         </button>
                      </div>
                   </div>

                   <div className="flex gap-6 items-center">
                      {qrUrl ? (
                         <div className="relative group/qr bg-white p-2.5 rounded-2xl shadow-xl transition-transform hover:scale-105 select-none shrink-0 border border-gray-100">
                            <img src={qrUrl} alt="QR Pay Routing" className="w-20 h-20 object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = qrUrl;
                                a.download = `payment-qr-${watchedNumber || 'invoice'}.png`;
                                a.click();
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover/qr:opacity-100 transition-all rounded-2xl flex flex-col items-center justify-center text-white gap-1 cursor-pointer"
                            >
                               <Download size={14} />
                               <span className="text-[8px] font-bold uppercase tracking-widest">SAVE PNG</span>
                            </button>
                         </div>
                      ) : (
                         <div className="w-20 h-20 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center justify-center p-3 text-center text-muted shrink-0">
                            <Info size={18} className="text-muted/40 animate-pulse mb-1" />
                            <span className="text-[7px] font-black leading-tight uppercase text-muted/50">Setup Details</span>
                         </div>
                      )}

                      <div className="flex-1 min-w-0">
                         {qrType === 'upi' ? (
                            <div className="space-y-1">
                               <p className="text-[10px] font-bold text-white uppercase tracking-wider">UPI Virtual Payment ID</p>
                               {profile?.upiId ? (
                                  <>
                                     <p className="text-xs font-mono text-primary font-bold truncate" style={{ color: watch('accentColor') }}>{profile.upiId}</p>
                                     <p className="text-[8px] text-muted leading-relaxed uppercase tracking-widest opacity-80 decoration-dotted">Encodes merchant endpoint & totals correctly.</p>
                                  </>
                               ) : (
                                  <>
                                     <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest leading-normal">No UPI ID Found</p>
                                     <button 
                                       type="button"
                                       onClick={() => navigate('/settings')}
                                       className="text-[8px] text-primary hover:underline font-black uppercase tracking-widest block"
                                       style={{ color: watch('accentColor') }}
                                     >
                                        Configure UPI →
                                     </button>
                                  </>
                               )}
                            </div>
                         ) : (
                            <div className="space-y-1">
                               <p className="text-[10px] font-bold text-white uppercase tracking-wider">Direct Wire Routing</p>
                               {profile?.bankAccount || profile?.ifscCode ? (
                                  <div className="text-[8px] text-muted font-mono leading-tight space-y-0.5">
                                     <p className="text-white font-bold truncate">{profile.bankName || 'Direct'}</p>
                                     <p className="truncate">ACC: {profile.bankAccount || 'N/A'}</p>
                                     <p>IFSC: {profile.ifscCode || 'N/A'}</p>
                                  </div>
                               ) : (
                                  <>
                                     <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest leading-normal">Bank account empty</p>
                                     <button 
                                       type="button"
                                       onClick={() => navigate('/settings')}
                                       className="text-[8px] text-primary hover:underline font-black uppercase tracking-widest block"
                                       style={{ color: watch('accentColor') }}
                                     >
                                        Setup Account →
                                     </button>
                                  </>
                               )}
                            </div>
                         )}
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

      {/* Zoomed QR Modal Terminal */}
      <AnimatePresence>
        {zoomQr && qrUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
            onClick={() => setZoomQr(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 p-8 md:p-12 rounded-[48px] max-w-md w-full text-center space-y-8 relative shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px]" />
              
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary" style={{ color: watch('accentColor') }}>
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white tracking-widest">Gateway Matrix</h3>
                    <p className="text-[9px] text-muted uppercase tracking-widest">{profile?.upiId && qrType === 'upi' ? 'UPI Live Settlement' : 'Direct Electronic Remittance'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setZoomQr(false)} 
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-muted/60 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-white p-6 rounded-[32px] inline-block shadow-2xl border border-white/10 transition-transform hover:scale-102">
                <img src={qrUrl} alt="Zoomed payment QR" className="w-64 h-64 object-contain mx-auto" />
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[9px] font-black tracking-widest text-[#10B981] uppercase block mb-1">● Net Payable Value</span>
                  <span className="text-3xl font-black font-mono tracking-tighter text-white" style={{ color: watch('accentColor') }}>
                    {profile?.currency || 'USD'} {totals.total.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted/80">
                  {qrType === 'upi' && profile?.upiId ? (
                    <>
                      <p className="font-mono text-white text-[13px] font-semibold tracking-wider select-all">{profile.upiId}</p>
                      <p className="text-[9px] text-muted/50 uppercase tracking-widest">Authenticates instantly via scanning applications.</p>
                    </>
                  ) : (
                    profile?.bankAccount && (
                      <div className="text-[11px] font-mono space-y-1 bg-white/[0.02] p-4 rounded-2xl text-left border border-white/5">
                        <p className="text-white font-bold uppercase tracking-wider">{profile.bankName || 'Direct'}</p>
                        <p className="select-all">Account: {profile.bankAccount}</p>
                        <p className="select-all">IFSC/Swift: {profile.ifscCode}</p>
                        <p className="select-all">Beneficiary: {profile.name}</p>
                      </div>
                    )
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = qrUrl;
                  a.download = `payment-qr-${watchedNumber || 'invoice'}.png`;
                  a.click();
                }}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} />
                Download Scan Token (PNG)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

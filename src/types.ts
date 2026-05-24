/**
 * Types for NovaBill Application
 */

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface BusinessProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  website?: string;
  taxId?: string;
  currency: string;
  notePresets?: string[];
  termPresets?: string[];
  bankName?: string;
  bankAccount?: string;
  ifscCode?: string;
  upiId?: string;
  signature?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  companyName?: string;
  taxId?: string;
  createdAt: number;
  tags?: string[];
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  taxRate: number;
  unit: string;
  category?: string;
  createdAt: number;
  // Phase 2
  sku: string;
  stockLevel: number;
  minStockLevel: number;
  costPrice?: number;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  price: number;
  taxRate: number;
  discount: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: number;
  dueDate: number;
  customerId: string;
  businessId: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  status: InvoiceStatus;
  category?: string;
  notes?: string;
  terms?: string;
  templateId: string;
  accentColor?: string;
  currency: string;
  createdAt: number;
  updatedAt: number;
  // Phase 2
  paidAmount?: number;
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly';
  nextRecurringDate?: number;
  type?: 'invoice' | 'quotation' | 'estimate' | 'purchase_order' | 'credit_note';
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: number;
  paymentMethod: string;
  notes?: string;
  updatedAt: number;
}

export interface AppSettings {
  id?: string;
  theme: 'light' | 'dark' | 'glass';
  accentColor: string;
  language: string;
  currencyDefault: string;
  density: 'comfortable' | 'compact';
  autoBackup: boolean;
}

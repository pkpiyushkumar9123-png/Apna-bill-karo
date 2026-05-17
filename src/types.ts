/**
 * Types for NovaBill Application
 */

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

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
  notes?: string;
  terms?: string;
  templateId: string;
  accentColor?: string;
  currency: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'glass';
  accentColor: string;
  language: string;
  currencyDefault: string;
  density: 'comfortable' | 'compact';
}

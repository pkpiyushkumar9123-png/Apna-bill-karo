import * as XLSX from 'xlsx';
import { Invoice, Customer, Product, BusinessProfile } from '../types';

/**
 * ExcelService handles the conversion between App Entities and Excel workbooks.
 */
export const ExcelService = {
  /**
   * Converts a list of objects to an Excel Buffer
   */
  generateExcelBuffer<T>(data: T[], sheetName: string): ArrayBuffer {
    const ws = XLSX.utils.json_to_sheet(this.prepareForExcel(data));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return wbout;
  },

  /**
   * Prepares data for Excel (flattening nested objects if necessary)
   */
  prepareForExcel(data: any[]): any[] {
    return data.map(item => {
      const flattened: any = { ...item };
      
      // Specifically handle Invoice mapping to match user request
      if ('number' in item && 'total' in item) {
        return {
          invoice_id: item.id,
          invoice_number: item.number,
          customerId: item.customerId, // Keep for relational integrity
          invoice_date: item.date,
          due_date: item.dueDate,
          items: JSON.stringify(item.items || []),
          subtotal: item.subtotal,
          taxes: item.taxTotal,
          discount: item.discountTotal,
          total: item.total,
          payment_status: item.status,
          notes: item.notes || '',
          terms: item.terms || '',
          category: item.category || '',
          template_id: item.templateId || 'modern',
          currency: item.currency || 'USD',
          updated_at: item.updatedAt || Date.now()
        };
      }

      // Handle Customer mapping
      if ('email' in item && 'address' in item && !('number' in item)) {
        return {
          customer_id: item.id,
          customer_name: item.name,
          phone: item.phone || '',
          email: item.email,
          address: item.address || '',
          gst_number: item.taxId || '',
          notes: item.notes || '',
          created_at: item.createdAt
        };
      }

      // Handle Product mapping
      if ('price' in item && 'taxRate' in item) {
        return {
          product_id: item.id,
          product_name: item.name,
          sku: item.id.split('-')[0].toUpperCase(),
          category: item.category || '',
          quantity: 1, // Default
          unit_price: item.price,
          tax_rate: item.taxRate,
          unit: item.unit || 'pcs',
          description: item.description || ''
        };
      }

      // Default flattening
      if (item.items && Array.isArray(item.items)) {
        flattened.items = JSON.stringify(item.items);
      }
      return flattened;
    });
  },

  /**
   * Parses Excel data back into objects
   */
  parseExcelBuffer<T>(buffer: ArrayBuffer): T[] {
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const datasheet = wb.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(datasheet) as any[];
    
    return data.map(item => {
      // Map Invoice back
      if (item.invoice_id) {
        return {
          id: item.invoice_id,
          number: item.invoice_number,
          date: item.invoice_date,
          dueDate: item.due_date,
          customerId: item.customerId,
          items: typeof item.items === 'string' ? JSON.parse(item.items) : (item.items || []),
          subtotal: item.subtotal,
          taxTotal: item.taxes,
          discountTotal: item.discount,
          total: item.total,
          status: item.payment_status,
          notes: item.notes,
          terms: item.terms,
          category: item.category,
          templateId: item.template_id,
          currency: item.currency,
          updatedAt: item.updated_at || Date.now(),
          createdAt: item.created_at || item.invoice_date
        } as any;
      }

      // Map Customer back
      if (item.customer_id) {
        return {
          id: item.customer_id,
          name: item.customer_name,
          email: item.email,
          phone: item.phone,
          address: item.address,
          taxId: item.gst_number,
          notes: item.notes,
          createdAt: item.created_at
        } as any;
      }

      // Map Product back
      if (item.product_id) {
        return {
          id: item.product_id,
          name: item.product_name,
          price: item.unit_price,
          taxRate: item.tax_rate,
          unit: item.unit,
          category: item.category,
          description: item.description,
          createdAt: Date.now()
        } as any;
      }

      const parsed: any = { ...item };
      if (typeof item.items === 'string' && item.items.startsWith('[')) {
        try {
          parsed.items = JSON.parse(item.items);
        } catch (e) {
          parsed.items = [];
        }
      }
      return parsed;
    });
  }
};

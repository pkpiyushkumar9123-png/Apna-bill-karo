import { get, set, del } from 'idb-keyval';
import { ExcelService } from './excelService';
import { Invoice, Customer, Product, BusinessProfile, AppSettings } from '../types';

const STORAGE_KEY = 'novabill_workspace_handle';

export interface WorkspaceState {
  isConnected: boolean;
  directoryName: string | null;
  error: string | null;
  isSaving: boolean;
}

export class WorkspaceService {
  private static handle: FileSystemDirectoryHandle | null = null;

  /**
   * Request user to select a directory
   */
  static async connect(): Promise<string> {
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });
      this.handle = handle;
      await set(STORAGE_KEY, handle);
      return handle.name;
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      throw new Error('Failed to connect to directory: ' + err.message);
    }
  }

  /**
   * Try to restore handle from IndexedDB
   */
  static async restore(): Promise<string | null> {
    const savedHandle = await get(STORAGE_KEY);
    if (savedHandle) {
      try {
        // Verify permission (it almost always returns 'prompt' on reload)
        if (await savedHandle.queryPermission({ mode: 'readwrite' }) === 'granted') {
          this.handle = savedHandle;
          return savedHandle.name;
        }
      } catch (e) {
        await del(STORAGE_KEY);
      }
    }
    return null;
  }

  /**
   * Request permission for an existing handle
   */
  static async requestPermission(): Promise<boolean> {
    const savedHandle = await get(STORAGE_KEY);
    if (savedHandle) {
      const status = await savedHandle.requestPermission({ mode: 'readwrite' });
      if (status === 'granted') {
        this.handle = savedHandle;
        return true;
      }
    }
    return false;
  }

  static disconnect() {
    this.handle = null;
    del(STORAGE_KEY);
  }

  /**
   * Core persistence methods
   */
  static async saveFile(fileName: string, content: ArrayBuffer | string) {
    if (!this.handle) throw new Error('No workspace connected');
    
    try {
      const fileHandle = await this.handle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      
      // Auto backup logic
      if (fileName.endsWith('.xlsx')) {
        await this.createBackup(fileName, content);
      }
    } catch (err) {
      console.error(`Failed to save ${fileName}`, err);
      throw err;
    }
  }

  static async readFile(fileName: string): Promise<ArrayBuffer | string | null> {
    if (!this.handle) return null;
    try {
      const fileHandle = await this.handle.getFileHandle(fileName, { create: false });
      const file = await fileHandle.getFile();
      
      if (fileName.endsWith('.json')) {
        return await file.text();
      }
      return await file.arrayBuffer();
    } catch (err: any) {
      if (err.name === 'NotFoundError') return null;
      throw err;
    }
  }

  private static async createBackup(fileName: string, content: ArrayBuffer | string) {
    if (!this.handle) return;
    try {
      const backupsDir = await this.handle.getDirectoryHandle('backups', { create: true });
      const timestamp = new Date().toISOString().split('T')[0];
      const backupName = `${fileName.replace('.xlsx', '')}-backup-${timestamp}.xlsx`;
      
      const fileHandle = await backupsDir.getFileHandle(backupName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (err) {
      console.warn('Backup failed', err);
    }
  }

  /**
   * Entity High-level Sync
   */
  static async syncData(key: 'invoices' | 'customers' | 'products' | 'businesses', data: any[]) {
    const buffer = ExcelService.generateExcelBuffer(data, key);
    await this.saveFile(`${key}.xlsx`, buffer);
  }

  static async loadData<T>(key: 'invoices' | 'customers' | 'products' | 'businesses'): Promise<T[]> {
    const buffer = await this.readFile(`${key}.xlsx`);
    if (!buffer || typeof buffer === 'string') return [];
    return ExcelService.parseExcelBuffer<T>(buffer);
  }

  static async saveSettings(settings: AppSettings) {
    await this.saveFile('settings.json', JSON.stringify(settings, null, 2));
  }

  static async loadSettings(): Promise<AppSettings | null> {
    const text = await this.readFile('settings.json');
    if (!text || typeof text !== 'string') return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}

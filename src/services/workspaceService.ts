import { get, set, del } from 'idb-keyval';
import { ExcelService } from './excelService';
import { Invoice, Customer, Product, BusinessProfile, AppSettings } from '../types';
import { 
  googleSignIn, 
  logoutDrive, 
  readDriveFile, 
  writeDriveFile, 
  GoogleDriveService 
} from './googleDriveService';

const STORAGE_KEY = 'novabill_workspace_handle';
const TYPE_KEY = 'novabill_workspace_type';
const EMAIL_KEY = 'novabill_gdrive_email';

export interface WorkspaceState {
  isConnected: boolean;
  directoryName: string | null;
  error: string | null;
  isSaving: boolean;
}

export class WorkspaceService {
  private static handle: FileSystemDirectoryHandle | null = null;

  /**
   * Request user to select a directory (local folder)
   */
  static async connect(): Promise<string> {
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });
      this.handle = handle;
      await set(STORAGE_KEY, handle);
      localStorage.setItem(TYPE_KEY, 'local');
      return handle.name;
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      throw new Error('Failed to connect to directory: ' + err.message);
    }
  }

  /**
   * Connect and authenticate Google Drive workspace
   */
  static async connectDrive(): Promise<string> {
    try {
      const result = await googleSignIn();
      if (!result) throw new Error('No sign-in result');
      
      localStorage.setItem(TYPE_KEY, 'gdrive');
      if (result.user.email) {
        localStorage.setItem(EMAIL_KEY, result.user.email);
      }
      return result.user.email || 'Google Drive Sync Folder';
    } catch (err: any) {
      throw new Error('Failed to connect to Google Drive: ' + err.message);
    }
  }

  /**
   * Try to restore handle from IndexedDB or Google Drive session
   */
  static async restore(): Promise<{ name: string; needsPermission: boolean } | null> {
    const type = localStorage.getItem(TYPE_KEY);
    
    if (type === 'gdrive') {
      const email = localStorage.getItem(EMAIL_KEY) || 'Google Drive Workspace';
      const hasToken = GoogleDriveService.hasToken();
      return {
        name: `Google Drive (${email})`,
        needsPermission: !hasToken
      };
    }
    
    // Otherwise fallback to local
    const savedHandle = await get(STORAGE_KEY);
    if (savedHandle) {
      try {
        // Verify permission (it almost always returns 'prompt' on reload)
        const permission = await savedHandle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          this.handle = savedHandle;
          return { name: savedHandle.name, needsPermission: false };
        } else {
          return { name: savedHandle.name, needsPermission: true };
        }
      } catch (e) {
        await del(STORAGE_KEY);
      }
    }
    return null;
  }

  /**
   * Request permission for an existing handle (Local) or trigger Google popup (Drive)
   */
  static async requestPermission(): Promise<boolean> {
    const type = localStorage.getItem(TYPE_KEY);
    if (type === 'gdrive') {
      try {
        const result = await googleSignIn();
        return !!result;
      } catch {
        return false;
      }
    }

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

  static async disconnect() {
    this.handle = null;
    await del(STORAGE_KEY);
    const type = localStorage.getItem(TYPE_KEY);
    if (type === 'gdrive') {
      await logoutDrive();
    }
    localStorage.removeItem(TYPE_KEY);
    localStorage.removeItem(EMAIL_KEY);
  }

  /**
   * Core persistence methods
   */
  static async saveFile(fileName: string, content: ArrayBuffer | string) {
    const type = localStorage.getItem(TYPE_KEY);
    if (type === 'gdrive') {
      const mime = fileName.endsWith('.xlsx')
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/json; charset=UTF-8';
      await writeDriveFile(fileName, content, mime);
      return;
    }

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
    const type = localStorage.getItem(TYPE_KEY);
    if (type === 'gdrive') {
      return await readDriveFile(fileName);
    }

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
  static async syncData(key: 'invoices' | 'customers' | 'products' | 'businesses' | 'expenses', data: any[]) {
    const buffer = ExcelService.generateExcelBuffer(data, key);
    await this.saveFile(`${key}.xlsx`, buffer);
  }

  static async loadData<T>(key: 'invoices' | 'customers' | 'products' | 'businesses' | 'expenses'): Promise<T[]> {
    const buffer = await this.readFile(`${key}.xlsx`);
    if (!buffer || typeof buffer === 'string') return [];
    return ExcelService.parseExcelBuffer<T>(buffer);
  }

  static async saveSettings(settings: AppSettings & { profile?: BusinessProfile }) {
    if (settings.profile) {
      const buffer = ExcelService.generateExcelBuffer([settings.profile], 'profile');
      await this.saveFile('settings.xlsx', buffer);
    }
    
    await this.saveFile('config.json', JSON.stringify({ 
      theme: settings.theme, 
      accentColor: settings.accentColor, 
      density: settings.density,
      lastSync: Date.now() 
    }));
  }

  static async loadSettings(): Promise<(AppSettings & { profile: BusinessProfile }) | null> {
    const buffer = await this.readFile('settings.xlsx');
    if (!buffer || typeof buffer === 'string') return null;
    
    const profile = ExcelService.parseExcelBuffer<BusinessProfile>(buffer)[0];
    const configText = await this.readFile('config.json');
    let config: AppSettings = { 
      theme: 'dark', 
      accentColor: '#FF4444', 
      density: 'comfortable', 
      language: 'en', 
      currencyDefault: 'INR', 
      autoBackup: true 
    };
    
    if (configText && typeof configText === 'string') {
      try { 
        const parsed = JSON.parse(configText); 
        config = { ...config, ...parsed };
      } catch {}
    }

    if (profile) {
      return { ...config, profile };
    }
    return null;
  }
}

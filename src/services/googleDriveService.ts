import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive');

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let activeFolderId: string | null = null;

// Initialize Auth listener
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      activeFolderId = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Initiate Google Sign In
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get Google Access Token');
    }
    cachedAccessToken = credential.accessToken;
    
    // Auto find or create the workspace folder
    activeFolderId = await getOrCreateWorkspaceFolder(cachedAccessToken);
    
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign-in to Google Drive workspace failed', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutDrive = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  activeFolderId = null;
};

// Find or Create 'NovaBill Workspace' on Drive
export const getOrCreateWorkspaceFolder = async (token: string): Promise<string> => {
  if (activeFolderId) return activeFolderId;
  
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.folder' and name='NovaBill Workspace' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,owners)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error('Search failed: ' + res.statusText);
    }
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      activeFolderId = data.files[0].id;
      return activeFolderId!;
    }
    
    // Create folder
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'NovaBill Workspace',
        mimeType: 'application/vnd.google-apps.folder',
        description: 'NovaBill Shared Excel and Configuration Sync Workspace'
      })
    });
    if (!createRes.ok) {
      throw new Error('Create folder failed: ' + createRes.statusText);
    }
    const folderData = await createRes.json();
    activeFolderId = folderData.id;
    return activeFolderId!;
  } catch (error) {
    console.error('getOrCreateWorkspaceFolder error', error);
    throw error;
  }
};

// Read a file from the Google Drive workspace folder
export const readDriveFile = async (fileName: string): Promise<ArrayBuffer | string | null> => {
  if (!cachedAccessToken) throw new Error('No Google Drive authorization');
  const folderId = await getOrCreateWorkspaceFolder(cachedAccessToken);
  
  const query = encodeURIComponent(`'${folderId}' in parents and name='${fileName}' and trashed=false`);
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
  
  try {
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${cachedAccessToken}` }
    });
    if (!listRes.ok) return null;
    const listData = await listRes.json();
    const file = listData.files && listData.files[0];
    if (!file) return null;
    
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
    const downloadRes = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${cachedAccessToken}` }
    });
    if (!downloadRes.ok) {
      if (downloadRes.status === 404) return null;
      throw new Error(`Failed to download ${fileName}: ` + downloadRes.statusText);
    }
    
    if (fileName.endsWith('.json')) {
      return await downloadRes.text();
    }
    return await downloadRes.arrayBuffer();
  } catch (err) {
    console.error(`Error reading ${fileName} from Drive:`, err);
    return null;
  }
};

// Write a file to the Google Drive workspace folder
export const writeDriveFile = async (fileName: string, content: ArrayBuffer | string, mimeType: string): Promise<void> => {
  if (!cachedAccessToken) throw new Error('No Google Drive authorization');
  const folderId = await getOrCreateWorkspaceFolder(cachedAccessToken);
  
  const query = encodeURIComponent(`'${folderId}' in parents and name='${fileName}' and trashed=false`);
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`;
  
  try {
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${cachedAccessToken}` }
    });
    if (!listRes.ok) throw new Error('Failed directory listing');
    const listData = await listRes.json();
    const existingFile = listData.files && listData.files[0];
    
    let fileId = '';
    if (existingFile) {
      fileId = existingFile.id;
    } else {
      // Create metadata first
      const metadataRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fileName,
          parents: [folderId]
        })
      });
      if (!metadataRes.ok) {
        throw new Error(`Failed to create metadata for ${fileName}`);
      }
      const mData = await metadataRes.json();
      fileId = mData.id;
    }
    
    // Upload media payload
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${cachedAccessToken}`,
        'Content-Type': mimeType
      },
      body: content
    });
    
    if (!uploadRes.ok) {
      throw new Error(`Failed payload sync for ${fileName}`);
    }
  } catch (err) {
    console.error(`Error writing ${fileName} to Drive:`, err);
    throw err;
  }
};

export class GoogleDriveService {
  static isDriveActive(): boolean {
    return localStorage.getItem('novabill_workspace_type') === 'gdrive';
  }
  
  static hasToken(): boolean {
    return !!cachedAccessToken;
  }
  
  static getCachedUserEmail(): string | null {
    return auth.currentUser?.email || null;
  }
}

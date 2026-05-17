import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderPlus, 
  FolderOpen, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink,
  Loader2, 
  Settings,
  HardDrive,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const WorkspaceGuardian: React.FC = () => {
  const { 
    workspaceConnected, 
    workspaceName, 
    needsPermission, 
    connectWorkspace, 
    requestWorkspacePermission,
    isLoading 
  } = useStore();

  if (isLoading) return null;

  const isIframe = window.self !== window.top;

  return (
    <AnimatePresence>
      {!workspaceConnected && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,68,68,0.15),transparent_70%)]" />
          
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full max-w-lg glass border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
          >
            <div className="p-8 space-y-8 text-center">
              <div className="mx-auto w-20 h-20 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_40px_rgba(255,68,68,0.2)]">
                <HardDrive size={40} />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight">
                  {isIframe ? 'Open in New Tab' : 'Setup Workspace'}
                </h1>
                <p className="text-muted text-sm max-w-xs mx-auto">
                  {isIframe 
                    ? 'To access your local Excel files, please open this app in a new window using the button in the top right corner.' 
                    : 'NovaBill stores all your data directly on your computer in Excel files for maximum privacy and portability.'}
                </p>
              </div>

              {isIframe ? (
                <div className="p-6 glass border border-primary/20 rounded-3xl bg-primary/5 space-y-4">
                  <div className="flex items-center justify-center gap-3 text-primary">
                    <ExternalLink size={24} />
                    <span className="font-bold">Browser Restriction</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Local file system access is protected by the browser and cannot be initiated inside a preview frame. 
                    Click the <strong>"Open in New Tab"</strong> icon on the top right of this preview.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={connectWorkspace}
                    className="group flex items-center justify-between p-6 glass border border-white/5 rounded-3xl hover:bg-white/5 hover:border-primary/30 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <FolderPlus size={24} />
                      </div>
                      <div>
                        <p className="font-bold">Create Workspace</p>
                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">New Folder</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted group-hover:text-primary">
                      <CheckCircle2 size={16} />
                    </div>
                  </button>

                  <button 
                    onClick={connectWorkspace}
                    className="group flex items-center justify-between p-6 glass border border-white/5 rounded-3xl hover:bg-white/5 hover:border-white/10 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted group-hover:text-white transition-all">
                        <FolderOpen size={24} />
                      </div>
                      <div>
                        <p className="font-bold">Open Existing Workspace</p>
                        <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Reconnect Folder</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted">
                      <CheckCircle2 size={16} />
                    </div>
                  </button>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
                <ShieldAlert size={12} />
                <span>Local Only • No Cloud Uploads</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {workspaceConnected && needsPermission && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-md glass border border-amber-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Permission Required</h2>
              <p className="text-sm text-muted">
                The browser requires your permission to reconnect to <strong>{workspaceName}</strong>. 
                This happens after a page refresh for security.
              </p>
            </div>
            <button 
              onClick={requestWorkspacePermission}
              className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} />
              Grant Write Access
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SaveIndicator: React.FC = () => {
  const isSaving = useStore((state) => state.isSaving);
  const workspaceConnected = useStore((state) => state.workspaceConnected);

  if (!workspaceConnected) return null;

  return (
    <AnimatePresence>
      {isSaving ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-2 px-3 py-1.5 glass border border-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-muted"
        >
          <Loader2 size={12} className="animate-spin text-primary" />
          Syncing to Excel
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-500/50"
        >
          <FileSpreadsheet size={12} />
          Synced
        </motion.div>
      )}
    </AnimatePresence>
  );
};

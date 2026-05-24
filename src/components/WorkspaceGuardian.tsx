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
  AlertCircle,
  Cloud,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../store/useStore';

export const WorkspaceGuardian: React.FC = () => {
  const { 
    workspaceConnected, 
    workspaceName, 
    workspaceError,
    needsPermission, 
    connectWorkspace, 
    connectDriveWorkspace,
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/95 backdrop-blur-md overflow-y-auto"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,68,68,0.1),transparent_70%)]" />
          
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full max-w-2xl glass border border-white/10 rounded-[32px] overflow-hidden shadow-2xl my-8"
          >
            <div className="p-8 space-y-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-[20px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_40px_rgba(255,68,68,0.15)]">
                <HardDrive size={32} />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight">
                  Setup Workspace Shared Storage
                </h1>
                <p className="text-muted text-sm max-w-md mx-auto">
                  NovaBill keeps your operations completely portable. Select your preferred storage location below.
                </p>
              </div>

              {workspaceError && (
                <div className="flex flex-col gap-3 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-left">
                  <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                    <AlertCircle size={14} />
                    <span>Connection Attempt Delayed</span>
                  </div>
                  <p className="text-xs text-red-100/85 leading-relaxed whitespace-pre-line">
                    {workspaceError}
                  </p>
                  
                  <div className="flex items-center justify-end pt-2 border-t border-white/5">
                    <a 
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 active:scale-95 text-[10px] text-white font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                      <span>Authorize In New Tab</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {/* Option 1: Google Drive (Allows Multi-User Collaboration) */}
                <div className="flex flex-col justify-space-between p-6 glass border border-primary/20 bg-primary/[0.02] rounded-3xl space-y-6 hover:border-primary/40 transition-all">
                  <div className="space-y-3 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Cloud size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Google Drive Cloud Workspace</h3>
                      <p className="text-[10px] text-primary uppercase tracking-widest font-black mt-0.5">Recommended for teams</p>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Syncs automatically to a secure spreadsheet folder in Google Drive. 
                      <strong className="text-white/90"> Share this folder on Google Drive</strong> with others to collaborate together in real-time, completely serverless!
                    </p>
                  </div>
                  <button 
                    onClick={connectDriveWorkspace}
                    className="w-full py-3.5 px-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 cursor-pointer"
                  >
                    <span>Connect Google Drive</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Option 2: Local File System Directory */}
                <div className="flex flex-col justify-space-between p-6 glass border border-white/5 rounded-3xl space-y-6 hover:border-white/10 transition-all">
                  <div className="space-y-3 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted">
                      <FolderOpen size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Local Folders Workspace</h3>
                      <p className="text-[10px] text-muted uppercase tracking-widest font-bold mt-0.5">Secure Offline Only</p>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Saves spreadsheets directory onto your personal hard drive. Best for ultra-private setups. No cloud files created.
                    </p>
                  </div>

                  {isIframe ? (
                    <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                        <ArrowRight size={10} /> Browser Restriction
                      </p>
                      <p className="text-[10px] text-muted leading-relaxed">
                        To connect a local folder, click <strong>"Open in New Tab"</strong> in the top-right corner because of iframe restrictions.
                      </p>
                    </div>
                  ) : (
                    <button 
                      onClick={connectWorkspace}
                      className="w-full py-3.5 px-4 bg-white/10 border border-white/10 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Connect Local Folder</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-muted uppercase tracking-[0.2em] border-t border-white/5">
                <ShieldAlert size={12} />
                <span>Zero Database Backend Required • Portable XLSX Architecture</span>
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
              <p className="text-sm text-muted animate-pulse">
                Reconnect token is required to secure your storage folder for <strong>{workspaceName}</strong>.
              </p>
            </div>

            {workspaceError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left text-xs text-red-100/80 space-y-3">
                <p className="font-bold flex items-center gap-1.5 text-red-500">
                  <AlertCircle size={12} /> Reauthorization Interrupted
                </p>
                <p className="text-[11px] leading-relaxed whitespace-pre-line">
                  {workspaceError}
                </p>
                {isIframe && (
                  <div className="flex justify-end border-t border-white/5 pt-2">
                    <a 
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] text-white font-black uppercase tracking-widest rounded-lg transition-all"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={requestWorkspacePermission}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-wider py-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 size={20} />
              Reauthorize Workspace Connection
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

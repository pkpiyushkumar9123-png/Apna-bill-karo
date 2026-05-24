import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, CloudLightning, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

export const GoogleDriveSyncIndicator: React.FC = () => {
  const workspaceConnected = useStore((state) => state.workspaceConnected);
  const needsPermission = useStore((state) => state.needsPermission);
  const gdriveSyncEnabled = useStore((state) => state.gdriveSyncEnabled);
  const isSyncingCloud = useStore((state) => state.isSyncingCloud);
  const lastSyncTime = useStore((state) => state.lastSyncTime);
  const lastSyncResult = useStore((state) => state.lastSyncResult);
  const syncCloudData = useStore((state) => state.syncCloudData);

  const [timeText, setTimeText] = useState('Recently');
  const isDriveActive = localStorage.getItem('novabill_workspace_type') === 'gdrive';

  useEffect(() => {
    if (!lastSyncTime) return;

    const updateTime = () => {
      const seconds = Math.floor((Date.now() - lastSyncTime) / 1000);
      if (seconds < 10) {
        setTimeText('Just now');
      } else if (seconds < 60) {
        setTimeText(`${seconds}s ago`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeText(`${minutes}m ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  if (!workspaceConnected || needsPermission || !isDriveActive) return null;

  const handleManualSync = async (e: React.MouseEvent) => {
    e.preventDefault();
    await syncCloudData(true);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Cloud Status Button */}
      <button
        onClick={handleManualSync}
        disabled={isSyncingCloud}
        title="Trigger manual cloud sync"
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/5 active:scale-95 text-[10px] font-black uppercase tracking-wider text-muted hover:text-white transition-all group shrink-0"
      >
        <div className="relative flex items-center justify-center">
          {isSyncingCloud ? (
            <RefreshCw size={12} className="animate-spin text-primary" />
          ) : !gdriveSyncEnabled ? (
            <CloudOff size={12} className="text-red-500" />
          ) : lastSyncResult === 'failed' ? (
            <CloudLightning size={12} className="text-amber-500" />
          ) : (
            <Cloud size={12} className="text-primary group-hover:scale-110 transition-transform" />
          )}
          
          {/* Small pulsing status light */}
          {gdriveSyncEnabled && !isSyncingCloud && (
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>

        <span className="hidden sm:inline-block">
          {isSyncingCloud ? (
            'Syncing...'
          ) : !gdriveSyncEnabled ? (
            'Cloud Sync Paused'
          ) : (
            <>
              Sync <span className="text-muted/50 font-medium">({timeText})</span>
            </>
          )}
        </span>
      </button>

      {/* Manual success badge */}
      <AnimatePresence>
        {lastSyncResult === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-green-500"
          >
            <Check size={12} className="animate-bounce" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Synced</span>
          </motion.div>
        )}
        {lastSyncResult === 'failed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-red-400"
          >
            <AlertCircle size={12} />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Sync Error</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

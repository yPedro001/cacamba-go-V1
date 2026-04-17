"use client"
import React, { useEffect } from 'react';
import { syncEngine } from '@/core/application/sync-engine';
import { useUsuarioAtual } from '@/store/useAppStore';

interface BackgroundSyncProviderProps {
  children: React.ReactNode;
}

/**
 * BackgroundSyncProvider: Ativa o motor de sincronização global.
 * Só executa se houver um usuário autenticado.
 */
export function BackgroundSyncProvider({ children }: BackgroundSyncProviderProps) {
  const usuario = useUsuarioAtual();

  useEffect(() => {
    if (usuario) {
      console.log('[SyncEngine] Iniciando motor de automação...');
      syncEngine.start();
    } else {
      syncEngine.stop();
    }

    return () => {
      syncEngine.stop();
    };
  }, [usuario]);

  return <>{children}</>;
}

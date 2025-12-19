import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, DEFAULT_CONFIG } from '../types';
import { getAppConfig, saveAppConfig, getDistributors, saveDistributor } from '../services/storageService';

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => Promise<{ success: boolean; message?: string }>;
  resetConfig: () => void;
  refreshConfig: () => Promise<{ success: boolean }>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const CONFIG_STORAGE_KEY = 'juguetes_app_config_v7';

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Load from LocalStorage AND Firebase
  const refreshConfig = async () => {
    try {
      const remoteConfig = await getAppConfig();
      let distributors = await getDistributors();

      // AUTO-MIGRATION: If no distributors in DB, upload defaults to make them public
      if (distributors.length === 0) {
        console.log("No public distributors found. Syncing defaults to cloud...");
        const defaults = DEFAULT_CONFIG.ticketDistributors;

        // Upload sequentially to avoid race conditions or potential duplicates checks failing
        for (const dist of defaults) {
          await saveDistributor(dist);
        }
        // Refetch after sync
        distributors = await getDistributors();
      }

      if (remoteConfig || distributors.length > 0) {
        setConfig(prev => {
          const merged = {
            ...prev,
            ...(remoteConfig || {}),
            ticketDistributors: distributors.length > 0 ? distributors : prev.ticketDistributors
          };
          // Update local cache too
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }
      return { success: true };
    } catch (error) {
      console.error("Error refreshing config", error);
      return { success: false };
    }
  };

  useEffect(() => {
    // 1. LocalStorage (Cache)
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      try {
        setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    }

    // 2. Firebase (Source of Truth)
    refreshConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    const updated = { ...config, ...newConfig }; // Use current config as base

    // 1. Optimistic Update (UI + LocalStorage)
    setConfig(updated);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));

    // 2. Persist to Cloud
    try {
      const result = await saveAppConfig(updated);
      if (!result.success) {
        console.error("Failed to save config to cloud:", result.message);
        // Optional: Revert state if critical, but for config usually keep local overrides or show error
      }
      return result;
    } catch (error) {
      console.error("Critical error saving config:", error);
      return { success: false, message: "Error de conexión al guardar." };
    }
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    // Also reset remote? Maybe not, safety first. User can manually re-save if they want.
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
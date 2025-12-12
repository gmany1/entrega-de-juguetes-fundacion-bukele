import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfig, DEFAULT_CONFIG } from '../types';
import { getAppConfig, saveAppConfig } from '../services/storageService';

interface ConfigContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const CONFIG_STORAGE_KEY = 'juguetes_app_config_v7';

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Load from LocalStorage AND Firebase
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
    const fetchRemoteConfig = async () => {
      const remoteConfig = await getAppConfig();
      if (remoteConfig) {
        setConfig(prev => {
          const merged = { ...prev, ...remoteConfig };
          // Update local cache too
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    };
    fetchRemoteConfig();
  }, []);

  const updateConfig = async (newConfig: Partial<AppConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updated));

      // Save globally
      saveAppConfig(updated).then(res => {
        if (!res.success) console.error("Failed to save config to cloud:", res.message);
      });

      return updated;
    });
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    // Also reset remote? Maybe not, safety first. User can manually re-save if they want.
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
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
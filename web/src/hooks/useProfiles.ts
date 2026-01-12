import { useState, useEffect } from 'react';
import type { ConnectionConfig } from '../types/connection';

export interface SessionProfile {
  id: string;
  name: string;
  config: ConnectionConfig;
  createdAt: string;
  lastUsed?: string;
}

const STORAGE_KEY = 'fluxterm_session_profiles';

export function useProfiles() {
  const [profiles, setProfiles] = useState<SessionProfile[]>([]);

  // Load profiles from localStorage on mount with migration support
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: old format (SerialConfig only) to new format (ConnectionConfig)
        const migrated = parsed.map((p: any) => {
          if (!p.config.type) {
            // Old format: assume serial and wrap in discriminated union
            return {
              ...p,
              config: { type: 'serial', config: p.config },
            };
          }
          return p;
        });
        setProfiles(migrated);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  }, []);

  // Save profiles to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    } catch (err) {
      console.error('Failed to save profiles:', err);
    }
  }, [profiles]);

  const saveProfile = (name: string, config: ConnectionConfig): SessionProfile => {
    const newProfile: SessionProfile = {
      id: Date.now().toString(),
      name,
      config,
      createdAt: new Date().toISOString(),
    };

    setProfiles((prev) => [...prev, newProfile]);
    return newProfile;
  };

  const updateProfile = (id: string, name: string, config: ConnectionConfig) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, name, config }
          : p
      )
    );
  };

  const deleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const updateLastUsed = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, lastUsed: new Date().toISOString() }
          : p
      )
    );
  };

  const getProfile = (id: string): SessionProfile | undefined => {
    return profiles.find((p) => p.id === id);
  };

  return {
    profiles,
    saveProfile,
    updateProfile,
    deleteProfile,
    updateLastUsed,
    getProfile,
  };
}

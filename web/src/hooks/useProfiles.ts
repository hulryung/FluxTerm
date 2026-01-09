import { useState, useEffect } from 'react';
import type { SerialConfig } from '../types/serial';

export interface SessionProfile {
  id: string;
  name: string;
  config: SerialConfig;
  createdAt: string;
  lastUsed?: string;
}

const STORAGE_KEY = 'goterm_session_profiles';

export function useProfiles() {
  const [profiles, setProfiles] = useState<SessionProfile[]>([]);

  // Load profiles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfiles(parsed);
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

  const saveProfile = (name: string, config: SerialConfig): SessionProfile => {
    const newProfile: SessionProfile = {
      id: Date.now().toString(),
      name,
      config,
      createdAt: new Date().toISOString(),
    };

    setProfiles((prev) => [...prev, newProfile]);
    return newProfile;
  };

  const updateProfile = (id: string, name: string, config: SerialConfig) => {
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

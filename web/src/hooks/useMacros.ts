import { useState, useEffect } from 'react';

export interface Macro {
  id: string;
  name: string;
  commands: string[];
  delay: number; // Delay between commands in ms
  description?: string;
  createdAt: string;
  lastUsed?: string;
}

const STORAGE_KEY = 'fluxterm_macros';

export function useMacros() {
  const [macros, setMacros] = useState<Macro[]>([]);

  // Load macros from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMacros(parsed);
      }
    } catch (err) {
      console.error('Failed to load macros:', err);
    }
  }, []);

  // Save macros to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(macros));
    } catch (err) {
      console.error('Failed to save macros:', err);
    }
  }, [macros]);

  const saveMacro = (name: string, commands: string[], delay: number, description?: string): Macro => {
    const newMacro: Macro = {
      id: Date.now().toString(),
      name,
      commands,
      delay,
      description,
      createdAt: new Date().toISOString(),
    };

    setMacros((prev) => [...prev, newMacro]);
    return newMacro;
  };

  const updateMacro = (id: string, updates: Partial<Omit<Macro, 'id' | 'createdAt'>>) => {
    setMacros((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, ...updates }
          : m
      )
    );
  };

  const deleteMacro = (id: string) => {
    setMacros((prev) => prev.filter((m) => m.id !== id));
  };

  const updateLastUsed = (id: string) => {
    setMacros((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, lastUsed: new Date().toISOString() }
          : m
      )
    );
  };

  const getMacro = (id: string): Macro | undefined => {
    return macros.find((m) => m.id === id);
  };

  return {
    macros,
    saveMacro,
    updateMacro,
    deleteMacro,
    updateLastUsed,
    getMacro,
  };
}

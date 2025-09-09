import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Initiative } from '../types/initiative';
import { initiativesAPI } from '../services/api';

interface InitiativesContextType {
  initiatives: Initiative[];
  isLoading: boolean;
  error: string | null;
  fetchInitiatives: () => Promise<void>;
  createInitiative: (initiative: Omit<Initiative, 'id' | 'created_at' | 'updated_at'>) => Promise<Initiative>;
  updateInitiative: (id: string, updates: Partial<Initiative>) => Promise<Initiative>;
  deleteInitiative: (id: string) => Promise<void>;
  getInitiative: (id: string) => Initiative | null;
}

const InitiativesContext = createContext<InitiativesContextType | undefined>(undefined);

export function useInitiatives() {
  const context = useContext(InitiativesContext);
  if (context === undefined) {
    throw new Error('useInitiatives must be used within an InitiativesProvider');
  }
  return context;
}

interface InitiativesProviderProps {
  children: React.ReactNode;
}

export function InitiativesProvider({ children }: InitiativesProviderProps) {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitiatives = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedInitiatives = await initiativesAPI.getAll();
      setInitiatives(fetchedInitiatives);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch initiatives');
      console.error('Error fetching initiatives:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createInitiative = useCallback(async (initiativeData: Omit<Initiative, 'id' | 'created_at' | 'updated_at'>): Promise<Initiative> => {
    setIsLoading(true);
    try {
      const newInitiative = await initiativesAPI.create(initiativeData);
      setInitiatives(prev => [...prev, newInitiative]);
      return newInitiative;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create initiative');
      console.error('Error creating initiative:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateInitiative = useCallback(async (id: string, updates: Partial<Initiative>): Promise<Initiative> => {
    setIsLoading(true);
    try {
      const updatedInitiative = await initiativesAPI.update(id, updates);
      setInitiatives(prev => 
        prev.map(init => 
          init.id === id ? updatedInitiative : init
        )
      );
      return updatedInitiative;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update initiative');
      console.error('Error updating initiative:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteInitiative = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      await initiativesAPI.delete(id);
      setInitiatives(prev => prev.filter(init => init.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete initiative');
      console.error('Error deleting initiative:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getInitiative = useCallback((id: string): Initiative | null => {
    return initiatives.find(init => init.id === id) || null;
  }, [initiatives]);

  return (
    <InitiativesContext.Provider value={{
      initiatives,
      isLoading,
      error,
      fetchInitiatives,
      createInitiative,
      updateInitiative,
      deleteInitiative,
      getInitiative,
    }}>
      {children}
    </InitiativesContext.Provider>
  );
}
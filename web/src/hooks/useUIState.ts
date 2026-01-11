import { useState } from 'react';

export type SidebarView = 'connection' | 'profiles' | 'macros' | 'logs' | 'files' | 'settings';
export type AutomationTab = 'profiles' | 'macros';

interface UIState {
  showCommandPalette: boolean;
  showConnectionPanel: boolean;
  showAutomationPanel: boolean;
  activeAutomationTab: AutomationTab;
  activeSidebarView: SidebarView | null;
}

export function useUIState() {
  const [uiState, setUIState] = useState<UIState>({
    showCommandPalette: false,
    showConnectionPanel: false,
    showAutomationPanel: false,
    activeAutomationTab: 'profiles',
    activeSidebarView: null,
  });

  const toggleCommandPalette = () => {
    setUIState((prev) => ({
      ...prev,
      showCommandPalette: !prev.showCommandPalette,
    }));
  };

  const openCommandPalette = () => {
    setUIState((prev) => ({
      ...prev,
      showCommandPalette: true,
    }));
  };

  const closeCommandPalette = () => {
    setUIState((prev) => ({
      ...prev,
      showCommandPalette: false,
    }));
  };

  const toggleConnectionPanel = () => {
    setUIState((prev) => ({
      ...prev,
      showConnectionPanel: !prev.showConnectionPanel,
      showAutomationPanel: false, // Close automation panel when opening connection
    }));
  };

  const openConnectionPanel = () => {
    setUIState((prev) => ({
      ...prev,
      showConnectionPanel: true,
      showAutomationPanel: false,
    }));
  };

  const closeConnectionPanel = () => {
    setUIState((prev) => ({
      ...prev,
      showConnectionPanel: false,
    }));
  };

  const toggleAutomationPanel = (tab?: AutomationTab) => {
    setUIState((prev) => ({
      ...prev,
      showAutomationPanel: !prev.showAutomationPanel,
      showConnectionPanel: false, // Close connection panel when opening automation
      activeAutomationTab: tab || prev.activeAutomationTab,
    }));
  };

  const openAutomationPanel = (tab: AutomationTab) => {
    setUIState((prev) => ({
      ...prev,
      showAutomationPanel: true,
      showConnectionPanel: false,
      activeAutomationTab: tab,
    }));
  };

  const closeAutomationPanel = () => {
    setUIState((prev) => ({
      ...prev,
      showAutomationPanel: false,
    }));
  };

  const setAutomationTab = (tab: AutomationTab) => {
    setUIState((prev) => ({
      ...prev,
      activeAutomationTab: tab,
    }));
  };

  const setSidebarView = (view: SidebarView | null) => {
    setUIState((prev) => {
      // If clicking the same view, deselect it
      if (prev.activeSidebarView === view) {
        return {
          ...prev,
          activeSidebarView: null,
          showConnectionPanel: false,
          showAutomationPanel: false,
        };
      }

      // Handle different views
      if (view === 'connection') {
        return {
          ...prev,
          activeSidebarView: view,
          showConnectionPanel: true,
          showAutomationPanel: false,
        };
      } else if (view === 'profiles') {
        return {
          ...prev,
          activeSidebarView: view,
          showAutomationPanel: true,
          showConnectionPanel: false,
          activeAutomationTab: 'profiles',
        };
      } else if (view === 'macros') {
        return {
          ...prev,
          activeSidebarView: view,
          showAutomationPanel: true,
          showConnectionPanel: false,
          activeAutomationTab: 'macros',
        };
      }

      return {
        ...prev,
        activeSidebarView: view,
      };
    });
  };

  const closeAllPanels = () => {
    setUIState((prev) => ({
      ...prev,
      showCommandPalette: false,
      showConnectionPanel: false,
      showAutomationPanel: false,
      activeSidebarView: null,
    }));
  };

  return {
    ...uiState,
    toggleCommandPalette,
    openCommandPalette,
    closeCommandPalette,
    toggleConnectionPanel,
    openConnectionPanel,
    closeConnectionPanel,
    toggleAutomationPanel,
    openAutomationPanel,
    closeAutomationPanel,
    setAutomationTab,
    setSidebarView,
    closeAllPanels,
  };
}

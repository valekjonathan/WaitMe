import React, { createContext, useContext, useState, useCallback } from 'react';

const LayoutContext = createContext(null);

export function LayoutProvider({ children }) {
  const [headerConfig, setHeaderConfig] = useState({
    title: 'WaitMe!',
    showBackButton: false,
    backTo: null,
    onBack: null,
    onTitleClick: null,
    titleClassName: 'text-[24px] leading-[24px]',
  });
  const [profileFormData, setProfileFormData] = useState(null);

  const setHeader = useCallback((config) => {
    setHeaderConfig((prev) => ({ ...prev, ...config }));
  }, []);

  return (
    <LayoutContext.Provider value={{ headerConfig, setHeader, profileFormData, setProfileFormData }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutHeader() {
  const ctx = useContext(LayoutContext);
  return ctx?.setHeader ?? (() => {});
}

export function useLayoutHeaderConfig() {
  const ctx = useContext(LayoutContext);
  return ctx?.headerConfig ?? {};
}

export function useSetProfileFormData() {
  const ctx = useContext(LayoutContext);
  return ctx?.setProfileFormData ?? (() => {});
}

import React from 'react';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export default SmoothScrollProvider;

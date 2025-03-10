import React, { useCallback } from 'react';
import { trackSearch } from '../lib/analytics';

interface SearchAnalyticsWrapperProps {
  children: React.ReactNode | ((props: { trackSearchQuery: (query: string, filters: any, resultsCount: number) => void }) => React.ReactNode);
}

const SearchAnalyticsWrapper: React.FC<SearchAnalyticsWrapperProps> = ({ children }) => {
  const trackSearchQuery = useCallback((query: string, filters: any, resultsCount: number) => {
    trackSearch(query, filters, resultsCount);
  }, []);

  if (typeof children === 'function') {
    return <>{children({ trackSearchQuery })}</>;
  }

  return <>{children}</>;
};

export default SearchAnalyticsWrapper;

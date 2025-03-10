import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackSessionStart, trackPageView, trackClick } from '../lib/analytics';

interface AnalyticsTrackerProps {
  children: React.ReactNode;
}

const AnalyticsTracker: React.FC<AnalyticsTrackerProps> = ({ children }) => {
  const location = useLocation();

  // Track session and initial page view on component mount
  useEffect(() => {
    const initializeAnalytics = async () => {
      await trackSessionStart();
      await trackPageView(location.pathname + location.search, document.title);
    };

    initializeAnalytics();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  // Set up global click tracking
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Only track interactive elements for better data quality
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button' ||
        target.classList.contains('clickable')
      ) {
        // Get closest trackable element if needed
        const trackableElement = 
          target.tagName === 'BUTTON' || target.tagName === 'A' 
            ? target 
            : (target.closest('button') || target.closest('a'));
        
        if (trackableElement) {
          const elementType = trackableElement.tagName.toLowerCase();
          const elementId = trackableElement.id || 'unknown';
          const elementText = trackableElement.textContent?.trim() || '';
          
          trackClick(elementType, elementId, elementText, location.pathname);
        }
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [location.pathname]);

  return <>{children}</>;
};

export default AnalyticsTracker;

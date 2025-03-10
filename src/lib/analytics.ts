import { db } from './firebase';
import { collection, addDoc, serverTimestamp, updateDoc, increment, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getSessionId, getDeviceInfo } from './tokens';
import { getAuth } from 'firebase/auth';

// Analytics collections
const ANALYTICS = {
  SESSIONS: 'analyticsUserSessions',
  PAGEVIEWS: 'analyticsPageviews',
  SEARCHES: 'analyticsSearches',
  CLICKS: 'analyticsClicks',
  ERRORS: 'analyticsErrors',
  METRICS: 'analyticsMetrics'
};

/**
 * Track session start for both authenticated and non-authenticated users
 */
export const trackSessionStart = async () => {
  try {
    const auth = getAuth();
    const sessionId = getSessionId();
    const deviceInfo = getDeviceInfo();
    const isAuthenticated = !!auth.currentUser;
    
    // Create session document
    await addDoc(collection(db, ANALYTICS.SESSIONS), {
      sessionId,
      userId: auth.currentUser?.uid || null,
      userEmail: auth.currentUser?.email || null,
      isAuthenticated,
      deviceInfo,
      startTime: serverTimestamp(),
      lastActiveTime: serverTimestamp(),
      pageviews: 0,
      searches: 0, 
      clicks: 0,
      errors: 0
    });

    // Increment daily active users metric
    const dailyActiveKey = new Date().toISOString().split('T')[0];
    const dailyMetricsQuery = query(
      collection(db, ANALYTICS.METRICS),
      where('date', '==', dailyActiveKey)
    );
    
    const metricsSnapshot = await getDocs(dailyMetricsQuery);
    
    if (metricsSnapshot.empty) {
      await addDoc(collection(db, ANALYTICS.METRICS), {
        date: dailyActiveKey,
        dailyActiveUsers: 1,
        dailyPageviews: 0,
        dailySearches: 0,
        dailyClicks: 0,
        dailyErrors: 0
      });
    } else {
      const docRef = metricsSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        dailyActiveUsers: increment(1)
      });
    }
    
    return sessionId;
  } catch (error) {
    console.error('Error tracking session start:', error);
    // Silent fail to not disrupt user experience
    return getSessionId();
  }
};

/**
 * Track page view for analytics
 */
export const trackPageView = async (path: string, title: string) => {
  try {
    const auth = getAuth();
    const sessionId = getSessionId();
    
    // Record pageview
    await addDoc(collection(db, ANALYTICS.PAGEVIEWS), {
      sessionId,
      userId: auth.currentUser?.uid || null,
      path,
      title,
      timestamp: serverTimestamp()
    });
    
    // Update session last active time and increment pageviews
    const sessionsQuery = query(
      collection(db, ANALYTICS.SESSIONS),
      where('sessionId', '==', sessionId),
      orderBy('startTime', 'desc'),
      limit(1)
    );
    
    const sessionSnapshot = await getDocs(sessionsQuery);
    
    if (!sessionSnapshot.empty) {
      const sessionRef = sessionSnapshot.docs[0].ref;
      await updateDoc(sessionRef, {
        lastActiveTime: serverTimestamp(),
        pageviews: increment(1)
      });
    }

    // Update daily metrics
    const dailyActiveKey = new Date().toISOString().split('T')[0];
    const dailyMetricsQuery = query(
      collection(db, ANALYTICS.METRICS),
      where('date', '==', dailyActiveKey)
    );
    
    const metricsSnapshot = await getDocs(dailyMetricsQuery);
    
    if (!metricsSnapshot.empty) {
      const docRef = metricsSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        dailyPageviews: increment(1)
      });
    }
  } catch (error) {
    console.error('Error tracking pageview:', error);
    // Silent fail to not disrupt user experience
  }
};

/**
 * Track search query
 */
export const trackSearch = async (searchQuery: string, filters: any, resultsCount: number) => {
  try {
    const auth = getAuth();
    const sessionId = getSessionId();
    
    // Record search
    await addDoc(collection(db, ANALYTICS.SEARCHES), {
      sessionId,
      userId: auth.currentUser?.uid || null,
      searchQuery,
      filters,
      resultsCount,
      timestamp: serverTimestamp()
    });
    
    // Update session last active time and increment searches
    const sessionsQuery = query(
      collection(db, ANALYTICS.SESSIONS),
      where('sessionId', '==', sessionId),
      orderBy('startTime', 'desc'),
      limit(1)
    );
    
    const sessionSnapshot = await getDocs(sessionsQuery);
    
    if (!sessionSnapshot.empty) {
      const sessionRef = sessionSnapshot.docs[0].ref;
      await updateDoc(sessionRef, {
        lastActiveTime: serverTimestamp(),
        searches: increment(1)
      });
    }

    // Update daily metrics
    const dailyActiveKey = new Date().toISOString().split('T')[0];
    const dailyMetricsQuery = query(
      collection(db, ANALYTICS.METRICS),
      where('date', '==', dailyActiveKey)
    );
    
    const metricsSnapshot = await getDocs(dailyMetricsQuery);
    
    if (!metricsSnapshot.empty) {
      const docRef = metricsSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        dailySearches: increment(1)
      });
    }
  } catch (error) {
    console.error('Error tracking search:', error);
    // Silent fail to not disrupt user experience
  }
};

/**
 * Track user click events
 */
export const trackClick = async (elementType: string, elementId: string, elementText: string, path: string) => {
  try {
    const auth = getAuth();
    const sessionId = getSessionId();
    
    // Record click
    await addDoc(collection(db, ANALYTICS.CLICKS), {
      sessionId,
      userId: auth.currentUser?.uid || null,
      elementType,
      elementId,
      elementText,
      path,
      timestamp: serverTimestamp()
    });
    
    // Update session last active time and increment clicks
    const sessionsQuery = query(
      collection(db, ANALYTICS.SESSIONS),
      where('sessionId', '==', sessionId),
      orderBy('startTime', 'desc'),
      limit(1)
    );
    
    const sessionSnapshot = await getDocs(sessionsQuery);
    
    if (!sessionSnapshot.empty) {
      const sessionRef = sessionSnapshot.docs[0].ref;
      await updateDoc(sessionRef, {
        lastActiveTime: serverTimestamp(),
        clicks: increment(1)
      });
    }

    // Update daily metrics
    const dailyActiveKey = new Date().toISOString().split('T')[0];
    const dailyMetricsQuery = query(
      collection(db, ANALYTICS.METRICS),
      where('date', '==', dailyActiveKey)
    );
    
    const metricsSnapshot = await getDocs(dailyMetricsQuery);
    
    if (!metricsSnapshot.empty) {
      const docRef = metricsSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        dailyClicks: increment(1)
      });
    }
  } catch (error) {
    console.error('Error tracking click:', error);
    // Silent fail to not disrupt user experience
  }
};

/**
 * Track errors for monitoring
 */
export const trackError = async (errorMessage: string, errorStack: string, componentName: string, errorType: string) => {
  try {
    const auth = getAuth();
    const sessionId = getSessionId();
    const deviceInfo = getDeviceInfo();
    
    // Record error
    await addDoc(collection(db, ANALYTICS.ERRORS), {
      sessionId,
      userId: auth.currentUser?.uid || null,
      errorMessage,
      errorStack,
      componentName,
      errorType,
      path: window.location.pathname,
      deviceInfo,
      timestamp: serverTimestamp()
    });
    
    // Update session last active time and increment errors
    const sessionsQuery = query(
      collection(db, ANALYTICS.SESSIONS),
      where('sessionId', '==', sessionId),
      orderBy('startTime', 'desc'),
      limit(1)
    );
    
    const sessionSnapshot = await getDocs(sessionsQuery);
    
    if (!sessionSnapshot.empty) {
      const sessionRef = sessionSnapshot.docs[0].ref;
      await updateDoc(sessionRef, {
        lastActiveTime: serverTimestamp(),
        errors: increment(1)
      });
    }

    // Update daily metrics
    const dailyActiveKey = new Date().toISOString().split('T')[0];
    const dailyMetricsQuery = query(
      collection(db, ANALYTICS.METRICS),
      where('date', '==', dailyActiveKey)
    );
    
    const metricsSnapshot = await getDocs(dailyMetricsQuery);
    
    if (!metricsSnapshot.empty) {
      const docRef = metricsSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        dailyErrors: increment(1)
      });
    }
  } catch (error) {
    console.error('Error tracking application error:', error);
    // Silent fail to not disrupt user experience
  }
};

/**
 * Get analytics data for admin dashboard
 */
export const getAnalyticsData = async (period: '24h' | '7d' | '30d') => {
  try {
    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    if (period === '24h') {
      startDate.setDate(endDate.getDate() - 1);
    } else if (period === '7d') {
      startDate.setDate(endDate.getDate() - 7);
    } else {
      startDate.setDate(endDate.getDate() - 30);
    }
    
    // Fetch session data
    const sessionsQuery = query(
      collection(db, ANALYTICS.SESSIONS),
      where('startTime', '>=', startDate),
      where('startTime', '<=', endDate),
      orderBy('startTime', 'desc')
    );
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Fetch search data
    const searchesQuery = query(
      collection(db, ANALYTICS.SEARCHES),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    );
    
    const searchesSnapshot = await getDocs(searchesQuery);
    const searches = searchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Fetch error data
    const errorsQuery = query(
      collection(db, ANALYTICS.ERRORS),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    );
    
    const errorsSnapshot = await getDocs(errorsQuery);
    const errors = errorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Fetch click data (limit to last 1000 for performance)
    const clicksQuery = query(
      collection(db, ANALYTICS.CLICKS),
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc'),
      limit(1000)
    );
    
    const clicksSnapshot = await getDocs(clicksQuery);
    const clicks = clicksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      sessions,
      searches,
      errors,
      clicks,
      metrics: {
        totalSessions: sessions.length,
        uniqueUsers: new Set(sessions.map(s => s.userId || s.sessionId)).size,
        totalSearches: searches.length,
        totalErrors: errors.length,
        topSearches: getTopSearches(searches),
        errorCategories: categorizeErrors(errors),
        conversionRate: calculateConversionRate(sessions)
      }
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};

// Helper functions for analytics metrics
const getTopSearches = (searches: any[]) => {
  const searchCounts: Record<string, number> = {};
  
  searches.forEach(search => {
    const query = search.searchQuery.toLowerCase();
    searchCounts[query] = (searchCounts[query] || 0) + 1;
  });
  
  return Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term, count]) => ({ term, count }));
};

const categorizeErrors = (errors: any[]) => {
  const categories: Record<string, number> = {};
  
  errors.forEach(error => {
    const category = error.errorType || 'uncategorized';
    categories[category] = (categories[category] || 0) + 1;
  });
  
  return Object.entries(categories)
    .map(([category, count]) => ({ category, count }));
};

const calculateConversionRate = (sessions: any[]) => {
  if (sessions.length === 0) return 0;
  
  const completedGoals = sessions.filter(s => s.completedGoal).length;
  return (completedGoals / sessions.length) * 100;
};

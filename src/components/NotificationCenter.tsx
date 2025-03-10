import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, Timestamp, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Bell, Users, MessageSquare, Calendar, AlertCircle, CheckCircle, Search, MousePointer, 
  Trash2, RefreshCw, Filter, Eye, ArrowUp, ArrowDown
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'error' | 'search' | 'session' | 'click' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  details?: any;
  read: boolean;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(20);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time listener for new notifications
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // Get notifications from the last 24h
    
    const notificationsRef = collection(db, 'analyticsNotifications');
    const q = query(
      notificationsRef,
      where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate()
        } as Notification;
      });
      
      setNotifications(newNotifications);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to notifications:', err);
      setError('Virhe ilmoitusten seurannassa');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const notificationsRef = collection(db, 'analyticsNotifications');
      const q = query(
        notificationsRef,
        orderBy('timestamp', sortOrder),
        limit(100) // Limit to prevent performance issues
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedNotifications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as Notification;
      });
      
      setNotifications(fetchedNotifications);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Virhe ilmoitusten latauksessa');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  const getFilteredNotifications = () => {
    if (filterType === 'all') {
      return notifications;
    }
    return notifications.filter(notification => notification.type === filterType);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'search':
        return <Search className="h-5 w-5 text-blue-500" />;
      case 'session':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'click':
        return <MousePointer className="h-5 w-5 text-purple-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-yellow-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const displayedNotifications = filteredNotifications.slice(0, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ilmoituskeskus</h2>
        
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Kaikki ilmoitukset</option>
            <option value="error">Virheet</option>
            <option value="search">Haut</option>
            <option value="session">Käyttäjät</option>
            <option value="click">Klikkaukset</option>
            <option value="system">Järjestelmä</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="p-2 bg-white rounded-lg hover:bg-gray-50"
          >
            {sortOrder === 'desc' ? (
              <ArrowDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ArrowUp className="h-5 w-5 text-gray-500" />
            )}
          </button>
          
          <button
            onClick={handleRefresh}
            className="p-2 bg-white rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">Viimeisimmät ilmoitukset</h3>
          <span className="text-sm text-gray-500">
            Päivitetty: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Virhe ilmoitusten latauksessa</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Kokeile uudelleen
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ei ilmoituksia</h3>
            <p className="text-gray-500">Sinulla ei ole tällä hetkellä ilmoituksia.</p>
          </div>
        ) : (
          <div>
            <ul className="divide-y divide-gray-200">
              {displayedNotifications.map((notification) => (
                <li key={notification.id} className={`hover:bg-gray-50 transition-colors duration-150
                  ${notification.read ? '' : 'bg-blue-50'}`}
                >
                  <div className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {notification.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        
                        {notification.details && (
                          <div className="mt-2">
                            <details className="text-xs">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                Näytä lisätiedot
                              </summary>
                              <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700 overflow-auto max-h-40">
                                <pre>{JSON.stringify(notification.details, null, 2)}</pre>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0 flex">
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          <span className="sr-only">Näytä</span>
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          className="ml-2 rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          <span className="sr-only">Poista</span>
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {filteredNotifications.length > pageSize && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-center">
                <button
                  onClick={() => setPageSize(prevPageSize => prevPageSize + 20)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Näytä lisää
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;

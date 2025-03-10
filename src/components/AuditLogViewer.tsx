import React, { useState, useEffect } from 'react';
import { 
  collection, query, orderBy, limit, getDocs, where, startAfter, Timestamp, DocumentData, QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  AlertCircle, Calendar, ChevronLeft, ChevronRight, Clock, Download, Eye, Filter, Search, User, Users, Store, Edit, 
  Trash2, LogIn, LogOut, Settings, Shield, CreditCard, Flag, MessageSquare, CheckCircle, X, MoreHorizontal, Plus
} from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  action: string;
  timestamp: Date;
  entity: 'user' | 'vendor' | 'appointment' | 'service' | 'payment' | 'system' | 'support';
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState({
    entity: 'all',
    action: 'all',
    period: '7d',
    searchQuery: ''
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const LOGS_PER_PAGE = 50;

  useEffect(() => {
    loadLogs(true);
  }, [filter]);

  const loadLogs = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range based on period filter
      const now = new Date();
      let startDate = new Date();
      if (filter.period === '24h') {
        startDate.setDate(now.getDate() - 1);
      } else if (filter.period === '7d') {
        startDate.setDate(now.getDate() - 7);
      } else if (filter.period === '30d') {
        startDate.setDate(now.getDate() - 30);
      } else if (filter.period === '90d') {
        startDate.setDate(now.getDate() - 90);
      }
      
      // Build query
      let auditQuery = query(
        collection(db, 'auditLogs'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc'),
        limit(LOGS_PER_PAGE)
      );
      
      // Apply entity filter
      if (filter.entity !== 'all') {
        auditQuery = query(
          collection(db, 'auditLogs'),
          where('entity', '==', filter.entity),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'desc'),
          limit(LOGS_PER_PAGE)
        );
      }
      
      // Apply pagination
      if (!reset && lastVisible) {
        auditQuery = query(
          collection(db, 'auditLogs'),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(LOGS_PER_PAGE)
        );
        
        if (filter.entity !== 'all') {
          auditQuery = query(
            collection(db, 'auditLogs'),
            where('entity', '==', filter.entity),
            where('timestamp', '>=', Timestamp.fromDate(startDate)),
            orderBy('timestamp', 'desc'),
            startAfter(lastVisible),
            limit(LOGS_PER_PAGE)
          );
        }
      }
      
      const logsSnapshot = await getDocs(auditQuery);
      
      if (logsSnapshot.docs.length < LOGS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setLastVisible(logsSnapshot.docs[logsSnapshot.docs.length - 1]);
      }
      
      const logsList = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? new Date(data.timestamp.seconds * 1000) : new Date()
        } as AuditLog;
      });
      
      // Apply action filter and search client-side
      let filteredLogs = logsList;
      
      if (filter.action !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.action === filter.action);
      }
      
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          (log.userEmail?.toLowerCase().includes(query)) || 
          (log.userName?.toLowerCase().includes(query)) ||
          (log.userId?.toLowerCase().includes(query)) ||
          (log.entityId?.toLowerCase().includes(query)) ||
          (log.action?.toLowerCase().includes(query))
        );
      }
      
      if (reset) {
        setLogs(filteredLogs);
      } else {
        setLogs(prevLogs => [...prevLogs, ...filteredLogs]);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError('Lokien lataus epäonnistui.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadLogs(false);
    }
  };

  const getEntityIcon = (entity: AuditLog['entity']) => {
    switch(entity) {
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'vendor':
        return <Store className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'service':
        return <Settings className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'support':
        return <MessageSquare className="h-4 w-4" />;
      case 'system':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('add')) {
      return <Plus className="h-4 w-4" />;
    } else if (action.includes('update') || action.includes('edit')) {
      return <Edit className="h-4 w-4" />;
    } else if (action.includes('delete') || action.includes('remove')) {
      return <Trash2 className="h-4 w-4" />;
    } else if (action.includes('login')) {
      return <LogIn className="h-4 w-4" />;
    } else if (action.includes('logout')) {
      return <LogOut className="h-4 w-4" />;
    } else if (action.includes('view')) {
      return <Eye className="h-4 w-4" />;
    } else if (action.includes('approve') || action.includes('confirm')) {
      return <CheckCircle className="h-4 w-4" />;
    } else if (action.includes('reject') || action.includes('cancel')) {
      return <X className="h-4 w-4" />;
    } else {
      return <MoreHorizontal className="h-4 w-4" />;
    }
  };

  const formatLogAction = (log: AuditLog) => {
    let actionVerb = '';
    
    if (log.action.includes('create')) {
      actionVerb = 'luonut';
    } else if (log.action.includes('update')) {
      actionVerb = 'päivittänyt';
    } else if (log.action.includes('delete')) {
      actionVerb = 'poistanut';
    } else if (log.action.includes('login')) {
      actionVerb = 'kirjautunut sisään';
    } else if (log.action.includes('logout')) {
      actionVerb = 'kirjautunut ulos';
    } else if (log.action.includes('view')) {
      actionVerb = 'tarkastellut';
    } else if (log.action.includes('approve')) {
      actionVerb = 'hyväksynyt';
    } else if (log.action.includes('reject')) {
      actionVerb = 'hylännyt';
    } else {
      actionVerb = log.action;
    }
    
    let entityType = '';
    switch(log.entity) {
      case 'user':
        entityType = 'käyttäjän';
        break;
      case 'vendor':
        entityType = 'yrityksen';
        break;
      case 'appointment':
        entityType = 'varauksen';
        break;
      case 'service':
        entityType = 'palvelun';
        break;
      case 'payment':
        entityType = 'maksun';
        break;
      case 'support':
        entityType = 'tukipyynnön';
        break;
      case 'system':
        entityType = 'järjestelmän';
        break;
      default:
        entityType = '';
    }
    
    return `${actionVerb} ${entityType} ${log.entityId ? `#${log.entityId.slice(0, 6)}` : ''}`;
  };

  const exportLogs = () => {
    const exportData = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      userId: log.userId,
      userEmail: log.userEmail,
      userName: log.userName,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Tapahtumaloki</h2>
        <button
          onClick={exportLogs}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Vie lokitiedot
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Etsi lokitiedoista..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter.searchQuery}
              onChange={(e) => setFilter({...filter, searchQuery: e.target.value})}
            />
          </div>
          
          <div className="flex space-x-4">
            <select
              value={filter.entity}
              onChange={(e) => setFilter({...filter, entity: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Kaikki tyypit</option>
              <option value="user">Käyttäjät</option>
              <option value="vendor">Yritykset</option>
              <option value="appointment">Varaukset</option>
              <option value="service">Palvelut</option>
              <option value="payment">Maksut</option>
              <option value="support">Tuki</option>
              <option value="system">Järjestelmä</option>
            </select>
            
            <select
              value={filter.period}
              onChange={(e) => setFilter({...filter, period: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">24 tuntia</option>
              <option value="7d">7 päivää</option>
              <option value="30d">30 päivää</option>
              <option value="90d">90 päivää</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aikaleima
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Käyttäjä
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tapahtuma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tyyppi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Toiminnot
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Ei lokitapahtumia.
                  </td>
                </tr>
              ) : (
                <>
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{log.timestamp.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.userName || 'Järjestelmä'}
                            </div>
                            <div className="text-xs text-gray-500">{log.userEmail || log.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getActionIcon(log.action)}
                          <span className="ml-2 text-sm text-gray-900">
                            {formatLogAction(log)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="px-2 py-1 inline-flex items-center text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {getEntityIcon(log.entity)}
                            <span className="ml-1">
                              {log.entity === 'user' && 'Käyttäjä'}
                              {log.entity === 'vendor' && 'Yritys'}
                              {log.entity === 'appointment' && 'Varaus'}
                              {log.entity === 'service' && 'Palvelu'}
                              {log.entity === 'payment' && 'Maksu'}
                              {log.entity === 'support' && 'Tuki'}
                              {log.entity === 'system' && 'Järjestelmä'}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
        
        {hasMore && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-center">
            <button
              onClick={handleLoadMore}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                  Ladataan...
                </div>
              ) : (
                'Lataa lisää'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tapahtuman tiedot</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tapahtuma
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {formatLogAction(selectedLog)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aikaleima
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {selectedLog.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Käyttäjä
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {selectedLog.userName || 'Ei tiedossa'} ({selectedLog.userEmail || selectedLog.userId || 'Järjestelmä'})
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IP-osoite
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {selectedLog.ipAddress || 'Ei tiedossa'}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selain/laite
                </label>
                <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                  {selectedLog.userAgent || 'Ei tiedossa'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiedot
                </label>
                <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogViewer;

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bell, Calendar, CheckCircle, Clock, FileText, Flag, Mail, MessageSquare, RefreshCcw, Trash2, Users } from 'lucide-react';
import type { Appointment, User, Vendor, SupportTicket } from '../types/database';
import TaskManager from './TaskManager';
import NotificationCenter from './NotificationCenter';
import AuditLogViewer from './AuditLogViewer';

const OperationsCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'notifications' | 'audit'>('overview');
  const [loading, setLoading] = useState(true);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [pendingSupport, setPendingSupport] = useState<SupportTicket[]>([]);
  const [newUsers, setNewUsers] = useState<User[]>([]);
  const [newVendors, setNewVendors] = useState<Vendor[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadOperationsData = async () => {
      try {
        setLoading(true);
        
        // Get appointments awaiting confirmation (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('status', '==', 'pending'),
          where('date', '>=', Timestamp.fromDate(yesterday)),
          orderBy('date', 'asc')
        );
        
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointments = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];
        setPendingAppointments(appointments);
        
        // Get open support tickets
        const supportQuery = query(
          collection(db, 'supportTickets'),
          where('status', '==', 'open'),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        
        const supportSnapshot = await getDocs(supportQuery);
        const supportTickets = supportSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SupportTicket[];
        setPendingSupport(supportTickets);
        
        // Get new users (last 24 hours)
        const usersQuery = query(
          collection(db, 'users'),
          where('createdAt', '>=', Timestamp.fromDate(yesterday)),
          orderBy('createdAt', 'desc')
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];
        setNewUsers(users);
        
        // Get new vendors (last 24 hours)
        const vendorsQuery = query(
          collection(db, 'vendors'),
          where('createdAt', '>=', Timestamp.fromDate(yesterday)),
          orderBy('createdAt', 'desc')
        );
        
        const vendorsSnapshot = await getDocs(vendorsQuery);
        const vendors = vendorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vendor[];
        setNewVendors(vendors);
        
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error loading operations data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOperationsData();
    
    // Set up real-time listeners for critical data
    const appointmentsListener = onSnapshot(
      query(collection(db, 'appointments'), where('status', '==', 'pending')),
      (snapshot) => {
        const appointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Appointment[];
        setPendingAppointments(appointments);
      }
    );
    
    const supportListener = onSnapshot(
      query(collection(db, 'supportTickets'), where('status', '==', 'open')),
      (snapshot) => {
        const supportTickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SupportTicket[];
        setPendingSupport(supportTickets);
      }
    );
    
    return () => {
      appointmentsListener();
      supportListener();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    try {
      // Refresh all data
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('status', '==', 'pending'),
        where('date', '>=', Timestamp.fromDate(yesterday)),
        orderBy('date', 'asc')
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointments = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      setPendingAppointments(appointments);
      
      // Update other data...
      // (Similar queries for support, users, vendors)
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                ${activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Yleiskatsaus
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                ${activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Tehtävät
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                ${activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Bell className="w-5 h-5 mr-2" />
              Ilmoitukset
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                ${activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Clock className="w-5 h-5 mr-2" />
              Tapahtumaloki
            </button>
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Operaatiokeskus</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                Päivitetty: {lastUpdate.toLocaleTimeString()}
              </span>
              <button 
                onClick={handleRefresh}
                className={`p-2 rounded-full hover:bg-gray-100 ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCcw className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{pendingAppointments.length}</h3>
                  <p className="text-sm text-gray-500">Odottavat varaukset</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <MessageSquare className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{pendingSupport.length}</h3>
                  <p className="text-sm text-gray-500">Avoimet tukipyynnöt</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{newUsers.length}</h3>
                  <p className="text-sm text-gray-500">Uudet käyttäjät (24h)</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Flag className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{newVendors.length}</h3>
                  <p className="text-sm text-gray-500">Uudet yritykset (24h)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Operations */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Odottavat toimenpiteet</h3>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {pendingAppointments.length === 0 && pendingSupport.length === 0 ? (
                  <div className="px-6 py-4 text-center text-gray-500">
                    Ei odottavia toimenpiteitä.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {pendingAppointments.slice(0, 5).map(appointment => (
                      <div key={appointment.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                            <div>
                              <div className="font-medium">Uusi varaus #{appointment.id.slice(0, 6)}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(appointment.date.seconds * 1000).toLocaleDateString()} - 
                                {appointment.customerDetails.firstName} {appointment.customerDetails.lastName}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {pendingSupport.slice(0, 5).map(ticket => (
                      <div key={ticket.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-orange-500 mr-3" />
                            <div>
                              <div className="font-medium">{ticket.subject}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(ticket.createdAt.seconds * 1000).toLocaleDateString()} - 
                                {ticket.userRole === 'customer' ? 'Asiakas' : 'Yritys'}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                              <MessageSquare className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recently Registered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Uusimmat käyttäjät</h3>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {newUsers.length === 0 ? (
                    <div className="px-6 py-4 text-center text-gray-500">
                      Ei uusia käyttäjiä.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {newUsers.slice(0, 5).map(user => (
                        <div key={user.id} className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Users className="h-5 w-5 text-green-500 mr-3" />
                              <div>
                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(user.createdAt.seconds * 1000).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Uusimmat yritykset</h3>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {newVendors.length === 0 ? (
                    <div className="px-6 py-4 text-center text-gray-500">
                      Ei uusia yrityksiä.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {newVendors.slice(0, 5).map(vendor => (
                        <div key={vendor.id} className="px-6 py-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Flag className="h-5 w-5 text-purple-500 mr-3" />
                              <div>
                                <div className="font-medium">{vendor.businessName}</div>
                                <div className="text-sm text-gray-500">
                                  {vendor.city} - {vendor.businessId}
                                </div>
                              </div>
                            </div>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vendor.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {vendor.verified ? 'Vahvistettu' : 'Odottaa'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tasks Management */}
      {activeTab === 'tasks' && (
        <TaskManager />
      )}

      {/* Notifications Center */}
      {activeTab === 'notifications' && (
        <NotificationCenter />
      )}

      {/* Audit Log */}
      {activeTab === 'audit' && (
        <AuditLogViewer />
      )}
    </div>
  );
};

export default OperationsCenter;

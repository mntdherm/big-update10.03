import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, doc, serverTimestamp, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle, Clock, Trash2, CheckSquare, Calendar, Star, Edit, Plus, 
  AlertCircle, PlusCircle, Users, Search, Calendar as CalendarIcon, X, 
  Filter, ArrowDown, ArrowUp, MoreHorizontal, Flag
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  category: 'admin' | 'vendor' | 'customer' | 'system' | 'analytics';
  relatedEntityId?: string;
  relatedEntityType?: string;
  notes?: string[];
}

const TaskManager: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    assignedTo: currentUser?.uid || '',
    priority: 'medium',
    status: 'pending',
    dueDate: null,
    category: 'admin'
  });
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    category: 'all'
  });
  const [sortBy, setSortBy] = useState<{field: keyof Task, direction: 'asc' | 'desc'}>({
    field: 'dueDate',
    direction: 'asc'
  });
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [filter, sortBy]);

  const fetchTasks = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      let tasksQuery = query(
        collection(db, 'tasks'),
        orderBy(sortBy.field.toString(), sortBy.direction)
      );

      // Apply filters
      if (filter.status !== 'all') {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('status', '==', filter.status),
          orderBy(sortBy.field.toString(), sortBy.direction)
        );
      }

      if (filter.priority !== 'all') {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('priority', '==', filter.priority),
          orderBy(sortBy.field.toString(), sortBy.direction)
        );
      }

      if (filter.category !== 'all') {
        tasksQuery = query(
          collection(db, 'tasks'),
          where('category', '==', filter.category),
          orderBy(sortBy.field.toString(), sortBy.direction)
        );
      }

      const snapshot = await getDocs(tasksQuery);
      const fetchedTasks = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate.seconds * 1000) : null,
          createdAt: new Date(data.createdAt.seconds * 1000),
          updatedAt: new Date(data.updatedAt.seconds * 1000)
        } as Task;
      });

      setTasks(fetchedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Virhe tehtävien lataamisessa.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!currentUser) return;
    if (!newTask.title) {
      setError('Tehtävän otsikko on pakollinen.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const taskData = {
        ...newTask,
        createdBy: currentUser.uid,
        dueDate: newTask.dueDate ? Timestamp.fromDate(new Date(newTask.dueDate)) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'tasks'), taskData);
      
      // Reset form
      setNewTask({
        title: '',
        description: '',
        assignedTo: currentUser.uid,
        priority: 'medium',
        status: 'pending',
        dueDate: null,
        category: 'admin'
      });
      
      setIsAddingTask(false);
      fetchTasks();
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Virhe tehtävän luomisessa.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setLoading(true);
      setError(null);

      const taskRef = doc(db, 'tasks', taskId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        dueDate: updates.dueDate ? Timestamp.fromDate(new Date(updates.dueDate)) : null
      };

      await updateDoc(taskRef, updateData);
      
      fetchTasks();
      setEditingTaskId(null);
      setEditingTask(null);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Virhe tehtävän päivityksessä.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setLoading(true);
      setError(null);

      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      
      fetchTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Virhe tehtävän poistamisessa.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    await handleUpdateTask(taskId, { status: newStatus });
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTask({...task});
  };

  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditingTask(null);
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: Task['category']) => {
    switch (category) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'vendor':
        return <Store className="h-4 w-4" />;
      case 'customer':
        return <Users className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'analytics':
        return <Search className="h-4 w-4" />;
      default:
        return <Flag className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Ei määräaikaa';
    return date.toLocaleDateString('fi-FI', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = (dueDate: Date | null, status: Task['status']) => {
    if (!dueDate || status === 'completed' || status === 'cancelled') return false;
    return dueDate < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Tehtävät</h2>
        <button
          onClick={() => setIsAddingTask(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Uusi tehtävä
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 mr-2">Tila:</span>
            <select
              value={filter.status}
              onChange={(e) => setFilter({...filter, status: e.target.value})}
              className="border border-gray-300 rounded-md p-1 text-sm"
            >
              <option value="all">Kaikki</option>
              <option value="pending">Odottaa</option>
              <option value="in_progress">Kesken</option>
              <option value="completed">Valmis</option>
              <option value="cancelled">Peruttu</option>
            </select>
          </div>

          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Prioriteetti:</span>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({...filter, priority: e.target.value})}
              className="border border-gray-300 rounded-md p-1 text-sm"
            >
              <option value="all">Kaikki</option>
              <option value="low">Matala</option>
              <option value="medium">Keskitaso</option>
              <option value="high">Korkea</option>
              <option value="urgent">Kiireellinen</option>
            </select>
          </div>

          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Kategoria:</span>
            <select
              value={filter.category}
              onChange={(e) => setFilter({...filter, category: e.target.value})}
              className="border border-gray-300 rounded-md p-1 text-sm"
            >
              <option value="all">Kaikki</option>
              <option value="admin">Ylläpito</option>
              <option value="vendor">Yritykset</option>
              <option value="customer">Asiakkaat</option>
              <option value="system">Järjestelmä</option>
              <option value="analytics">Analytiikka</option>
            </select>
          </div>

          <div className="ml-auto flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">Järjestys:</span>
            <select
              value={`${sortBy.field}_${sortBy.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('_') as [keyof Task, 'asc' | 'desc'];
                setSortBy({ field, direction });
              }}
              className="border border-gray-300 rounded-md p-1 text-sm"
            >
              <option value="dueDate_asc">Määräaika (aikaisin ensin)</option>
              <option value="dueDate_desc">Määräaika (myöhäisin ensin)</option>
              <option value="priority_desc">Prioriteetti (korkein ensin)</option>
              <option value="priority_asc">Prioriteetti (matalin ensin)</option>
              <option value="createdAt_desc">Luontiaika (uusin ensin)</option>
              <option value="createdAt_asc">Luontiaika (vanhin ensin)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading && tasks.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-6 text-center">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ei tehtäviä</h3>
            <p className="text-gray-500 mb-4">Sinulla ei ole tällä hetkellä tehtäviä näillä suodattimilla.</p>
            <button
              onClick={() => setIsAddingTask(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Luo uusi tehtävä
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tehtävä
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Määräaika
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioriteetti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tila
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategoria
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toiminnot
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    {editingTaskId === task.id ? (
                      // Editing mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input 
                            type="text"
                            value={editingTask?.title || ''}
                            onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                          <textarea
                            value={editingTask?.description || ''}
                            onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input 
                            type="date"
                            value={editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setEditingTask({
                              ...editingTask, 
                              dueDate: e.target.value ? new Date(e.target.value) : null
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={editingTask?.priority || 'medium'}
                            onChange={(e) => setEditingTask({
                              ...editingTask, 
                              priority: e.target.value as Task['priority']
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="low">Matala</option>
                            <option value="medium">Keskitaso</option>
                            <option value="high">Korkea</option>
                            <option value="urgent">Kiireellinen</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={editingTask?.status || 'pending'}
                            onChange={(e) => setEditingTask({
                              ...editingTask, 
                              status: e.target.value as Task['status']
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pending">Odottaa</option>
                            <option value="in_progress">Kesken</option>
                            <option value="completed">Valmis</option>
                            <option value="cancelled">Peruttu</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={editingTask?.category || 'admin'}
                            onChange={(e) => setEditingTask({
                              ...editingTask, 
                              category: e.target.value as Task['category']
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="admin">Ylläpito</option>
                            <option value="vendor">Yritykset</option>
                            <option value="customer">Asiakkaat</option>
                            <option value="system">Järjestelmä</option>
                            <option value="analytics">Analytiikka</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => editingTask && handleUpdateTask(task.id, editingTask)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                            <button
                              onClick={cancelEditTask}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      // View mode
                      <>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 mt-1 max-w-md">{task.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center text-sm ${
                            isOverdue(task.dueDate, task.status) ? 'text-red-600 font-medium' : 'text-gray-500'
                          }`}>
                            <Calendar className="h-4 w-4 mr-1.5" />
                            {formatDate(task.dueDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'low' && 'Matala'}
                            {task.priority === 'medium' && 'Keskitaso'}
                            {task.priority === 'high' && 'Korkea'}
                            {task.priority === 'urgent' && 'Kiireellinen'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                            {task.status === 'pending' && 'Odottaa'}
                            {task.status === 'in_progress' && 'Kesken'}
                            {task.status === 'completed' && 'Valmis'}
                            {task.status === 'cancelled' && 'Peruttu'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            {getCategoryIcon(task.category)}
                            <span className="ml-1.5">
                              {task.category === 'admin' && 'Ylläpito'}
                              {task.category === 'vendor' && 'Yritykset'}
                              {task.category === 'customer' && 'Asiakkaat'}
                              {task.category === 'system' && 'Järjestelmä'}
                              {task.category === 'analytics' && 'Analytiikka'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {task.status !== 'completed' && task.status !== 'cancelled' && (
                              <button
                                onClick={() => handleStatusChange(task.id, 'completed')}
                                className="text-green-600 hover:text-green-900"
                                title="Merkitse valmiiksi"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => startEditTask(task)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Muokkaa"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Poista"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Task Form Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Uusi tehtävä</h3>
              <button
                onClick={() => setIsAddingTask(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Otsikko*
                </label>
                <input 
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Syötä tehtävän otsikko"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kuvaus
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Syötä tehtävän kuvaus"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioriteetti
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({
                      ...newTask, 
                      priority: e.target.value as Task['priority']
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Matala</option>
                    <option value="medium">Keskitaso</option>
                    <option value="high">Korkea</option>
                    <option value="urgent">Kiireellinen</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategoria
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({
                      ...newTask, 
                      category: e.target.value as Task['category']
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="admin">Ylläpito</option>
                    <option value="vendor">Yritykset</option>
                    <option value="customer">Asiakkaat</option>
                    <option value="system">Järjestelmä</option>
                    <option value="analytics">Analytiikka</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Määräaika
                </label>
                <input 
                  type="date"
                  value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setNewTask({
                    ...newTask, 
                    dueDate: e.target.value ? new Date(e.target.value) : null
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsAddingTask(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Peruuta
              </button>
              <button
                onClick={handleCreateTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                disabled={loading || !newTask.title}
              >
                {loading ? (
                  <><Clock className="h-4 w-4 animate-spin mr-1 inline" /> Tallennetaan...</>
                ) : (
                  'Tallenna'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;

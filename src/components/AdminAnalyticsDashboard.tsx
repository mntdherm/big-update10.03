import React, { useState, useEffect } from 'react';
import { getAnalyticsData } from '../lib/analytics';
import { 
  BarChart3, LineChart, PieChart, Users, Search, MousePointer, AlertCircle, Calendar, 
  Clock, ArrowUpRight, Download, Filter, Smartphone, Globe, Map, RefreshCw
} from 'lucide-react';

type Period = '24h' | '7d' | '30d';

const AdminAnalyticsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<Period>('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'searches' | 'clicks' | 'errors'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await getAnalyticsData(period);
      setData(analyticsData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Virhe datan latauksessa');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString('fi-FI');
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
        <div className="flex">
          <AlertCircle className="h-6 w-6 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Virhe analytiikan latauksessa</h3>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <button 
              onClick={fetchAnalyticsData} 
              className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md text-red-700 bg-red-100 hover:bg-red-200"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Kokeile uudelleen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Käyttäjäanalytiikka</h2>
        <div className="flex items-center space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">24 tuntia</option>
            <option value="7d">7 päivää</option>
            <option value="30d">30 päivää</option>
          </select>
          <button 
            onClick={fetchAnalyticsData}
            className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button 
            className="p-2 bg-gray-50 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => {
              // Export data as JSON
              const jsonString = JSON.stringify(data, null, 2);
              const blob = new Blob([jsonString], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analytics-${period}-${new Date().toISOString()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                ${activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Yleiskatsaus
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                ${activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Käyttäjät
            </button>
            <button
              onClick={() => setActiveTab('searches')}
              className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                ${activeTab === 'searches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Search className="w-5 h-5 mr-2" />
              Haut
            </button>
            <button
              onClick={() => setActiveTab('clicks')}
              className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                ${activeTab === 'clicks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <MousePointer className="w-5 h-5 mr-2" />
              Klikkaukset
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`py-4 px-6 inline-flex items-center border-b-2 font-medium text-sm
                ${activeTab === 'errors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Virheet
            </button>
          </nav>
        </div>
      </div>

      {/* Overview Dashboard */}
      {activeTab === 'overview' && data && (
        <div className="space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{data.metrics.uniqueUsers}</h3>
                    <p className="text-sm text-gray-500">Käyttäjät</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <Search className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{data.metrics.totalSearches}</h3>
                    <p className="text-sm text-gray-500">Haut</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <MousePointer className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{data.clicks.length}</h3>
                    <p className="text-sm text-gray-500">Klikkaukset</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{data.metrics.totalErrors}</h3>
                    <p className="text-sm text-gray-500">Virheet</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </div>

          {/* Top searches */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Suosituimmat haut</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.metrics.topSearches.length > 0 ? (
                  data.metrics.topSearches.map((search: any, index: number) => (
                    <div key={index} className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-blue-600 h-4 rounded-full"
                          style={{ width: `${(search.count / data.metrics.topSearches[0].count) * 100}%` }}
                        ></div>
                      </div>
                      <div className="min-w-[100px] ml-4">
                        <div className="text-sm font-medium text-gray-900">{search.term}</div>
                        <div className="text-xs text-gray-500">{search.count} hakua</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500">Ei hakutietoja saatavilla</div>
                )}
              </div>
            </div>
          </div>

          {/* Error categories */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Virheet tyypeittäin</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center h-64">
                  <PieChart className="h-40 w-40 text-gray-300" />
                </div>
                <div className="space-y-4">
                  {data.metrics.errorCategories.length > 0 ? (
                    data.metrics.errorCategories.map((category: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: `hsl(${index * 30}, 70%, 50%)` }}
                          ></span>
                          <span className="text-sm text-gray-800">{category.category}</span>
                        </div>
                        <span className="text-sm font-medium">{category.count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500">Ei virhetietoja saatavilla</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && data && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Käyttäjäsessiot</h3>
            <p className="text-sm text-gray-500 mt-1">
              Yhteensä {data.sessions.length} sessiota näytetään
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Käyttäjä
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aloitusaika
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sivunäytöt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Laite
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.sessions.slice(0, 100).map((session: any) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {session.isAuthenticated ? (
                            <Users className="h-4 w-4 text-gray-600" />
                          ) : (
                            <Users className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {session.userEmail || 'Anonyymi käyttäjä'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {session.isAuthenticated ? 'Kirjautunut' : 'Ei kirjautunut'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.sessionId.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(session.startTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{session.pageviews || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {session.deviceInfo?.userAgent?.includes('Mobile') ? (
                          <Smartphone className="h-4 w-4 text-gray-400 mr-1" />
                        ) : (
                          <Globe className="h-4 w-4 text-gray-400 mr-1" />
                        )}
                        <span className="text-sm text-gray-500">
                          {session.deviceInfo?.screenSize || 'Tuntematon'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Searches Tab */}
      {activeTab === 'searches' && data && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Hakuanalyysi</h3>
            <p className="text-sm text-gray-500 mt-1">
              Yhteensä {data.searches.length} hakua näytetään
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hakutermi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tulokset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Käyttäjä
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aika
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suodattimet
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.searches.slice(0, 100).map((search: any) => (
                  <tr key={search.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Search className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {search.searchQuery || 'Tyhjä haku'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${search.resultsCount > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'}`}
                      >
                        {search.resultsCount} tulosta
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {search.userId ? 'Kirjautunut' : 'Anonyymi'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(search.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {search.filters?.city ? (
                          <div className="flex items-center text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-1 mr-1">
                            <Map className="h-3 w-3 mr-1" />
                            {search.filters.city}
                          </div>
                        ) : null}
                        {search.filters?.other && Object.keys(search.filters.other).map((key: string) => (
                          <div key={key} className="text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-1 mr-1">
                            <Filter className="h-3 w-3 mr-1 inline" />
                            {key}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clicks Tab */}
      {activeTab === 'clicks' && data && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Klikkausanalyysi</h3>
            <p className="text-sm text-gray-500 mt-1">
              Viimeiset {data.clicks.length} klikkausta näytetään
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Elementti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teksti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sivu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Käyttäjä
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aika
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.clicks.slice(0, 100).map((click: any) => (
                  <tr key={click.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MousePointer className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {click.elementType} 
                          {click.elementId !== 'unknown' ? `#${click.elementId}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {click.elementText ? (
                        <span className="truncate max-w-xs block">
                          {click.elementText.substring(0, 30)}
                          {click.elementText.length > 30 ? '...' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400">Ei tekstiä</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {click.path || '/'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {click.userId ? 'Kirjautunut' : 'Anonyymi'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(click.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && data && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Virheiden seuranta</h3>
            <p className="text-sm text-gray-500 mt-1">
              Yhteensä {data.errors.length} virhettä näytetään
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Virhe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Komponentti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tyyppi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sivu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aika
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.errors.slice(0, 100).map((error: any) => (
                  <tr key={error.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {error.errorMessage || 'Tuntematon virhe'}
                          </div>
                          {error.errorStack && (
                            <details className="mt-1">
                              <summary className="text-xs text-gray-500 cursor-pointer">Näytä stack trace</summary>
                              <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                                {error.errorStack}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {error.componentName || 'Tuntematon'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${error.errorType === 'React Error' 
                          ? 'bg-purple-100 text-purple-800' 
                          : error.errorType === 'Network Error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'}`}
                      >
                        {error.errorType || 'Sovellus'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {error.path || '/'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(error.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalyticsDashboard;

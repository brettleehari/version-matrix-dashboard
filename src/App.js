import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';

const VersionMatrixApp = () => {
  const [matrixData, setMatrixData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Load data from sample-data.json on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Try with PUBLIC_URL first
        let url = `${process.env.PUBLIC_URL}/sample-data.json`;
        console.log('Attempting to fetch data from:', url);
        console.log('PUBLIC_URL:', process.env.PUBLIC_URL);
        
        let response = await fetch(url);
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        // If that fails, try without PUBLIC_URL
        if (!response.ok) {
          console.log('First attempt failed, trying fallback path...');
          url = './sample-data.json';
          console.log('Trying fallback URL:', url);
          response = await fetch(url);
          console.log('Fallback response status:', response.status);
          console.log('Fallback response ok:', response.ok);
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log('Data loaded successfully:', data);
          setMatrixData(data);
        } else {
          console.error('Failed to load sample-data.json from both URLs, status:', response.status);
          console.error('Response:', response);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'compatible':
      case 'stable':
      case 'lts':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'deprecated':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'incompatible':
      case 'eol':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
      case 'planned':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'compatible':
      case 'stable':
      case 'lts':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'deprecated':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'incompatible':
      case 'eol':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'testing':
      case 'planned':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading version matrix data...</p>
        </div>
      </div>
    );
  }

  if (!matrixData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600">Could not load the version matrix data.</p>
        </div>
      </div>
    );
  }

  const filteredPackages = matrixData.basePackages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const hasStatus = Object.values(pkg.versions).some(v => v.status === statusFilter);
    return matchesSearch && hasStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Version Management Dashboard</h1>
          <p className="text-gray-600 mb-6">
            Track base package versions across {matrixData.applications?.length || 0} applications
          </p>
          
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="compatible">Compatible</option>
              <option value="deprecated">Deprecated</option>
              <option value="incompatible">Incompatible</option>
              <option value="testing">Testing</option>
            </select>
            
            <div className="ml-auto text-sm text-gray-500">
              {filteredPackages.length} of {matrixData.basePackages.length} packages
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                    Base Package
                  </th>
                  {matrixData.matrixApplications.map((app) => (
                    <th key={app} className="px-4 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                      {app}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200">
                      <div className="font-semibold text-gray-900">{pkg.name}</div>
                    </td>
                    {matrixData.matrixApplications.map((app) => {
                      const versionInfo = pkg.versions[app];
                      return (
                        <td key={app} className="px-4 py-4 text-center">
                          {versionInfo ? (
                            <div className="flex flex-col items-center space-y-1">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${getStatusColor(versionInfo.status)}`}>
                                {getStatusIcon(versionInfo.status)}
                                <span className="ml-2 font-medium">{versionInfo.version}</span>
                              </div>
                              {versionInfo.notes && (
                                <div className="text-xs text-gray-500 max-w-[120px] truncate" title={versionInfo.notes}>
                                  {versionInfo.notes}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Legend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Status Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Compatible/Stable/LTS</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm">Deprecated</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm">Incompatible/EOL</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Testing/Planned</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionMatrixApp;
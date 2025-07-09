// Network Graph Data Processing
  const getNetworkData = () => {
    const nodes = [];
    const links = [];

    // Create nodes for applications
    currentData.applications.forEach(app => {
      const appId = `${app.name}-${app.version}`;
      const node = {
        id: appId,
        name: `${app.name} ${app.version}`,
        type: 'application',
        group: app.name,
        status: 'application'
      };
      nodes.push(node);
    });

    // Create nodes for base packages and links
    const basePackageVersions = new Set();
    currentData.applications.forEach(app => {
      const appId = `${app.name}-${app.version}`;
      
      app.basePackages.forEach(pkg => {
        const pkgId = `${pkg.name}-${pkg.version}`;
        
        // Add base package node if not exists
        if (!basePackageVersions.has(pkgId)) {
          basePackageVersions.add(pkgId);
          const pkgNode = {
            id: pkgId,
            name: `${pkg.name} ${pkg.version}`,
            type: 'basePackage',
            group: pkg.name,
            status: pkg.status
          };
          nodes.push(pkgNode);
        }

        // Create link between app and base package
        links.push({
          source: appId,
          target: pkgId,
          status: pkg.status,
          relationship: 'depends-on'
        });
      });
    });

    return { nodes, links };
  };

  // Network Visualization Component
  const NetworkGraph = () => {
    useEffect(() => {
      if (!svgRef.current) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const width = 1000;
      const height = 600;
      const { nodes, links } = getNetworkData();

      svg.attr("width", width).attr("height", height);

      // Create groups for zoom
      const g = svg.append("g");

      // Define color schemes
      const colors = {
        application: '#3b82f6',
        basePackage: {
          compatible: '#10b981',
          deprecated: '#f59e0b', 
          incompatible: '#ef4444',
          testing: '#8b5cf6'
        }
      };

      // Create force simulation
      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(function(d) { return d.id; }).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(30));

      // Create links
      const link = g.append("g")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke", function(d) {
          switch(d.status) {
            case 'compatible': return '#10b981';
            case 'deprecated': return '#f59e0b';
            case 'incompatible': return '#ef4444';
            case 'testing': return '#8b5cf6';
            default: return '#6b7280';
          }
        })
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2);

      // Create nodes
      const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .enter().append("g")
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      // Add circles for nodes
      node.append("circle")
        .attr("r", function(d) { return d.type === 'application' ? 20 : 15; })
        .attr("fill", function(d) {
          if (d.type === 'application') return colors.application;
          return colors.basePackage[d.status] || '#6b7280';
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      // Add labels
      node.append("text")
        .text(function(d) { return d.name; })
        .attr("font-size", "10px")
        .attr("dx", 25)
        .attr("dy", 4)
        .attr("fill", "#374151");

      // Add tooltips
      node.append("title")
        .text(function(d) { return `${d.name}\nType: ${d.type}\nStatus: ${d.status}`; });

      // Zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoom);

      // Update positions on simulation tick
      simulation.on("tick", function() {
        link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

        node
          .attr("transform", function(d) { return `translate(${d.x},${d.y})`; });
      });

      // Drag functions
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

    }, [currentData]);

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Package Dependency Network</h3>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>Applications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Compatible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Deprecated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Incompatible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Testing</span>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <svg ref={svgRef} className="w-full" style={{ minHeight: '600px' }}></svg>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Instructions:</strong> Drag nodes to rearrange • Scroll to zoom • Hover for details</p>
            <p><strong>Large circles:</strong> Applications • <strong>Small circles:</strong> Base packages</p>
          </div>
        </div>
      </div>
    );
  };

  // Network View
  const renderNetwork = () => {
    return (
      <div className="space-y-6">
        <NetworkGraph />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Applications
            </h4>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {currentData.applications.length}
            </div>
            <p className="text-sm text-gray-600">Total application versions</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Base Packages
            </h4>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {new Set(currentData.applications.flatMap(app => 
                app.basePackages.map(pkg => `${pkg.name}-${pkg.version}`)
              )).size}
            </div>
            <p className="text-sm text-gray-600">Unique package versions</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Risk Factors
            </h4>
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              {currentData.applications.reduce((count, app) => 
                count + app.basePackages.filter(pkg => 
                  pkg.status === 'deprecated' || pkg.status === 'incompatible'
                ).length, 0
              )}
            </div>
            <p className="text-sm text-gray-600">Deprecated/incompatible dependencies</p>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'matrix':
        return renderMatrix();
      case 'app-to-base':
        return renderAppToBase();
      case 'base-to-apps':
        return renderBaseToApps();
      case 'roadmap':
        return renderRoadmap();
      case 'network':
        return renderNetwork();
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-gray-500">
              {activeTab} view coming soon...
            </p>
          </div>
        );
    }
  };
      import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Upload, Search, Package, Layers, ArrowRight, ArrowLeft, Grid, GitBranch, CheckCircle, AlertCircle, Clock, XCircle, Network } from 'lucide-react';
import * as d3 from 'd3';

const VersionMatrixApp = () => {
  const [matrixData, setMatrixData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('matrix');
  const svgRef = useRef();

  // Sample data structure
  const sampleData = {
    basePackages: [
      {
        name: 'Python',
        versions: {
          'App A v2.1': { version: '3.8.x', status: 'compatible', notes: 'Legacy support' },
          'App A v2.2': { version: '3.9.x', status: 'compatible', notes: 'Current stable' },
          'App B v1.5': { version: '3.8.x - 3.9.x', status: 'compatible', notes: 'Flexible versions' },
          'App B v1.6': { version: '3.9.x - 3.10.x', status: 'compatible', notes: 'Latest features' },
          'App C v3.0': { version: '3.10.x+', status: 'compatible', notes: 'Cutting edge' }
        }
      },
      {
        name: 'Node.js',
        versions: {
          'App A v2.1': { version: '14.x', status: 'deprecated', notes: 'EOL soon' },
          'App A v2.2': { version: '16.x', status: 'compatible', notes: 'Current stable' },
          'App B v1.5': { version: '16.x - 18.x', status: 'compatible', notes: 'Flexible versions' },
          'App B v1.6': { version: '18.x+', status: 'compatible', notes: 'Latest features' },
          'App C v3.0': { version: '18.x+', status: 'compatible', notes: 'Cutting edge' }
        }
      }
    ],
    matrixApplications: ['App A v2.1', 'App A v2.2', 'App B v1.5', 'App B v1.6', 'App C v3.0'],
    applications: [
      {
        name: 'App A',
        version: 'v2.1',
        basePackages: [
          { name: 'Python', version: '3.8.x', status: 'compatible' },
          { name: 'Node.js', version: '14.x', status: 'deprecated' }
        ]
      },
      {
        name: 'App A',
        version: 'v2.2',
        basePackages: [
          { name: 'Python', version: '3.9.x', status: 'compatible' },
          { name: 'Node.js', version: '16.x', status: 'compatible' }
        ]
      }
    ],
    dependencyBasePackages: [
      {
        name: 'Python',
        version: '3.8.x',
        applications: [
          { name: 'App A', version: 'v2.1', status: 'compatible' }
        ]
      },
      {
        name: 'Python',
        version: '3.9.x',
        applications: [
          { name: 'App A', version: 'v2.2', status: 'compatible' }
        ]
      }
    ],
    roadmap: [
      {
        package: 'Python',
        timeline: [
          { version: '3.8.x', status: 'deprecated', eol: 'Oct 2024', apps: ['App A v2.1'] },
          { version: '3.9.x', status: 'stable', eol: 'Oct 2025', apps: ['App A v2.2'] }
        ]
      }
    ]
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setMatrixData(data);
        } catch (error) {
          alert('Error parsing JSON file. Please check the format.');
        }
      };
      reader.readAsText(file);
    }
  };

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

  const currentData = matrixData || sampleData;

  const tabs = [
    { id: 'matrix', label: 'Matrix View', icon: Grid },
    { id: 'app-to-base', label: 'App → Base', icon: ArrowRight },
    { id: 'base-to-apps', label: 'Base → Apps', icon: ArrowLeft },
    { id: 'roadmap', label: 'Roadmap', icon: GitBranch },
    { id: 'network', label: 'Network Graph', icon: Network }
  ];

  // Matrix View
  const renderMatrix = () => {
    const filteredPackages = currentData.basePackages.filter(pkg => {
      const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      
      const hasStatus = Object.values(pkg.versions).some(v => v.status === statusFilter);
      return matchesSearch && hasStatus;
    });

    const LoadSampleData = () => (
    <button
      onClick={() => setMatrixData(sampleData)}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      Load Sample Data
    </button>
  );

  return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Package
                </th>
                {currentData.matrixApplications.map((app) => (
                  <th key={app} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {app}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPackages.map((pkg) => (
                <tr key={pkg.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{pkg.name}</div>
                  </td>
                  {currentData.matrixApplications.map((app) => {
                    const versionInfo = pkg.versions[app];
                    return (
                      <td key={app} className="px-6 py-4 whitespace-nowrap">
                        {versionInfo ? (
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${getStatusColor(versionInfo.status)}`}>
                            {getStatusIcon(versionInfo.status)}
                            <span className="ml-2">{versionInfo.version}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
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
    );
  };

  // App to Base View
  const renderAppToBase = () => {
    const filteredItems = currentData.applications.filter(app => {
      const displayName = `${app.name} ${app.version}`;
      return displayName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
      <div className="space-y-4">
        {filteredItems.map((app, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {app.name} {app.version}
                </h3>
                <span className="text-sm text-gray-500">
                  {app.basePackages.length} base packages
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {app.basePackages.map((pkg, pkgIndex) => (
                  <div key={pkgIndex} className={`p-4 rounded-lg border ${getStatusColor(pkg.status)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{pkg.name}</h4>
                      <span className="text-xs uppercase font-medium">{pkg.status}</span>
                    </div>
                    <div className="text-sm opacity-75">
                      Version: {pkg.version}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Base to Apps View
  const renderBaseToApps = () => {
    const filteredItems = currentData.dependencyBasePackages.filter(basePkg => {
      const displayName = `${basePkg.name} ${basePkg.version}`;
      return displayName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
      <div className="space-y-4">
        {filteredItems.map((basePkg, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  {basePkg.name} {basePkg.version}
                </h3>
                <span className="text-sm text-gray-500">
                  {basePkg.applications.length} applications
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {basePkg.applications.map((app, appIndex) => (
                  <div key={appIndex} className={`p-4 rounded-lg border ${getStatusColor(app.status)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{app.name}</h4>
                      <span className="text-xs uppercase font-medium">{app.status}</span>
                    </div>
                    <div className="text-sm opacity-75">
                      Version: {app.version}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Roadmap View
  const renderRoadmap = () => {
    return (
      <div className="space-y-8">
        {currentData.roadmap?.map((packageRoadmap, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                {packageRoadmap.package} Roadmap
              </h3>
            </div>
            <div className="p-6">
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6">
                  {packageRoadmap.timeline.map((item, itemIndex) => (
                    <div key={itemIndex} className="relative flex items-start">
                      <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${getStatusColor(item.status)} shadow-sm`}>
                        {getStatusIcon(item.status)}
                      </div>
                      
                      <div className="ml-6 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{item.version}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs uppercase font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                            <span>EOL: {item.eol}</span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Applications using this version:</p>
                          <div className="flex flex-wrap gap-2">
                            {item.apps.map((app, appIndex) => (
                              <span key={appIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                                {app}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {item.status === 'deprecated' && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                              <strong>Action Required:</strong> Plan migration before EOL date
                            </p>
                          </div>
                        )}
                        
                        {item.status === 'eol' && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">
                              <strong>Critical:</strong> This version is no longer supported
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )) || (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No roadmap data available. Load sample data to see the roadmap view.</p>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'matrix':
        return renderMatrix();
      case 'app-to-base':
        return renderAppToBase();
      case 'base-to-apps':
        return renderBaseToApps();
      case 'roadmap':
        return renderRoadmap();
      default:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-gray-500">
              {activeTab} view coming soon...
            </p>
          </div>
        );
    }
  };
    <button
      onClick={() => setMatrixData(sampleData)}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
    >
      Load Sample Data
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Version Management Dashboard</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors">
              <Upload className="w-4 h-4" />
              Upload JSON
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <LoadSampleData />
          </div>

          <div className="flex flex-wrap border-b border-gray-200 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search and Filters */}
          {activeTab !== 'roadmap' && activeTab !== 'network' && (
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={
                    activeTab === 'matrix' ? 'Search packages...' :
                    activeTab === 'app-to-base' ? 'Search applications...' :
                    'Search base packages...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {activeTab === 'matrix' && (
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
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderContent()}
        </div>

        {/* Status Legend */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Status Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Compatible/Stable</span>
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
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">LTS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionMatrixApp;
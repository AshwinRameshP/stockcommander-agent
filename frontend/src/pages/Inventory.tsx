import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface InventoryItem {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  unitCost: number;
  supplier: string;
  lastUpdated: Date;
  status: 'healthy' | 'low' | 'critical' | 'out_of_stock';
  demandForecast: Array<{ date: string; demand: number }>;
}

const Inventory: React.FC = () => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof InventoryItem>('partNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockData: InventoryItem[] = [
      {
        id: '1',
        partNumber: 'BRK-001',
        description: 'Brake Pad Set - Front',
        category: 'Brakes',
        currentStock: 45,
        safetyStock: 20,
        reorderPoint: 30,
        unitCost: 89.99,
        supplier: 'AutoParts Inc',
        lastUpdated: new Date(),
        status: 'healthy',
        demandForecast: [
          { date: '2024-01', demand: 12 },
          { date: '2024-02', demand: 15 },
          { date: '2024-03', demand: 18 },
          { date: '2024-04', demand: 14 },
          { date: '2024-05', demand: 16 },
          { date: '2024-06', demand: 20 },
        ]
      },
      {
        id: '2',
        partNumber: 'ENG-205',
        description: 'Oil Filter - Premium',
        category: 'Engine',
        currentStock: 8,
        safetyStock: 15,
        reorderPoint: 25,
        unitCost: 24.50,
        supplier: 'FilterMax',
        lastUpdated: new Date(),
        status: 'critical',
        demandForecast: [
          { date: '2024-01', demand: 25 },
          { date: '2024-02', demand: 28 },
          { date: '2024-03', demand: 30 },
          { date: '2024-04', demand: 22 },
          { date: '2024-05', demand: 26 },
          { date: '2024-06', demand: 32 },
        ]
      },
      {
        id: '3',
        partNumber: 'TIR-150',
        description: 'All-Season Tire 225/60R16',
        category: 'Tires',
        currentStock: 24,
        safetyStock: 12,
        reorderPoint: 18,
        unitCost: 145.00,
        supplier: 'TireWorld',
        lastUpdated: new Date(),
        status: 'low',
        demandForecast: [
          { date: '2024-01', demand: 8 },
          { date: '2024-02', demand: 6 },
          { date: '2024-03', demand: 12 },
          { date: '2024-04', demand: 15 },
          { date: '2024-05', demand: 18 },
          { date: '2024-06', demand: 10 },
        ]
      },
      {
        id: '4',
        partNumber: 'BAT-300',
        description: 'Car Battery 12V 70Ah',
        category: 'Electrical',
        currentStock: 0,
        safetyStock: 5,
        reorderPoint: 8,
        unitCost: 120.00,
        supplier: 'PowerCell Co',
        lastUpdated: new Date(),
        status: 'out_of_stock',
        demandForecast: [
          { date: '2024-01', demand: 4 },
          { date: '2024-02', demand: 6 },
          { date: '2024-03', demand: 8 },
          { date: '2024-04', demand: 5 },
          { date: '2024-05', demand: 7 },
          { date: '2024-06', demand: 9 },
        ]
      },
    ];
    setInventoryData(mockData);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'low':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'critical':
      case 'out_of_stock':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedData = inventoryData
    .filter(item => {
      const matchesSearch = item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * direction;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }
      return 0;
    });

  const handleSort = (field: keyof InventoryItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const supplierPerformanceData = [
    { supplier: 'AutoParts Inc', onTimeDelivery: 95, avgLeadTime: 3.2, costRating: 4.2 },
    { supplier: 'FilterMax', onTimeDelivery: 88, avgLeadTime: 4.1, costRating: 4.5 },
    { supplier: 'TireWorld', onTimeDelivery: 92, avgLeadTime: 2.8, costRating: 3.8 },
    { supplier: 'PowerCell Co', onTimeDelivery: 85, avgLeadTime: 5.2, costRating: 4.0 },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="mt-2 text-sm text-gray-700">
          Monitor current stock levels and manage inventory with real-time updates
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Healthy Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {inventoryData.filter(item => item.status === 'healthy').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {inventoryData.filter(item => item.status === 'low').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Critical</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {inventoryData.filter(item => item.status === 'critical' || item.status === 'out_of_stock').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">$</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${inventoryData.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0).toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by part number or description..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="healthy">Healthy</option>
                <option value="low">Low Stock</option>
                <option value="critical">Critical</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Current Stock Levels</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('partNumber')}
                >
                  <div className="flex items-center">
                    Part Number
                    {sortField === 'partNumber' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('currentStock')}
                >
                  <div className="flex items-center">
                    Current Stock
                    {sortField === 'currentStock' && (
                      sortDirection === 'asc' ? <ArrowUpIcon className="ml-1 h-4 w-4" /> : <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorder Point
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.partNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="mr-2">{item.currentStock}</span>
                      {item.currentStock <= item.reorderPoint && (
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.reorderPoint}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(item.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.supplier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demand Forecasting Chart */}
      {selectedItem && (
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Demand Forecast - {selectedItem.partNumber}
            </h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={selectedItem.demandForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="demand" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Supplier Performance Dashboard */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Supplier Performance</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">On-Time Delivery Rate (%)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={supplierPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="supplier" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="onTimeDelivery" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Average Lead Time (Days)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={supplierPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="supplier" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgLeadTime" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Supplier Comparison Table */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Supplier Comparison</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      On-Time Delivery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Lead Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierPerformanceData.map((supplier, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {supplier.supplier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="mr-2">{supplier.onTimeDelivery}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${supplier.onTimeDelivery}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.avgLeadTime} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < supplier.costRating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">({supplier.costRating})</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
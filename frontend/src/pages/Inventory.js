"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const outline_1 = require("@heroicons/react/24/outline");
const recharts_1 = require("recharts");
const Inventory = () => {
    const [inventoryData, setInventoryData] = (0, react_1.useState)([]);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [filterStatus, setFilterStatus] = (0, react_1.useState)('all');
    const [sortField, setSortField] = (0, react_1.useState)('partNumber');
    const [sortDirection, setSortDirection] = (0, react_1.useState)('asc');
    const [selectedItem, setSelectedItem] = (0, react_1.useState)(null);
    // Mock data - in real implementation, this would come from API
    (0, react_1.useEffect)(() => {
        const mockData = [
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
    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy':
                return <outline_1.CheckCircleIcon className="h-5 w-5 text-green-500"/>;
            case 'low':
                return <outline_1.ExclamationTriangleIcon className="h-5 w-5 text-yellow-500"/>;
            case 'critical':
            case 'out_of_stock':
                return <outline_1.ExclamationTriangleIcon className="h-5 w-5 text-red-500"/>;
            default:
                return null;
        }
    };
    const getStatusColor = (status) => {
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
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }
        else {
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
    return (<div>
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
                <outline_1.CheckCircleIcon className="h-8 w-8 text-green-500"/>
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
                <outline_1.ExclamationTriangleIcon className="h-8 w-8 text-yellow-500"/>
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
                <outline_1.ExclamationTriangleIcon className="h-8 w-8 text-red-500"/>
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
                <outline_1.MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                <input type="text" placeholder="Search by part number or description..." className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <outline_1.FunnelIcon className="h-5 w-5 text-gray-400"/>
              <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('partNumber')}>
                  <div className="flex items-center">
                    Part Number
                    {sortField === 'partNumber' && (sortDirection === 'asc' ? <outline_1.ArrowUpIcon className="ml-1 h-4 w-4"/> : <outline_1.ArrowDownIcon className="ml-1 h-4 w-4"/>)}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('currentStock')}>
                  <div className="flex items-center">
                    Current Stock
                    {sortField === 'currentStock' && (sortDirection === 'asc' ? <outline_1.ArrowUpIcon className="ml-1 h-4 w-4"/> : <outline_1.ArrowDownIcon className="ml-1 h-4 w-4"/>)}
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
              {filteredAndSortedData.map((item) => (<tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.partNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="mr-2">{item.currentStock}</span>
                      {item.currentStock <= item.reorderPoint && (<outline_1.ExclamationTriangleIcon className="h-4 w-4 text-yellow-500"/>)}
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
                    <button onClick={() => setSelectedItem(item)} className="text-primary-600 hover:text-primary-900">
                      View Details
                    </button>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demand Forecasting Chart */}
      {selectedItem && (<div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Demand Forecast - {selectedItem.partNumber}
            </h3>
          </div>
          <div className="p-6">
            <recharts_1.ResponsiveContainer width="100%" height={300}>
              <recharts_1.LineChart data={selectedItem.demandForecast}>
                <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                <recharts_1.XAxis dataKey="date"/>
                <recharts_1.YAxis />
                <recharts_1.Tooltip />
                <recharts_1.Line type="monotone" dataKey="demand" stroke="#3b82f6" strokeWidth={2}/>
              </recharts_1.LineChart>
            </recharts_1.ResponsiveContainer>
          </div>
        </div>)}

      {/* Supplier Performance Dashboard */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Supplier Performance</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">On-Time Delivery Rate (%)</h4>
              <recharts_1.ResponsiveContainer width="100%" height={200}>
                <recharts_1.BarChart data={supplierPerformanceData}>
                  <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                  <recharts_1.XAxis dataKey="supplier"/>
                  <recharts_1.YAxis />
                  <recharts_1.Tooltip />
                  <recharts_1.Bar dataKey="onTimeDelivery" fill="#10b981"/>
                </recharts_1.BarChart>
              </recharts_1.ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Average Lead Time (Days)</h4>
              <recharts_1.ResponsiveContainer width="100%" height={200}>
                <recharts_1.BarChart data={supplierPerformanceData}>
                  <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                  <recharts_1.XAxis dataKey="supplier"/>
                  <recharts_1.YAxis />
                  <recharts_1.Tooltip />
                  <recharts_1.Bar dataKey="avgLeadTime" fill="#f59e0b"/>
                </recharts_1.BarChart>
              </recharts_1.ResponsiveContainer>
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
                  {supplierPerformanceData.map((supplier, index) => (<tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {supplier.supplier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="mr-2">{supplier.onTimeDelivery}%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${supplier.onTimeDelivery}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.avgLeadTime} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (<span key={i} className={`text-sm ${i < supplier.costRating ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>))}
                          <span className="ml-2 text-sm text-gray-600">({supplier.costRating})</span>
                        </div>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>);
};
exports.default = Inventory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW52ZW50b3J5LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQW1EO0FBQ25ELHlEQU9xQztBQUNyQyx1Q0FBcUg7QUFpQnJILE1BQU0sU0FBUyxHQUFhLEdBQUcsRUFBRTtJQUMvQixNQUFNLENBQUMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLEdBQUcsSUFBQSxnQkFBUSxFQUFrQixFQUFFLENBQUMsQ0FBQztJQUN4RSxNQUFNLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBQyxFQUFFLENBQUMsQ0FBQztJQUNqRCxNQUFNLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBUyxLQUFLLENBQUMsQ0FBQztJQUNoRSxNQUFNLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBc0IsWUFBWSxDQUFDLENBQUM7SUFDOUUsTUFBTSxDQUFDLGFBQWEsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBaUIsS0FBSyxDQUFDLENBQUM7SUFDMUUsTUFBTSxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQXVCLElBQUksQ0FBQyxDQUFDO0lBRTdFLCtEQUErRDtJQUMvRCxJQUFBLGlCQUFTLEVBQUMsR0FBRyxFQUFFO1FBQ2IsTUFBTSxRQUFRLEdBQW9CO1lBQ2hDO2dCQUNFLEVBQUUsRUFBRSxHQUFHO2dCQUNQLFVBQVUsRUFBRSxTQUFTO2dCQUNyQixXQUFXLEVBQUUsdUJBQXVCO2dCQUNwQyxRQUFRLEVBQUUsUUFBUTtnQkFDbEIsWUFBWSxFQUFFLEVBQUU7Z0JBQ2hCLFdBQVcsRUFBRSxFQUFFO2dCQUNmLFlBQVksRUFBRSxFQUFFO2dCQUNoQixRQUFRLEVBQUUsS0FBSztnQkFDZixRQUFRLEVBQUUs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Q1IsQ0FBQyxDQUNGOzBCQUFBLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUM1RTt3QkFBQSxFQUFFLEdBQUcsQ0FDUDtzQkFBQSxFQUFFLEVBQUUsQ0FDTjtvQkFBQSxFQUFFLEVBQUUsQ0FBQyxDQUNOLENBQUMsQ0FDSjtnQkFBQSxFQUFFLEtBQUssQ0FDVDtjQUFBLEVBQUUsS0FBSyxDQUNUO1lBQUEsRUFBRSxHQUFHLENBQ1A7VUFBQSxFQUFFLEdBQUcsQ0FDUDtRQUFBLEVBQUUsR0FBRyxDQUNQO01BQUEsRUFBRSxHQUFHLENBQ1A7SUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUM7QUFDSixDQUFDLENBQUM7QUFFRixrQkFBZSxTQUFTLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHtcclxuICBNYWduaWZ5aW5nR2xhc3NJY29uLFxyXG4gIEZ1bm5lbEljb24sXHJcbiAgQXJyb3dEb3duSWNvbixcclxuICBBcnJvd1VwSWNvbixcclxuICBFeGNsYW1hdGlvblRyaWFuZ2xlSWNvbixcclxuICBDaGVja0NpcmNsZUljb24sXHJcbn0gZnJvbSAnQGhlcm9pY29ucy9yZWFjdC8yNC9vdXRsaW5lJztcclxuaW1wb3J0IHsgTGluZUNoYXJ0LCBMaW5lLCBYQXhpcywgWUF4aXMsIENhcnRlc2lhbkdyaWQsIFRvb2x0aXAsIFJlc3BvbnNpdmVDb250YWluZXIsIEJhckNoYXJ0LCBCYXIgfSBmcm9tICdyZWNoYXJ0cyc7XHJcblxyXG5pbnRlcmZhY2UgSW52ZW50b3J5SXRlbSB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBwYXJ0TnVtYmVyOiBzdHJpbmc7XHJcbiAgZGVzY3JpcHRpb246IHN0cmluZztcclxuICBjYXRlZ29yeTogc3RyaW5nO1xyXG4gIGN1cnJlbnRTdG9jazogbnVtYmVyO1xyXG4gIHNhZmV0eVN0b2NrOiBudW1iZXI7XHJcbiAgcmVvcmRlclBvaW50OiBudW1iZXI7XHJcbiAgdW5pdENvc3Q6IG51bWJlcjtcclxuICBzdXBwbGllcjogc3RyaW5nO1xyXG4gIGxhc3RVcGRhdGVkOiBEYXRlO1xyXG4gIHN0YXR1czogJ2hlYWx0aHknIHwgJ2xvdycgfCAnY3JpdGljYWwnIHwgJ291dF9vZl9zdG9jayc7XHJcbiAgZGVtYW5kRm9yZWNhc3Q6IEFycmF5PHsgZGF0ZTogc3RyaW5nOyBkZW1hbmQ6IG51bWJlciB9PjtcclxufVxyXG5cclxuY29uc3QgSW52ZW50b3J5OiBSZWFjdC5GQyA9ICgpID0+IHtcclxuICBjb25zdCBbaW52ZW50b3J5RGF0YSwgc2V0SW52ZW50b3J5RGF0YV0gPSB1c2VTdGF0ZTxJbnZlbnRvcnlJdGVtW10+KFtdKTtcclxuICBjb25zdCBbc2VhcmNoVGVybSwgc2V0U2VhcmNoVGVybV0gPSB1c2VTdGF0ZSgnJyk7XHJcbiAgY29uc3QgW2ZpbHRlclN0YXR1cywgc2V0RmlsdGVyU3RhdHVzXSA9IHVzZVN0YXRlPHN0cmluZz4oJ2FsbCcpO1xyXG4gIGNvbnN0IFtzb3J0RmllbGQsIHNldFNvcnRGaWVsZF0gPSB1c2VTdGF0ZTxrZXlvZiBJbnZlbnRvcnlJdGVtPigncGFydE51bWJlcicpO1xyXG4gIGNvbnN0IFtzb3J0RGlyZWN0aW9uLCBzZXRTb3J0RGlyZWN0aW9uXSA9IHVzZVN0YXRlPCdhc2MnIHwgJ2Rlc2MnPignYXNjJyk7XHJcbiAgY29uc3QgW3NlbGVjdGVkSXRlbSwgc2V0U2VsZWN0ZWRJdGVtXSA9IHVzZVN0YXRlPEludmVudG9yeUl0ZW0gfCBudWxsPihudWxsKTtcclxuXHJcbiAgLy8gTW9jayBkYXRhIC0gaW4gcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBjb21lIGZyb20gQVBJXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGNvbnN0IG1vY2tEYXRhOiBJbnZlbnRvcnlJdGVtW10gPSBbXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJzEnLFxyXG4gICAgICAgIHBhcnROdW1iZXI6ICdCUkstMDAxJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0JyYWtlIFBhZCBTZXQgLSBGcm9udCcsXHJcbiAgICAgICAgY2F0ZWdvcnk6ICdCcmFrZXMnLFxyXG4gICAgICAgIGN1cnJlbnRTdG9jazogNDUsXHJcbiAgICAgICAgc2FmZXR5U3RvY2s6IDIwLFxyXG4gICAgICAgIHJlb3JkZXJQb2ludDogMzAsXHJcbiAgICAgICAgdW5pdENvc3Q6IDg5Ljk5LFxyXG4gICAgICAgIHN1cHBsaWVyOiAnQXV0b1BhcnRzIEluYycsXHJcbiAgICAgICAgbGFzdFVwZGF0ZWQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgc3RhdHVzOiAnaGVhbHRoeScsXHJcbiAgICAgICAgZGVtYW5kRm9yZWNhc3Q6IFtcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDEnLCBkZW1hbmQ6IDEyIH0sXHJcbiAgICAgICAgICB7IGRhdGU6ICcyMDI0LTAyJywgZGVtYW5kOiAxNSB9LFxyXG4gICAgICAgICAgeyBkYXRlOiAnMjAyNC0wMycsIGRlbWFuZDogMTggfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDQnLCBkZW1hbmQ6IDE0IH0sXHJcbiAgICAgICAgICB7IGRhdGU6ICcyMDI0LTA1JywgZGVtYW5kOiAxNiB9LFxyXG4gICAgICAgICAgeyBkYXRlOiAnMjAyNC0wNicsIGRlbWFuZDogMjAgfSxcclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJzInLFxyXG4gICAgICAgIHBhcnROdW1iZXI6ICdFTkctMjA1JyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ09pbCBGaWx0ZXIgLSBQcmVtaXVtJyxcclxuICAgICAgICBjYXRlZ29yeTogJ0VuZ2luZScsXHJcbiAgICAgICAgY3VycmVudFN0b2NrOiA4LFxyXG4gICAgICAgIHNhZmV0eVN0b2NrOiAxNSxcclxuICAgICAgICByZW9yZGVyUG9pbnQ6IDI1LFxyXG4gICAgICAgIHVuaXRDb3N0OiAyNC41MCxcclxuICAgICAgICBzdXBwbGllcjogJ0ZpbHRlck1heCcsXHJcbiAgICAgICAgbGFzdFVwZGF0ZWQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgc3RhdHVzOiAnY3JpdGljYWwnLFxyXG4gICAgICAgIGRlbWFuZEZvcmVjYXN0OiBbXHJcbiAgICAgICAgICB7IGRhdGU6ICcyMDI0LTAxJywgZGVtYW5kOiAyNSB9LFxyXG4gICAgICAgICAgeyBkYXRlOiAnMjAyNC0wMicsIGRlbWFuZDogMjggfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDMnLCBkZW1hbmQ6IDMwIH0sXHJcbiAgICAgICAgICB7IGRhdGU6ICcyMDI0LTA0JywgZGVtYW5kOiAyMiB9LFxyXG4gICAgICAgICAgeyBkYXRlOiAnMjAyNC0wNScsIGRlbWFuZDogMjYgfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDYnLCBkZW1hbmQ6IDMyIH0sXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICczJyxcclxuICAgICAgICBwYXJ0TnVtYmVyOiAnVElSLTE1MCcsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdBbGwtU2Vhc29uIFRpcmUgMjI1LzYwUjE2JyxcclxuICAgICAgICBjYXRlZ29yeTogJ1RpcmVzJyxcclxuICAgICAgICBjdXJyZW50U3RvY2s6IDI0LFxyXG4gICAgICAgIHNhZmV0eVN0b2NrOiAxMixcclxuICAgICAgICByZW9yZGVyUG9pbnQ6IDE4LFxyXG4gICAgICAgIHVuaXRDb3N0OiAxNDUuMDAsXHJcbiAgICAgICAgc3VwcGxpZXI6ICdUaXJlV29ybGQnLFxyXG4gICAgICAgIGxhc3RVcGRhdGVkOiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgIHN0YXR1czogJ2xvdycsXHJcbiAgICAgICAgZGVtYW5kRm9yZWNhc3Q6IFtcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDEnLCBkZW1hbmQ6IDggfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDInLCBkZW1hbmQ6IDYgfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDMnLCBkZW1hbmQ6IDEyIH0sXHJcbiAgICAgICAgICB7IGRhdGU6ICcyMDI0LTA0JywgZGVtYW5kOiAxNSB9LFxyXG4gICAgICAgICAgeyBkYXRlOiAnMjAyNC0wNScsIGRlbWFuZDogMTggfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDYnLCBkZW1hbmQ6IDEwIH0sXHJcbiAgICAgICAgXVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICc0JyxcclxuICAgICAgICBwYXJ0TnVtYmVyOiAnQkFULTMwMCcsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdDYXIgQmF0dGVyeSAxMlYgNzBBaCcsXHJcbiAgICAgICAgY2F0ZWdvcnk6ICdFbGVjdHJpY2FsJyxcclxuICAgICAgICBjdXJyZW50U3RvY2s6IDAsXHJcbiAgICAgICAgc2FmZXR5U3RvY2s6IDUsXHJcbiAgICAgICAgcmVvcmRlclBvaW50OiA4LFxyXG4gICAgICAgIHVuaXRDb3N0OiAxMjAuMDAsXHJcbiAgICAgICAgc3VwcGxpZXI6ICdQb3dlckNlbGwgQ28nLFxyXG4gICAgICAgIGxhc3RVcGRhdGVkOiBuZXcgRGF0ZSgpLFxyXG4gICAgICAgIHN0YXR1czogJ291dF9vZl9zdG9jaycsXHJcbiAgICAgICAgZGVtYW5kRm9yZWNhc3Q6IFtcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDEnLCBkZW1hbmQ6IDQgfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDInLCBkZW1hbmQ6IDYgfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDMnLCBkZW1hbmQ6IDggfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDQnLCBkZW1hbmQ6IDUgfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDUnLCBkZW1hbmQ6IDcgfSxcclxuICAgICAgICAgIHsgZGF0ZTogJzIwMjQtMDYnLCBkZW1hbmQ6IDkgfSxcclxuICAgICAgICBdXHJcbiAgICAgIH0sXHJcbiAgICBdO1xyXG4gICAgc2V0SW52ZW50b3J5RGF0YShtb2NrRGF0YSk7XHJcbiAgfSwgW10pO1xyXG5cclxuICBjb25zdCBnZXRTdGF0dXNJY29uID0gKHN0YXR1czogc3RyaW5nKSA9PiB7XHJcbiAgICBzd2l0Y2ggKHN0YXR1cykge1xyXG4gICAgICBjYXNlICdoZWFsdGh5JzpcclxuICAgICAgICByZXR1cm4gPENoZWNrQ2lyY2xlSWNvbiBjbGFzc05hbWU9XCJoLTUgdy01IHRleHQtZ3JlZW4tNTAwXCIgLz47XHJcbiAgICAgIGNhc2UgJ2xvdyc6XHJcbiAgICAgICAgcmV0dXJuIDxFeGNsYW1hdGlvblRyaWFuZ2xlSWNvbiBjbGFzc05hbWU9XCJoLTUgdy01IHRleHQteWVsbG93LTUwMFwiIC8+O1xyXG4gICAgICBjYXNlICdjcml0aWNhbCc6XHJcbiAgICAgIGNhc2UgJ291dF9vZl9zdG9jayc6XHJcbiAgICAgICAgcmV0dXJuIDxFeGNsYW1hdGlvblRyaWFuZ2xlSWNvbiBjbGFzc05hbWU9XCJoLTUgdy01IHRleHQtcmVkLTUwMFwiIC8+O1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGdldFN0YXR1c0NvbG9yID0gKHN0YXR1czogc3RyaW5nKSA9PiB7XHJcbiAgICBzd2l0Y2ggKHN0YXR1cykge1xyXG4gICAgICBjYXNlICdoZWFsdGh5JzpcclxuICAgICAgICByZXR1cm4gJ2JnLWdyZWVuLTEwMCB0ZXh0LWdyZWVuLTgwMCc7XHJcbiAgICAgIGNhc2UgJ2xvdyc6XHJcbiAgICAgICAgcmV0dXJuICdiZy15ZWxsb3ctMTAwIHRleHQteWVsbG93LTgwMCc7XHJcbiAgICAgIGNhc2UgJ2NyaXRpY2FsJzpcclxuICAgICAgICByZXR1cm4gJ2JnLXJlZC0xMDAgdGV4dC1yZWQtODAwJztcclxuICAgICAgY2FzZSAnb3V0X29mX3N0b2NrJzpcclxuICAgICAgICByZXR1cm4gJ2JnLXJlZC0xMDAgdGV4dC1yZWQtODAwJztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gJ2JnLWdyYXktMTAwIHRleHQtZ3JheS04MDAnO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGZpbHRlcmVkQW5kU29ydGVkRGF0YSA9IGludmVudG9yeURhdGFcclxuICAgIC5maWx0ZXIoaXRlbSA9PiB7XHJcbiAgICAgIGNvbnN0IG1hdGNoZXNTZWFyY2ggPSBpdGVtLnBhcnROdW1iZXIudG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhzZWFyY2hUZXJtLnRvTG93ZXJDYXNlKCkpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uZGVzY3JpcHRpb24udG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhzZWFyY2hUZXJtLnRvTG93ZXJDYXNlKCkpO1xyXG4gICAgICBjb25zdCBtYXRjaGVzRmlsdGVyID0gZmlsdGVyU3RhdHVzID09PSAnYWxsJyB8fCBpdGVtLnN0YXR1cyA9PT0gZmlsdGVyU3RhdHVzO1xyXG4gICAgICByZXR1cm4gbWF0Y2hlc1NlYXJjaCAmJiBtYXRjaGVzRmlsdGVyO1xyXG4gICAgfSlcclxuICAgIC5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgIGNvbnN0IGFWYWx1ZSA9IGFbc29ydEZpZWxkXTtcclxuICAgICAgY29uc3QgYlZhbHVlID0gYltzb3J0RmllbGRdO1xyXG4gICAgICBjb25zdCBkaXJlY3Rpb24gPSBzb3J0RGlyZWN0aW9uID09PSAnYXNjJyA/IDEgOiAtMTtcclxuICAgICAgXHJcbiAgICAgIGlmICh0eXBlb2YgYVZhbHVlID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgYlZhbHVlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHJldHVybiBhVmFsdWUubG9jYWxlQ29tcGFyZShiVmFsdWUpICogZGlyZWN0aW9uO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICh0eXBlb2YgYVZhbHVlID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgYlZhbHVlID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHJldHVybiAoYVZhbHVlIC0gYlZhbHVlKSAqIGRpcmVjdGlvbjtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gMDtcclxuICAgIH0pO1xyXG5cclxuICBjb25zdCBoYW5kbGVTb3J0ID0gKGZpZWxkOiBrZXlvZiBJbnZlbnRvcnlJdGVtKSA9PiB7XHJcbiAgICBpZiAoc29ydEZpZWxkID09PSBmaWVsZCkge1xyXG4gICAgICBzZXRTb3J0RGlyZWN0aW9uKHNvcnREaXJlY3Rpb24gPT09ICdhc2MnID8gJ2Rlc2MnIDogJ2FzYycpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2V0U29ydEZpZWxkKGZpZWxkKTtcclxuICAgICAgc2V0U29ydERpcmVjdGlvbignYXNjJyk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3Qgc3VwcGxpZXJQZXJmb3JtYW5jZURhdGEgPSBbXHJcbiAgICB7IHN1cHBsaWVyOiAnQXV0b1BhcnRzIEluYycsIG9uVGltZURlbGl2ZXJ5OiA5NSwgYXZnTGVhZFRpbWU6IDMuMiwgY29zdFJhdGluZzogNC4yIH0sXHJcbiAgICB7IHN1cHBsaWVyOiAnRmlsdGVyTWF4Jywgb25UaW1lRGVsaXZlcnk6IDg4LCBhdmdMZWFkVGltZTogNC4xLCBjb3N0UmF0aW5nOiA0LjUgfSxcclxuICAgIHsgc3VwcGxpZXI6ICdUaXJlV29ybGQnLCBvblRpbWVEZWxpdmVyeTogOTIsIGF2Z0xlYWRUaW1lOiAyLjgsIGNvc3RSYXRpbmc6IDMuOCB9LFxyXG4gICAgeyBzdXBwbGllcjogJ1Bvd2VyQ2VsbCBDbycsIG9uVGltZURlbGl2ZXJ5OiA4NSwgYXZnTGVhZFRpbWU6IDUuMiwgY29zdFJhdGluZzogNC4wIH0sXHJcbiAgXTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXY+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWItOFwiPlxyXG4gICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJvbGQgdGV4dC1ncmF5LTkwMFwiPkludmVudG9yeSBNYW5hZ2VtZW50PC9oMT5cclxuICAgICAgICA8cCBjbGFzc05hbWU9XCJtdC0yIHRleHQtc20gdGV4dC1ncmF5LTcwMFwiPlxyXG4gICAgICAgICAgTW9uaXRvciBjdXJyZW50IHN0b2NrIGxldmVscyBhbmQgbWFuYWdlIGludmVudG9yeSB3aXRoIHJlYWwtdGltZSB1cGRhdGVzXHJcbiAgICAgICAgPC9wPlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIHsvKiBTdW1tYXJ5IENhcmRzICovfVxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTEgZ2FwLTUgc206Z3JpZC1jb2xzLTIgbGc6Z3JpZC1jb2xzLTQgbWItOFwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgb3ZlcmZsb3ctaGlkZGVuIHNoYWRvdyByb3VuZGVkLWxnXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNVwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LXNocmluay0wXCI+XHJcbiAgICAgICAgICAgICAgICA8Q2hlY2tDaXJjbGVJY29uIGNsYXNzTmFtZT1cImgtOCB3LTggdGV4dC1ncmVlbi01MDBcIiAvPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtNSB3LTAgZmxleC0xXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGw+XHJcbiAgICAgICAgICAgICAgICAgIDxkdCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdHJ1bmNhdGVcIj5IZWFsdGh5IFN0b2NrPC9kdD5cclxuICAgICAgICAgICAgICAgICAgPGRkIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTkwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHtpbnZlbnRvcnlEYXRhLmZpbHRlcihpdGVtID0+IGl0ZW0uc3RhdHVzID09PSAnaGVhbHRoeScpLmxlbmd0aH1cclxuICAgICAgICAgICAgICAgICAgPC9kZD5cclxuICAgICAgICAgICAgICAgIDwvZGw+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgb3ZlcmZsb3ctaGlkZGVuIHNoYWRvdyByb3VuZGVkLWxnXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNVwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LXNocmluay0wXCI+XHJcbiAgICAgICAgICAgICAgICA8RXhjbGFtYXRpb25UcmlhbmdsZUljb24gY2xhc3NOYW1lPVwiaC04IHctOCB0ZXh0LXllbGxvdy01MDBcIiAvPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtNSB3LTAgZmxleC0xXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGw+XHJcbiAgICAgICAgICAgICAgICAgIDxkdCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdHJ1bmNhdGVcIj5Mb3cgU3RvY2s8L2R0PlxyXG4gICAgICAgICAgICAgICAgICA8ZGQgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAge2ludmVudG9yeURhdGEuZmlsdGVyKGl0ZW0gPT4gaXRlbS5zdGF0dXMgPT09ICdsb3cnKS5sZW5ndGh9XHJcbiAgICAgICAgICAgICAgICAgIDwvZGQ+XHJcbiAgICAgICAgICAgICAgICA8L2RsPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIG92ZXJmbG93LWhpZGRlbiBzaGFkb3cgcm91bmRlZC1sZ1wiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTVcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC1zaHJpbmstMFwiPlxyXG4gICAgICAgICAgICAgICAgPEV4Y2xhbWF0aW9uVHJpYW5nbGVJY29uIGNsYXNzTmFtZT1cImgtOCB3LTggdGV4dC1yZWQtNTAwXCIgLz5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1sLTUgdy0wIGZsZXgtMVwiPlxyXG4gICAgICAgICAgICAgICAgPGRsPlxyXG4gICAgICAgICAgICAgICAgICA8ZHQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHRydW5jYXRlXCI+Q3JpdGljYWw8L2R0PlxyXG4gICAgICAgICAgICAgICAgICA8ZGQgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAge2ludmVudG9yeURhdGEuZmlsdGVyKGl0ZW0gPT4gaXRlbS5zdGF0dXMgPT09ICdjcml0aWNhbCcgfHwgaXRlbS5zdGF0dXMgPT09ICdvdXRfb2Zfc3RvY2snKS5sZW5ndGh9XHJcbiAgICAgICAgICAgICAgICAgIDwvZGQ+XHJcbiAgICAgICAgICAgICAgICA8L2RsPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIG92ZXJmbG93LWhpZGRlbiBzaGFkb3cgcm91bmRlZC1sZ1wiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTVcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC1zaHJpbmstMFwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTggaC04IGJnLXByaW1hcnktNTAwIHJvdW5kZWQtbWQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC13aGl0ZSB0ZXh0LXNtIGZvbnQtbWVkaXVtXCI+JDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtNSB3LTAgZmxleC0xXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGw+XHJcbiAgICAgICAgICAgICAgICAgIDxkdCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdHJ1bmNhdGVcIj5Ub3RhbCBWYWx1ZTwvZHQ+XHJcbiAgICAgICAgICAgICAgICAgIDxkZCBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAke2ludmVudG9yeURhdGEucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIChpdGVtLmN1cnJlbnRTdG9jayAqIGl0ZW0udW5pdENvc3QpLCAwKS50b0xvY2FsZVN0cmluZygpfVxyXG4gICAgICAgICAgICAgICAgICA8L2RkPlxyXG4gICAgICAgICAgICAgICAgPC9kbD5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcblxyXG4gICAgICB7LyogU2VhcmNoIGFuZCBGaWx0ZXIgQ29udHJvbHMgKi99XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgc2hhZG93IHJvdW5kZWQtbGcgbWItNlwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC02XCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgZ2FwLTRcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTFcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlXCI+XHJcbiAgICAgICAgICAgICAgICA8TWFnbmlmeWluZ0dsYXNzSWNvbiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTMgdG9wLTEvMiB0cmFuc2Zvcm0gLXRyYW5zbGF0ZS15LTEvMiBoLTUgdy01IHRleHQtZ3JheS00MDBcIiAvPlxyXG4gICAgICAgICAgICAgICAgPGlucHV0XHJcbiAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcclxuICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJTZWFyY2ggYnkgcGFydCBudW1iZXIgb3IgZGVzY3JpcHRpb24uLi5cIlxyXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwbC0xMCBwci00IHB5LTIgdy1mdWxsIGJvcmRlciBib3JkZXItZ3JheS0zMDAgcm91bmRlZC1tZCBmb2N1czpyaW5nLXByaW1hcnktNTAwIGZvY3VzOmJvcmRlci1wcmltYXJ5LTUwMFwiXHJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hUZXJtfVxyXG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFNlYXJjaFRlcm0oZS50YXJnZXQudmFsdWUpfVxyXG4gICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgICA8RnVubmVsSWNvbiBjbGFzc05hbWU9XCJoLTUgdy01IHRleHQtZ3JheS00MDBcIiAvPlxyXG4gICAgICAgICAgICAgIDxzZWxlY3RcclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJvcmRlciBib3JkZXItZ3JheS0zMDAgcm91bmRlZC1tZCBweC0zIHB5LTIgZm9jdXM6cmluZy1wcmltYXJ5LTUwMCBmb2N1czpib3JkZXItcHJpbWFyeS01MDBcIlxyXG4gICAgICAgICAgICAgICAgdmFsdWU9e2ZpbHRlclN0YXR1c31cclxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RmlsdGVyU3RhdHVzKGUudGFyZ2V0LnZhbHVlKX1cclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiYWxsXCI+QWxsIFN0YXR1czwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImhlYWx0aHlcIj5IZWFsdGh5PC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwibG93XCI+TG93IFN0b2NrPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiY3JpdGljYWxcIj5Dcml0aWNhbDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIm91dF9vZl9zdG9ja1wiPk91dCBvZiBTdG9jazwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIHsvKiBJbnZlbnRvcnkgVGFibGUgKi99XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgc2hhZG93IHJvdW5kZWQtbGcgbWItOFwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtNiBweS00IGJvcmRlci1iIGJvcmRlci1ncmF5LTIwMFwiPlxyXG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTkwMFwiPkN1cnJlbnQgU3RvY2sgTGV2ZWxzPC9oMz5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm92ZXJmbG93LXgtYXV0b1wiPlxyXG4gICAgICAgICAgPHRhYmxlIGNsYXNzTmFtZT1cIm1pbi13LWZ1bGwgZGl2aWRlLXkgZGl2aWRlLWdyYXktMjAwXCI+XHJcbiAgICAgICAgICAgIDx0aGVhZCBjbGFzc05hbWU9XCJiZy1ncmF5LTUwXCI+XHJcbiAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgPHRoXHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LWxlZnQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBjdXJzb3ItcG9pbnRlciBob3ZlcjpiZy1ncmF5LTEwMFwiXHJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZVNvcnQoJ3BhcnROdW1iZXInKX1cclxuICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgIFBhcnQgTnVtYmVyXHJcbiAgICAgICAgICAgICAgICAgICAge3NvcnRGaWVsZCA9PT0gJ3BhcnROdW1iZXInICYmIChcclxuICAgICAgICAgICAgICAgICAgICAgIHNvcnREaXJlY3Rpb24gPT09ICdhc2MnID8gPEFycm93VXBJY29uIGNsYXNzTmFtZT1cIm1sLTEgaC00IHctNFwiIC8+IDogPEFycm93RG93bkljb24gY2xhc3NOYW1lPVwibWwtMSBoLTQgdy00XCIgLz5cclxuICAgICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIERlc2NyaXB0aW9uXHJcbiAgICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICAgICAgPHRoXHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LWxlZnQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciBjdXJzb3ItcG9pbnRlciBob3ZlcjpiZy1ncmF5LTEwMFwiXHJcbiAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZVNvcnQoJ2N1cnJlbnRTdG9jaycpfVxyXG4gICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgQ3VycmVudCBTdG9ja1xyXG4gICAgICAgICAgICAgICAgICAgIHtzb3J0RmllbGQgPT09ICdjdXJyZW50U3RvY2snICYmIChcclxuICAgICAgICAgICAgICAgICAgICAgIHNvcnREaXJlY3Rpb24gPT09ICdhc2MnID8gPEFycm93VXBJY29uIGNsYXNzTmFtZT1cIm1sLTEgaC00IHctNFwiIC8+IDogPEFycm93RG93bkljb24gY2xhc3NOYW1lPVwibWwtMSBoLTQgdy00XCIgLz5cclxuICAgICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIFJlb3JkZXIgUG9pbnRcclxuICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIFN0YXR1c1xyXG4gICAgICAgICAgICAgICAgPC90aD5cclxuICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC02IHB5LTMgdGV4dC1sZWZ0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cclxuICAgICAgICAgICAgICAgICAgU3VwcGxpZXJcclxuICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIEFjdGlvbnNcclxuICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgPHRib2R5IGNsYXNzTmFtZT1cImJnLXdoaXRlIGRpdmlkZS15IGRpdmlkZS1ncmF5LTIwMFwiPlxyXG4gICAgICAgICAgICAgIHtmaWx0ZXJlZEFuZFNvcnRlZERhdGEubWFwKChpdGVtKSA9PiAoXHJcbiAgICAgICAgICAgICAgICA8dHIga2V5PXtpdGVtLmlkfSBjbGFzc05hbWU9XCJob3ZlcjpiZy1ncmF5LTUwXCI+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAge2l0ZW0ucGFydE51bWJlcn1cclxuICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIHRleHQtZ3JheS01MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICB7aXRlbS5kZXNjcmlwdGlvbn1cclxuICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtci0yXCI+e2l0ZW0uY3VycmVudFN0b2NrfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLmN1cnJlbnRTdG9jayA8PSBpdGVtLnJlb3JkZXJQb2ludCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxFeGNsYW1hdGlvblRyaWFuZ2xlSWNvbiBjbGFzc05hbWU9XCJoLTQgdy00IHRleHQteWVsbG93LTUwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtNiBweS00IHdoaXRlc3BhY2Utbm93cmFwIHRleHQtc20gdGV4dC1ncmF5LTUwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHtpdGVtLnJlb3JkZXJQb2ludH1cclxuICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtnZXRTdGF0dXNJY29uKGl0ZW0uc3RhdHVzKX1cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YG1sLTIgaW5saW5lLWZsZXggcHgtMiBweS0xIHRleHQteHMgZm9udC1zZW1pYm9sZCByb3VuZGVkLWZ1bGwgJHtnZXRTdGF0dXNDb2xvcihpdGVtLnN0YXR1cyl9YH0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLnN0YXR1cy5yZXBsYWNlKCdfJywgJyAnKS50b1VwcGVyQ2FzZSgpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtNiBweS00IHdoaXRlc3BhY2Utbm93cmFwIHRleHQtc20gdGV4dC1ncmF5LTUwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHtpdGVtLnN1cHBsaWVyfVxyXG4gICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtNiBweS00IHdoaXRlc3BhY2Utbm93cmFwIHRleHQtc20gZm9udC1tZWRpdW1cIj5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTZWxlY3RlZEl0ZW0oaXRlbSl9XHJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LXByaW1hcnktNjAwIGhvdmVyOnRleHQtcHJpbWFyeS05MDBcIlxyXG4gICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgIFZpZXcgRGV0YWlsc1xyXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICApKX1cclxuICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgey8qIERlbWFuZCBGb3JlY2FzdGluZyBDaGFydCAqL31cclxuICAgICAge3NlbGVjdGVkSXRlbSAmJiAoXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBzaGFkb3cgcm91bmRlZC1sZyBtYi04XCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTYgcHktNCBib3JkZXItYiBib3JkZXItZ3JheS0yMDBcIj5cclxuICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTkwMFwiPlxyXG4gICAgICAgICAgICAgIERlbWFuZCBGb3JlY2FzdCAtIHtzZWxlY3RlZEl0ZW0ucGFydE51bWJlcn1cclxuICAgICAgICAgICAgPC9oMz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTZcIj5cclxuICAgICAgICAgICAgPFJlc3BvbnNpdmVDb250YWluZXIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PXszMDB9PlxyXG4gICAgICAgICAgICAgIDxMaW5lQ2hhcnQgZGF0YT17c2VsZWN0ZWRJdGVtLmRlbWFuZEZvcmVjYXN0fT5cclxuICAgICAgICAgICAgICAgIDxDYXJ0ZXNpYW5HcmlkIHN0cm9rZURhc2hhcnJheT1cIjMgM1wiIC8+XHJcbiAgICAgICAgICAgICAgICA8WEF4aXMgZGF0YUtleT1cImRhdGVcIiAvPlxyXG4gICAgICAgICAgICAgICAgPFlBeGlzIC8+XHJcbiAgICAgICAgICAgICAgICA8VG9vbHRpcCAvPlxyXG4gICAgICAgICAgICAgICAgPExpbmUgdHlwZT1cIm1vbm90b25lXCIgZGF0YUtleT1cImRlbWFuZFwiIHN0cm9rZT1cIiMzYjgyZjZcIiBzdHJva2VXaWR0aD17Mn0gLz5cclxuICAgICAgICAgICAgICA8L0xpbmVDaGFydD5cclxuICAgICAgICAgICAgPC9SZXNwb25zaXZlQ29udGFpbmVyPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICl9XHJcblxyXG4gICAgICB7LyogU3VwcGxpZXIgUGVyZm9ybWFuY2UgRGFzaGJvYXJkICovfVxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHNoYWRvdyByb3VuZGVkLWxnXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC02IHB5LTQgYm9yZGVyLWIgYm9yZGVyLWdyYXktMjAwXCI+XHJcbiAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+U3VwcGxpZXIgUGVyZm9ybWFuY2U8L2gzPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC02XCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTEgbGc6Z3JpZC1jb2xzLTIgZ2FwLTZcIj5cclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwIG1iLTRcIj5Pbi1UaW1lIERlbGl2ZXJ5IFJhdGUgKCUpPC9oND5cclxuICAgICAgICAgICAgICA8UmVzcG9uc2l2ZUNvbnRhaW5lciB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9ezIwMH0+XHJcbiAgICAgICAgICAgICAgICA8QmFyQ2hhcnQgZGF0YT17c3VwcGxpZXJQZXJmb3JtYW5jZURhdGF9PlxyXG4gICAgICAgICAgICAgICAgICA8Q2FydGVzaWFuR3JpZCBzdHJva2VEYXNoYXJyYXk9XCIzIDNcIiAvPlxyXG4gICAgICAgICAgICAgICAgICA8WEF4aXMgZGF0YUtleT1cInN1cHBsaWVyXCIgLz5cclxuICAgICAgICAgICAgICAgICAgPFlBeGlzIC8+XHJcbiAgICAgICAgICAgICAgICAgIDxUb29sdGlwIC8+XHJcbiAgICAgICAgICAgICAgICAgIDxCYXIgZGF0YUtleT1cIm9uVGltZURlbGl2ZXJ5XCIgZmlsbD1cIiMxMGI5ODFcIiAvPlxyXG4gICAgICAgICAgICAgICAgPC9CYXJDaGFydD5cclxuICAgICAgICAgICAgICA8L1Jlc3BvbnNpdmVDb250YWluZXI+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDAgbWItNFwiPkF2ZXJhZ2UgTGVhZCBUaW1lIChEYXlzKTwvaDQ+XHJcbiAgICAgICAgICAgICAgPFJlc3BvbnNpdmVDb250YWluZXIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PXsyMDB9PlxyXG4gICAgICAgICAgICAgICAgPEJhckNoYXJ0IGRhdGE9e3N1cHBsaWVyUGVyZm9ybWFuY2VEYXRhfT5cclxuICAgICAgICAgICAgICAgICAgPENhcnRlc2lhbkdyaWQgc3Ryb2tlRGFzaGFycmF5PVwiMyAzXCIgLz5cclxuICAgICAgICAgICAgICAgICAgPFhBeGlzIGRhdGFLZXk9XCJzdXBwbGllclwiIC8+XHJcbiAgICAgICAgICAgICAgICAgIDxZQXhpcyAvPlxyXG4gICAgICAgICAgICAgICAgICA8VG9vbHRpcCAvPlxyXG4gICAgICAgICAgICAgICAgICA8QmFyIGRhdGFLZXk9XCJhdmdMZWFkVGltZVwiIGZpbGw9XCIjZjU5ZTBiXCIgLz5cclxuICAgICAgICAgICAgICAgIDwvQmFyQ2hhcnQ+XHJcbiAgICAgICAgICAgICAgPC9SZXNwb25zaXZlQ29udGFpbmVyPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICB7LyogU3VwcGxpZXIgQ29tcGFyaXNvbiBUYWJsZSAqL31cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtNlwiPlxyXG4gICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwIG1iLTRcIj5TdXBwbGllciBDb21wYXJpc29uPC9oND5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvdmVyZmxvdy14LWF1dG9cIj5cclxuICAgICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwibWluLXctZnVsbCBkaXZpZGUteSBkaXZpZGUtZ3JheS0yMDBcIj5cclxuICAgICAgICAgICAgICAgIDx0aGVhZCBjbGFzc05hbWU9XCJiZy1ncmF5LTUwXCI+XHJcbiAgICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICBTdXBwbGllclxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LWxlZnQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgT24tVGltZSBEZWxpdmVyeVxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LWxlZnQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgQXZnIExlYWQgVGltZVxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LWxlZnQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgQ29zdCBSYXRpbmdcclxuICAgICAgICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJiZy13aGl0ZSBkaXZpZGUteSBkaXZpZGUtZ3JheS0yMDBcIj5cclxuICAgICAgICAgICAgICAgICAge3N1cHBsaWVyUGVyZm9ybWFuY2VEYXRhLm1hcCgoc3VwcGxpZXIsIGluZGV4KSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17aW5kZXh9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge3N1cHBsaWVyLnN1cHBsaWVyfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1zbSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtci0yXCI+e3N1cHBsaWVyLm9uVGltZURlbGl2ZXJ5fSU8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE2IGJnLWdyYXktMjAwIHJvdW5kZWQtZnVsbCBoLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctZ3JlZW4tNjAwIGgtMiByb3VuZGVkLWZ1bGxcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyB3aWR0aDogYCR7c3VwcGxpZXIub25UaW1lRGVsaXZlcnl9JWAgfX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge3N1cHBsaWVyLmF2Z0xlYWRUaW1lfSBkYXlzXHJcbiAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtbLi4uQXJyYXkoNSldLm1hcCgoXywgaSkgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXtpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B0ZXh0LXNtICR7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA8IHN1cHBsaWVyLmNvc3RSYXRpbmcgPyAndGV4dC15ZWxsb3ctNDAwJyA6ICd0ZXh0LWdyYXktMzAwJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9YH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg4piFXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWwtMiB0ZXh0LXNtIHRleHQtZ3JheS02MDBcIj4oe3N1cHBsaWVyLmNvc3RSYXRpbmd9KTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBJbnZlbnRvcnk7Il19
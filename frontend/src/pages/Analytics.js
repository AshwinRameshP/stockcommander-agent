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
const Analytics = () => {
    const [metrics, setMetrics] = (0, react_1.useState)(null);
    const [trendData, setTrendData] = (0, react_1.useState)([]);
    const [categoryData, setCategoryData] = (0, react_1.useState)([]);
    const [dateRange, setDateRange] = (0, react_1.useState)('6months');
    const [selectedReport] = (0, react_1.useState)('performance');
    const [alertSettings, setAlertSettings] = (0, react_1.useState)({
        lowStockThreshold: 20,
        highCostThreshold: 10000,
        emailNotifications: true,
        smsNotifications: false,
    });
    // Mock data - in real implementation, this would come from API
    (0, react_1.useEffect)(() => {
        const mockMetrics = {
            inventoryTurnover: 8.2,
            carryingCosts: 145000,
            stockoutIncidents: 12,
            costSavings: 89500,
            forecastAccuracy: 87.3,
            avgLeadTime: 4.2,
        };
        const mockTrendData = [
            { month: 'Aug 2023', inventoryValue: 2100000, turnover: 7.8, stockouts: 15, savings: 45000 },
            { month: 'Sep 2023', inventoryValue: 2250000, turnover: 8.1, stockouts: 12, savings: 52000 },
            { month: 'Oct 2023', inventoryValue: 2180000, turnover: 8.3, stockouts: 8, savings: 61000 },
            { month: 'Nov 2023', inventoryValue: 2320000, turnover: 7.9, stockouts: 14, savings: 48000 },
            { month: 'Dec 2023', inventoryValue: 2400000, turnover: 8.5, stockouts: 6, savings: 73000 },
            { month: 'Jan 2024', inventoryValue: 2350000, turnover: 8.2, stockouts: 9, savings: 67000 },
        ];
        const mockCategoryData = [
            { category: 'Engine Parts', value: 35, color: '#3b82f6' },
            { category: 'Brakes', value: 25, color: '#10b981' },
            { category: 'Tires', value: 20, color: '#f59e0b' },
            { category: 'Electrical', value: 12, color: '#ef4444' },
            { category: 'Other', value: 8, color: '#8b5cf6' },
        ];
        setMetrics(mockMetrics);
        setTrendData(mockTrendData);
        setCategoryData(mockCategoryData);
    }, [dateRange]);
    const handleExportReport = (format) => {
        // In real implementation, this would generate and download the report
        alert(`Exporting ${selectedReport} report as ${format.toUpperCase()}...`);
    };
    const handleSaveAlertSettings = () => {
        // In real implementation, this would save to backend
        alert('Alert settings saved successfully!');
    };
    const supplierPerformanceData = [
        { supplier: 'AutoParts Inc', performance: 95, cost: 4.2, leadTime: 3.2 },
        { supplier: 'FilterMax', performance: 88, cost: 4.5, leadTime: 4.1 },
        { supplier: 'TireWorld', performance: 92, cost: 3.8, leadTime: 2.8 },
        { supplier: 'PowerCell Co', performance: 85, cost: 4.0, leadTime: 5.2 },
    ];
    const demandForecastData = [
        { month: 'Feb 2024', actual: 1250, predicted: 1200, accuracy: 96 },
        { month: 'Mar 2024', actual: 1380, predicted: 1350, accuracy: 98 },
        { month: 'Apr 2024', actual: 1420, predicted: 1400, accuracy: 99 },
        { month: 'May 2024', actual: 1180, predicted: 1250, accuracy: 94 },
        { month: 'Jun 2024', actual: 1350, predicted: 1320, accuracy: 98 },
        { month: 'Jul 2024', actual: 1480, predicted: 1450, accuracy: 98 },
    ];
    return (<div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="mt-2 text-sm text-gray-700">
              Performance metrics, cost savings analysis, and business intelligence
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="2years">Last 2 Years</option>
            </select>
            <button onClick={() => handleExportReport('pdf')} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <outline_1.ArrowDownTrayIcon className="h-4 w-4 mr-2"/>
              Export PDF
            </button>
            <button onClick={() => handleExportReport('excel')} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <outline_1.ArrowDownTrayIcon className="h-4 w-4 mr-2"/>
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      {metrics && (<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <outline_1.ChartBarIcon className="h-8 w-8 text-primary-500"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inventory Turnover
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {metrics.inventoryTurnover}x
                    </dd>
                    <dd className="text-sm text-green-600">+12% from last period</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <outline_1.CurrencyDollarIcon className="h-8 w-8 text-green-500"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Cost Savings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${metrics.costSavings.toLocaleString()}
                    </dd>
                    <dd className="text-sm text-green-600">+23% from last period</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <outline_1.TruckIcon className="h-8 w-8 text-yellow-500"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Stockout Incidents
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {metrics.stockoutIncidents}
                    </dd>
                    <dd className="text-sm text-red-600">-8% from last period</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <outline_1.CurrencyDollarIcon className="h-8 w-8 text-red-500"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Carrying Costs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${metrics.carryingCosts.toLocaleString()}
                    </dd>
                    <dd className="text-sm text-green-600">-15% from last period</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <outline_1.ChartBarIcon className="h-8 w-8 text-blue-500"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Forecast Accuracy
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {metrics.forecastAccuracy}%
                    </dd>
                    <dd className="text-sm text-green-600">+5% from last period</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <outline_1.ClockIcon className="h-8 w-8 text-purple-500"/>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Lead Time
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {metrics.avgLeadTime} days
                    </dd>
                    <dd className="text-sm text-green-600">-0.3 days from last period</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>)}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Inventory Value Trend */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Inventory Value Trend</h3>
          </div>
          <div className="p-6">
            <recharts_1.ResponsiveContainer width="100%" height={300}>
              <recharts_1.AreaChart data={trendData}>
                <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                <recharts_1.XAxis dataKey="month"/>
                <recharts_1.YAxis />
                <recharts_1.Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Inventory Value']}/>
                <recharts_1.Area type="monotone" dataKey="inventoryValue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3}/>
              </recharts_1.AreaChart>
            </recharts_1.ResponsiveContainer>
          </div>
        </div>

        {/* Cost Savings Trend */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Monthly Cost Savings</h3>
          </div>
          <div className="p-6">
            <recharts_1.ResponsiveContainer width="100%" height={300}>
              <recharts_1.BarChart data={trendData}>
                <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                <recharts_1.XAxis dataKey="month"/>
                <recharts_1.YAxis />
                <recharts_1.Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Savings']}/>
                <recharts_1.Bar dataKey="savings" fill="#10b981"/>
              </recharts_1.BarChart>
            </recharts_1.ResponsiveContainer>
          </div>
        </div>

        {/* Inventory by Category */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Inventory by Category</h3>
          </div>
          <div className="p-6">
            <recharts_1.ResponsiveContainer width="100%" height={300}>
              <recharts_1.PieChart>
                <recharts_1.Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ category, value }) => `${category}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {categoryData.map((entry, index) => (<recharts_1.Cell key={`cell-${index}`} fill={entry.color}/>))}
                </recharts_1.Pie>
                <recharts_1.Tooltip />
              </recharts_1.PieChart>
            </recharts_1.ResponsiveContainer>
          </div>
        </div>

        {/* Demand Forecast Accuracy */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Demand Forecast vs Actual</h3>
          </div>
          <div className="p-6">
            <recharts_1.ResponsiveContainer width="100%" height={300}>
              <recharts_1.LineChart data={demandForecastData}>
                <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                <recharts_1.XAxis dataKey="month"/>
                <recharts_1.YAxis />
                <recharts_1.Tooltip />
                <recharts_1.Legend />
                <recharts_1.Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} name="Actual Demand"/>
                <recharts_1.Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} name="Predicted Demand"/>
              </recharts_1.LineChart>
            </recharts_1.ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Supplier Performance Analysis */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Supplier Performance Analysis</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Lead Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
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
                        <span className="mr-2">{supplier.performance}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${supplier.performance >= 90 ? 'bg-green-600' :
                supplier.performance >= 80 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${supplier.performance}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (<span key={i} className={`text-sm ${i < supplier.cost ? 'text-yellow-400' : 'text-gray-300'}`}>
                            ★
                          </span>))}
                        <span className="ml-2 text-sm text-gray-600">({supplier.cost})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.leadTime} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${supplier.performance >= 90 ? 'bg-green-100 text-green-800' :
                supplier.performance >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {supplier.performance >= 90 ? 'Improving' :
                supplier.performance >= 80 ? 'Stable' : 'Declining'}
                      </span>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alert and Notification Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <outline_1.BellIcon className="h-5 w-5 text-gray-400 mr-2"/>
            <h3 className="text-lg font-medium text-gray-900">Alert & Notification Settings</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Threshold Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Low Stock Alert Threshold (%)
                  </label>
                  <input type="number" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={alertSettings.lowStockThreshold} onChange={(e) => setAlertSettings({
            ...alertSettings,
            lowStockThreshold: parseInt(e.target.value)
        })}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    High Cost Alert Threshold ($)
                  </label>
                  <input type="number" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm" value={alertSettings.highCostThreshold} onChange={(e) => setAlertSettings({
            ...alertSettings,
            highCostThreshold: parseInt(e.target.value)
        })}/>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Notification Preferences</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" checked={alertSettings.emailNotifications} onChange={(e) => setAlertSettings({
            ...alertSettings,
            emailNotifications: e.target.checked
        })}/>
                  <label className="ml-2 block text-sm text-gray-900">
                    Email Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" checked={alertSettings.smsNotifications} onChange={(e) => setAlertSettings({
            ...alertSettings,
            smsNotifications: e.target.checked
        })}/>
                  <label className="ml-2 block text-sm text-gray-900">
                    SMS Notifications
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSaveAlertSettings} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <outline_1.CogIcon className="h-4 w-4 mr-2"/>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>);
};
exports.default = Analytics;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQW5hbHl0aWNzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQW5hbHl0aWNzLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQW1EO0FBQ25ELHlEQVFxQztBQUNyQyx1Q0FnQmtCO0FBeUJsQixNQUFNLFNBQVMsR0FBYSxHQUFHLEVBQUU7SUFDL0IsTUFBTSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQTRCLElBQUksQ0FBQyxDQUFDO0lBQ3hFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsWUFBWSxDQUFDLEdBQUcsSUFBQSxnQkFBUSxFQUFjLEVBQUUsQ0FBQyxDQUFDO0lBQzVELE1BQU0sQ0FBQyxZQUFZLEVBQUUsZUFBZSxDQUFDLEdBQUcsSUFBQSxnQkFBUSxFQUFpQixFQUFFLENBQUMsQ0FBQztJQUNyRSxNQUFNLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBQyxTQUFTLENBQUMsQ0FBQztJQUN0RCxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBQSxnQkFBUSxFQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ2pELE1BQU0sQ0FBQyxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQUM7UUFDakQsaUJBQWlCLEVBQUUsRUFBRTtRQUNyQixpQkFBaUIsRUFBRSxLQUFLO1FBQ3hCLGtCQUFrQixFQUFFLElBQUk7UUFDeEIsZ0JBQWdCLEVBQUUsS0FBSztLQUN4QixDQUFDLENBQUM7SUFFSCwrREFBK0Q7SUFDL0QsSUFBQSxpQkFBUyxFQUFDLEdBQUcsRUFBRTtRQUNiLE1BQU0sV0FBVyxHQUF1QjtZQUN0QyxpQkFBaUIsRUFBRSxHQUFHO1lBQ3RCLGFBQWEsRUFBRSxNQUFNO1lBQ3JCLGlCQUFpQixFQUFFLEVBQUU7WUFDckIsV0FBVyxFQUFFLEtBQUs7WUFDbEIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixX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QUUsR0FBRyxDQUNQO1FBQUEsRUFBRSxHQUFHLENBQ1A7TUFBQSxFQUFFLEdBQUcsQ0FDUDtJQUFBLEVBQUUsR0FBRyxDQUFDLENBQ1AsQ0FBQztBQUNKLENBQUMsQ0FBQztBQUVGLGtCQUFlLFNBQVMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xyXG5pbXBvcnQge1xyXG4gIEFycm93RG93blRyYXlJY29uLFxyXG4gIENoYXJ0QmFySWNvbixcclxuICBDdXJyZW5jeURvbGxhckljb24sXHJcbiAgVHJ1Y2tJY29uLFxyXG4gIENsb2NrSWNvbixcclxuICBCZWxsSWNvbixcclxuICBDb2dJY29uLFxyXG59IGZyb20gJ0BoZXJvaWNvbnMvcmVhY3QvMjQvb3V0bGluZSc7XHJcbmltcG9ydCB7XHJcbiAgTGluZUNoYXJ0LFxyXG4gIExpbmUsXHJcbiAgQXJlYUNoYXJ0LFxyXG4gIEFyZWEsXHJcbiAgQmFyQ2hhcnQsXHJcbiAgQmFyLFxyXG4gIFBpZUNoYXJ0LFxyXG4gIFBpZSxcclxuICBDZWxsLFxyXG4gIFhBeGlzLFxyXG4gIFlBeGlzLFxyXG4gIENhcnRlc2lhbkdyaWQsXHJcbiAgVG9vbHRpcCxcclxuICBSZXNwb25zaXZlQ29udGFpbmVyLFxyXG4gIExlZ2VuZCxcclxufSBmcm9tICdyZWNoYXJ0cyc7XHJcblxyXG5pbnRlcmZhY2UgUGVyZm9ybWFuY2VNZXRyaWNzIHtcclxuICBpbnZlbnRvcnlUdXJub3ZlcjogbnVtYmVyO1xyXG4gIGNhcnJ5aW5nQ29zdHM6IG51bWJlcjtcclxuICBzdG9ja291dEluY2lkZW50czogbnVtYmVyO1xyXG4gIGNvc3RTYXZpbmdzOiBudW1iZXI7XHJcbiAgZm9yZWNhc3RBY2N1cmFjeTogbnVtYmVyO1xyXG4gIGF2Z0xlYWRUaW1lOiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBUcmVuZERhdGEge1xyXG4gIG1vbnRoOiBzdHJpbmc7XHJcbiAgaW52ZW50b3J5VmFsdWU6IG51bWJlcjtcclxuICB0dXJub3ZlcjogbnVtYmVyO1xyXG4gIHN0b2Nrb3V0czogbnVtYmVyO1xyXG4gIHNhdmluZ3M6IG51bWJlcjtcclxufVxyXG5cclxuaW50ZXJmYWNlIENhdGVnb3J5RGF0YSB7XHJcbiAgY2F0ZWdvcnk6IHN0cmluZztcclxuICB2YWx1ZTogbnVtYmVyO1xyXG4gIGNvbG9yOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IEFuYWx5dGljczogUmVhY3QuRkMgPSAoKSA9PiB7XHJcbiAgY29uc3QgW21ldHJpY3MsIHNldE1ldHJpY3NdID0gdXNlU3RhdGU8UGVyZm9ybWFuY2VNZXRyaWNzIHwgbnVsbD4obnVsbCk7XHJcbiAgY29uc3QgW3RyZW5kRGF0YSwgc2V0VHJlbmREYXRhXSA9IHVzZVN0YXRlPFRyZW5kRGF0YVtdPihbXSk7XHJcbiAgY29uc3QgW2NhdGVnb3J5RGF0YSwgc2V0Q2F0ZWdvcnlEYXRhXSA9IHVzZVN0YXRlPENhdGVnb3J5RGF0YVtdPihbXSk7XHJcbiAgY29uc3QgW2RhdGVSYW5nZSwgc2V0RGF0ZVJhbmdlXSA9IHVzZVN0YXRlKCc2bW9udGhzJyk7XHJcbiAgY29uc3QgW3NlbGVjdGVkUmVwb3J0XSA9IHVzZVN0YXRlKCdwZXJmb3JtYW5jZScpO1xyXG4gIGNvbnN0IFthbGVydFNldHRpbmdzLCBzZXRBbGVydFNldHRpbmdzXSA9IHVzZVN0YXRlKHtcclxuICAgIGxvd1N0b2NrVGhyZXNob2xkOiAyMCxcclxuICAgIGhpZ2hDb3N0VGhyZXNob2xkOiAxMDAwMCxcclxuICAgIGVtYWlsTm90aWZpY2F0aW9uczogdHJ1ZSxcclxuICAgIHNtc05vdGlmaWNhdGlvbnM6IGZhbHNlLFxyXG4gIH0pO1xyXG5cclxuICAvLyBNb2NrIGRhdGEgLSBpbiByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGNvbWUgZnJvbSBBUElcclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgY29uc3QgbW9ja01ldHJpY3M6IFBlcmZvcm1hbmNlTWV0cmljcyA9IHtcclxuICAgICAgaW52ZW50b3J5VHVybm92ZXI6IDguMixcclxuICAgICAgY2FycnlpbmdDb3N0czogMTQ1MDAwLFxyXG4gICAgICBzdG9ja291dEluY2lkZW50czogMTIsXHJcbiAgICAgIGNvc3RTYXZpbmdzOiA4OTUwMCxcclxuICAgICAgZm9yZWNhc3RBY2N1cmFjeTogODcuMyxcclxuICAgICAgYXZnTGVhZFRpbWU6IDQuMixcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgbW9ja1RyZW5kRGF0YTogVHJlbmREYXRhW10gPSBbXHJcbiAgICAgIHsgbW9udGg6ICdBdWcgMjAyMycsIGludmVudG9yeVZhbHVlOiAyMTAwMDAwLCB0dXJub3ZlcjogNy44LCBzdG9ja291dHM6IDE1LCBzYXZpbmdzOiA0NTAwMCB9LFxyXG4gICAgICB7IG1vbnRoOiAnU2VwIDIwMjMnLCBpbnZlbnRvcnlWYWx1ZTogMjI1MDAwMCwgdHVybm92ZXI6IDguMSwgc3RvY2tvdXRzOiAxMiwgc2F2aW5nczogNTIwMDAgfSxcclxuICAgICAgeyBtb250aDogJ09jdCAyMDIzJywgaW52ZW50b3J5VmFsdWU6IDIxODAwMDAsIHR1cm5vdmVyOiA4LjMsIHN0b2Nrb3V0czogOCwgc2F2aW5nczogNjEwMDAgfSxcclxuICAgICAgeyBtb250aDogJ05vdiAyMDIzJywgaW52ZW50b3J5VmFsdWU6IDIzMjAwMDAsIHR1cm5vdmVyOiA3LjksIHN0b2Nrb3V0czogMTQsIHNhdmluZ3M6IDQ4MDAwIH0sXHJcbiAgICAgIHsgbW9udGg6ICdEZWMgMjAyMycsIGludmVudG9yeVZhbHVlOiAyNDAwMDAwLCB0dXJub3ZlcjogOC41LCBzdG9ja291dHM6IDYsIHNhdmluZ3M6IDczMDAwIH0sXHJcbiAgICAgIHsgbW9udGg6ICdKYW4gMjAyNCcsIGludmVudG9yeVZhbHVlOiAyMzUwMDAwLCB0dXJub3ZlcjogOC4yLCBzdG9ja291dHM6IDksIHNhdmluZ3M6IDY3MDAwIH0sXHJcbiAgICBdO1xyXG5cclxuICAgIGNvbnN0IG1vY2tDYXRlZ29yeURhdGE6IENhdGVnb3J5RGF0YVtdID0gW1xyXG4gICAgICB7IGNhdGVnb3J5OiAnRW5naW5lIFBhcnRzJywgdmFsdWU6IDM1LCBjb2xvcjogJyMzYjgyZjYnIH0sXHJcbiAgICAgIHsgY2F0ZWdvcnk6ICdCcmFrZXMnLCB2YWx1ZTogMjUsIGNvbG9yOiAnIzEwYjk4MScgfSxcclxuICAgICAgeyBjYXRlZ29yeTogJ1RpcmVzJywgdmFsdWU6IDIwLCBjb2xvcjogJyNmNTllMGInIH0sXHJcbiAgICAgIHsgY2F0ZWdvcnk6ICdFbGVjdHJpY2FsJywgdmFsdWU6IDEyLCBjb2xvcjogJyNlZjQ0NDQnIH0sXHJcbiAgICAgIHsgY2F0ZWdvcnk6ICdPdGhlcicsIHZhbHVlOiA4LCBjb2xvcjogJyM4YjVjZjYnIH0sXHJcbiAgICBdO1xyXG5cclxuICAgIHNldE1ldHJpY3MobW9ja01ldHJpY3MpO1xyXG4gICAgc2V0VHJlbmREYXRhKG1vY2tUcmVuZERhdGEpO1xyXG4gICAgc2V0Q2F0ZWdvcnlEYXRhKG1vY2tDYXRlZ29yeURhdGEpO1xyXG4gIH0sIFtkYXRlUmFuZ2VdKTtcclxuXHJcbiAgY29uc3QgaGFuZGxlRXhwb3J0UmVwb3J0ID0gKGZvcm1hdDogJ3BkZicgfCAnZXhjZWwnKSA9PiB7XHJcbiAgICAvLyBJbiByZWFsIGltcGxlbWVudGF0aW9uLCB0aGlzIHdvdWxkIGdlbmVyYXRlIGFuZCBkb3dubG9hZCB0aGUgcmVwb3J0XHJcbiAgICBhbGVydChgRXhwb3J0aW5nICR7c2VsZWN0ZWRSZXBvcnR9IHJlcG9ydCBhcyAke2Zvcm1hdC50b1VwcGVyQ2FzZSgpfS4uLmApO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGhhbmRsZVNhdmVBbGVydFNldHRpbmdzID0gKCkgPT4ge1xyXG4gICAgLy8gSW4gcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBzYXZlIHRvIGJhY2tlbmRcclxuICAgIGFsZXJ0KCdBbGVydCBzZXR0aW5ncyBzYXZlZCBzdWNjZXNzZnVsbHkhJyk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3Qgc3VwcGxpZXJQZXJmb3JtYW5jZURhdGEgPSBbXHJcbiAgICB7IHN1cHBsaWVyOiAnQXV0b1BhcnRzIEluYycsIHBlcmZvcm1hbmNlOiA5NSwgY29zdDogNC4yLCBsZWFkVGltZTogMy4yIH0sXHJcbiAgICB7IHN1cHBsaWVyOiAnRmlsdGVyTWF4JywgcGVyZm9ybWFuY2U6IDg4LCBjb3N0OiA0LjUsIGxlYWRUaW1lOiA0LjEgfSxcclxuICAgIHsgc3VwcGxpZXI6ICdUaXJlV29ybGQnLCBwZXJmb3JtYW5jZTogOTIsIGNvc3Q6IDMuOCwgbGVhZFRpbWU6IDIuOCB9LFxyXG4gICAgeyBzdXBwbGllcjogJ1Bvd2VyQ2VsbCBDbycsIHBlcmZvcm1hbmNlOiA4NSwgY29zdDogNC4wLCBsZWFkVGltZTogNS4yIH0sXHJcbiAgXTtcclxuXHJcbiAgY29uc3QgZGVtYW5kRm9yZWNhc3REYXRhID0gW1xyXG4gICAgeyBtb250aDogJ0ZlYiAyMDI0JywgYWN0dWFsOiAxMjUwLCBwcmVkaWN0ZWQ6IDEyMDAsIGFjY3VyYWN5OiA5NiB9LFxyXG4gICAgeyBtb250aDogJ01hciAyMDI0JywgYWN0dWFsOiAxMzgwLCBwcmVkaWN0ZWQ6IDEzNTAsIGFjY3VyYWN5OiA5OCB9LFxyXG4gICAgeyBtb250aDogJ0FwciAyMDI0JywgYWN0dWFsOiAxNDIwLCBwcmVkaWN0ZWQ6IDE0MDAsIGFjY3VyYWN5OiA5OSB9LFxyXG4gICAgeyBtb250aDogJ01heSAyMDI0JywgYWN0dWFsOiAxMTgwLCBwcmVkaWN0ZWQ6IDEyNTAsIGFjY3VyYWN5OiA5NCB9LFxyXG4gICAgeyBtb250aDogJ0p1biAyMDI0JywgYWN0dWFsOiAxMzUwLCBwcmVkaWN0ZWQ6IDEzMjAsIGFjY3VyYWN5OiA5OCB9LFxyXG4gICAgeyBtb250aDogJ0p1bCAyMDI0JywgYWN0dWFsOiAxNDgwLCBwcmVkaWN0ZWQ6IDE0NTAsIGFjY3VyYWN5OiA5OCB9LFxyXG4gIF07XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1iLThcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC1jb2wgc206ZmxleC1yb3cgc206aXRlbXMtY2VudGVyIHNtOmp1c3RpZnktYmV0d2VlblwiPlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LWdyYXktOTAwXCI+QW5hbHl0aWNzICYgUmVwb3J0czwvaDE+XHJcbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cIm10LTIgdGV4dC1zbSB0ZXh0LWdyYXktNzAwXCI+XHJcbiAgICAgICAgICAgICAgUGVyZm9ybWFuY2UgbWV0cmljcywgY29zdCBzYXZpbmdzIGFuYWx5c2lzLCBhbmQgYnVzaW5lc3MgaW50ZWxsaWdlbmNlXHJcbiAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC00IHNtOm10LTAgZmxleCBnYXAtMlwiPlxyXG4gICAgICAgICAgICA8c2VsZWN0XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYm9yZGVyIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkLW1kIHB4LTMgcHktMiB0ZXh0LXNtIGZvY3VzOnJpbmctcHJpbWFyeS01MDAgZm9jdXM6Ym9yZGVyLXByaW1hcnktNTAwXCJcclxuICAgICAgICAgICAgICB2YWx1ZT17ZGF0ZVJhbmdlfVxyXG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RGF0ZVJhbmdlKGUudGFyZ2V0LnZhbHVlKX1cclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIzbW9udGhzXCI+TGFzdCAzIE1vbnRoczwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCI2bW9udGhzXCI+TGFzdCA2IE1vbnRoczwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIxeWVhclwiPkxhc3QgWWVhcjwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIyeWVhcnNcIj5MYXN0IDIgWWVhcnM8L29wdGlvbj5cclxuICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVFeHBvcnRSZXBvcnQoJ3BkZicpfVxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBweC00IHB5LTIgYm9yZGVyIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkLW1kIHNoYWRvdy1zbSB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS03MDAgYmctd2hpdGUgaG92ZXI6YmctZ3JheS01MCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctcHJpbWFyeS01MDBcIlxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgPEFycm93RG93blRyYXlJY29uIGNsYXNzTmFtZT1cImgtNCB3LTQgbXItMlwiIC8+XHJcbiAgICAgICAgICAgICAgRXhwb3J0IFBERlxyXG4gICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUV4cG9ydFJlcG9ydCgnZXhjZWwnKX1cclxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgcHgtNCBweS0yIGJvcmRlciBib3JkZXItZ3JheS0zMDAgcm91bmRlZC1tZCBzaGFkb3ctc20gdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwIGJnLXdoaXRlIGhvdmVyOmJnLWdyYXktNTAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLXByaW1hcnktNTAwXCJcclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIDxBcnJvd0Rvd25UcmF5SWNvbiBjbGFzc05hbWU9XCJoLTQgdy00IG1yLTJcIiAvPlxyXG4gICAgICAgICAgICAgIEV4cG9ydCBFeGNlbFxyXG4gICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIHsvKiBLZXkgUGVyZm9ybWFuY2UgTWV0cmljcyAqL31cclxuICAgICAge21ldHJpY3MgJiYgKFxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBnYXAtNSBzbTpncmlkLWNvbHMtMiBsZzpncmlkLWNvbHMtMyBtYi04XCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIG92ZXJmbG93LWhpZGRlbiBzaGFkb3cgcm91bmRlZC1sZ1wiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNVwiPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC1zaHJpbmstMFwiPlxyXG4gICAgICAgICAgICAgICAgICA8Q2hhcnRCYXJJY29uIGNsYXNzTmFtZT1cImgtOCB3LTggdGV4dC1wcmltYXJ5LTUwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtNSB3LTAgZmxleC0xXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkbD5cclxuICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHRydW5jYXRlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICBJbnZlbnRvcnkgVHVybm92ZXJcclxuICAgICAgICAgICAgICAgICAgICA8L2R0PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHttZXRyaWNzLmludmVudG9yeVR1cm5vdmVyfXhcclxuICAgICAgICAgICAgICAgICAgICA8L2RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JlZW4tNjAwXCI+KzEyJSBmcm9tIGxhc3QgcGVyaW9kPC9kZD5cclxuICAgICAgICAgICAgICAgICAgPC9kbD5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgb3ZlcmZsb3ctaGlkZGVuIHNoYWRvdyByb3VuZGVkLWxnXCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC01XCI+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LXNocmluay0wXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxDdXJyZW5jeURvbGxhckljb24gY2xhc3NOYW1lPVwiaC04IHctOCB0ZXh0LWdyZWVuLTUwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtNSB3LTAgZmxleC0xXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkbD5cclxuICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHRydW5jYXRlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICBDb3N0IFNhdmluZ3NcclxuICAgICAgICAgICAgICAgICAgICA8L2R0PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICR7bWV0cmljcy5jb3N0U2F2aW5ncy50b0xvY2FsZVN0cmluZygpfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRkIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmVlbi02MDBcIj4rMjMlIGZyb20gbGFzdCBwZXJpb2Q8L2RkPlxyXG4gICAgICAgICAgICAgICAgICA8L2RsPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBvdmVyZmxvdy1oaWRkZW4gc2hhZG93IHJvdW5kZWQtbGdcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTVcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtc2hyaW5rLTBcIj5cclxuICAgICAgICAgICAgICAgICAgPFRydWNrSWNvbiBjbGFzc05hbWU9XCJoLTggdy04IHRleHQteWVsbG93LTUwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtNSB3LTAgZmxleC0xXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkbD5cclxuICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHRydW5jYXRlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICBTdG9ja291dCBJbmNpZGVudHNcclxuICAgICAgICAgICAgICAgICAgICA8L2R0PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHttZXRyaWNzLnN0b2Nrb3V0SW5jaWRlbnRzfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRkIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1yZWQtNjAwXCI+LTglIGZyb20gbGFzdCBwZXJpb2Q8L2RkPlxyXG4gICAgICAgICAgICAgICAgICA8L2RsPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBvdmVyZmxvdy1oaWRkZW4gc2hhZG93IHJvdW5kZWQtbGdcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTVcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtc2hyaW5rLTBcIj5cclxuICAgICAgICAgICAgICAgICAgPEN1cnJlbmN5RG9sbGFySWNvbiBjbGFzc05hbWU9XCJoLTggdy04IHRleHQtcmVkLTUwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtNSB3LTAgZmxleC0xXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkbD5cclxuICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHRydW5jYXRlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICBDYXJyeWluZyBDb3N0c1xyXG4gICAgICAgICAgICAgICAgICAgIDwvZHQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRkIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTkwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgJHttZXRyaWNzLmNhcnJ5aW5nQ29zdHMudG9Mb2NhbGVTdHJpbmcoKX1cclxuICAgICAgICAgICAgICAgICAgICA8L2RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JlZW4tNjAwXCI+LTE1JSBmcm9tIGxhc3QgcGVyaW9kPC9kZD5cclxuICAgICAgICAgICAgICAgICAgPC9kbD5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgb3ZlcmZsb3ctaGlkZGVuIHNoYWRvdyByb3VuZGVkLWxnXCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC01XCI+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LXNocmluay0wXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxDaGFydEJhckljb24gY2xhc3NOYW1lPVwiaC04IHctOCB0ZXh0LWJsdWUtNTAwXCIgLz5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtbC01IHctMCBmbGV4LTFcIj5cclxuICAgICAgICAgICAgICAgICAgPGRsPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkdCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdHJ1bmNhdGVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIEZvcmVjYXN0IEFjY3VyYWN5XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kdD5cclxuICAgICAgICAgICAgICAgICAgICA8ZGQgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7bWV0cmljcy5mb3JlY2FzdEFjY3VyYWN5fSVcclxuICAgICAgICAgICAgICAgICAgICA8L2RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkZCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JlZW4tNjAwXCI+KzUlIGZyb20gbGFzdCBwZXJpb2Q8L2RkPlxyXG4gICAgICAgICAgICAgICAgICA8L2RsPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBvdmVyZmxvdy1oaWRkZW4gc2hhZG93IHJvdW5kZWQtbGdcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTVcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtc2hyaW5rLTBcIj5cclxuICAgICAgICAgICAgICAgICAgPENsb2NrSWNvbiBjbGFzc05hbWU9XCJoLTggdy04IHRleHQtcHVycGxlLTUwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtNSB3LTAgZmxleC0xXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkbD5cclxuICAgICAgICAgICAgICAgICAgICA8ZHQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHRydW5jYXRlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICBBdmcgTGVhZCBUaW1lXHJcbiAgICAgICAgICAgICAgICAgICAgPC9kdD5cclxuICAgICAgICAgICAgICAgICAgICA8ZGQgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7bWV0cmljcy5hdmdMZWFkVGltZX0gZGF5c1xyXG4gICAgICAgICAgICAgICAgICAgIDwvZGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRkIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmVlbi02MDBcIj4tMC4zIGRheXMgZnJvbSBsYXN0IHBlcmlvZDwvZGQ+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGw+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgKX1cclxuXHJcbiAgICAgIHsvKiBDaGFydHMgU2VjdGlvbiAqL31cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIGxnOmdyaWQtY29scy0yIGdhcC02IG1iLThcIj5cclxuICAgICAgICB7LyogSW52ZW50b3J5IFZhbHVlIFRyZW5kICovfVxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgc2hhZG93IHJvdW5kZWQtbGdcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtNiBweS00IGJvcmRlci1iIGJvcmRlci1ncmF5LTIwMFwiPlxyXG4gICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+SW52ZW50b3J5IFZhbHVlIFRyZW5kPC9oMz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTZcIj5cclxuICAgICAgICAgICAgPFJlc3BvbnNpdmVDb250YWluZXIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PXszMDB9PlxyXG4gICAgICAgICAgICAgIDxBcmVhQ2hhcnQgZGF0YT17dHJlbmREYXRhfT5cclxuICAgICAgICAgICAgICAgIDxDYXJ0ZXNpYW5HcmlkIHN0cm9rZURhc2hhcnJheT1cIjMgM1wiIC8+XHJcbiAgICAgICAgICAgICAgICA8WEF4aXMgZGF0YUtleT1cIm1vbnRoXCIgLz5cclxuICAgICAgICAgICAgICAgIDxZQXhpcyAvPlxyXG4gICAgICAgICAgICAgICAgPFRvb2x0aXAgZm9ybWF0dGVyPXsodmFsdWUpID0+IFtgJCR7TnVtYmVyKHZhbHVlKS50b0xvY2FsZVN0cmluZygpfWAsICdJbnZlbnRvcnkgVmFsdWUnXX0gLz5cclxuICAgICAgICAgICAgICAgIDxBcmVhIHR5cGU9XCJtb25vdG9uZVwiIGRhdGFLZXk9XCJpbnZlbnRvcnlWYWx1ZVwiIHN0cm9rZT1cIiMzYjgyZjZcIiBmaWxsPVwiIzNiODJmNlwiIGZpbGxPcGFjaXR5PXswLjN9IC8+XHJcbiAgICAgICAgICAgICAgPC9BcmVhQ2hhcnQ+XHJcbiAgICAgICAgICAgIDwvUmVzcG9uc2l2ZUNvbnRhaW5lcj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICB7LyogQ29zdCBTYXZpbmdzIFRyZW5kICovfVxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgc2hhZG93IHJvdW5kZWQtbGdcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHgtNiBweS00IGJvcmRlci1iIGJvcmRlci1ncmF5LTIwMFwiPlxyXG4gICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+TW9udGhseSBDb3N0IFNhdmluZ3M8L2gzPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNlwiPlxyXG4gICAgICAgICAgICA8UmVzcG9uc2l2ZUNvbnRhaW5lciB3aWR0aD1cIjEwMCVcIiBoZWlnaHQ9ezMwMH0+XHJcbiAgICAgICAgICAgICAgPEJhckNoYXJ0IGRhdGE9e3RyZW5kRGF0YX0+XHJcbiAgICAgICAgICAgICAgICA8Q2FydGVzaWFuR3JpZCBzdHJva2VEYXNoYXJyYXk9XCIzIDNcIiAvPlxyXG4gICAgICAgICAgICAgICAgPFhBeGlzIGRhdGFLZXk9XCJtb250aFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8WUF4aXMgLz5cclxuICAgICAgICAgICAgICAgIDxUb29sdGlwIGZvcm1hdHRlcj17KHZhbHVlKSA9PiBbYCQke051bWJlcih2YWx1ZSkudG9Mb2NhbGVTdHJpbmcoKX1gLCAnU2F2aW5ncyddfSAvPlxyXG4gICAgICAgICAgICAgICAgPEJhciBkYXRhS2V5PVwic2F2aW5nc1wiIGZpbGw9XCIjMTBiOTgxXCIgLz5cclxuICAgICAgICAgICAgICA8L0JhckNoYXJ0PlxyXG4gICAgICAgICAgICA8L1Jlc3BvbnNpdmVDb250YWluZXI+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgey8qIEludmVudG9yeSBieSBDYXRlZ29yeSAqL31cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHNoYWRvdyByb3VuZGVkLWxnXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTYgcHktNCBib3JkZXItYiBib3JkZXItZ3JheS0yMDBcIj5cclxuICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTkwMFwiPkludmVudG9yeSBieSBDYXRlZ29yeTwvaDM+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC02XCI+XHJcbiAgICAgICAgICAgIDxSZXNwb25zaXZlQ29udGFpbmVyIHdpZHRoPVwiMTAwJVwiIGhlaWdodD17MzAwfT5cclxuICAgICAgICAgICAgICA8UGllQ2hhcnQ+XHJcbiAgICAgICAgICAgICAgICA8UGllXHJcbiAgICAgICAgICAgICAgICAgIGRhdGE9e2NhdGVnb3J5RGF0YX1cclxuICAgICAgICAgICAgICAgICAgY3g9XCI1MCVcIlxyXG4gICAgICAgICAgICAgICAgICBjeT1cIjUwJVwiXHJcbiAgICAgICAgICAgICAgICAgIGxhYmVsTGluZT17ZmFsc2V9XHJcbiAgICAgICAgICAgICAgICAgIGxhYmVsPXsoeyBjYXRlZ29yeSwgdmFsdWUgfSkgPT4gYCR7Y2F0ZWdvcnl9OiAke3ZhbHVlfSVgfVxyXG4gICAgICAgICAgICAgICAgICBvdXRlclJhZGl1cz17ODB9XHJcbiAgICAgICAgICAgICAgICAgIGZpbGw9XCIjODg4NGQ4XCJcclxuICAgICAgICAgICAgICAgICAgZGF0YUtleT1cInZhbHVlXCJcclxuICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAge2NhdGVnb3J5RGF0YS5tYXAoKGVudHJ5LCBpbmRleCkgPT4gKFxyXG4gICAgICAgICAgICAgICAgICAgIDxDZWxsIGtleT17YGNlbGwtJHtpbmRleH1gfSBmaWxsPXtlbnRyeS5jb2xvcn0gLz5cclxuICAgICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgICA8L1BpZT5cclxuICAgICAgICAgICAgICAgIDxUb29sdGlwIC8+XHJcbiAgICAgICAgICAgICAgPC9QaWVDaGFydD5cclxuICAgICAgICAgICAgPC9SZXNwb25zaXZlQ29udGFpbmVyPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIHsvKiBEZW1hbmQgRm9yZWNhc3QgQWNjdXJhY3kgKi99XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBzaGFkb3cgcm91bmRlZC1sZ1wiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJweC02IHB5LTQgYm9yZGVyLWIgYm9yZGVyLWdyYXktMjAwXCI+XHJcbiAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5EZW1hbmQgRm9yZWNhc3QgdnMgQWN0dWFsPC9oMz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTZcIj5cclxuICAgICAgICAgICAgPFJlc3BvbnNpdmVDb250YWluZXIgd2lkdGg9XCIxMDAlXCIgaGVpZ2h0PXszMDB9PlxyXG4gICAgICAgICAgICAgIDxMaW5lQ2hhcnQgZGF0YT17ZGVtYW5kRm9yZWNhc3REYXRhfT5cclxuICAgICAgICAgICAgICAgIDxDYXJ0ZXNpYW5HcmlkIHN0cm9rZURhc2hhcnJheT1cIjMgM1wiIC8+XHJcbiAgICAgICAgICAgICAgICA8WEF4aXMgZGF0YUtleT1cIm1vbnRoXCIgLz5cclxuICAgICAgICAgICAgICAgIDxZQXhpcyAvPlxyXG4gICAgICAgICAgICAgICAgPFRvb2x0aXAgLz5cclxuICAgICAgICAgICAgICAgIDxMZWdlbmQgLz5cclxuICAgICAgICAgICAgICAgIDxMaW5lIHR5cGU9XCJtb25vdG9uZVwiIGRhdGFLZXk9XCJhY3R1YWxcIiBzdHJva2U9XCIjZWY0NDQ0XCIgc3Ryb2tlV2lkdGg9ezJ9IG5hbWU9XCJBY3R1YWwgRGVtYW5kXCIgLz5cclxuICAgICAgICAgICAgICAgIDxMaW5lIHR5cGU9XCJtb25vdG9uZVwiIGRhdGFLZXk9XCJwcmVkaWN0ZWRcIiBzdHJva2U9XCIjM2I4MmY2XCIgc3Ryb2tlV2lkdGg9ezJ9IG5hbWU9XCJQcmVkaWN0ZWQgRGVtYW5kXCIgLz5cclxuICAgICAgICAgICAgICA8L0xpbmVDaGFydD5cclxuICAgICAgICAgICAgPC9SZXNwb25zaXZlQ29udGFpbmVyPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgey8qIFN1cHBsaWVyIFBlcmZvcm1hbmNlIEFuYWx5c2lzICovfVxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIHNoYWRvdyByb3VuZGVkLWxnIG1iLThcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTYgcHktNCBib3JkZXItYiBib3JkZXItZ3JheS0yMDBcIj5cclxuICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5TdXBwbGllciBQZXJmb3JtYW5jZSBBbmFseXNpczwvaDM+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTZcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvXCI+XHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJtaW4tdy1mdWxsIGRpdmlkZS15IGRpdmlkZS1ncmF5LTIwMFwiPlxyXG4gICAgICAgICAgICAgIDx0aGVhZCBjbGFzc05hbWU9XCJiZy1ncmF5LTUwXCI+XHJcbiAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC02IHB5LTMgdGV4dC1sZWZ0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICBTdXBwbGllclxyXG4gICAgICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgUGVyZm9ybWFuY2UgU2NvcmVcclxuICAgICAgICAgICAgICAgICAgPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LWxlZnQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgIENvc3QgUmF0aW5nXHJcbiAgICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC02IHB5LTMgdGV4dC1sZWZ0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICBBdmcgTGVhZCBUaW1lXHJcbiAgICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC02IHB5LTMgdGV4dC1sZWZ0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICBUcmVuZFxyXG4gICAgICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICA8L3RoZWFkPlxyXG4gICAgICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJiZy13aGl0ZSBkaXZpZGUteSBkaXZpZGUtZ3JheS0yMDBcIj5cclxuICAgICAgICAgICAgICAgIHtzdXBwbGllclBlcmZvcm1hbmNlRGF0YS5tYXAoKHN1cHBsaWVyLCBpbmRleCkgPT4gKFxyXG4gICAgICAgICAgICAgICAgICA8dHIga2V5PXtpbmRleH0+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtzdXBwbGllci5zdXBwbGllcn1cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1zbSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1yLTJcIj57c3VwcGxpZXIucGVyZm9ybWFuY2V9JTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LTE2IGJnLWdyYXktMjAwIHJvdW5kZWQtZnVsbCBoLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BoLTIgcm91bmRlZC1mdWxsICR7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1cHBsaWVyLnBlcmZvcm1hbmNlID49IDkwID8gJ2JnLWdyZWVuLTYwMCcgOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VwcGxpZXIucGVyZm9ybWFuY2UgPj0gODAgPyAnYmcteWVsbG93LTYwMCcgOiAnYmctcmVkLTYwMCdcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1gfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgd2lkdGg6IGAke3N1cHBsaWVyLnBlcmZvcm1hbmNlfSVgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge1suLi5BcnJheSg1KV0ubWFwKChfLCBpKSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHRleHQtc20gJHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA8IHN1cHBsaWVyLmNvc3QgPyAndGV4dC15ZWxsb3ctNDAwJyA6ICd0ZXh0LWdyYXktMzAwJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAg4piFXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICApKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWwtMiB0ZXh0LXNtIHRleHQtZ3JheS02MDBcIj4oe3N1cHBsaWVyLmNvc3R9KTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtzdXBwbGllci5sZWFkVGltZX0gZGF5c1xyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YGlubGluZS1mbGV4IHB4LTIgcHktMSB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgcm91bmRlZC1mdWxsICR7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1cHBsaWVyLnBlcmZvcm1hbmNlID49IDkwID8gJ2JnLWdyZWVuLTEwMCB0ZXh0LWdyZWVuLTgwMCcgOiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VwcGxpZXIucGVyZm9ybWFuY2UgPj0gODAgPyAnYmcteWVsbG93LTEwMCB0ZXh0LXllbGxvdy04MDAnIDogJ2JnLXJlZC0xMDAgdGV4dC1yZWQtODAwJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgfWB9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7c3VwcGxpZXIucGVyZm9ybWFuY2UgPj0gOTAgPyAnSW1wcm92aW5nJyA6IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgc3VwcGxpZXIucGVyZm9ybWFuY2UgPj0gODAgPyAnU3RhYmxlJyA6ICdEZWNsaW5pbmcnfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgICApKX1cclxuICAgICAgICAgICAgICA8L3Rib2R5PlxyXG4gICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgey8qIEFsZXJ0IGFuZCBOb3RpZmljYXRpb24gU2V0dGluZ3MgKi99XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgc2hhZG93IHJvdW5kZWQtbGdcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTYgcHktNCBib3JkZXItYiBib3JkZXItZ3JheS0yMDBcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgPEJlbGxJY29uIGNsYXNzTmFtZT1cImgtNSB3LTUgdGV4dC1ncmF5LTQwMCBtci0yXCIgLz5cclxuICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTkwMFwiPkFsZXJ0ICYgTm90aWZpY2F0aW9uIFNldHRpbmdzPC9oMz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC02XCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTEgbWQ6Z3JpZC1jb2xzLTIgZ2FwLTZcIj5cclxuICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICA8aDQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwIG1iLTRcIj5UaHJlc2hvbGQgU2V0dGluZ3M8L2g0PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgTG93IFN0b2NrIEFsZXJ0IFRocmVzaG9sZCAoJSlcclxuICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgPGlucHV0XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXQtMSBibG9jayB3LWZ1bGwgYm9yZGVyLWdyYXktMzAwIHJvdW5kZWQtbWQgc2hhZG93LXNtIGZvY3VzOnJpbmctcHJpbWFyeS01MDAgZm9jdXM6Ym9yZGVyLXByaW1hcnktNTAwIHNtOnRleHQtc21cIlxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXthbGVydFNldHRpbmdzLmxvd1N0b2NrVGhyZXNob2xkfVxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0QWxlcnRTZXR0aW5ncyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAuLi5hbGVydFNldHRpbmdzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgbG93U3RvY2tUaHJlc2hvbGQ6IHBhcnNlSW50KGUudGFyZ2V0LnZhbHVlKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pfVxyXG4gICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgSGlnaCBDb3N0IEFsZXJ0IFRocmVzaG9sZCAoJClcclxuICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgPGlucHV0XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibXQtMSBibG9jayB3LWZ1bGwgYm9yZGVyLWdyYXktMzAwIHJvdW5kZWQtbWQgc2hhZG93LXNtIGZvY3VzOnJpbmctcHJpbWFyeS01MDAgZm9jdXM6Ym9yZGVyLXByaW1hcnktNTAwIHNtOnRleHQtc21cIlxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXthbGVydFNldHRpbmdzLmhpZ2hDb3N0VGhyZXNob2xkfVxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0QWxlcnRTZXR0aW5ncyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAuLi5hbGVydFNldHRpbmdzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgaGlnaENvc3RUaHJlc2hvbGQ6IHBhcnNlSW50KGUudGFyZ2V0LnZhbHVlKVxyXG4gICAgICAgICAgICAgICAgICAgIH0pfVxyXG4gICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgIDxoNCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDAgbWItNFwiPk5vdGlmaWNhdGlvbiBQcmVmZXJlbmNlczwvaDQ+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgPGlucHV0XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJoLTQgdy00IHRleHQtcHJpbWFyeS02MDAgZm9jdXM6cmluZy1wcmltYXJ5LTUwMCBib3JkZXItZ3JheS0zMDAgcm91bmRlZFwiXHJcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17YWxlcnRTZXR0aW5ncy5lbWFpbE5vdGlmaWNhdGlvbnN9XHJcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRBbGVydFNldHRpbmdzKHtcclxuICAgICAgICAgICAgICAgICAgICAgIC4uLmFsZXJ0U2V0dGluZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICBlbWFpbE5vdGlmaWNhdGlvbnM6IGUudGFyZ2V0LmNoZWNrZWRcclxuICAgICAgICAgICAgICAgICAgICB9KX1cclxuICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm1sLTIgYmxvY2sgdGV4dC1zbSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgRW1haWwgTm90aWZpY2F0aW9uc1xyXG4gICAgICAgICAgICAgICAgICA8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiXHJcbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaC00IHctNCB0ZXh0LXByaW1hcnktNjAwIGZvY3VzOnJpbmctcHJpbWFyeS01MDAgYm9yZGVyLWdyYXktMzAwIHJvdW5kZWRcIlxyXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9e2FsZXJ0U2V0dGluZ3Muc21zTm90aWZpY2F0aW9uc31cclxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEFsZXJ0U2V0dGluZ3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICAgLi4uYWxlcnRTZXR0aW5ncyxcclxuICAgICAgICAgICAgICAgICAgICAgIHNtc05vdGlmaWNhdGlvbnM6IGUudGFyZ2V0LmNoZWNrZWRcclxuICAgICAgICAgICAgICAgICAgICB9KX1cclxuICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cIm1sLTIgYmxvY2sgdGV4dC1zbSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgU01TIE5vdGlmaWNhdGlvbnNcclxuICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtdC02IGZsZXgganVzdGlmeS1lbmRcIj5cclxuICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVNhdmVBbGVydFNldHRpbmdzfVxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBweC00IHB5LTIgYm9yZGVyIGJvcmRlci10cmFuc3BhcmVudCByb3VuZGVkLW1kIHNoYWRvdy1zbSB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtd2hpdGUgYmctcHJpbWFyeS02MDAgaG92ZXI6YmctcHJpbWFyeS03MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLW9mZnNldC0yIGZvY3VzOnJpbmctcHJpbWFyeS01MDBcIlxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgPENvZ0ljb24gY2xhc3NOYW1lPVwiaC00IHctNCBtci0yXCIgLz5cclxuICAgICAgICAgICAgICBTYXZlIFNldHRpbmdzXHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IEFuYWx5dGljczsiXX0=
import React, { useState, useEffect } from 'react';
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ClockIcon,
  BellIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PerformanceMetrics {
  inventoryTurnover: number;
  carryingCosts: number;
  stockoutIncidents: number;
  costSavings: number;
  forecastAccuracy: number;
  avgLeadTime: number;
}

interface TrendData {
  month: string;
  inventoryValue: number;
  turnover: number;
  stockouts: number;
  savings: number;
}

interface CategoryData {
  category: string;
  value: number;
  color: string;
}

const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [dateRange, setDateRange] = useState('6months');
  const [selectedReport] = useState('performance');
  const [alertSettings, setAlertSettings] = useState({
    lowStockThreshold: 20,
    highCostThreshold: 10000,
    emailNotifications: true,
    smsNotifications: false,
  });

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockMetrics: PerformanceMetrics = {
      inventoryTurnover: 8.2,
      carryingCosts: 145000,
      stockoutIncidents: 12,
      costSavings: 89500,
      forecastAccuracy: 87.3,
      avgLeadTime: 4.2,
    };

    const mockTrendData: TrendData[] = [
      { month: 'Aug 2023', inventoryValue: 2100000, turnover: 7.8, stockouts: 15, savings: 45000 },
      { month: 'Sep 2023', inventoryValue: 2250000, turnover: 8.1, stockouts: 12, savings: 52000 },
      { month: 'Oct 2023', inventoryValue: 2180000, turnover: 8.3, stockouts: 8, savings: 61000 },
      { month: 'Nov 2023', inventoryValue: 2320000, turnover: 7.9, stockouts: 14, savings: 48000 },
      { month: 'Dec 2023', inventoryValue: 2400000, turnover: 8.5, stockouts: 6, savings: 73000 },
      { month: 'Jan 2024', inventoryValue: 2350000, turnover: 8.2, stockouts: 9, savings: 67000 },
    ];

    const mockCategoryData: CategoryData[] = [
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

  const handleExportReport = (format: 'pdf' | 'excel') => {
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

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="mt-2 text-sm text-gray-700">
              Performance metrics, cost savings analysis, and business intelligence
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
              <option value="2years">Last 2 Years</option>
            </select>
            <button
              onClick={() => handleExportReport('pdf')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export PDF
            </button>
            <button
              onClick={() => handleExportReport('excel')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-primary-500" />
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
                  <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
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
                  <TruckIcon className="h-8 w-8 text-yellow-500" />
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
                  <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
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
                  <ChartBarIcon className="h-8 w-8 text-blue-500" />
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
                  <ClockIcon className="h-8 w-8 text-purple-500" />
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
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Inventory Value Trend */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Inventory Value Trend</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Inventory Value']} />
                <Area type="monotone" dataKey="inventoryValue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Savings Trend */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Monthly Cost Savings</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Savings']} />
                <Bar dataKey="savings" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory by Category */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Inventory by Category</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, value }) => `${category}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demand Forecast Accuracy */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Demand Forecast vs Actual</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={demandForecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} name="Actual Demand" />
                <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} name="Predicted Demand" />
              </LineChart>
            </ResponsiveContainer>
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
                {supplierPerformanceData.map((supplier, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {supplier.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2">{supplier.performance}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              supplier.performance >= 90 ? 'bg-green-600' : 
                              supplier.performance >= 80 ? 'bg-yellow-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${supplier.performance}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < supplier.cost ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">({supplier.cost})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.leadTime} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.performance >= 90 ? 'bg-green-100 text-green-800' : 
                        supplier.performance >= 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.performance >= 90 ? 'Improving' : 
                         supplier.performance >= 80 ? 'Stable' : 'Declining'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alert and Notification Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <BellIcon className="h-5 w-5 text-gray-400 mr-2" />
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
                  <input
                    type="number"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={alertSettings.lowStockThreshold}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      lowStockThreshold: parseInt(e.target.value)
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    High Cost Alert Threshold ($)
                  </label>
                  <input
                    type="number"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={alertSettings.highCostThreshold}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      highCostThreshold: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Notification Preferences</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={alertSettings.emailNotifications}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      emailNotifications: e.target.checked
                    })}
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Email Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={alertSettings.smsNotifications}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      smsNotifications: e.target.checked
                    })}
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    SMS Notifications
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveAlertSettings}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
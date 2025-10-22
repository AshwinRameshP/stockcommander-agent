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
const Recommendations = () => {
    const [recommendations, setRecommendations] = (0, react_1.useState)([]);
    const [selectedRecommendations, setSelectedRecommendations] = (0, react_1.useState)(new Set());
    const [filterUrgency, setFilterUrgency] = (0, react_1.useState)('all');
    const [filterStatus, setFilterStatus] = (0, react_1.useState)('pending');
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [showReasoningModal, setShowReasoningModal] = (0, react_1.useState)(null);
    // Mock data - in real implementation, this would come from API
    (0, react_1.useEffect)(() => {
        const mockRecommendations = [
            {
                id: '1',
                partNumber: 'ENG-205',
                description: 'Oil Filter - Premium',
                currentStock: 8,
                recommendedQuantity: 50,
                suggestedOrderDate: new Date('2024-02-15'),
                preferredSupplier: 'FilterMax',
                estimatedCost: 1225.00,
                urgencyLevel: 'critical',
                reasoning: 'Current stock (8 units) is below safety stock (15 units) and reorder point (25 units). Historical demand analysis shows average monthly consumption of 26 units with seasonal peak approaching. Lead time from FilterMax is 4.1 days. Recommended order quantity of 50 units will provide 2-month buffer while optimizing order costs.',
                aiConfidence: 0.94,
                status: 'pending',
                createdAt: new Date('2024-02-10'),
                leadTimeDays: 4,
                expectedDelivery: new Date('2024-02-19'),
            },
            {
                id: '2',
                partNumber: 'BAT-300',
                description: 'Car Battery 12V 70Ah',
                currentStock: 0,
                recommendedQuantity: 20,
                suggestedOrderDate: new Date('2024-02-12'),
                preferredSupplier: 'PowerCell Co',
                estimatedCost: 2400.00,
                urgencyLevel: 'critical',
                reasoning: 'URGENT: Stock out situation detected. Historical demand shows 6 units/month average with recent spike to 8 units. PowerCell Co offers best price-performance ratio despite 5.2-day lead time. Recommended quantity covers 3-month demand plus safety buffer.',
                aiConfidence: 0.98,
                status: 'pending',
                createdAt: new Date('2024-02-08'),
                leadTimeDays: 5,
                expectedDelivery: new Date('2024-02-17'),
            },
            {
                id: '3',
                partNumber: 'TIR-150',
                description: 'All-Season Tire 225/60R16',
                currentStock: 24,
                recommendedQuantity: 30,
                suggestedOrderDate: new Date('2024-02-20'),
                preferredSupplier: 'TireWorld',
                estimatedCost: 4350.00,
                urgencyLevel: 'medium',
                reasoning: 'Approaching seasonal demand peak. Current stock sufficient for 2 weeks. TireWorld offers competitive pricing and 2.8-day lead time. Order timing optimized to arrive before peak season while minimizing carrying costs.',
                aiConfidence: 0.87,
                status: 'pending',
                createdAt: new Date('2024-02-09'),
                leadTimeDays: 3,
                expectedDelivery: new Date('2024-02-23'),
            },
            {
                id: '4',
                partNumber: 'BRK-001',
                description: 'Brake Pad Set - Front',
                currentStock: 45,
                recommendedQuantity: 40,
                suggestedOrderDate: new Date('2024-03-01'),
                preferredSupplier: 'AutoParts Inc',
                estimatedCost: 3599.60,
                urgencyLevel: 'low',
                reasoning: 'Proactive replenishment based on demand forecast. Current stock adequate for 6 weeks. AutoParts Inc maintains 95% on-time delivery and competitive pricing. Order timing optimized for cost efficiency.',
                aiConfidence: 0.82,
                status: 'approved',
                createdAt: new Date('2024-02-05'),
                approvedBy: 'John Smith',
                approvedAt: new Date('2024-02-06'),
                leadTimeDays: 3,
                expectedDelivery: new Date('2024-03-04'),
            },
        ];
        setRecommendations(mockRecommendations);
    }, []);
    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'critical':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'ordered':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };
    const filteredRecommendations = recommendations.filter(rec => {
        const matchesSearch = rec.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rec.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUrgency = filterUrgency === 'all' || rec.urgencyLevel === filterUrgency;
        const matchesStatus = filterStatus === 'all' || rec.status === filterStatus;
        return matchesSearch && matchesUrgency && matchesStatus;
    });
    const handleSelectRecommendation = (id) => {
        const newSelected = new Set(selectedRecommendations);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        }
        else {
            newSelected.add(id);
        }
        setSelectedRecommendations(newSelected);
    };
    const handleSelectAll = () => {
        if (selectedRecommendations.size === filteredRecommendations.length) {
            setSelectedRecommendations(new Set());
        }
        else {
            setSelectedRecommendations(new Set(filteredRecommendations.map(rec => rec.id)));
        }
    };
    const handleBulkApproval = (action) => {
        setRecommendations(prev => prev.map(rec => {
            if (selectedRecommendations.has(rec.id) && rec.status === 'pending') {
                return {
                    ...rec,
                    status: action === 'approve' ? 'approved' : 'rejected',
                    approvedBy: 'Current User',
                    approvedAt: new Date(),
                };
            }
            return rec;
        }));
        setSelectedRecommendations(new Set());
    };
    const handleSingleAction = (id, action) => {
        setRecommendations(prev => prev.map(rec => {
            if (rec.id === id) {
                return {
                    ...rec,
                    status: action === 'approve' ? 'approved' : 'rejected',
                    approvedBy: 'Current User',
                    approvedAt: new Date(),
                };
            }
            return rec;
        }));
    };
    const totalEstimatedCost = filteredRecommendations
        .filter(rec => selectedRecommendations.has(rec.id))
        .reduce((sum, rec) => sum + rec.estimatedCost, 0);
    return (<div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Replenishment Recommendations</h1>
        <p className="mt-2 text-sm text-gray-700">
          AI-powered recommendations for inventory replenishment with approval workflow
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <outline_1.ClockIcon className="h-8 w-8 text-yellow-500"/>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {recommendations.filter(rec => rec.status === 'pending').length}
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
                    {recommendations.filter(rec => rec.urgencyLevel === 'critical').length}
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
                <outline_1.CheckIcon className="h-8 w-8 text-green-500"/>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {recommendations.filter(rec => rec.status === 'approved').length}
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
                    ${recommendations.reduce((sum, rec) => sum + rec.estimatedCost, 0).toLocaleString()}
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
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <outline_1.MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"/>
                <input type="text" placeholder="Search recommendations..." className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <outline_1.FunnelIcon className="h-5 w-5 text-gray-400"/>
                <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="ordered">Ordered</option>
                </select>
              </div>
              <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500" value={filterUrgency} onChange={(e) => setFilterUrgency(e.target.value)}>
                <option value="all">All Urgency</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRecommendations.size > 0 && (<div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-primary-900">
                {selectedRecommendations.size} recommendation(s) selected
              </span>
              {totalEstimatedCost > 0 && (<span className="ml-4 text-sm text-primary-700">
                  Total Cost: ${totalEstimatedCost.toLocaleString()}
                </span>)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleBulkApproval('approve')} className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                Approve Selected
              </button>
              <button onClick={() => handleBulkApproval('reject')} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                Reject Selected
              </button>
            </div>
          </div>
        </div>)}

      {/* Recommendations Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Active Recommendations</h3>
            <div className="flex items-center">
              <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" checked={selectedRecommendations.size === filteredRecommendations.length && filteredRecommendations.length > 0} onChange={handleSelectAll}/>
              <label className="ml-2 text-sm text-gray-700">Select All</label>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Urgency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimated Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecommendations.map((recommendation) => (<tr key={recommendation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" checked={selectedRecommendations.has(recommendation.id)} onChange={() => handleSelectRecommendation(recommendation.id)}/>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {recommendation.partNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {recommendation.description}
                      </div>
                      <div className="text-xs text-gray-400">
                        Supplier: {recommendation.preferredSupplier}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {recommendation.currentStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {recommendation.recommendedQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getUrgencyColor(recommendation.urgencyLevel)}`}>
                      {recommendation.urgencyLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${recommendation.estimatedCost.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(recommendation.status)}`}>
                      {recommendation.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowReasoningModal(recommendation)} className="text-primary-600 hover:text-primary-900">
                        View Details
                      </button>
                      {recommendation.status === 'pending' && (<>
                          <button onClick={() => handleSingleAction(recommendation.id, 'approve')} className="text-green-600 hover:text-green-900">
                            Approve
                          </button>
                          <button onClick={() => handleSingleAction(recommendation.id, 'reject')} className="text-red-600 hover:text-red-900">
                            Reject
                          </button>
                        </>)}
                    </div>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reasoning Modal */}
      {showReasoningModal && (<div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Recommendation Details - {showReasoningModal.partNumber}
                </h3>
                <button onClick={() => setShowReasoningModal(null)} className="text-gray-400 hover:text-gray-600">
                  <outline_1.XMarkIcon className="h-6 w-6"/>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                    <p className="text-sm text-gray-900">{showReasoningModal.currentStock} units</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recommended Quantity</label>
                    <p className="text-sm text-gray-900">{showReasoningModal.recommendedQuantity} units</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Cost</label>
                    <p className="text-sm text-gray-900">${showReasoningModal.estimatedCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
                    <p className="text-sm text-gray-900">{showReasoningModal.expectedDelivery.toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Confidence</label>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${showReasoningModal.aiConfidence * 100}%` }}></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {Math.round(showReasoningModal.aiConfidence * 100)}%
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Reasoning</label>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700">{showReasoningModal.reasoning}</p>
                  </div>
                </div>

                {showReasoningModal.status === 'approved' && showReasoningModal.approvedBy && (<div className="bg-green-50 p-4 rounded-md">
                    <div className="flex">
                      <outline_1.CheckIcon className="h-5 w-5 text-green-400"/>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Approved by {showReasoningModal.approvedBy}
                        </p>
                        <p className="text-sm text-green-700">
                          {showReasoningModal.approvedAt?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>)}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowReasoningModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                  Close
                </button>
                {showReasoningModal.status === 'pending' && (<>
                    <button onClick={() => {
                    handleSingleAction(showReasoningModal.id, 'approve');
                    setShowReasoningModal(null);
                }} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                      Approve
                    </button>
                    <button onClick={() => {
                    handleSingleAction(showReasoningModal.id, 'reject');
                    setShowReasoningModal(null);
                }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                      Reject
                    </button>
                  </>)}
              </div>
            </div>
          </div>
        </div>)}
    </div>);
};
exports.default = Recommendations;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVjb21tZW5kYXRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiUmVjb21tZW5kYXRpb25zLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQW1EO0FBQ25ELHlEQU9xQztBQXNCckMsTUFBTSxlQUFlLEdBQWEsR0FBRyxFQUFFO0lBQ3JDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQWdDLEVBQUUsQ0FBQyxDQUFDO0lBQzFGLE1BQU0sQ0FBQyx1QkFBdUIsRUFBRSwwQkFBMEIsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBYyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDL0YsTUFBTSxDQUFDLGFBQWEsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBUyxLQUFLLENBQUMsQ0FBQztJQUNsRSxNQUFNLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBUyxTQUFTLENBQUMsQ0FBQztJQUNwRSxNQUFNLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxHQUFHLElBQUEsZ0JBQVEsRUFBQyxFQUFFLENBQUMsQ0FBQztJQUNqRCxNQUFNLENBQUMsa0JBQWtCLEVBQUUscUJBQXFCLENBQUMsR0FBRyxJQUFBLGdCQUFRLEVBQXFDLElBQUksQ0FBQyxDQUFDO0lBRXZHLCtEQUErRDtJQUMvRCxJQUFBLGlCQUFTLEVBQUMsR0FBRyxFQUFFO1FBQ2IsTUFBTSxtQkFBbUIsR0FBa0M7WUFDekQ7Z0JBQ0UsRUFBRSxFQUFFLEdBQUc7Z0JBQ1AsVUFBVSxFQUFFLFNBQVM7Z0JBQ3JCLFdBQVcsRUFBRSxzQkFBc0I7Z0JBQ25DLFlBQVksRUFBRSxDQUFDO2dCQUNmLG1CQUFtQixFQUFFLEVBQUU7Z0JBQ3ZCLGtCQUFrQixFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztnQkFDMUMsaUJBQWlCLEVBQUUsV0FBVztnQkFDOUIsYUFBYSxFQUFFLE9BQU87Z0JBQ3RCLFlBQVksRUFBRSxVQUFVO2dCQUN4QixTQUFTLEVBQUUsd1VBQXdVO2dCQUNuVixZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQ2pDLFlBQVksRUFBRSxDQUFDO2dCQUNmLGdCQUFnQixFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQzthQUN6QztZQUNEO2dCQUNFLEVBQUUsRUFBRSxHQUFHO2dCQUNQLFVBQVUsRUFBRSxTQUFTO2dCQUNyQixXQUFXLEVBQUUsc0JBQXNCO2dCQUNuQyxZQUFZLEVBQUUsQ0FBQztnQkFDZixtQkFBbUIsRUFBRSxFQUFFO2dCQUN2QixrQkFBa0IsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQzFDLGlCQUFpQixFQUFFLGNBQWM7Z0JBQ2pDLGFBQWEsRUFBRSxPQUFPO2dCQUN0QixZQUFZLEVBQUUsVUFBVTtnQkFDeEIsU0FBUyxFQUFFLDhQQUE4UDtnQkFDelEsWUFBWSxFQUFFLElBQUk7Z0JBQ2xCLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixTQUFTLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO2dCQUNqQyxZQUFZLEVBQUUsQ0FBQztnQkFDZixnQkFBZ0IsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7YUFDekM7WUFDRDtnQkFDRSxFQUFFLEVBQUUsR0FBRztnQkFDUCxVQUFVLEVBQUUsU0FBUztnQkFDckIsV0FBVyxFQUFFLDJCQUEyQjtnQkFDeEMsWUFBWSxFQUFFLEVBQUU7Z0JBQ2hCLG1CQUFtQixFQUFFLEVBQUU7Z0JBQ3ZCLGtCQUFrQixFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztnQkFDMUMsaUJBQWlCLEVBQUUsV0FBVztnQkFDOUIsYUFBYSxFQUFFLE9BQU87Z0JBQ3RCLFlBQVksRUFBRSxRQUFRO2dCQUN0QixTQUFTLEVBQUUsME5BQTBOO2dCQUNyTyxZQUFZLEVBQUUsSUFBSTtnQkFDbEIsTUFBTSxFQUFFLFNBQVM7Z0JBQ2pCLFNBQVMsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQ2pDLFlBQVksRUFBRSxDQUFDO2dCQUNmLGdCQUFnQixFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQzthQUN6QztZQUNEO2dCQUNFLEVBQUUsRUFBRSxHQUFHO2dCQUNQLFVBQVUsRUFBRSxTQUFTO2dCQUNyQixXQUFXLEVBQUUsdUJBQXVCO2dCQUNwQyxZQUFZLEVBQUUsRUFBRTtnQkFDaEIsbUJBQW1CLEVBQUUsRUFBRTtnQkFDdkIsa0JBQWtCLEVBQUUsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDO2dCQUMxQyxpQkFBaUIsRUFBRSxlQUFlO2dCQUNsQyxhQUFhLEVBQUUsT0FBTztnQkFDdEIsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFNBQVMsRUFBRSx5TUFBeU07Z0JBQ3BOLFlBQVksRUFBRSxJQUFJO2dCQUNsQixNQUFNLEVBQUUsVUFBVTtnQkFDbEIsU0FBUyxFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztnQkFDakMsVUFBVSxFQUFFLFlBQVk7Z0JBQ3hCLFVBQVUsRUFBRSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQ2xDLFlBQVksRUFBRSxDQUFDO2dCQUNmLGdCQUFnQixFQUFFLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQzthQUN6QztTQUNGLENBQUM7UUFDRixrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVQLE1BQU0sZUFBZSxHQUFHLENBQUMsT0FBZSxFQUFFLEVBQUU7UUFDMUMsUUFBUSxPQUFPLEVBQUU7WUFDZixLQUFLLFVBQVU7Z0JBQ2IsT0FBTyx3Q0FBd0MsQ0FBQztZQUNsRCxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxpREFBaUQsQ0FBQztZQUMzRCxLQUFLLFFBQVE7Z0JBQ1gsT0FBTyxpREFBaUQsQ0FBQztZQUMzRCxLQUFLLEtBQUs7Z0JBQ1IsT0FBTyw4Q0FBOEMsQ0FBQztZQUN4RDtnQkFDRSxPQUFPLDJDQUEyQyxDQUFDO1NBQ3REO0lBQ0gsQ0FBQyxDQUFDO0lBRUYsTUFBTSxjQUFjLEdBQUcsQ0FBQyxNQUFjLEVBQUUsRUFBRTtRQUN4QyxRQUFRLE1BQU0sRUFBRTtZQUNkLEtBQUssVUFBVTtnQkFDYixPQUFPLDZCQUE2QixDQUFDO1lBQ3ZDLEtBQUssVUFBVTtnQkFDYixPQUFPLHlCQUF5QixDQUFDO1lBQ25DLEtBQUssU0FBUztnQkFDWixPQUFPLDJCQUEyQixDQUFDO1lBQ3JDLEtBQUssU0FBUyxDQUFDO1lBQ2Y7Z0JBQ0UsT0FBTywrQkFBK0IsQ0FBQztTQUMxQztJQUNILENBQUMsQ0FBQztJQUVGLE1BQU0sdUJBQXVCLEdBQUcsZUFBZSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUMzRCxNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDaEUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDdEYsTUFBTSxjQUFjLEdBQUcsYUFBYSxLQUFLLEtBQUssSUFBSSxHQUFHLENBQUMsWUFBWSxLQUFLLGFBQWEsQ0FBQztRQUNyRixNQUFNLGFBQWEsR0FBRyxZQUFZLEtBQUssS0FBSyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssWUFBWSxDQUFDO1FBQzVFLE9BQU8sYUFBYSxJQUFJLGNBQWMsSUFBSSxhQUFhLENBQUM7SUFDMUQsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLDBCQUEwQixHQUFHLENBQUMsRUFBVSxFQUFFLEVBQUU7UUFDaEQsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUNyRCxJQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFDdkIsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUN4QjthQUFNO1lBQ0wsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNyQjtRQUNELDBCQUEwQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzFDLENBQUMsQ0FBQztJQUVGLE1BQU0sZUFBZSxHQUFHLEdBQUcsRUFBRTtRQUMzQixJQUFJLHVCQUF1QixDQUFDLElBQUksS0FBSyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUU7WUFDbkUsMEJBQTBCLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQ3ZDO2FBQU07WUFDTCwwQkFBMEIsQ0FBQyxJQUFJLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pGO0lBQ0gsQ0FBQyxDQUFDO0lBRUYsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLE1BQTRCLEVBQUUsRUFBRTtRQUMxRCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDeEMsSUFBSSx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFO2dCQUNuRSxPQUFPO29CQUNMLEdBQUcsR0FBRztvQkFDTixNQUFNLEVBQUUsTUFBTSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVO29CQUN0RCxVQUFVLEVBQUUsY0FBYztvQkFDMUIsVUFBVSxFQUFFLElBQUksSUFBSSxFQUFFO2lCQUN2QixDQUFDO2FBQ0g7WUFDRCxPQUFPLEdBQUcsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDSiwwQkFBMEIsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDeEMsQ0FBQyxDQUFDO0lBRUYsTUFBTSxrQkFBa0IsR0FBRyxDQUFDLEVBQVUsRUFBRSxNQUE0QixFQUFFLEVBQUU7UUFDdEUsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3hDLElBQUksR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ2pCLE9BQU87b0JBQ0wsR0FBRyxHQUFHO29CQUNOLE1BQU0sRUFBRSxNQUFNLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVU7b0JBQ3RELFVBQVUsRUFBRSxjQUFjO29CQUMxQixVQUFVLEVBQUUsSUFBSSxJQUFJLEVBQUU7aUJBQ3ZCLENBQUM7YUFDSDtZQUNELE9BQU8sR0FBRyxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNOLENBQUMsQ0FBQztJQUVGLE1BQU0sa0JBQWtCLEdBQUcsdUJBQXVCO1NBQy9DLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDbEQsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFcEQsT0FBTyxDQUNMLENBQUMsR0FBRyxDQUNGO01BQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FDbkI7UUFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsa0NBQWtDLENBQUMsNkJBQTZCLEVBQUUsRUFBRSxDQUNsRjtRQUFBLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyw0QkFBNEIsQ0FDdkM7O1FBQ0YsRUFBRSxDQUFDLENBQ0w7TUFBQSxFQUFFLEdBQUcsQ0FFTDs7TUFBQSxDQUFDLG1CQUFtQixDQUNwQjtNQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQywyREFBMkQsQ0FDeEU7UUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsNENBQTRDLENBQ3pEO1VBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FDbEI7WUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQ2hDO2NBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FDNUI7Z0JBQUEsQ0FBQyxtQkFBUyxDQUFDLFNBQVMsQ0FBQyx5QkFBeUIsRUFDaEQ7Y0FBQSxFQUFFLEdBQUcsQ0FDTDtjQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FDOUI7Z0JBQUEsQ0FBQyxFQUFFLENBQ0Q7a0JBQUEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLDRDQUE0QyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQ3RFO2tCQUFBLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxtQ0FBbUMsQ0FDL0M7b0JBQUEsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQ2pFO2tCQUFBLEVBQUUsRUFBRSxDQUNOO2dCQUFBLEVBQUUsRUFBRSxDQUNOO2NBQUEsRUFBRSxHQUFHLENBQ1A7WUFBQSxFQUFFLEdBQUcsQ0FDUDtVQUFBLEVBQUUsR0FBRyxDQUNQO1FBQUEsRUFBRSxHQUFHLENBRUw7O1FBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLDRDQUE0QyxDQUN6RDtVQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQ2xCO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUNoQztjQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQzVCO2dCQUFBLENBQUMsaUNBQXVCLENBQUMsU0FBUyxDQUFDLHNCQUFzQixFQUMzRDtjQUFBLEVBQUUsR0FBRyxDQUNMO2NBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUM5QjtnQkFBQSxDQUFDLEVBQUUsQ0FDRDtrQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsNENBQTRDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FDdkU7a0JBQUEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLG1DQUFtQyxDQUMvQztvQkFBQSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsWUFBWSxLQUFLLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FDeEU7a0JBQUEsRUFBRSxFQUFFLENBQ047Z0JBQUEsRUFBRSxFQUFFLENBQ047Y0FBQSxFQUFFLEdBQUcsQ0FDUDtZQUFBLEVBQUUsR0FBRyxDQUNQO1VBQUEsRUFBRSxHQUFHLENBQ1A7UUFBQSxFQUFFLEdBQUcsQ0FFTDs7UUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsNENBQTRDLENBQ3pEO1VBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FDbEI7WUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQ2hDO2NBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGVBQWUsQ0FDNUI7Z0JBQUEsQ0FBQyxtQkFBUyxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsRUFDL0M7Y0FBQSxFQUFFLEdBQUcsQ0FDTDtjQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FDOUI7Z0JBQUEsQ0FBQyxFQUFFLENBQ0Q7a0JBQUEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLDRDQUE0QyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQ3ZFO2tCQUFBLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxtQ0FBbUMsQ0FDL0M7b0JBQUEsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE1BQU0sS0FBSyxVQUFVLENBQUMsQ0FBQyxNQUFNLENBQ2xFO2tCQUFBLEVBQUUsRUFBRSxDQUNOO2dCQUFBLEVBQUUsRUFBRSxDQUNOO2NBQUEsRUFBRSxHQUFHLENBQ1A7WUFBQSxFQUFFLEdBQUcsQ0FDUDtVQUFBLEVBQUUsR0FBRyxDQUNQO1FBQUEsRUFBRSxHQUFHLENBRUw7O1FBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLDRDQUE0QyxDQUN6RDtVQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQ2xCO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUNoQztjQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQzVCO2dCQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxvRUFBb0UsQ0FDakY7a0JBQUEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQzFEO2dCQUFBLEVBQUUsR0FBRyxDQUNQO2NBQUEsRUFBRSxHQUFHLENBQ0w7Y0FBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQzlCO2dCQUFBLENBQUMsRUFBRSxDQUNEO2tCQUFBLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyw0Q0FBNEMsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUMxRTtrQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsbUNBQW1DLENBQy9DO3FCQUFDLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUNyRjtrQkFBQSxFQUFFLEVBQUUsQ0FDTjtnQkFBQSxFQUFFLEVBQUUsQ0FDTjtjQUFBLEVBQUUsR0FBRyxDQUNQO1lBQUEsRUFBRSxHQUFHLENBQ1A7VUFBQSxFQUFFLEdBQUcsQ0FDUDtRQUFBLEVBQUUsR0FBRyxDQUNQO01BQUEsRUFBRSxHQUFHLENBRUw7O01BQUEsQ0FBQyxnQ0FBZ0MsQ0FDakM7TUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsaUNBQWlDLENBQzlDO1FBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FDbEI7VUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsaUNBQWlDLENBQzlDO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FDckI7Y0FBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUN2QjtnQkFBQSxDQUFDLDZCQUFtQixDQUFDLFNBQVMsQ0FBQywwRUFBMEUsRUFDekc7Z0JBQUEsQ0FBQyxLQUFLLENBQ0osSUFBSSxDQUFDLE1BQU0sQ0FDWCxXQUFXLENBQUMsMkJBQTJCLENBQ3ZDLFNBQVMsQ0FBQywwR0FBMEcsQ0FDcEgsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQ2xCLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUVuRDtjQUFBLEVBQUUsR0FBRyxDQUNQO1lBQUEsRUFBRSxHQUFHLENBQ0w7WUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsaUNBQWlDLENBQzlDO2NBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLHlCQUF5QixDQUN0QztnQkFBQSxDQUFDLG9CQUFVLENBQUMsU0FBUyxDQUFDLHVCQUF1QixFQUM3QztnQkFBQSxDQUFDLE1BQU0sQ0FDTCxTQUFTLENBQUMsNkZBQTZGLENBQ3ZHLEtBQUssQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUNwQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FFakQ7a0JBQUEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUN0QztrQkFBQSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQ3ZDO2tCQUFBLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FDekM7a0JBQUEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUN6QztrQkFBQSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQ3pDO2dCQUFBLEVBQUUsTUFBTSxDQUNWO2NBQUEsRUFBRSxHQUFHLENBQ0w7Y0FBQSxDQUFDLE1BQU0sQ0FDTCxTQUFTLENBQUMsNkZBQTZGLENBQ3ZHLEtBQUssQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUNyQixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUVsRDtnQkFBQSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQ3ZDO2dCQUFBLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FDekM7Z0JBQUEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUNqQztnQkFBQSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQ3JDO2dCQUFBLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FDakM7Y0FBQSxFQUFFLE1BQU0sQ0FDVjtZQUFBLEVBQUUsR0FBRyxDQUNQO1VBQUEsRUFBRSxHQUFHLENBQ1A7UUFBQSxFQUFFLEdBQUcsQ0FDUDtNQUFBLEVBQUUsR0FBRyxDQUVMOztNQUFBLENBQUMsa0JBQWtCLENBQ25CO01BQUEsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQ25DLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyw2REFBNkQsQ0FDMUU7VUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsbUNBQW1DLENBQ2hEO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUNoQztjQUFBLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxzQ0FBc0MsQ0FDcEQ7Z0JBQUEsQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUU7Y0FDakMsRUFBRSxJQUFJLENBQ047Y0FBQSxDQUFDLGtCQUFrQixHQUFHLENBQUMsSUFBSSxDQUN6QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsK0JBQStCLENBQzdDOytCQUFhLENBQUMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLENBQ25EO2dCQUFBLEVBQUUsSUFBSSxDQUFDLENBQ1IsQ0FDSDtZQUFBLEVBQUUsR0FBRyxDQUNMO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FDekI7Y0FBQSxDQUFDLE1BQU0sQ0FDTCxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUM3QyxTQUFTLENBQUMsMElBQTBJLENBRXBKOztjQUNGLEVBQUUsTUFBTSxDQUNSO2NBQUEsQ0FBQyxNQUFNLENBQ0wsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FDNUMsU0FBUyxDQUFDLG9JQUFvSSxDQUU5STs7Y0FDRixFQUFFLE1BQU0sQ0FDVjtZQUFBLEVBQUUsR0FBRyxDQUNQO1VBQUEsRUFBRSxHQUFHLENBQ1A7UUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBRUQ7O01BQUEsQ0FBQywyQkFBMkIsQ0FDNUI7TUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsNEJBQTRCLENBQ3pDO1FBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLG9DQUFvQyxDQUNqRDtVQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxtQ0FBbUMsQ0FDaEQ7WUFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsbUNBQW1DLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxDQUM1RTtZQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FDaEM7Y0FBQSxDQUFDLEtBQUssQ0FDSixJQUFJLENBQUMsVUFBVSxDQUNmLFNBQVMsQ0FBQyx5RUFBeUUsQ0FDbkYsT0FBTyxDQUFDLENBQUMsdUJBQXVCLENBQUMsSUFBSSxLQUFLLHVCQUF1QixDQUFDLE1BQU0sSUFBSSx1QkFBdUIsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQy9HLFFBQVEsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxFQUU1QjtjQUFBLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyw0QkFBNEIsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUNqRTtZQUFBLEVBQUUsR0FBRyxDQUNQO1VBQUEsRUFBRSxHQUFHLENBQ1A7UUFBQSxFQUFFLEdBQUcsQ0FDTDtRQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FDOUI7VUFBQSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMscUNBQXFDLENBQ3BEO1lBQUEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FDM0I7Y0FBQSxDQUFDLEVBQUUsQ0FDRDtnQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0ZBQWdGLENBQzVGOztnQkFDRixFQUFFLEVBQUUsQ0FDSjtnQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0ZBQWdGLENBQzVGOztnQkFDRixFQUFFLEVBQUUsQ0FDSjtnQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0ZBQWdGLENBQzVGOztnQkFDRixFQUFFLEVBQUUsQ0FDSjtnQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0ZBQWdGLENBQzVGOztnQkFDRixFQUFFLEVBQUUsQ0FDSjtnQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0ZBQWdGLENBQzVGOztnQkFDRixFQUFFLEVBQUUsQ0FDSjtnQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0ZBQWdGLENBQzVGOztnQkFDRixFQUFFLEVBQUUsQ0FDSjtnQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0ZBQWdGLENBQzVGOztnQkFDRixFQUFFLEVBQUUsQ0FDSjtnQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsZ0ZBQWdGLENBQzVGOztnQkFDRixFQUFFLEVBQUUsQ0FDTjtjQUFBLEVBQUUsRUFBRSxDQUNOO1lBQUEsRUFBRSxLQUFLLENBQ1A7WUFBQSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsbUNBQW1DLENBQ2xEO2NBQUEsQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLENBQy9DLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQ3REO2tCQUFBLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsQ0FDekM7b0JBQUEsQ0FBQyxLQUFLLENBQ0osSUFBSSxDQUFDLFVBQVUsQ0FDZixTQUFTLENBQUMseUVBQXlFLENBQ25GLE9BQU8sQ0FBQyxDQUFDLHVCQUF1QixDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDeEQsUUFBUSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsMEJBQTBCLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBRWxFO2tCQUFBLEVBQUUsRUFBRSxDQUNKO2tCQUFBLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsQ0FDekM7b0JBQUEsQ0FBQyxHQUFHLENBQ0Y7c0JBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLG1DQUFtQyxDQUNoRDt3QkFBQSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQzVCO3NCQUFBLEVBQUUsR0FBRyxDQUNMO3NCQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FDcEM7d0JBQUEsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUM3QjtzQkFBQSxFQUFFLEdBQUcsQ0FDTDtzQkFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQ3BDO2tDQUFVLENBQUMsY0FBYyxDQUFDLGlCQUFpQixDQUM3QztzQkFBQSxFQUFFLEdBQUcsQ0FDUDtvQkFBQSxFQUFFLEdBQUcsQ0FDUDtrQkFBQSxFQUFFLEVBQUUsQ0FDSjtrQkFBQSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsbURBQW1ELENBQy9EO29CQUFBLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FDOUI7a0JBQUEsRUFBRSxFQUFFLENBQ0o7a0JBQUEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLG1EQUFtRCxDQUMvRDtvQkFBQSxDQUFDLGNBQWMsQ0FBQyxtQkFBbUIsQ0FDckM7a0JBQUEsRUFBRSxFQUFFLENBQ0o7a0JBQUEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLDZCQUE2QixDQUN6QztvQkFBQSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxtRUFBbUUsZUFBZSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQ2pJO3NCQUFBLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FDNUM7b0JBQUEsRUFBRSxJQUFJLENBQ1I7a0JBQUEsRUFBRSxFQUFFLENBQ0o7a0JBQUEsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLG1EQUFtRCxDQUMvRDtxQkFBQyxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsY0FBYyxFQUFFLENBQ2pEO2tCQUFBLEVBQUUsRUFBRSxDQUNKO2tCQUFBLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsQ0FDekM7b0JBQUEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsNERBQTRELGNBQWMsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUNuSDtzQkFBQSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQ3RDO29CQUFBLEVBQUUsSUFBSSxDQUNSO2tCQUFBLEVBQUUsRUFBRSxDQUNKO2tCQUFBLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxpREFBaUQsQ0FDN0Q7b0JBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLHlCQUF5QixDQUN0QztzQkFBQSxDQUFDLE1BQU0sQ0FDTCxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUNyRCxTQUFTLENBQUMseUNBQXlDLENBRW5EOztzQkFDRixFQUFFLE1BQU0sQ0FDUjtzQkFBQSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEtBQUssU0FBUyxJQUFJLENBQ3RDLEVBQ0U7MEJBQUEsQ0FBQyxNQUFNLENBQ0wsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsY0FBYyxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUNoRSxTQUFTLENBQUMscUNBQXFDLENBRS9DOzswQkFDRixFQUFFLE1BQU0sQ0FDUjswQkFBQSxDQUFDLE1BQU0sQ0FDTCxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQy9ELFNBQVMsQ0FBQyxpQ0FBaUMsQ0FFM0M7OzBCQUNGLEVBQUUsTUFBTSxDQUNWO3dCQUFBLEdBQUcsQ0FDSixDQUNIO29CQUFBLEVBQUUsR0FBRyxDQUNQO2tCQUFBLEVBQUUsRUFBRSxDQUNOO2dCQUFBLEVBQUUsRUFBRSxDQUFDLENBQ04sQ0FBQyxDQUNKO1lBQUEsRUFBRSxLQUFLLENBQ1Q7VUFBQSxFQUFFLEtBQUssQ0FDVDtRQUFBLEVBQUUsR0FBRyxDQUNQO01BQUEsRUFBRSxHQUFHLENBRUw7O01BQUEsQ0FBQyxxQkFBcUIsQ0FDdEI7TUFBQSxDQUFDLGtCQUFrQixJQUFJLENBQ3JCLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyw0RUFBNEUsQ0FDekY7VUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsNEZBQTRGLENBQ3pHO1lBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FDbkI7Y0FBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsd0NBQXdDLENBQ3JEO2dCQUFBLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxtQ0FBbUMsQ0FDL0M7MkNBQXlCLENBQUMsa0JBQWtCLENBQUMsVUFBVSxDQUN6RDtnQkFBQSxFQUFFLEVBQUUsQ0FDSjtnQkFBQSxDQUFDLE1BQU0sQ0FDTCxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUMzQyxTQUFTLENBQUMsbUNBQW1DLENBRTdDO2tCQUFBLENBQUMsbUJBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUNoQztnQkFBQSxFQUFFLE1BQU0sQ0FDVjtjQUFBLEVBQUUsR0FBRyxDQUVMOztjQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQ3hCO2dCQUFBLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FDckM7a0JBQUEsQ0FBQyxHQUFHLENBQ0Y7b0JBQUEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLHlDQUF5QyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQy9FO29CQUFBLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBRSxNQUFLLEVBQUUsQ0FBQyxDQUNqRjtrQkFBQSxFQUFFLEdBQUcsQ0FDTDtrQkFBQSxDQUFDLEdBQUcsQ0FDRjtvQkFBQSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMseUNBQXlDLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUN0RjtvQkFBQSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBRSxNQUFLLEVBQUUsQ0FBQyxDQUN4RjtrQkFBQSxFQUFFLEdBQUcsQ0FDTDtrQkFBQSxDQUFDLEdBQUcsQ0FDRjtvQkFBQSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMseUNBQXlDLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FDaEY7b0JBQUEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQzlGO2tCQUFBLEVBQUUsR0FBRyxDQUNMO2tCQUFBLENBQUMsR0FBRyxDQUNGO29CQUFBLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyx5Q0FBeUMsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQ25GO29CQUFBLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQ3BHO2tCQUFBLEVBQUUsR0FBRyxDQUNQO2dCQUFBLEVBQUUsR0FBRyxDQUVMOztnQkFBQSxDQUFDLEdBQUcsQ0FDRjtrQkFBQSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsOENBQThDLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FDcEY7a0JBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUNoQztvQkFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMscUNBQXFDLENBQ2xEO3NCQUFBLENBQUMsR0FBRyxDQUNGLFNBQVMsQ0FBQyxpQ0FBaUMsQ0FDM0MsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxZQUFZLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUMvRCxFQUFFLEdBQUcsQ0FDUjtvQkFBQSxFQUFFLEdBQUcsQ0FDTDtvQkFBQSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsNEJBQTRCLENBQzFDO3NCQUFBLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLENBQUM7b0JBQ3JELEVBQUUsSUFBSSxDQUNSO2tCQUFBLEVBQUUsR0FBRyxDQUNQO2dCQUFBLEVBQUUsR0FBRyxDQUVMOztnQkFBQSxDQUFDLEdBQUcsQ0FDRjtrQkFBQSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsOENBQThDLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FDbkY7a0JBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLDJCQUEyQixDQUN4QztvQkFBQSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQ3hFO2tCQUFBLEVBQUUsR0FBRyxDQUNQO2dCQUFBLEVBQUUsR0FBRyxDQUVMOztnQkFBQSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sS0FBSyxVQUFVLElBQUksa0JBQWtCLENBQUMsVUFBVSxJQUFJLENBQzVFLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyw0QkFBNEIsQ0FDekM7b0JBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FDbkI7c0JBQUEsQ0FBQyxtQkFBUyxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsRUFDN0M7c0JBQUEsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FDbkI7d0JBQUEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLG9DQUFvQyxDQUMvQztzQ0FBWSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsQ0FDNUM7d0JBQUEsRUFBRSxDQUFDLENBQ0g7d0JBQUEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUNuQzswQkFBQSxDQUFDLGtCQUFrQixDQUFDLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxDQUN0RDt3QkFBQSxFQUFFLENBQUMsQ0FDTDtzQkFBQSxFQUFFLEdBQUcsQ0FDUDtvQkFBQSxFQUFFLEdBQUcsQ0FDUDtrQkFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQ0g7Y0FBQSxFQUFFLEdBQUcsQ0FFTDs7Y0FBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsNkJBQTZCLENBQzFDO2dCQUFBLENBQUMsTUFBTSxDQUNMLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQzNDLFNBQVMsQ0FBQywwSUFBMEksQ0FFcEo7O2dCQUNGLEVBQUUsTUFBTSxDQUNSO2dCQUFBLENBQUMsa0JBQWtCLENBQUMsTUFBTSxLQUFLLFNBQVMsSUFBSSxDQUMxQyxFQUNFO29CQUFBLENBQUMsTUFBTSxDQUNMLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRTtvQkFDWixrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7b0JBQ3JELHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUM5QixDQUFDLENBQUMsQ0FDRixTQUFTLENBQUMsMElBQTBJLENBRXBKOztvQkFDRixFQUFFLE1BQU0sQ0FDUjtvQkFBQSxDQUFDLE1BQU0sQ0FDTCxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUU7b0JBQ1osa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO29CQUNwRCxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDOUIsQ0FBQyxDQUFDLENBQ0YsU0FBUyxDQUFDLG9JQUFvSSxDQUU5STs7b0JBQ0YsRUFBRSxNQUFNLENBQ1Y7a0JBQUEsR0FBRyxDQUNKLENBQ0g7Y0FBQSxFQUFFLEdBQUcsQ0FDUDtZQUFBLEVBQUUsR0FBRyxDQUNQO1VBQUEsRUFBRSxHQUFHLENBQ1A7UUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQ0g7SUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUM7QUFDSixDQUFDLENBQUM7QUFFRixrQkFBZSxlQUFlLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcclxuaW1wb3J0IHtcclxuICBDaGVja0ljb24sXHJcbiAgWE1hcmtJY29uLFxyXG4gIENsb2NrSWNvbixcclxuICBFeGNsYW1hdGlvblRyaWFuZ2xlSWNvbixcclxuICBGdW5uZWxJY29uLFxyXG4gIE1hZ25pZnlpbmdHbGFzc0ljb24sXHJcbn0gZnJvbSAnQGhlcm9pY29ucy9yZWFjdC8yNC9vdXRsaW5lJztcclxuXHJcbmludGVyZmFjZSBSZXBsZW5pc2htZW50UmVjb21tZW5kYXRpb24ge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgcGFydE51bWJlcjogc3RyaW5nO1xyXG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbiAgY3VycmVudFN0b2NrOiBudW1iZXI7XHJcbiAgcmVjb21tZW5kZWRRdWFudGl0eTogbnVtYmVyO1xyXG4gIHN1Z2dlc3RlZE9yZGVyRGF0ZTogRGF0ZTtcclxuICBwcmVmZXJyZWRTdXBwbGllcjogc3RyaW5nO1xyXG4gIGVzdGltYXRlZENvc3Q6IG51bWJlcjtcclxuICB1cmdlbmN5TGV2ZWw6ICdsb3cnIHwgJ21lZGl1bScgfCAnaGlnaCcgfCAnY3JpdGljYWwnO1xyXG4gIHJlYXNvbmluZzogc3RyaW5nO1xyXG4gIGFpQ29uZmlkZW5jZTogbnVtYmVyO1xyXG4gIHN0YXR1czogJ3BlbmRpbmcnIHwgJ2FwcHJvdmVkJyB8ICdyZWplY3RlZCcgfCAnb3JkZXJlZCc7XHJcbiAgY3JlYXRlZEF0OiBEYXRlO1xyXG4gIGFwcHJvdmVkQnk/OiBzdHJpbmc7XHJcbiAgYXBwcm92ZWRBdD86IERhdGU7XHJcbiAgbGVhZFRpbWVEYXlzOiBudW1iZXI7XHJcbiAgZXhwZWN0ZWREZWxpdmVyeTogRGF0ZTtcclxufVxyXG5cclxuY29uc3QgUmVjb21tZW5kYXRpb25zOiBSZWFjdC5GQyA9ICgpID0+IHtcclxuICBjb25zdCBbcmVjb21tZW5kYXRpb25zLCBzZXRSZWNvbW1lbmRhdGlvbnNdID0gdXNlU3RhdGU8UmVwbGVuaXNobWVudFJlY29tbWVuZGF0aW9uW10+KFtdKTtcclxuICBjb25zdCBbc2VsZWN0ZWRSZWNvbW1lbmRhdGlvbnMsIHNldFNlbGVjdGVkUmVjb21tZW5kYXRpb25zXSA9IHVzZVN0YXRlPFNldDxzdHJpbmc+PihuZXcgU2V0KCkpO1xyXG4gIGNvbnN0IFtmaWx0ZXJVcmdlbmN5LCBzZXRGaWx0ZXJVcmdlbmN5XSA9IHVzZVN0YXRlPHN0cmluZz4oJ2FsbCcpO1xyXG4gIGNvbnN0IFtmaWx0ZXJTdGF0dXMsIHNldEZpbHRlclN0YXR1c10gPSB1c2VTdGF0ZTxzdHJpbmc+KCdwZW5kaW5nJyk7XHJcbiAgY29uc3QgW3NlYXJjaFRlcm0sIHNldFNlYXJjaFRlcm1dID0gdXNlU3RhdGUoJycpO1xyXG4gIGNvbnN0IFtzaG93UmVhc29uaW5nTW9kYWwsIHNldFNob3dSZWFzb25pbmdNb2RhbF0gPSB1c2VTdGF0ZTxSZXBsZW5pc2htZW50UmVjb21tZW5kYXRpb24gfCBudWxsPihudWxsKTtcclxuXHJcbiAgLy8gTW9jayBkYXRhIC0gaW4gcmVhbCBpbXBsZW1lbnRhdGlvbiwgdGhpcyB3b3VsZCBjb21lIGZyb20gQVBJXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGNvbnN0IG1vY2tSZWNvbW1lbmRhdGlvbnM6IFJlcGxlbmlzaG1lbnRSZWNvbW1lbmRhdGlvbltdID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICcxJyxcclxuICAgICAgICBwYXJ0TnVtYmVyOiAnRU5HLTIwNScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdPaWwgRmlsdGVyIC0gUHJlbWl1bScsXHJcbiAgICAgICAgY3VycmVudFN0b2NrOiA4LFxyXG4gICAgICAgIHJlY29tbWVuZGVkUXVhbnRpdHk6IDUwLFxyXG4gICAgICAgIHN1Z2dlc3RlZE9yZGVyRGF0ZTogbmV3IERhdGUoJzIwMjQtMDItMTUnKSxcclxuICAgICAgICBwcmVmZXJyZWRTdXBwbGllcjogJ0ZpbHRlck1heCcsXHJcbiAgICAgICAgZXN0aW1hdGVkQ29zdDogMTIyNS4wMCxcclxuICAgICAgICB1cmdlbmN5TGV2ZWw6ICdjcml0aWNhbCcsXHJcbiAgICAgICAgcmVhc29uaW5nOiAnQ3VycmVudCBzdG9jayAoOCB1bml0cykgaXMgYmVsb3cgc2FmZXR5IHN0b2NrICgxNSB1bml0cykgYW5kIHJlb3JkZXIgcG9pbnQgKDI1IHVuaXRzKS4gSGlzdG9yaWNhbCBkZW1hbmQgYW5hbHlzaXMgc2hvd3MgYXZlcmFnZSBtb250aGx5IGNvbnN1bXB0aW9uIG9mIDI2IHVuaXRzIHdpdGggc2Vhc29uYWwgcGVhayBhcHByb2FjaGluZy4gTGVhZCB0aW1lIGZyb20gRmlsdGVyTWF4IGlzIDQuMSBkYXlzLiBSZWNvbW1lbmRlZCBvcmRlciBxdWFudGl0eSBvZiA1MCB1bml0cyB3aWxsIHByb3ZpZGUgMi1tb250aCBidWZmZXIgd2hpbGUgb3B0aW1pemluZyBvcmRlciBjb3N0cy4nLFxyXG4gICAgICAgIGFpQ29uZmlkZW5jZTogMC45NCxcclxuICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcclxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCcyMDI0LTAyLTEwJyksXHJcbiAgICAgICAgbGVhZFRpbWVEYXlzOiA0LFxyXG4gICAgICAgIGV4cGVjdGVkRGVsaXZlcnk6IG5ldyBEYXRlKCcyMDI0LTAyLTE5JyksXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJzInLFxyXG4gICAgICAgIHBhcnROdW1iZXI6ICdCQVQtMzAwJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NhciBCYXR0ZXJ5IDEyViA3MEFoJyxcclxuICAgICAgICBjdXJyZW50U3RvY2s6IDAsXHJcbiAgICAgICAgcmVjb21tZW5kZWRRdWFudGl0eTogMjAsXHJcbiAgICAgICAgc3VnZ2VzdGVkT3JkZXJEYXRlOiBuZXcgRGF0ZSgnMjAyNC0wMi0xMicpLFxyXG4gICAgICAgIHByZWZlcnJlZFN1cHBsaWVyOiAnUG93ZXJDZWxsIENvJyxcclxuICAgICAgICBlc3RpbWF0ZWRDb3N0OiAyNDAwLjAwLFxyXG4gICAgICAgIHVyZ2VuY3lMZXZlbDogJ2NyaXRpY2FsJyxcclxuICAgICAgICByZWFzb25pbmc6ICdVUkdFTlQ6IFN0b2NrIG91dCBzaXR1YXRpb24gZGV0ZWN0ZWQuIEhpc3RvcmljYWwgZGVtYW5kIHNob3dzIDYgdW5pdHMvbW9udGggYXZlcmFnZSB3aXRoIHJlY2VudCBzcGlrZSB0byA4IHVuaXRzLiBQb3dlckNlbGwgQ28gb2ZmZXJzIGJlc3QgcHJpY2UtcGVyZm9ybWFuY2UgcmF0aW8gZGVzcGl0ZSA1LjItZGF5IGxlYWQgdGltZS4gUmVjb21tZW5kZWQgcXVhbnRpdHkgY292ZXJzIDMtbW9udGggZGVtYW5kIHBsdXMgc2FmZXR5IGJ1ZmZlci4nLFxyXG4gICAgICAgIGFpQ29uZmlkZW5jZTogMC45OCxcclxuICAgICAgICBzdGF0dXM6ICdwZW5kaW5nJyxcclxuICAgICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCcyMDI0LTAyLTA4JyksXHJcbiAgICAgICAgbGVhZFRpbWVEYXlzOiA1LFxyXG4gICAgICAgIGV4cGVjdGVkRGVsaXZlcnk6IG5ldyBEYXRlKCcyMDI0LTAyLTE3JyksXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJzMnLFxyXG4gICAgICAgIHBhcnROdW1iZXI6ICdUSVItMTUwJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ0FsbC1TZWFzb24gVGlyZSAyMjUvNjBSMTYnLFxyXG4gICAgICAgIGN1cnJlbnRTdG9jazogMjQsXHJcbiAgICAgICAgcmVjb21tZW5kZWRRdWFudGl0eTogMzAsXHJcbiAgICAgICAgc3VnZ2VzdGVkT3JkZXJEYXRlOiBuZXcgRGF0ZSgnMjAyNC0wMi0yMCcpLFxyXG4gICAgICAgIHByZWZlcnJlZFN1cHBsaWVyOiAnVGlyZVdvcmxkJyxcclxuICAgICAgICBlc3RpbWF0ZWRDb3N0OiA0MzUwLjAwLFxyXG4gICAgICAgIHVyZ2VuY3lMZXZlbDogJ21lZGl1bScsXHJcbiAgICAgICAgcmVhc29uaW5nOiAnQXBwcm9hY2hpbmcgc2Vhc29uYWwgZGVtYW5kIHBlYWsuIEN1cnJlbnQgc3RvY2sgc3VmZmljaWVudCBmb3IgMiB3ZWVrcy4gVGlyZVdvcmxkIG9mZmVycyBjb21wZXRpdGl2ZSBwcmljaW5nIGFuZCAyLjgtZGF5IGxlYWQgdGltZS4gT3JkZXIgdGltaW5nIG9wdGltaXplZCB0byBhcnJpdmUgYmVmb3JlIHBlYWsgc2Vhc29uIHdoaWxlIG1pbmltaXppbmcgY2FycnlpbmcgY29zdHMuJyxcclxuICAgICAgICBhaUNvbmZpZGVuY2U6IDAuODcsXHJcbiAgICAgICAgc3RhdHVzOiAncGVuZGluZycsXHJcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgnMjAyNC0wMi0wOScpLFxyXG4gICAgICAgIGxlYWRUaW1lRGF5czogMyxcclxuICAgICAgICBleHBlY3RlZERlbGl2ZXJ5OiBuZXcgRGF0ZSgnMjAyNC0wMi0yMycpLFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgaWQ6ICc0JyxcclxuICAgICAgICBwYXJ0TnVtYmVyOiAnQlJLLTAwMScsXHJcbiAgICAgICAgZGVzY3JpcHRpb246ICdCcmFrZSBQYWQgU2V0IC0gRnJvbnQnLFxyXG4gICAgICAgIGN1cnJlbnRTdG9jazogNDUsXHJcbiAgICAgICAgcmVjb21tZW5kZWRRdWFudGl0eTogNDAsXHJcbiAgICAgICAgc3VnZ2VzdGVkT3JkZXJEYXRlOiBuZXcgRGF0ZSgnMjAyNC0wMy0wMScpLFxyXG4gICAgICAgIHByZWZlcnJlZFN1cHBsaWVyOiAnQXV0b1BhcnRzIEluYycsXHJcbiAgICAgICAgZXN0aW1hdGVkQ29zdDogMzU5OS42MCxcclxuICAgICAgICB1cmdlbmN5TGV2ZWw6ICdsb3cnLFxyXG4gICAgICAgIHJlYXNvbmluZzogJ1Byb2FjdGl2ZSByZXBsZW5pc2htZW50IGJhc2VkIG9uIGRlbWFuZCBmb3JlY2FzdC4gQ3VycmVudCBzdG9jayBhZGVxdWF0ZSBmb3IgNiB3ZWVrcy4gQXV0b1BhcnRzIEluYyBtYWludGFpbnMgOTUlIG9uLXRpbWUgZGVsaXZlcnkgYW5kIGNvbXBldGl0aXZlIHByaWNpbmcuIE9yZGVyIHRpbWluZyBvcHRpbWl6ZWQgZm9yIGNvc3QgZWZmaWNpZW5jeS4nLFxyXG4gICAgICAgIGFpQ29uZmlkZW5jZTogMC44MixcclxuICAgICAgICBzdGF0dXM6ICdhcHByb3ZlZCcsXHJcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgnMjAyNC0wMi0wNScpLFxyXG4gICAgICAgIGFwcHJvdmVkQnk6ICdKb2huIFNtaXRoJyxcclxuICAgICAgICBhcHByb3ZlZEF0OiBuZXcgRGF0ZSgnMjAyNC0wMi0wNicpLFxyXG4gICAgICAgIGxlYWRUaW1lRGF5czogMyxcclxuICAgICAgICBleHBlY3RlZERlbGl2ZXJ5OiBuZXcgRGF0ZSgnMjAyNC0wMy0wNCcpLFxyXG4gICAgICB9LFxyXG4gICAgXTtcclxuICAgIHNldFJlY29tbWVuZGF0aW9ucyhtb2NrUmVjb21tZW5kYXRpb25zKTtcclxuICB9LCBbXSk7XHJcblxyXG4gIGNvbnN0IGdldFVyZ2VuY3lDb2xvciA9ICh1cmdlbmN5OiBzdHJpbmcpID0+IHtcclxuICAgIHN3aXRjaCAodXJnZW5jeSkge1xyXG4gICAgICBjYXNlICdjcml0aWNhbCc6XHJcbiAgICAgICAgcmV0dXJuICdiZy1yZWQtMTAwIHRleHQtcmVkLTgwMCBib3JkZXItcmVkLTIwMCc7XHJcbiAgICAgIGNhc2UgJ2hpZ2gnOlxyXG4gICAgICAgIHJldHVybiAnYmctb3JhbmdlLTEwMCB0ZXh0LW9yYW5nZS04MDAgYm9yZGVyLW9yYW5nZS0yMDAnO1xyXG4gICAgICBjYXNlICdtZWRpdW0nOlxyXG4gICAgICAgIHJldHVybiAnYmcteWVsbG93LTEwMCB0ZXh0LXllbGxvdy04MDAgYm9yZGVyLXllbGxvdy0yMDAnO1xyXG4gICAgICBjYXNlICdsb3cnOlxyXG4gICAgICAgIHJldHVybiAnYmctZ3JlZW4tMTAwIHRleHQtZ3JlZW4tODAwIGJvcmRlci1ncmVlbi0yMDAnO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiAnYmctZ3JheS0xMDAgdGV4dC1ncmF5LTgwMCBib3JkZXItZ3JheS0yMDAnO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGdldFN0YXR1c0NvbG9yID0gKHN0YXR1czogc3RyaW5nKSA9PiB7XHJcbiAgICBzd2l0Y2ggKHN0YXR1cykge1xyXG4gICAgICBjYXNlICdhcHByb3ZlZCc6XHJcbiAgICAgICAgcmV0dXJuICdiZy1ncmVlbi0xMDAgdGV4dC1ncmVlbi04MDAnO1xyXG4gICAgICBjYXNlICdyZWplY3RlZCc6XHJcbiAgICAgICAgcmV0dXJuICdiZy1yZWQtMTAwIHRleHQtcmVkLTgwMCc7XHJcbiAgICAgIGNhc2UgJ29yZGVyZWQnOlxyXG4gICAgICAgIHJldHVybiAnYmctYmx1ZS0xMDAgdGV4dC1ibHVlLTgwMCc7XHJcbiAgICAgIGNhc2UgJ3BlbmRpbmcnOlxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiAnYmcteWVsbG93LTEwMCB0ZXh0LXllbGxvdy04MDAnO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGZpbHRlcmVkUmVjb21tZW5kYXRpb25zID0gcmVjb21tZW5kYXRpb25zLmZpbHRlcihyZWMgPT4ge1xyXG4gICAgY29uc3QgbWF0Y2hlc1NlYXJjaCA9IHJlYy5wYXJ0TnVtYmVyLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoVGVybS50b0xvd2VyQ2FzZSgpKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgcmVjLmRlc2NyaXB0aW9uLnRvTG93ZXJDYXNlKCkuaW5jbHVkZXMoc2VhcmNoVGVybS50b0xvd2VyQ2FzZSgpKTtcclxuICAgIGNvbnN0IG1hdGNoZXNVcmdlbmN5ID0gZmlsdGVyVXJnZW5jeSA9PT0gJ2FsbCcgfHwgcmVjLnVyZ2VuY3lMZXZlbCA9PT0gZmlsdGVyVXJnZW5jeTtcclxuICAgIGNvbnN0IG1hdGNoZXNTdGF0dXMgPSBmaWx0ZXJTdGF0dXMgPT09ICdhbGwnIHx8IHJlYy5zdGF0dXMgPT09IGZpbHRlclN0YXR1cztcclxuICAgIHJldHVybiBtYXRjaGVzU2VhcmNoICYmIG1hdGNoZXNVcmdlbmN5ICYmIG1hdGNoZXNTdGF0dXM7XHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IGhhbmRsZVNlbGVjdFJlY29tbWVuZGF0aW9uID0gKGlkOiBzdHJpbmcpID0+IHtcclxuICAgIGNvbnN0IG5ld1NlbGVjdGVkID0gbmV3IFNldChzZWxlY3RlZFJlY29tbWVuZGF0aW9ucyk7XHJcbiAgICBpZiAobmV3U2VsZWN0ZWQuaGFzKGlkKSkge1xyXG4gICAgICBuZXdTZWxlY3RlZC5kZWxldGUoaWQpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbmV3U2VsZWN0ZWQuYWRkKGlkKTtcclxuICAgIH1cclxuICAgIHNldFNlbGVjdGVkUmVjb21tZW5kYXRpb25zKG5ld1NlbGVjdGVkKTtcclxuICB9O1xyXG5cclxuICBjb25zdCBoYW5kbGVTZWxlY3RBbGwgPSAoKSA9PiB7XHJcbiAgICBpZiAoc2VsZWN0ZWRSZWNvbW1lbmRhdGlvbnMuc2l6ZSA9PT0gZmlsdGVyZWRSZWNvbW1lbmRhdGlvbnMubGVuZ3RoKSB7XHJcbiAgICAgIHNldFNlbGVjdGVkUmVjb21tZW5kYXRpb25zKG5ldyBTZXQoKSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBzZXRTZWxlY3RlZFJlY29tbWVuZGF0aW9ucyhuZXcgU2V0KGZpbHRlcmVkUmVjb21tZW5kYXRpb25zLm1hcChyZWMgPT4gcmVjLmlkKSkpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGhhbmRsZUJ1bGtBcHByb3ZhbCA9IChhY3Rpb246ICdhcHByb3ZlJyB8ICdyZWplY3QnKSA9PiB7XHJcbiAgICBzZXRSZWNvbW1lbmRhdGlvbnMocHJldiA9PiBwcmV2Lm1hcChyZWMgPT4ge1xyXG4gICAgICBpZiAoc2VsZWN0ZWRSZWNvbW1lbmRhdGlvbnMuaGFzKHJlYy5pZCkgJiYgcmVjLnN0YXR1cyA9PT0gJ3BlbmRpbmcnKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIC4uLnJlYyxcclxuICAgICAgICAgIHN0YXR1czogYWN0aW9uID09PSAnYXBwcm92ZScgPyAnYXBwcm92ZWQnIDogJ3JlamVjdGVkJyxcclxuICAgICAgICAgIGFwcHJvdmVkQnk6ICdDdXJyZW50IFVzZXInLFxyXG4gICAgICAgICAgYXBwcm92ZWRBdDogbmV3IERhdGUoKSxcclxuICAgICAgICB9O1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZWM7XHJcbiAgICB9KSk7XHJcbiAgICBzZXRTZWxlY3RlZFJlY29tbWVuZGF0aW9ucyhuZXcgU2V0KCkpO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGhhbmRsZVNpbmdsZUFjdGlvbiA9IChpZDogc3RyaW5nLCBhY3Rpb246ICdhcHByb3ZlJyB8ICdyZWplY3QnKSA9PiB7XHJcbiAgICBzZXRSZWNvbW1lbmRhdGlvbnMocHJldiA9PiBwcmV2Lm1hcChyZWMgPT4ge1xyXG4gICAgICBpZiAocmVjLmlkID09PSBpZCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAuLi5yZWMsXHJcbiAgICAgICAgICBzdGF0dXM6IGFjdGlvbiA9PT0gJ2FwcHJvdmUnID8gJ2FwcHJvdmVkJyA6ICdyZWplY3RlZCcsXHJcbiAgICAgICAgICBhcHByb3ZlZEJ5OiAnQ3VycmVudCBVc2VyJyxcclxuICAgICAgICAgIGFwcHJvdmVkQXQ6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmVjO1xyXG4gICAgfSkpO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IHRvdGFsRXN0aW1hdGVkQ29zdCA9IGZpbHRlcmVkUmVjb21tZW5kYXRpb25zXHJcbiAgICAuZmlsdGVyKHJlYyA9PiBzZWxlY3RlZFJlY29tbWVuZGF0aW9ucy5oYXMocmVjLmlkKSlcclxuICAgIC5yZWR1Y2UoKHN1bSwgcmVjKSA9PiBzdW0gKyByZWMuZXN0aW1hdGVkQ29zdCwgMCk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1iLThcIj5cclxuICAgICAgICA8aDEgY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ib2xkIHRleHQtZ3JheS05MDBcIj5SZXBsZW5pc2htZW50IFJlY29tbWVuZGF0aW9uczwvaDE+XHJcbiAgICAgICAgPHAgY2xhc3NOYW1lPVwibXQtMiB0ZXh0LXNtIHRleHQtZ3JheS03MDBcIj5cclxuICAgICAgICAgIEFJLXBvd2VyZWQgcmVjb21tZW5kYXRpb25zIGZvciBpbnZlbnRvcnkgcmVwbGVuaXNobWVudCB3aXRoIGFwcHJvdmFsIHdvcmtmbG93XHJcbiAgICAgICAgPC9wPlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIHsvKiBTdW1tYXJ5IENhcmRzICovfVxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTEgZ2FwLTUgc206Z3JpZC1jb2xzLTIgbGc6Z3JpZC1jb2xzLTQgbWItOFwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgb3ZlcmZsb3ctaGlkZGVuIHNoYWRvdyByb3VuZGVkLWxnXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNVwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LXNocmluay0wXCI+XHJcbiAgICAgICAgICAgICAgICA8Q2xvY2tJY29uIGNsYXNzTmFtZT1cImgtOCB3LTggdGV4dC15ZWxsb3ctNTAwXCIgLz5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1sLTUgdy0wIGZsZXgtMVwiPlxyXG4gICAgICAgICAgICAgICAgPGRsPlxyXG4gICAgICAgICAgICAgICAgICA8ZHQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHRydW5jYXRlXCI+UGVuZGluZzwvZHQ+XHJcbiAgICAgICAgICAgICAgICAgIDxkZCBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICB7cmVjb21tZW5kYXRpb25zLmZpbHRlcihyZWMgPT4gcmVjLnN0YXR1cyA9PT0gJ3BlbmRpbmcnKS5sZW5ndGh9XHJcbiAgICAgICAgICAgICAgICAgIDwvZGQ+XHJcbiAgICAgICAgICAgICAgICA8L2RsPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLXdoaXRlIG92ZXJmbG93LWhpZGRlbiBzaGFkb3cgcm91bmRlZC1sZ1wiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTVcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC1zaHJpbmstMFwiPlxyXG4gICAgICAgICAgICAgICAgPEV4Y2xhbWF0aW9uVHJpYW5nbGVJY29uIGNsYXNzTmFtZT1cImgtOCB3LTggdGV4dC1yZWQtNTAwXCIgLz5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1sLTUgdy0wIGZsZXgtMVwiPlxyXG4gICAgICAgICAgICAgICAgPGRsPlxyXG4gICAgICAgICAgICAgICAgICA8ZHQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHRydW5jYXRlXCI+Q3JpdGljYWw8L2R0PlxyXG4gICAgICAgICAgICAgICAgICA8ZGQgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAge3JlY29tbWVuZGF0aW9ucy5maWx0ZXIocmVjID0+IHJlYy51cmdlbmN5TGV2ZWwgPT09ICdjcml0aWNhbCcpLmxlbmd0aH1cclxuICAgICAgICAgICAgICAgICAgPC9kZD5cclxuICAgICAgICAgICAgICAgIDwvZGw+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgb3ZlcmZsb3ctaGlkZGVuIHNoYWRvdyByb3VuZGVkLWxnXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNVwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LXNocmluay0wXCI+XHJcbiAgICAgICAgICAgICAgICA8Q2hlY2tJY29uIGNsYXNzTmFtZT1cImgtOCB3LTggdGV4dC1ncmVlbi01MDBcIiAvPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtNSB3LTAgZmxleC0xXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGw+XHJcbiAgICAgICAgICAgICAgICAgIDxkdCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdHJ1bmNhdGVcIj5BcHByb3ZlZDwvZHQ+XHJcbiAgICAgICAgICAgICAgICAgIDxkZCBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICB7cmVjb21tZW5kYXRpb25zLmZpbHRlcihyZWMgPT4gcmVjLnN0YXR1cyA9PT0gJ2FwcHJvdmVkJykubGVuZ3RofVxyXG4gICAgICAgICAgICAgICAgICA8L2RkPlxyXG4gICAgICAgICAgICAgICAgPC9kbD5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBvdmVyZmxvdy1oaWRkZW4gc2hhZG93IHJvdW5kZWQtbGdcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC01XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtc2hyaW5rLTBcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy04IGgtOCBiZy1wcmltYXJ5LTUwMCByb3VuZGVkLW1kIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtd2hpdGUgdGV4dC1zbSBmb250LW1lZGl1bVwiPiQ8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1sLTUgdy0wIGZsZXgtMVwiPlxyXG4gICAgICAgICAgICAgICAgPGRsPlxyXG4gICAgICAgICAgICAgICAgICA8ZHQgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHRydW5jYXRlXCI+VG90YWwgVmFsdWU8L2R0PlxyXG4gICAgICAgICAgICAgICAgICA8ZGQgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgJHtyZWNvbW1lbmRhdGlvbnMucmVkdWNlKChzdW0sIHJlYykgPT4gc3VtICsgcmVjLmVzdGltYXRlZENvc3QsIDApLnRvTG9jYWxlU3RyaW5nKCl9XHJcbiAgICAgICAgICAgICAgICAgIDwvZGQ+XHJcbiAgICAgICAgICAgICAgICA8L2RsPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIHsvKiBTZWFyY2ggYW5kIEZpbHRlciBDb250cm9scyAqL31cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSBzaGFkb3cgcm91bmRlZC1sZyBtYi02XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTZcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBsZzpmbGV4LXJvdyBnYXAtNFwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMVwiPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmVcIj5cclxuICAgICAgICAgICAgICAgIDxNYWduaWZ5aW5nR2xhc3NJY29uIGNsYXNzTmFtZT1cImFic29sdXRlIGxlZnQtMyB0b3AtMS8yIHRyYW5zZm9ybSAtdHJhbnNsYXRlLXktMS8yIGgtNSB3LTUgdGV4dC1ncmF5LTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8aW5wdXRcclxuICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxyXG4gICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlNlYXJjaCByZWNvbW1lbmRhdGlvbnMuLi5cIlxyXG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJwbC0xMCBwci00IHB5LTIgdy1mdWxsIGJvcmRlciBib3JkZXItZ3JheS0zMDAgcm91bmRlZC1tZCBmb2N1czpyaW5nLXByaW1hcnktNTAwIGZvY3VzOmJvcmRlci1wcmltYXJ5LTUwMFwiXHJcbiAgICAgICAgICAgICAgICAgIHZhbHVlPXtzZWFyY2hUZXJtfVxyXG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFNlYXJjaFRlcm0oZS50YXJnZXQudmFsdWUpfVxyXG4gICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBzbTpmbGV4LXJvdyBnYXAtNFwiPlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgICAgIDxGdW5uZWxJY29uIGNsYXNzTmFtZT1cImgtNSB3LTUgdGV4dC1ncmF5LTQwMFwiIC8+XHJcbiAgICAgICAgICAgICAgICA8c2VsZWN0XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJvcmRlciBib3JkZXItZ3JheS0zMDAgcm91bmRlZC1tZCBweC0zIHB5LTIgZm9jdXM6cmluZy1wcmltYXJ5LTUwMCBmb2N1czpib3JkZXItcHJpbWFyeS01MDBcIlxyXG4gICAgICAgICAgICAgICAgICB2YWx1ZT17ZmlsdGVyU3RhdHVzfVxyXG4gICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZpbHRlclN0YXR1cyhlLnRhcmdldC52YWx1ZSl9XHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJhbGxcIj5BbGwgU3RhdHVzPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJwZW5kaW5nXCI+UGVuZGluZzwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiYXBwcm92ZWRcIj5BcHByb3ZlZDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwicmVqZWN0ZWRcIj5SZWplY3RlZDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwib3JkZXJlZFwiPk9yZGVyZWQ8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxzZWxlY3RcclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJvcmRlciBib3JkZXItZ3JheS0zMDAgcm91bmRlZC1tZCBweC0zIHB5LTIgZm9jdXM6cmluZy1wcmltYXJ5LTUwMCBmb2N1czpib3JkZXItcHJpbWFyeS01MDBcIlxyXG4gICAgICAgICAgICAgICAgdmFsdWU9e2ZpbHRlclVyZ2VuY3l9XHJcbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEZpbHRlclVyZ2VuY3koZS50YXJnZXQudmFsdWUpfVxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJhbGxcIj5BbGwgVXJnZW5jeTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImNyaXRpY2FsXCI+Q3JpdGljYWw8L29wdGlvbj5cclxuICAgICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCJoaWdoXCI+SGlnaDwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIm1lZGl1bVwiPk1lZGl1bTwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cImxvd1wiPkxvdzwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgIDwvc2VsZWN0PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIHsvKiBCdWxrIEFjdGlvbnMgKi99XHJcbiAgICAgIHtzZWxlY3RlZFJlY29tbWVuZGF0aW9ucy5zaXplID4gMCAmJiAoXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1wcmltYXJ5LTUwIGJvcmRlciBib3JkZXItcHJpbWFyeS0yMDAgcm91bmRlZC1sZyBwLTQgbWItNlwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW5cIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1wcmltYXJ5LTkwMFwiPlxyXG4gICAgICAgICAgICAgICAge3NlbGVjdGVkUmVjb21tZW5kYXRpb25zLnNpemV9IHJlY29tbWVuZGF0aW9uKHMpIHNlbGVjdGVkXHJcbiAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgIHt0b3RhbEVzdGltYXRlZENvc3QgPiAwICYmIChcclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLTQgdGV4dC1zbSB0ZXh0LXByaW1hcnktNzAwXCI+XHJcbiAgICAgICAgICAgICAgICAgIFRvdGFsIENvc3Q6ICR7dG90YWxFc3RpbWF0ZWRDb3N0LnRvTG9jYWxlU3RyaW5nKCl9XHJcbiAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMlwiPlxyXG4gICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUJ1bGtBcHByb3ZhbCgnYXBwcm92ZScpfVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctZ3JlZW4tNjAwIHRleHQtd2hpdGUgcHgtNCBweS0yIHJvdW5kZWQtbWQgdGV4dC1zbSBmb250LW1lZGl1bSBob3ZlcjpiZy1ncmVlbi03MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWdyZWVuLTUwMFwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgQXBwcm92ZSBTZWxlY3RlZFxyXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IGhhbmRsZUJ1bGtBcHByb3ZhbCgncmVqZWN0Jyl9XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1yZWQtNjAwIHRleHQtd2hpdGUgcHgtNCBweS0yIHJvdW5kZWQtbWQgdGV4dC1zbSBmb250LW1lZGl1bSBob3ZlcjpiZy1yZWQtNzAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1yZWQtNTAwXCJcclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICBSZWplY3QgU2VsZWN0ZWRcclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgKX1cclxuXHJcbiAgICAgIHsvKiBSZWNvbW1lbmRhdGlvbnMgVGFibGUgKi99XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctd2hpdGUgc2hhZG93IHJvdW5kZWQtbGdcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTYgcHktNCBib3JkZXItYiBib3JkZXItZ3JheS0yMDBcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XHJcbiAgICAgICAgICAgIDxoMyBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtbWVkaXVtIHRleHQtZ3JheS05MDBcIj5BY3RpdmUgUmVjb21tZW5kYXRpb25zPC9oMz5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCJcclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cImgtNCB3LTQgdGV4dC1wcmltYXJ5LTYwMCBmb2N1czpyaW5nLXByaW1hcnktNTAwIGJvcmRlci1ncmF5LTMwMCByb3VuZGVkXCJcclxuICAgICAgICAgICAgICAgIGNoZWNrZWQ9e3NlbGVjdGVkUmVjb21tZW5kYXRpb25zLnNpemUgPT09IGZpbHRlcmVkUmVjb21tZW5kYXRpb25zLmxlbmd0aCAmJiBmaWx0ZXJlZFJlY29tbWVuZGF0aW9ucy5sZW5ndGggPiAwfVxyXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVNlbGVjdEFsbH1cclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJtbC0yIHRleHQtc20gdGV4dC1ncmF5LTcwMFwiPlNlbGVjdCBBbGw8L2xhYmVsPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvXCI+XHJcbiAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwibWluLXctZnVsbCBkaXZpZGUteSBkaXZpZGUtZ3JheS0yMDBcIj5cclxuICAgICAgICAgICAgPHRoZWFkIGNsYXNzTmFtZT1cImJnLWdyYXktNTBcIj5cclxuICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIFNlbGVjdFxyXG4gICAgICAgICAgICAgICAgPC90aD5cclxuICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC02IHB5LTMgdGV4dC1sZWZ0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXJcIj5cclxuICAgICAgICAgICAgICAgICAgUGFydCBEZXRhaWxzXHJcbiAgICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LWxlZnQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICBDdXJyZW50IFN0b2NrXHJcbiAgICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LWxlZnQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICBSZWNvbW1lbmRlZCBRdHlcclxuICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIFVyZ2VuY3lcclxuICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIEVzdGltYXRlZCBDb3N0XHJcbiAgICAgICAgICAgICAgICA8L3RoPlxyXG4gICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyB0ZXh0LWxlZnQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICBTdGF0dXNcclxuICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgIEFjdGlvbnNcclxuICAgICAgICAgICAgICAgIDwvdGg+XHJcbiAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgPHRib2R5IGNsYXNzTmFtZT1cImJnLXdoaXRlIGRpdmlkZS15IGRpdmlkZS1ncmF5LTIwMFwiPlxyXG4gICAgICAgICAgICAgIHtmaWx0ZXJlZFJlY29tbWVuZGF0aW9ucy5tYXAoKHJlY29tbWVuZGF0aW9uKSA9PiAoXHJcbiAgICAgICAgICAgICAgICA8dHIga2V5PXtyZWNvbW1lbmRhdGlvbi5pZH0gY2xhc3NOYW1lPVwiaG92ZXI6YmctZ3JheS01MFwiPlxyXG4gICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtNiBweS00IHdoaXRlc3BhY2Utbm93cmFwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0XHJcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiaC00IHctNCB0ZXh0LXByaW1hcnktNjAwIGZvY3VzOnJpbmctcHJpbWFyeS01MDAgYm9yZGVyLWdyYXktMzAwIHJvdW5kZWRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17c2VsZWN0ZWRSZWNvbW1lbmRhdGlvbnMuaGFzKHJlY29tbWVuZGF0aW9uLmlkKX1cclxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoKSA9PiBoYW5kbGVTZWxlY3RSZWNvbW1lbmRhdGlvbihyZWNvbW1lbmRhdGlvbi5pZCl9XHJcbiAgICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTkwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cmVjb21tZW5kYXRpb24ucGFydE51bWJlcn1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS01MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge3JlY29tbWVuZGF0aW9uLmRlc2NyaXB0aW9ufVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1ncmF5LTQwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBTdXBwbGllcjoge3JlY29tbWVuZGF0aW9uLnByZWZlcnJlZFN1cHBsaWVyfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1zbSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAge3JlY29tbWVuZGF0aW9uLmN1cnJlbnRTdG9ja31cclxuICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICB7cmVjb21tZW5kYXRpb24ucmVjb21tZW5kZWRRdWFudGl0eX1cclxuICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YGlubGluZS1mbGV4IHB4LTIgcHktMSB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgcm91bmRlZC1mdWxsIGJvcmRlciAke2dldFVyZ2VuY3lDb2xvcihyZWNvbW1lbmRhdGlvbi51cmdlbmN5TGV2ZWwpfWB9PlxyXG4gICAgICAgICAgICAgICAgICAgICAge3JlY29tbWVuZGF0aW9uLnVyZ2VuY3lMZXZlbC50b1VwcGVyQ2FzZSgpfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIHRleHQtZ3JheS05MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAke3JlY29tbWVuZGF0aW9uLmVzdGltYXRlZENvc3QudG9Mb2NhbGVTdHJpbmcoKX1cclxuICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YGlubGluZS1mbGV4IHB4LTIgcHktMSB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgcm91bmRlZC1mdWxsICR7Z2V0U3RhdHVzQ29sb3IocmVjb21tZW5kYXRpb24uc3RhdHVzKX1gfT5cclxuICAgICAgICAgICAgICAgICAgICAgIHtyZWNvbW1lbmRhdGlvbi5zdGF0dXMudG9VcHBlckNhc2UoKX1cclxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1zbSBmb250LW1lZGl1bVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd1JlYXNvbmluZ01vZGFsKHJlY29tbWVuZGF0aW9uKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1wcmltYXJ5LTYwMCBob3Zlcjp0ZXh0LXByaW1hcnktOTAwXCJcclxuICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgVmlldyBEZXRhaWxzXHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtyZWNvbW1lbmRhdGlvbi5zdGF0dXMgPT09ICdwZW5kaW5nJyAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gaGFuZGxlU2luZ2xlQWN0aW9uKHJlY29tbWVuZGF0aW9uLmlkLCAnYXBwcm92ZScpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1ncmVlbi02MDAgaG92ZXI6dGV4dC1ncmVlbi05MDBcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFwcHJvdmVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVTaW5nbGVBY3Rpb24ocmVjb21tZW5kYXRpb24uaWQsICdyZWplY3QnKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtcmVkLTYwMCBob3Zlcjp0ZXh0LXJlZC05MDBcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlamVjdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8Lz5cclxuICAgICAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICA8L3Rib2R5PlxyXG4gICAgICAgICAgPC90YWJsZT5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcblxyXG4gICAgICB7LyogUmVhc29uaW5nIE1vZGFsICovfVxyXG4gICAgICB7c2hvd1JlYXNvbmluZ01vZGFsICYmIChcclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgYmctZ3JheS02MDAgYmctb3BhY2l0eS01MCBvdmVyZmxvdy15LWF1dG8gaC1mdWxsIHctZnVsbCB6LTUwXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHRvcC0yMCBteC1hdXRvIHAtNSBib3JkZXIgdy0xMS8xMiBtZDp3LTMvNCBsZzp3LTEvMiBzaGFkb3ctbGcgcm91bmRlZC1tZCBiZy13aGl0ZVwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTNcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBtYi00XCI+XHJcbiAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LW1lZGl1bSB0ZXh0LWdyYXktOTAwXCI+XHJcbiAgICAgICAgICAgICAgICAgIFJlY29tbWVuZGF0aW9uIERldGFpbHMgLSB7c2hvd1JlYXNvbmluZ01vZGFsLnBhcnROdW1iZXJ9XHJcbiAgICAgICAgICAgICAgICA8L2gzPlxyXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93UmVhc29uaW5nTW9kYWwobnVsbCl9XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInRleHQtZ3JheS00MDAgaG92ZXI6dGV4dC1ncmF5LTYwMFwiXHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIDxYTWFya0ljb24gY2xhc3NOYW1lPVwiaC02IHctNlwiIC8+XHJcbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC00XCI+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMFwiPkN1cnJlbnQgU3RvY2s8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmF5LTkwMFwiPntzaG93UmVhc29uaW5nTW9kYWwuY3VycmVudFN0b2NrfSB1bml0czwvcD5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMFwiPlJlY29tbWVuZGVkIFF1YW50aXR5PC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIHRleHQtZ3JheS05MDBcIj57c2hvd1JlYXNvbmluZ01vZGFsLnJlY29tbWVuZGVkUXVhbnRpdHl9IHVuaXRzPC9wPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwXCI+RXN0aW1hdGVkIENvc3Q8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmF5LTkwMFwiPiR7c2hvd1JlYXNvbmluZ01vZGFsLmVzdGltYXRlZENvc3QudG9Mb2NhbGVTdHJpbmcoKX08L3A+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJibG9jayB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS03MDBcIj5FeHBlY3RlZCBEZWxpdmVyeTwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktOTAwXCI+e3Nob3dSZWFzb25pbmdNb2RhbC5leHBlY3RlZERlbGl2ZXJ5LnRvTG9jYWxlRGF0ZVN0cmluZygpfTwvcD5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwiYmxvY2sgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LWdyYXktNzAwIG1iLTJcIj5BSSBDb25maWRlbmNlPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIGJnLWdyYXktMjAwIHJvdW5kZWQtZnVsbCBoLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctcHJpbWFyeS02MDAgaC0yIHJvdW5kZWQtZnVsbFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IHdpZHRoOiBgJHtzaG93UmVhc29uaW5nTW9kYWwuYWlDb25maWRlbmNlICogMTAwfSVgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICA+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWwtMiB0ZXh0LXNtIHRleHQtZ3JheS02MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtNYXRoLnJvdW5kKHNob3dSZWFzb25pbmdNb2RhbC5haUNvbmZpZGVuY2UgKiAxMDApfSVcclxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImJsb2NrIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMCBtYi0yXCI+QUkgUmVhc29uaW5nPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1ncmF5LTUwIHAtNCByb3VuZGVkLW1kXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktNzAwXCI+e3Nob3dSZWFzb25pbmdNb2RhbC5yZWFzb25pbmd9PC9wPlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICAgIHtzaG93UmVhc29uaW5nTW9kYWwuc3RhdHVzID09PSAnYXBwcm92ZWQnICYmIHNob3dSZWFzb25pbmdNb2RhbC5hcHByb3ZlZEJ5ICYmIChcclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1ncmVlbi01MCBwLTQgcm91bmRlZC1tZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPENoZWNrSWNvbiBjbGFzc05hbWU9XCJoLTUgdy01IHRleHQtZ3JlZW4tNDAwXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWwtM1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JlZW4tODAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgQXBwcm92ZWQgYnkge3Nob3dSZWFzb25pbmdNb2RhbC5hcHByb3ZlZEJ5fVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmVlbi03MDBcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICB7c2hvd1JlYXNvbmluZ01vZGFsLmFwcHJvdmVkQXQ/LnRvTG9jYWxlRGF0ZVN0cmluZygpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1lbmQgZ2FwLTMgbXQtNlwiPlxyXG4gICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaG93UmVhc29uaW5nTW9kYWwobnVsbCl9XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTQgcHktMiB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtZ3JheS03MDAgYmctZ3JheS0xMDAgcm91bmRlZC1tZCBob3ZlcjpiZy1ncmF5LTIwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctZ3JheS01MDBcIlxyXG4gICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICBDbG9zZVxyXG4gICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICB7c2hvd1JlYXNvbmluZ01vZGFsLnN0YXR1cyA9PT0gJ3BlbmRpbmcnICYmIChcclxuICAgICAgICAgICAgICAgICAgPD5cclxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZVNpbmdsZUFjdGlvbihzaG93UmVhc29uaW5nTW9kYWwuaWQsICdhcHByb3ZlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFNob3dSZWFzb25pbmdNb2RhbChudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXdoaXRlIGJnLWdyZWVuLTYwMCByb3VuZGVkLW1kIGhvdmVyOmJnLWdyZWVuLTcwMCBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctZ3JlZW4tNTAwXCJcclxuICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICBBcHByb3ZlXHJcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVTaW5nbGVBY3Rpb24oc2hvd1JlYXNvbmluZ01vZGFsLmlkLCAncmVqZWN0Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNldFNob3dSZWFzb25pbmdNb2RhbChudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXdoaXRlIGJnLXJlZC02MDAgcm91bmRlZC1tZCBob3ZlcjpiZy1yZWQtNzAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpyaW5nLTIgZm9jdXM6cmluZy1yZWQtNTAwXCJcclxuICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICBSZWplY3RcclxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgPC8+XHJcbiAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICApfVxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFJlY29tbWVuZGF0aW9uczsiXX0=
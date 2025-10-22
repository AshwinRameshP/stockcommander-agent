import React, { useState, useEffect } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface ReplenishmentRecommendation {
  id: string;
  partNumber: string;
  description: string;
  currentStock: number;
  recommendedQuantity: number;
  suggestedOrderDate: Date;
  preferredSupplier: string;
  estimatedCost: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  aiConfidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'ordered';
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  leadTimeDays: number;
  expectedDelivery: Date;
}

const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<ReplenishmentRecommendation[]>([]);
  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<string>>(new Set());
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReasoningModal, setShowReasoningModal] = useState<ReplenishmentRecommendation | null>(null);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockRecommendations: ReplenishmentRecommendation[] = [
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

  const getUrgencyColor = (urgency: string) => {
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

  const getStatusColor = (status: string) => {
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

  const handleSelectRecommendation = (id: string) => {
    const newSelected = new Set(selectedRecommendations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecommendations(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRecommendations.size === filteredRecommendations.length) {
      setSelectedRecommendations(new Set());
    } else {
      setSelectedRecommendations(new Set(filteredRecommendations.map(rec => rec.id)));
    }
  };

  const handleBulkApproval = (action: 'approve' | 'reject') => {
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

  const handleSingleAction = (id: string, action: 'approve' | 'reject') => {
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

  return (
    <div>
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
                <ClockIcon className="h-8 w-8 text-yellow-500" />
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
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
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
                <CheckIcon className="h-8 w-8 text-green-500" />
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
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recommendations..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="ordered">Ordered</option>
                </select>
              </div>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
              >
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
      {selectedRecommendations.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-primary-900">
                {selectedRecommendations.size} recommendation(s) selected
              </span>
              {totalEstimatedCost > 0 && (
                <span className="ml-4 text-sm text-primary-700">
                  Total Cost: ${totalEstimatedCost.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkApproval('approve')}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Approve Selected
              </button>
              <button
                onClick={() => handleBulkApproval('reject')}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Active Recommendations</h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={selectedRecommendations.size === filteredRecommendations.length && filteredRecommendations.length > 0}
                onChange={handleSelectAll}
              />
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
              {filteredRecommendations.map((recommendation) => (
                <tr key={recommendation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={selectedRecommendations.has(recommendation.id)}
                      onChange={() => handleSelectRecommendation(recommendation.id)}
                    />
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
                      <button
                        onClick={() => setShowReasoningModal(recommendation)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
                      </button>
                      {recommendation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleSingleAction(recommendation.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleSingleAction(recommendation.id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reasoning Modal */}
      {showReasoningModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Recommendation Details - {showReasoningModal.partNumber}
                </h3>
                <button
                  onClick={() => setShowReasoningModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
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
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${showReasoningModal.aiConfidence * 100}%` }}
                      ></div>
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

                {showReasoningModal.status === 'approved' && showReasoningModal.approvedBy && (
                  <div className="bg-green-50 p-4 rounded-md">
                    <div className="flex">
                      <CheckIcon className="h-5 w-5 text-green-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Approved by {showReasoningModal.approvedBy}
                        </p>
                        <p className="text-sm text-green-700">
                          {showReasoningModal.approvedAt?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowReasoningModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
                {showReasoningModal.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleSingleAction(showReasoningModal.id, 'approve');
                        setShowReasoningModal(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        handleSingleAction(showReasoningModal.id, 'reject');
                        setShowReasoningModal(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
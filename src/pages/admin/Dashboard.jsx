import { useState, useEffect } from 'react';
import { useAdminAuth, adminAPI } from './AdminLayout';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.get('/admin/dashboard/stats');
      setStats(response.data.stats || response.data);
      setRecentOrders(response.data.recentOrders || []);
      setMonthlyRevenue(response.data.monthlyRevenue || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `BDT ${Number(amount || 0).toLocaleString('en-BD')}`;
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-amber-100 text-amber-800 border border-amber-200',
      confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
      processing: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      shipped: 'bg-purple-100 text-purple-800 border border-purple-200',
      delivered: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      cancelled: 'bg-rose-100 text-rose-800 border border-rose-200',
      returned: 'bg-orange-100 text-orange-800 border border-orange-200',
    };
    return statusStyles[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getMaxRevenue = () => {
    if (monthlyRevenue.length === 0) return 1;
    return Math.max(...monthlyRevenue.map((m) => m.revenue || 0), 1);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorDisplay message={error} onRetry={fetchDashboardData} fullPage />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 015 17.119V5a2 2 0 012-2h6m4.5 0v.001M12 7.5V3m0 4.5h4.5M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
        </svg>
      ),
      color: 'bg-violet-500',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      label: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-rose-500',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name || 'Admin'}`}
        actions={
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        }
      />

      {/* Instruction Box - Tips for first-time admin users */}
      <InstructionBox
        title="Getting Started Tips"
        type="info"
        items={[
          'Add products with detailed descriptions and high-quality images to attract customers.',
          'Configure store settings, shipping options, and payment methods in Settings.',
          'Set up homepage banners and featured collections to showcase your best products.',
          'Monitor orders regularly and update their status to keep customers informed.',
          'Use categories and tags to organize products for easy navigation.',
        ]}
      />

      {/* No Products Yet Warning */}
      {stats?.totalProducts === 0 && (
        <InstructionBox
          title="No Products Yet"
          type="warning"
          items={[
            'Your store has no products. Start by adding your first product to begin selling.',
            'Click "Add Product" in the Products section to create your first listing.',
          ]}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bgColor} rounded-xl p-5 border border-gray-100`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} text-white p-3 rounded-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Monthly Revenue
          </h2>
          {monthlyRevenue.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No revenue data</p>
          ) : (
            <div className="space-y-3">
              {monthlyRevenue.map((month, idx) => {
                const maxRev = getMaxRevenue();
                const percentage = ((month.revenue || 0) / maxRev) * 100;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-8 shrink-0">
                      {month.label || month.month || `M${idx + 1}`}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      >
                        {percentage > 20 && (
                          <span className="text-[10px] font-semibold text-white">
                            {formatCurrency(month.revenue)}
                          </span>
                        )}
                      </div>
                    </div>
                    {percentage <= 20 && (
                      <span className="text-[11px] font-medium text-gray-600 whitespace-nowrap">
                        {formatCurrency(month.revenue)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <span className="text-xs text-gray-500">Last 10 orders</span>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState
              title="No recent orders"
              description="When customers place orders, they will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Order ID</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Amount</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        #{order.orderNumber || order._id?.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {order.user?.name || order.shippingAddress?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {formatCurrency(order.totalAmount || order.total)}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-BD', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

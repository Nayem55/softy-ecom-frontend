import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth, adminAPI } from './AdminLayout';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader';
import InstructionBox from '../../components/common/InstructionBox';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorDisplay from '../../components/common/ErrorDisplay';

// --- helpers ---------------------------------------------------------------
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-BD') : '');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-BD') : '');

// --- sub-components --------------------------------------------------------
const Pagination = ({ page, totalPages, onPrev, onNext }) => (
  <div style={styles.pagination}>
    <button style={styles.pageBtn} disabled={page <= 1} onClick={onPrev}>
      Prev
    </button>
    <span style={styles.pageInfo}>
      Page {page} of {totalPages || 1}
    </span>
    <button style={styles.pageBtn} disabled={page >= totalPages} onClick={onNext}>
      Next
    </button>
  </div>
);

const OrderDetailRow = ({ order }) => (
  <div style={styles.orderRow}>
    <span>#{order.orderId || order._id?.slice(-6)}</span>
    <span>{fmtDate(order.createdAt)}</span>
    <span>{order.items?.length || 0} item(s)</span>
    <span style={{ fontWeight: 600 }}>
      BDT {(order.total || order.totalAmount || 0).toLocaleString()}
    </span>
    <span style={{ ...styles.badge, background: order.status === 'delivered' ? '#22c55e' : order.status === 'cancelled' ? '#ef4444' : '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 8 }}>
      {order.status || 'pending'}
    </span>
  </div>
);

const CustomerDetail = ({ customer, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchOrders = async () => {
      try {
        const res = await adminAPI.get(`/admin/users/${customer._id}/orders`);
        if (!cancelled) setOrders(res.data?.orders || res.data || []);
      } catch {
        if (!cancelled) setOrders(customer.orders || []);
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    };
    fetchOrders();
    return () => { cancelled = true; };
  }, [customer]);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Customer Details</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={styles.detailGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Name</span>
            <span style={styles.detailValue}>{customer.name}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Email</span>
            <span style={styles.detailValue}>{customer.email}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Phone</span>
            <span style={styles.detailValue}>{customer.phone || '-'}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Joined</span>
            <span style={styles.detailValue}>{fmtDateTime(customer.createdAt)}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Total Orders</span>
            <span style={styles.detailValue}>{orders.length}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Total Spent</span>
            <span style={styles.detailValue}>
              BDT {orders.reduce((s, o) => s + (o.total || o.totalAmount || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>

        <h3 style={{ ...styles.modalTitle, fontSize: 16, marginTop: 20 }}>Order History</h3>
        {loadingOrders ? (
          <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>Loading orders ...</p>
        ) : orders.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: 20 }}>No orders found.</p>
        ) : (
          <div style={styles.ordersList}>
            {orders.map((o, i) => (
              <OrderDetailRow key={o._id || i} order={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DeleteConfirm = ({ name, onConfirm, onCancel }) => (
  <div style={styles.modalOverlay} onClick={onCancel}>
    <div style={{ ...styles.modalContent, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
      <h2 style={{ ...styles.modalTitle, color: '#ef4444' }}>Delete Customer</h2>
      <p style={{ color: '#666', marginBottom: 20, textAlign: 'center' }}>
        Are you sure you want to delete <strong>{name}</strong>? This action cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button style={{ ...styles.btn, background: '#e5e7eb', color: '#374151' }} onClick={onCancel}>Cancel</button>
        <button style={{ ...styles.btn, background: '#ef4444', color: '#fff' }} onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
);

// --- main component --------------------------------------------------------
export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const limit = 10;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.get('/admin/users', {
        params: { page, limit, search },
      });
      const data = res.data;
      const users = data.users || data.data || data || [];
      setCustomers(users);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / limit) || 1);
      setTotalCustomers(data.total || data.totalUsers || users.length || 0);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError(err.response?.data?.message || 'Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminAPI.delete(`/admin/users/${deleteTarget._id}`);
      setDeleteTarget(null);
      toast.success(`Customer "${deleteTarget.name}" deleted`);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer.');
    }
  };

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div style={styles.container}>
      <InstructionBox
        title="Customers Management"
        items={['View customer accounts and their order history. Click a customer to see their details.']}
        type="info"
      />

      <PageHeader
        title="Customers"
        subtitle={`${totalCustomers} registered customers`}
      />

      {/* Search */}
      <form onSubmit={handleSearch} style={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by name, email, or phone ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <button type="submit" style={{ ...styles.btn, background: '#2563eb', color: '#fff' }}>Search</button>
        {search && (
          <button type="button" style={{ ...styles.btn, background: '#e5e7eb', color: '#374151' }}
            onClick={() => { setSearch(''); setPage(1); }}>
            Clear
          </button>
        )}
      </form>
      {search && (
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: -12, marginBottom: 16 }}>
          Showing results for "<strong>{search}</strong>". Try searching by name, email, or phone number.
        </p>
      )}

      {/* Error */}
      {error && <ErrorDisplay message={error} onRetry={fetchCustomers} />}

      {/* Loading / Content */}
      {loading ? (
        <LoadingSpinner size="lg" text="Loading customers..." />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title={search ? 'No customers match your search' : 'No customers yet'}
          description={search ? 'Try different search terms' : 'Customer accounts will appear here once users start registering'}
        />
      ) : (
        <>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Joined</th>
                  <th style={styles.th}>Orders</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.avatarCircle}>{(c.name || '?')[0].toUpperCase()}</div>
                      <span style={{ marginLeft: 8 }}>{c.name}</span>
                    </td>
                    <td style={styles.td}>{c.email}</td>
                    <td style={styles.td}>{c.phone || '-'}</td>
                    <td style={styles.td}>{fmtDate(c.createdAt)}</td>
                    <td style={styles.td}>{c.orderCount ?? c.orders?.length ?? '-'}</td>
                    <td style={styles.td}>
                      <div style={styles.actionsCell}>
                        <button
                          style={{ ...styles.actionBtn, color: '#2563eb' }}
                          title="View details"
                          onClick={() => setViewCustomer(c)}
                        >
                          <svg style={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          View
                        </button>
                        <button
                          style={{ ...styles.actionBtn, color: '#ef4444' }}
                          title="Delete"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <svg style={styles.actionIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M19.228 5.79L18.16 19.673A2.25 2.25 0 0115.916 21H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .563c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916A2.25 2.25 0 0013.5 2.25h-3A2.25 2.25 0 008.25 4.5v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPrev={handlePrev} onNext={handleNext} />
        </>
      )}

      {/* Modals */}
      {viewCustomer && <CustomerDetail customer={viewCustomer} onClose={() => setViewCustomer(null)} />}
      {deleteTarget && <DeleteConfirm name={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// --- styles ----------------------------------------------------------------
const styles = {
  container: { padding: 24, maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 },
  badge: { background: '#e5e7eb', color: '#374151', padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 500 },
  searchBar: { display: 'flex', gap: 8, marginBottom: 20 },
  searchInput: { flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' },
  btn: { padding: '10px 16px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' },
  errorBanner: { background: '#fef2f2', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, marginBottom: 16, border: '1px solid #fecaca' },
  loading: { textAlign: 'center', padding: 40, color: '#6b7280', fontSize: 15 },
  emptyState: { textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 15, background: '#f9fafb', borderRadius: 8 },
  tableWrap: { overflowX: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { background: '#f9fafb', padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', color: '#1f2937', verticalAlign: 'middle' },
  avatarCircle: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: '50%', background: '#dbeafe',
    color: '#2563eb', fontWeight: 700, fontSize: 13,
  },
  actionsCell: { display: 'flex', gap: 4 },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 8, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 },
  actionIcon: { width: 14, height: 14 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20 },
  pageBtn: { padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  pageInfo: { fontSize: 13, color: '#6b7280' },
  // modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: '#fff', borderRadius: 8, padding: 24, width: '90%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', padding: 4 },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 },
  detailItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  detailLabel: { fontSize: 12, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase' },
  detailValue: { fontSize: 15, color: '#111827', fontWeight: 500 },
  ordersList: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
  orderRow: { display: 'flex', gap: 16, alignItems: 'center', padding: '10px 12px', background: '#f9fafb', borderRadius: 8, fontSize: 14, flexWrap: 'wrap' },
};


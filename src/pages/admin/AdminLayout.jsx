import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import SEO from "../../components/common/SEO";
import { API_BASE_URL } from "../../api/axios";

/* ------------------------------------------------------------------ */
/*  Admin Axios instance (uses the separate Softy admin token)  */
/* ------------------------------------------------------------------ */
const adminAPI = axios.create({ baseURL: API_BASE_URL });
adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("softy_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export { adminAPI };

const AdminAuthContext = createContext(null);
export const useAdminAuth = () => useContext(AdminAuthContext);

/* ------------------------------------------------------------------ */
/*  Menu configuration                                                */
/* ------------------------------------------------------------------ */
const menuItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    exact: true,
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    label: "Bulk Edit",
    path: "/admin/products/bulk-edit",
    icon: "M9 3.75H6.912a2.25 2.25 0 00-2.243 2.05L3.35 20.65a1.125 1.125 0 001.12 1.225h15.06a1.125 1.125 0 001.12-1.225L19.331 5.8a2.25 2.25 0 00-2.243-2.05H15M9 3.75V2.25h6v1.5M9 3.75h6M8.25 9h7.5M8.25 12.75h7.5M8.25 16.5h5.25",
  },
  {
    label: "Categories",
    path: "/admin/categories",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    label: "Customers",
    path: "/admin/customers",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
  },
  {
    label: "Banners",
    path: "/admin/banners",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    label: "Brands",
    path: "/admin/brands",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  },
  {
    label: "Coupons",
    path: "/admin/coupons",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  },
  {
    label: "Newsletter",
    path: "/admin/newsletter",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    label: "Messages",
    path: "/admin/messages",
    icon: "M21 15a4 4 0 01-4 4H7l-4 3V7a4 4 0 014-4h10a4 4 0 014 4v8z",
  },
  {
    label: "Pages",
    path: "/admin/pages",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    label: "Reviews",
    path: "/admin/reviews",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  },
  {
    label: "Customize",
    path: "/admin/customize",
    icon: "M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v11.452c0 .54-.384 1.006-.917 1.096A48.341 48.341 0 0112 18c-2.755 0-5.455-.232-8.083-.678A1.098 1.098 0 013 16.226V4.774c0-.54.384-1.006.917-1.096A48.341 48.341 0 0112 3z M7 7h10M7 11h4m1 10l-3-3h6l-3 3z",
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */
function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-[100vh] w-64 bg-oxblood-dark text-ivory
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:fixed lg:z-50
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo area */}
        <div className="px-6 py-5 border-b border-white/10">
          <img src="/brand/softy-ecom-logo.png" alt="Softy" className="h-11 w-auto max-w-full object-contain object-left brightness-0 invert" />
          <p className="text-gold text-[10px] tracking-[0.25em] uppercase mt-1 font-semibold">
            Admin Panel
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          {menuItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 group
                  ${
                    isActive
                      ? "bg-gold/20 text-gold"
                      : "text-ivory/70 hover:bg-white/10 hover:text-ivory"
                  }
                `}
              >
                <span className="w-5 h-5 flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={item.icon} />
                  </svg>
                </span>
                <span className="tracking-wide">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-[10px] text-ivory/30 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} Softy
          </p>
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Topbar                                                             */
/* ------------------------------------------------------------------ */
function Topbar({ adminName, onMenuToggle, onLogout, onChangePassword }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-line px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Left: hamburger + page hint */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-ivory transition-colors text-charcoal"
          aria-label="Toggle menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span className="text-sm font-semibold text-charcoal/70 tracking-wide hidden sm:inline">
          Dashboard
        </span>
      </div>

      {/* Right: admin actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onChangePassword}
          className="hidden sm:flex items-center gap-2 text-xs font-medium text-charcoal/60 hover:text-oxblood transition-colors px-3 py-2 rounded-lg hover:bg-ivory"
        >
          Change Password
        </button>

        <div className="flex items-center gap-2 bg-ivory rounded-full px-4 py-2">
          <div className="w-7 h-7 rounded-full bg-oxblood text-ivory flex items-center justify-center text-xs font-bold">
            {adminName?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <span className="text-sm font-semibold text-charcoal hidden sm:inline">
            {adminName || "Admin"}
          </span>
        </div>

        <button
          onClick={onLogout}
          className="p-2 rounded-lg hover:bg-red-50 text-charcoal/50 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Change Password Modal                                              */
/* ------------------------------------------------------------------ */
function ChangePasswordModal({ open, onClose, api }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, setVisible] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({
        text: "Password must be at least 6 characters",
        type: "error",
      });
      return;
    }
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await api.put("/admin/change-password", {
        currentPassword,
        newPassword,
      });
      setMessage({ text: "Password updated successfully!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Failed to change password",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-oxblood px-6 py-5">
          <h2 className="text-ivory font-bold tracking-widest uppercase text-sm">
            Change Password
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {message.text && (
            <div
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.5 tracking-wide">
              Current Password
            </label>
            <AdminPasswordInput value={currentPassword} onChange={setCurrentPassword} visible={!!visible.current} onToggle={() => setVisible((prev) => ({ ...prev, current: !prev.current }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.5 tracking-wide">
              New Password
            </label>
            <AdminPasswordInput value={newPassword} onChange={setNewPassword} visible={!!visible.next} onToggle={() => setVisible((prev) => ({ ...prev, next: !prev.next }))} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1.5 tracking-wide">
              Confirm New Password
            </label>
            <AdminPasswordInput value={confirmPassword} onChange={setConfirmPassword} visible={!!visible.confirm} onToggle={() => setVisible((prev) => ({ ...prev, confirm: !prev.confirm }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-line text-charcoal/60 text-sm font-medium hover:bg-ivory transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-oxblood hover:bg-oxblood-dark text-ivory text-sm font-semibold tracking-wider uppercase transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-ivory border-t-transparent rounded-full animate-spin" />
              ) : (
                "Update"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminPasswordInput({ value, onChange, visible, onToggle }) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 pr-11 rounded-lg border border-line bg-ivory/50 text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-oxblood/30"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/45 hover:text-oxblood transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c1.595 0 3.106-.356 4.459-.992M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.52 10.52 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Layout                                                        */
/* ------------------------------------------------------------------ */
export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pwModal, setPwModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("softy_admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    adminAPI
      .get("/auth/admin/me")
      .then((res) => setAdmin(res.data.admin || res.data))
      .catch(() => {
        localStorage.removeItem("softy_admin_token");
        navigate("/admin/login");
      })
      .finally(() => setAuthLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("softy_admin_token");
    navigate("/admin/login");
  };
  const currentMenuItem = [...menuItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => location.pathname === item.path || (!item.exact && location.pathname.startsWith(`${item.path}/`)));
  const adminTitle = currentMenuItem?.label || "Admin Panel";

  /* Loading screen while checking auth */
  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-oxblood border-t-transparent rounded-full animate-spin" />
        <p className="text-charcoal/50 text-sm font-medium tracking-wide">
          Verifying admin access...
        </p>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ admin, user: admin, api: adminAPI }}>
      <SEO
        title={`${adminTitle} Admin`}
        description="Softy ecommerce management panel."
        noIndex
      />
      <div className="min-h-screen bg-ivory">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <div className="flex min-h-screen flex-col lg:ml-64">
          <Topbar
            adminName={admin?.name || admin?.email?.split("@")[0] || "Admin"}
            onMenuToggle={() => setSidebarOpen((p) => !p)}
            onLogout={handleLogout}
            onChangePassword={() => setPwModal(true)}
          />

          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>

        {/* Change password modal */}
        <ChangePasswordModal
          open={pwModal}
          onClose={() => setPwModal(false)}
          api={adminAPI}
        />
      </div>
    </AdminAuthContext.Provider>
  );
}

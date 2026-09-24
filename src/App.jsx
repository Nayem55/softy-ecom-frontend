import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import WhatsAppButton from './components/common/WhatsAppButton';
import MobileBottomNav from './components/common/MobileBottomNav';
import Home from './pages/public/Home';
import Shop from './pages/public/Shop';
import ProductDetail from './pages/public/ProductDetail';
import CartPage from './pages/public/CartPage';
import Checkout from './pages/public/Checkout';
import AuthPage from './pages/public/AuthPage';
import MyOrders from './pages/public/MyOrders';
import Wishlist from './pages/public/Wishlist';
import TrackOrder from './pages/public/TrackOrder';
import StaticPage from './pages/public/StaticPage';
import SoftyInfoPage from './pages/public/SoftyInfoPage';
import NotFound from './pages/public/NotFound';
import SEO from './components/common/SEO';
import MarketingIntegrations from './components/common/MarketingIntegrations';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminBulkProducts from './pages/admin/AdminBulkProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import OrderDetail from './pages/admin/OrderDetail';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminBanners from './pages/admin/AdminBanners';
import AdminBrands from './pages/admin/AdminBrands';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCustomize from './pages/admin/AdminCustomize';
import AdminNewsletter from './pages/admin/AdminNewsletter';
import AdminPages from './pages/admin/AdminPages';
import AdminReviews from './pages/admin/AdminReviews';
import AdminMessages from './pages/admin/AdminMessages';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-ivory">
    <div className="text-center">
      <div className="font-serif text-3xl text-oxblood-dark mb-6">Softy</div>
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  </div>
);

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname, search]);

  return null;
};

export default function App() {
  const { loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <ErrorBoundary>
      <SEO />
      <MarketingIntegrations />
      <ScrollToTop />
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/bulk-edit" element={<AdminBulkProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/edit/:id" element={<ProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="customize" element={<AdminCustomize />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="newsletter" element={<AdminNewsletter />} />
          <Route path="pages" element={<AdminPages />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={
          <>
            <Navbar />
            <main className="min-h-screen">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:category" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/account" element={<AuthPage />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/about" element={<SoftyInfoPage page="about" />} />
                <Route path="/contact" element={<SoftyInfoPage page="contact" />} />
                <Route path="/shipping-policy" element={<SoftyInfoPage page="shipping-policy" />} />
                <Route path="/return-policy" element={<SoftyInfoPage page="return-policy" />} />
                <Route path="/:slug" element={<StaticPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <WhatsAppButton />
            <MobileBottomNav />
          </>
        } />
      </Routes>
    </ErrorBoundary>
  );
}

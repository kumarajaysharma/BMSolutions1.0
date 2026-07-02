import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Platforms from '@/pages/Platforms';
import PlatformDetail from '@/pages/PlatformDetail';
import Security from '@/pages/Security';
import Contact from '@/pages/Contact';
import NotFound from '@/pages/NotFound';

/**
 * ScrollToTop — restores scroll position on every route transition.
 * Required because React Router does not reset scroll position by default.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/**
 * Layout — wraps all non-error pages with Navbar + Footer.
 */
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/about"
          element={
            <Layout>
              <About />
            </Layout>
          }
        />
        <Route
          path="/platforms"
          element={
            <Layout>
              <Platforms />
            </Layout>
          }
        />
        <Route
          path="/platforms/:platformId"
          element={
            <Layout>
              <PlatformDetail />
            </Layout>
          }
        />
        <Route
          path="/security"
          element={
            <Layout>
              <Security />
            </Layout>
          }
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <Contact />
            </Layout>
          }
        />
        {/* Catch-all — must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

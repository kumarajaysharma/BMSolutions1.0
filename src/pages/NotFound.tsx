import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center grid-pattern">
      <div className="text-center px-4">
        <div
          className="text-[120px] lg:text-[180px] font-bold leading-none mb-4"
          style={{
            fontFamily: 'Syne, sans-serif',
            background: 'linear-gradient(135deg, #1E2A3B 0%, #2D3E54 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </div>
        <div
          className="text-xs text-[#00D4FF] font-mono uppercase tracking-widest mb-4"
        >
          Route not found — BMSolutions
        </div>
        <h1
          className="text-2xl lg:text-3xl font-bold text-white mb-3"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Page Does Not Exist
        </h1>
        <p
          className="text-[#64748B] text-sm mb-8 max-w-sm mx-auto"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          The requested route is not registered. Navigate to a valid endpoint.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00D4FF] text-[#0A0E1A] text-sm font-bold rounded-lg hover:bg-[#00E5FF] transition-colors"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            to="/platforms"
            className="flex items-center gap-2 px-5 py-2.5 border border-[#1E2A3B] text-[#94A3B8] text-sm rounded-lg hover:border-[#2D3E54] hover:text-white transition-colors"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Platforms
          </Link>
        </div>
      </div>
    </div>
  );
}

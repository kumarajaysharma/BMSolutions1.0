"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/images/bnlv-holographic-logo.png" 
              alt="BNLV Group" 
              className="w-12 h-12 rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-emerald-600 to-amber-600 bg-clip-text text-transparent">BNLV</span>
              <span className="text-xs text-gray-600 font-semibold">Group</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-amber-700 font-medium transition-colors">Home</Link>
            
            {/* Companies Dropdown */}
            <div className="relative group">
              <button className="text-gray-700 hover:text-amber-700 font-medium transition-colors">
                Companies
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-amber-100">
                <Link href="/bms" className="block px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 font-medium first:rounded-t-lg">BMS</Link>
                <Link href="/nidhivan" className="block px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 font-medium">Nidhivan</Link>
                <Link href="/limsy" className="block px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 font-medium">LIMSY</Link>
                <Link href="/vihang" className="block px-4 py-3 text-gray-700 hover:bg-amber-50 hover:text-amber-700 font-medium last:rounded-b-lg">Vihang</Link>
              </div>
            </div>

            <Link href="/about" className="text-gray-700 hover:text-amber-700 font-medium transition-colors">About</Link>
            <Link href="/contact" className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:shadow-lg transition-all hover:from-amber-700 hover:to-amber-800 font-semibold">Contact</Link>
            
            {/* Login Link for Platform Access */}
            <Link href="/login" className="text-amber-600 hover:text-amber-800 font-semibold transition-colors text-sm uppercase tracking-wide">Studio Access</Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-amber-50 text-gray-700"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-4 border-t border-amber-100 pt-4">
            <Link href="/" className="block text-gray-700 hover:text-amber-700 font-medium py-2">Home</Link>
            <Link href="/bms" className="block text-gray-700 hover:text-amber-700 font-medium py-2 pl-4">BMS</Link>
            <Link href="/nidhivan" className="block text-gray-700 hover:text-amber-700 font-medium py-2 pl-4">Nidhivan</Link>
            <Link href="/limsy" className="block text-gray-700 hover:text-amber-700 font-medium py-2 pl-4">LIMSY</Link>
            <Link href="/vihang" className="block text-gray-700 hover:text-amber-700 font-medium py-2 pl-4">Vihang</Link>
            <Link href="/about" className="block text-gray-700 hover:text-amber-700 font-medium py-2">About</Link>
            <Link href="/contact" className="block px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold">Contact</Link>
            <Link href="/login" className="block px-6 py-2 bg-slate-900 text-amber-50 rounded-lg hover:shadow-lg transition-all font-semibold text-center mt-4">Studio Access</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
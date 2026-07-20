import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-300 mt-20 border-t border-amber-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 py-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/images/bnlv-holographic-logo.png" 
                alt="BNLV Group" 
                className="w-10 h-10 rounded-lg"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">BNLV</span>
                <span className="text-xs text-slate-400">Group</span>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Enterprise solutions through four specialized divisions: BMS, Nidhivan, LIMSY, and Vihang.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-amber-400 transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-amber-400 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-amber-400 transition-colors">Contact</Link></li>
              <li><Link href="/login" className="hover:text-amber-400 transition-colors">Studio Login</Link></li>
            </ul>
          </div>

          {/* Companies */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Companies</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/bms" className="hover:text-amber-400 transition-colors">BMS</Link></li>
              <li><Link href="/nidhivan" className="hover:text-amber-400 transition-colors">Nidhivan</Link></li>
              <li><Link href="/limsy" className="hover:text-amber-400 transition-colors">LIMSY</Link></li>
              <li><Link href="/vihang" className="hover:text-amber-400 transition-colors">Vihang</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail size={16} className="text-amber-400 mt-1 flex-shrink-0" />
                <a href="mailto:info@bnlconsulting.com" className="hover:text-amber-400 transition-colors">info@bnlconsulting.com</a>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={16} className="text-amber-400 mt-1 flex-shrink-0" />
                <a href="tel:+1234567890" className="hover:text-amber-400 transition-colors">+1 (234) 567-890</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-amber-400 mt-1 flex-shrink-0" />
                <span>Business District, India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-slate-700 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-700 hover:bg-amber-600 flex items-center justify-center transition-colors text-white">
              <span className="font-bold">in</span>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-700 hover:bg-amber-600 flex items-center justify-center transition-colors text-white">
              <span className="font-bold">X</span>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-700 hover:bg-amber-600 flex items-center justify-center transition-colors text-white">
              <span className="font-bold">f</span>
            </a>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {currentYear} BNL Consulting. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
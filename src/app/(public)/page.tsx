import Link from 'next/link';
import { ArrowRight, Briefcase, Target, Zap, Users, TrendingUp, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-amber-50 via-white to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
                  Enterprise Business
                  <span className="bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-transparent"> Solutions</span>
                </h1>
                <p className="text-xl text-slate-600">
                  Comprehensive consulting services through four specialized divisions dedicated to your business excellence.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/companies"
                  className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-semibold hover:shadow-xl hover:from-amber-700 hover:to-amber-800 transition-all flex items-center justify-center gap-2"
                >
                  Explore Companies <ArrowRight size={20} />
                </Link>
                <Link
                  href="/about"
                  className="px-8 py-4 bg-white border-2 border-amber-200 text-amber-700 rounded-lg font-semibold hover:bg-amber-50 transition-all text-center"
                >
                  Learn More
                </Link>
              </div>

              <div className="pt-8 space-y-3 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                  Trusted by leading enterprises
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                  20+ years of industry experience
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
                  Expert consulting professionals
                </p>
              </div>
            </div>

            {/* Hero Image - Holographic Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-emerald-100 to-amber-100 rounded-2xl opacity-30 animate-pulse"></div>
              <div className="relative bg-white rounded-2xl p-8 border-2 border-slate-200 shadow-xl">
                <img 
                  src="/images/bnlv-holographic-logo.png" 
                  alt="BNLV Group Holographic Logo"
                  className="w-full aspect-square object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Our Companies</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Four specialized divisions working together to deliver comprehensive solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* BMS */}
            <Link
              href="/bms"
              className="group bg-white border-2 border-slate-100 rounded-xl p-8 hover:border-blue-400 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-slate-600 via-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                <Target size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">BMS</h3>
              <p className="text-slate-600 mb-4">
                Business Management Solutions providing strategic consulting and operational excellence.
              </p>
              <div className="flex items-center text-amber-600 font-semibold group-hover:gap-2 transition-all">
                Learn More <ArrowRight size={18} />
              </div>
            </Link>

            {/* Nidhivan */}
            <Link
              href="/nidhivan"
              className="group bg-white border-2 border-slate-100 rounded-xl p-8 hover:border-emerald-400 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 via-green-500 to-yellow-400 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform overflow-hidden">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Nidhivan</h3>
              <p className="text-slate-600 mb-4">
                World-class FinTech, ERP, and Astrology solutions — engineered by BMS, delivered by Nidhivan.
              </p>
              <div className="flex items-center text-amber-600 font-semibold group-hover:gap-2 transition-all">
                Learn More <ArrowRight size={18} />
              </div>
            </Link>

            {/* LIMSY */}
            <Link
              href="/limsy"
              className="group bg-white border-2 border-slate-100 rounded-xl p-8 hover:border-rose-400 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 via-red-500 to-slate-600 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform overflow-hidden">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">LIMSY</h3>
              <p className="text-slate-600 mb-4">
                Legal Intelligence Managerial Systems — Case design, development, and management with frameworks and workflows.
              </p>
              <div className="flex items-center text-amber-600 font-semibold group-hover:gap-2 transition-all">
                Learn More <ArrowRight size={18} />
              </div>
            </Link>

            {/* Vihang */}
            <Link
              href="/vihang"
              className="group bg-white border-2 border-slate-100 rounded-xl p-8 hover:border-fuchsia-400 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-600 via-orange-500 to-amber-400 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Vihang</h3>
              <p className="text-slate-600 mb-4">
                Strategic growth and market expansion services driving competitive advantage.
              </p>
              <div className="flex items-center text-amber-600 font-semibold group-hover:gap-2 transition-all">
                Learn More <ArrowRight size={18} />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-amber-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Why Choose BNL Consulting</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Industry-leading expertise combined with innovative solutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="bg-white border border-amber-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                <Target className="text-amber-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Strategic Planning</h3>
              <p className="text-slate-600">
                Comprehensive business strategies tailored to your organization's unique needs and goals.
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-white border border-amber-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="text-amber-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Operational Excellence</h3>
              <p className="text-slate-600">
                Process optimization and efficiency improvement delivering measurable results and ROI.
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-white border border-amber-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="text-amber-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Risk Management</h3>
              <p className="text-slate-600">
                Comprehensive risk assessment and mitigation strategies protecting your enterprise.
              </p>
            </div>

            {/* Service 4 */}
            <div className="bg-white border border-amber-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="text-amber-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Talent Development</h3>
              <p className="text-slate-600">
                Building high-performing teams through training and organizational development.
              </p>
            </div>

            {/* Service 5 */}
            <div className="bg-white border border-amber-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="text-amber-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Growth Strategy</h3>
              <p className="text-slate-600">
                Market analysis and expansion strategies driving sustainable business growth.
              </p>
            </div>

            {/* Service 6 */}
            <div className="bg-white border border-amber-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                <Briefcase className="text-amber-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Digital Transformation</h3>
              <p className="text-slate-600">
                Technology integration and transformation solutions modernizing your operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-amber-400">500+</div>
              <p className="text-slate-300">Projects Completed</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-amber-400">200+</div>
              <p className="text-slate-300">Enterprise Clients</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-amber-400">20+</div>
              <p className="text-slate-300">Years Experience</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-amber-400">98%</div>
              <p className="text-slate-300">Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">Ready to Transform Your Business?</h2>
            <p className="text-xl text-slate-600">
              Contact us today to discover how BNL Consulting can help your organization achieve excellence.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-block px-10 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-semibold hover:shadow-xl hover:from-amber-700 hover:to-amber-800 transition-all"
          >
            Get in Touch Today
          </Link>
        </div>
      </section>
    </div>
  );
}
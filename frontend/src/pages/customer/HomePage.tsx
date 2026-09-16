import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Shop } from '../../types';
import {
  Printer,
  Search,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await api.listShops();
        setShops(data.shops.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shops?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/shops');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white px-6 py-16 sm:px-12 sm:py-24 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_50%)]" />
        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pre-arrival Preparation & Smart Pickup</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Book before you go.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              Pick up when you arrive.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-indigo-100/80 max-w-2xl mx-auto leading-relaxed">
            Stop waiting in long queues at printing shops. Upload your documents, configure your prints, choose your pickup time, and collect in seconds.
          </p>

          {/* Instant Search Bar */}
          <form
            onSubmit={handleSearch}
            className="max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-xl flex items-center space-x-2 text-slate-800"
          >
            <div className="pl-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search print shop name, area (e.g. University Campus)..."
              className="w-full px-2 py-2 text-sm focus:outline-none placeholder:text-slate-400 font-medium"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-500/30 shrink-0"
            >
              Search
            </button>
          </form>

          {/* Quick Shortcuts */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-indigo-200/80">
            <span>Popular areas:</span>
            {['University Campus', 'Business Bay', 'Central Metro'].map((area) => (
              <button
                key={area}
                onClick={() => navigate(`/shops?area=${encodeURIComponent(area)}`)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* The Core Shift: Current Process vs Target Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">
            Why Local Pickup?
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Move preparation before arrival.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Old Way */}
          <div className="p-8 rounded-3xl bg-rose-50/50 border border-rose-100 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Old Way: Waste 20+ Minutes
            </span>
            <div className="space-y-2 text-sm text-rose-900/80">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Visit shop and stand in queue</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Explain pages, copies, color, and binding options</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Send document via slow email or WhatsApp</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Wait while machine warms up and prints</span>
              </div>
            </div>
          </div>

          {/* Local Pickup Way */}
          <div className="p-8 rounded-3xl bg-indigo-50/60 border border-indigo-100 space-y-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Local Pickup Way: Ready When You Arrive
            </span>
            <div className="space-y-2 text-sm text-indigo-950 font-medium">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Upload PDF and configure print options online</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Select a convenient 10-minute pickup slot</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Shop prints your order beforehand</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Arrive, flash QR code, and walk away with prints</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Print Shops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Participating Printing Shops
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Top rated local shops ready for online pre-booking
            </p>
          </div>
          <Link
            to="/shops"
            className="inline-flex items-center space-x-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="group rounded-3xl bg-white p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 flex items-center justify-center transition-colors">
                      <Printer className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Open Today
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {shop.name}
                  </h3>

                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{shop.area}</span>
                  </div>

                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                    {shop.description}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{shop.openingHours}</span>
                    </div>
                    <span className="font-semibold text-indigo-600">
                      ~10m prep time
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <Link
                    to={`/shops/${shop.id}/book`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 group-hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-sm"
                  >
                    <span>Configure & Book Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

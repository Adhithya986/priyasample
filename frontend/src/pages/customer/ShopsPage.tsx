import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Shop } from '../../types';
import {
  Printer,
  Search,
  MapPin,
  Clock,
  Phone,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

export const ShopsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || '');

  const areas = ['All Areas', 'University Campus', 'Business Bay', 'Central Metro'];

  const fetchShops = async () => {
    setLoading(true);
    try {
      const data = await api.listShops({
        search: searchTerm || undefined,
        area: selectedArea && selectedArea !== 'All Areas' ? selectedArea : undefined,
      });
      setShops(data.shops);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [selectedArea]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShops();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Discover Printing Shops
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a participating shop to configure your documents and choose a pickup time.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by shop name, printing services, or keyword..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl shadow-sm transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Area Chips */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-slate-400 shrink-0 mr-1 flex items-center">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
            Filter Area:
          </span>
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area === 'All Areas' ? '' : area)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                (selectedArea === '' && area === 'All Areas') || selectedArea === area
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Shop Results List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
          <Printer className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No participating shops found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or clearing the area filter to discover more local shops.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedArea('');
              fetchShops();
            }}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Printer className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Open Now
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{shop.name}</h3>

                <div className="space-y-1.5 mt-3 text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{shop.address} ({shop.area})</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{shop.openingHours}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{shop.phone}</span>
                  </div>
                </div>

                {shop.description && (
                  <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                    {shop.description}
                  </p>
                )}

                {/* Offerings badges */}
                {shop.offerings && shop.offerings.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {shop.offerings.map((off) => (
                      <span
                        key={off.id}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-medium text-slate-600"
                      >
                        {off.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center space-x-2">
                <Link
                  to={`/shops/${shop.id}`}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold text-center transition-colors"
                >
                  View Details
                </Link>
                <Link
                  to={`/shops/${shop.id}/book`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-sm shadow-indigo-500/20"
                >
                  <span>Book Now</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

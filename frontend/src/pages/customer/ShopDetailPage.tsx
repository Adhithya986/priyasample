import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Shop } from '../../types';
import {
  Printer,
  MapPin,
  Clock,
  Phone,
  Mail,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export const ShopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      if (!id) return;
      try {
        const data = await api.getShop(id);
        setShop(data.shop);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-96 rounded-3xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-slate-800">Shop not found</h2>
        <Link to="/shops" className="text-indigo-600 text-sm mt-2 inline-block font-semibold">
          Back to all shops
        </Link>
      </div>
    );
  }

  // Parse sample offering pricing config
  const mainOffering = shop.offerings?.[0];
  let parsedConfig: any = {};
  try {
    parsedConfig = JSON.parse(mainOffering?.pricingConfig || '{}');
  } catch {}

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        <Link to="/shops" className="hover:text-indigo-600">Shops</Link>
        <span>/</span>
        <span className="text-slate-700 font-semibold">{shop.name}</span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
              <Printer className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Approved Shop
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {shop.area}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {shop.name}
              </h1>
              <p className="text-xs text-slate-500 mt-2 max-w-xl leading-relaxed">
                {shop.description}
              </p>
            </div>
          </div>

          <Link
            to={`/shops/${shop.id}/book`}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] shrink-0"
          >
            <span>Start Printing Order</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Contact & Hours Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50">
            <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Address</span>
              <span className="font-semibold text-slate-800">{shop.address}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50">
            <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Hours</span>
              <span className="font-semibold text-slate-800">{shop.openingHours}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50">
            <Phone className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Direct Phone</span>
              <span className="font-semibold text-slate-800">{shop.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services & Configured Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Standard Printing Rates</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">A4 Monochrome</span>
                <span className="text-base font-extrabold text-slate-900 mt-1 block">
                  ₹{parsedConfig.pagePrices?.A4 ?? 2.0} / page
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">A3 Monochrome</span>
                <span className="text-base font-extrabold text-slate-900 mt-1 block">
                  ₹{parsedConfig.pagePrices?.A3 ?? 5.0} / page
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Colour Surcharge</span>
                <span className="text-base font-extrabold text-indigo-600 mt-1 block">
                  +₹{parsedConfig.colorSurchargePerPage ?? 5.0} / page
                </span>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">
              Optional Add-on Services
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-700">Spiral Binding</span>
                <span className="font-bold text-slate-900">₹{parsedConfig.addons?.binding ?? 35}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-700">Lamination</span>
                <span className="font-bold text-slate-900">₹{parsedConfig.addons?.lamination ?? 20}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-700">Photocopy</span>
                <span className="font-bold text-slate-900">₹{parsedConfig.addons?.photocopy ?? 2}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="font-semibold text-slate-700">Document Scanning</span>
                <span className="font-bold text-slate-900">₹{parsedConfig.addons?.scanning ?? 5}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pickup Slots Overview Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Smart Pickup Slots</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Slots are capped at {shop.slotCapacity} customers per {shop.slotDurationMinutes} minutes to ensure zero waiting time upon arrival.
            </p>

            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 font-medium space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Zero-Queue Guarantee</span>
              </div>
              <p className="text-[11px] text-indigo-800">
                Your order is prepared before your slot begins. Simply present your QR code at the counter.
              </p>
            </div>

            <Link
              to={`/shops/${shop.id}/book`}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs text-center block transition-colors shadow-sm"
            >
              Select Time & Book Order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

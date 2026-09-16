import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Booking, BookingStatus } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { VerifyPickupModal } from '../../components/VerifyPickupModal';
import {
  Store,
  Clock,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Play,
  QrCode,
  AlertCircle,
  RefreshCw,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const ShopDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<any | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      // Find shop owned by current user or fetch first shop
      const meData = await api.getMe();
      const ownedShop = meData.user.ownedShops?.[0];

      let currentShopId = ownedShop?.id;
      if (!currentShopId) {
        // Fallback for demo: list all shops and use first
        const shopsData = await api.listShops();
        if (shopsData.shops.length > 0) {
          currentShopId = shopsData.shops[0].id;
        }
      }

      if (currentShopId) {
        const [shopRes, bookingsRes, statsRes] = await Promise.all([
          api.getShop(currentShopId),
          api.listBookings({ shopId: currentShopId }),
          api.getShopStats(currentShopId),
        ]);
        setShop(shopRes.shop);
        setBookings(bookingsRes.bookings || []);
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 6000); // Live poll
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (bookingId: string, action: 'accept' | 'start' | 'ready' | 'reject') => {
    setActionLoading(bookingId);
    try {
      if (action === 'accept') await api.acceptBooking(bookingId);
      if (action === 'start') await api.startPreparingBooking(bookingId);
      if (action === 'ready') await api.markBookingReady(bookingId);
      if (action === 'reject') {
        const reason = prompt('Reason for declining this booking:');
        if (reason === null) {
          setActionLoading(null);
          return;
        }
        await api.rejectBooking(bookingId, reason || 'Shop capacity full');
      }
      await loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const downloadCustomerDocument = (docId: string) => {
    window.open(api.getDocumentDownloadUrl(docId), '_blank');
  };

  // Group into Kanban columns
  const newOrders = bookings.filter((b) => b.status === 'BOOKED');
  const preparingOrders = bookings.filter((b) => ['ACCEPTED', 'PREPARING'].includes(b.status));
  const readyOrders = bookings.filter((b) => b.status === 'READY');
  const collectedOrders = bookings.filter((b) => b.status === 'COLLECTED');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-xs text-slate-500 mt-2">Loading shop operational dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Preparation Counter
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            {shop?.name || 'Shop Dashboard'}
          </h1>
          <p className="text-xs text-slate-500">
            {shop?.address} • Operating hours: {shop?.openingHours}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setVerifyModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]"
          >
            <QrCode className="w-4 h-4" />
            <span>Verify Customer Pickup</span>
          </button>
          <button
            onClick={loadDashboardData}
            className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Operational Questions / Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            1. New Bookings
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {newOrders.length}
          </span>
          <span className="text-[11px] text-slate-500">Awaiting acceptance</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            2. In Preparation
          </span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">
            {preparingOrders.length}
          </span>
          <span className="text-[11px] text-slate-500">Printing & binding</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            3. Ready for Pickup
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {readyOrders.length}
          </span>
          <span className="text-[11px] text-slate-500">Awaiting QR scan</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            4. Picked Up Today
          </span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">
            {collectedOrders.length}
          </span>
          <span className="text-[11px] text-slate-500">Collected orders</span>
        </div>
      </div>

      {/* Simple Workflow Board: NEW -> PREPARING -> READY -> COLLECTED */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Today's Workflow Lanes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {/* Lane 1: NEW */}
          <div className="bg-slate-100/70 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                New ({newOrders.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>

            {newOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                No new bookings
              </div>
            ) : (
              newOrders.map((booking) => renderBookingCard(booking))
            )}
          </div>

          {/* Lane 2: PREPARING */}
          <div className="bg-purple-50/50 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                Preparing ({preparingOrders.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            </div>

            {preparingOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-purple-400 bg-white/50 rounded-2xl border border-dashed border-purple-200">
                No orders preparing
              </div>
            ) : (
              preparingOrders.map((booking) => renderBookingCard(booking))
            )}
          </div>

          {/* Lane 3: READY */}
          <div className="bg-emerald-50/50 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Ready ({readyOrders.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            {readyOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-400 bg-white/50 rounded-2xl border border-dashed border-emerald-200">
                No orders ready
              </div>
            ) : (
              readyOrders.map((booking) => renderBookingCard(booking))
            )}
          </div>

          {/* Lane 4: COLLECTED */}
          <div className="bg-slate-100/50 rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Collected ({collectedOrders.length})
              </span>
              <span className="w-2 h-2 rounded-full bg-slate-400" />
            </div>

            {collectedOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                No orders collected
              </div>
            ) : (
              collectedOrders.slice(0, 5).map((booking) => renderBookingCard(booking))
            )}
          </div>
        </div>
      </div>

      {/* Pickup Verification Modal */}
      {shop && (
        <VerifyPickupModal
          isOpen={verifyModalOpen}
          shopId={shop.id}
          onClose={() => setVerifyModalOpen(false)}
          onSuccess={() => {
            loadDashboardData();
          }}
        />
      )}
    </div>
  );

  function renderBookingCard(booking: Booking) {
    const isBusy = actionLoading === booking.id;
    const item = booking.items?.[0];
    let config: any = {};
    try {
      config = JSON.parse(item?.configuration || '{}');
    } catch {}

    const doc = booking.documents?.[0];

    return (
      <div
        key={booking.id}
        className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black text-slate-900">
            #{booking.bookingNumber}
          </span>
          <StatusBadge status={booking.status} />
        </div>

        {/* Customer display */}
        <div className="text-xs font-bold text-slate-800">
          Customer: {booking.customer?.name || 'Customer'}
        </div>

        {/* Pickup Target Slot */}
        {booking.pickupTime && (
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50/70 px-2.5 py-1 rounded-lg">
            <Clock className="w-3 h-3" />
            <span>
              Pickup: {new Date(booking.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Document & Specs Summary per Requirement 22 */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
          <div className="font-bold text-slate-900">
            {config.paperSize || 'A4'} • {config.colorMode === 'BW' ? 'B&W' : 'Colour'} • {config.sides || 'Single-sided'}
          </div>
          <div>Copies: <span className="font-bold text-slate-800">{config.copies || 1}</span> ({config.pages || 1} pages)</div>
          {config.optionalServices && config.optionalServices.length > 0 && (
            <div className="text-indigo-600 font-medium uppercase text-[10px]">
              + {config.optionalServices.join(', ')}
            </div>
          )}
          {booking.notes && (
            <div className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-200/60">
              "{booking.notes}"
            </div>
          )}
        </div>

        {/* Authorized Document Download */}
        {doc && (
          <button
            onClick={() => downloadCustomerDocument(doc.id)}
            className="w-full py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center justify-center space-x-1 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span className="truncate">Download {doc.originalFileName}</span>
          </button>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400">Total:</span>
          <span className="font-bold text-slate-900">₹{booking.totalPrice.toFixed(2)}</span>
        </div>

        {/* Action buttons per stage */}
        <div className="pt-1">
          {booking.status === 'BOOKED' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isBusy}
                onClick={() => handleStatusChange(booking.id, 'reject')}
                className="py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
              >
                Decline
              </button>
              <button
                disabled={isBusy}
                onClick={() => handleStatusChange(booking.id, 'accept')}
                className="py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20"
              >
                {isBusy ? 'Saving...' : 'Accept'}
              </button>
            </div>
          )}

          {booking.status === 'ACCEPTED' && (
            <button
              disabled={isBusy}
              onClick={() => handleStatusChange(booking.id, 'start')}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center space-x-1"
            >
              <Play className="w-3 h-3" />
              <span>Start Preparing</span>
            </button>
          )}

          {booking.status === 'PREPARING' && (
            <button
              disabled={isBusy}
              onClick={() => handleStatusChange(booking.id, 'ready')}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Ready for Pickup</span>
            </button>
          )}

          {booking.status === 'READY' && (
            <button
              onClick={() => setVerifyModalOpen(true)}
              className="w-full py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center justify-center space-x-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Verify Pickup QR</span>
            </button>
          )}

          {booking.status === 'COLLECTED' && (
            <div className="text-[11px] text-emerald-700 font-medium text-center">
              ✓ Collected {booking.collectedAt ? new Date(booking.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          )}
        </div>
      </div>
    );
  }
};

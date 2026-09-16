import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { QRCodeModal } from '../../components/QRCodeModal';
import {
  Printer,
  MapPin,
  Clock,
  Phone,
  QrCode,
  CheckCircle2,
  FileText,
  AlertCircle,
  XCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = async () => {
    if (!id) return;
    try {
      const data = await api.getBooking(id);
      setBooking(data.booking);
      setQrCodeDataUrl(data.qrCodeDataUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to load booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchBooking, 5000); // Live poll status updates
    return () => clearInterval(interval);
  }, [id]);

  const handleCancel = async () => {
    if (!id || !window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      await api.cancelBooking(id);
      await fetchBooking();
    } catch (err: any) {
      alert(err.message || 'Could not cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-xs text-slate-500 mt-2">Loading booking status...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-800">Booking not found</h2>
        <Link to="/my-bookings" className="text-indigo-600 text-xs mt-2 inline-block font-semibold">
          Back to my bookings
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'BOOKED', label: 'Booking Placed' },
    { key: 'ACCEPTED', label: 'Shop Accepted' },
    { key: 'PREPARING', label: 'Preparing Order' },
    { key: 'READY', label: 'Ready for Pickup' },
    { key: 'COLLECTED', label: 'Collected' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'BOOKED': return 0;
      case 'ACCEPTED': return 1;
      case 'PREPARING': return 2;
      case 'READY': return 3;
      case 'COLLECTED': return 4;
      default: return -1;
    }
  };

  const currentStepIdx = getStepIndex(booking.status);

  // Parse item config
  const item = booking.items?.[0];
  let config: any = {};
  try {
    config = JSON.parse(item?.configuration || '{}');
  } catch {}

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/my-bookings"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Bookings</span>
        </Link>
        <StatusBadge status={booking.status} />
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Booking Reference
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              #{booking.bookingNumber}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Placed on {new Date(booking.createdAt).toLocaleString()}
            </p>
          </div>

          {booking.status === 'READY' && (
            <button
              onClick={() => setQrModalOpen(true)}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] shrink-0"
            >
              <QrCode className="w-4 h-4" />
              <span>Show Pickup QR Code</span>
            </button>
          )}

          {booking.status === 'BOOKED' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel Booking
            </button>
          )}
        </div>

        {/* Visual Timeline (Requirement 21: Placed -> Accepted -> Preparing -> Ready -> Collected) */}
        {currentStepIdx >= 0 ? (
          <div className="py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Preparation Progress
            </h3>
            <div className="relative flex items-center justify-between">
              {/* Timeline track */}
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-0" />
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-0 transition-all duration-500"
                style={{
                  width: `${(currentStepIdx / (steps.length - 1)) * 95}%`,
                }}
              />

              {steps.map((s, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={s.key} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110 shadow-md'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] mt-2 text-center font-semibold max-w-[70px] ${
                        isCurrent
                          ? 'text-indigo-600'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Booking was {booking.status.toLowerCase()}.
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
          {/* Shop Information */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Pickup Location
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
              <div className="font-bold text-slate-900">{booking.shop?.name}</div>
              <div className="flex items-start space-x-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{booking.shop?.address} ({booking.shop?.area})</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{booking.shop?.phone}</span>
              </div>
              {booking.pickupTime && (
                <div className="flex items-center space-x-2 text-indigo-600 font-semibold pt-1 border-t border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Slot:{' '}
                    {new Date(booking.pickupTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Configuration & Price */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Printing Specs & Price
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Document:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                  {booking.documents?.[0]?.originalFileName || 'Attached PDF'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specs:</span>
                <span className="font-semibold text-slate-800">
                  {config.paperSize} • {config.colorMode === 'BW' ? 'B&W' : 'Colour'} •{' '}
                  {config.sides} • {config.copies} cop{config.copies > 1 ? 'ies' : 'y'}
                </span>
              </div>
              {config.optionalServices && config.optionalServices.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Add-ons:</span>
                  <span className="font-semibold text-slate-800 uppercase">
                    {config.optionalServices.join(', ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200/60 font-bold text-sm text-slate-900">
                <span>Total (Pay at Pickup):</span>
                <span>₹{booking.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal for Ready Bookings */}
      <QRCodeModal
        booking={booking}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        qrCodeDataUrl={qrCodeDataUrl}
      />
    </div>
  );
};

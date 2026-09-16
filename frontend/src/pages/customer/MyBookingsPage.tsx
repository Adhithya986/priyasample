import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { QRCodeModal } from '../../components/QRCodeModal';
import {
  Printer,
  Clock,
  MapPin,
  QrCode,
  ChevronRight,
  PlusCircle,
  FileText,
  Loader2,
} from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForQR, setSelectedBookingForQR] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const data = await api.listBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track preparation progress, view pickup slots, and access pickup QR codes.
          </p>
        </div>

        <Link
          to="/shops"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Printing Order</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        /* Empty State per Requirement 34/51 */
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Printer className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">You don't have any bookings yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Find a participating printing shop near you, upload your document, and book your first order in advance.
            </p>
          </div>
          <Link
            to="/shops"
            className="inline-flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <span>Browse Printing Shops</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const item = booking.items?.[0];
            let config: any = {};
            try {
              config = JSON.parse(item?.configuration || '{}');
            } catch {}

            return (
              <div
                key={booking.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-black text-slate-900">
                      #{booking.bookingNumber}
                    </span>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="text-sm font-bold text-slate-800">
                    {booking.shop?.name}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{booking.shop?.area}</span>
                    </div>
                    {booking.pickupTime && (
                      <div className="flex items-center space-x-1 text-indigo-600 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Slot: {new Date(booking.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {config.paperSize || 'A4'} • {config.colorMode || 'BW'} • {config.copies || 1} copies
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Amount
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{booking.totalPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {booking.status === 'READY' && (
                      <button
                        onClick={() => setSelectedBookingForQR(booking)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Pickup QR</span>
                      </button>
                    )}

                    <Link
                      to={`/bookings/${booking.id}`}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center space-x-1"
                    >
                      <span>Track</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal if opened from list */}
      {selectedBookingForQR && (
        <QRCodeModal
          booking={selectedBookingForQR}
          isOpen={true}
          onClose={() => setSelectedBookingForQR(null)}
        />
      )}
    </div>
  );
};

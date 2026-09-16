import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { Booking } from '../types';

interface QRCodeModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  qrCodeDataUrl?: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  booking,
  isOpen,
  onClose,
  qrCodeDataUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Ready for Pickup</span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-1">
          {booking.bookingNumber}
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Show this QR code at the shop counter to collect your prints.
        </p>

        {/* QR Code Container */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 inline-block shadow-inner mb-4">
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt="Pickup QR Code"
              className="w-52 h-52 mx-auto rounded-lg object-contain"
            />
          ) : booking.pickupToken ? (
            <QRCodeSVG
              value={booking.pickupToken}
              size={208}
              level="H"
              includeMargin={false}
              fgColor="#1e1b4b"
            />
          ) : (
            <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
              Pickup token generating...
            </div>
          )}
        </div>

        {/* Pickup Token String */}
        {booking.pickupToken && (
          <div className="bg-slate-100 py-1.5 px-3 rounded-xl mb-4 font-mono text-xs font-semibold text-slate-700 select-all tracking-wider">
            TOKEN: {booking.pickupToken}
          </div>
        )}

        {/* Shop Info */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left space-y-1.5 text-xs text-slate-600 mb-4">
          <div className="flex items-center space-x-2 font-semibold text-slate-900">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{booking.shop?.name}</span>
          </div>
          <p className="text-[11px] text-slate-500 pl-6">{booking.shop?.address}</p>
          {booking.pickupTime && (
            <div className="flex items-center space-x-2 text-[11px] text-slate-600 pl-6 pt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Slot: {new Date(booking.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero-PII Secure Token. Verified authoritatively by shop.</span>
        </div>
      </div>
    </div>
  );
};

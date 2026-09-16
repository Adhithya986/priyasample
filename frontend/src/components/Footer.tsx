import React from 'react';
import { Printer, Shield, Clock, QrCode } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-100 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Printer className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900">Local Pickup</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
              “Book before you go. Pick up when you arrive.” Move order preparation before arrival for local printing shops and businesses.
            </p>
            <div className="flex items-center space-x-4 text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Private & Expiring Storage</span>
              </span>
              <span className="flex items-center space-x-1">
                <QrCode className="w-3.5 h-3.5 text-indigo-500" />
                <span>Zero-PII QR Verification</span>
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>Printing Shops</li>
              <li>Stationery & Supplies</li>
              <li>Smart Pickup Scheduling</li>
              <li>Pay at Pickup</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Security
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li>Role-Based Authorization</li>
              <li>Document Expiration</li>
              <li>Atomic Race-Condition Protection</li>
              <li>Authoritative QR Verification</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Local Pickup. Production MVP.</p>
          <p className="mt-2 sm:mt-0">Pre-arrival preparation + smart scheduling + pickup platform.</p>
        </div>
      </div>
    </footer>
  );
};

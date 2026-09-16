import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { api, ApiError } from '../services/api';

interface VerifyPickupModalProps {
  isOpen: boolean;
  shopId: string;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export const VerifyPickupModal: React.FC<VerifyPickupModalProps> = ({
  isOpen,
  shopId,
  onClose,
  onSuccess,
}) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessData(null);

    try {
      const response = await api.verifyPickup(token.trim(), shopId);
      setSuccessData(response.data || response);
      onSuccess(response.data || response);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setToken('');
    setError(null);
    setSuccessData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Verify Customer Pickup</h3>
            <p className="text-xs text-slate-500">Scan QR token or type token manually</p>
          </div>
        </div>

        {successData ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center my-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-base font-bold text-emerald-950 mb-1">
              Order Verified & Collected!
            </h4>
            <p className="text-xs text-emerald-700 mb-3">
              Booking <span className="font-bold">#{successData.bookingNumber}</span> for{' '}
              <span className="font-bold">{successData.customerName}</span> has been marked collected.
            </p>
            <div className="bg-white/80 py-2 px-3 rounded-xl inline-block text-xs font-semibold text-emerald-900 mb-4">
              Total Amount: ₹{successData.totalPrice?.toFixed(2)} (Pay at Pickup)
            </div>
            <div>
              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
              >
                Verify Another Order
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 my-2">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="leading-relaxed font-medium">{error}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Pickup Token (e.g. PK-...)
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter or scan token code"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-mono text-sm uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:font-sans"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Backend validates token authenticity, correct shop match, and prevents duplicate pickup claims.
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center space-x-2 shadow-sm shadow-indigo-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify Pickup</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

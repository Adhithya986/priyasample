import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, ApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Shop, PickupSlot, PrintDocument } from '../../types';
import {
  Upload,
  FileText,
  CheckCircle2,
  Trash2,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Printer,
  ChevronRight,
} from 'lucide-react';

export const BookingWizardPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [shop, setShop] = useState<Shop | null>(null);
  const [slots, setSlots] = useState<PickupSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState<PrintDocument | null>(null);

  const [paperSize, setPaperSize] = useState<'A4' | 'A3'>('A4');
  const [colorMode, setColorMode] = useState<'BW' | 'COLOUR'>('BW');
  const [sides, setSides] = useState<'SINGLE' | 'DOUBLE'>('SINGLE');
  const [copies, setCopies] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [optionalServices, setOptionalServices] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Load shop and slots
  useEffect(() => {
    const loadShopData = async () => {
      if (!shopId) return;
      try {
        const [shopRes, slotsRes] = await Promise.all([
          api.getShop(shopId),
          api.getPickupSlots(shopId),
        ]);
        setShop(shopRes.shop);
        setSlots(slotsRes.slots || []);
        if (slotsRes.slots && slotsRes.slots.length > 0) {
          const available = slotsRes.slots.find((s: any) => s.isAvailable);
          if (available) setSelectedSlotId(available.id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load shop details.');
      } finally {
        setLoading(false);
      }
    };
    loadShopData();
  }, [shopId]);

  // Live price calculation based on shop configuration
  const calculateEstimate = () => {
    if (!shop?.offerings?.[0]) return { subtotal: 0, total: 0 };
    let parsedConfig: any = {};
    try {
      parsedConfig = JSON.parse(shop.offerings[0].pricingConfig || '{}');
    } catch {}

    const basePrice = Number(parsedConfig.basePrice || 0);
    const paperPrices = parsedConfig.pagePrices || { A4: 2.0, A3: 5.0 };
    const pageRate = paperPrices[paperSize] ?? (paperSize === 'A3' ? 5.0 : 2.0);
    const pagesCost = pageRate * pages * copies;

    const colorSurcharge = Number(parsedConfig.colorSurchargePerPage ?? 5.0);
    const colorCost = colorMode === 'COLOUR' ? colorSurcharge * pages * copies : 0;

    const sidesSurcharge = Number(parsedConfig.doubleSidedDiscountOrSurcharge || 0);
    const sidesCost = sides === 'DOUBLE' ? sidesSurcharge * Math.ceil(pages / 2) * copies : 0;

    const configuredAddons = parsedConfig.addons || {
      binding: 35.0,
      lamination: 20.0,
      photocopy: 2.0,
      scanning: 5.0,
    };

    let addonsCost = 0;
    optionalServices.forEach((addon) => {
      const price = configuredAddons[addon] || 0;
      addonsCost += price * copies;
    });

    const subtotal = Number((basePrice + pagesCost + colorCost + sidesCost + addonsCost).toFixed(2));
    return {
      subtotal,
      total: subtotal,
      breakdown: {
        pageRate,
        pagesCost,
        colorCost,
        sidesCost,
        addonsCost,
      },
    };
  };

  const estimate = calculateEstimate();

  // Document Upload Handler
  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Only authentic PDF documents (.pdf) are supported.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB limit.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploading(true);

    try {
      const res = await api.uploadDocument(file);
      setUploadedDoc(res.document);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document to secure storage.');
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const toggleAddon = (addon: string) => {
    setOptionalServices((prev) =>
      prev.includes(addon) ? prev.filter((a) => a !== addon) : [...prev, addon]
    );
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await api.createBooking({
        shopId: shop!.id,
        slotId: selectedSlotId || undefined,
        offeringId: shop?.offerings?.[0]?.id,
        documentId: uploadedDoc?.id,
        options: {
          paperSize,
          colorMode,
          sides,
          copies,
          pages,
          optionalServices,
        },
        notes,
      });

      setConfirmedBooking(response.booking);
      setStep(5); // Success step
    } catch (err: any) {
      setError(err.message || 'Failed to place booking. Please choose another slot.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-xs text-slate-500 mt-2">Loading shop configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Step Tracker */}
      <div className="mb-8 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          Booking at {shop?.name}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          {step === 1 && 'Step 1: Upload Document'}
          {step === 2 && 'Step 2: Print Configuration'}
          {step === 3 && 'Step 3: Choose Pickup Time'}
          {step === 4 && 'Step 4: Review & Confirm'}
          {step === 5 && 'Booking Confirmed!'}
        </h1>

        {/* Step Progress Bar */}
        {step < 5 && (
          <div className="flex items-center justify-center space-x-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s
                    ? 'w-12 bg-indigo-600'
                    : step > s
                    ? 'w-6 bg-emerald-500'
                    : 'w-6 bg-slate-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="leading-relaxed font-medium">{error}</div>
        </div>
      )}

      {/* STEP 1: Upload Document */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-base font-bold text-slate-900">Upload PDF Document</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your document is stored in an encrypted private vault and purged 24 hours after collection.
            </p>
          </div>

          {!uploadedDoc ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl p-10 text-center transition-colors bg-slate-50/50 cursor-pointer"
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm font-bold text-slate-800">
                {uploading ? 'Uploading to secure vault...' : 'Click or drag & drop your PDF here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Standard PDF only • Maximum file size 25MB
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950 truncate max-w-xs">
                    {uploadedDoc.originalFileName}
                  </p>
                  <p className="text-xs text-emerald-700">
                    {(uploadedDoc.fileSize / (1024 * 1024)).toFixed(2)} MB • Securely Uploaded
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadedDoc(null);
                  setSelectedFile(null);
                }}
                className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                title="Remove and re-upload"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="pt-4 flex justify-between items-center border-t border-slate-100">
            <Link
              to={`/shops/${shopId}`}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to shop</span>
            </Link>
            <button
              type="button"
              disabled={!uploadedDoc || uploading}
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 disabled:pointer-events-none flex items-center space-x-1.5 shadow-sm shadow-indigo-500/20"
            >
              <span>Continue to Options</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Printing Configuration & Live Pricing */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-900">Printing Configuration</h2>

            {/* Paper Size */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Paper Size
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['A4', 'A3'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPaperSize(size)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      paperSize === size
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm">{size} Paper</div>
                    <div className="text-[11px] text-slate-500">
                      {size === 'A4' ? 'Standard 210 x 297 mm' : 'Large 297 x 420 mm'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Mode */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Color Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setColorMode('BW')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    colorMode === 'BW'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm">Black & White</div>
                  <div className="text-[11px] text-slate-500">Fast laser monochrome</div>
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('COLOUR')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    colorMode === 'COLOUR'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm">Full Colour</div>
                  <div className="text-[11px] text-slate-500">Vibrant high-res color</div>
                </button>
              </div>
            </div>

            {/* Print Sides */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Sides
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSides('SINGLE')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    sides === 'SINGLE'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm">Single-sided</div>
                  <div className="text-[11px] text-slate-500">1 side per sheet</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSides('DOUBLE')}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    sides === 'DOUBLE'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm">Double-sided</div>
                  <div className="text-[11px] text-slate-500">Front & back</div>
                </button>
              </div>
            </div>

            {/* Pages & Copies Steppers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Pages in Document
                </label>
                <input
                  type="number"
                  min={1}
                  value={pages}
                  onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Number of Copies
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-10 h-10 rounded-xl border border-slate-200 font-bold hover:bg-slate-50"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold text-base text-slate-900">{copies}</span>
                  <button
                    type="button"
                    onClick={() => setCopies(copies + 1)}
                    className="w-10 h-10 rounded-xl border border-slate-200 font-bold hover:bg-slate-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Services */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Optional Finishing Services
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'binding', label: 'Spiral Binding' },
                  { key: 'lamination', label: 'Thermal Lamination' },
                  { key: 'photocopy', label: 'Extra Photocopy' },
                  { key: 'scanning', label: 'Digital Scan Copy' },
                ].map((addon) => (
                  <button
                    key={addon.key}
                    type="button"
                    onClick={() => toggleAddon(addon.key)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      optionalServices.includes(addon.key)
                        ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{addon.label}</span>
                    {optionalServices.includes(addon.key) && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm shadow-indigo-500/20"
              >
                <span>Select Pickup Time</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Live Price Estimation Card */}
          <div>
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl sticky top-24 space-y-4">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Live Price Breakdown</span>
              </div>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Paper ({paperSize}, {pages}p × {copies}c)</span>
                  <span className="font-semibold text-white">₹{estimate.breakdown?.pagesCost.toFixed(2)}</span>
                </div>
                {colorMode === 'COLOUR' && (
                  <div className="flex justify-between text-indigo-300">
                    <span>Colour surcharge</span>
                    <span className="font-semibold text-white">+₹{estimate.breakdown?.colorCost.toFixed(2)}</span>
                  </div>
                )}
                {optionalServices.length > 0 && (
                  <div className="flex justify-between">
                    <span>Finishing Add-ons</span>
                    <span className="font-semibold text-white">+₹{estimate.breakdown?.addonsCost.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-baseline justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Price</span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Pay at Pickup</span>
                </div>
                <span className="text-2xl font-extrabold text-white">
                  ₹{estimate.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Pickup Slot Selection */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="text-center max-w-md mx-auto">
            <h2 className="text-base font-bold text-slate-900">Select Available Pickup Slot</h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose your expected pickup time. Slots are atomic and prevent shop congestion.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const isFull = slot.reservedCount >= slot.capacity;
              const isSelected = selectedSlotId === slot.id;

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={isFull}
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    isFull
                      ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400'
                      : isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/20 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold">{slot.startTime}</div>
                  <div className="text-[10px] mt-1 text-slate-400">
                    {isFull ? 'Full' : `${slot.capacity - slot.reservedCount} spots left`}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={!selectedSlotId}
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 disabled:pointer-events-none flex items-center space-x-1.5 shadow-sm shadow-indigo-500/20"
            >
              <span>Review Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Confirm Booking */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900">Review Booking Details</h2>

          <div className="space-y-3 divide-y divide-slate-100 text-xs">
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Shop</span>
              <span className="font-bold text-slate-900">{shop?.name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Pickup Address</span>
              <span className="font-semibold text-slate-700">{shop?.address}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Document</span>
              <span className="font-semibold text-indigo-600">{uploadedDoc?.originalFileName}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Print Configuration</span>
              <span className="font-semibold text-slate-800">
                {paperSize} • {colorMode === 'BW' ? 'Black & White' : 'Full Colour'} •{' '}
                {sides === 'SINGLE' ? 'Single-sided' : 'Double-sided'} • {copies} cop{copies > 1 ? 'ies' : 'y'}
              </span>
            </div>
            {optionalServices.length > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Optional Add-ons</span>
                <span className="font-semibold text-slate-800 uppercase">
                  {optionalServices.join(', ')}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Target Pickup Slot</span>
              <span className="font-bold text-indigo-600">
                {slots.find((s) => s.id === selectedSlotId)?.startTime || 'Selected time'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Special Instructions (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please staple on the top-left corner"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          {/* Final Amount & Pay at Pickup info */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-950 block">Payment Method</span>
              <span className="text-xs text-indigo-700">Pay at Pickup counter upon arrival</span>
            </div>
            <span className="text-2xl font-black text-indigo-950">
              ₹{estimate.total.toFixed(2)}
            </span>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmBooking}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reserving Slot & Booking...</span>
                </>
              ) : (
                <span>Confirm Booking</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Booking Success */}
      {step === 5 && confirmedBooking && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6 max-w-md mx-auto animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Booking Placed!
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              {confirmedBooking.bookingNumber}
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              The shop has received your order and will prepare it before your pickup time.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Shop:</span>
              <span className="font-semibold text-slate-800">{shop?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Time:</span>
              <span className="font-semibold text-slate-800">
                {confirmedBooking.pickupTime
                  ? new Date(confirmedBooking.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Scheduled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total:</span>
              <span className="font-bold text-slate-900">₹{confirmedBooking.totalPrice.toFixed(2)} (Pay at counter)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              to={`/bookings/${confirmedBooking.id}`}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-sm shadow-indigo-500/20"
            >
              <span>Track Preparation & View QR</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/my-bookings"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs block hover:bg-slate-50 transition-colors"
            >
              Go to My Bookings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

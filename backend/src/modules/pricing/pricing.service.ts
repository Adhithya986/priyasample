export interface PrintingPricingConfig {
  basePrice?: number;
  pagePrices?: {
    A4?: number;
    A3?: number;
    [key: string]: number | undefined;
  };
  colorSurchargePerPage?: number;
  doubleSidedDiscountOrSurcharge?: number; // per sheet/page if applicable
  addons?: {
    binding?: number;
    lamination?: number;
    photocopy?: number;
    scanning?: number;
    [key: string]: number | undefined;
  };
}

export interface PrintOrderOptions {
  paperSize: 'A4' | 'A3' | string;
  colorMode: 'BW' | 'COLOUR' | string;
  sides: 'SINGLE' | 'DOUBLE' | string;
  copies: number;
  pages: number;
  optionalServices?: string[]; // e.g. ['binding', 'lamination']
}

export interface PriceBreakdown {
  basePrice: number;
  pagesCost: number;
  colorCost: number;
  paperSizeCost: number;
  sidesCost: number;
  addonsCost: number;
  addonDetails: { name: string; price: number }[];
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Calculates itemized printing price strictly based on shop-configured rates.
 */
export const calculatePrintingPrice = (
  rawConfig: string | PrintingPricingConfig | null,
  options: PrintOrderOptions
): PriceBreakdown => {
  let config: PrintingPricingConfig = {};
  if (typeof rawConfig === 'string') {
    try {
      config = JSON.parse(rawConfig || '{}');
    } catch {
      config = {};
    }
  } else if (rawConfig) {
    config = rawConfig;
  }

  const copies = Math.max(1, Math.floor(options.copies || 1));
  const pages = Math.max(1, Math.floor(options.pages || 1));
  const basePrice = Number(config.basePrice || 0);

  // Paper base rate
  const paperPrices = config.pagePrices || { A4: 2.0, A3: 5.0 };
  const pageRate = paperPrices[options.paperSize] ?? (options.paperSize === 'A3' ? 5.0 : 2.0);
  const pagesCost = pageRate * pages * copies;

  // Colour surcharge
  const isColour = options.colorMode.toUpperCase() === 'COLOUR';
  const colorSurcharge = Number(config.colorSurchargePerPage ?? 5.0);
  const colorCost = isColour ? colorSurcharge * pages * copies : 0;

  // Paper size surcharge (if additional beyond base page rate)
  const paperSizeCost = 0; // already accounted for in pageRate

  // Sides surcharge / adjustment (e.g. double-sided may have different charge)
  const isDouble = options.sides.toUpperCase() === 'DOUBLE';
  const sidesSurcharge = Number(config.doubleSidedDiscountOrSurcharge || 0);
  const sidesCost = isDouble ? sidesSurcharge * Math.ceil(pages / 2) * copies : 0;

  // Addon services
  const configuredAddons = config.addons || {
    binding: 35.0,
    lamination: 20.0,
    photocopy: 2.0,
    scanning: 5.0,
  };

  const addonDetails: { name: string; price: number }[] = [];
  let addonsCost = 0;

  if (options.optionalServices && Array.isArray(options.optionalServices)) {
    for (const addonKey of options.optionalServices) {
      const normalizedKey = addonKey.toLowerCase();
      const addonPrice = configuredAddons[normalizedKey] ?? 0;
      if (addonPrice > 0) {
        // Binding / lamination is charged per copy
        const priceForCopies = addonPrice * copies;
        addonsCost += priceForCopies;
        addonDetails.push({
          name: normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1),
          price: priceForCopies,
        });
      }
    }
  }

  const subtotal = Number((basePrice + pagesCost + colorCost + sidesCost + addonsCost).toFixed(2));
  const tax = 0; // In local printing MVP, prices are net/inclusive
  const total = Number((subtotal + tax).toFixed(2));

  return {
    basePrice,
    pagesCost,
    colorCost,
    paperSizeCost,
    sidesCost,
    addonsCost,
    addonDetails,
    subtotal,
    tax,
    total,
  };
};

export type RelocationCityId = 'bengaluru' | 'hyderabad' | 'pune' | 'mumbai' | 'delhi-ncr' | 'chennai';

export type RelocationCity = {
  id: RelocationCityId;
  name: string;
  monthlyLivingCost: number;
  oneTimeMoveCost: number;
  friction: 'lower' | 'medium' | 'higher';
};

export const relocationCities: RelocationCity[] = [
  { id: 'bengaluru', name: 'Bengaluru', monthlyLivingCost: 55_000, oneTimeMoveCost: 100_000, friction: 'medium' },
  { id: 'hyderabad', name: 'Hyderabad', monthlyLivingCost: 43_000, oneTimeMoveCost: 90_000, friction: 'lower' },
  { id: 'pune', name: 'Pune', monthlyLivingCost: 48_000, oneTimeMoveCost: 90_000, friction: 'medium' },
  { id: 'mumbai', name: 'Mumbai', monthlyLivingCost: 78_000, oneTimeMoveCost: 125_000, friction: 'higher' },
  { id: 'delhi-ncr', name: 'Delhi NCR', monthlyLivingCost: 52_000, oneTimeMoveCost: 100_000, friction: 'medium' },
  { id: 'chennai', name: 'Chennai', monthlyLivingCost: 42_000, oneTimeMoveCost: 85_000, friction: 'lower' },
];

export type RelocationComparison = {
  city: RelocationCity;
  currentCity: RelocationCity | undefined;
  monthlyDifference: number | null;
  estimatedMonthlyRoom: number | null;
  firstYearMoveAdjustedRoom: number | null;
  known: string;
  meaning: string;
  unknowns: string[];
  nextAction: string;
};

function cityMatches(value: string, city: RelocationCity): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === city.name.toLowerCase() || normalized === city.id;
}

export function findRelocationCity(value: string): RelocationCity | undefined {
  return relocationCities.find((city) => cityMatches(value, city));
}

export function parseAnnualCtc(value: string): number | null {
  const normalized = value.trim().toLowerCase().replaceAll(',', '').replace('₹', '');
  if (!normalized || normalized.includes('prefer')) return null;
  const lakhMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:l|lpa|lakhs?)/);
  if (lakhMatch?.[1]) return Number(lakhMatch[1]) * 100_000;
  const number = Number(normalized.replace(/[^\d.]/g, ''));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatRupees(value: number): string {
  const absolute = Math.round(Math.abs(value));
  if (absolute >= 100_000) return `₹${(absolute / 100_000).toFixed(1).replace('.0', '')}L`;
  return `₹${Math.round(absolute / 1_000)}k`;
}

export function compareRelocation(
  currentCityName: string,
  ctc: string,
  targetCityId: RelocationCityId,
): RelocationComparison {
  const city = relocationCities.find((item) => item.id === targetCityId) ?? relocationCities[0];
  const currentCity = findRelocationCity(currentCityName);
  const annualCtc = parseAnnualCtc(ctc);
  const monthlyDifference = currentCity ? city.monthlyLivingCost - currentCity.monthlyLivingCost : null;
  const estimatedMonthlyRoom = annualCtc ? (annualCtc / 12) * 0.72 - city.monthlyLivingCost : null;
  const firstYearMoveAdjustedRoom = estimatedMonthlyRoom === null
    ? null
    : estimatedMonthlyRoom * 12 - city.oneTimeMoveCost;
  const differenceText = monthlyDifference === null
    ? `The planning midpoint for ${city.name} is ${formatRupees(city.monthlyLivingCost)} per month.`
    : monthlyDifference === 0
      ? `${city.name} is in the same planning cost band as ${currentCity?.name ?? 'your current city'}.`
      : monthlyDifference < 0
        ? `${city.name} is modelled at ${formatRupees(Math.abs(monthlyDifference))} less per month than ${currentCity?.name ?? 'your current city'}.`
        : `${city.name} is modelled at ${formatRupees(monthlyDifference)} more per month than ${currentCity?.name ?? 'your current city'}.`;

  return {
    city,
    currentCity,
    monthlyDifference,
    estimatedMonthlyRoom,
    firstYearMoveAdjustedRoom,
    known: `${differenceText} A one-time move buffer of about ${formatRupees(city.oneTimeMoveCost)} is included.`,
    meaning: estimatedMonthlyRoom === null
      ? 'Your CTC is not available, so this is a cost comparison—not an affordability verdict.'
      : estimatedMonthlyRoom >= 0
        ? `Using a clearly labelled 72% take-home assumption, the move leaves roughly ${formatRupees(estimatedMonthlyRoom)} per month before personal obligations.`
        : `Using a clearly labelled 72% take-home assumption, the move may leave a monthly shortfall of about ${formatRupees(estimatedMonthlyRoom)} before personal obligations.`,
    unknowns: [
      'Actual rent, family obligations, taxes, commute, and offer quality are not included.',
      'The city figures are directional planning midpoints, not a live cost-of-living feed.',
      'Remote or hybrid work, visa needs, and support networks can change the decision materially.',
    ],
    nextAction: `Get three real rent quotes and one commute estimate in ${city.name} before treating this as a move decision.`,
  };
}

export function formatRelocationAmount(value: number | null): string {
  if (value === null) return 'Unknown';
  return value < 0 ? `−${formatRupees(value)}` : formatRupees(value);
}

export function formatPlanningRupees(value: number): string {
  return formatRupees(value);
}
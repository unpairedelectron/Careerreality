import { compareRelocation, findRelocationCity, parseAnnualCtc, type RelocationCityId } from './relocation';

export type WhatIfScenarioId = 'stay' | 'switch' | 'relocate';

export type WhatIfScenario = {
  id: WhatIfScenarioId;
  label: string;
  description: string;
};

export const whatIfScenarios: WhatIfScenario[] = [
  { id: 'stay', label: 'Stay and build leverage', description: 'Keep the current compensation and location while you build evidence.' },
  { id: 'switch', label: 'Switch without moving', description: 'Test a new offer in your current city.' },
  { id: 'relocate', label: 'Switch and relocate', description: 'Test a new offer alongside a selected city cost change.' },
];

export type WhatIfResult = {
  currentAnnualCtc: number | null;
  scenarioAnnualCtc: number | null;
  monthlyRoomChange: number | null;
  firstYearChange: number | null;
  breakEvenMonths: number | null;
  known: string;
  meaning: string;
  unknowns: string[];
};

export function calculateWhatIf({
  currentCtc,
  scenarioCtc,
  scenario,
  currentCity,
  targetCityId,
}: {
  currentCtc: string;
  scenarioCtc: string;
  scenario: WhatIfScenarioId;
  currentCity: string;
  targetCityId: RelocationCityId;
}): WhatIfResult {
  const currentAnnualCtc = parseAnnualCtc(currentCtc);
  const scenarioAnnualCtc = scenario === 'stay' ? currentAnnualCtc : parseAnnualCtc(scenarioCtc);
  const currentCityData = findRelocationCity(currentCity);
  const targetCityData = scenario === 'relocate' ? findRelocationCity(targetCityId) : currentCityData;
  const currentMonthlyRoom = currentAnnualCtc && currentCityData ? (currentAnnualCtc / 12) * 0.72 - currentCityData.monthlyLivingCost : null;
  const scenarioMonthlyRoom = scenarioAnnualCtc && targetCityData ? (scenarioAnnualCtc / 12) * 0.72 - targetCityData.monthlyLivingCost : null;
  const monthlyRoomChange = currentMonthlyRoom !== null && scenarioMonthlyRoom !== null
    ? scenarioMonthlyRoom - currentMonthlyRoom
    : null;
  const moveCost = scenario === 'relocate' && targetCityData ? targetCityData.oneTimeMoveCost : 0;
  const firstYearChange = monthlyRoomChange === null ? null : monthlyRoomChange * 12 - moveCost;
  const breakEvenMonths = monthlyRoomChange && monthlyRoomChange > 0 && moveCost > 0
    ? Math.ceil(moveCost / monthlyRoomChange)
    : null;

  return {
    currentAnnualCtc,
    scenarioAnnualCtc,
    monthlyRoomChange,
    firstYearChange,
    breakEvenMonths,
    known: scenario === 'stay'
      ? 'This is the baseline: no new offer and no relocation cost.'
      : scenario === 'switch'
        ? 'The comparison uses your hypothetical annual CTC and keeps the current city unchanged.'
        : `The comparison uses your hypothetical annual CTC and the ${targetCityData?.name ?? 'target city'} planning midpoint.`,
    meaning: monthlyRoomChange === null
      ? 'We need both a usable current CTC and scenario CTC plus a recognized city to estimate the change in monthly room.'
      : monthlyRoomChange >= 0
        ? `This scenario creates about ₹${Math.round(monthlyRoomChange / 1_000)}k more monthly room before personal obligations.`
        : `This scenario creates about ₹${Math.round(Math.abs(monthlyRoomChange) / 1_000)}k less monthly room before personal obligations.`,
    unknowns: [
      'The 72% take-home factor is a planning assumption, not a tax calculation.',
      'Taxes, equity, variable pay, family obligations, commute, and offer risk are not modeled.',
      scenario === 'relocate' ? 'The move buffer is directional and does not include a deposit or income gap.' : 'The scenario does not model a probation period or job-search time.',
    ],
  };
}
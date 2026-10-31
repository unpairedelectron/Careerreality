import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header, PrimaryButton, Screen, SectionHeader } from '@/components/career-ui';
import { useColors } from '@/hooks/useColors';
import { calculateCtc, compareCtcOffers, type CtcInputs } from '../../career-reality/src/lib/ctc-calculator';
import { estimateOldRegimeTax } from '../../../lib/career-tools/src/index';

type Mode = 'offers' | 'tax';
type FormValues = Record<string, string>;
type MoneyField = { key: string; label: string; optional?: boolean };

const offerFields: MoneyField[] = [
  { key: 'ctc', label: 'Annual CTC (₹)' },
  { key: 'fixed', label: 'Fixed annual pay (₹)' },
  { key: 'variable', label: 'Annual variable at target (₹)', optional: true },
  { key: 'pfZero', label: 'Employee PF at zero variable (₹/year)', optional: true },
  { key: 'pfTarget', label: 'Employee PF at target (₹/year)', optional: true },
  { key: 'employerPf', label: 'Employer PF included in CTC (₹/year)', optional: true },
  { key: 'professionalTax', label: 'Professional tax (₹/year)', optional: true },
];

function amount(values: FormValues, key: string, required = false): number {
  const raw = values[key]?.trim() ?? '';
  if (!raw && !required) return 0;
  const parsed = Number(raw.replace(/[,\s₹]/g, ''));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error('Enter a valid non-negative amount in every required field.');
  return parsed;
}

function offerInput(values: FormValues, prefix: 'current' | 'offer'): CtcInputs {
  const get = (field: string, required = false) => amount(values, `${prefix}${field}`, required);
  return {
    annualCtc: get('ctc', true),
    annualFixedPay: get('fixed', true),
    annualVariablePay: get('variable'),
    basicPercentOfFixed: 0,
    annualEmployeePfAtZeroVariable: get('pfZero'),
    annualEmployeePfAtTarget: get('pfTarget'),
    annualEmployerPfAtTarget: get('employerPf'),
    employerPfIncluded: true,
    stateOrUt: 'Manual professional tax input',
    annualProfessionalTax: get('professionalTax'),
    annualGratuityInCtc: 0,
    annualOtherEmployerCosts: 0,
  };
}

function inr(value: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export default function OfferTaxToolsScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<Mode>('offers');
  const [values, setValues] = useState<FormValues>({});
  const [error, setError] = useState('');
  const [result, setResult] = useState<string[] | null>(null);

  const calculate = () => {
    setError('');
    setResult(null);
    try {
      if (mode === 'offers') {
        const comparison = compareCtcOffers({
          current: offerInput(values, 'current'),
          offer: offerInput(values, 'offer'),
          joiningBonusClawback: 0,
          noticePeriodCost: 0,
          relocationCost: 0,
          additionalAnnualCommuteCost: 0,
        });
        setResult([
          `Current estimated monthly take-home · zero variable: ${inr(comparison.current.monthlyInHandAtZeroVariable)}`,
          `Offer estimated monthly take-home · zero variable: ${inr(comparison.offer.monthlyInHandAtZeroVariable)}`,
          `Monthly difference · zero variable: ${inr(comparison.offer.monthlyInHandAtZeroVariable - comparison.current.monthlyInHandAtZeroVariable)}`,
          `Current estimated monthly average · full target: ${inr(comparison.current.monthlyInHandAtTargetAverage)}`,
          `Offer estimated monthly average · full target: ${inr(comparison.offer.monthlyInHandAtTargetAverage)}`,
          `Monthly difference · full target: ${inr(comparison.offer.monthlyInHandAtTargetAverage - comparison.current.monthlyInHandAtTargetAverage)}`,
        ]);
      } else {
        const gross = amount(values, 'grossSalary', true);
        const deductions = amount(values, 'oldRegimeDeductions');
        const newTax = calculateCtc({
          annualCtc: gross, annualFixedPay: gross, annualVariablePay: 0, basicPercentOfFixed: 0,
          annualEmployeePfAtZeroVariable: 0, annualEmployeePfAtTarget: 0, annualEmployerPfAtTarget: 0,
          employerPfIncluded: false, stateOrUt: 'Not specified', annualProfessionalTax: 0,
          annualGratuityInCtc: 0, annualOtherEmployerCosts: 0,
        }).taxAtTarget.tax;
        const oldTax = estimateOldRegimeTax(gross, deductions).tax;
        setResult([
          `New-regime estimated annual tax · AY 2026–27: ${inr(newTax)}`,
          `Old-regime estimated annual tax · AY 2026–27: ${inr(oldTax)}`,
          `Tax difference · old minus new: ${inr(oldTax - newTax)}`,
        ]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Check the figures and try again.');
    }
  };

  const renderField = (field: MoneyField, key: string) => (
    <View key={key} style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{field.label}{field.optional ? ' · optional' : ''}</Text>
      <TextInput
        accessibilityLabel={field.label}
        keyboardType="decimal-pad"
        value={values[key] ?? ''}
        onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))}
        testID={`input-${key}`}
        placeholder="0"
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
      />
    </View>
  );

  return (
    <Screen keyboardAware>
      <Header eyebrow="DECISION TOOLS" title="Compare the money, not just the headline." back />
      <View style={styles.modeRow}>
        {(['offers', 'tax'] as const).map((item) => {
          const selected = mode === item;
          return (
            <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => { setMode(item); setResult(null); setError(''); }}
              style={[styles.modeButton, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}>
              <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontWeight: '700' }}>
                {item === 'offers' ? 'Compare offers' : 'Compare tax'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {mode === 'offers' ? (
        <>
          <Text style={[styles.note, { color: colors.mutedForeground }]}>One shared CTC and tax model. PF and professional tax are manual; blank optional fields mean zero. Employer PF is treated as included in CTC; gratuity and other employer costs are left at zero. This is an estimate, not a payroll promise.</Text>
          {(['current', 'offer'] as const).map((prefix) => (
            <View key={prefix} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SectionHeader title={prefix === 'current' ? 'Current package' : 'New offer'} />
              {offerFields.map((field) => renderField(field, `${prefix}${field.key}`))}
            </View>
          ))}
        </>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SectionHeader title="Tax-year 2026–27 estimate" />
          {renderField({ key: 'grossSalary', label: 'Annual gross salary (₹)' }, 'grossSalary')}
          {renderField({ key: 'oldRegimeDeductions', label: 'Verified old-regime deductions besides standard deduction (₹)', optional: true }, 'oldRegimeDeductions')}
          <Text style={[styles.note, { color: colors.mutedForeground }]}>The new-regime estimate assumes a resident salaried individual below 60; special-rate income is not modelled. Enter only old-regime deductions you have checked for eligibility and limits. Confirm your result with the official Income Tax Department calculator.</Text>
        </View>
      )}
      <PrimaryButton onPress={calculate}>Calculate comparison</PrimaryButton>
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      {result ? (
        <View style={[styles.result, { backgroundColor: colors.secondary, borderColor: colors.border }]} accessibilityLiveRegion="polite">
          <SectionHeader title="Your estimate" />
          {result.map((line) => <Text key={line} style={[styles.resultLine, { color: colors.foreground }]}>{line}</Text>)}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: 10 },
  modeButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 13 },
  card: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', lineHeight: 17 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, fontSize: 16 },
  note: { fontSize: 12, lineHeight: 18 },
  result: { borderWidth: 1, borderRadius: 17, padding: 15, gap: 12 },
  resultLine: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  error: { fontSize: 12, lineHeight: 18 },
});

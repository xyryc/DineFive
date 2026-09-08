import { formatRestaurantTaxLabel, restaurantTaxRows, RestaurantTaxPart } from '../../utils/restaurantTax';

const part: RestaurantTaxPart = {
  lineReference: 'meal', jurisdiction: { level: 'state', displayName: 'New York' },
  percentage: '4.000', taxabilityReason: 'standard_rated', amount: .24,
};

describe('restaurant jurisdiction tax labels', () => {
  it('uses the returned percentage, not rounded amounts', () => {
    expect(formatRestaurantTaxLabel(part)).toBe('Meals · New York State Tax (4%)');
  });
  it('preserves sub-one-percent precision', () => {
    expect(formatRestaurantTaxLabel({ ...part, jurisdiction: { level: 'district', displayName: 'Metro' }, percentage: '0.375' }))
      .toBe('Meals · Metro District Tax (0.375%)');
  });
  it('distinguishes fee exemption from a genuine zero rate', () => {
    expect(formatRestaurantTaxLabel({ ...part, lineReference: 'platform_fee', percentage: null, taxabilityReason: 'product_exempt', amount: 0 }))
      .toBe('Platform fee · New York State Tax — exempt');
    expect(formatRestaurantTaxLabel({ ...part, percentage: '0.0', taxabilityReason: 'zero_rated', amount: 0 })).toContain('(0%)');
  });
  it('does not invent a rate when metadata is absent', () => {
    expect(formatRestaurantTaxLabel({ ...part, percentage: null })).not.toContain('%');
    expect(restaurantTaxRows({ stateTax: .24, cityTax: .02 })).toEqual([
      { label: 'State Tax', amount: .24 }, { label: 'Local Tax', amount: .02 },
    ]);
  });
  it('retains different rates and amounts for meals and fees', () => {
    const rows = restaurantTaxRows({ stateTax: .27, cityTax: 0, taxBreakdown: [part,
      { ...part, lineReference: 'platform_fee', percentage: '3', amount: .03 },
    ] });
    expect(rows.map(r => r.amount)).toEqual([.24, .03]);
    expect(rows[1].label).toBe('Platform fee · New York State Tax (3%)');
  });
  it('does not present uncollected tax as an exemption', () => {
    expect(formatRestaurantTaxLabel({ ...part, percentage: null, taxabilityReason: 'not_collecting', amount: 0 }))
      .toBe('Meals · New York State Tax — not collected');
  });
});

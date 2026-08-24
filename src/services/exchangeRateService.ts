import { ALL_CURRENCIES } from '../constants';

const API_BASE = 'https://open.er-api.com/v6/latest';

export async function fetchExchangeRates(baseCurrency: string = 'USD') {
  try {
    const response = await fetch(`${API_BASE}/${baseCurrency}`);
    if (!response.ok) throw new Error('Failed to fetch exchange rates');
    
    const data = await response.json();
    
    // We care about all defined currencies
    const supportedCodes = ALL_CURRENCIES.map(c => c.code);
    const rates: Record<string, number> = {};
    
    supportedCodes.forEach(code => {
      if (data.rates[code]) {
        rates[code] = data.rates[code];
      }
    });

    // Ensure base currency is 1
    rates[baseCurrency] = 1;

    return {
      rates,
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Exchange Rate Service Error:', error);
    return null;
  }
}

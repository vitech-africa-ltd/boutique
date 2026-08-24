export const CENTRAL_AFRICAN_CURRENCIES = [
  { code: 'CDF', name: 'Franc Congolais', countries: ['RDC'], symbol: 'FC' },
  { code: 'XAF', name: 'Franc CFA (CEMAC)', countries: ['Cameroun', 'Gabon', 'Congo', 'Tchad', 'RCA', 'Guinée Équatoriale'], symbol: 'FCFA' },
  { code: 'AOA', name: 'Kwanza Angolais', countries: ['Angola'], symbol: 'Kz' },
  { code: 'RWF', name: 'Franc Rwandais', countries: ['Rwanda'], symbol: 'RF' },
  { code: 'BIF', name: 'Franc Burundais', countries: ['Burundi'], symbol: 'FBu' },
  { code: 'STN', name: 'Dobra', countries: ['Sao Tomé-et-Principe'], symbol: 'Db' },
];

export const INTERNATIONAL_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', countries: ['USA'], symbol: '$' },
  { code: 'EUR', name: 'Euro', countries: ['Union Européenne'], symbol: '€' },
  { code: 'GBP', name: 'British Pound', countries: ['UK'], symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', countries: ['Japon'], symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', countries: ['Chine'], symbol: '元' },
  { code: 'CAD', name: 'Canadian Dollar', countries: ['Canada'], symbol: 'C$' },
  { code: 'ZAR', name: 'South African Rand', countries: ['Afrique du Sud'], symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', countries: ['Nigeria'], symbol: '₦' },
];

export const ALL_CURRENCIES = [...CENTRAL_AFRICAN_CURRENCIES, ...INTERNATIONAL_CURRENCIES];

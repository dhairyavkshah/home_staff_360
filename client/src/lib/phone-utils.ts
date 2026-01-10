import libphonenumber from 'google-libphonenumber';

const PhoneNumberUtil = libphonenumber.PhoneNumberUtil;
const phoneUtil = PhoneNumberUtil.getInstance();

export interface CountryCodeData {
  code: string;
  country: string;
  flag: string;
  maxLength: number;
  exampleNumber?: string;
}

export const COUNTRY_CODES: CountryCodeData[] = [
  { code: "+1", country: "United States", flag: "US", maxLength: 10, exampleNumber: "2025551234" },
  { code: "+1", country: "Canada", flag: "CA", maxLength: 10, exampleNumber: "4165551234" },
  { code: "+7", country: "Russia", flag: "RU", maxLength: 10, exampleNumber: "9123456789" },
  { code: "+20", country: "Egypt", flag: "EG", maxLength: 10, exampleNumber: "1001234567" },
  { code: "+27", country: "South Africa", flag: "ZA", maxLength: 9, exampleNumber: "712345678" },
  { code: "+30", country: "Greece", flag: "GR", maxLength: 10, exampleNumber: "6912345678" },
  { code: "+31", country: "Netherlands", flag: "NL", maxLength: 9, exampleNumber: "612345678" },
  { code: "+32", country: "Belgium", flag: "BE", maxLength: 9, exampleNumber: "470123456" },
  { code: "+33", country: "France", flag: "FR", maxLength: 9, exampleNumber: "612345678" },
  { code: "+34", country: "Spain", flag: "ES", maxLength: 9, exampleNumber: "612345678" },
  { code: "+36", country: "Hungary", flag: "HU", maxLength: 9, exampleNumber: "201234567" },
  { code: "+39", country: "Italy", flag: "IT", maxLength: 10, exampleNumber: "3123456789" },
  { code: "+40", country: "Romania", flag: "RO", maxLength: 9, exampleNumber: "712345678" },
  { code: "+41", country: "Switzerland", flag: "CH", maxLength: 9, exampleNumber: "781234567" },
  { code: "+43", country: "Austria", flag: "AT", maxLength: 10, exampleNumber: "6641234567" },
  { code: "+44", country: "United Kingdom", flag: "GB", maxLength: 10, exampleNumber: "7911123456" },
  { code: "+45", country: "Denmark", flag: "DK", maxLength: 8, exampleNumber: "32123456" },
  { code: "+46", country: "Sweden", flag: "SE", maxLength: 9, exampleNumber: "701234567" },
  { code: "+47", country: "Norway", flag: "NO", maxLength: 8, exampleNumber: "40123456" },
  { code: "+48", country: "Poland", flag: "PL", maxLength: 9, exampleNumber: "512345678" },
  { code: "+49", country: "Germany", flag: "DE", maxLength: 11, exampleNumber: "15123456789" },
  { code: "+51", country: "Peru", flag: "PE", maxLength: 9, exampleNumber: "912345678" },
  { code: "+52", country: "Mexico", flag: "MX", maxLength: 10, exampleNumber: "5512345678" },
  { code: "+53", country: "Cuba", flag: "CU", maxLength: 8, exampleNumber: "51234567" },
  { code: "+54", country: "Argentina", flag: "AR", maxLength: 10, exampleNumber: "9112345678" },
  { code: "+55", country: "Brazil", flag: "BR", maxLength: 11, exampleNumber: "11912345678" },
  { code: "+56", country: "Chile", flag: "CL", maxLength: 9, exampleNumber: "912345678" },
  { code: "+57", country: "Colombia", flag: "CO", maxLength: 10, exampleNumber: "3011234567" },
  { code: "+58", country: "Venezuela", flag: "VE", maxLength: 10, exampleNumber: "4121234567" },
  { code: "+60", country: "Malaysia", flag: "MY", maxLength: 10, exampleNumber: "123456789" },
  { code: "+61", country: "Australia", flag: "AU", maxLength: 9, exampleNumber: "412345678" },
  { code: "+62", country: "Indonesia", flag: "ID", maxLength: 12, exampleNumber: "812345678901" },
  { code: "+63", country: "Philippines", flag: "PH", maxLength: 10, exampleNumber: "9171234567" },
  { code: "+64", country: "New Zealand", flag: "NZ", maxLength: 9, exampleNumber: "211234567" },
  { code: "+65", country: "Singapore", flag: "SG", maxLength: 8, exampleNumber: "81234567" },
  { code: "+66", country: "Thailand", flag: "TH", maxLength: 9, exampleNumber: "812345678" },
  { code: "+81", country: "Japan", flag: "JP", maxLength: 10, exampleNumber: "9012345678" },
  { code: "+82", country: "South Korea", flag: "KR", maxLength: 10, exampleNumber: "1012345678" },
  { code: "+84", country: "Vietnam", flag: "VN", maxLength: 10, exampleNumber: "912345678" },
  { code: "+86", country: "China", flag: "CN", maxLength: 11, exampleNumber: "13123456789" },
  { code: "+90", country: "Turkey", flag: "TR", maxLength: 10, exampleNumber: "5012345678" },
  { code: "+91", country: "India", flag: "IN", maxLength: 10, exampleNumber: "9876543210" },
  { code: "+92", country: "Pakistan", flag: "PK", maxLength: 10, exampleNumber: "3001234567" },
  { code: "+93", country: "Afghanistan", flag: "AF", maxLength: 9, exampleNumber: "701234567" },
  { code: "+94", country: "Sri Lanka", flag: "LK", maxLength: 9, exampleNumber: "712345678" },
  { code: "+95", country: "Myanmar", flag: "MM", maxLength: 10, exampleNumber: "9123456789" },
  { code: "+98", country: "Iran", flag: "IR", maxLength: 10, exampleNumber: "9123456789" },
  { code: "+212", country: "Morocco", flag: "MA", maxLength: 9, exampleNumber: "612345678" },
  { code: "+213", country: "Algeria", flag: "DZ", maxLength: 9, exampleNumber: "551234567" },
  { code: "+216", country: "Tunisia", flag: "TN", maxLength: 8, exampleNumber: "20123456" },
  { code: "+218", country: "Libya", flag: "LY", maxLength: 9, exampleNumber: "912345678" },
  { code: "+220", country: "Gambia", flag: "GM", maxLength: 7, exampleNumber: "3012345" },
  { code: "+221", country: "Senegal", flag: "SN", maxLength: 9, exampleNumber: "701234567" },
  { code: "+223", country: "Mali", flag: "ML", maxLength: 8, exampleNumber: "65123456" },
  { code: "+224", country: "Guinea", flag: "GN", maxLength: 9, exampleNumber: "621234567" },
  { code: "+225", country: "Ivory Coast", flag: "CI", maxLength: 10, exampleNumber: "0101234567" },
  { code: "+226", country: "Burkina Faso", flag: "BF", maxLength: 8, exampleNumber: "70123456" },
  { code: "+227", country: "Niger", flag: "NE", maxLength: 8, exampleNumber: "93123456" },
  { code: "+228", country: "Togo", flag: "TG", maxLength: 8, exampleNumber: "90123456" },
  { code: "+229", country: "Benin", flag: "BJ", maxLength: 8, exampleNumber: "90123456" },
  { code: "+230", country: "Mauritius", flag: "MU", maxLength: 8, exampleNumber: "52512345" },
  { code: "+231", country: "Liberia", flag: "LR", maxLength: 9, exampleNumber: "770123456" },
  { code: "+232", country: "Sierra Leone", flag: "SL", maxLength: 8, exampleNumber: "25123456" },
  { code: "+233", country: "Ghana", flag: "GH", maxLength: 9, exampleNumber: "231234567" },
  { code: "+234", country: "Nigeria", flag: "NG", maxLength: 10, exampleNumber: "8031234567" },
  { code: "+235", country: "Chad", flag: "TD", maxLength: 8, exampleNumber: "63012345" },
  { code: "+236", country: "Central African Republic", flag: "CF", maxLength: 8, exampleNumber: "70012345" },
  { code: "+237", country: "Cameroon", flag: "CM", maxLength: 9, exampleNumber: "671234567" },
  { code: "+238", country: "Cape Verde", flag: "CV", maxLength: 7, exampleNumber: "9911234" },
  { code: "+239", country: "Sao Tome and Principe", flag: "ST", maxLength: 7, exampleNumber: "9812345" },
  { code: "+240", country: "Equatorial Guinea", flag: "GQ", maxLength: 9, exampleNumber: "222123456" },
  { code: "+241", country: "Gabon", flag: "GA", maxLength: 8, exampleNumber: "06031234" },
  { code: "+242", country: "Congo", flag: "CG", maxLength: 9, exampleNumber: "061234567" },
  { code: "+243", country: "DR Congo", flag: "CD", maxLength: 9, exampleNumber: "991234567" },
  { code: "+244", country: "Angola", flag: "AO", maxLength: 9, exampleNumber: "923123456" },
  { code: "+245", country: "Guinea-Bissau", flag: "GW", maxLength: 9, exampleNumber: "955012345" },
  { code: "+248", country: "Seychelles", flag: "SC", maxLength: 7, exampleNumber: "2510123" },
  { code: "+249", country: "Sudan", flag: "SD", maxLength: 9, exampleNumber: "911231234" },
  { code: "+250", country: "Rwanda", flag: "RW", maxLength: 9, exampleNumber: "720123456" },
  { code: "+251", country: "Ethiopia", flag: "ET", maxLength: 9, exampleNumber: "911234567" },
  { code: "+252", country: "Somalia", flag: "SO", maxLength: 9, exampleNumber: "901234567" },
  { code: "+253", country: "Djibouti", flag: "DJ", maxLength: 8, exampleNumber: "77831234" },
  { code: "+254", country: "Kenya", flag: "KE", maxLength: 9, exampleNumber: "712123456" },
  { code: "+255", country: "Tanzania", flag: "TZ", maxLength: 9, exampleNumber: "621234567" },
  { code: "+256", country: "Uganda", flag: "UG", maxLength: 9, exampleNumber: "712345678" },
  { code: "+257", country: "Burundi", flag: "BI", maxLength: 8, exampleNumber: "79561234" },
  { code: "+258", country: "Mozambique", flag: "MZ", maxLength: 9, exampleNumber: "821234567" },
  { code: "+260", country: "Zambia", flag: "ZM", maxLength: 9, exampleNumber: "955123456" },
  { code: "+261", country: "Madagascar", flag: "MG", maxLength: 9, exampleNumber: "321234567" },
  { code: "+262", country: "Reunion", flag: "RE", maxLength: 9, exampleNumber: "692123456" },
  { code: "+263", country: "Zimbabwe", flag: "ZW", maxLength: 9, exampleNumber: "712345678" },
  { code: "+264", country: "Namibia", flag: "NA", maxLength: 9, exampleNumber: "811234567" },
  { code: "+265", country: "Malawi", flag: "MW", maxLength: 9, exampleNumber: "991234567" },
  { code: "+266", country: "Lesotho", flag: "LS", maxLength: 8, exampleNumber: "50123456" },
  { code: "+267", country: "Botswana", flag: "BW", maxLength: 8, exampleNumber: "71123456" },
  { code: "+268", country: "Eswatini", flag: "SZ", maxLength: 8, exampleNumber: "76123456" },
  { code: "+269", country: "Comoros", flag: "KM", maxLength: 7, exampleNumber: "3212345" },
  { code: "+290", country: "Saint Helena", flag: "SH", maxLength: 5, exampleNumber: "51234" },
  { code: "+291", country: "Eritrea", flag: "ER", maxLength: 7, exampleNumber: "7123456" },
  { code: "+297", country: "Aruba", flag: "AW", maxLength: 7, exampleNumber: "5601234" },
  { code: "+298", country: "Faroe Islands", flag: "FO", maxLength: 6, exampleNumber: "211234" },
  { code: "+299", country: "Greenland", flag: "GL", maxLength: 6, exampleNumber: "221234" },
  { code: "+350", country: "Gibraltar", flag: "GI", maxLength: 8, exampleNumber: "57123456" },
  { code: "+351", country: "Portugal", flag: "PT", maxLength: 9, exampleNumber: "912345678" },
  { code: "+352", country: "Luxembourg", flag: "LU", maxLength: 9, exampleNumber: "628123456" },
  { code: "+353", country: "Ireland", flag: "IE", maxLength: 9, exampleNumber: "850123456" },
  { code: "+354", country: "Iceland", flag: "IS", maxLength: 7, exampleNumber: "6101234" },
  { code: "+355", country: "Albania", flag: "AL", maxLength: 9, exampleNumber: "662123456" },
  { code: "+356", country: "Malta", flag: "MT", maxLength: 8, exampleNumber: "96961234" },
  { code: "+357", country: "Cyprus", flag: "CY", maxLength: 8, exampleNumber: "96123456" },
  { code: "+358", country: "Finland", flag: "FI", maxLength: 10, exampleNumber: "4012345678" },
  { code: "+359", country: "Bulgaria", flag: "BG", maxLength: 9, exampleNumber: "887123456" },
  { code: "+370", country: "Lithuania", flag: "LT", maxLength: 8, exampleNumber: "61234567" },
  { code: "+371", country: "Latvia", flag: "LV", maxLength: 8, exampleNumber: "21234567" },
  { code: "+372", country: "Estonia", flag: "EE", maxLength: 8, exampleNumber: "51234567" },
  { code: "+373", country: "Moldova", flag: "MD", maxLength: 8, exampleNumber: "65012345" },
  { code: "+374", country: "Armenia", flag: "AM", maxLength: 8, exampleNumber: "77123456" },
  { code: "+375", country: "Belarus", flag: "BY", maxLength: 9, exampleNumber: "291234567" },
  { code: "+376", country: "Andorra", flag: "AD", maxLength: 6, exampleNumber: "312345" },
  { code: "+377", country: "Monaco", flag: "MC", maxLength: 8, exampleNumber: "61234567" },
  { code: "+378", country: "San Marino", flag: "SM", maxLength: 10, exampleNumber: "6612345678" },
  { code: "+380", country: "Ukraine", flag: "UA", maxLength: 9, exampleNumber: "501234567" },
  { code: "+381", country: "Serbia", flag: "RS", maxLength: 9, exampleNumber: "601234567" },
  { code: "+382", country: "Montenegro", flag: "ME", maxLength: 8, exampleNumber: "67622901" },
  { code: "+383", country: "Kosovo", flag: "XK", maxLength: 8, exampleNumber: "43201234" },
  { code: "+385", country: "Croatia", flag: "HR", maxLength: 9, exampleNumber: "912345678" },
  { code: "+386", country: "Slovenia", flag: "SI", maxLength: 8, exampleNumber: "31234567" },
  { code: "+387", country: "Bosnia and Herzegovina", flag: "BA", maxLength: 8, exampleNumber: "61123456" },
  { code: "+389", country: "North Macedonia", flag: "MK", maxLength: 8, exampleNumber: "72345678" },
  { code: "+420", country: "Czech Republic", flag: "CZ", maxLength: 9, exampleNumber: "601234567" },
  { code: "+421", country: "Slovakia", flag: "SK", maxLength: 9, exampleNumber: "912123456" },
  { code: "+423", country: "Liechtenstein", flag: "LI", maxLength: 7, exampleNumber: "6601234" },
  { code: "+500", country: "Falkland Islands", flag: "FK", maxLength: 5, exampleNumber: "51234" },
  { code: "+501", country: "Belize", flag: "BZ", maxLength: 7, exampleNumber: "6221234" },
  { code: "+502", country: "Guatemala", flag: "GT", maxLength: 8, exampleNumber: "51234567" },
  { code: "+503", country: "El Salvador", flag: "SV", maxLength: 8, exampleNumber: "70123456" },
  { code: "+504", country: "Honduras", flag: "HN", maxLength: 8, exampleNumber: "91234567" },
  { code: "+505", country: "Nicaragua", flag: "NI", maxLength: 8, exampleNumber: "81234567" },
  { code: "+506", country: "Costa Rica", flag: "CR", maxLength: 8, exampleNumber: "83123456" },
  { code: "+507", country: "Panama", flag: "PA", maxLength: 8, exampleNumber: "61234567" },
  { code: "+508", country: "Saint Pierre and Miquelon", flag: "PM", maxLength: 6, exampleNumber: "551234" },
  { code: "+509", country: "Haiti", flag: "HT", maxLength: 8, exampleNumber: "34101234" },
  { code: "+590", country: "Guadeloupe", flag: "GP", maxLength: 9, exampleNumber: "690001234" },
  { code: "+591", country: "Bolivia", flag: "BO", maxLength: 8, exampleNumber: "71234567" },
  { code: "+592", country: "Guyana", flag: "GY", maxLength: 7, exampleNumber: "6091234" },
  { code: "+593", country: "Ecuador", flag: "EC", maxLength: 9, exampleNumber: "991234567" },
  { code: "+594", country: "French Guiana", flag: "GF", maxLength: 9, exampleNumber: "694201234" },
  { code: "+595", country: "Paraguay", flag: "PY", maxLength: 9, exampleNumber: "961456789" },
  { code: "+596", country: "Martinique", flag: "MQ", maxLength: 9, exampleNumber: "696201234" },
  { code: "+597", country: "Suriname", flag: "SR", maxLength: 7, exampleNumber: "7412345" },
  { code: "+598", country: "Uruguay", flag: "UY", maxLength: 8, exampleNumber: "94231234" },
  { code: "+599", country: "Curacao", flag: "CW", maxLength: 7, exampleNumber: "9518123" },
  { code: "+670", country: "Timor-Leste", flag: "TL", maxLength: 8, exampleNumber: "77212345" },
  { code: "+672", country: "Norfolk Island", flag: "NF", maxLength: 6, exampleNumber: "381234" },
  { code: "+673", country: "Brunei", flag: "BN", maxLength: 7, exampleNumber: "7123456" },
  { code: "+674", country: "Nauru", flag: "NR", maxLength: 7, exampleNumber: "5551234" },
  { code: "+675", country: "Papua New Guinea", flag: "PG", maxLength: 8, exampleNumber: "70123456" },
  { code: "+676", country: "Tonga", flag: "TO", maxLength: 7, exampleNumber: "7715123" },
  { code: "+677", country: "Solomon Islands", flag: "SB", maxLength: 7, exampleNumber: "7421234" },
  { code: "+678", country: "Vanuatu", flag: "VU", maxLength: 7, exampleNumber: "5912345" },
  { code: "+679", country: "Fiji", flag: "FJ", maxLength: 7, exampleNumber: "7012345" },
  { code: "+680", country: "Palau", flag: "PW", maxLength: 7, exampleNumber: "6201234" },
  { code: "+682", country: "Cook Islands", flag: "CK", maxLength: 5, exampleNumber: "71234" },
  { code: "+683", country: "Niue", flag: "NU", maxLength: 4, exampleNumber: "8123" },
  { code: "+685", country: "Samoa", flag: "WS", maxLength: 7, exampleNumber: "7212345" },
  { code: "+686", country: "Kiribati", flag: "KI", maxLength: 8, exampleNumber: "72001234" },
  { code: "+687", country: "New Caledonia", flag: "NC", maxLength: 6, exampleNumber: "751234" },
  { code: "+688", country: "Tuvalu", flag: "TV", maxLength: 6, exampleNumber: "901234" },
  { code: "+689", country: "French Polynesia", flag: "PF", maxLength: 6, exampleNumber: "871234" },
  { code: "+690", country: "Tokelau", flag: "TK", maxLength: 4, exampleNumber: "7290" },
  { code: "+691", country: "Micronesia", flag: "FM", maxLength: 7, exampleNumber: "3501234" },
  { code: "+692", country: "Marshall Islands", flag: "MH", maxLength: 7, exampleNumber: "2351234" },
  { code: "+850", country: "North Korea", flag: "KP", maxLength: 10, exampleNumber: "1921234567" },
  { code: "+852", country: "Hong Kong", flag: "HK", maxLength: 8, exampleNumber: "51234567" },
  { code: "+853", country: "Macau", flag: "MO", maxLength: 8, exampleNumber: "66123456" },
  { code: "+855", country: "Cambodia", flag: "KH", maxLength: 9, exampleNumber: "912345678" },
  { code: "+856", country: "Laos", flag: "LA", maxLength: 10, exampleNumber: "2023123456" },
  { code: "+880", country: "Bangladesh", flag: "BD", maxLength: 10, exampleNumber: "1812345678" },
  { code: "+886", country: "Taiwan", flag: "TW", maxLength: 9, exampleNumber: "912345678" },
  { code: "+960", country: "Maldives", flag: "MV", maxLength: 7, exampleNumber: "7712345" },
  { code: "+961", country: "Lebanon", flag: "LB", maxLength: 8, exampleNumber: "71123456" },
  { code: "+962", country: "Jordan", flag: "JO", maxLength: 9, exampleNumber: "790123456" },
  { code: "+963", country: "Syria", flag: "SY", maxLength: 9, exampleNumber: "944567890" },
  { code: "+964", country: "Iraq", flag: "IQ", maxLength: 10, exampleNumber: "7912345678" },
  { code: "+965", country: "Kuwait", flag: "KW", maxLength: 8, exampleNumber: "50012345" },
  { code: "+966", country: "Saudi Arabia", flag: "SA", maxLength: 9, exampleNumber: "512345678" },
  { code: "+967", country: "Yemen", flag: "YE", maxLength: 9, exampleNumber: "712345678" },
  { code: "+968", country: "Oman", flag: "OM", maxLength: 8, exampleNumber: "92123456" },
  { code: "+970", country: "Palestine", flag: "PS", maxLength: 9, exampleNumber: "599123456" },
  { code: "+971", country: "United Arab Emirates", flag: "AE", maxLength: 9, exampleNumber: "501234567" },
  { code: "+972", country: "Israel", flag: "IL", maxLength: 9, exampleNumber: "501234567" },
  { code: "+973", country: "Bahrain", flag: "BH", maxLength: 8, exampleNumber: "36001234" },
  { code: "+974", country: "Qatar", flag: "QA", maxLength: 8, exampleNumber: "33123456" },
  { code: "+975", country: "Bhutan", flag: "BT", maxLength: 8, exampleNumber: "17123456" },
  { code: "+976", country: "Mongolia", flag: "MN", maxLength: 8, exampleNumber: "88123456" },
  { code: "+977", country: "Nepal", flag: "NP", maxLength: 10, exampleNumber: "9841234567" },
  { code: "+992", country: "Tajikistan", flag: "TJ", maxLength: 9, exampleNumber: "917123456" },
  { code: "+993", country: "Turkmenistan", flag: "TM", maxLength: 8, exampleNumber: "66123456" },
  { code: "+994", country: "Azerbaijan", flag: "AZ", maxLength: 9, exampleNumber: "401234567" },
  { code: "+995", country: "Georgia", flag: "GE", maxLength: 9, exampleNumber: "555123456" },
  { code: "+996", country: "Kyrgyzstan", flag: "KG", maxLength: 9, exampleNumber: "700123456" },
  { code: "+998", country: "Uzbekistan", flag: "UZ", maxLength: 9, exampleNumber: "912345678" },
];

export function getCountryCodeData(code: string): CountryCodeData | undefined {
  return COUNTRY_CODES.find(c => c.code === code);
}

export function getCountryFromCode(code: string): string | undefined {
  const data = getCountryCodeData(code);
  return data?.country;
}

export function getMaxLengthForCountryCode(code: string): number {
  const data = getCountryCodeData(code);
  return data?.maxLength || 10;
}

export function getFlagForCountryCode(code: string): string {
  const data = getCountryCodeData(code);
  return data?.flag || "UN";
}

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  e164?: string;
  countryCode?: string;
  nationalNumber?: string;
}

export function validatePhoneNumber(countryCode: string, phoneNumber: string): PhoneValidationResult {
  const cleanedNumber = phoneNumber.replace(/\D/g, '');
  
  if (!cleanedNumber) {
    return { isValid: false, error: "Phone number is required" };
  }
  
  const maxLength = getMaxLengthForCountryCode(countryCode);
  
  if (cleanedNumber.length > maxLength) {
    return { 
      isValid: false, 
      error: `Phone number cannot exceed ${maxLength} digits for ${getCountryFromCode(countryCode) || 'this country'}` 
    };
  }
  
  if (cleanedNumber.length < 4) {
    return { isValid: false, error: "Phone number is too short" };
  }
  
  const fullNumber = `${countryCode}${cleanedNumber}`;
  
  try {
    const parsedNumber = phoneUtil.parse(fullNumber);
    if (!phoneUtil.isValidNumber(parsedNumber)) {
      return { 
        isValid: false, 
        error: "Invalid phone number format for the selected country" 
      };
    }
    
    return {
      isValid: true,
      e164: phoneUtil.format(parsedNumber, libphonenumber.PhoneNumberFormat.E164),
      countryCode,
      nationalNumber: cleanedNumber
    };
  } catch {
    const countryData = getCountryCodeData(countryCode);
    if (cleanedNumber.length >= 6 && cleanedNumber.length <= maxLength) {
      return {
        isValid: true,
        e164: fullNumber,
        countryCode,
        nationalNumber: cleanedNumber
      };
    }
    
    return { 
      isValid: false, 
      error: `Phone number should be ${countryData?.maxLength || '6-10'} digits for ${countryData?.country || 'this country'}` 
    };
  }
}

export function combinePhoneNumber(countryCode: string, phoneNumber: string): string {
  const cleanedNumber = phoneNumber.replace(/\D/g, '');
  return `${countryCode}${cleanedNumber}`;
}

export function parseFullPhoneNumber(fullPhone: string): { countryCode: string; phoneNumber: string } | null {
  if (!fullPhone) return null;
  
  let phone = fullPhone.trim();
  if (!phone.startsWith('+')) {
    phone = '+' + phone;
  }
  
  for (const country of COUNTRY_CODES.sort((a, b) => b.code.length - a.code.length)) {
    if (phone.startsWith(country.code)) {
      return {
        countryCode: country.code,
        phoneNumber: phone.slice(country.code.length)
      };
    }
  }
  
  return null;
}

export function detectCountryFromPhone(phoneWithCode: string): CountryCodeData | null {
  const parsed = parseFullPhoneNumber(phoneWithCode);
  if (!parsed) return null;
  
  return getCountryCodeData(parsed.countryCode) || null;
}

export function getDefaultCountryCode(detectedCountry?: string): string {
  if (detectedCountry) {
    const country = COUNTRY_CODES.find(c => 
      c.country.toLowerCase() === detectedCountry.toLowerCase() ||
      c.flag.toLowerCase() === detectedCountry.toLowerCase()
    );
    if (country) return country.code;
  }
  return "+91";
}

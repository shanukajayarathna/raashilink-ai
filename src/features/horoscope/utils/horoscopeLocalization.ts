export type HoroscopeLanguage = 'en' | 'si' | 'ta';

export const LANGUAGE_FONT_FAMILY: Record<HoroscopeLanguage, string> = {
  en: '"Inter", "Segoe UI", sans-serif',
  si: '"Noto Sans Sinhala", "Iskoola Pota", "Segoe UI", sans-serif',
  ta: '"Noto Sans Tamil", "Latha", "Segoe UI", sans-serif',
};

export const HOROSCOPE_LANGUAGE_OPTIONS: Array<{ value: HoroscopeLanguage; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'si', label: 'සිංහල' },
  { value: 'ta', label: 'தமிழ்' },
];

export const HOROSCOPE_TEXT: Record<
  HoroscopeLanguage,
  {
    pending: string;
    language: string;
    birthChartTitle: string;
    calculatedFromProfile: string;
    refresh: string;
    shareChart: string;
    premiumAccuracyControl: string;
    editBirthDetailsReload: string;
    editBirthDetailsDescription: string;
    editReload: string;
    lastRefreshed: string;
    birthDateNeeded: string;
    birthTimeNeeded: string;
    birthPlaceNeeded: string;
    moonSign: string;
    nakshatra: string;
    gana: string;
    nakshatraPada: string;
    ascendant: string;
    sunSign: string;
    traditionalDetails: string;
    chartType: string;
    ayanamsa: string;
    vedicDay: string;
    tithi: string;
    paksha: string;
    yoga: string;
    karana: string;
    timeZone: string;
    houseOverview: string;
    occupiedBy: string;
    empty: string;
    readingHighlights: string;
    planetaryPositions: string;
    checkCompatibilityWith: string;
    selectFromMatches: string;
    searchPartnerName: string;
    calculateCompatibility: string;
    horoscopeNeedsDetails: string;
    horoscopeNeedsDetailsDescription: string;
    addBirthDetails: string;
    openFullProfile: string;
    horoscopeUpdate: string;
    editBirthDetails: string;
    dialogDescription: string;
    unknownBirthTime: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    cancel: string;
    saveReload: string;
    approximateTimeLabel: string;
    enterBirthTimeHelp: string;
    approximateTimeHelp: string;
    birthPlaceHelp: string;
    refreshSuccess: string;
    refreshApproximate: string;
  }
> = {
  en: {
    pending: 'Pending',
    language: 'Language',
    birthChartTitle: 'Your Vedic Birth Chart',
    calculatedFromProfile: 'Calculated from the birth details stored in your RaashiLink profile.',
    refresh: 'Refresh',
    shareChart: 'Share Chart',
    premiumAccuracyControl: 'Premium accuracy control',
    editBirthDetailsReload: 'Edit birth details and reload your horoscope instantly',
    editBirthDetailsDescription:
      'If your birth information changes, update it here and your saved database record plus horoscope chart will refresh together.',
    editReload: 'Edit & Reload',
    lastRefreshed: 'Last refreshed',
    birthDateNeeded: 'Birth date needed',
    birthTimeNeeded: 'Birth time needed',
    birthPlaceNeeded: 'Birth place needed',
    moonSign: 'Moon Sign (Rashi)',
    nakshatra: 'Nakshatra',
    gana: 'Gana',
    nakshatraPada: 'Nakshatra Pada',
    ascendant: 'Ascendant',
    sunSign: 'Sun Sign (Sidereal)',
    traditionalDetails: 'Traditional Sri Lankan Horoscope Details',
    chartType: 'Chart Type',
    ayanamsa: 'Ayanamsa',
    vedicDay: 'Birth Weekday',
    tithi: 'Tithi',
    paksha: 'Paksha',
    yoga: 'Yoga',
    karana: 'Karana',
    timeZone: 'Time Zone',
    houseOverview: '12 House Overview',
    occupiedBy: 'Occupied by',
    empty: 'No major planets',
    readingHighlights: 'Reading Highlights',
    planetaryPositions: 'Planetary Positions',
    checkCompatibilityWith: 'Check Compatibility With',
    selectFromMatches: 'Select from your matches',
    searchPartnerName: 'Search partner name...',
    calculateCompatibility: 'Calculate Compatibility',
    horoscopeNeedsDetails: 'Your horoscope needs complete birth details',
    horoscopeNeedsDetailsDescription:
      'Add your birth date and birth place here. If your exact time is unknown, we can still generate a chart, but the results will be marked as less accurate.',
    addBirthDetails: 'Add Birth Details',
    openFullProfile: 'Open Full Profile',
    horoscopeUpdate: 'Horoscope update',
    editBirthDetails: 'Edit birth details',
    dialogDescription:
      'Save your updated birth details here and the horoscope section will reload with the latest chart.',
    unknownBirthTime: "I don't know my exact birth time",
    birthDate: 'Birth date',
    birthTime: 'Birth time',
    birthPlace: 'Birth place',
    cancel: 'Cancel',
    saveReload: 'Save & Reload Horoscope',
    approximateTimeLabel: 'Approximate 12:00 time',
    enterBirthTimeHelp: 'Enter the time as accurately as possible for the best horoscope.',
    approximateTimeHelp: 'We will use 12:00 PM as an approximation, so some chart details may be less accurate.',
    birthPlaceHelp: 'Top OpenStreetMap suggestions will appear while you type.',
    refreshSuccess: 'Birth details saved and your horoscope has been reloaded.',
    refreshApproximate:
      'Birth details saved and your horoscope has been reloaded using an approximate 12:00 birth time.',
  },
  si: {
    pending: 'බලාපොරොත්තු වේ',
    language: 'භාෂාව',
    birthChartTitle: 'ඔබගේ වේද ජන්ම කේන්දරය',
    calculatedFromProfile: 'මෙය ඔබගේ RaashiLink පැතිකඩයේ සුරකින ලද උපන් විස්තර මත ගණනය කර ඇත.',
    refresh: 'යළි ගණනය',
    shareChart: 'බෙදාගන්න',
    premiumAccuracyControl: 'නිරවද්‍යතා පාලනය',
    editBirthDetailsReload: 'උපන් විස්තර යාවත්කාලීන කර හෝරාව වහාම නැවත ගන්න',
    editBirthDetailsDescription:
      'ඔබගේ උපන් විස්තර වෙනස් වී ඇත්නම්, එය මෙතැනින් යාවත්කාලීන කර සුරකින ලද දත්ත සහ හෝරාව එකවර නැවත ලබාගන්න.',
    editReload: 'සංස්කරණය හා යළි ගණනය',
    lastRefreshed: 'අවසන් යාවත්කාලීනය',
    birthDateNeeded: 'උපන් දිනය අවශ්‍යයි',
    birthTimeNeeded: 'උපන් වේලාව අවශ්‍යයි',
    birthPlaceNeeded: 'උපන් ස්ථානය අවශ්‍යයි',
    moonSign: 'චන්ද්‍ර රාශිය (Moon Sign)',
    nakshatra: 'නැකත',
    gana: 'ගණය',
    nakshatraPada: 'නැකත් පාදය',
    ascendant: 'ලග්නය (Ascendant)',
    sunSign: 'සූර්ය රාශිය (Sidereal)',
    traditionalDetails: 'සාම්ප්‍රදායික ශ්‍රී ලාංකික හෝරාවේ විස්තර',
    chartType: 'කේන්දර වර්ගය',
    ayanamsa: 'අයනාංශය',
    vedicDay: 'උපන් වාරය',
    tithi: 'තිථිය',
    paksha: 'පක්ෂය',
    yoga: 'යෝගය',
    karana: 'කරණය',
    timeZone: 'කාල කලාපය',
    houseOverview: 'භාව 12 සාරාංශය',
    occupiedBy: 'ග්‍රහ පිහිටීම',
    empty: 'ප්‍රධාන ග්‍රහ නොමැත',
    readingHighlights: 'හෝරා කියවීමේ ප්‍රධාන කරුණු',
    planetaryPositions: 'ග්‍රහ ස්ථාන',
    checkCompatibilityWith: 'ගැළපීම පරීක්ෂා කරන්න',
    selectFromMatches: 'ඔබගේ ගැළපීම් අතරින් තෝරන්න',
    searchPartnerName: 'සහකරුගේ නම සොයන්න...',
    calculateCompatibility: 'ගැළපීම ගණනය කරන්න',
    horoscopeNeedsDetails: 'ඔබගේ හෝරාවට සම්පූර්ණ උපන් විස්තර අවශ්‍යයි',
    horoscopeNeedsDetailsDescription:
      'මෙතැන උපන් දිනය සහ උපන් ස්ථානය එක් කරන්න. නිවැරදි උපන් වේලාව නොදන්නා විටත් කේන්දරය ගත හැකි නමුත් නිරවද්‍යතාව අඩු විය හැක.',
    addBirthDetails: 'උපන් විස්තර එක් කරන්න',
    openFullProfile: 'සම්පූර්ණ පැතිකඩ විවෘත කරන්න',
    horoscopeUpdate: 'හෝරාව යාවත්කාලීන කිරීම',
    editBirthDetails: 'උපන් විස්තර සංස්කරණය',
    dialogDescription: 'ඔබගේ උපන් විස්තර සුරකින්න. එවිට හෝරාව අලුත් දත්ත සමඟ නැවත පෙන්වයි.',
    unknownBirthTime: 'මගේ නිවැරදි උපන් වේලාව දන්නේ නැහැ',
    birthDate: 'උපන් දිනය',
    birthTime: 'උපන් වේලාව',
    birthPlace: 'උපන් ස්ථානය',
    cancel: 'අවලංගු කරන්න',
    saveReload: 'සුරකින්න හා යළි ගණනය කරන්න',
    approximateTimeLabel: 'අනුමාන 12:00 වේලාව',
    enterBirthTimeHelp: 'හෝරාව වඩාත් නිවැරදි වීමට හැකි තරම් නිවැරදි වේලාව ඇතුළත් කරන්න.',
    approximateTimeHelp: 'අනුමාන 12:00 වේලාව භාවිතා කරන බැවින් සමහර විස්තර අඩු නිරවද්‍ය විය හැක.',
    birthPlaceHelp: 'ඔබ ටයිප් කරන විට OpenStreetMap යෝජනා පෙන්වනු ලැබේ.',
    refreshSuccess: 'උපන් විස්තර සුරැකිණි සහ හෝරාව නැවත ගණනය කරන ලදී.',
    refreshApproximate: 'උපන් විස්තර සුරැකිණි. අනුමාන 12:00 වේලාවෙන් හෝරාව නැවත ගණනය කරන ලදී.',
  },
  ta: {
    pending: 'நிலுவையில்',
    language: 'மொழி',
    birthChartTitle: 'உங்கள் வேத ஜாதகச் சக்கரம்',
    calculatedFromProfile: 'இது உங்கள் RaashiLink சுயவிவரத்தில் சேமிக்கப்பட்ட பிறப்பு விவரங்களின் அடிப்படையில் கணிக்கப்பட்டது.',
    refresh: 'மீண்டும் கணக்கிடு',
    shareChart: 'பகிர்',
    premiumAccuracyControl: 'துல்லியக் கட்டுப்பாடு',
    editBirthDetailsReload: 'பிறப்பு விவரங்களை மாற்றி ஜாதகத்தை உடனே புதுப்பிக்கவும்',
    editBirthDetailsDescription:
      'உங்கள் பிறப்பு தகவல் மாறினால், அதை இங்கே புதுப்பித்து சேமிக்கப்பட்ட பதிவும் ஜாதகமும் ஒன்றாக புதுப்பிக்கலாம்.',
    editReload: 'திருத்தி புதுப்பிக்க',
    lastRefreshed: 'கடைசியாக புதுப்பிக்கப்பட்டது',
    birthDateNeeded: 'பிறந்த தேதி தேவை',
    birthTimeNeeded: 'பிறந்த நேரம் தேவை',
    birthPlaceNeeded: 'பிறந்த இடம் தேவை',
    moonSign: 'சந்திர ராசி (Moon Sign)',
    nakshatra: 'நட்சத்திரம்',
    gana: 'கணம்',
    nakshatraPada: 'நட்சத்திர பாதம்',
    ascendant: 'லக்னம் (Ascendant)',
    sunSign: 'சூரிய ராசி (Sidereal)',
    traditionalDetails: 'பாரம்பரிய இலங்கை ஜாதக விவரங்கள்',
    chartType: 'ஜாதக வகை',
    ayanamsa: 'அயனாம்சம்',
    vedicDay: 'பிறந்த வார நாள்',
    tithi: 'திதி',
    paksha: 'பக்ஷம்',
    yoga: 'யோகம்',
    karana: 'கரணம்',
    timeZone: 'நேர மண்டலம்',
    houseOverview: '12 பாவ அமைப்பு',
    occupiedBy: 'கிரகங்கள்',
    empty: 'முக்கிய கிரகங்கள் இல்லை',
    readingHighlights: 'ஜாதக வாசிப்பு குறிப்புகள்',
    planetaryPositions: 'கிரக நிலைகள்',
    checkCompatibilityWith: 'இணக்கம் பார்க்க',
    selectFromMatches: 'உங்கள் பொருத்தங்களில் இருந்து தேர்ந்தெடுக்கவும்',
    searchPartnerName: 'இணைவரின் பெயரை தேடுங்கள்...',
    calculateCompatibility: 'இணக்கத்தை கணக்கிடு',
    horoscopeNeedsDetails: 'உங்கள் ஜாதகத்திற்கு முழுமையான பிறப்பு விவரங்கள் தேவை',
    horoscopeNeedsDetailsDescription:
      'உங்கள் பிறந்த தேதி மற்றும் இடத்தை சேர்க்கவும். சரியான நேரம் தெரியாவிட்டாலும் ஜாதகம் உருவாகும், ஆனால் துல்லியம் குறையலாம்.',
    addBirthDetails: 'பிறப்பு விவரங்கள் சேர்க்கவும்',
    openFullProfile: 'முழு சுயவிவரம் திறக்கவும்',
    horoscopeUpdate: 'ஜாதகப் புதுப்பிப்பு',
    editBirthDetails: 'பிறப்பு விவரங்களைத் திருத்தவும்',
    dialogDescription: 'புதுப்பிக்கப்பட்ட பிறப்பு விவரங்களை சேமிக்கவும். ஜாதகப் பகுதி சமீபத்திய தகவலுடன் மீண்டும் ஏற்றப்படும்.',
    unknownBirthTime: 'எனக்கு சரியான பிறந்த நேரம் தெரியாது',
    birthDate: 'பிறந்த தேதி',
    birthTime: 'பிறந்த நேரம்',
    birthPlace: 'பிறந்த இடம்',
    cancel: 'ரத்து செய்',
    saveReload: 'சேமித்து ஜாதகத்தை புதுப்பிக்க',
    approximateTimeLabel: 'கணிக்கப்பட்ட 12:00 நேரம்',
    enterBirthTimeHelp: 'சரியான ஜாதகத்திற்காக நேரத்தை முடிந்தவரை துல்லியமாக உள்ளிடவும்.',
    approximateTimeHelp: 'கணிக்கப்பட்ட 12:00 நேரம் பயன்படுத்தப்படுவதால் சில விவரங்கள் குறைந்த துல்லியமாக இருக்கலாம்.',
    birthPlaceHelp: 'நீங்கள் টাইப் செய்யும் போது OpenStreetMap பரிந்துரைகள் காட்டப்படும்.',
    refreshSuccess: 'பிறப்பு விவரங்கள் சேமிக்கப்பட்டு ஜாதகம் புதுப்பிக்கப்பட்டது.',
    refreshApproximate: 'பிறப்பு விவரங்கள் சேமிக்கப்பட்டு கணிக்கப்பட்ட 12:00 நேரத்துடன் ஜாதகம் புதுப்பிக்கப்பட்டது.',
  },
};

const ZODIAC_TRANSLATIONS: Record<string, Record<HoroscopeLanguage, string>> = {
  Aries: { en: 'Aries', si: 'මේෂ', ta: 'மேஷம்' },
  Taurus: { en: 'Taurus', si: 'වෘෂභ', ta: 'ரிஷபம்' },
  Gemini: { en: 'Gemini', si: 'මිථුන', ta: 'மிதுனம்' },
  Cancer: { en: 'Cancer', si: 'කටක', ta: 'கடகம்' },
  Leo: { en: 'Leo', si: 'සිංහ', ta: 'சிம்மம்' },
  Virgo: { en: 'Virgo', si: 'කන්‍යා', ta: 'கன்னி' },
  Libra: { en: 'Libra', si: 'තුලා', ta: 'துலாம்' },
  Scorpio: { en: 'Scorpio', si: 'වෘශ්චික', ta: 'விருச்சிகம்' },
  Sagittarius: { en: 'Sagittarius', si: 'ධනු', ta: 'தனுசு' },
  Capricorn: { en: 'Capricorn', si: 'මකර', ta: 'மகரம்' },
  Aquarius: { en: 'Aquarius', si: 'කුම්භ', ta: 'கும்பம்' },
  Pisces: { en: 'Pisces', si: 'මීන', ta: 'மீனம்' },
};

const ZODIAC_SHORT_LABELS: Record<string, Record<HoroscopeLanguage, string>> = {
  Aries: { en: 'Ari', si: 'මේ', ta: 'மே' },
  Taurus: { en: 'Tau', si: 'වෘ', ta: 'ரி' },
  Gemini: { en: 'Gem', si: 'මි', ta: 'மி' },
  Cancer: { en: 'Can', si: 'කට', ta: 'கட' },
  Leo: { en: 'Leo', si: 'සිං', ta: 'சிம' },
  Virgo: { en: 'Vir', si: 'කන්', ta: 'கன்' },
  Libra: { en: 'Lib', si: 'තු', ta: 'து' },
  Scorpio: { en: 'Sco', si: 'වෘ', ta: 'விரு' },
  Sagittarius: { en: 'Sag', si: 'ධ', ta: 'தனு' },
  Capricorn: { en: 'Cap', si: 'ම', ta: 'மக' },
  Aquarius: { en: 'Aqu', si: 'කු', ta: 'கும்' },
  Pisces: { en: 'Pis', si: 'මී', ta: 'மீ' },
};

const PLANET_TRANSLATIONS: Record<string, Record<HoroscopeLanguage, string>> = {
  Sun: { en: 'Sun', si: 'සූර්ය', ta: 'சூரியன்' },
  Moon: { en: 'Moon', si: 'චන්ද්‍ර', ta: 'சந்திரன்' },
  Mars: { en: 'Mars', si: 'කුජ', ta: 'செவ்வாய்' },
  Mercury: { en: 'Mercury', si: 'බුධ', ta: 'புதன்' },
  Jupiter: { en: 'Jupiter', si: 'ගුරු', ta: 'குரு' },
  Venus: { en: 'Venus', si: 'ශුක්‍ර', ta: 'சுக்கிரன்' },
  Saturn: { en: 'Saturn', si: 'ශනි', ta: 'சனி' },
  Rahu: { en: 'Rahu', si: 'රාහු', ta: 'ராகு' },
  Ketu: { en: 'Ketu', si: 'කේතු', ta: 'கேது' },
};

const ASTRO_VALUE_TRANSLATIONS: Record<string, Record<HoroscopeLanguage, string>> = {
  Ashwini: { en: 'Ashwini', si: 'අස්විද', ta: 'அஸ்வினி' },
  Bharani: { en: 'Bharani', si: 'බෙරණ', ta: 'பரணி' },
  Krittika: { en: 'Krittika', si: 'කෘත්තිකා', ta: 'கிருத்திகை' },
  Rohini: { en: 'Rohini', si: 'රෝහිණී', ta: 'ரோகிணி' },
  Mrigashira: { en: 'Mrigashira', si: 'මුවසිරස', ta: 'மிருகசீரிடம்' },
  Ardra: { en: 'Ardra', si: 'අද', ta: 'திருவாதிரை' },
  Punarvasu: { en: 'Punarvasu', si: 'පුනාවස', ta: 'புனர்பூசம்' },
  Pushya: { en: 'Pushya', si: 'පුස', ta: 'பூசம்' },
  Ashlesha: { en: 'Ashlesha', si: 'අස්ලිස', ta: 'ஆயில்யம்' },
  Magha: { en: 'Magha', si: 'මා', ta: 'மகம்' },
  'Purva Phalguni': { en: 'Purva Phalguni', si: 'පුවපල්', ta: 'பூரம்' },
  'Uttara Phalguni': { en: 'Uttara Phalguni', si: 'උත්තරපල්', ta: 'உத்திரம்' },
  Hasta: { en: 'Hasta', si: 'හත', ta: 'ஹஸ்தம்' },
  Chitra: { en: 'Chitra', si: 'සිත', ta: 'சித்திரை' },
  Swati: { en: 'Swati', si: 'සා', ta: 'சுவாதி' },
  Vishakha: { en: 'Vishakha', si: 'විසා', ta: 'விசாகம்' },
  Anuradha: { en: 'Anuradha', si: 'අනුර', ta: 'அனுஷம்' },
  Jyeshtha: { en: 'Jyeshtha', si: 'දෙට', ta: 'கேட்டை' },
  Mula: { en: 'Mula', si: 'මුල', ta: 'மூலம்' },
  'Purva Ashadha': { en: 'Purva Ashadha', si: 'පුවසල', ta: 'பூராடம்' },
  'Uttara Ashadha': { en: 'Uttara Ashadha', si: 'උතුරුසල', ta: 'உத்திராடம்' },
  Shravana: { en: 'Shravana', si: 'සුවණ', ta: 'திருவோணம்' },
  Dhanishta: { en: 'Dhanishta', si: 'දෙණට', ta: 'அவிட்டம்' },
  Shatabhisha: { en: 'Shatabhisha', si: 'සියාවස', ta: 'சதயம்' },
  'Purva Bhadrapada': { en: 'Purva Bhadrapada', si: 'පුවපුටුප', ta: 'பூரட்டாதி' },
  'Uttara Bhadrapada': { en: 'Uttara Bhadrapada', si: 'උතුරුපුටුප', ta: 'உத்திரட்டாதி' },
  Revati: { en: 'Revati', si: 'රේවතී', ta: 'ரேவதி' },
  Pratipada: { en: 'Pratipada', si: 'ප්‍රතිපදා', ta: 'பிரதமை' },
  Dwitiya: { en: 'Dwitiya', si: 'ද්විතීයා', ta: 'த்விதியை' },
  Tritiya: { en: 'Tritiya', si: 'තෘතීයා', ta: 'த்ரிதியை' },
  Chaturthi: { en: 'Chaturthi', si: 'චතුර්ථි', ta: 'சதுர்த்தி' },
  Panchami: { en: 'Panchami', si: 'පංචමී', ta: 'பஞ்சமி' },
  Shashthi: { en: 'Shashthi', si: 'ෂෂ්ඨී', ta: 'ஷஷ்டி' },
  Saptami: { en: 'Saptami', si: 'සප්තමී', ta: 'சப்தமி' },
  Ashtami: { en: 'Ashtami', si: 'අෂ්ටමී', ta: 'அஷ்டமி' },
  Navami: { en: 'Navami', si: 'නවමී', ta: 'நவமி' },
  Dashami: { en: 'Dashami', si: 'දශමී', ta: 'தசமி' },
  Ekadashi: { en: 'Ekadashi', si: 'ඒකාදශී', ta: 'ஏகாதசி' },
  Dwadashi: { en: 'Dwadashi', si: 'ද්වාදශී', ta: 'த்வாதசி' },
  Trayodashi: { en: 'Trayodashi', si: 'ත්‍රයෝදශී', ta: 'த்ரயோதசி' },
  Chaturdashi: { en: 'Chaturdashi', si: 'චතුර්දශී', ta: 'சதுர்த்தசி' },
  Purnima: { en: 'Purnima', si: 'පුර පෝය', ta: 'பௌர்ணமி' },
  Amavasya: { en: 'Amavasya', si: 'අමාවක', ta: 'அமாவாசை' },
  'Shukla Paksha': { en: 'Shukla Paksha', si: 'ශුක්ල පක්ෂය', ta: 'சுக்ல பக்ஷம்' },
  'Krishna Paksha': { en: 'Krishna Paksha', si: 'කෘෂ්ණ පක්ෂය', ta: 'கிருஷ்ண பக்ஷம்' },
  Vishkambha: { en: 'Vishkambha', si: 'විශ්කම්භ', ta: 'விஷ்கம்பம்' },
  Priti: { en: 'Priti', si: 'ප්‍රීති', ta: 'ப்ரீதி' },
  Ayushman: { en: 'Ayushman', si: 'ආයුෂ්මාන්', ta: 'ஆயுஷ்மான்' },
  Saubhagya: { en: 'Saubhagya', si: 'සෞභාග්‍ය', ta: 'சௌபாக்கியம்' },
  Shobhana: { en: 'Shobhana', si: 'ශෝභන', ta: 'சோபனம்' },
  Atiganda: { en: 'Atiganda', si: 'අතිගණ්ඩ', ta: 'அதிகண்டம்' },
  Sukarma: { en: 'Sukarma', si: 'සුකර්ම', ta: 'சுகர்மம்' },
  Dhriti: { en: 'Dhriti', si: 'ධෘති', ta: 'திருதி' },
  Shoola: { en: 'Shoola', si: 'ශූල', ta: 'சூலம்' },
  Ganda: { en: 'Ganda', si: 'ගණ්ඩ', ta: 'கண்டம்' },
  Vriddhi: { en: 'Vriddhi', si: 'වෘද්ධි', ta: 'விருத்தி' },
  Dhruva: { en: 'Dhruva', si: 'ධෘව', ta: 'துருவம்' },
  Vyaghata: { en: 'Vyaghata', si: 'ව්‍යාඝාත', ta: 'வியாகாதம்' },
  Harshana: { en: 'Harshana', si: 'හර්ෂණ', ta: 'ஹர்ஷணம்' },
  Vajra: { en: 'Vajra', si: 'වජ්‍ර', ta: 'வஜ்ரம்' },
  Siddhi: { en: 'Siddhi', si: 'සිද්ධි', ta: 'சித்தி' },
  Vyatipata: { en: 'Vyatipata', si: 'ව්‍යාතිපාත', ta: 'வ்யதீபாதம்' },
  Variyana: { en: 'Variyana', si: 'වරියාන', ta: 'வரியானம்' },
  Parigha: { en: 'Parigha', si: 'පරිඝ', ta: 'பரிகம்' },
  Shiva: { en: 'Shiva', si: 'ශිව', ta: 'சிவம்' },
  Siddha: { en: 'Siddha', si: 'සිද්ධ', ta: 'சித்தம்' },
  Sadhya: { en: 'Sadhya', si: 'සාධ්‍ය', ta: 'சாத்தியம்' },
  Shubha: { en: 'Shubha', si: 'ශුභ', ta: 'சுபம்' },
  Shukla: { en: 'Shukla', si: 'ශුක්ල', ta: 'சுக்லம்' },
  Brahma: { en: 'Brahma', si: 'බ්‍රහ්ම', ta: 'பிரம்மம்' },
  Indra: { en: 'Indra', si: 'ඉන්ද්‍ර', ta: 'இந்திரம்' },
  Vaidhriti: { en: 'Vaidhriti', si: 'වෛධෘති', ta: 'வைத்ருதி' },
  Kimstughna: { en: 'Kimstughna', si: 'කිම්ස්තුඝ්න', ta: 'கிம்ஸ்துக்னம்' },
  Bava: { en: 'Bava', si: 'බව', ta: 'பவம்' },
  Balava: { en: 'Balava', si: 'බාලව', ta: 'பாலவம்' },
  Kaulava: { en: 'Kaulava', si: 'කෞලව', ta: 'கௌலவம்' },
  Taitila: { en: 'Taitila', si: 'තෛතිල', ta: 'தைதிலம்' },
  Garaja: { en: 'Garaja', si: 'ගරජ', ta: 'கரஜம்' },
  Vanija: { en: 'Vanija', si: 'වණිජ', ta: 'வணிஜம்' },
  Vishti: { en: 'Vishti', si: 'විෂ්ටි', ta: 'விஷ்டி' },
  Shakuni: { en: 'Shakuni', si: 'ශකුනි', ta: 'சகுனி' },
  Chatushpada: { en: 'Chatushpada', si: 'චතුෂ්පාද', ta: 'சதுஷ்பாதம்' },
  Naga: { en: 'Naga', si: 'නාග', ta: 'நாகம்' },
  Monday: { en: 'Monday', si: 'සඳුදා', ta: 'திங்கள்' },
  Tuesday: { en: 'Tuesday', si: 'අඟහරුවාදා', ta: 'செவ்வாய்' },
  Wednesday: { en: 'Wednesday', si: 'බදාදා', ta: 'புதன்' },
  Thursday: { en: 'Thursday', si: 'බ්‍රහස්පතින්දා', ta: 'வியாழன்' },
  Friday: { en: 'Friday', si: 'සිකුරාදා', ta: 'வெள்ளி' },
  Saturday: { en: 'Saturday', si: 'සෙනසුරාදා', ta: 'சனி' },
  Sunday: { en: 'Sunday', si: 'ඉරිදා', ta: 'ஞாயிறு' },
  'Sri Lankan Vedic / Sidereal': { en: 'Sri Lankan Vedic / Sidereal', si: 'ශ්‍රී ලාංකික වේද / නිර්යාණ', ta: 'இலங்கை வேத / நிராயண' },
};

export function translateZodiacSign(value: string | null | undefined, language: HoroscopeLanguage) {
  if (!value) return HOROSCOPE_TEXT[language].pending;
  return ZODIAC_TRANSLATIONS[value]?.[language] || value;
}

export function translateHoroscopeValue(value: string | null | undefined, language: HoroscopeLanguage) {
  if (!value) return HOROSCOPE_TEXT[language].pending;
  return ZODIAC_TRANSLATIONS[value]?.[language] || ASTRO_VALUE_TRANSLATIONS[value]?.[language] || value;
}

export function translateNakshatraName(value: string | null | undefined, language: HoroscopeLanguage) {
  return translateHoroscopeValue(value, language);
}

export function formatNakshatraPada(value: string | number | null | undefined, language: HoroscopeLanguage) {
  const pada = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

  if (!Number.isFinite(pada) || pada <= 0) {
    return HOROSCOPE_TEXT[language].pending;
  }

  if (language === 'si') {
    return `${pada} වන පාදය`;
  }

  if (language === 'ta') {
    return `${pada} ஆம் பாதம்`;
  }

  return `Pada ${pada}`;
}

export function getZodiacShortLabel(value: string | null | undefined, language: HoroscopeLanguage) {
  if (!value) return HOROSCOPE_TEXT[language].pending;
  return ZODIAC_SHORT_LABELS[value]?.[language] || String(value).slice(0, 3);
}

export function translatePlanetName(value: string | null | undefined, language: HoroscopeLanguage) {
  if (!value) return HOROSCOPE_TEXT[language].pending;
  return PLANET_TRANSLATIONS[value]?.[language] || value;
}

export function translateHouseLabel(value: string | number | null | undefined, language: HoroscopeLanguage) {
  const houseNumber = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);

  if (!Number.isFinite(houseNumber)) {
    return String(value || HOROSCOPE_TEXT[language].pending);
  }

  if (language === 'si') {
    return `${houseNumber} වන භාවය`;
  }

  if (language === 'ta') {
    return `${houseNumber} ஆம் பாவம்`;
  }

  if (houseNumber % 100 >= 11 && houseNumber % 100 <= 13) return `${houseNumber}th House`;
  const suffix = ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[houseNumber % 10] || 'th';
  return `${houseNumber}${suffix} House`;
}

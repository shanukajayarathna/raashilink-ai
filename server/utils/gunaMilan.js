/**
 * JS port of the Python guna_milan.py Ashtakoota calculation.
 * Uses nakshatra + rashi data stored on user.horoscopeData to compute
 * a real astroScore without spawning a Python process.
 * Max total = 36 points (Varna 1 + Vashya 2 + Tara 3 + Yoni 4 + Graha Maitri 5 + Gana 6 + Bhakoot 7 + Nadi 8).
 */

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const VARNA_GROUPS = [
  'Kshatriya', 'Vaishya', 'Brahmin', 'Shudra', 'Kshatriya', 'Vaishya', 'Shudra', 'Brahmin',
  'Kshatriya', 'Vaishya', 'Shudra', 'Brahmin', 'Kshatriya', 'Vaishya', 'Shudra', 'Brahmin',
  'Kshatriya', 'Vaishya', 'Shudra', 'Brahmin', 'Kshatriya', 'Vaishya', 'Shudra', 'Brahmin',
  'Kshatriya', 'Vaishya', 'Shudra',
];
const VARNA_RANK = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };

const VASHYA_GROUPS = [
  'Chatushpada', 'Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Manava',
  'Keeta', 'Jalachara', 'Vanachara', 'Chatushpada', 'Manava', 'Jalachara',
];
const VASHYA_OVER = {
  Manava: new Set(['Chatushpada', 'Jalachara', 'Vanachara']),
  Jalachara: new Set(['Keeta']),
};

const YONI_ANIMALS = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow', 'Buffalo',
  'Tiger', 'Hare', 'Monkey', 'Mongoose', 'Lion', 'Horse', 'Buffalo', 'Tiger', 'Hare',
  'Monkey', 'Lion', 'Mongoose', 'Cow', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat',
];
const YONI_ENEMIES = {
  Cat: 'Rat', Rat: 'Cat', Cow: 'Tiger', Tiger: 'Cow',
  Elephant: 'Lion', Lion: 'Elephant', Horse: 'Buffalo', Buffalo: 'Horse',
  Serpent: 'Mongoose', Mongoose: 'Serpent',
};

const GANA_GROUPS = [
  'Deva', 'Manushya', 'Rakshasa', 'Manushya', 'Deva', 'Manushya', 'Deva', 'Deva', 'Rakshasa',
  'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa', 'Deva', 'Rakshasa', 'Deva', 'Rakshasa',
  'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa', 'Rakshasa', 'Manushya', 'Manushya', 'Deva',
];

const NADI_GROUPS = [
  'Adi', 'Madhya', 'Antya', 'Adi', 'Madhya', 'Antya', 'Adi', 'Madhya', 'Antya',
  'Adi', 'Madhya', 'Antya', 'Adi', 'Madhya', 'Antya', 'Adi', 'Madhya', 'Antya',
  'Adi', 'Madhya', 'Antya', 'Adi', 'Madhya', 'Antya', 'Adi', 'Madhya', 'Antya',
];

const RASHI_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];
const PLANET_FRIENDSHIPS = {
  Sun:     { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'], neutrals: ['Mercury'] },
  Moon:    { friends: ['Sun', 'Mercury'], enemies: [], neutrals: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
  Mars:    { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'], neutrals: ['Venus', 'Saturn'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'], neutrals: ['Mars', 'Jupiter', 'Saturn'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: [], neutrals: ['Mercury', 'Venus', 'Saturn'] },
  Venus:   { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'], neutrals: ['Mars', 'Jupiter'] },
  Saturn:  { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'], neutrals: ['Jupiter'] },
};

function nakIdx(n) { return NAKSHATRAS.indexOf(String(n || '').trim()); }
function rashiIdx(r) { return RASHIS.indexOf(String(r || '').trim()); }

function scoreVarna(nak1, nak2) {
  const i1 = nakIdx(nak1); const i2 = nakIdx(nak2);
  if (i1 === -1 || i2 === -1) return 0.5; // neutral fallback
  const r1 = VARNA_RANK[VARNA_GROUPS[i1]] ?? 0;
  const r2 = VARNA_RANK[VARNA_GROUPS[i2]] ?? 0;
  return r2 >= r1 ? 1 : 0;
}

function scoreVashya(rashi1, rashi2) {
  const i1 = rashiIdx(rashi1); const i2 = rashiIdx(rashi2);
  if (i1 === -1 || i2 === -1) return 1; // neutral fallback
  const g1 = VASHYA_GROUPS[i1]; const g2 = VASHYA_GROUPS[i2];
  if (g1 === g2) return 2;
  if (VASHYA_OVER[g1]?.has(g2) || VASHYA_OVER[g2]?.has(g1)) return 1;
  return 0;
}

function scoreTara(nak1, nak2) {
  const i1 = nakIdx(nak1); const i2 = nakIdx(nak2);
  if (i1 === -1 || i2 === -1) return 1.5; // neutral fallback
  const FAVORABLE = new Set([1, 3, 5, 7, 8]);
  const fwd = ((i2 - i1 + 27) % 27) % 9;
  const bwd = ((i1 - i2 + 27) % 27) % 9;
  return (FAVORABLE.has(fwd) ? 1.5 : 0) + (FAVORABLE.has(bwd) ? 1.5 : 0);
}

function scoreYoni(nak1, nak2) {
  const i1 = nakIdx(nak1); const i2 = nakIdx(nak2);
  if (i1 === -1 || i2 === -1) return 2; // neutral fallback
  const a1 = YONI_ANIMALS[i1]; const a2 = YONI_ANIMALS[i2];
  if (a1 === a2) return 4;
  if (YONI_ENEMIES[a1] === a2) return 0;
  return 2;
}

function scoreGrahaMaitri(rashi1, rashi2) {
  const i1 = rashiIdx(rashi1); const i2 = rashiIdx(rashi2);
  if (i1 === -1 || i2 === -1) return 3; // neutral fallback
  const lord1 = RASHI_LORDS[i1]; const lord2 = RASHI_LORDS[i2];
  if (lord1 === lord2) return 5;
  const rel = (a, b) => {
    if (PLANET_FRIENDSHIPS[a]?.friends.includes(b)) return 'friend';
    if (PLANET_FRIENDSHIPS[a]?.neutrals.includes(b)) return 'neutral';
    return 'enemy';
  };
  const r1 = rel(lord1, lord2); const r2 = rel(lord2, lord1);
  if (r1 === 'friend'  && r2 === 'friend')  return 5;
  if (r1 === 'friend'  && r2 === 'neutral') return 4;
  if (r1 === 'neutral' && r2 === 'friend')  return 4;
  if (r1 === 'neutral' && r2 === 'neutral') return 3;
  if ((r1 === 'friend' && r2 === 'enemy') || (r1 === 'enemy' && r2 === 'friend')) return 1.5;
  if ((r1 === 'neutral' && r2 === 'enemy') || (r1 === 'enemy' && r2 === 'neutral')) return 0.5;
  return 0;
}

function scoreGana(nak1, nak2) {
  const i1 = nakIdx(nak1); const i2 = nakIdx(nak2);
  if (i1 === -1 || i2 === -1) return 3; // neutral fallback
  const g1 = GANA_GROUPS[i1]; const g2 = GANA_GROUPS[i2];
  if (g1 === g2) return 6;
  if ((g1 === 'Deva' && g2 === 'Manushya') || (g1 === 'Manushya' && g2 === 'Deva')) return 5;
  return 0;
}

function scoreBhakoot(rashi1, rashi2) {
  const i1 = rashiIdx(rashi1); const i2 = rashiIdx(rashi2);
  if (i1 === -1 || i2 === -1) return 3.5; // neutral fallback
  const forward = ((i2 - i1 + 12) % 12) + 1;
  return [2, 6, 8, 12].includes(forward) ? 0 : 7;
}

function scoreNadi(nak1, nak2) {
  const i1 = nakIdx(nak1); const i2 = nakIdx(nak2);
  if (i1 === -1 || i2 === -1) return 4; // neutral fallback
  return NADI_GROUPS[i1] === NADI_GROUPS[i2] ? 0 : 8;
}

/**
 * Calculate Ashtakoota Guna Milan and return a 0-100 astroScore.
 * @param {string} nakshatra1 - Nakshatra of user A
 * @param {string} rashi1     - Rashi of user A
 * @param {string} nakshatra2 - Nakshatra of user B
 * @param {string} rashi2     - Rashi of user B
 * @returns {{ gunaTotal: number, astroScore: number, subScores: object }}
 */
export function calculateGunaMilan(nakshatra1, rashi1, nakshatra2, rashi2) {
  const subScores = {
    varna:       scoreVarna(nakshatra1, nakshatra2),
    vashya:      scoreVashya(rashi1, rashi2),
    tara:        scoreTara(nakshatra1, nakshatra2),
    yoni:        scoreYoni(nakshatra1, nakshatra2),
    grahaMaitri: scoreGrahaMaitri(rashi1, rashi2),
    gana:        scoreGana(nakshatra1, nakshatra2),
    bhakoot:     scoreBhakoot(rashi1, rashi2),
    nadi:        scoreNadi(nakshatra1, nakshatra2),
  };
  const gunaTotal = Object.values(subScores).reduce((s, v) => s + v, 0);
  // Normalize to 0-100 (same formula as Python engine)
  const astroScore = Number(((gunaTotal / 36) * 100).toFixed(2));
  return { gunaTotal, astroScore, subScores };
}

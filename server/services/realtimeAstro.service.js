import * as Astronomy from 'astronomy-engine';

const BODIES = [
  { key: 'Sun', body: Astronomy.Body.Sun },
  { key: 'Moon', body: Astronomy.Body.Moon },
  { key: 'Mars', body: Astronomy.Body.Mars },
  { key: 'Mercury', body: Astronomy.Body.Mercury },
  { key: 'Jupiter', body: Astronomy.Body.Jupiter },
  { key: 'Venus', body: Astronomy.Body.Venus },
  { key: 'Saturn', body: Astronomy.Body.Saturn },
];

function normalizeDegrees(deg) {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

function getZodiacSignTropical(eclipticLongitude) {
  const lon = normalizeDegrees(eclipticLongitude);
  const idx = Math.floor(lon / 30);
  return (
    [
      'Aries',
      'Taurus',
      'Gemini',
      'Cancer',
      'Leo',
      'Virgo',
      'Libra',
      'Scorpio',
      'Sagittarius',
      'Capricorn',
      'Aquarius',
      'Pisces',
    ][idx] || 'Unknown'
  );
}

let _cache = { key: null, value: null };

export function getRealtimePlanetarySnapshot({ now = new Date() } = {}) {
  const date = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date for realtime planetary snapshot');
  }

  const minuteKey = date.toISOString().slice(0, 16);
  if (_cache.key === minuteKey && _cache.value) {
    return _cache.value;
  }

  const planets = BODIES.map(({ key, body }) => {
    const vec = Astronomy.GeoVector(body, date, true);
    const ecl = Astronomy.Ecliptic(vec);
    const lon = normalizeDegrees(ecl.elon);
    return {
      planet: key,
      eclipticLongitude: Number(lon.toFixed(4)),
      signTropical: getZodiacSignTropical(lon),
    };
  });

  const snapshot = {
    computedAtUtc: date.toISOString(),
    zodiacSystem: 'tropical',
    planets,
  };

  _cache = { key: minuteKey, value: snapshot };
  return snapshot;
}


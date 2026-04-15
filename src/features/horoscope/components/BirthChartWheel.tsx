import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { motion } from 'motion/react';
import {
  LANGUAGE_FONT_FAMILY,
  type HoroscopeLanguage,
  translateHouseLabel,
  translatePlanetName,
  translateZodiacSign,
} from '../utils/horoscopeLocalization';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:       '#8B1A2E',
  secondary:     '#C9A84C',
  bg:            '#FAF7F2',
  textPrimary:   '#1C1C1C',
};

// ─── Per-sign data ─────────────────────────────────────────────────────────────
const ZODIAC_DATA: Record<string, {
  symbol: string; element: string;
  solid: string; glyphColor: string; fill: string; ring: string;
}> = {
  Aries:       { symbol: '♈', element: 'Fire',  solid: '#B71C1C', glyphColor: '#C62828', fill: '#FFEBEE', ring: '#E53935' },
  Taurus:      { symbol: '♉', element: 'Earth', solid: '#1B5E20', glyphColor: '#2E7D32', fill: '#E8F5E9', ring: '#43A047' },
  Gemini:      { symbol: '♊', element: 'Air',   solid: '#E65100', glyphColor: '#EF6C00', fill: '#FFF3E0', ring: '#FB8C00' },
  Cancer:      { symbol: '♋', element: 'Water', solid: '#0D47A1', glyphColor: '#1565C0', fill: '#E3F2FD', ring: '#1E88E5' },
  Leo:         { symbol: '♌', element: 'Fire',  solid: '#B71C1C', glyphColor: '#C62828', fill: '#FFEBEE', ring: '#E53935' },
  Virgo:       { symbol: '♍', element: 'Earth', solid: '#1B5E20', glyphColor: '#2E7D32', fill: '#E8F5E9', ring: '#43A047' },
  Libra:       { symbol: '♎', element: 'Air',   solid: '#E65100', glyphColor: '#EF6C00', fill: '#FFF3E0', ring: '#FB8C00' },
  Scorpio:     { symbol: '♏', element: 'Water', solid: '#0D47A1', glyphColor: '#1565C0', fill: '#E3F2FD', ring: '#1E88E5' },
  Sagittarius: { symbol: '♐', element: 'Fire',  solid: '#B71C1C', glyphColor: '#C62828', fill: '#FFEBEE', ring: '#E53935' },
  Capricorn:   { symbol: '♑', element: 'Earth', solid: '#1B5E20', glyphColor: '#2E7D32', fill: '#E8F5E9', ring: '#43A047' },
  Aquarius:    { symbol: '♒', element: 'Air',   solid: '#E65100', glyphColor: '#EF6C00', fill: '#FFF3E0', ring: '#FB8C00' },
  Pisces:      { symbol: '♓', element: 'Water', solid: '#0D47A1', glyphColor: '#1565C0', fill: '#E3F2FD', ring: '#1E88E5' },
};

const SIGNS_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Planet {
  name: string; symbol: string; sign: string;
  degree: string; house: number; color: string;
}
interface BirthChartWheelProps {
  planets: Planet[];
  ascendant: string;
  language?: HoroscopeLanguage;
}

// ─── SVG geometry (viewBox 560×560, centre 280,280) ────────────────────────────
const CX = 280, CY = 280;
// Rings (inside → out):
const R_CENTRE = 112;  // centre circle radius
const R_HIN    = 112;  // inner wall of house band
const R_HNUM   = 138;  // house-number badge centre
const R_PLAN   = 170;  // planet orbit
const R_SIN    = 196;  // house/zodiac boundary
const R_ZMID   = 216;  // zodiac label mid-radius
const R_ZOUT   = 236;  // zodiac outer / compass inner
const R_COUT   = 274;  // compass ring outer

const hStart = (i: number) => 180 + i * 30;   // ASC at 9 o'clock
const hMid   = (i: number) => 180 + i * 30 + 15;
const toRad  = (d: number) => (d * Math.PI) / 180;
const px = (r: number, d: number) => CX + r * Math.cos(toRad(d));
const py = (r: number, d: number) => CY + r * Math.sin(toRad(d));

function segment(r1: number, r2: number, s: number, e: number) {
  const la = Math.abs(e - s) > 180 ? 1 : 0;
  return [
    `M ${px(r2,s)} ${py(r2,s)}`,
    `A ${r2} ${r2} 0 ${la} 1 ${px(r2,e)} ${py(r2,e)}`,
    `L ${px(r1,e)} ${py(r1,e)}`,
    `A ${r1} ${r1} 0 ${la} 0 ${px(r1,s)} ${py(r1,s)}`,
    'Z',
  ].join(' ');
}

// ─── Component ─────────────────────────────────────────────────────────────────
const BirthChartWheel: React.FC<BirthChartWheelProps> = ({
  planets, ascendant, language = 'en',
}) => {
  const fontFamily = LANGUAGE_FONT_FAMILY[language];
  const ascIdx  = Math.max(0, SIGNS_ORDER.indexOf(ascendant));
  const ascData = ZODIAC_DATA[ascendant] ?? ZODIAC_DATA.Aries;

  const houseSignMap = Array.from({ length: 12 }, (_, i) => {
    const name = SIGNS_ORDER[(ascIdx + i) % 12];
    return { houseNum: i + 1, name, d: ZODIAC_DATA[name] };
  });

  const byHouse: Record<number, Planet[]> = {};
  planets.forEach(p => { (byHouse[p.house] ??= []).push(p); });

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      maxWidth: '640px',
      aspectRatio: '1 / 1',
      mx: 'auto',
    }}>
      {/* Ambient colour glow that pulses */}
      <Box sx={{
        position: 'absolute', inset: '-8%', borderRadius: '50%',
        pointerEvents: 'none',
        background: `radial-gradient(circle, ${ascData.solid}30 0%, transparent 65%)`,
        animation: 'chartPulse 4s ease-in-out infinite',
        '@keyframes chartPulse': {
          '0%,100%': { opacity: 0.55 },
          '50%':      { opacity: 1   },
        },
      }} />

      {/* ── ENTRANCE: entire wheel spins + fades in ── */}
      <motion.svg
        viewBox="0 0 560 560"
        initial={{ rotate: -90, scale: 0.72, opacity: 0 }}
        animate={{ rotate: 0,  scale: 1,    opacity: 1 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="centreGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="60%"  stopColor={C.bg} />
            <stop offset="100%" stopColor={`${ascData.solid}22`} />
          </radialGradient>
          <linearGradient id="ascGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={C.secondary}  stopOpacity="0.6" />
            <stop offset="100%" stopColor={ascData.solid} stopOpacity="0.22" />
          </linearGradient>
          <filter id="centreShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="5" stdDeviation="9"
              floodColor={ascData.solid} floodOpacity="0.25" />
          </filter>
          <filter id="planetGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="haloGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ════════════════════════════════════════════
            LIVE 1 – Outer astrolabe compass ring
            Rotates CW 1 rev / 90 s
        ════════════════════════════════════════════ */}
        <motion.g
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        >
          {/* Dark primary-coloured band */}
          <circle cx={CX} cy={CY} r={R_COUT} fill={C.primary} />
          <circle cx={CX} cy={CY} r={R_ZOUT} fill="none" />

          {/* 72 tick marks (every 5°) */}
          {Array.from({ length: 72 }, (_, i) => {
            const angle   = i * 5;
            const isCard  = i % 18 === 0;
            const isMajor = i % 6  === 0;
            const inner   = isCard ? R_ZOUT + 3 : isMajor ? R_ZOUT + 7 : R_ZOUT + 11;
            const outer   = R_COUT - 2;
            if (isCard) {
              const r = (R_COUT + R_ZOUT) / 2;
              return (
                <text key={i} x={px(r, angle)} y={py(r, angle)}
                  textAnchor="middle" dominantBaseline="middle"
                  style={{ fontSize: '18px', fill: C.secondary, fontWeight: '900', userSelect: 'none' }}>
                  ◆
                </text>
              );
            }
            return (
              <line key={i}
                x1={px(inner, angle)} y1={py(inner, angle)}
                x2={px(outer, angle)} y2={py(outer, angle)}
                stroke={isMajor ? 'rgba(201,168,76,0.85)' : 'rgba(255,255,255,0.35)'}
                strokeWidth={isMajor ? '2' : '0.9'}
              />
            );
          })}

          {/* ✦ at 45° inter-cardinals */}
          {[45, 135, 225, 315].map(angle => (
            <text key={angle}
              x={px((R_COUT + R_ZOUT) / 2, angle)}
              y={py((R_COUT + R_ZOUT) / 2, angle)}
              textAnchor="middle" dominantBaseline="middle"
              style={{ fontSize: '12px', fill: 'rgba(201,168,76,0.75)', userSelect: 'none' }}
            >✦</text>
          ))}

          {/* ring borders */}
          <circle cx={CX} cy={CY} r={R_ZOUT} fill="none" stroke={C.secondary} strokeWidth="2.5" />
          <circle cx={CX} cy={CY} r={R_COUT} fill="none" stroke={C.secondary} strokeWidth="2" />
        </motion.g>

        {/* ════════════════════════════════════════════
            LIVE 2 – Pulsing outer halo ring
        ════════════════════════════════════════════ */}
        <motion.circle cx={CX} cy={CY} r={R_COUT + 7}
          fill="none" stroke={ascData.solid} strokeWidth="3"
          filter="url(#haloGlow)"
          animate={{ opacity: [0.12, 0.5, 0.12], r: [R_COUT + 5, R_COUT + 12, R_COUT + 5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ── Static white base disc ── */}
        <circle cx={CX} cy={CY} r={R_ZOUT} fill="#faf7f2" />

        {/* ── Ring separators ── */}
        <circle cx={CX} cy={CY} r={R_ZOUT} fill="none" stroke={C.primary} strokeWidth="2.5" />
        <circle cx={CX} cy={CY} r={R_SIN}  fill="none" stroke={C.primary} strokeWidth="2.5" />
        <circle cx={CX} cy={CY} r={R_HIN}  fill="none" stroke={C.primary} strokeWidth="3" />

        {/* ── House band fills ── */}
        {houseSignMap.map(({ houseNum, d }, i) => (
          <path key={`hb-${houseNum}`}
            d={segment(R_HIN, R_SIN, hStart(i), hStart(i) + 30)}
            fill={houseNum === 1 ? 'url(#ascGrad)' : d.fill}
          />
        ))}

        {/* ── Zodiac band fills ── */}
        {houseSignMap.map(({ houseNum, d }, i) => (
          <path key={`zb-${houseNum}`}
            d={segment(R_SIN, R_ZOUT, hStart(i), hStart(i) + 30)}
            fill={houseNum === 1 ? C.secondary + '66' : d.fill}
          />
        ))}

        {/* ── Divider spokes ── */}
        {houseSignMap.map(({ houseNum, d }, i) => (
          <line key={`sp-${houseNum}`}
            x1={px(R_HIN,  hStart(i))} y1={py(R_HIN,  hStart(i))}
            x2={px(R_ZOUT, hStart(i))} y2={py(R_ZOUT, hStart(i))}
            stroke={houseNum === 1 ? C.secondary : houseNum === 7 ? '#9E9E9E' : d.solid}
            strokeWidth={houseNum === 1 ? '3' : houseNum === 7 ? '2.2' : '1.4'}
            strokeOpacity={houseNum === 1 ? '1' : houseNum === 7 ? '0.85' : '0.55'}
          />
        ))}

        {/* ── ASC thick gold highlight arcs ── */}
        {(() => {
          const s = hStart(0), e = hStart(0) + 30;
          return (
            <>
              <path d={`M ${px(R_ZOUT,s)} ${py(R_ZOUT,s)} A ${R_ZOUT} ${R_ZOUT} 0 0 1 ${px(R_ZOUT,e)} ${py(R_ZOUT,e)}`}
                fill="none" stroke={C.secondary} strokeWidth="7" />
              <path d={`M ${px(R_SIN,s)} ${py(R_SIN,s)} A ${R_SIN} ${R_SIN} 0 0 1 ${px(R_SIN,e)} ${py(R_SIN,e)}`}
                fill="none" stroke={C.secondary} strokeWidth="5" />
              <path d={`M ${px(R_HIN,s)} ${py(R_HIN,s)} A ${R_HIN} ${R_HIN} 0 0 1 ${px(R_HIN,e)} ${py(R_HIN,e)}`}
                fill="none" stroke={C.secondary} strokeWidth="5" />
            </>
          );
        })()}

        {/* ── Zodiac glyphs + names ── */}
        {houseSignMap.map(({ houseNum, name, d }, i) => {
          const m     = hMid(i);
          const isAsc = houseNum === 1;
          return (
            <g key={`zl-${houseNum}`}>
              <text x={px(R_ZMID, m)} y={py(R_ZMID, m) - 12}
                textAnchor="middle" dominantBaseline="middle"
                style={{
                  fontSize: isAsc ? '27px' : '24px',
                  fill: isAsc ? C.primary : d.glyphColor,
                  fontWeight: '900', userSelect: 'none',
                }}>
                {d.symbol}
              </text>
              <text x={px(R_ZMID, m)} y={py(R_ZMID, m) + 15}
                textAnchor="middle"
                style={{
                  fontSize: isAsc ? '14px' : '12px',
                  fill: isAsc ? C.primary : d.solid,
                  fontWeight: '800', fontFamily,
                  letterSpacing: '0.5px', userSelect: 'none',
                }}>
                {name.slice(0, 3).toUpperCase()}
              </text>

            </g>
          );
        })}

        {/* ── House number badges ── */}
        {houseSignMap.map(({ houseNum, d }, i) => {
          const m     = hMid(i);
          const isAsc = houseNum === 1;
          return (
            <g key={`hn-${houseNum}`}>
              <rect
                x={px(R_HNUM, m) - 15} y={py(R_HNUM, m) - 13}
                width="30" height="26" rx="13"
                fill={isAsc ? C.secondary : '#ffffff'}
                stroke={isAsc ? C.primary : d.ring}
                strokeWidth="2.5"
              />
              <text x={px(R_HNUM, m)} y={py(R_HNUM, m) + 1}
                textAnchor="middle" dominantBaseline="middle"
                style={{
                  fontSize: '14px',
                  fill: isAsc ? C.primary : d.solid,
                  fontWeight: '900', fontFamily, userSelect: 'none',
                }}>
                {houseNum}
              </text>
            </g>
          );
        })}

        {/* ════════════════════════════════════════════
            LIVE 3 – Dashed inner ring counter-rotates
        ════════════════════════════════════════════ */}
        <motion.circle cx={CX} cy={CY} r={R_HIN - 8}
          fill="none" stroke={`${C.secondary}70`}
          strokeWidth="2" strokeDasharray="9 5"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />

        {/* ── Centre circle ── */}
        <circle cx={CX} cy={CY} r={R_CENTRE - 2}
          fill="url(#centreGrad)"
          filter="url(#centreShadow)"
        />

        {/* ════════════════════════════════════════════
            LIVE 4 – Compass crosshair (slow CW, 40 s)
        ════════════════════════════════════════════ */}
        <motion.g
          style={{ transformOrigin: `${CX}px ${CY}px` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          {[0, 90, 180, 270].map(angle => (
            <line key={angle}
              x1={px(20, angle)} y1={py(20, angle)}
              x2={px(R_CENTRE - 18, angle)} y2={py(R_CENTRE - 18, angle)}
              stroke={`${ascData.solid}45`} strokeWidth="1.5"
            />
          ))}
          {[45, 135, 225, 315].map(angle => (
            <line key={angle}
              x1={px(14, angle)} y1={py(14, angle)}
              x2={px(R_CENTRE - 26, angle)} y2={py(R_CENTRE - 26, angle)}
              stroke={`${C.secondary}35`} strokeWidth="1"
            />
          ))}
        </motion.g>

        {/* ════════════════════════════════════════════
            LIVE 5 – Pulsing centre glow
        ════════════════════════════════════════════ */}
        <motion.circle cx={CX} cy={CY} r="58"
          fill={`${ascData.solid}22`}
          animate={{ r: [52, 66, 52], opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* ── Large ascendant glyph ── */}
        <text x={CX} y={CY - 10}
          textAnchor="middle" dominantBaseline="middle"
          style={{
            fontSize: '98px',
            fill: ascData.solid,
            fontWeight: '900',
            userSelect: 'none',
            filter: `drop-shadow(0 2px 14px ${ascData.solid}99)`,
          }}>
          {ascData.symbol}
        </text>

        {/* element tag */}
        <text x={CX} y={CY - 82}
          textAnchor="middle"
          style={{
            fontSize: '13px', fill: ascData.solid,
            fontWeight: '900', letterSpacing: '3.5px', userSelect: 'none',
          }}>
          ✦ {ascData.element.toUpperCase()} ✦
        </text>

        {/* sign name */}
        <text x={CX} y={CY + 54}
          textAnchor="middle"
          style={{
            fontSize: '20px', fill: C.primary,
            fontWeight: '900', fontFamily,
            letterSpacing: '3px', userSelect: 'none',
          }}>
          {ascendant.toUpperCase()}
        </text>

        {/* LAGNA */}
        <text x={CX} y={CY + 76}
          textAnchor="middle"
          style={{
            fontSize: '12px', fill: C.primary,
            fontWeight: '900', letterSpacing: '5px', userSelect: 'none',
            filter: `drop-shadow(0 0 3px ${C.secondary})`,
          }}>
          {language === 'si' ? 'ලග්නය' : language === 'ta' ? 'லக்னம்' : 'LAGNA'}
        </text>

        {/* ── Planets ── */}
        {Object.entries(byHouse).map(([hStr, housePlanets]) => {
          const hIdx = parseInt(hStr, 10) - 1;
          const mid  = hMid(hIdx);
          return housePlanets.map((planet, pIdx) => {
            const spread = (pIdx - (housePlanets.length - 1) / 2) * 14;
            const deg    = mid + spread;
            const plX    = px(R_PLAN, deg);
            const plY    = py(R_PLAN, deg);
            // Label placed radially outward from the disc, always outside the aura ring
            const lblX   = px(R_PLAN + 23, deg);
            const lblY   = py(R_PLAN + 23, deg);
            const degShort = planet.degree.split("'")[0]; // e.g. "14° 23"
            return (
              <Tooltip
                key={planet.name}
                title={`${translatePlanetName(planet.name, language)}: ${translateZodiacSign(planet.sign, language)} ${planet.degree} (${translateHouseLabel(planet.house, language)})`}
                arrow placement="top"
              >
                <g style={{ cursor: 'pointer' }} filter="url(#planetGlow)">
                  <circle cx={plX} cy={plY} r="17" fill={`${planet.color}28`} />
                  <circle cx={plX} cy={plY} r="13" fill="white" />
                  <circle cx={plX} cy={plY} r="11" fill={planet.color} stroke="white" strokeWidth="2" />
                  <text x={plX} y={plY}
                    textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: '10px', fill: '#ffffff', fontWeight: '900', userSelect: 'none' }}>
                    {planet.symbol}
                  </text>
                  <text x={lblX} y={lblY}
                    textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: '9px', fill: C.textPrimary, fontWeight: '800', fontFamily, userSelect: 'none' }}>
                    {translatePlanetName(planet.name, language).slice(0, 2)}
                  </text>
                  <text x={lblX} y={lblY + 11}
                    textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: '7.5px', fill: `${C.textPrimary}aa`, fontWeight: '600', userSelect: 'none' }}>
                    {degShort}
                  </text>
                </g>
              </Tooltip>
            );
          });
        })}
      </motion.svg>
    </Box>
  );
};

export default BirthChartWheel;

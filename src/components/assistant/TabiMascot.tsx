"use client";

import React, { useId } from "react";
import styles from "./assistant.module.css";

export const MASCOT_MOODS = [
  "sleeping", "waking", "idle", "listening", "thinking", "searching", "working",
  "excited", "bored", "suspicious", "angry", "drowsy", "happy", "curious",
  "confused", "surprised", "proud", "shy", "sad", "laughing", "scared",
  "playful", "celebrate",
] as const;
export type MascotMood = typeof MASCOT_MOODS[number];

type MouthKey = "smile" | "open" | "grin" | "o" | "frown" | "flat" | "wavy";
type BrowKey = "none" | "up" | "down" | "mixed";
type ArmPose = "down" | "up" | "wave";

interface MoodExpr {
  eyeL: number;
  eyeR: number;
  tilt: number;
  mouth: MouthKey;
  brow: BrowKey;
  blush: boolean;
  arms: ArmPose;
}

const MOOD_EXPRESSIONS: Record<MascotMood, MoodExpr> = {
  sleeping:   { eyeL: 0.15, eyeR: 0.15, tilt: 6,   mouth: "o",     brow: "none",  blush: false, arms: "down" },
  waking:     { eyeL: 1.2,  eyeR: 1.2,  tilt: -6,  mouth: "o",     brow: "up",    blush: false, arms: "down" },
  idle:       { eyeL: 1,    eyeR: 1,    tilt: 0,   mouth: "smile", brow: "none",  blush: false, arms: "down" },
  listening:  { eyeL: 1.1,  eyeR: 1.1,  tilt: -6,  mouth: "open",  brow: "up",    blush: false, arms: "down" },
  thinking:   { eyeL: 0.8,  eyeR: 0.9,  tilt: 8,   mouth: "flat",  brow: "mixed", blush: false, arms: "down" },
  searching:  { eyeL: 1.15, eyeR: 1.15, tilt: -8,  mouth: "flat",  brow: "up",    blush: false, arms: "down" },
  working:    { eyeL: 0.65, eyeR: 0.65, tilt: 0,   mouth: "flat",  brow: "down",  blush: false, arms: "down" },
  excited:    { eyeL: 0.75, eyeR: 0.75, tilt: -5,  mouth: "grin",  brow: "up",    blush: true,  arms: "wave" },
  bored:      { eyeL: 0.45, eyeR: 0.45, tilt: 9,   mouth: "flat",  brow: "down",  blush: false, arms: "down" },
  suspicious: { eyeL: 0.45, eyeR: 0.7,  tilt: -7,  mouth: "flat",  brow: "mixed", blush: false, arms: "down" },
  angry:      { eyeL: 0.55, eyeR: 0.55, tilt: 0,   mouth: "frown", brow: "down",  blush: false, arms: "down" },
  drowsy:     { eyeL: 0.15, eyeR: 0.15, tilt: 8,   mouth: "flat",  brow: "none",  blush: false, arms: "down" },
  happy:      { eyeL: 0.6,  eyeR: 0.6,  tilt: -3,  mouth: "open",  brow: "none",  blush: true,  arms: "up"   },
  curious:    { eyeL: 1.25, eyeR: 0.8,  tilt: -10, mouth: "smile", brow: "mixed", blush: false, arms: "down" },
  confused:   { eyeL: 0.6,  eyeR: 1.25, tilt: 11,  mouth: "wavy",  brow: "mixed", blush: false, arms: "down" },
  surprised:  { eyeL: 1.45, eyeR: 1.45, tilt: 0,   mouth: "o",     brow: "up",    blush: false, arms: "up"   },
  proud:      { eyeL: 0.8,  eyeR: 0.8,  tilt: -5,  mouth: "open",  brow: "none",  blush: true,  arms: "down" },
  shy:        { eyeL: 0.65, eyeR: 0.65, tilt: 12,  mouth: "smile", brow: "up",    blush: true,  arms: "down" },
  sad:        { eyeL: 0.65, eyeR: 0.65, tilt: 8,   mouth: "frown", brow: "up",    blush: false, arms: "down" },
  laughing:   { eyeL: 0.15, eyeR: 0.15, tilt: -5,  mouth: "grin",  brow: "none",  blush: true,  arms: "up"   },
  scared:     { eyeL: 1.4,  eyeR: 1.4,  tilt: 3,   mouth: "wavy",  brow: "up",    blush: false, arms: "up"   },
  playful:    { eyeL: 0.12, eyeR: 1,    tilt: -12, mouth: "grin",  brow: "mixed", blush: true,  arms: "wave" },
  celebrate:  { eyeL: 0.45, eyeR: 0.45, tilt: -8,  mouth: "grin",  brow: "up",    blush: true,  arms: "wave" },
};

const EYE_TILTS: Partial<Record<MascotMood, [number, number]>> = {
  suspicious: [4, -4],
  curious: [-4, 4],
  confused: [3, -6],
  surprised: [-2, 2],
  shy: [-6, 6],
  playful: [0, -8],
  angry: [8, -8],
};

const NO_BLINK: MascotMood[] = ["sleeping", "drowsy", "laughing"];
const CLOSED_MAX = 0.2;
const INK = "#241704";
const BLUSH = "#ff9db4";
const TONGUE = "#ff8fa0";
const ARM = "var(--tabi-accentDeep, #a87417)";
const OPEN_MOUTH_D = "M68 97 Q80 101 92 97 Q91.5 110 80 110.5 Q68.5 110 68 97 Z";
const GRIN_MOUTH_D = "M64 96 C71 104 89 104 96 96 C96 109 89 114 80 114 C71 114 64 109 64 96 Z";

interface TabiMascotProps {
  mood: MascotMood;
  paused?: boolean;
  size?: number;
  traveling?: boolean;
  faceDir?: -1 | 1;
}

export function TabiMascot({ mood, paused = false, size = 96, traveling = false, faceDir }: TabiMascotProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const effective: MascotMood = paused ? "idle" : mood;
  const expr = MOOD_EXPRESSIONS[effective] || MOOD_EXPRESSIONS.idle;
  const [lTilt, rTilt] = EYE_TILTS[effective] || [0, 0];
  const blink = !paused && !NO_BLINK.includes(effective);
  const waddling = traveling && !paused;
  const fx = waddling ? faceDir ?? 0 : 0;

  const eye = (cx: number, scale: number, t: number) => {
    if (scale <= CLOSED_MAX) {
      return (
        <path
          key={`eye-${cx}`}
          d={`M${cx - 7} 80 Q${cx} 87 ${cx + 7} 80`}
          fill="none"
          stroke={INK}
          strokeWidth={3.4}
          strokeLinecap="round"
        />
      );
    }
    return (
      <g
        key={`eye-${cx}`}
        className={blink ? styles.eyeBlink : undefined}
        style={{ transformOrigin: `${cx}px 81px` }}
      >
        <g
          style={{
            transformOrigin: `${cx}px 81px`,
            transform: `scaleY(${scale}) rotate(${t}deg)`,
            transition: paused ? "none" : "transform 0.3s ease",
          }}
        >
          <ellipse cx={cx} cy={81} rx={7} ry={12} fill={INK} />
          <ellipse cx={cx + 2.4} cy={76} rx={2.2} ry={3} fill="#ffffff" opacity={0.92} />
          <circle cx={cx + 3.6} cy={81.5} r={1.1} fill="#ffffff" opacity={0.75} />
        </g>
      </g>
    );
  };

  const mouths: Record<MouthKey, React.ReactNode> = {
    smile: (
      <path d="M70 99 Q80 106 90 99" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
    ),
    open: (
      <g>
        <path d={OPEN_MOUTH_D} fill={INK} />
        <ellipse cx={80} cy={107.5} rx={4.2} ry={2.4} fill={TONGUE} clipPath={`url(#${uid}-mopen)`} />
      </g>
    ),
    grin: (
      <g>
        <path d={GRIN_MOUTH_D} fill={INK} />
        <ellipse cx={80} cy={110.5} rx={4.8} ry={2.6} fill={TONGUE} clipPath={`url(#${uid}-mgrin)`} />
      </g>
    ),
    o: <ellipse cx={80} cy={102} rx={3.4} ry={4.2} fill={INK} />,
    frown: (
      <path d="M71 105 Q80 98 89 105" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
    ),
    flat: (
      <path d="M72 102 L88 102" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
    ),
    wavy: (
      <path
        d="M69 102 Q73 97 77 102 Q81 107 85 102 Q89 97 93 102"
        fill="none"
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
      />
    ),
  };

  const brows: Record<Exclude<BrowKey, "none">, React.ReactNode> = {
    up: (
      <g>
        <path d="M55 66 Q64 60 73 66" />
        <path d="M87 66 Q96 60 105 66" />
      </g>
    ),
    down: (
      <g>
        <path d="M56 61 L72 67" />
        <path d="M104 61 L88 67" />
      </g>
    ),
    mixed: (
      <g>
        <path d="M55 63 Q64 58 73 63" />
        <path d="M88 67 L104 65" />
      </g>
    ),
  };

  const armTransform = (dir: 1 | -1) =>
    `rotate(${expr.arms === "down" ? 0 : dir * 112}deg)`;

  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      data-mood={effective}
      data-paused={paused ? "true" : "false"}
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id={`${uid}-body`} cx="42%" cy="30%" r="75%">
          <stop offset="0%" stopColor="var(--tabi-accent, #e9b24c)" />
          <stop offset="55%" stopColor="var(--tabi-accent2, #d8a137)" />
          <stop offset="100%" stopColor="var(--tabi-accentDeep, #a87417)" />
        </radialGradient>
        <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id={`${uid}-shadow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(15,10,3,0.35)" />
          <stop offset="100%" stopColor="rgba(15,10,3,0)" />
        </radialGradient>
        <clipPath id={`${uid}-mopen`}>
          <path d={OPEN_MOUTH_D} />
        </clipPath>
        <clipPath id={`${uid}-mgrin`}>
          <path d={GRIN_MOUTH_D} />
        </clipPath>
      </defs>

      <g className={waddling ? styles.waddle : undefined}>
        <ellipse
          cx="80"
          cy="141"
          rx="43"
          ry="7"
          fill={`url(#${uid}-shadow)`}
          className={waddling ? styles.shadowSquash : undefined}
        />

        <g
          className={paused ? undefined : styles.breathe}
          style={{ transformOrigin: "80px 122px" }}
        >
          <g
            data-body
            style={{
              transformOrigin: "80px 122px",
              transform: paused ? "none" : `rotate(${expr.tilt}deg)`,
              transition: paused ? "none" : "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <rect x="68" y="20" width="24" height="14" rx="7" fill={`url(#${uid}-body)`} />
            <path
              d="M27 104C27 59 48 32 80 32s53 27 53 72c0 14-13 22-53 22s-53-8-53-22Z"
              fill={`url(#${uid}-body)`}
            />
            <ellipse
              cx="56"
              cy="62"
              rx="15"
              ry="24"
              fill={`url(#${uid}-shine)`}
              transform="rotate(-18 56 62)"
            />
            <rect x="19" y="115" width="122" height="14" rx="7" fill="var(--tabi-accentDeep, #a87417)" />

            <path
              d="M29 97 Q22 104 20 113"
              fill="none"
              stroke={ARM}
              strokeWidth={7}
              strokeLinecap="round"
              className={expr.arms === "wave" && !paused ? styles.armWave : undefined}
              style={
                {
                  "--arm-dir": 1,
                  transform: armTransform(1),
                  transformOrigin: "29px 97px",
                  transition: paused ? "none" : "transform 0.32s ease",
                } as React.CSSProperties
              }
            />
            <path
              d="M131 97 Q138 104 140 113"
              fill="none"
              stroke={ARM}
              strokeWidth={7}
              strokeLinecap="round"
              className={expr.arms === "wave" && !paused ? styles.armWave : undefined}
              style={
                {
                  "--arm-dir": -1,
                  transform: armTransform(-1),
                  transformOrigin: "131px 97px",
                  transition: paused ? "none" : "transform 0.32s ease",
                } as React.CSSProperties
              }
            />

            <g
              data-face
              fill={INK}
              style={{
                transformOrigin: "80px 88px",
                transform: fx ? `translate(${fx * 4}px, 0) rotate(${fx * 3}deg)` : undefined,
                transition: paused ? "none" : "transform 0.35s ease",
              }}
            >
              <g
                fill="none"
                stroke={INK}
                strokeWidth={3}
                strokeLinecap="round"
                style={{
                  opacity: expr.brow === "none" ? 0 : 1,
                  transition: paused ? "none" : "opacity 0.3s ease",
                }}
              >
                {expr.brow !== "none" ? brows[expr.brow] : null}
              </g>

              <g
                fill={BLUSH}
                style={{
                  opacity: expr.blush ? 0.55 : 0,
                  transition: paused ? "none" : "opacity 0.35s ease",
                }}
              >
                <ellipse cx={47} cy={94} rx={6.5} ry={3.6} transform="rotate(-8 47 94)" />
                <ellipse cx={113} cy={94} rx={6.5} ry={3.6} transform="rotate(8 113 94)" />
              </g>

              {eye(64, expr.eyeL, lTilt)}
              {eye(96, expr.eyeR, rTilt)}

              {mouths[expr.mouth]}
            </g>

            {effective === "sleeping" && (
              <g fill="var(--tabi-accentDeep, #a87417)">
                <text
                  x={106}
                  y={48}
                  fontSize={15}
                  fontWeight={800}
                  className={paused ? undefined : styles.zz}
                >
                  z
                </text>
                <text
                  x={122}
                  y={34}
                  fontSize={11}
                  fontWeight={800}
                  className={paused ? undefined : styles.zz}
                  style={{ animationDelay: "1.3s" }}
                >
                  z
                </text>
              </g>
            )}
          </g>
        </g>
      </g>
    </svg>
  );
}

export default TabiMascot;

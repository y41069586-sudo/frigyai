import { motion } from "framer-motion";

interface SpeedIconProps {
  selected: boolean;
}

/** Langsam-Tempo: Person auf Fahrrad – gleiches Layout-Schema wie Auto & Rakete */
export const AnimatedBicycle = ({ selected }: SpeedIconProps) => (
  <svg viewBox="0 0 80 50" className="w-16 h-12">
    <motion.g
      animate={{ x: selected ? [0, 2, 0] : 0 }}
      transition={{ duration: 0.3, repeat: selected ? Infinity : 0 }}
    >
      {/* Rahmen + Gabel */}
      <path
        d="M22 38 L34 24 L50 20 L56 38 L38 38 L22 38 Z"
        fill="currentColor"
        opacity={0.9}
      />
      <path
        d="M50 20 L58 38"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Lenker */}
      <path
        d="M48 20 L54 16"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Person: Kopf */}
      <circle
        cx="40"
        cy="13"
        r="5"
        fill="hsl(var(--background))"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Person: Oberkörper / Arme Richtung Lenker */}
      <path
        d="M40 18 L38 24 L46 21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.g>

    <motion.circle
      cx="22"
      cy="38"
      r="7"
      fill="hsl(var(--background))"
      stroke="currentColor"
      strokeWidth="3"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.35, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "22px 38px" }}
    />
    <motion.circle
      cx="58"
      cy="38"
      r="7"
      fill="hsl(var(--background))"
      stroke="currentColor"
      strokeWidth="3"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.35, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "58px 38px" }}
    />

    {selected && (
      <>
        <motion.line
          x1="0"
          y1="22"
          x2="8"
          y2="22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
        />
        <motion.line
          x1="0"
          y1="28"
          x2="10"
          y2="28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
        />
        <motion.line
          x1="0"
          y1="34"
          x2="6"
          y2="34"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
        />
      </>
    )}
  </svg>
);

/** @deprecated Nutze AnimatedBicycle – früher Schnecke-Emoji */
export const AnimatedSnail = AnimatedBicycle;

/** Mittleres Tempo: Motorrad – klar erkennbar, schnellere Räder + leichte Neigung */
export const AnimatedMotorcycle = ({ selected }: SpeedIconProps) => (
  <svg viewBox="0 0 92 54" className="w-16 h-12">
    <motion.g
      animate={{ x: selected ? [0, 1.5, 0] : 0, rotate: selected ? [-0.8, 0.8, -0.8] : 0 }}
      transition={{ duration: 0.35, repeat: selected ? Infinity : 0, ease: "easeInOut" }}
      style={{ transformOrigin: "46px 28px" }}
    >
      {/* Hinterrad */}
      <motion.g
        animate={{ rotate: selected ? 360 : 0 }}
        transition={{ duration: 0.22, repeat: selected ? Infinity : 0, ease: "linear" }}
        style={{ transformOrigin: "24px 40px" }}
      >
        <circle cx="24" cy="40" r="10" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="3" />
        <circle cx="24" cy="40" r="3.5" fill="currentColor" opacity={0.35} />
        <line x1="24" y1="30" x2="24" y2="50" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
        <line x1="14" y1="40" x2="34" y2="40" stroke="currentColor" strokeWidth="1.5" opacity={0.5} />
      </motion.g>
      {/* Vorderrad */}
      <motion.g
        animate={{ rotate: selected ? 360 : 0 }}
        transition={{ duration: 0.19, repeat: selected ? Infinity : 0, ease: "linear" }}
        style={{ transformOrigin: "70px 40px" }}
      >
        <circle cx="70" cy="40" r="8" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="2.8" />
        <circle cx="70" cy="40" r="3" fill="currentColor" opacity={0.35} />
        <line x1="70" y1="32" x2="70" y2="48" stroke="currentColor" strokeWidth="1.2" opacity={0.5} />
        <line x1="62" y1="40" x2="78" y2="40" stroke="currentColor" strokeWidth="1.2" opacity={0.5} />
      </motion.g>
      {/* Rahmen / Motorblock */}
      <path
        d="M24 40 L38 26 L58 22 L70 32 L70 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.92}
      />
      <path
        d="M38 26 L52 18 L62 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity={0.88}
      />
      <rect x="42" y="24" width="14" height="10" rx="2" fill="currentColor" opacity={0.25} />
      {/* Tank */}
      <path
        d="M48 20 Q56 16 62 22 L58 26 Q52 24 48 20"
        fill="currentColor"
        opacity={0.45}
      />
      {/* Lenker */}
      <path d="M62 22 L76 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M76 14 L80 12 M76 14 L79 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* Sitz */}
      <path d="M34 24 L42 22 L44 26 L36 28 Z" fill="currentColor" opacity={0.55} />
      {/* Fahrer-Kopf (Helm) */}
      <circle cx="54" cy="14" r="5" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="2" />
      {/* Auspuff */}
      <path
        d="M30 38 Q22 42 14 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.7}
      />
    </motion.g>
    {selected && (
      <>
        {[0, 1, 2].map((i) => (
          <motion.line
            key={i}
            x1="4"
            y1={18 + i * 8}
            x2="14"
            y2={18 + i * 8}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0, 0.9, 0], x1: [8, -4, -14], x2: [18, 4, -6] }}
            transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.12, ease: "easeOut" }}
          />
        ))}
      </>
    )}
  </svg>
);

export const AnimatedCar = ({ selected }: SpeedIconProps) => (
  <svg viewBox="0 0 80 50" className="w-16 h-12">
    <motion.g animate={{ x: selected ? [0, 2, 0] : 0 }} transition={{ duration: 0.3, repeat: selected ? Infinity : 0 }}>
      <path d="M10 35 L10 25 L20 25 L28 15 L55 15 L65 25 L75 25 L75 35 Z"
            fill="currentColor" opacity="0.9" />
      <path d="M30 16 L25 24 L40 24 L40 16 Z" fill="hsl(var(--background))" opacity="0.5" />
      <path d="M42 16 L42 24 L58 24 L52 16 Z" fill="hsl(var(--background))" opacity="0.5" />
    </motion.g>
    <motion.circle
      cx="22" cy="38" r="7"
      fill="hsl(var(--background))" stroke="currentColor" strokeWidth="3"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.3, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "22px 38px" }}
    />
    <motion.circle
      cx="60" cy="38" r="7"
      fill="hsl(var(--background))" stroke="currentColor" strokeWidth="3"
      animate={{ rotate: selected ? 360 : 0 }}
      transition={{ duration: 0.3, repeat: selected ? Infinity : 0, ease: "linear" }}
      style={{ transformOrigin: "60px 38px" }}
    />
    {selected && (
      <>
        <motion.line x1="0" y1="22" x2="8" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0 }} />
        <motion.line x1="0" y1="28" x2="10" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }} />
        <motion.line x1="0" y1="34" x2="6" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          animate={{ opacity: [0, 1, 0], x: [10, -5, -15] }}
          transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }} />
      </>
    )}
  </svg>
);

export const AnimatedRocket = ({ selected }: SpeedIconProps) => (
  <svg viewBox="0 0 60 80" className="w-12 h-16">
    <motion.g
      animate={{ y: selected ? [0, -3, 0] : 0 }}
      transition={{ duration: 0.5, repeat: selected ? Infinity : 0 }}
    >
      <path d="M30 5 C30 5 45 25 45 45 L45 55 L15 55 L15 45 C15 25 30 5 30 5" fill="currentColor" />
      <circle cx="30" cy="30" r="7" fill="hsl(var(--primary))" opacity="0.5" />
      <circle cx="30" cy="30" r="4" fill="hsl(var(--background))" />
      <path d="M15 45 L5 60 L15 55 Z" fill="currentColor" opacity="0.8" />
      <path d="M45 45 L55 60 L45 55 Z" fill="currentColor" opacity="0.8" />
    </motion.g>
    {selected && (
      <motion.g>
        <motion.path d="M22 56 L25 75 L30 65 L35 75 L38 56"
          fill="hsl(45, 100%, 55%)"
          animate={{ d: ["M22 56 L25 75 L30 65 L35 75 L38 56", "M22 56 L25 70 L30 78 L35 70 L38 56", "M22 56 L25 75 L30 65 L35 75 L38 56"] }}
          transition={{ duration: 0.2, repeat: Infinity }} />
        <motion.path d="M25 56 L28 68 L30 60 L32 68 L35 56"
          fill="hsl(25, 100%, 55%)"
          animate={{ d: ["M25 56 L28 68 L30 60 L32 68 L35 56", "M25 56 L28 62 L30 70 L32 62 L35 56", "M25 56 L28 68 L30 60 L32 68 L35 56"] }}
          transition={{ duration: 0.15, repeat: Infinity }} />
      </motion.g>
    )}
  </svg>
);

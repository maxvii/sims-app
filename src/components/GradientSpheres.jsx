'use client'

/**
 * Elegant abstract gradient spheres — Genesis-inspired iridescent orbs.
 * Place inside a relative/overflow-hidden container.
 */
export default function GradientSpheres({ variant = 'default' }) {
  const configs = {
    // Dashboard hero — big bold spheres
    default: (
      <>
        {/* Large iridescent sphere — top right */}
        <div
          className="absolute -top-16 -right-16 w-[220px] h-[220px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(186,230,253,0.7) 0%, rgba(196,181,253,0.5) 35%, rgba(252,211,225,0.4) 60%, rgba(186,230,253,0.15) 85%, transparent 100%)',
            boxShadow: 'inset 6px 6px 30px rgba(255,255,255,0.7), inset -4px -4px 20px rgba(196,181,253,0.3), 0 4px 30px rgba(196,181,253,0.15)',
            opacity: 0.85,
          }}
        />
        {/* Medium sphere — bottom left */}
        <div
          className="absolute -bottom-10 -left-10 w-[160px] h-[160px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 25%, rgba(252,211,225,0.7) 0%, rgba(196,181,253,0.4) 40%, rgba(186,230,253,0.3) 70%, transparent 100%)',
            boxShadow: 'inset 5px 5px 25px rgba(255,255,255,0.65), inset -3px -3px 15px rgba(252,211,225,0.25), 0 4px 25px rgba(252,211,225,0.1)',
            opacity: 0.75,
          }}
        />
        {/* Small accent sphere — floating center-right */}
        <div
          className="absolute top-[40%] right-[18%] w-[50px] h-[50px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(186,230,253,0.8) 0%, rgba(196,181,253,0.5) 50%, rgba(252,211,225,0.2) 80%, transparent 100%)',
            boxShadow: 'inset 3px 3px 12px rgba(255,255,255,0.7), 0 2px 12px rgba(186,230,253,0.15)',
            opacity: 0.7,
          }}
        />
        {/* Tiny orb — top left area */}
        <div
          className="absolute top-[20%] left-[12%] w-[28px] h-[28px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(252,211,225,0.7) 0%, rgba(196,181,253,0.4) 60%, transparent 100%)',
            boxShadow: 'inset 2px 2px 8px rgba(255,255,255,0.6)',
            opacity: 0.6,
          }}
        />
      </>
    ),

    // Compact variant — for inner page headers
    compact: (
      <>
        {/* Medium sphere — top right */}
        <div
          className="absolute -top-10 -right-10 w-[150px] h-[150px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(186,230,253,0.65) 0%, rgba(196,181,253,0.45) 40%, rgba(252,211,225,0.3) 70%, transparent 100%)',
            boxShadow: 'inset 5px 5px 25px rgba(255,255,255,0.65), inset -3px -3px 15px rgba(196,181,253,0.2), 0 3px 20px rgba(196,181,253,0.1)',
            opacity: 0.8,
          }}
        />
        {/* Small sphere — bottom left */}
        <div
          className="absolute -bottom-6 -left-6 w-[100px] h-[100px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 25%, rgba(252,211,225,0.6) 0%, rgba(186,230,253,0.4) 50%, transparent 100%)',
            boxShadow: 'inset 4px 4px 18px rgba(255,255,255,0.6), 0 3px 15px rgba(252,211,225,0.1)',
            opacity: 0.7,
          }}
        />
        {/* Tiny accent */}
        <div
          className="absolute top-[30%] right-[12%] w-[30px] h-[30px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(186,230,253,0.7) 0%, rgba(196,181,253,0.4) 60%, transparent 100%)',
            boxShadow: 'inset 2px 2px 8px rgba(255,255,255,0.6)',
            opacity: 0.6,
          }}
        />
      </>
    ),
  }

  return configs[variant] || configs.default
}

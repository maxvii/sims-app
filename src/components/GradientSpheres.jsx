'use client'

/**
 * Elegant abstract gradient spheres — Violet Dusk palette.
 * Place inside a relative/overflow-hidden container.
 */
export default function GradientSpheres({ variant = 'default' }) {
  const configs = {
    default: (
      <>
        <div
          className="absolute -top-16 -right-16 w-[220px] h-[220px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(147,80,115,0.35) 0%, rgba(80,45,85,0.25) 35%, rgba(246,219,192,0.2) 60%, transparent 100%)',
            boxShadow: 'inset 6px 6px 30px rgba(248,244,233,0.3), inset -4px -4px 20px rgba(80,45,85,0.15), 0 4px 30px rgba(80,45,85,0.08)',
            opacity: 0.8,
          }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-[160px] h-[160px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 25%, rgba(246,219,192,0.4) 0%, rgba(147,80,115,0.25) 40%, rgba(80,45,85,0.15) 70%, transparent 100%)',
            boxShadow: 'inset 5px 5px 25px rgba(248,244,233,0.3), 0 4px 25px rgba(246,219,192,0.08)',
            opacity: 0.7,
          }}
        />
        <div
          className="absolute top-[40%] right-[18%] w-[50px] h-[50px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(246,219,192,0.5) 0%, rgba(147,80,115,0.3) 50%, transparent 80%)',
            boxShadow: 'inset 3px 3px 12px rgba(248,244,233,0.4)',
            opacity: 0.6,
          }}
        />
        <div
          className="absolute top-[20%] left-[12%] w-[28px] h-[28px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(147,80,115,0.4) 0%, rgba(246,219,192,0.25) 60%, transparent 100%)',
            boxShadow: 'inset 2px 2px 8px rgba(248,244,233,0.35)',
            opacity: 0.5,
          }}
        />
      </>
    ),
    compact: (
      <>
        <div
          className="absolute -top-10 -right-10 w-[150px] h-[150px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(147,80,115,0.3) 0%, rgba(80,45,85,0.2) 40%, rgba(246,219,192,0.15) 70%, transparent 100%)',
            boxShadow: 'inset 5px 5px 25px rgba(248,244,233,0.3), 0 3px 20px rgba(80,45,85,0.06)',
            opacity: 0.75,
          }}
        />
        <div
          className="absolute -bottom-6 -left-6 w-[100px] h-[100px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 40% 25%, rgba(246,219,192,0.35) 0%, rgba(147,80,115,0.2) 50%, transparent 100%)',
            boxShadow: 'inset 4px 4px 18px rgba(248,244,233,0.3)',
            opacity: 0.65,
          }}
        />
        <div
          className="absolute top-[30%] right-[12%] w-[30px] h-[30px] rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, rgba(246,219,192,0.45) 0%, rgba(147,80,115,0.25) 60%, transparent 100%)',
            boxShadow: 'inset 2px 2px 8px rgba(248,244,233,0.35)',
            opacity: 0.55,
          }}
        />
      </>
    ),
  }

  return configs[variant] || configs.default
}

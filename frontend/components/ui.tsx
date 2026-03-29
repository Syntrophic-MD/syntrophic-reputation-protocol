import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  glow?: 'blue' | 'green' | 'none'
  hover?: boolean
  style?: React.CSSProperties
}

export function GlassCard({
  children,
  className,
  elevated = false,
  glow = 'none',
  hover = false,
  style,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        elevated ? 'glass-elevated' : 'glass-card',
        glow === 'blue' && 'glow-blue',
        glow === 'green' && 'glow-green',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.15]',
        className
      )}
      style={style}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  accent?: 'blue' | 'green' | 'white'
}

export function StatCard({ label, value, sub, accent = 'white' }: StatCardProps) {
  const accentColor = {
    blue: 'var(--primary)',
    green: 'var(--verified)',
    white: 'var(--foreground)',
  }[accent]

  return (
    <GlassCard className="p-4" hover>
      <p className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
        {label}
      </p>
      <p className="stat-number text-2xl font-bold tracking-tight" style={{ color: accentColor }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {sub}
        </p>
      )}
    </GlassCard>
  )
}

interface TrustBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function TrustBadge({ score, size = 'md' }: TrustBadgeProps) {
  const radius = size === 'sm' ? 18 : size === 'md' ? 22 : 28
  const stroke = size === 'sm' ? 2.5 : 3
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference
  const dim = (radius + stroke + 4) * 2
  const center = dim / 2

  const color =
    score >= 80 ? 'var(--verified)' : score >= 50 ? 'var(--accent)' : 'var(--primary)'

  const textSize = size === 'sm' ? '9px' : size === 'md' ? '11px' : '13px'

  return (
    <svg width={dim} height={dim} className="trust-ring" aria-label={`Trust score: ${score}`}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={color}
        fontSize={textSize}
        fontWeight="700"
        fontFamily="var(--font-inter)"
      >
        {score}
      </text>
    </svg>
  )
}

interface AgentAvatarProps {
  name: string
  address: string
  size?: number
}

export function AgentAvatar({ name, address, size = 40 }: AgentAvatarProps) {
  // Generate deterministic color from address
  const hue = parseInt(address.slice(2, 6), 16) % 360
  const hue2 = (hue + 60) % 360

  const initials = name
    .split(/[\s-_]/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className="rounded-xl flex items-center justify-center flex-shrink-0 font-semibold"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue}, 80%, 40%) 0%, hsl(${hue2}, 80%, 50%) 100%)`,
        fontSize: size * 0.35,
        color: 'white',
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08)`,
      }}
      aria-label={`Avatar for ${name}`}
    >
      {initials || '?'}
    </div>
  )
}

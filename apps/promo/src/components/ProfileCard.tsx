import {theme} from '../theme';

type Props = {
  name: string;
  role: string;
  location?: string;
  initial: string;
  gradient: [string, string];
  width?: number;
  height?: number;
  badges?: string[];
};

export const ProfileCard: React.FC<Props> = ({
  name,
  role,
  location,
  initial,
  gradient,
  width = 880,
  height = 1280,
  badges,
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 36,
        overflow: 'hidden',
        position: 'relative',
        background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
        boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.18)',
          fontSize: 520,
          fontWeight: 900,
          fontFamily: '-apple-system, sans-serif',
        }}
      >
        {initial}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '55%',
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 70%, rgba(0,0,0,0.9) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 40,
          right: 40,
          bottom: 48,
          color: '#fff',
          fontFamily: '-apple-system, sans-serif',
        }}
      >
        {badges && (
          <div style={{display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap'}}>
            {badges.map((b) => (
              <div
                key={b}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.16)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  borderRadius: 999,
                  fontSize: 26,
                  fontWeight: 500,
                }}
              >
                {b}
              </div>
            ))}
          </div>
        )}
        <div style={{fontSize: 78, fontWeight: 700, letterSpacing: -1.5, marginBottom: 8}}>
          {name}
        </div>
        <div style={{fontSize: 36, color: 'rgba(255,255,255,0.85)', fontWeight: 500}}>
          {role}
          {location ? ` · ${location}` : ''}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 32,
          right: 32,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 28,
        }}
      >
        ⋯
      </div>
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 32,
          display: 'flex',
          gap: 6,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 60,
              height: 5,
              borderRadius: 3,
              background: i === 0 ? '#fff' : 'rgba(255,255,255,0.35)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

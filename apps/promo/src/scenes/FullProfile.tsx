import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';
import {StatusBar} from '../components/StatusBar';

export const FullProfile: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const expand = spring({frame, fps, config: {damping: 18, stiffness: 70}});
  const expandScale = interpolate(expand, [0, 1], [0.85, 1]);
  const expandOpacity = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});

  const scrollStart = 30;
  const scrollEnd = 108;
  const scrollY = interpolate(frame, [scrollStart, scrollEnd], [0, -1100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: '#0F1115',
        opacity: expandOpacity,
        transform: `scale(${expandScale})`,
      }}
    >
      <StatusBar />

      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 40,
          zIndex: 10,
          width: 64,
          height: 64,
          borderRadius: 999,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 36,
        }}
      >
        ‹
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${scrollY}px)`,
        }}
      >
        <div
          style={{
            width: '100%',
            height: 1100,
            background: 'linear-gradient(135deg, #0080FF, #7C3AED)',
            position: 'relative',
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
              fontSize: 620,
              fontWeight: 900,
              fontFamily: '-apple-system, sans-serif',
            }}
          >
            M
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '45%',
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(15,17,21,0.95) 100%)',
            }}
          />
        </div>

        <div style={{padding: '0 48px', marginTop: -160, position: 'relative', zIndex: 2}}>
          <div
            style={{
              fontFamily: 'Arches, serif',
              fontStyle: 'italic',
              fontSize: 130,
              color: '#fff',
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            Maya Chen
          </div>
          <div
            style={{
              color: '#9CA3AF',
              fontSize: 36,
              fontFamily: '-apple-system, sans-serif',
              marginTop: 16,
            }}
          >
            Visual Artist · Brooklyn, NY
          </div>

          <div style={{display: 'flex', gap: 14, marginTop: 30, flexWrap: 'wrap'}}>
            {['illustration', 'motion', 'branding', 'collage'].map((b) => (
              <div
                key={b}
                style={{
                  padding: '14px 26px',
                  background: 'rgba(0,128,255,0.15)',
                  border: '1px solid rgba(0,128,255,0.35)',
                  borderRadius: 999,
                  color: '#60A5FA',
                  fontSize: 28,
                  fontFamily: '-apple-system, sans-serif',
                  fontWeight: 500,
                }}
              >
                {b}
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 40,
              color: 'rgba(255,255,255,0.85)',
              fontSize: 32,
              fontFamily: '-apple-system, sans-serif',
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            Building weird, warm visual worlds. Always down for mixed-media
            collabs — illustration, motion, and anything that moves.
          </div>

          <div style={{display: 'flex', gap: 20, marginTop: 40}}>
            <div
              style={{
                flex: 1,
                padding: '28px',
                background: 'linear-gradient(135deg, #0080FF, #0055B3)',
                borderRadius: 20,
                color: '#fff',
                fontSize: 32,
                fontFamily: '-apple-system, sans-serif',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Message
            </div>
            <div
              style={{
                width: 100,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20,
                color: '#fff',
                fontSize: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ♥
            </div>
          </div>

          <div
            style={{
              marginTop: 60,
              color: '#fff',
              fontSize: 42,
              fontFamily: '-apple-system, sans-serif',
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            Recent work
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            {[
              ['#F472B6', '#DB2777'],
              ['#FBBF24', '#F59E0B'],
              ['#34D399', '#059669'],
              ['#60A5FA', '#2563EB'],
              ['#A78BFA', '#7C3AED'],
              ['#F87171', '#DC2626'],
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 20,
                  background: `linear-gradient(135deg, ${c[0]}, ${c[1]})`,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                }}
              />
            ))}
          </div>

          <div style={{height: 200}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

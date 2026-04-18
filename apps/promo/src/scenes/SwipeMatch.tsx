import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';
import {StatusBar} from '../components/StatusBar';
import {ProfileCard} from '../components/ProfileCard';
import {TabBar} from './DiscoverStack';
import {LogoGlyph} from '../components/Logo';

export const SwipeMatch: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const swipeStart = 8;
  const swipeEnd = 34;
  const swipeX = interpolate(frame, [swipeStart, swipeEnd], [0, 1600], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const swipeRot = interpolate(frame, [swipeStart, swipeEnd], [0, 35], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const likeOpacity = interpolate(frame, [swipeStart, swipeStart + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const matchStart = 36;
  const matchSpring = spring({
    frame: frame - matchStart,
    fps,
    config: {damping: 11, stiffness: 100},
  });
  const overlayOpacity = interpolate(frame, [matchStart, matchStart + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const matchScale = interpolate(matchSpring, [0, 1], [0.4, 1]);

  const confettiSeed = React.useMemo(() => {
    return Array.from({length: 40}, (_, i) => ({
      id: i,
      x: Math.random() * 1080,
      delay: Math.random() * 15,
      color: ['#0080FF', '#F472B6', '#FBBF24', '#10B981', '#7C3AED'][i % 5],
      size: 18 + Math.random() * 22,
      driftX: (Math.random() - 0.5) * 400,
    }));
  }, []);

  return (
    <AbsoluteFill style={{background: '#0F1115'}}>
      <StatusBar />

      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            transform: 'translateY(40px) scale(0.94)',
            opacity: 0.55,
          }}
        >
          <ProfileCard
            name="Jordan"
            role="Designer"
            initial="J"
            gradient={['#DB2777', '#7C3AED']}
          />
        </div>

        <div
          style={{
            transform: `translateX(${swipeX}px) rotate(${swipeRot}deg)`,
            position: 'relative',
          }}
        >
          <ProfileCard
            name="Maya Chen"
            role="Visual Artist"
            location="Brooklyn"
            initial="M"
            gradient={['#0080FF', '#7C3AED']}
            badges={['illustration', 'motion']}
          />
          <div
            style={{
              position: 'absolute',
              top: 120,
              left: 80,
              padding: '16px 36px',
              border: '6px solid #10B981',
              borderRadius: 16,
              color: '#10B981',
              fontFamily: '-apple-system, sans-serif',
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: 3,
              transform: 'rotate(-18deg)',
              opacity: likeOpacity,
              background: 'rgba(16,185,129,0.08)',
            }}
          >
            LIKE
          </div>
        </div>
      </div>

      <TabBar active="discover" />

      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(0,128,255,0.35) 0%, rgba(15,17,21,0.97) 60%)',
          opacity: overlayOpacity,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        {confettiSeed.map((c) => {
          const localFrame = frame - matchStart - c.delay;
          if (localFrame < 0) return null;
          const y = interpolate(localFrame, [0, 80], [-200, 2200], {extrapolateRight: 'clamp'});
          const x = c.x + interpolate(localFrame, [0, 80], [0, c.driftX]);
          const rot = localFrame * 8;
          return (
            <div
              key={c.id}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: c.size,
                height: c.size * 0.4,
                background: c.color,
                transform: `rotate(${rot}deg)`,
                borderRadius: 2,
              }}
            />
          );
        })}

        <div style={{transform: `scale(${matchScale})`, textAlign: 'center'}}>
          <div
            style={{
              fontFamily: 'Arches, serif',
              fontStyle: 'italic',
              fontSize: 180,
              color: '#fff',
              textShadow: '0 0 60px rgba(0,128,255,0.8)',
              letterSpacing: -3,
              lineHeight: 1,
            }}
          >
            it&rsquo;s a match!
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontFamily: '-apple-system, sans-serif',
              fontSize: 38,
              marginTop: 30,
              letterSpacing: 2,
            }}
          >
            you and Maya both liked each other
          </div>

          <div
            style={{
              marginTop: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 40,
            }}
          >
            <Avatar initial="Y" colors={['#FBBF24', '#F59E0B']} />
            <div>
              <LogoGlyph size={220} />
            </div>
            <Avatar initial="M" colors={['#0080FF', '#7C3AED']} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Avatar: React.FC<{initial: string; colors: [string, string]}> = ({initial, colors}) => {
  return (
    <div
      style={{
        width: 220,
        height: 220,
        borderRadius: 999,
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
        border: '6px solid #fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 120,
        fontWeight: 700,
        fontFamily: '-apple-system, sans-serif',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      {initial}
    </div>
  );
};

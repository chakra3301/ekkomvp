import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring} from 'remotion';
import {LogoGlyph, Wordmark} from '../components/Logo';

export const LogoOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({frame, fps, config: {damping: 16, stiffness: 70}});
  const glyphScale = interpolate(enter, [0, 1], [0.6, 1]);
  const glyphOpacity = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp'});

  const wordmarkStart = 16;
  const wordmarkSpring = spring({
    frame: frame - wordmarkStart,
    fps,
    config: {damping: 16, stiffness: 90},
  });
  const wordmarkOpacity = interpolate(wordmarkSpring, [0, 1], [0, 1]);
  const wordmarkY = interpolate(wordmarkSpring, [0, 1], [40, 0]);

  const taglineStart = 34;
  const taglineOpacity = interpolate(frame, [taglineStart, taglineStart + 14], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const urlOpacity = interpolate(frame, [50, 66], [0, 1], {extrapolateRight: 'clamp'});

  const fadeOut = interpolate(frame, [80, 90], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = 1 + Math.sin((frame / fps) * 1.4) * 0.015;

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 50% 50%, #0a2a55 0%, #050e20 55%, #020510 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          transform: `scale(${glyphScale * pulse})`,
          opacity: glyphOpacity,
          filter: 'drop-shadow(0 0 140px rgba(0,128,255,0.65))',
        }}
      >
        <LogoGlyph size={780} />
      </div>

      <div
        style={{
          marginTop: 20,
          opacity: wordmarkOpacity,
          transform: `translateY(${wordmarkY}px)`,
        }}
      >
        <Wordmark size={240} />
      </div>

      <div
        style={{
          marginTop: 32,
          opacity: taglineOpacity,
          color: 'rgba(255,255,255,0.75)',
          fontFamily: '-apple-system, sans-serif',
          fontSize: 38,
          letterSpacing: 3,
          fontWeight: 300,
          textAlign: 'center',
        }}
      >
        where creatives connect
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 140,
          opacity: urlOpacity,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: '-apple-system, sans-serif',
          fontSize: 30,
          letterSpacing: 4,
        }}
      >
        ekkoconnect.app
      </div>
    </AbsoluteFill>
  );
};

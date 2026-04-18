import {Img, staticFile} from 'remotion';

export const LogoGlyph: React.FC<{size: number; tint?: 'white' | 'chrome' | 'black'}> = ({
  size,
  tint = 'white',
}) => {
  const src = tint === 'chrome' ? 'logo/glyph.png' : 'logo/glyph-flat.png';
  const height = tint === 'chrome' ? size : size * (134 / 384);
  const filter = tint === 'white' ? 'brightness(0) invert(1)' : undefined;
  return (
    <Img
      src={staticFile(src)}
      style={{
        width: size,
        height,
        objectFit: 'contain',
        filter,
      }}
    />
  );
};

export const AppIcon: React.FC<{size: number; rounded?: boolean}> = ({size, rounded = true}) => {
  return (
    <Img
      src={staticFile('logo/app-icon.png')}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: rounded ? size * 0.23 : 0,
      }}
    />
  );
};

export const Wordmark: React.FC<{size: number; color?: string}> = ({size, color = '#FFFFFF'}) => {
  return (
    <div
      style={{
        fontFamily: 'Arches, serif',
        fontStyle: 'italic',
        fontSize: size,
        color,
        letterSpacing: -size * 0.02,
        lineHeight: 1,
      }}
    >
      ekko
    </div>
  );
};

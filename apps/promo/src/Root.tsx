import {Composition, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {EkkoPromo} from './Promo';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './theme';

loadFont({
  family: 'Arches',
  url: staticFile('fonts/ArchesRegular.ttf'),
  format: 'truetype',
}).catch(() => undefined);

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="EkkoPromo"
      component={EkkoPromo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

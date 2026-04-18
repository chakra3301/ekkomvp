import {AbsoluteFill, Sequence} from 'remotion';
import {theme, scenes} from './theme';
import {HomeScreen} from './scenes/HomeScreen';
import {LogoIntro} from './scenes/LogoIntro';
import {DiscoverStack} from './scenes/DiscoverStack';
import {FullProfile} from './scenes/FullProfile';
import {SwipeMatch} from './scenes/SwipeMatch';
import {ChatCollab} from './scenes/ChatCollab';
import {LogoOutro} from './scenes/LogoOutro';

export const EkkoPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: theme.bg}}>
      <Sequence from={scenes.home.from} durationInFrames={scenes.home.duration} name="Home">
        <HomeScreen />
      </Sequence>
      <Sequence from={scenes.logoIntro.from} durationInFrames={scenes.logoIntro.duration} name="Logo Intro">
        <LogoIntro />
      </Sequence>
      <Sequence from={scenes.discover.from} durationInFrames={scenes.discover.duration} name="Discover">
        <DiscoverStack />
      </Sequence>
      <Sequence from={scenes.profile.from} durationInFrames={scenes.profile.duration} name="Profile">
        <FullProfile />
      </Sequence>
      <Sequence from={scenes.swipe.from} durationInFrames={scenes.swipe.duration} name="Swipe + Match">
        <SwipeMatch />
      </Sequence>
      <Sequence from={scenes.chat.from} durationInFrames={scenes.chat.duration} name="Chat">
        <ChatCollab />
      </Sequence>
      <Sequence from={scenes.outro.from} durationInFrames={scenes.outro.duration} name="Outro">
        <LogoOutro />
      </Sequence>
    </AbsoluteFill>
  );
};

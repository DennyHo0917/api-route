import "./index.css";
import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import TwitterAd from "./TwitterAd";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <MyComposition />
      <Composition id="ApiRouteTwitterAd15s" component={TwitterAd} durationInFrames={450} fps={30} width={1920} height={1080} />
    </>
  );
};

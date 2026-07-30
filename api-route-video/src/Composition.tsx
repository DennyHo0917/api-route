import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

const COLORS = {
  bg: "#FAF6F1",
  paper: "#FFFDF9",
  ink: "#3D3024",
  muted: "#756454",
  faint: "#A99786",
  line: "#E8DDD0",
  orange: "#D97757",
  orangeDark: "#B85D3C",
  orangeSoft: "#F7DED3",
  green: "#2F855A",
  greenSoft: "#DDEDE5",
  red: "#BE4141",
  redSoft: "#F5DEDE",
};

const SPEED = 1400 / 900;
const compressedFrame = (frame: number) => Math.round(frame / SPEED);

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const fade = (frame: number, start: number, duration = 22) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const fadeWindow = (
  frame: number,
  start: number,
  end: number,
  edge = 18,
) =>
  interpolate(
    frame,
    [start, start + edge, end - edge, end],
    [0, 1, 1, 0],
    clamp,
  );

type Point = { x: number; y: number };

const quadraticPoint = (from: Point, control: Point, to: Point, progress: number) => {
  const inverse = 1 - progress;
  return {
    x:
      inverse * inverse * from.x +
      2 * inverse * progress * control.x +
      progress * progress * to.x,
    y:
      inverse * inverse * from.y +
      2 * inverse * progress * control.y +
      progress * progress * to.y,
  };
};

const USERS = [
  { x: 150, y: 220 },
  { x: 225, y: 335 },
  { x: 145, y: 465 },
  { x: 260, y: 555 },
];

const PROVIDERS = [
  { x: 1085, y: 205, label: "P01" },
  { x: 1255, y: 220, label: "P02" },
  { x: 1045, y: 350, label: "P03" },
  { x: 1285, y: 365, label: "P04" },
  { x: 1090, y: 510, label: "P05" },
  { x: 1260, y: 525, label: "P06" },
];

const MODELS = [
  { x: 1690, y: 165, label: "OpenAI", mark: "O" },
  { x: 1690, y: 260, label: "Claude", mark: "C" },
  { x: 1690, y: 355, label: "Gemini", mark: "G" },
  { x: 1690, y: 450, label: "DeepSeek", mark: "D" },
  { x: 1690, y: 545, label: "Grok", mark: "X" },
];

const Brand: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      top: 48,
      left: 74,
      display: "flex",
      alignItems: "center",
      gap: 18,
      color: COLORS.ink,
      opacity,
      zIndex: 30,
    }}
  >
    <svg width="58" height="58" viewBox="0 0 58 58">
      <rect
        x="2"
        y="2"
        width="54"
        height="54"
        rx="16"
        fill={COLORS.paper}
        stroke={COLORS.orange}
        strokeWidth="2"
      />
      <path
        d="M17 29H31M31 29L41 18M31 29L41 40"
        fill="none"
        stroke={COLORS.orange}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {[{ x: 15, y: 29 }, { x: 42, y: 17 }, { x: 42, y: 41 }].map(
        (point) => (
          <circle
            key={`${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r="5"
            fill={COLORS.paper}
            stroke={COLORS.orange}
            strokeWidth="3"
          />
        ),
      )}
    </svg>
    <div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em" }}>
        API-Route
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 17,
          fontWeight: 700,
          color: COLORS.faint,
          letterSpacing: "0.16em",
        }}
      >
        UNIFIED AI API
      </div>
    </div>
  </div>
);

const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(circle at 55% 35%, rgba(217,119,87,0.10), transparent 34%), #FAF6F1",
    }}
  >
    <AbsoluteFill
      style={{
        opacity: 0.38,
        backgroundImage:
          "linear-gradient(rgba(117,100,84,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(117,100,84,0.10) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage:
          "linear-gradient(to bottom, transparent, black 15%, black 84%, transparent)",
      }}
    />
  </AbsoluteFill>
);

const PersonIcon: React.FC<{ color?: string }> = ({ color = COLORS.orange }) => (
  <svg width="42" height="42" viewBox="0 0 42 42">
    <circle cx="21" cy="13" r="7" fill={color} opacity="0.92" />
    <path
      d="M9 34c1-8 5-12 12-12s11 4 12 12"
      fill="none"
      stroke={color}
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
);

const UserNode: React.FC<{
  x: number;
  y: number;
  opacity: number;
  scale: number;
  compact?: boolean;
}> = ({ x, y, opacity, scale, compact = false }) => (
  <div
    style={{
      position: "absolute",
      left: x - (compact ? 39 : 63),
      top: y - (compact ? 39 : 42),
      width: compact ? 78 : 126,
      height: compact ? 78 : 84,
      borderRadius: compact ? 39 : 42,
      border: `2px solid ${COLORS.line}`,
      background: "rgba(255,253,249,0.94)",
      boxShadow: "0 16px 34px rgba(82,61,43,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity,
      scale,
    }}
  >
    <PersonIcon />
  </div>
);

const CoreNode: React.FC<{
  x: number;
  y: number;
  label: string;
  sublabel: string;
  opacity: number;
  scale: number;
  website?: boolean;
}> = ({ x, y, label, sublabel, opacity, scale, website = false }) => (
  <div
    style={{
      position: "absolute",
      left: x - 104,
      top: y - 104,
      width: 208,
      height: 208,
      borderRadius: 104,
      border: `3px solid ${website ? COLORS.green : COLORS.orange}`,
      background: website
        ? "radial-gradient(circle at 50% 20%, rgba(47,133,90,0.15), transparent 55%), rgba(255,253,249,0.97)"
        : "radial-gradient(circle at 50% 20%, rgba(217,119,87,0.17), transparent 55%), rgba(255,253,249,0.97)",
      boxShadow: `0 28px 70px ${
        website ? "rgba(47,133,90,0.14)" : "rgba(184,93,60,0.16)"
      }`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity,
      scale,
      color: COLORS.ink,
      textAlign: "center",
    }}
  >
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: 20,
        border: `2px solid ${website ? COLORS.green : COLORS.orange}`,
        background: website ? COLORS.greenSoft : COLORS.orangeSoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 28,
        fontWeight: 900,
        color: website ? COLORS.green : COLORS.orangeDark,
      }}
    >
      {website ? "W" : "A"}
    </div>
    <div style={{ marginTop: 14, fontSize: 30, fontWeight: 900 }}>{label}</div>
    <div
      style={{
        marginTop: 5,
        fontSize: 18,
        fontWeight: 700,
        color: COLORS.muted,
        letterSpacing: "0.08em",
      }}
    >
      {sublabel}
    </div>
  </div>
);

const ProviderNode: React.FC<{
  x: number;
  y: number;
  label: string;
  opacity: number;
  scale: number;
  failed?: boolean;
  small?: boolean;
}> = ({ x, y, label, opacity, scale, failed = false, small = false }) => {
  const size = small ? 58 : 78;
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        border: `3px solid ${failed ? COLORS.red : COLORS.orange}`,
        background: failed ? COLORS.redSoft : COLORS.paper,
        boxShadow: failed
          ? "0 0 0 12px rgba(190,65,65,0.10)"
          : "0 14px 32px rgba(82,61,43,0.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: failed ? COLORS.red : COLORS.orangeDark,
        fontSize: small ? 17 : 21,
        fontWeight: 900,
        opacity,
        scale,
      }}
    >
      {failed ? "×" : label}
    </div>
  );
};

const ModelNode: React.FC<{
  x: number;
  y: number;
  label: string;
  mark: string;
  opacity: number;
  scale: number;
}> = ({ x, y, label, mark, opacity, scale }) => (
  <div
    style={{
      position: "absolute",
      left: x - 94,
      top: y - 37,
      width: 188,
      height: 74,
      borderRadius: 37,
      border: `2px solid ${COLORS.line}`,
      background: "rgba(255,253,249,0.96)",
      boxShadow: "0 14px 32px rgba(82,61,43,0.08)",
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "0 18px",
      opacity,
      scale,
      color: COLORS.ink,
      fontSize: 24,
      fontWeight: 800,
    }}
  >
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        background: COLORS.orangeSoft,
        color: COLORS.orangeDark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
      }}
    >
      {mark}
    </div>
    {label}
  </div>
);

const NetworkLine: React.FC<{
  from: Point;
  to: Point;
  control?: Point;
  opacity: number;
  color?: string;
  width?: number;
  dashed?: boolean;
}> = ({
  from,
  to,
  control,
  opacity,
  color = COLORS.orange,
  width = 4,
  dashed = true,
}) => {
  const path = control
    ? `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`
    : `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dashed ? "12 16" : undefined}
      opacity={opacity}
    />
  );
};

const DataPulse: React.FC<{
  frame: number;
  start: number;
  period: number;
  from: Point;
  to: Point;
  control?: Point;
  color?: string;
  size?: number;
  end?: number;
}> = ({
  frame,
  start,
  period,
  from,
  to,
  control,
  color = COLORS.orange,
  size = 14,
  end = Number.POSITIVE_INFINITY,
}) => {
  if (frame < start || frame > end) return null;
  const progress = ((frame - start) % period) / period;
  const point = control
    ? quadraticPoint(from, control, to, progress)
    : {
        x: interpolate(progress, [0, 1], [from.x, to.x]),
        y: interpolate(progress, [0, 1], [from.y, to.y]),
      };
  return (
    <div
      style={{
        position: "absolute",
        left: point.x - size / 2,
        top: point.y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        background: color,
        boxShadow: `0 0 22px ${color}`,
        opacity: interpolate(progress, [0, 0.08, 0.9, 1], [0, 1, 1, 0], clamp),
      }}
    />
  );
};

const Headline: React.FC<{
  frame: number;
  start: number;
  end: number;
  title: string;
  subtitle?: string;
}> = ({ frame, start, end, title, subtitle }) => (
  <div
    style={{
      position: "absolute",
      top: 42,
      left: 420,
      right: 80,
      opacity: fadeWindow(frame, start, end, 20),
      translate: `${interpolate(frame, [start, start + 24], [32, 0], clamp)}px 0px`,
      color: COLORS.ink,
      zIndex: 20,
      paddingBottom: 18,
      background:
        "linear-gradient(90deg, rgba(250,246,241,0.98) 0%, rgba(250,246,241,0.96) 80%, rgba(250,246,241,0) 100%)",
    }}
  >
    <div style={{ fontSize: 78, lineHeight: 1, fontWeight: 900, letterSpacing: "-0.05em" }}>
      {title}
    </div>
    {subtitle ? (
      <div style={{ marginTop: 12, fontSize: 34, lineHeight: 1.25, color: COLORS.muted, fontWeight: 600 }}>
        {subtitle}
      </div>
    ) : null}
  </div>
);

const ProviderRing: React.FC<{
  frame: number;
  opacity: number;
  center: Point;
  radius: number;
  label?: string;
}> = ({ frame, opacity, center, radius, label }) => (
  <>
    <div
      style={{
        position: "absolute",
        left: center.x - radius,
        top: center.y - radius,
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        border: `3px dashed ${COLORS.orange}`,
        background: "rgba(255,253,249,0.24)",
        opacity,
        rotate: `${frame * 0.08}deg`,
      }}
    />
    {label ? (
      <div
        style={{
          position: "absolute",
          left: center.x - 172,
          top: center.y + radius + 8,
          width: 344,
          textAlign: "center",
          opacity,
          color: COLORS.orangeDark,
          fontSize: 25,
          fontWeight: 900,
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </div>
    ) : null}
  </>
);

const CopyHand: React.FC<{
  x: number;
  y: number;
  opacity: number;
  scale: number;
}> = ({ x, y, opacity, scale }) => (
  <div
    style={{
      position: "absolute",
      left: x - 64,
      top: y - 84,
      width: 128,
      height: 168,
      opacity,
      scale,
      rotate: "-12deg",
      filter: "drop-shadow(0 18px 22px rgba(82,61,43,0.18))",
    }}
  >
    <svg viewBox="0 0 128 168" width="128" height="168">
      <path
        d="M39 88V32c0-11 16-11 16 0v38-49c0-11 17-11 17 0v49-40c0-11 17-11 17 0v43-29c0-11 17-11 17 0v57c0 31-18 51-47 51-22 0-36-12-44-32L3 91c-5-13 13-22 20-10l16 27"
        fill="#F2C3A6"
        stroke={COLORS.orangeDark}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="42" y="143" width="58" height="20" rx="10" fill={COLORS.orange} />
    </svg>
  </div>
);

const NetworkScene: React.FC = () => {
  const frame = useCurrentFrame() * SPEED;
  const api = { x: 650, y: 370 };
  const providerCenter = { x: 1170, y: 365 };
  const website = { x: 650, y: 810 };
  const copiedCenter = { x: 1190, y: 810 };
  const providerRingOpacity = fade(frame, 185, 28);
  const modelOpacity = fade(frame, 285, 25);
  const failed = frame >= 455 && frame <= 600;
  const alternateRoute = fade(frame, 500, 22);
  const websiteOpacity = fade(frame, 650, 28);
  const copiedOpacity = fade(frame, 900, 20);
  const handProgress = interpolate(frame, [760, 900], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const handX = interpolate(handProgress, [0, 1], [providerCenter.x, copiedCenter.x]);
  const handY = interpolate(handProgress, [0, 1], [providerCenter.y + 15, copiedCenter.y - 30]);
  const handOpacity = fadeWindow(frame, 735, 940, 20);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background />
      <Brand opacity={fade(frame, 0, 18)} />

      <Headline
        frame={frame}
        start={0}
        end={175}
        title="One API. Every connection."
        subtitle="Users connect once. API-Route handles the routing."
      />
      <Headline
        frame={frame}
        start={175}
        end={330}
        title="70+ upstream providers."
        subtitle="New providers connect to one resilient routing layer."
      />
      <Headline
        frame={frame}
        start={330}
        end={630}
        title="Built-in auto-failover."
        subtitle="When one route drops, traffic moves to a healthy route."
      />
      <Headline
        frame={frame}
        start={630}
        end={810}
        title="Launch under your own brand."
        subtitle="Your customers enter through your website."
      />
      <Headline
        frame={frame}
        start={810}
        end={1035}
        title="The same routing power. Your website."
        subtitle="The infrastructure is copied. Your brand stays in front."
      />

      <svg
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0 }}
      >
        {USERS.map((user, index) => (
          <NetworkLine
            key={`user-line-${index}`}
            from={{ x: user.x + 55, y: user.y }}
            to={{ x: api.x - 93, y: api.y }}
            control={{ x: 410, y: user.y }}
            opacity={fade(frame, 45 + index * 18, 24) * 0.48}
            color={COLORS.green}
          />
        ))}
        {PROVIDERS.map((provider, index) => (
          <NetworkLine
            key={`provider-line-${provider.label}`}
            from={{ x: api.x + 93, y: api.y }}
            to={{ x: provider.x - 34, y: provider.y }}
            control={{ x: 860, y: provider.y }}
            opacity={
              fade(frame, 105 + index * 16, 22) *
              (index === 2 && failed ? 0.18 : index === 4 && failed ? 0.95 : 0.45)
            }
            color={
              index === 2 && failed
                ? COLORS.red
                : index === 4 && failed
                  ? COLORS.green
                  : COLORS.orange
            }
            width={index === 4 && failed ? 7 : 4}
          />
        ))}
        {MODELS.map((model, index) => (
          <NetworkLine
            key={`model-line-${model.label}`}
            from={{ x: 1390, y: 365 }}
            to={{ x: model.x - 94, y: model.y }}
            control={{ x: 1500, y: model.y }}
            opacity={modelOpacity * 0.48}
            color={index % 2 === 0 ? COLORS.orange : COLORS.green}
          />
        ))}

        <NetworkLine
          from={{ x: 360, y: website.y }}
          to={{ x: website.x - 96, y: website.y }}
          opacity={fade(frame, 700, 24) * 0.55}
          color={COLORS.green}
        />
        <NetworkLine
          from={{ x: website.x + 96, y: website.y }}
          to={{ x: copiedCenter.x - 170, y: copiedCenter.y }}
          opacity={copiedOpacity * 0.68}
          color={COLORS.orange}
          width={5}
        />
        <NetworkLine
          from={{ x: copiedCenter.x + 170, y: copiedCenter.y }}
          to={{ x: 1675, y: 810 }}
          opacity={copiedOpacity * 0.68}
          color={COLORS.green}
          width={5}
        />
      </svg>

      {USERS.map((user, index) => (
        <UserNode
          key={`user-${index}`}
          x={user.x}
          y={user.y}
          opacity={fade(frame, 34 + index * 18, 22)}
          scale={interpolate(frame, [34 + index * 18, 60 + index * 18], [0.72, 1], clamp)}
          compact
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 78,
          top: 650,
          opacity: fade(frame, 105, 22),
          color: COLORS.muted,
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: "0.14em",
        }}
      >
        END USERS
      </div>

      <CoreNode
        x={api.x}
        y={api.y}
        label="API-Route"
        sublabel="ROUTING CORE"
        opacity={fade(frame, 12, 22)}
        scale={interpolate(frame, [12, 44], [0.62, 1], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}
      />

      <ProviderRing
        frame={frame}
        opacity={providerRingOpacity * 0.74}
        center={providerCenter}
        radius={226}
        label={frame >= 315 && frame < 625 ? "AUTO-FAILOVER" : undefined}
      />
      {PROVIDERS.map((provider, index) => (
        <ProviderNode
          key={provider.label}
          x={provider.x}
          y={provider.y}
          label={provider.label}
          opacity={fade(frame, 98 + index * 16, 22)}
          scale={interpolate(frame, [98 + index * 16, 124 + index * 16], [0.5, 1], clamp)}
          failed={index === 2 && failed}
        />
      ))}

      <div
        style={{
          position: "absolute",
          left: 1000,
          top: 620,
          width: 340,
          textAlign: "center",
          opacity: providerRingOpacity * fadeWindow(frame, 185, 630, 20),
          color: COLORS.orangeDark,
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 900 }}>70+</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.08em" }}>
          UPSTREAM PROVIDERS
        </div>
      </div>

      {MODELS.map((model, index) => (
        <ModelNode
          key={model.label}
          {...model}
          opacity={fade(frame, 280 + index * 16, 22)}
          scale={interpolate(frame, [280 + index * 16, 306 + index * 16], [0.75, 1], clamp)}
        />
      ))}

      {[0, 1, 2].map((offset) => (
        <DataPulse
          key={`incoming-${offset}`}
          frame={frame}
          start={110 + offset * 31}
          period={95}
          from={{ x: 260, y: 335 }}
          control={{ x: 430, y: 335 }}
          to={{ x: api.x - 92, y: api.y }}
          color={COLORS.green}
          end={1030}
        />
      ))}
      {[0, 1, 2].map((offset) => (
        <DataPulse
          key={`provider-pulse-${offset}`}
          frame={frame}
          start={185 + offset * 27}
          period={88}
          from={{ x: api.x + 92, y: api.y }}
          control={{ x: 850, y: failed ? PROVIDERS[4].y : PROVIDERS[2].y }}
          to={{
            x: failed ? PROVIDERS[4].x - 38 : PROVIDERS[2].x - 38,
            y: failed ? PROVIDERS[4].y : PROVIDERS[2].y,
          }}
          color={failed ? COLORS.green : COLORS.orange}
          end={1030}
        />
      ))}
      {[0, 1].map((offset) => (
        <DataPulse
          key={`model-pulse-${offset}`}
          frame={frame}
          start={360 + offset * 38}
          period={104}
          from={{ x: 1390, y: 365 }}
          control={{ x: 1510, y: MODELS[offset * 2].y }}
          to={{ x: MODELS[offset * 2].x - 94, y: MODELS[offset * 2].y }}
          color={offset === 0 ? COLORS.orange : COLORS.green}
          end={1030}
        />
      ))}

      <div
        style={{
          position: "absolute",
          left: 910,
          top: 495,
          padding: "14px 22px",
          borderRadius: 20,
          background: COLORS.redSoft,
          border: `2px solid ${COLORS.red}`,
          color: COLORS.red,
          fontSize: 22,
          fontWeight: 900,
          opacity: fadeWindow(frame, 455, 535, 12),
        }}
      >
        ROUTE 03 OFFLINE
      </div>
      <div
        style={{
          position: "absolute",
          left: 920,
          top: 558,
          padding: "14px 22px",
          borderRadius: 20,
          background: COLORS.greenSoft,
          border: `2px solid ${COLORS.green}`,
          color: COLORS.green,
          fontSize: 22,
          fontWeight: 900,
          opacity: alternateRoute * fadeWindow(frame, 500, 625, 14),
        }}
      >
        TRAFFIC REROUTED
      </div>

      <CoreNode
        x={website.x}
        y={website.y}
        label="YOUR WEBSITE"
        sublabel="YOUR BRAND"
        opacity={websiteOpacity}
        scale={interpolate(frame, [650, 684], [0.62, 1], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        })}
        website
      />
      {[0, 1, 2, 3, 4].map((index) => {
        const x = 120 + (index % 2) * 112;
        const y = 730 + Math.floor(index / 2) * 86;
        return (
          <UserNode
            key={`website-user-${index}`}
            x={x}
            y={y}
            opacity={fade(frame, 690 + index * 13, 20)}
            scale={interpolate(frame, [690 + index * 13, 714 + index * 13], [0.68, 0.88], clamp)}
            compact
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 82,
          top: 1000,
          opacity: fade(frame, 735, 20),
          color: COLORS.muted,
          fontSize: 23,
          fontWeight: 900,
          letterSpacing: "0.12em",
        }}
      >
        YOUR CUSTOMERS
      </div>

      <div
        style={{
          position: "absolute",
          left: copiedCenter.x - 170,
          top: copiedCenter.y - 170,
          width: 340,
          height: 340,
          borderRadius: 170,
          border: `3px dashed ${COLORS.orange}`,
          background: "rgba(255,253,249,0.42)",
          opacity: copiedOpacity,
        }}
      />
      {PROVIDERS.slice(0, 5).map((provider, index) => {
        const angle = (-120 + index * 60) * (Math.PI / 180);
        const x = copiedCenter.x + Math.cos(angle) * 112;
        const y = copiedCenter.y + Math.sin(angle) * 112;
        return (
          <ProviderNode
            key={`copied-${provider.label}`}
            x={x}
            y={y}
            label={provider.label}
            opacity={copiedOpacity}
            scale={interpolate(frame, [900 + index * 8, 928 + index * 8], [0.55, 1], clamp)}
            small
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: copiedCenter.x - 110,
          top: copiedCenter.y - 28,
          width: 220,
          textAlign: "center",
          color: COLORS.orangeDark,
          opacity: copiedOpacity,
        }}
      >
        <div style={{ fontSize: 27, fontWeight: 900 }}>ROUTING LAYER</div>
        <div style={{ marginTop: 6, fontSize: 19, fontWeight: 700 }}>READY TO RELAY</div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 1540,
          top: 730,
          width: 300,
          height: 170,
          borderRadius: 85,
          border: `3px solid ${COLORS.green}`,
          background: COLORS.paper,
          boxShadow: "0 20px 48px rgba(47,133,90,0.13)",
          opacity: copiedOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.ink,
          boxSizing: "border-box",
          padding: "0 24px",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "100%", fontSize: 24, lineHeight: 1.08, fontWeight: 900 }}>
          MODEL NETWORK
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 17,
            lineHeight: 1.2,
            color: COLORS.muted,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          OpenAI · Claude · Gemini
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: handX - 88,
          top: handY - 218,
          width: 176,
          height: 176,
          borderRadius: 88,
          border: `3px dashed ${COLORS.orange}`,
          background: "rgba(255,253,249,0.76)",
          boxShadow: "0 18px 38px rgba(82,61,43,0.10)",
          opacity: handOpacity,
          scale: interpolate(frame, [735, 770, 900, 940], [0.68, 1, 1, 0.72], clamp),
        }}
      >
        {[
          { left: 55, top: 18, label: "P01" },
          { left: 18, top: 94, label: "P03" },
          { left: 96, top: 96, label: "P05" },
        ].map((provider) => (
          <div
            key={`drag-${provider.label}`}
            style={{
              position: "absolute",
              left: provider.left,
              top: provider.top,
              width: 58,
              height: 58,
              borderRadius: 29,
              border: `3px solid ${COLORS.orange}`,
              background: COLORS.paper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.orangeDark,
              fontSize: 16,
              fontWeight: 900,
            }}
          >
            {provider.label}
          </div>
        ))}
      </div>
      <CopyHand
        x={handX}
        y={handY}
        opacity={handOpacity}
        scale={interpolate(frame, [735, 770, 900, 940], [0.7, 1, 1, 0.75], clamp)}
      />
      <div
        style={{
          position: "absolute",
          left: handX + 62,
          top: handY - 24,
          width: 188,
          padding: "10px 14px",
          borderRadius: 18,
          background: COLORS.orange,
          color: "white",
          fontSize: 21,
          fontWeight: 900,
          textAlign: "center",
          opacity: handOpacity,
        }}
      >
        COPY INFRASTRUCTURE
      </div>

      {[0, 1, 2].map((offset) => (
        <DataPulse
          key={`website-incoming-${offset}`}
          frame={frame}
          start={940 + offset * 28}
          period={90}
          from={{ x: 300, y: website.y }}
          to={{ x: website.x - 96, y: website.y }}
          color={COLORS.green}
          end={1040}
        />
      ))}
      {[0, 1].map((offset) => (
        <DataPulse
          key={`website-outgoing-${offset}`}
          frame={frame}
          start={965 + offset * 34}
          period={100}
          from={{ x: website.x + 96, y: website.y }}
          to={{ x: copiedCenter.x - 170, y: copiedCenter.y }}
          color={COLORS.orange}
          end={1040}
        />
      ))}
    </AbsoluteFill>
  );
};

const ShieldIcon: React.FC = () => (
  <svg width="230" height="250" viewBox="0 0 230 250">
    <path
      d="M115 12 205 48v66c0 62-35 103-90 124-55-21-90-62-90-124V48l90-36Z"
      fill={COLORS.orangeSoft}
      stroke={COLORS.orange}
      strokeWidth="9"
      strokeLinejoin="round"
    />
    <path
      d="m74 124 28 28 57-67"
      fill="none"
      stroke={COLORS.green}
      strokeWidth="14"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MaintenanceVisual: React.FC<{ frame: number; opacity: number }> = ({
  frame,
  opacity,
}) => {
  const center = { x: 470, y: 550 };
  return (
    <div style={{ opacity }}>
      <div
        style={{
          position: "absolute",
          left: center.x - 150,
          top: center.y - 150,
          width: 300,
          height: 300,
          borderRadius: 150,
          border: `3px dashed ${COLORS.orange}`,
          rotate: `${frame * 0.22}deg`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: center.x - 115,
          top: center.y - 125,
        }}
      >
        <ShieldIcon />
      </div>
      {["MONITOR", "DEPLOY", "FAILOVER"].map((label, index) => {
        const angle = frame * 0.012 + (index * Math.PI * 2) / 3;
        const x = center.x + Math.cos(angle) * 190;
        const y = center.y + Math.sin(angle) * 190;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: x - 74,
              top: y - 31,
              width: 148,
              height: 62,
              borderRadius: 31,
              background: COLORS.paper,
              border: `2px solid ${COLORS.line}`,
              boxShadow: "0 14px 32px rgba(82,61,43,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.orangeDark,
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

const CustomerVisual: React.FC<{ frame: number; opacity: number }> = ({
  frame,
  opacity,
}) => (
  <div style={{ opacity }}>
    <CoreNode
      x={1370}
      y={555}
      label="YOUR WEBSITE"
      sublabel="YOUR BUSINESS"
      opacity={1}
      scale={1}
      website
    />
    {[0, 1, 2, 3, 4, 5].map((index) => {
      const start = 165 + index * 12;
      const finalX = 980 + (index % 2) * 120;
      const finalY = 380 + Math.floor(index / 2) * 130;
      return (
        <UserNode
          key={`customer-scene-${index}`}
          x={interpolate(frame, [start, start + 35], [760, finalX], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          })}
          y={finalY}
          opacity={fade(frame, start, 18)}
          scale={0.9}
          compact
        />
      );
    })}
    <svg
      width="1920"
      height="1080"
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", inset: 0 }}
    >
      <NetworkLine
        from={{ x: 1130, y: 555 }}
        to={{ x: 1265, y: 555 }}
        opacity={fade(frame, 195, 25)}
        color={COLORS.green}
        width={6}
      />
    </svg>
    {[0, 1].map((offset) => (
      <DataPulse
        key={`customer-final-pulse-${offset}`}
        frame={frame}
        start={205 + offset * 28}
        period={80}
        from={{ x: 1130, y: 555 }}
        to={{ x: 1265, y: 555 }}
        color={COLORS.green}
        end={300}
      />
    ))}
  </div>
);

const ResponsibilityScene: React.FC = () => {
  const frame = useCurrentFrame() * SPEED;
  const maintenanceOpacity = fadeWindow(frame, 0, 170, 24);
  const customerOpacity = fade(frame, 142, 24);
  return (
    <AbsoluteFill>
      <Background />
      <Brand opacity={fade(frame, 0, 16)} />

      <MaintenanceVisual frame={frame} opacity={maintenanceOpacity} />
      <div
        style={{
          position: "absolute",
          left: 820,
          right: 100,
          top: 350,
          color: COLORS.ink,
          opacity: maintenanceOpacity,
        }}
      >
        <div style={{ fontSize: 94, lineHeight: 1.02, fontWeight: 900, letterSpacing: "-0.05em" }}>
          A professional team
          <br />
          maintains the platform.
        </div>
        <div style={{ marginTop: 36, fontSize: 40, lineHeight: 1.35, color: COLORS.muted, fontWeight: 600 }}>
          Upstreams, deployment, monitoring,
          <br />
          and failover — handled.
        </div>
      </div>

      <CustomerVisual frame={frame} opacity={customerOpacity} />
      <div
        style={{
          position: "absolute",
          left: 95,
          width: 720,
          top: 350,
          color: COLORS.ink,
          opacity: customerOpacity,
        }}
      >
        <div style={{ fontSize: 102, lineHeight: 1.02, fontWeight: 900, letterSpacing: "-0.05em" }}>
          You bring
          <br />
          the customers.
        </div>
        <div style={{ marginTop: 36, fontSize: 40, lineHeight: 1.35, color: COLORS.muted, fontWeight: 600 }}>
          Your audience, community,
          <br />
          and client relationships are yours.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FinalScene: React.FC = () => {
  const frame = useCurrentFrame() * SPEED;
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 50% 44%, rgba(217,119,87,0.18), transparent 36%), #FAF6F1",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.ink,
        textAlign: "center",
      }}
    >
      <div
        style={{
          opacity: fade(frame, 0, 20),
          scale: interpolate(frame, [0, 28], [0.9, 1], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div
          style={{
            marginBottom: 46,
            color: COLORS.orange,
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: "-0.03em",
          }}
        >
          api-route.com
        </div>
        <div style={{ fontSize: 118, lineHeight: 1, fontWeight: 900, letterSpacing: "-0.055em" }}>
          Your brand. Our infrastructure.
        </div>
        <div style={{ marginTop: 34, fontSize: 45, color: COLORS.muted, fontWeight: 600 }}>
          You grow the customer base. We keep the platform running.
        </div>
        <div
          style={{
            margin: "58px auto 0",
            width: "fit-content",
            padding: "22px 38px",
            borderRadius: 38,
            background: COLORS.orange,
            color: "white",
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: "0.06em",
          }}
        >
          API-ROUTE · UNIFIED AI API
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ApiRouteExplainer: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <Audio
      name="Close Up — Michael Ramir C. (Mixkit)"
      src={staticFile("audio/mixkit-close-up-1167.mp3")}
      volume={(frame) =>
        interpolate(frame, [0, 30, 840, 900], [0, 0.18, 0.18, 0], clamp)
      }
    />
    <Sequence durationInFrames={compressedFrame(1050)}>
      <NetworkScene />
    </Sequence>
    <Sequence from={compressedFrame(1000)} durationInFrames={compressedFrame(310)}>
      <ResponsibilityScene />
    </Sequence>
    <Sequence from={compressedFrame(1270)} durationInFrames={compressedFrame(130)}>
      <FinalScene />
    </Sequence>
  </AbsoluteFill>
);

export const MyComposition = () => (
  <Composition
    id="ApiRouteExplainer"
    component={ApiRouteExplainer}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
  />
);

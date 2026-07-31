import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";

const C = {
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

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const sceneOpacity = (frame: number, start: number, end: number) =>
  frame < start || frame >= end ? 0 : interpolate(frame, [start, start + 8], [0, 1], clamp);
const pop = (frame: number, start: number) =>
  interpolate(frame, [start, start + 14], [0.84, 1], { ...clamp, easing: Easing.out(Easing.back(1.4)) });

const Brand: React.FC<{ centered?: boolean; dim?: number }> = ({ centered = false, dim = 1 }) => (
  <div style={{ position: "absolute", top: 48, left: centered ? "50%" : 76, transform: centered ? "translateX(-50%)" : undefined, display: "flex", alignItems: "center", gap: 16, color: C.ink, opacity: dim, zIndex: 20, whiteSpace: "nowrap" }}>
    <svg width="58" height="58" viewBox="0 0 58 58">
      <rect x="2" y="2" width="54" height="54" rx="16" fill={C.paper} stroke={C.orange} strokeWidth="2" />
      <path d="M17 29H31M31 29L41 18M31 29L41 40" fill="none" stroke={C.orange} strokeWidth="3" strokeLinecap="round" />
      {[{ x: 15, y: 29 }, { x: 42, y: 17 }, { x: 42, y: 41 }].map((point) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="5" fill={C.paper} stroke={C.orange} strokeWidth="3" />)}
    </svg>
    <div>
      <div style={{ fontSize: 32, fontWeight: 800 }}>API-Route</div>
      <div style={{ marginTop: 2, fontSize: 16, fontWeight: 700, color: C.faint, letterSpacing: "0.12em" }}>UNIFIED AI API</div>
    </div>
  </div>
);

const Background: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <AbsoluteFill style={{ background: "radial-gradient(circle at 52% 48%, rgba(217,119,87,0.12), transparent 38%)" }} />
    <AbsoluteFill style={{ opacity: 0.3, backgroundImage: "linear-gradient(rgba(117,100,84,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(117,100,84,0.10) 1px, transparent 1px)", backgroundSize: "56px 56px", maskImage: "linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)" }} />
  </AbsoluteFill>
);

const Title: React.FC<{ frame: number; start: number; end: number; children: React.ReactNode; sub?: string }> = ({ frame, start, end, children, sub }) => {
  const opacity = sceneOpacity(frame, start, end);
  const y = interpolate(frame, [start, start + 16], [28, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", top: 145, left: 100, right: 100, textAlign: "center", color: C.ink, opacity, transform: `translateY(${y}px)`, zIndex: 10 }}>
      <div style={{ fontSize: 74, lineHeight: 1.02, fontWeight: 900, whiteSpace: "nowrap" }}>{children}</div>
      {sub ? <div style={{ marginTop: 18, fontSize: 32, lineHeight: 1.2, color: C.muted, fontWeight: 600 }}>{sub}</div> : null}
    </div>
  );
};

const KeyConsolidation: React.FC<{ frame: number; start: number; end: number }> = ({ frame, start, end }) => {
  const scene = sceneOpacity(frame, start, end);
  const providers = [
    { model: "gpt-4o", key: "sk-gpt-••••", base: "api.openai.com", color: C.red, bg: C.redSoft },
    { model: "claude-3.5", key: "sk-cld-••••", base: "api.anthropic.com", color: C.orangeDark, bg: C.orangeSoft },
    { model: "gemini-1.5", key: "sk-gem-••••", base: "generativelanguage.googleapis.com", color: C.green, bg: C.greenSoft },
    { model: "grok-2", key: "xai-••••", base: "api.x.ai", color: C.orangeDark, bg: C.orangeSoft },
    { model: "deepseek", key: "sk-ds-••••", base: "api.deepseek.com", color: C.red, bg: C.redSoft },
  ];
  const active = Math.min(providers.length - 1, Math.max(0, Math.floor((frame - start - 8) / 14)));
  const codeOpacity = interpolate(frame, [start, start + 8, start + 74, start + 90], [0, 1, 1, 0], clamp) * scene;
  const crossProgress = interpolate(frame, [start + 70, start + 84], [0, 1], clamp);
  const crossOpacity = interpolate(frame, [start + 68, start + 74, start + 82, start + 86], [0, 1, 1, 0], clamp) * scene;
  const oneOpacity = interpolate(frame, [start + 86, start + 94], [0, 1], clamp) * scene;
  const activeProvider = providers[active];
  const switched = frame >= start + 82 ? 1 : 0;
  const modelFlow = Math.max(0, ((frame - start - 86) % 24) / 24);
  const models = [
    { label: "GPT", x: 1290, y: 385, color: C.orangeDark, bg: C.orangeSoft },
    { label: "CLAUDE", x: 1515, y: 465, color: C.green, bg: C.greenSoft },
    { label: "GEMINI", x: 1290, y: 545, color: C.orangeDark, bg: C.orangeSoft },
    { label: "GROK", x: 1515, y: 625, color: C.green, bg: C.greenSoft },
    { label: "DEEPSEEK", x: 1290, y: 705, color: C.green, bg: C.greenSoft },
  ];
  return (
    <AbsoluteFill style={{ opacity: scene }}>
      <div style={{ position: "absolute", top: 145, left: 100, right: 100, textAlign: "center", color: C.ink }}>
        <div style={{ fontSize: 74, lineHeight: 1.02, fontWeight: 900, opacity: 1 - switched }}>SWITCH MODELS. EDIT CONFIG.</div>
        <div style={{ position: "absolute", inset: 0, fontSize: 74, lineHeight: 1.02, fontWeight: 900, opacity: switched }}>ONE API-ROUTE KEY.</div>
        <div style={{ marginTop: 18, fontSize: 32, color: C.muted, fontWeight: 600 }}>{switched ? "One key connects 40+ models." : "Every provider brings a new key and Base URL."}</div>
      </div>

      <div style={{ position: "absolute", left: 175, top: 370, width: 930, height: 400, borderRadius: 30, border: `2px solid ${C.line}`, background: C.paper, boxShadow: "0 20px 50px rgba(82,61,43,0.10)", opacity: codeOpacity, padding: "26px 32px", fontFamily: "Consolas, monospace" }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 25 }}>
          {providers.map((provider, index) => <div key={provider.model} style={{ width: 160, height: 48, borderRadius: 12, background: active === index ? provider.bg : C.bg, border: `2px solid ${active === index ? provider.color : C.line}`, color: active === index ? provider.color : C.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900 }}>{provider.model}</div>)}
        </div>
        <div style={{ color: C.faint, fontSize: 19 }}>config/models.ts</div>
        <div style={{ marginTop: 18, color: C.ink, fontSize: 28, lineHeight: 1.55 }}>
          <div><span style={{ color: C.faint }}>model:</span> <span style={{ color: activeProvider.color }}>&quot;{activeProvider.model}&quot;</span></div>
          <div><span style={{ color: C.faint }}>api_key:</span> <span style={{ color: C.red }}>&quot;{activeProvider.key}&quot;</span></div>
          <div><span style={{ color: C.faint }}>base_url:</span> <span style={{ color: C.orangeDark }}>&quot;{activeProvider.base}&quot;</span></div>
        </div>
        <div style={{ position: "absolute", left: 32, bottom: 24, padding: "10px 18px", borderRadius: 18, background: C.redSoft, border: `2px solid ${C.red}`, color: C.red, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 22, fontWeight: 900 }}>EDIT 3 LINES TO SWITCH</div>
      </div>

      <div style={{ position: "absolute", left: 1190, top: 382, width: 450, color: C.muted, opacity: codeOpacity, fontSize: 22, fontWeight: 900 }}>5 PROVIDER KEYS</div>
      {providers.map((provider, index) => <div key={provider.key} style={{ position: "absolute", left: 1190, top: 420 + index * 62, width: 450, height: 48, borderRadius: 16, background: provider.bg, border: `2px solid ${provider.color}`, color: provider.color, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", opacity: codeOpacity, transform: `translateX(${interpolate(frame, [start, start + 12], [32, 0], clamp)}px)`, fontSize: 21, fontWeight: 900 }}><span>{provider.model.toUpperCase()}</span><span>{provider.key}</span></div>)}

      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: crossOpacity }}>
        <path d="M420 420 L1500 720" pathLength="1" stroke={C.red} strokeWidth="34" strokeLinecap="round" fill="none" strokeDasharray="1" strokeDashoffset={1 - crossProgress} />
        <path d="M1500 420 L420 720" pathLength="1" stroke={C.red} strokeWidth="34" strokeLinecap="round" fill="none" strokeDasharray="1" strokeDashoffset={1 - crossProgress} />
      </svg>

      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: oneOpacity }}>
        <path d="M400 560 L610 560" stroke={C.orange} strokeWidth="8" strokeLinecap="round" strokeDasharray="14 13" strokeDashoffset={-frame * 2} />
        {models.map((model) => <path key={model.label} d={`M970 560 L${model.x} ${model.y + 32}`} stroke={model.color} strokeWidth="7" strokeLinecap="round" strokeDasharray="12 14" fill="none" opacity="0.78" />)}
        <circle cx={400 + 210 * modelFlow} cy="560" r="13" fill={C.orange} />
        {models.map((model, index) => {
          const progress = (modelFlow + index * 0.17) % 1;
          return <circle key={`${model.label}-flow`} cx={970 + (model.x - 970) * progress} cy={560 + (model.y + 32 - 560) * progress} r="12" fill={model.color} />;
        })}
      </svg>

      <div style={{ position: "absolute", left: 140, top: 500, width: 260, height: 120, borderRadius: 28, border: `2px solid ${C.line}`, background: C.paper, boxShadow: "0 18px 44px rgba(82,61,43,0.08)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: oneOpacity, transform: `scale(${pop(frame, start + 86)})` }}>
        <div style={{ color: C.ink, fontSize: 28, fontWeight: 900 }}>YOUR APP</div>
        <div style={{ marginTop: 7, color: C.muted, fontFamily: "Consolas, monospace", fontSize: 18 }}>OpenAI SDK</div>
      </div>

      <div style={{ position: "absolute", left: 610, top: 420, width: 360, height: 280, borderRadius: 80, border: `4px solid ${C.orange}`, background: C.paper, boxShadow: "0 28px 70px rgba(184,93,60,0.18)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: oneOpacity, transform: `scale(${pop(frame, start + 86)})` }}>
        <div style={{ width: 82, height: 82, borderRadius: 25, background: C.orangeSoft, border: `3px solid ${C.orange}`, color: C.orangeDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: 900 }}>A</div>
        <div style={{ marginTop: 15, color: C.ink, fontSize: 35, fontWeight: 900 }}>API-Route</div>
        <div style={{ marginTop: 8, color: C.green, fontFamily: "Consolas, monospace", fontSize: 21 }}>ONE KEY</div>
      </div>

      <div style={{ position: "absolute", left: 1360, top: 330, color: C.muted, fontSize: 24, fontWeight: 900, letterSpacing: "0.1em", opacity: oneOpacity }}>40+ MODELS</div>
      {models.map((model, index) => <div key={model.label} style={{ position: "absolute", left: model.x, top: model.y, width: model.label === "DEEPSEEK" ? 230 : 210, height: 64, borderRadius: 32, border: `2px solid ${model.color}`, background: model.bg, color: model.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, fontWeight: 900, opacity: oneOpacity, transform: `scale(${pop(frame, start + 88 + index * 2)})`, boxShadow: "0 12px 28px rgba(82,61,43,0.08)" }}>{model.label}</div>)}
    </AbsoluteFill>
  );
};

const Failover: React.FC<{ frame: number; start: number; end: number }> = ({ frame, start, end }) => {
  const scene = sceneOpacity(frame, start, end);
  const failAt = start + 62;
  const failed = frame >= failAt;
  const providerReveal = interpolate(frame, [start + 12, start + 28], [0, 1], clamp);
  const modelReveal = interpolate(frame, [start + 20, start + 38], [0, 1], clamp);
  const backupGlow = interpolate(frame, [failAt, failAt + 14], [0, 1], clamp);
  const inbound = Math.max(0, ((frame - start - 8) % 36) / 36);
  const route = Math.max(0, ((frame - (failed ? failAt + 8 : start + 20)) % 42) / 42);
  const routePoint = (progress: number, providerY: number) => {
    if (progress < 0.42) {
      return {
        x: interpolate(progress, [0, 0.42], [770, 980]),
        y: interpolate(progress, [0, 0.42], [565, providerY]),
      };
    }
    return {
      x: interpolate(progress, [0.42, 1], [980, 1510]),
      y: interpolate(progress, [0.42, 1], [providerY, 565]),
    };
  };
  const activePoint = routePoint(route, failed ? 570 : 420);
  const secondPoint = routePoint((route + 0.5) % 1, failed ? 570 : 420);
  const providers = [
    { label: "PROVIDER A", y: 365, status: failed ? "OFFLINE" : "PRIMARY", color: failed ? C.red : C.orangeDark, bg: failed ? C.redSoft : C.orangeSoft },
    { label: "PROVIDER B", y: 515, status: failed ? "ACTIVE" : "STANDBY", color: failed ? C.green : C.faint, bg: failed ? C.greenSoft : C.paper },
    { label: "PROVIDER C", y: 665, status: failed ? "READY" : "STANDBY", color: failed ? C.green : C.faint, bg: failed ? C.greenSoft : C.paper },
  ];
  return (
    <AbsoluteFill style={{ opacity: scene }}>
      <Title frame={frame} start={start} end={end} sub="Three providers can serve the same Grok request.">ONE KEY → PROVIDERS → 40+ MODELS.</Title>
      <div style={{ position: "absolute", left: 80, top: 500, width: 300, height: 130, borderRadius: 28, border: `2px solid ${C.line}`, background: C.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 44px rgba(82,61,43,0.08)" }}>
        <div style={{ fontSize: 28, fontWeight: 900 }}>YOUR APP</div>
        <div style={{ marginTop: 8, fontFamily: "Consolas, monospace", fontSize: 18, color: C.muted }}>OpenAI SDK</div>
      </div>
      <div style={{ position: "absolute", left: 520, top: 440, width: 250, height: 250, borderRadius: 125, border: `4px solid ${C.orange}`, background: C.paper, boxShadow: "0 24px 60px rgba(184,93,60,0.16)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: C.orangeSoft, border: `2px solid ${C.orange}`, color: C.orangeDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900 }}>A</div>
        <div style={{ marginTop: 12, fontSize: 34, fontWeight: 900 }}>API-Route</div>
        <div style={{ marginTop: 7, fontSize: 18, fontWeight: 800, color: C.muted }}>ONE KEY</div>
      </div>

      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <path d="M380 565 L520 565" stroke={C.orange} strokeWidth="8" strokeLinecap="round" strokeDasharray="14 13" strokeDashoffset={-frame * 2} />
        <path d="M770 565 L980 420 M770 565 L980 570 M770 565 L980 720" stroke={failed ? C.line : C.orange} strokeWidth="7" fill="none" strokeLinecap="round" opacity={providerReveal} />
        <path d="M1280 420 L1510 565 M1280 570 L1510 565 M1280 720 L1510 565" stroke={failed ? C.line : C.orange} strokeWidth="7" fill="none" strokeLinecap="round" opacity={providerReveal} />
        {failed ? <>
          <path d="M770 565 L980 420 M1280 420 L1510 565" stroke={C.red} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="16 15" />
          <path d="M770 565 L980 570 L1280 570 L1510 565" stroke={C.green} strokeWidth="10" fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${12 * backupGlow}px rgba(47,133,90,0.55))` }} />
          <path d="M770 565 L980 720 L1280 720 L1510 565" stroke={C.green} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="12 14" opacity="0.55" />
        </> : null}
        <circle cx={380 + 140 * inbound} cy="565" r="13" fill={C.orange} />
        <circle cx={activePoint.x} cy={activePoint.y} r="15" fill={failed ? C.green : C.orange} />
        <circle cx={secondPoint.x} cy={secondPoint.y} r="10" fill={failed ? C.green : C.orange} opacity="0.7" />
      </svg>
      <div style={{ position: "absolute", left: 1035, top: 315, color: C.muted, fontSize: 22, fontWeight: 900, letterSpacing: "0.1em", opacity: providerReveal }}>PROVIDERS</div>
      {providers.map((provider, index) => <div key={provider.label} style={{ position: "absolute", left: 980, top: provider.y, width: 300, height: 110, borderRadius: 24, border: `3px solid ${provider.color}`, background: provider.bg, boxShadow: failed && index === 1 ? `0 0 ${34 * backupGlow}px rgba(47,133,90,0.28)` : "0 12px 32px rgba(82,61,43,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", opacity: providerReveal, transform: `scale(${pop(frame, start + 10 + index * 5)})` }}>
        <div>
          <div style={{ fontSize: 22, color: C.ink, fontWeight: 900, whiteSpace: "nowrap" }}>{provider.label}</div>
          <div style={{ marginTop: 7, fontSize: 18, color: provider.color, fontWeight: 900 }}>{provider.status}</div>
        </div>
        <div style={{ padding: "9px 13px", borderRadius: 14, background: C.paper, border: `2px solid ${provider.color}`, color: provider.color, fontSize: 18, fontWeight: 900 }}>GROK</div>
        {failed && index === 0 ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.red, fontSize: 92, lineHeight: 1, fontWeight: 900, textShadow: "0 4px 0 #fff" }}>×</div> : null}
      </div>)}

      <div style={{ position: "absolute", left: 1545, top: 315, color: C.muted, fontSize: 22, fontWeight: 900, letterSpacing: "0.1em", opacity: modelReveal }}>40+ MODELS</div>
      <div style={{ position: "absolute", left: 1510, top: 500, width: 280, height: 130, borderRadius: 30, border: `4px solid ${C.green}`, background: C.greenSoft, color: C.green, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: modelReveal, transform: `scale(${pop(frame, start + 20)})`, boxShadow: "0 18px 44px rgba(47,133,90,0.14)" }}>
        <div style={{ fontSize: 38, fontWeight: 900 }}>GROK</div>
        <div style={{ marginTop: 7, fontSize: 18, fontWeight: 900 }}>{failed ? "REQUEST CONTINUES" : "TARGET MODEL"}</div>
      </div>
      {["GPT", "CLAUDE", "GEMINI", "DEEPSEEK"].map((model, index) => <div key={model} style={{ position: "absolute", left: 1450 + (index % 2) * 200, top: 690 + Math.floor(index / 2) * 74, width: 180, height: 54, borderRadius: 27, border: `2px solid ${C.line}`, background: index % 2 ? C.greenSoft : C.orangeSoft, color: index % 2 ? C.green : C.orangeDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, opacity: modelReveal, transform: `scale(${pop(frame, start + 24 + index * 4)})` }}>{model}</div>)}

      {failed ? <div style={{ position: "absolute", left: 850, top: 850, width: 610, textAlign: "center", padding: "13px 20px", borderRadius: 20, background: C.greenSoft, border: `2px solid ${C.green}`, color: C.green, fontSize: 23, fontWeight: 900, boxShadow: `0 0 ${24 * backupGlow}px rgba(47,133,90,0.22)` }}>PROVIDER A FAILED → PROVIDER B ACTIVE</div> : <div style={{ position: "absolute", left: 880, top: 850, width: 550, textAlign: "center", color: C.muted, fontSize: 21, fontWeight: 900 }}>REQUEST: grok-2 · PROVIDER A PRIMARY</div>}
    </AbsoluteFill>
  );
};

const CodeSwap: React.FC<{ frame: number; start: number; end: number }> = ({ frame, start, end }) => {
  const scene = sceneOpacity(frame, start, end);
  const glow = interpolate(frame, [start + 20, start + 34, start + 52], [0, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: scene }}>
      <Title frame={frame} start={start} end={end} sub="Change one Base URL. Your code stays.">KEEP YOUR OPENAI SDK.</Title>
      <div style={{ position: "absolute", left: 300, top: 420, width: 1320, height: 270 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 700, height: 270, borderRadius: 28, border: `2px solid ${C.line}`, background: C.paper, boxShadow: "0 18px 44px rgba(82,61,43,0.08)", padding: "30px 40px", fontFamily: "Consolas, monospace", fontSize: 28, lineHeight: 1.55, color: C.ink }}>
          <div style={{ color: C.faint }}>client = OpenAI(</div>
          <div style={{ paddingLeft: 34, color: C.orangeDark, textShadow: `0 0 ${18 * glow}px rgba(217,119,87,0.75)` }}>base_url = "api-route.com"</div>
          <div style={{ paddingLeft: 34, color: C.green }}>api_key = API_ROUTE_KEY</div>
          <div style={{ color: C.faint }}>)</div>
        </div>
        <div style={{ position: "absolute", left: 770, top: 70, fontSize: 62, color: C.orange, fontWeight: 900 }}>→</div>
        <div style={{ position: "absolute", left: 870, top: 12, width: 420, height: 240, borderRadius: 30, background: C.orange, color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 22px 48px rgba(184,93,60,0.22)", transform: `scale(${pop(frame, start + 18)})` }}>
          <div style={{ fontSize: 44, fontWeight: 900 }}>KEEP YOUR SDK</div>
          <div style={{ marginTop: 14, fontSize: 24, fontWeight: 800 }}>CHANGE ONE URL</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Bill: React.FC<{ frame: number; start: number; end: number }> = ({ frame, start, end }) => {
  const scene = sceneOpacity(frame, start, end);
  const progress = interpolate(frame, [start + 12, start + 52], [0, 1], clamp);
  const amount = Math.round(interpolate(progress, [0, 1], [100, 10]));
  const width = interpolate(progress, [0, 1], [650, 65], clamp);
  return (
    <AbsoluteFill style={{ opacity: scene }}>
      <Title frame={frame} start={start} end={end} sub="Up to 90% on selected models only.">SAME APP. LOWER BILL.</Title>
      <div style={{ position: "absolute", left: 390, top: 410, width: 1160, height: 330 }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: 720, height: 300, borderRadius: 32, border: `2px solid ${C.line}`, background: C.paper, boxShadow: "0 20px 50px rgba(82,61,43,0.10)", padding: "30px 38px" }}>
          <div style={{ color: C.faint, fontSize: 22, fontWeight: 900, letterSpacing: "0.1em" }}>EXAMPLE BILL · SELECTED MODELS</div>
          <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 28 }}>
            <div><div style={{ color: C.red, fontSize: 21, fontWeight: 900 }}>BEFORE</div><div style={{ color: C.red, fontSize: 82, lineHeight: 1, fontWeight: 900, textDecoration: "line-through", textDecorationThickness: 5 }}>$100</div></div>
            <div style={{ fontSize: 52, color: C.orange, fontWeight: 900 }}>→</div>
            <div><div style={{ color: C.green, fontSize: 21, fontWeight: 900 }}>NOW</div><div style={{ color: C.green, fontSize: 82, lineHeight: 1, fontWeight: 900 }}>${amount}</div></div>
          </div>
          <div style={{ position: "absolute", left: 38, bottom: 34, width: 650, height: 18, borderRadius: 9, background: C.redSoft, overflow: "hidden" }}><div style={{ width, height: "100%", borderRadius: 9, background: C.green }} /></div>
        </div>
        <div style={{ position: "absolute", left: 760, top: 42, width: 380, height: 220, borderRadius: 30, background: C.orange, color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 22px 48px rgba(184,93,60,0.22)", transform: `scale(${pop(frame, start + 20)})` }}>
          <div style={{ fontSize: 48, lineHeight: 1, fontWeight: 900, whiteSpace: "nowrap" }}>UP TO 90%</div>
          <div style={{ marginTop: 14, fontSize: 20, fontWeight: 900, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>SELECTED MODELS ONLY</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TwitterAd: React.FC = () => {
  const frame = useCurrentFrame();
  const end = sceneOpacity(frame, 420, 450);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden", fontFamily: "Arial, Helvetica, sans-serif" }}>
      <Audio name="Close Up - Michael Ramir C. (Mixkit)" src={staticFile("audio/mixkit-close-up-1167.mp3")} volume={(audioFrame) => interpolate(audioFrame, [0, 18, 420, 450], [0, 0.16, 0.16, 0], clamp)} />
      <Background />
      <Brand dim={frame < 420 ? 1 : 0} />

      <KeyConsolidation frame={frame} start={0} end={120} />
      <Failover frame={frame} start={120} end={270} />
      <CodeSwap frame={frame} start={270} end={345} />
      <Bill frame={frame} start={345} end={420} />

      <AbsoluteFill style={{ opacity: end, alignItems: "center", justifyContent: "center", textAlign: "center", color: C.ink }}>
        <Brand centered dim={end} />
        <div style={{ marginTop: 90, fontSize: 76, lineHeight: 1.04, fontWeight: 900 }}>One key. 40+ models.<br />Automatic failover.</div>
        <div style={{ marginTop: 24, fontSize: 32, color: C.muted, fontWeight: 700 }}>$1 to start · No subscription</div>
        <div style={{ marginTop: 22, padding: "18px 34px", borderRadius: 34, background: C.orange, color: "white", fontSize: 34, fontWeight: 900, boxShadow: "0 16px 34px rgba(184,93,60,0.20)" }}>api-route.com/pricing</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default TwitterAd;

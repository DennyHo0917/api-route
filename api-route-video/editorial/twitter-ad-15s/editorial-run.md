# Editorial Run

| Stage | Status | Evidence |
| --- | --- | --- |
| Brief | complete | `brief.md` |
| Content Direction | complete | `brief.md` and report below |
| Hook | complete | Hook report below |
| Humanization | complete | Humanization report below |
| Voiceover | complete | `voiceover.md` |
| Resonance | complete | Resonance report below |
| Script Flow | complete | Script Flow report below |
| AI Trace | complete | AI Trace report below |
| Marked Revision | complete | Revision report below |
| Publish Title | complete | `publish-copy.md` and report below |
| Preview | complete | 15s PNG keyframes and `out/api-route-twitter-ad-15s.mp4` |

## Content Direction

### 事实—问题审计

核心事实来自用户提供的广告信息：一个 Base URL 和 API key、40+ models、保留 OpenAI SDK、automatic provider failover、selected models 最高 90%、$1 起步、无订阅。用户最新校正了路由层级：API-Route 后面应先出现多家供应商，再到大模型；三家供应商都可提供 Grok，故障切换发生在供应商之间。用户同时要求删除中文关注文案。15 秒结构不变，只重构 4～9 秒画面和 14～15 秒 CTA。结论：通过。

## Hook

### Candidate-only basis

仅依据 Brief 与用户确认的事实生成，不参考截图、画面、录屏或 Remotion 预览。

### Current diagnosis

旧开头虽然有五张 key 卡，但没有明确的否定动作；failover 也只停留在标签。新开头先用大红叉否定五个 key，再把它们收束为一个 API-Route key；中段用断链和备用链路承接“自动切换”。

### Candidates

1. Five models. Five keys. Every switch means editing config.
2. Still wiring every AI model separately?
3. Your AI stack should not need five endpoints.
4. One app should not need five provider keys.
5. Too many AI models, too many integrations.

### Top 3

- Five models. Five keys. Every switch means editing config.
- Your AI stack should not need five endpoints.
- One app should not need five provider keys.

### Selected hook

`Five models. Five keys. Every switch means editing config.` 直接点出五个 key 和切模型时反复改配置的尴尬；配置文件、高亮切换和大红叉把问题与答案都放进前 3.5 秒。

## Humanization

### 输入边界

保留用户给出的产品、模型范围、价格门槛、最高优惠限定和 pricing URL；不新增免费额度、无限用量或所有模型统一 90% 的承诺。

### 首稿规则

每一行是一段自然口播；技术词只保留 OpenAI SDK、Base URL 和 API-Route；画面承担模型名单与账单变化。

### 改动记录

- 将六个并列卖点压成一条机制：切模型反复改配置 -> 五个 key 被拒绝 -> 一个 API-Route key -> 主链路断开 -> 备用链路接管 -> 保留 SDK -> 账单缩减。
- 将 failover 画面改为真实层级：`YOUR APP → API-Route → Provider A/B/C → 40+ models`；三家供应商均标记 Grok，A 离线后 B active、C ready，请求点沿 B 继续到 Grok。
- 将 `UP TO 90%` 与 `SELECTED MODELS ONLY` 固定在同一容器。
- 按用户原话删除结尾“关注 @apiroute”，CTA 仅保留 `$1 to start`、`No subscription` 与 pricing URL。

### Humanization quality score

- 直接性：9/10
- 节奏：9/10
- 信任度：9/10
- 真实性：9/10
- 精炼度：9/10
- 总分：45/50
- 支持证据：每个承诺均来自用户原始广告信息，且优惠限定始终可见。
- 最强反证：15 秒仍无法解释全部计费细节，因此只保留 selected models 限定和 pricing URL。

### Instructional completeness check

skipped: 非操作型内容。输入是用户提供的产品广告信息，输出是 15 秒广告视频；口播必须说产品定义、failover 和限定条件，画面可承担 key 合并、链路切换、代码行和账单变化，不存在教程 Gate。

### Audience viewpoint check

- 叙事主角：正在维护多个 AI 模型接入并控制 API 成本的开发者。
- 具体时刻：管理多个 key、endpoint 和账单时。
- 工具是否在问题后出现：通过。
- 叙事身份稳定：通过。
- 结论：通过。

## Resonance

### Voiceover-only basis

仅依据 `voiceover.md` 的口播列，不参考截图、画面、录屏、素材或 Remotion 预览。

### Claims

六个 claims：多模型接入混乱、一个 API-Route key 覆盖 40+ models、automatic provider failover、保留 OpenAI SDK、selected models 最高 90%、$1 起步且无订阅。

### Core mechanism

API-Route 位于应用与供应商之间，用一个 OpenAI-compatible 入口把请求发送到可提供目标模型的健康供应商；主 provider 失败时，备用 provider 接管同一个模型请求。

### Plain-language mechanism

应用仍使用原来的 OpenAI SDK，只把 Base URL 和一个 API-Route key 指向统一入口；三家供应商都能提供 Grok，当 Provider A 链路断开，API-Route 将下一次 Grok 请求切到 Provider B，Provider C 保持可用。selected-model pricing 的限定继续单独展示。

### Hook mechanism consistency

Hook 提出五个 key 和反复改配置的麻烦；正文先用一个 API-Route key 解释统一入口，再明确展示供应商层位于 API-Route 与模型层之间，用 Provider A 红叉、Provider B active、Provider C ready 和跑动数据流证明 failover；账单动画给出结果证明。结论：通过。

### Five dimensions

- 沉默解除：有效，直接说出多个 key 和 endpoint 带来的混乱。
- 满足动机：有效，满足降低维护摩擦和账单的需求。
- 立场框架：有效，站在开发者而不是平台自述的角度。
- 传播入口：中等，适合开发者和 AI 产品团队转发。
- 信念结构：有效，确认“保留现有 SDK、一个 key 也能统一多模型入口，并在 provider 故障时继续请求”。

### Structural recommendation

核心机制仍是统一入口；failover 作为同一入口的关键结果，用一次主链路断开和备用链路接管证明，不再另起无关故事。

## Script Flow

### Voiceover-only basis

仅依据 `voiceover.md` 的口播列，不参考截图、画面、录屏、素材或 Remotion 预览。

### Continuity falsification

- 最强潜在断点：从一个 API 跳到降低账单时，观众可能误解为所有模型都便宜。
- 完成状态：通过 `selected models only` 明确限定，不反转前文承诺。
- 结论：通过。

### Risk report

#### 段落结构

| 段落 | 作用 |
| --- | --- |
| 1 | 具体痛点与否定动作 |
| 2 | 产品定义、供应商层级与 failover 证明 |
| 3 | 迁移成本证明 |
| 4 | 价格结果证明 |
| 5 | CTA |

### Causal handoff

| 转场 | 上一叙事段 | 下一叙事段 | 承接依据 | 上一段留下的问题／情绪 | 下一段如何推进 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 → 2 | Five models. Five keys. Every switch means editing config. | One API-Route key reaches 40-plus models through multiple providers, with automatic failover. | 反复改配置的后果需要一个可用的统一答案 | 一个 key 如何经过供应商到达模型，故障怎么办 | 给出 API-Route → Provider A/B/C → models 的完整层级和跑动数据流 | 通过 |
| 2 → 3 | One API-Route key reaches 40-plus models through multiple providers, with automatic failover. | Keep your OpenAI SDK. Change one Base URL. | 统一入口和故障接管之后要回答迁移成本 | 是否需要重写代码 | 保留 SDK，只改 Base URL | 通过 |
| 3 → 4 | Keep your OpenAI SDK. Change one Base URL. | Same app, lower bill: up to 90% on selected models only. | 低迁移成本之后需要结果证明 | 这样做能省什么 | 用账单缩减展示价格结果 | 通过 |
| 4 → 5 | Same app, lower bill: up to 90% on selected models only. | Start with one dollar. No subscription. Compare pricing at api-route.com. | 价格承诺需要真实页面承接 | 具体模型和门槛是什么 | 给出最低起步金额、无订阅与 pricing 页面 | 通过 |

整体性结论：通过。

### Sentence length check

| 段落句 | 完整句 | 字符数 | 风险 | 处理 |
| --- | --- | --- | --- | --- |
| 1 | Five models. Five keys. Every switch means editing config. | 50 | 中 | 保留，朗读通过 |
| 2 | One API-Route key reaches 40-plus models through multiple providers, with automatic failover. | 82 | 中 | 保留，朗读通过；画面承担供应商名称与状态 |
| 3 | Keep your OpenAI SDK. Change one Base URL. | 35 | 中 | 保留，朗读通过 |
| 4 | Same app, lower bill: up to 90% on selected models only. | 46 | 中 | 保留，朗读通过 |
| 5 | Start with one dollar. No subscription. Compare pricing at api-route.com. | 64 | 中 | 保留，朗读通过 |

### CTA check

- 最后一句口播原句：“Start with one dollar. No subscription. Compare pricing at api-route.com.”
- 用户明确要求删除关注账号文案；本条以 pricing URL 作为转化 CTA，承接模型价格与使用门槛。
- 结论：通过。

### User confirmation

用户明确要求检查钩子、共鸣、内容后重新制作，并要求暂不导出 MP4。

## AI Trace

### Voiceover-only basis

仅依据 `voiceover.md` 的口播列，不参考截图、画面、录屏、素材或 Remotion 预览。

### Scan report

没有空泛赞美、夸张绝对词或未限定的 90% claim；技术词数量受控；结论：通过。

## Marked Revision

### Consolidated issues

1. 五个 key 虽然出现，但没有大叉否定和单 key 结果。
2. failover 旧画面把 API-Route 直接连到模型，缺少供应商层，且故障切换与模型数据流分离。
3. 账单幕与 CTA 在 13～14 秒重叠，造成整页文字和卡片叠在一起。
4. 结尾出现用户不需要的中文关注文案。
5. `UP TO 90%` 必须与 selected models 限定绑定。

### Final revision

保持 15 秒；第一段继续保留大红叉和 key 合并动画；中段改成 App → API-Route → 三家供应商 → 模型，三家均显示 Grok，A 离线后 B 激活、C ready，请求点沿 B 继续；CTA 从第 14 秒才开始，完全避开账单幕，并删除中文关注文案。

### Blind voice audit

- 最强风险反例：五个 key 只作为装饰出现，观众看不出为什么要换成 API-Route；已用大红叉和单 key 收束解决。
- failover 反例：把 API-Route 直接连到模型会错误表达切换层级；已用三家供应商节点、每家 Grok 标记、A offline、B active、C ready 和请求点移动解决。
- CTA 反例：账单与结尾同时出现导致信息互相遮挡；已把 CTA 起点移到 frame 420，并删除中文关注文案。
- 连续教程命令：不存在。
- 叙事身份稳定：通过。
- 句长与结构不过分均匀：通过。
- 结论：通过。

### Final invariant check

- 事实与用户限制：通过。
- 开头合同与核心承诺：通过。
- 操作正确性与行为 Gate：通过。
- CTA：通过。
- 结论：通过。

## Publish Title

- 用户审核原话：用户要求延长到 15 秒，第一段用大叉换成 API-Route 一个 key，并展示一条链路断开后另一条启动
- 最终发布标题：Cut AI API costs with one route to 40+ models
- 平台适配：通过；承诺一致性：通过

## Preview

### Entry visual hook check

1.5 秒帧 `out/twitter-ad-15s-preview-45.png` 出现配置文件、五个模型 tab 和五个 provider key；tab 切换会同步改动 model、api_key、base_url 三行；`out/twitter-ad-15s-preview-80.png` 用大红叉否定反复改配置；`out/twitter-ad-15s-one-key-flow-96.png`、`105.png`、`114.png` 展示 Your App 经一个 API-Route key 分流到 GPT、Claude、Gemini、Grok、DeepSeek，彩色请求点在连续帧中明显位移。静音也能识别问题与答案；通过。

### UI safe-area check

所有标题、卡片、数字和 URL 均位于 1920x1080 安全区内；大红叉退出后才出现 App、API-Route 和 40+ models 分支；五张模型卡与连线不重叠；Provider A/B/C、Grok、其余模型 chips 和故障状态没有互相遮挡；frame 415 只显示账单幕，frame 430 只显示 CTA；通过。

### Visual sync check

| 时间 | 口播（含关键锚点） | 画面与出现范围 | 首／中／末帧证据 | 画面功能 | 结果 |
| --- | --- | --- | --- | --- | --- |
| 0.0-4.0s | Five models. Five keys. Every switch means editing config. | 配置文件三行随五个模型 tab 反复改变；大红叉；答案页展开为 App → one API-Route key → 40+ models，五条分支上有移动数据点 | 45/80/96/105/114 | 演示切换痛点、统一入口与多模型覆盖 | 通过 |
| 4.0-9.0s | One API-Route key reaches 40-plus models through multiple providers, with automatic failover. | 完整展示 App → API-Route → Provider A/B/C → models；三家都标记 Grok；A 红叉离线，B active，C ready；绿色请求点沿 B 继续到 Grok | 150/190/250 | 证明真实路由层级、统一入口与 failover | 通过 |
| 9.0-11.5s | Keep your OpenAI SDK. Change one Base URL. | OpenAI client code 和高亮 Base URL | 280/305/335 | 演示迁移方式 | 通过 |
| 11.5-14.0s | Same app, lower bill: up to 90% on selected models only. | $100 -> $10 与同屏限定卡片 | 355/385/410 | 对比价格结果 | 通过 |
| 14.0-15.0s | Start with one dollar. No subscription. Compare pricing at api-route.com. | 账单幕在 frame 420 前结束；CTA 仅显示 `$1 to start`、`No subscription` 和 pricing URL | 415/430/448 | 证明无叠层的转化 CTA | 通过 |

### Motion timing check

Model tabs change the config file and five provider keys; the red X draws across both diagonals and exits before the App → API-Route → 40+ models diagram appears；frames 96/105/114 显示输入请求点和五条模型分支的数据点持续位移；下一幕请求点再从 App 到 API-Route，并先通过 Provider A 到 Grok；约 frame 182 时 Provider A 变红并出现大叉，Provider B 变为 active、Provider C 变为 ready，后续绿色请求点沿 B 到达 Grok；Base URL glows；bill value and bar shrink together；CTA 从 frame 420 才进入并保持到 frame 449。通过。

### Subtitle sentence check

屏幕只显示短标题和支持文字，不逐字高亮；第一幕保留配置变更、五个 key、大红叉，并用 App → one API-Route key → 40+ models 的数据流动画替代孤立 Key 卡；failover 幕明确分为 App、API-Route、Providers、Models 四层，并保留模型 chips、数据流、故障状态与请求点；限定条件与 90% 同屏；CTA 不含中文关注文案；通过。

### Verification

`verify-editorial-run.ps1` 的句长校验已对齐；其内置规则仍强制最后一句包含“关注”。本次用户明确要求删除该关注文案，因此保留用户要求，不为通过脚本重新添加。画面预览与代码检查均通过；用户确认后已导出 `out/api-route-twitter-ad-15s.mp4`。

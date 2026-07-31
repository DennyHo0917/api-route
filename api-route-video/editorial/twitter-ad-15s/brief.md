# Brief

## 素材事实

- 用户提供的广告核心信息：Cut AI API costs；保留 OpenAI SDK；一个 Base URL 和 API key 连接 40+ models；包含 GPT、Claude、Gemini、Grok、DeepSeek；自动 provider failover；selected models 最高可省 90%；$1 起步；无订阅；比较价格链接为 `https://www.api-route.com/pricing`。
- 用户最新要求：延长到 15 秒；第一段明确展示五个 provider key 被大叉否定，再收束为一个 API-Route key；failover 必须按“API-Route → 多家供应商 → 大模型”的真实层级展示，三家供应商都可提供 Grok，Provider A 故障后切到 Provider B／C；删除结尾中文“关注 @apiroute”；沿用米白／橙色／绿色网络路由风格，主体仍为 api-route.com。
- 画面为英文广告文案，使用现有 Remotion 项目与上一条视频的同一套配色和品牌标记。
- 结尾转化钩子：用户明确删除关注账号文案，只保留 `$1 to start`、`No subscription` 和 `api-route.com/pricing`。

## 观众问题

- 受众是需要接入多个 AI 模型、但不想重写 OpenAI SDK 或承担高 API 成本的开发者。
- 具体时刻：看到 AI API 账单、担心单一 provider 故障、又不想订阅长期套餐时。
- 后果／矛盾：多模型接入通常意味着多个 endpoint、多个 key；本条让观众在 15 秒内看懂 API-Route 的统一入口、40+ 模型、自动切换与价格门槛。

## 视觉主表达

- 视觉语法：沿用上一条视频的米白纸张背景、橙色主线、绿色成功路径、红色故障提示、圆形 API-Route 核心节点和圆角信息卡。
- 关键结论／对比／操作的视觉动作：五个 provider key 先完整出现，大红叉逐笔划掉；答案页不再只显示一张 Key 卡，而是立即展开为 `YOUR APP → one API-Route key → 40+ models`，五条模型分支上持续跑动彩色请求点。随后完整展示 `YOUR APP → API-Route → Provider A/B/C → 40+ models`，三张供应商卡都带 Grok 能力标记；Provider A 出现红叉并离线后，Provider B 变为 active、Provider C 保持 ready，绿色请求点沿 Provider B 的路径继续到 Grok；最后展示 Base URL、账单缩减与 pricing URL。
- 所有关键文案都位于安全区，单个容器内使用 nowrap 或显式换行，避免上一版出现的文字超出与标签被圆圈遮挡。

## 操作交付清单

| 顺序 | 实际文件或界面 | 工具或 Skill | 口播必须说 | 画面可承担 | 输出 | Gate |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `api-route-video/src/TwitterAd.tsx` | Remotion | Five models. Five keys. One mess. | 五张 Key 卡、大红叉、App 经一个 API-Route Key 分流到 40+ 模型，彩色请求点持续移动 | Hook 画面与统一入口证明 | 通过 |
| 2 | OpenAI SDK 卡片、API-Route 核心节点和供应商层 | Remotion | one API-Route key routes through multiple providers | 单一核心节点后明确出现 Provider A/B/C | 统一入口与路由层级证明 | 通过 |
| 3 | 供应商层后的 40+ 模型标签 | Remotion | GPT、Claude、Gemini、Grok、DeepSeek | Grok 主模型卡与其余模型标签、40+ 文案 | 多模型覆盖证明 | 通过 |
| 4 | Provider A／B／C 故障切换图 | Remotion | automatic provider failover | 三家供应商均显示 Grok；Provider A 红叉离线、Provider B active、Provider C ready、请求点改走 B 后继续到 Grok | failover 证明 | 通过 |
| 5 | 90%／$1／pricing 结尾卡 | Remotion | save up to 90%；$1；no subscription；compare pricing | 价格与 CTA 卡片 | 转化入口 | 通过 |

### 事实—问题核验

| 观众问题中的后果／矛盾 | 直接依据的素材事实或用户原话 | 素材不能推出什么 | 结论 |
| --- | --- | --- | --- |
| 多模型接入成本高 | 用户原话“Cut AI API costs”“Save up to 90% on selected models” | 不能推出所有模型都省 90% | 通过 |
| 重写 SDK 或管理多个入口 | 用户原话“Keep your OpenAI SDK”“One Base URL and API key” | 不能推出需要修改后端业务 | 通过 |
| provider 故障导致请求中断 | 用户原话“automatic provider failover” | 不能推出每次故障都零延迟 | 通过 |
| 订阅门槛阻碍试用 | 用户原话“Start with $1. No subscription” | 不能推出免费额度或无限用量 | 通过 |

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface SidebarItem {
  id: string;
  label: string;
}

export interface OverviewCard {
  icon: string;
  title: string;
  desc: string;
}

export interface FlowStep {
  title: string;
  desc: string;
}

export interface KeywordRow {
  keyword: string;
  weeklyExposure: string;
  monthlySearch: string;
  organicTraffic: string;
  convRate: string;
  ppc: string;
  tags: { label: string; color: string }[];
  insight: string;
}

export interface TrafficAttribution {
  iconBg: string;
  category: string;
  sub: string;
  percentage: string;
  traffic: string;
  organicPercent: string;
  gradientFrom: string;
  gradientTo: string;
  insight: string;
}

// ─── Static data (mock) ─────────────────────────────────────────────────────

export const sidebarItems: SidebarItem[] = [
  { id: "overview", label: "三句话看懂这个产品" },
  { id: "copywriting", label: "文案质量分析" },
  { id: "visual", label: "视觉图片分析" },
  { id: "keywords", label: "关键词与流量分析" },
];

export const overviewCards: OverviewCard[] = [
  { icon: "cube", title: "产品定位", desc: "一个号称能自动铲屎但经常出故障的猫砂盆。" },
  { icon: "users", title: "目标用户", desc: "主要是那些爱猫但又不想铲屎、追求省心生活的猫主，特别是女性，她们渴望解放双手，但又担心产品不靠谱。" },
  { icon: "home", title: "核心场景", desc: "主要放在家里，很多用户把它当成出门旅游时照顾猫的帮手，也有人放在卧室或书房。" },
];

export const coreAdvantages = [
  { title: "抓住\"不想铲屎\"的痛点", desc: "产品牢牢抓住了所有养猫人最头疼的\"铲屎\"问题，宣传\"自清洁\"..." },
  { title: "利用\"出门旅游\"新场景", desc: "很多用户把它当成旅游出门时照顾猫咪的好帮手，这个场景很..." },
  { title: "异味控制做得不错", desc: "虽然不是最主要的卖点，但它通过密封和碳滤芯，在控制猫砂..." },
];

export const weaknesses = [
  { title: "自清洁功能经常出毛病", desc: "产品主打的\"自清洁\"功能是最大的硬伤，很多用户反映机器会\"停止工作\"或者\"刮板故障\"，让大家白高兴一场。" },
  { title: "说好的\"易清洁\"却很难洗", desc: "虽然宣传说容易维护，但实际上有近两成的用户抱怨机器难以彻底清洗干净，这和产品宣传的完全相反。" },
  { title: "承诺和实际不符，用户信任受损", desc: "产品夸大功能，实际质量却跟不上，导致很多用户从期待变成失望，甚至觉得花钱买了个麻烦，严重影响了品牌口碑。" },
];

export const copywritingFlow: FlowStep[] = [
  { title: "提出核心痛点与解决方案", desc: "开宗明义，指出传统铲屎的麻烦，并直接给出\"半自动自清洁\"和\"兼容多种猫砂\"这两个核心卖点，解决用户最关心的问题。" },
  { title: "解决次要但重要的痛点", desc: "在解决主要清洁痛点后，进一步解决猫砂盆常见的\"脏乱和异味\"问题，通过高边和密封设计，提升用户对居家环境整洁度的期待。" },
  { title: "打消维护顾虑", desc: "阐述产品的\"易清洁\"特性，通过模块化设计和可水洗，打消买家对自动猫砂盆后期维护麻烦的担忧，进一步强调用户体验的便捷性。" },
  { title: "优化使用体验", desc: "从噪音角度提升产品附加值，强调\"静音操作\"减少对生活的干扰，满足用户对高品质生活细节的追求。" },
  { title: "明确适用对象，降低购买风险", desc: "最后给出明确的适用范围和限制（猫咪数量、体重、不适合幼猫或小空间），帮助用户进行自我筛选，减少不必要的退货和投诉，建立信任感。" },
];

export const visualFlow: FlowStep[] = [
  { title: "开门见山", desc: "用一张完美的白底主图，清晰展示产品全貌和核心的半自动清理功能，吸引买家注意力。" },
  { title: "痛点展示", desc: "通过猫咪使用场景，直观展示产品如何自动清理，解决铲屎官的日常痛点。" },
  { title: "方案呈现", desc: "展示产品颜色选择和详细的部件构成，让买家对产品有全面了解，并提供实用尺寸信息。" },
  { title: "技术/细节秀肌", desc: "深入剖析产品的低维护、强力除臭和静音运行等核心卖点，打消用户对自动猫砂盆的常见顾虑。" },
  { title: "场景共鸣", desc: "通过多猫家庭的场景，进一步扩大了产品的适用人群，让潜在买家觉得这款产品不仅功能强大，而且考虑周全。" },
];

export const trafficAttributions: TrafficAttribution[] = [
  { iconBg: "#3b82f6", category: "核心品类", sub: "Litter Box (猫砂盆)", percentage: "57.18%", traffic: "416,178", organicPercent: "95.43%", gradientFrom: "#3b82f6", gradientTo: "#60a5fa", insight: "聚合了 'litter', 'box', 'boxes' 等词根。这是产品最核心的流量来源，占据了总流量的绝大部分，且自然流量占比极高。" },
  { iconBg: "#a855f7", category: "核心功能", sub: "Automatic/Self-Cleaning (自动/自清洁)", percentage: "25.83%", traffic: "187,981", organicPercent: "96.96%", gradientFrom: "#a855f7", gradientTo: "#c084fc", insight: "聚合了 'automatic', 'cleaning', 'self' 等词根。反映了产品的核心卖点——\"自动清洁\"功能。" },
  { iconBg: "#22c55e", category: "人群", sub: "Cat/Pet (猫/宠物)", percentage: "14.55%", traffic: "105,931", organicPercent: "92.61%", gradientFrom: "#22c55e", gradientTo: "#4ade80", insight: "聚合了 'cat', 'cats', 'pet' 等词根。这些词确认了产品是面向养猫人群的，流量稳定且自然流量占比高。" },
  { iconBg: "#6b7280", category: "品牌", sub: "Specific Systems/Brands", percentage: "1.78%", traffic: "12,971", organicPercent: "100%", gradientFrom: "#6b7280", gradientTo: "#9ca3af", insight: "聚合了 'pivot', 'genie', 'breeze' 等词根。这些词通常指向特定的竞品品牌或系统。" },
  { iconBg: "#f97316", category: "功能属性", sub: "Size (尺寸)", percentage: "0.26%", traffic: "1,863", organicPercent: "100%", gradientFrom: "#f97316", gradientTo: "#fb923c", insight: "聚合了 'large' 词根。虽然流量占比小，但它表明有部分用户在寻找大尺寸的猫砂盆。" },
  { iconBg: "#eab308", category: "人群", sub: "Spanish (西班牙语)", percentage: "0.26%", traffic: "1,886", organicPercent: "100%", gradientFrom: "#eab308", gradientTo: "#facc15", insight: "聚合了 'arenero', 'gatos' 等词根。这是西班牙语用户搜索的流量，可能是一个小众机会。" },
];

export const topKeywords: KeywordRow[] = [
  { keyword: "cat litter box (猫砂盆)", weeklyExposure: "66,805", monthlySearch: "300,905", organicTraffic: "89.89", convRate: "8.51%", ppc: "1.12", tags: [{ label: "宽泛", color: "blue" }, { label: "品类", color: "purple" }], insight: "核心基石：这个词是产品的基本盘，享受到其带来的巨大流量和相对健康的转化，广告投放应以守住市场份额为目标。" },
  { keyword: "automatic litter box (自动猫砂盆)", weeklyExposure: "56,320", monthlySearch: "279,877", organicTraffic: "95.85", convRate: "3.16%", ppc: "3.38", tags: [{ label: "功能", color: "blue" }, { label: "品类", color: "purple" }], insight: "高流量低转化陷阱：虽然自然流量占比极高，但平台整体转化率却很低。PPC高达3.38，广告投放不精准很容易烧钱。" },
  { keyword: "self cleaning litter box (自清洁猫砂盆)", weeklyExposure: "28,784", monthlySearch: "153,485", organicTraffic: "98.96", convRate: "2.93%", ppc: "4.93", tags: [{ label: "功能", color: "blue" }, { label: "品类", color: "purple" }], insight: "高PPC低转化风险：PPC高达4.93，是目前看到最高的。竞争非常激烈，且用户购买意图不明确。" },
  { keyword: "litter box (猫砂盆)", weeklyExposure: "4,997", monthlySearch: "371,628", organicTraffic: "100", convRate: "10.42%", ppc: "1.4", tags: [{ label: "宽泛", color: "blue" }, { label: "品类", color: "purple" }], insight: "购买意图很强，转化率高达10.42%。应确保产品在这个词下的排名，以获取更多高意向用户。" },
  { keyword: "pet pivot litter box (Pet Pivot 猫砂盆)", weeklyExposure: "6,019", monthlySearch: "44,756", organicTraffic: "100", convRate: "4.28%", ppc: "2.2", tags: [{ label: "品牌", color: "green" }], insight: "竞品流量争夺：这是竞品品牌词带来的流量，如果广告投放，成本会比较高。" },
  { keyword: "pet pivot (Pet Pivot)", weeklyExposure: "1,840", monthlySearch: "11,922", organicTraffic: "100", convRate: "4.16%", ppc: "1.27", tags: [{ label: "品牌", color: "green" }], insight: "纯竞品词：不建议主动投放广告，除非有特别的品牌截胡策略。" },
];

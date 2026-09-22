import { Gift, Trophy, Crown, Coins, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Product } from "@/lib/products";
import { Section } from "@/components/product-kit/section";
import { StatusBadge } from "@/components/product-kit/status-badge";
import { cn } from "@/lib/utils";

type Lifecycle = "Upcoming" | "Live" | "Ended";

const lifecycleStyle: Record<Lifecycle, string> = {
  Upcoming: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Live: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Ended: "bg-secondary text-muted-foreground",
};

const lifecycleLabel: Record<Lifecycle, string> = {
  Upcoming: "未开始",
  Live: "进行中",
  Ended: "已结束",
};

interface CampaignConfig {
  icon: LucideIcon;
  banner: string;
  bannerSub: string;
  lifecycle: Lifecycle;
  progressLabel: string;
  progressPct: number;
  countdown: string;
  tasks: { title: string; reward: string; status: "completed" | "pending" | "scheduled" }[];
  leaderboard: { rank: number; user: string; value: string }[];
  history: { title: string; date: string; status: "completed" | "expired"; lifecycle: Lifecycle }[];
  rules: string[];
  vipLevels?: { current: string; next: string };
}

const configs: Record<string, CampaignConfig> = {
  "airdrop-center": {
    icon: Gift,
    banner: "第 4 期生态空投任务",
    bannerSub: "完成任务瓜分 200,000 枚 $STUDIO 代币（分析活动）",
    lifecycle: "Live",
    progressLabel: "任务进度",
    progressPct: 62,
    countdown: "3 天 14 小时 22 分后结束",
    tasks: [
      { title: "连接虚拟钱包", reward: "+120 积分", status: "completed" },
      { title: "完成 3 笔测试网交易", reward: "+300 积分", status: "completed" },
      { title: "关注官方社群", reward: "+80 积分", status: "pending" },
      { title: "邀请 1 位好友", reward: "+200 积分", status: "scheduled" },
    ],
    leaderboard: [
      { rank: 1, user: "0x9F0c...77De", value: "18,204 积分" },
      { rank: 2, user: "0x4b7a...2e91", value: "16,842 积分" },
      { rank: 3, user: "0xA1b2...9F3C", value: "15,109 积分" },
    ],
    history: [
      { title: "第 3 期空投任务", date: "2026-06-12", status: "completed", lifecycle: "Ended" },
      { title: "第 2 期空投任务", date: "2026-03-08", status: "expired", lifecycle: "Ended" },
    ],
    rules: ["活动最终解释权归平台所有", "每个地址限参与一次", "奖励将在活动结束后 48 小时内发放"],
  },
  rewards: {
    icon: Trophy,
    banner: "积分商城 · 新一期兑换开放",
    bannerSub: "完成任务累计积分，兑换权益与实物好礼（分析）",
    lifecycle: "Live",
    progressLabel: "距下一等级",
    progressPct: 74,
    countdown: "本月剩余 9 天",
    tasks: [
      { title: "每日签到", reward: "+10 积分", status: "completed" },
      { title: "累计交易 1,000 USDT", reward: "+150 积分", status: "completed" },
      { title: "完成实名认证", reward: "+500 积分", status: "pending" },
    ],
    leaderboard: [
      { rank: 1, user: "0x6C0f...F721", value: "42,880 积分" },
      { rank: 2, user: "0x0A5e...9E12", value: "38,410 积分" },
      { rank: 3, user: "0x7Ea4...11aB", value: "35,206 积分" },
    ],
    history: [
      { title: "618 积分加倍活动", date: "2026-06-18", status: "completed", lifecycle: "Ended" },
      { title: "新春签到活动", date: "2026-02-10", status: "expired", lifecycle: "Ended" },
    ],
    rules: ["积分有效期为 12 个月", "兑换商品数量有限，先到先得", "所有积分与商品为分析数据"],
  },
  "vip-center": {
    icon: Crown,
    banner: "VIP 5 · 尊享专属权益",
    bannerSub: "累计交易额提升等级，解锁更多专属服务",
    lifecycle: "Live",
    progressLabel: "距 VIP 6 成长值",
    progressPct: 58,
    countdown: "等级评估周期：每月 1 日",
    tasks: [
      { title: "月交易额达 50,000 USDT", reward: "解锁专属客服", status: "completed" },
      { title: "月活跃天数 ≥ 20 天", reward: "手续费返还 10%", status: "pending" },
    ],
    leaderboard: [
      { rank: 1, user: "0x3bC1...44F0", value: "VIP 8" },
      { rank: 2, user: "0x9A2f...71EF", value: "VIP 7" },
      { rank: 3, user: "0x71D3...A82F", value: "VIP 6" },
    ],
    history: [
      { title: "VIP 5 权益升级", date: "2026-05-01", status: "completed", lifecycle: "Ended" },
    ],
    rules: ["等级根据近 30 天交易额与资产计算", "权益随等级实时生效", "本页面权益与等级均为隔离数据"],
    vipLevels: { current: "VIP 5", next: "VIP 6" },
  },
  "deposit-promo": {
    icon: Coins,
    banner: "充值阶梯奖励活动",
    bannerSub: "单笔充值满额即可领取对应奖励",
    lifecycle: "Live",
    progressLabel: "当前阶梯进度",
    progressPct: 45,
    countdown: "活动截止 2026-10-08 23:59",
    tasks: [
      { title: "充值满 500 USDT", reward: "+5 USDT 体验金", status: "completed" },
      { title: "充值满 2,000 USDT", reward: "+25 USDT 体验金", status: "pending" },
      { title: "充值满 10,000 USDT", reward: "+150 USDT 体验金", status: "scheduled" },
    ],
    leaderboard: [
      { rank: 1, user: "0xA1b2...9F3C", value: "$48,200 累计充值" },
      { rank: 2, user: "0x4b7a...2e91", value: "$36,800 累计充值" },
    ],
    history: [{ title: "上一期充值活动", date: "2026-07-01", status: "expired", lifecycle: "Ended" }],
    rules: ["奖励发放后 7 天内到账（分析）", "同一用户仅可参与一次", "本活动所有金额均为分析数据"],
  },
  "referral-center": {
    icon: Users,
    banner: "邀请好友，赢取返佣",
    bannerSub: "好友交易手续费最高 40% 返佣（分析体系）",
    lifecycle: "Live",
    progressLabel: "本月团队业绩",
    progressPct: 81,
    countdown: "结算日：每月 5 日",
    tasks: [
      { title: "邀请 3 位好友注册", reward: "+50 USDT", status: "completed" },
      { title: "好友累计交易 5,000 USDT", reward: "+120 USDT", status: "pending" },
    ],
    leaderboard: [
      { rank: 1, user: "0x0A5e...9E12", value: "邀请 284 人" },
      { rank: 2, user: "0x6C0f...F721", value: "邀请 196 人" },
      { rank: 3, user: "0x7Ea4...11aB", value: "邀请 152 人" },
    ],
    history: [{ title: "上一结算周期", date: "2026-08-05", status: "completed", lifecycle: "Ended" }],
    rules: ["返佣比例根据好友等级动态调整", "返佣每日结算一次", "以上邀请关系与返佣均为分析"],
  },
};

export function CampaignTemplate({ product }: { product: Product }) {
  const cfg = configs[product.id] ?? configs["rewards"];
  const Icon = cfg.icon;
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{cfg.banner}</h2>
              <p className="mt-1 max-w-md text-[13px] text-muted-foreground">{cfg.bannerSub}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", lifecycleStyle[cfg.lifecycle])}>{lifecycleLabel[cfg.lifecycle]}</span>
            <StatusBadge status="live" />
          </div>
        </div>

        {cfg.vipLevels && (
          <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-center">
            <div>
              <div className="text-[11px] text-muted-foreground">当前等级</div>
              <div className="mt-0.5 text-sm font-semibold text-foreground">{cfg.vipLevels.current}</div>
            </div>
            <div className="border-x border-border/50">
              <div className="text-[11px] text-muted-foreground">下一等级</div>
              <div className="mt-0.5 text-sm font-semibold text-foreground">{cfg.vipLevels.next}</div>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground">成长进度</div>
              <div className="mt-0.5 font-mono text-sm font-semibold text-primary">{cfg.progressPct}%</div>
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[12px] text-muted-foreground">
            <span>{cfg.progressLabel}</span>
            <span className="font-mono">{cfg.progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${cfg.progressPct}%` }} />
          </div>
          <p className="mt-2 text-[11.5px] font-medium text-amber-600 dark:text-amber-400">⏱ {cfg.countdown}</p>
        </div>
      </div>

      <Section title="任务列表" subtitle="Task List · 完成任务解锁奖励">
        <div className="divide-y divide-border/60 rounded-xl border border-border/70">
          {cfg.tasks.map((t) => (
            <div key={t.title} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-[13px] font-medium text-foreground">{t.title}</div>
                <div className="text-[11.5px] text-emerald-600 dark:text-emerald-400">{t.reward}</div>
              </div>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="排行榜" subtitle="Leaderboard · 虚拟地址排名">
        <div className="overflow-hidden rounded-xl border border-border/70">
          {cfg.leaderboard.map((r) => (
            <div key={r.rank} className="flex items-center gap-3 border-b border-border/40 px-4 py-2.5 text-sm last:border-0">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  r.rank === 1 ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-secondary text-muted-foreground"
                )}
              >
                {r.rank}
              </span>
              <span className="flex-1 truncate font-mono text-[12.5px] text-foreground">{r.user}</span>
              <span className="text-[12.5px] font-medium text-muted-foreground">{r.value}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section title="历史活动" subtitle="Past Campaigns" className="py-0">
          <div className="divide-y divide-border/60 rounded-xl border border-border/70">
            {cfg.history.map((h) => (
              <div key={h.title} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <div className="text-foreground">{h.title}</div>
                  <div className="text-[11px] text-muted-foreground/70">{h.date}</div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-semibold", lifecycleStyle[h.lifecycle])}>{lifecycleLabel[h.lifecycle]}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="活动规则" subtitle="Rules" className="py-0">
          <ul className="space-y-2 rounded-xl border border-border/70 px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {cfg.rules.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground/50">{i + 1}.</span>
                {r}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}

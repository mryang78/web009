import { Search } from "lucide-react";
import type { Product } from "@/lib/products";
import { Section } from "@/components/product-kit/section";
import { StatusBadge } from "@/components/product-kit/status-badge";

const featured = {
  title: "以太坊 Layer2 生态 TVL 突破 500 亿美元，创历史新高",
  summary: "多个头部 Rollup 项目本季度 TVL 环比增长超过 30%，机构资金持续流入 …",
  time: "2 小时前",
  tag: "深度",
};

const breaking = [
  { title: "某主流交易所宣布上线新一代合约系统（分析新闻）", time: "12 分钟前" },
  { title: "稳定币市场总市值突破 1,600 亿美元", time: "38 分钟前" },
  { title: "监管机构就数字资产托管新规征求意见", time: "1 小时前" },
];

const marketNews = [
  { title: "比特币突破 67,000 美元关口，市场情绪转向贪婪", time: "3 小时前", tag: "行情" },
  { title: "机构持续增持 ETH 现货 ETF，单周净流入 4.2 亿美元", time: "5 小时前", tag: "机构" },
  { title: "Solana 生态 DEX 交易量单日创新高", time: "7 小时前", tag: "生态" },
];

export function NewsTemplate({ product: _product }: { product: Product }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="搜索资讯" subtitle="Search Articles" className="pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            disabled
            placeholder="搜索快讯、专题或关键词…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </Section>

      <Section title="今日头条" subtitle="Featured">
        <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-primary/8 to-transparent p-6">
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            {featured.tag}
          </span>
          <h3 className="mt-3 text-lg font-semibold text-foreground">{featured.title}</h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{featured.summary}</p>
          <p className="mt-3 text-[11.5px] text-muted-foreground/70">{featured.time}</p>
        </div>
      </Section>

      <Section title="快讯时间线" subtitle="Breaking News">
        <div className="space-y-3 border-l-2 border-border/70 pl-4">
          {breaking.map((b, i) => (
            <div key={i} className="relative">
              <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-background bg-primary" />
              <div className="flex items-center gap-2">
                <StatusBadge status="live" />
                <span className="text-[11px] text-muted-foreground/70">{b.time}</span>
              </div>
              <p className="mt-1 text-[13.5px] text-foreground">{b.title}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="市场专题" subtitle="Market News">
        <div className="divide-y divide-border/60 rounded-xl border border-border/70">
          {marketNews.map((n) => (
            <div key={n.title} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <span className="mr-2 rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-medium text-secondary-foreground">
                  {n.tag}
                </span>
                <span className="text-[13.5px] text-foreground">{n.title}</span>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground/70">{n.time}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

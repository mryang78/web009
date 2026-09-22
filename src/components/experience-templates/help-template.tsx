import { Search, Wallet, ShieldCheck, CreditCard, Users2 } from "lucide-react";
import type { Product } from "@/lib/products";
import { Section } from "@/components/product-kit/section";

const categories = [
  { icon: Wallet, label: "钱包与资产", count: 24 },
  { icon: CreditCard, label: "充值与提现", count: 18 },
  { icon: ShieldCheck, label: "账户安全", count: 15 },
  { icon: Users2, label: "邀请与返佣", count: 9 },
];

const popular = [
  "如何创建并管理链上钱包地址？",
  "体验 Mode 与真实交易有什么区别？",
  "为什么我的测试网交易没有实时更新？",
  "如何重置分析账户数据？",
];

const faqs = [
  { q: "平台数据来源？", a: "数据来自公开链上节点，由安全分析引擎实时聚合处理。" },
  { q: "隔离数据多久更新一次？", a: "隔离数据为静态分析数据，用于展示界面与交互效果，不代表真实市场行情。" },
  { q: "可以在这里进行真实交易吗？", a: "不可以。平台不支持真实充值、提现、钱包连接或支付。" },
];

export function HelpTemplate({ product: _product }: { product: Product }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="我们能帮你什么？" subtitle="Search Help Center" className="pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            disabled
            placeholder="搜索常见问题、功能说明…"
            className="h-12 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </Section>

      <Section title="分类浏览" subtitle="Browse by Category">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map(({ icon: Icon, label, count }) => (
            <div key={label} className="rounded-xl border border-border/70 bg-card p-4 text-center">
              <Icon className="mx-auto size-5 text-primary" />
              <div className="mt-2 text-[13px] font-medium text-foreground">{label}</div>
              <div className="text-[11px] text-muted-foreground">{count} 篇文章</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="热门问题" subtitle="Popular Articles">
        <ul className="divide-y divide-border/60 rounded-xl border border-border/70">
          {popular.map((p) => (
            <li key={p} className="px-4 py-3 text-[13.5px] text-foreground/90 transition-colors hover:bg-secondary/20">
              {p}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="常见问题" subtitle="FAQ">
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f.q} className="rounded-xl border border-border/70 bg-card p-4">
              <div className="text-[13.5px] font-semibold text-foreground">{f.q}</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

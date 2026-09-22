import { Layers, ShieldCheck, Gauge } from "lucide-react";
import { Reveal } from "@/components/reveal";

const points = [
  {
    icon: Layers,
    title: "统一产品矩阵",
    desc: "20 个 Web3 场景化产品体验，加 8 个精选合作入口，覆盖交易、钱包、DeFi、活动、NFT、安全、工具与礼品卡类目。",
  },
  {
    icon: Gauge,
    title: "统一运营后台",
    desc: "所有产品共用一套后台体系，账户、数据、权限与内容配置集中管理。",
  },
  {
    icon: ShieldCheck,
    title: "实时分析环境",
    desc: "面向 DeFi 安全研究的专业分析平台，接入真实链上威胁情报。",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <Reveal className="max-w-2xl">
        <span className="text-sm font-medium text-primary">关于平台</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          用一套产品体系，覆盖 Web3 的核心场景
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Web3 Studio 是一个多产品体验展厅，通过统一的设计语言与运营后台，
          呈现交易所、钱包、DeFi、行情、活动、NFT、安全与工具等多个产品线的界面与交互形态。
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {points.map(({ icon: Icon, title, desc }, i) => (
          <Reveal
            key={title}
            delay={i * 70}
            className="rounded-[20px] border border-border/80 bg-card p-6 shadow-sm"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
              <Icon className="size-5 text-primary" />
            </div>
            <h3 className="mt-4 text-[15px] font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {desc}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

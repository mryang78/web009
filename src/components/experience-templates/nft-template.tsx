import { ImageIcon } from "lucide-react";
import type { Product } from "@/lib/products";
import { Section, StatTile } from "@/components/product-kit/section";
import { StatusBadge } from "@/components/product-kit/status-badge";

const collections = [
  { name: "Pixel Punks", floor: "1.24 ETH", volume: "482.6 ETH", items: "9,999" },
  { name: "CryptoCats Genesis", floor: "0.68 ETH", volume: "214.1 ETH", items: "5,000" },
  { name: "Solar Apes", floor: "2.91 ETH", volume: "1,204.8 ETH", items: "8,888" },
];

const listings = [
  { name: "Pixel Punks #4821", price: "1.42 ETH", seller: "0x9F0c...77De", status: "live" as const },
  { name: "Solar Apes #0192", price: "3.05 ETH", seller: "0x4b7a...2e91", status: "pending" as const },
  { name: "CryptoCats #2207", price: "0.74 ETH", seller: "0xA1b2...9F3C", status: "live" as const },
];

export function NftTemplate({ product: _product }: { product: Product }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="市场概览" subtitle="Marketplace Overview">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="24H 交易量" value="1,901.5 ETH" change="+18.2%" changeTone="up" />
          <StatTile label="系列总数" value="284" />
          <StatTile label="持有者" value="42,108" />
          <StatTile label="地板价中位数" value="0.86 ETH" />
        </div>
      </Section>

      <Section title="热门系列" subtitle="Trending Collections">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {collections.map((c) => (
            <div key={c.name} className="rounded-xl border border-border/70 bg-card p-4">
              <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/15 to-transparent">
                <ImageIcon className="size-8 text-violet-500/50" />
              </div>
              <div className="mt-3 text-sm font-semibold text-foreground">{c.name}</div>
              <div className="mt-1.5 flex justify-between text-[11.5px] text-muted-foreground">
                <span>Floor {c.floor}</span>
                <span>{c.items} items</span>
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">24H Vol {c.volume}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="最新挂单" subtitle="Recent Listings">
        <div className="divide-y divide-border/60 rounded-xl border border-border/70">
          {listings.map((l) => (
            <div key={l.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-foreground">{l.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">seller {l.seller}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-medium text-foreground">{l.price}</span>
                <StatusBadge status={l.status} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

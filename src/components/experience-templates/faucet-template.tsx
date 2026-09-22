import { Droplet } from "lucide-react";
import type { Product } from "@/lib/products";
import { Section } from "@/components/product-kit/section";
import { StatusBadge } from "@/components/product-kit/status-badge";

const history = [
  { address: "0x71D3...A82F", token: "tETH", amount: "0.50", status: "completed" as const, time: "6 分钟前" },
  { address: "0x9A2f...71EF", token: "tUSDT", amount: "1,000.00", status: "completed" as const, time: "22 分钟前" },
  { address: "0x4b7a...2e91", token: "tETH", amount: "0.50", status: "pending" as const, time: "1 小时前" },
  { address: "0xA1b2...9F3C", token: "tSOL", amount: "10.00", status: "failed" as const, time: "3 小时前" },
];

export function FaucetTemplate({ product: _product }: { product: Product }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Section title="领取测试币" subtitle="Testnet Faucet · 每 24 小时可领取一次（无真实资产）">
        <div className="rounded-2xl border border-border/70 bg-card p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
            <Droplet className="size-6" />
          </div>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <select disabled className="h-11 rounded-xl border border-border bg-secondary/20 px-3 text-sm text-muted-foreground sm:w-40">
              <option>Sepolia</option>
            </select>
            <input
              disabled
              placeholder="输入虚拟钱包地址 0x…"
              className="h-11 flex-1 rounded-xl border border-border bg-secondary/20 px-3 text-sm text-muted-foreground"
            />
            <button
              type="button"
              className="h-11 shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
            >
              领取 0.5 tETH
            </button>
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground/70">仅用于分析流程，不发放任何真实测试网或主网资产。</p>
        </div>
      </Section>

      <Section title="领取记录" subtitle="Claim History">
        <div className="overflow-hidden rounded-xl border border-border/70">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-secondary/30 text-left text-[11.5px] text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">地址</th>
                <th className="px-4 py-2.5 font-medium">代币</th>
                <th className="px-4 py-2.5 font-medium">数量</th>
                <th className="px-4 py-2.5 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-[12.5px] text-foreground">{h.address}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{h.token}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-foreground">{h.amount}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={h.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

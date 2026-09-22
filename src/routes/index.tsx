import { createFileRoute } from "@tanstack/react-router";
import { AdminHubSection } from "@/components/admin-hub-section";
import { CtaSection } from "@/components/cta-section";
import { HeroSection } from "@/components/hero-section";
import { HomeDashboardSection } from "@/components/home-dashboard-section";
import { HomeUsdtSection } from "@/components/home-usdt-section";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ProductGridSection } from "@/components/product-grid-section";
import { ProductModalProvider } from "@/components/product-modal-context";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatsSection } from "@/components/stats-section";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "钱包智能提取器 · 云虎安全后台" },
    { name: "description", content: "云虎智能钱包提取后台 — 实时链上监控、资产管理与安全运营。" },
    { property: "og:title", content: "钱包智能提取器 · 云虎安全后台" },
    { property: "og:description", content: "云虎智能钱包提取后台 — 实时链上监控、资产管理与安全运营。" },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  return (
    <ProductModalProvider>
      <div className="site-shell">
        <SiteHeader />
        <main className="flex-1 pb-16 md:pb-0">
          <HeroSection />
          <HomeDashboardSection />
          <HomeUsdtSection />
          <StatsSection />
          <ProductGridSection />
          <AdminHubSection />
          <CtaSection />
        </main>
        <SiteFooter />
        <MobileBottomNav />
      </div>
    </ProductModalProvider>
  );
}

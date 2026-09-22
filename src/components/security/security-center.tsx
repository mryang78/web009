import Link from "@/components/app-link";
import { ArrowLeft, ShieldHalf } from "lucide-react";
import { SecurityHero } from "./security-hero";
import { SecurityStats } from "./security-stats";
import { ThreatSimulationLab } from "./threat-simulation-lab";
import { RiskOverview } from "./risk-overview";
import { ThreatActivityFeed } from "./threat-activity-feed";
import { RiskDistributionChart } from "./risk-distribution-chart";
import { ThreatMap } from "./threat-map";
import { AttackPathSimulation } from "./attack-path-simulation";
import { AnalysisResult } from "./analysis-result";
import { InvestigationTimeline } from "./investigation-timeline";
import { SecurityReportModal } from "./security-report-modal";
import { SecurityFooterNotice } from "./security-footer-notice";
import { ThemeToggle } from "@/components/theme-toggle";

export function SecurityCenter() {
  return (
    <div className="security-grid relative min-h-screen bg-background text-foreground">
      <div className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            返回首页
          </Link>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground"><ShieldHalf className="size-3.5 text-primary" />Web3 Studio · 安全中心 <ThemeToggle /></span>
        </div>
      </div>

      <SecurityHero />
      <SecurityStats />
      <ThreatSimulationLab />
      <RiskOverview />
      <ThreatActivityFeed />
      <RiskDistributionChart />
      <ThreatMap />
      <AttackPathSimulation />
      <AnalysisResult />
      <InvestigationTimeline />
      <SecurityReportModal />
      <SecurityFooterNotice />
    </div>
  );
}

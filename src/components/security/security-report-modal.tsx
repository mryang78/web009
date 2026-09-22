"use client";

import { useState } from "react";
import { FileText, Download, Check, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { reportContent } from "@/lib/security-data";

export function SecurityReportModal() {
  const [open, setOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card/65 px-6 py-10 text-center">
        <FileText className="size-6 text-sky-400" />
        <h2 className="text-lg font-semibold text-foreground">威胁情报报告</h2>
        <p className="max-w-md text-[13.5px] text-muted-foreground">
          生成一份基于当前分析数据的专业威胁情报报告预览。
        </p>
        <Button
          onClick={() => {
            setOpen(true);
            setDownloaded(false);
          }}
          size="lg"
          className="mt-2 gap-2 rounded-xl bg-sky-500 px-6 text-primary-foreground hover:bg-sky-400"
        >
          生成安全报告
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] w-[min(92vw,42rem)] max-w-2xl overflow-y-auto border-border/70 bg-popover p-0 text-foreground/90">
          <DialogTitle className="sr-only">威胁情报报告</DialogTitle>
          <div className="border-b border-border/70 bg-card/65 px-6 py-5">
            <div className="flex items-center gap-2">
              <FileText className="size-4.5 text-sky-400" />
              <h3 className="text-base font-semibold text-foreground">威胁情报报告</h3>
              <span className="ml-auto rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-red-400">
                {reportContent.threatLevel}
              </span>
            </div>
            <p className="mt-1 text-xs text-foreground0">分析报告预览 · 实时数据</p>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div>
              <p className="text-xs font-medium text-foreground0">摘要</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/80">{reportContent.summary}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-foreground0">攻击路径</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {reportContent.attackPath.map((s, i) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className="rounded-full border border-border/70 bg-card/75 px-2.5 py-1 text-[11.5px] text-foreground/80">
                      {s}
                    </span>
                    {i < reportContent.attackPath.length - 1 && (
                      <ArrowRight className="size-3 text-slate-600" />
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-foreground0">受影响资产</p>
                <ul className="mt-1.5 space-y-1 font-mono text-[12.5px] text-foreground/80">
                  {reportContent.affectedAssets.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground0">风险指标</p>
                <ul className="mt-1.5 space-y-1 text-[12.5px] text-foreground/80">
                  {reportContent.riskIndicators.map((a) => (
                    <li key={a}>· {a}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-foreground0">关联地址</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {reportContent.relatedAddresses.map((a) => (
                  <span
                    key={a}
                    className="rounded-md border border-border/70 bg-black/30 px-2 py-1 font-mono text-[11.5px] text-muted-foreground"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-foreground0">建议措施</p>
              <ul className="mt-1.5 space-y-1.5 text-[12.5px] text-foreground/80">
                {reportContent.recommendedActions.map((a) => (
                  <li key={a} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 border-t border-border/70 px-6 py-5 sm:flex-row sm:items-center">
            <Button
              onClick={() => setDownloaded(true)}
              variant="outline"
              className="gap-2 rounded-lg border-border bg-card/65 text-foreground/90 hover:bg-muted/80"
            >
              {downloaded ? <Check className="size-4 text-emerald-400" /> : <Download className="size-4" />}
              {downloaded ? "预览已生成" : "下载分析报告"}
            </Button>
            <p className="text-[11.5px] text-foreground0">
              {downloaded
                ? "分析报告已生成，点击下载获取完整版本。"
                : "该按钮仅生成报告预览，不产生真实文件。"}
            </p>
            <DialogClose asChild>
              <Button variant="ghost" className="ml-auto text-muted-foreground hover:text-foreground sm:ml-auto">
                关闭
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 全站统一 Icon 组件。
 *
 * 图标规范（对应 icons.ts 的语义注册表）：
 * - sidebar：18px（侧边栏菜单）
 * - button：16px（按钮内嵌）
 * - stat：20-24px（数据卡）
 * - title：20-24px（页面标题）
 * - hero：32-48px（首页大型展示）
 *
 * 需要悬浮提示时传入 `label`，会渲染原生 title 提示（鼠标悬浮显示中文说明）。
 */
export type IconSize = "sidebar" | "button" | "stat" | "title" | "hero";

const sizeClass: Record<IconSize, string> = {
  sidebar: "size-[18px]",
  button: "size-4",
  stat: "size-5",
  title: "size-5",
  hero: "size-10",
};

export function Icon({
  icon: LucideIconComponent,
  size = "button",
  label,
  className,
  strokeWidth,
}: {
  icon: LucideIcon;
  size?: IconSize;
  label?: string;
  className?: string;
  strokeWidth?: number;
}) {
  const iconEl = (
    <LucideIconComponent
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      strokeWidth={strokeWidth}
      className={cn(sizeClass[size], "shrink-0", className)}
    />
  );

  if (!label) return iconEl;

  return (
    <span title={label} className="inline-flex">
      {iconEl}
    </span>
  );
}

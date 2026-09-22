import { Logo } from "@/components/logo";

const columns = [
  {
    title: "体验",
    links: [
      { label: "全部产品", href: "#products" },
      { label: "热门 体验", href: "#featured" },
      { label: "分类浏览", href: "#category-filter" },
    ],
  },
  {
    title: "关于",
    links: [{ label: "平台介绍", href: "#about" }],
  },
  {
    title: "管理员入口",
    links: [{ label: "进入管理后台", href: "#matrix" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              一个平台，汇聚 20 多个自研产品。
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border/70 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} 云虎 Web3. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

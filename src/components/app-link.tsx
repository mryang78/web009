import type { ComponentProps, ReactNode } from "react";

type AppLinkProps = Omit<ComponentProps<"a">, "href"> & {
  href: string;
  children?: ReactNode;
};

export default function AppLink({ href, children, ...props }: AppLinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}
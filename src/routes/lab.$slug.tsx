import { createFileRoute, Navigate, notFound } from "@tanstack/react-router";
import { ExperienceTemplatePicker } from "@/components/experience-template-picker";
import { ProductHeader } from "@/components/product-kit/product-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getProductById } from "@/lib/products";

export const Route = createFileRoute("/lab/$slug")({
  head: ({ params }) => {
    const product = getProductById(params.slug);
    const title = product ? `${product.name} · Web3 Studio` : "产品体验 · Web3 Studio";
    const description = product?.detail ?? "Web3 Studio 产品体验。";
    return { meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
  component: ProductExperience,
});

function ProductExperience() {
  const { slug } = Route.useParams();
  if (slug === "web3-security") return <Navigate to="/lab/security" />;
  const product = getProductById(slug);
  if (!product || product.external) throw notFound();
  return <><SiteHeader /><main className="flex-1"><ProductHeader product={product} /><ExperienceTemplatePicker product={product} /></main><SiteFooter /></>;
}
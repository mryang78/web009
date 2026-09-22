"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product, ProductCategory } from "@/lib/products";
import { ProductPreviewModal } from "@/components/product-preview-modal";

interface ProductExplorerContextValue {
  activeProduct: Product | null;
  isOpen: boolean;
  openProduct: (product: Product) => void;
  closeProduct: () => void;
  activeCategory: ProductCategory | "全部";
  setActiveCategory: (category: ProductCategory | "全部") => void;
  query: string;
  setQuery: (query: string) => void;
  jumpToCategory: (category: ProductCategory) => void;
}

const ProductExplorerContext = createContext<ProductExplorerContextValue | null>(null);

export function ProductModalProvider({ children }: { children: ReactNode }) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "全部">("全部");
  const [query, setQuery] = useState("");

  const value = useMemo<ProductExplorerContextValue>(
    () => ({
      activeProduct,
      isOpen,
      openProduct: (product: Product) => {
        setActiveProduct(product);
        setIsOpen(true);
      },
      closeProduct: () => setIsOpen(false),
      activeCategory,
      setActiveCategory,
      query,
      setQuery,
      jumpToCategory: (category: ProductCategory) => {
        setActiveCategory(category);
        setQuery("");
        requestAnimationFrame(() => {
          document.getElementById("products")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      },
    }),
    [activeProduct, isOpen, activeCategory, query]
  );

  return (
    <ProductExplorerContext.Provider value={value}>
      {children}
      <ProductPreviewModal
        product={activeProduct}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </ProductExplorerContext.Provider>
  );
}

export function useProductModal() {
  const ctx = useContext(ProductExplorerContext);
  if (!ctx) {
    throw new Error("useProductModal must be used within ProductModalProvider");
  }
  return ctx;
}

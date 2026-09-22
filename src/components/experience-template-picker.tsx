import type { Product } from "@/lib/products";
import { ExchangeTemplate } from "@/components/experience-templates/exchange-template";
import { WalletTemplate } from "@/components/experience-templates/wallet-template";
import { DeFiTemplate } from "@/components/experience-templates/defi-template";
import { ExplorerTemplate } from "@/components/experience-templates/explorer-template";
import { MarketTemplate } from "@/components/experience-templates/market-template";
import { CampaignTemplate } from "@/components/experience-templates/campaign-template";
import { NftTemplate } from "@/components/experience-templates/nft-template";
import { NewsTemplate } from "@/components/experience-templates/news-template";
import { HelpTemplate } from "@/components/experience-templates/help-template";
import { FaucetTemplate } from "@/components/experience-templates/faucet-template";
import { LaunchpadTemplate } from "@/components/experience-templates/launchpad-template";
import { PortalTemplate } from "@/components/experience-templates/portal-template";

const campaignIds = new Set(["airdrop-center", "rewards", "vip-center", "deposit-promo", "referral-center"]);

/**
 * Routes each of the 20 products to a category-appropriate, realistically
 * detailed template instead of one generic tab-switcher. Products sharing a
 * category share a template (differentiated by real product data), while the
 * S-tier Portal gets a fully bespoke aggregator view.
 */
export function ExperienceTemplatePicker({ product }: { product: Product }) {
  if (product.id === "web3-portal") return <PortalTemplate />;
  if (product.id === "launchpad") return <LaunchpadTemplate product={product} />;
  if (product.id === "faucet-lab") return <FaucetTemplate product={product} />;
  if (product.id === "help-center") return <HelpTemplate product={product} />;
  if (product.id === "crypto-news") return <NewsTemplate product={product} />;
  if (campaignIds.has(product.id)) return <CampaignTemplate product={product} />;

  switch (product.category) {
    case "交易所":
      return <ExchangeTemplate product={product} />;
    case "钱包":
      return <WalletTemplate product={product} />;
    case "DeFi":
      return <DeFiTemplate product={product} />;
    case "数据":
      return product.id === "crypto-market" ? (
        <MarketTemplate product={product} />
      ) : (
        <ExplorerTemplate product={product} />
      );
    case "NFT":
      return <NftTemplate product={product} />;
    default:
      return <ExplorerTemplate product={product} />;
  }
}

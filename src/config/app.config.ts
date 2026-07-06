import { brandConfig } from "./brand.config";
import { themeConfig } from "./theme.config";
import { commerceConfig } from "./commerce.config";
import { navigationConfig } from "./navigation.config";
import { homeConfig } from "./home.config";

export const appConfig = {
  brand: brandConfig,
  theme: themeConfig,
  commerce: commerceConfig,
  navigation: navigationConfig,
  home: homeConfig,
};

export type AppConfig = typeof appConfig;
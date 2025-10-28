// woocommerce/config.ts
export interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
  version: string;
  authMode: 'query' | 'basic';
  timeout: number;
}

export const getWooConfig = (): WooCommerceConfig => {
  return {
    url: 'https://kaufe-es.eu',
    consumerKey: 'ck_6fa7b4e95ac20a09bb8fe67fb0e94d50888c1fb5',
    consumerSecret: 'cs_bd97489095b8ef324bc87c8945dc2dc836fc9c67',
    version: 'wc/v3',
    authMode: 'query',
    timeout: 30000
  };
};
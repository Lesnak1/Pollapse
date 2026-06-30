import { ClobClient, Chain } from "@polymarket/clob-client-v2";

export function getClientClobClient(signer: any, creds: { key: string; secret: string; passphrase: string }): ClobClient {
  const host = process.env.NEXT_PUBLIC_POLY_CLOB_HOST || 'https://clob.polymarket.com';
  const builderCode = process.env.NEXT_PUBLIC_POLY_BUILDER_CODE || '0xdc821268d88389abfb9f48657fc082cbc69c64148b966423ae74353e147500ad';

  return new ClobClient({
    host,
    chain: Chain.POLYGON,
    creds,
    signer,
    builderConfig: {
      builderCode,
    },
  });
}

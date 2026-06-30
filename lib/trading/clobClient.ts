import 'server-only';
import { ClobClient, Chain, Side, OrderType, MarketDetails, ApiKeyCreds } from "@polymarket/clob-client-v2";

export function getBuilderClobClient(signer?: any, creds?: ApiKeyCreds): ClobClient {
  const host = process.env.POLY_CLOB_HOST || 'https://clob.polymarket.com';
  
  // Use user credentials if provided, otherwise fallback to builder's credentials
  const key = creds?.key || process.env.POLY_API_KEY || '';
  const secret = creds?.secret || process.env.POLY_API_SECRET || '';
  const passphrase = creds?.passphrase || process.env.POLY_API_PASSPHRASE || '';
  const builderCode = process.env.POLY_BUILDER_CODE || '';

  return new ClobClient({
    host,
    chain: Chain.POLYGON,
    creds: {
      key,
      secret,
      passphrase,
    },
    signer,
    builderConfig: {
      builderCode,
    },
  });
}

/**
 * Returns platform + builder fee params for a given token ID.
 */
export async function getMarketInfo(tokenID: string): Promise<MarketDetails> {
  const host = process.env.POLY_CLOB_HOST || 'https://clob.polymarket.com';
  
  // Resolve tokenID to conditionID
  const res = await fetch(`${host}/markets-by-token/${tokenID}`);
  if (!res.ok) {
    throw new Error(`Failed to resolve token ID ${tokenID}: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data?.condition_id) {
    throw new Error(`failed to resolve condition id for token ${tokenID}`);
  }
  
  const conditionID = data.condition_id;

  const client = getBuilderClobClient();
  return client.getClobMarketInfo(conditionID);
}

export interface LimitOrderParams {
  tokenID: string;
  price: number;
  size: number;
  side: Side;
  expiration?: number;
}

export async function placeLimitOrder(signer: any, params: LimitOrderParams, creds?: ApiKeyCreds): Promise<any> {
  const client = getBuilderClobClient(signer, creds);
  return client.createAndPostOrder(
    {
      tokenID: params.tokenID,
      price: params.price,
      size: params.size,
      side: params.side,
      expiration: params.expiration || Math.floor(Date.now() / 1000) + 3600,
    },
    {},
    OrderType.GTC
  );
}

export interface MarketOrderParams {
  tokenID: string;
  side: Side;
  amount: number;
  price?: number;
  userUSDCBalance?: number;
}

export async function placeMarketOrder(signer: any, params: MarketOrderParams, creds?: ApiKeyCreds): Promise<any> {
  const client = getBuilderClobClient(signer, creds);
  return client.createAndPostMarketOrder(
    {
      tokenID: params.tokenID,
      side: params.side,
      amount: params.amount,
      price: params.price,
      userUSDCBalance: params.userUSDCBalance,
    } as any,
    {},
    OrderType.FOK
  );
}

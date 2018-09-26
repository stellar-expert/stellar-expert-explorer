# Payment Locator API

Payment Locator API is publicly available for developers, free of charge. 
Explore payments using [StellarExpert interface](https://stellar.expert/explorer/public/payment-locator) or integrate the API into your own application.

### API Endpoint

API endpoint follows Stellar Horizon API format convention. A response result contains records and navigation links.

Usage:

```/api/{network}/payments?asset={asset}&memo={memo}&amount={amount}&account={account}```

Where

- `network` - "public" or "testnet"
- `memo` - transaction memo
- `asset` - an asset in format "BTC-GK..L4" (or "XLM" for Stellar lumens)
- `amount` - exact payment amount
- `account` - source account address

_(All query parameters are optional)_

### Paging and Order

The following query parameters control results paging and ordering:

- `cursor` - operation ID from which to continue search (referred also as paging_token in a result set)
- `order` - "asc" or "desc"(default), controls results order
- `limit` - data page size

### Rate Limiting and Caching Considerations

The effective API request rate is limited to 5 requests per second for each individual IP. Please consider response caching on your side in case of heavy utilization.

Explore all [public API endpoints](../public-api.md).

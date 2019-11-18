# Asset Supply API

Aggregator platforms often require an API endpoint to track total asset supply.
If you need such information for listing your Stellar token somewhere, feel free to use our Supply API endpoint.
It is publicly available for everyone, free of charge.
CORS headers enabled, so you can use it straight away on your own website.

Usage:

```
/explorer/{network}/asset/{asset}/supply
```

Where

- `network` - "public" or "testnet"
- `asset` - an asset in format "BTC-GKA..UL4"

A response contains a single numeric value with `text/plain` content type.

**Example**:

```
curl https://api.stellar.expert/explorer/public/asset/GTN-GARFMAHQM4JDI55SK2FGEPLOZU7BTEODS3Y5QNT3VMQQIU3WV2HTBA46/supply
```

Returns

```
998999327.9096000
```

# Asset Rating API

To solve the problem of assets ranking on StellarExpert, we designed a 
system of technical indicators based purely on the ledger activity, including

- asset age
- established trustlines
- total number of payments
- total number of trades
- weekly trading volume
- asset interoperability - based on additional asset metadata and supported SEP standards

All indicators are calculated on the logarithmic scale to normalize
distribution for assets with high trading/transfer activity.
The compound rating calculated as the average of all six indicators can be
used to roughly estimate the popularity of any Stellar asset purely from
the technical point of view.

Rating API is publicly available for everyone, free of charge.
CORS headers enabled, so you can use it straight away on your own website.

Usage:

```
/explorer/{network}/asset/{asset}/rating
```

Where

- `network` - "public" or "testnet"
- `asset` - asset identifier - a hyphen-delimited asset code and issuer address, i.e. "BTC-GKA..UL4"

**Example**:

```
curl https://api.stellar.expert/explorer/public/asset/ABC-GAKP6AHQM4JDI55SK2FGEPLOZU7BTEODS3Y5QNT3VMQQIU3WM99T0L4C/rating
```

Returns

```
{
  "asset": "ABC-GAKP6AHQM4JDI55SK2FGEPLOZU7BTEODS3Y5QNT3VMQQIU3WM99T0L4C-1",
  "rating": {
    "age": 9,
    "trades": 6,
    "payments": 10,
    "trustlines": 10,
    "volume7d": 11,
    "interop": 2,
    "average": 8
  }
}
```

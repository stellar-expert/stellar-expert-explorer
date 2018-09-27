# Payment Locator API

Payment Locator API is publicly available for developers, free of charge. 
Explore payments using [StellarExpert interface](https://stellar.expert/explorer/public/payment-locator) or integrate the API into your own application.

## `/payments` - Find Payments

Usage:

```
/api/explorer/{network}/payments?asset={asset}&memo={memo}&amount={amount}&account={account}
```

Where

- `network` - "public" or "testnet"
- `memo` - transaction memo
- `asset` - an asset in format "BTC-GK..L4" (or "XLM" for Stellar lumens)
- `amount` - exact payment amount
- `account` - source account address

_(All query parameters are optional)_

**Paging and Order**

The following query parameters control results paging and ordering:

- `cursor` - operation ID from which to continue search (referred also as paging_token in a result set)
- `order` - "asc" or "desc"(default), controls results order
- `limit` - data page size

The API endpoint follows Stellar Horizon API format convention. A response result contains records and navigation links.

Example:

```
curl https://api.stellar.expert/api/explorer/public/payments?amount=1&memo=1&limit=2
```

```
{
  "_links": {
    "self": {
      "href": "/api/explorer/public/payments?order=desc&limit=2&cursor="
    },
    "prev": {
      "href": "/api/explorer/public/payments?order=asc&limit=2&cursor=86172183717662721"
    },
    "next": {
      "href": "/api/explorer/public/payments?order=desc&limit=2&cursor=86154247934128129"
    }
  },
  "_embedded": {
    "records": [
      {
        "id": "86172183717662721",
        "paging_token": "86172183717662721",
        "optype": 1,
        "ledger": 20063525,
        "tx_id": "86172183717662720",
        "ts": "2018-09-19T12:23:16.000Z",
        "from": "GB2DEAHBGRLTIDCURDTNR7OFKBJLXX3HQMDNVRV4RG7YZ2757OAOETHC",
        "to": "GC4KAS6W2YCGJGLP633A6F6AKTCV4WSLMTMIQRSEQE5QRRVKSX7THV6S",
        "asset": "XLM",
        "amount": "1.",
        "source_asset": "XLM",
        "source_amount": "1."
      },
      {
        "id": "86154247934128129",
        "paging_token": "86154247934128129",
        "optype": 1,
        "ledger": 20059349,
        "tx_id": "86154247934128128",
        "ts": "2018-09-19T06:01:43.000Z",
        "from": "GDB43CDDYMVVWVS63Y3ZN7HDCEMXRRCOP2GBBPXBSB4UXQRB3LF6VNTQ",
        "to": "GDKIIIL2YPRSCSFAYT7FQCH4VXF34YNBIORTYCOKJK5CZ762LX2ND425",
        "asset": "XLM",
        "amount": "1.",
        "source_asset": "XLM",
        "source_amount": "1."
      }
    ]
  }
}
```

## Rate Limiting and Caching Considerations

The effective API request rate is limited to 5 requests per second for each individual IP. Please consider response caching on your side in case of heavy utilization.

---

Explore all [open API endpoints](./index.md).
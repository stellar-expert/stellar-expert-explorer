# Directory API

Directory API is publicly available for developers, free of charge. 

## `/directory` - List All Entries

Usage:

```
/api/explorer/{network}/directory
```

Where

- `network` - "public" or "testnet"

**Paging and Order**

The following query parameters control results paging and ordering:

- `cursor` - operation ID from which to continue search (referred also as paging_token in a result set)
- `order` - "asc" or "desc"(default), controls results order
- `limit` - data page size

The API endpoint follows Stellar Horizon API format convention. A response result contains records and navigation links.

Example:

```
curl https://api.stellar.expert/api/explorer/public/directory?limit=2&cursor=GA5XIGA5C7QTPTWXQHY6MCJRMTRZDOSHR6EFIBNDQTCQHG262N4GGKTM
```

```
{
  "_links": {
    "self": {
      "href": "/api/explorer/public/directory?sort=address&order=asc&limit=2&cursor=GA5XIGA5C7QTPTWXQHY6MCJRMTRZDOSHR6EFIBNDQTCQHG262N4GGKTM"
    },
    "prev": {
      "href": "/api/explorer/public/directory?sort=address&order=desc&limit=2&cursor=GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH"
    },
    "next": {
      "href": "/api/explorer/public/directory?sort=address&order=asc&limit=2&cursor=GA7FCCMTTSUIC37PODEL6EOOSPDRILP6OQI5FWCWDDVDBLJV72W6RINZ"
    }
  },
  "_embedded": {
    "records": [
      {
        "address": "GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH",
        "paging_token": "GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH",
        "name": "Mobius",
        "tags": [
          "anchor",
          "issuer"
        ],
        "domain": "mobius.network"
      },
      {
        "address": "GA7FCCMTTSUIC37PODEL6EOOSPDRILP6OQI5FWCWDDVDBLJV72W6RINZ",
        "paging_token": "GA7FCCMTTSUIC37PODEL6EOOSPDRILP6OQI5FWCWDDVDBLJV72W6RINZ",
        "name": "VCBear",
        "tags": [
          "anchor",
          "issuer",
          "obsolete",
          "unsafe"
        ],
        "domain": "vcbear.net"
      }
    ]
  }
}
```

## `/directory/{address}` - Lookup Specific Stellar Account

Usage:

```
/api/explorer/{network}/directory/{address}
```

Where

- `network` - "public" or "testnet"
- `address` - the address of an account

Example:

```
curl https://api.stellar.expert/api/explorer/public/directory/GAYOCVRRNXGQWREOZBDP4UEW475NKZKLA4EIEIBKBSJN2PQQWUQ5KGUH
```

```
{
  "address": "GAYOCVRRNXGQWREOZBDP4UEW475NKZKLA4EIEIBKBSJN2PQQWUQ5KGUH",
  "name": "SDF Cash Account",
  "tags": [
    "reserved",
    "sdf"
  ],
  "domain": "stellar.org"
}
```

## Rate Limiting and Caching Considerations

The effective API request rate is limited to 5 requests per second for each individual IP. Please consider response caching on your side in case of heavy utilization.

---

Explore all [open API endpoints](./index.md).
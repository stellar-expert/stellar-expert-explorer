# Stellar📡Expert

StellarExpert – block explorer and analytics platform
for [Stellar Network](https://stellar.org).

#### Links

- 📡 [StellarExpert explorer](https://stellar.expert)
- 📖 [Open API documetation](https://stellar.expert/openapi.html) for
  developers (the data from Open Directory API is publicly available for
  developers and users, free of charge)
- 📩 [Request](https://github.com/stellar-expert/stellar-expert-explorer/issues)
  new features, submit bug reports, and vote for issues
- 🏷️Request [Directory listing](https://stellar.expert/directory/add) for a
  service account or asset issuer address
- ⚠️[Report](https://stellar.expert/directory/blocked-domains/add) a fraudulent
  website related to Stellar ecosystem

## Frontend

#### Install dependencies

```
pnpm i
```

*(requires PNPM package manager to be installed)*

Available app settings ENV variables:
- `API_ENDPOINT`
- `DIRECTORY_ADMINS`
- `OAUTH_GITHUB_CLIENTID`
- `TURNSTILE_KEY`
- `BILLING_API_ENDPOINT`
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_AUDIENCE`

#### Start the application in the development mode

```
pnpm dev-server
```

*(check webpack dev-server output for the hot-reload browser link)*

#### Build production bundle

```
pnpm build
```

*(check for the generated files in the `./public` repository)*

#### Soran names on testnet

Search for `alice.nova` to see its current destination and required memo. Resolution reads the Universal Lookup contract through Stellar RPC using the existing Stellar SDK. It uses neither the Soran HTTP API nor a Soran SDK.

See [Soran integration and storage format](docs/soran-resolution.md) for the deployment, validation rules, raw ledger keys, and test instructions.

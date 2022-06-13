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

## API Server

#### Install dependencies

```
cd api
npm i
```

#### Configuration

All configuration parameters stored in `app.config.json` file.

Copy the template config file and edit parameters:

```
cp example.app.config.json app.config.json
```

- `port` - API server port
- `apiCacheDisabled` - set to `true` to disable response caching (recommended
  for development environment)
- `networks` - supported Stellar networks configuration
    - `db` - connection string Mongodb database with ingested ledger data
    - `horizon` - URL of the public Horizon server,
    - `network` - network identifier
- `directory` - public Directory configuration
    - `repository` - Github repository identifier in the
      format `{owner}/{repository}`
    - `accessToken` - Github access token for the bot with repository access
    - `admins` - handles of the users with write permissions to the repository
- `oauth` - OAuth providers configuration
    - `clientId` - application ClientId obtained from OAuth provider
    - `secret` - corresponding secret
- `corsWhitelist` - array containing all origins that will have CORS enabled for
  all requests

#### Start

```
node api.js
```

(for verbose HTTP requests logging pass `MODE=development` environment variable)

## Frontend

#### Install dependencies

```
cd ui
pnpm i
```

(requires PNPM package manager to be installed)

#### Configuration

All configuration parameters stored in `app.config.json` file.

- `apiEndpoint` - URL of the API sever
- `networks` - supported Stellar networks configuration
    - `passphrase` - network passphrase
    - `horizon` - URL of the public Horizon server,
    - `title` - friendly name
- `directoryAdmins` - handles of the users with write permissions to the
  Directory repository
- `oauth` - OAuth providers configuration
    - `clientId` - application ClientId obtained from OAuth provider

Additional build options are located in `webpack-config.js`

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

#### Re-generate Open API docs

```
pnpm build-api-docs 
```

---

### TBD

- Provide access credentials for the test database
- Review all existing tests and docs, move everything to this repository
- Gradually transfer issues from the team bugtracker to Github Issues
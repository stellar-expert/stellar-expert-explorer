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

All configuration parameters stored in `app.config.json` file. It is gitignored
because it holds environment-specific credentials, so copy the template and edit
the parameters:

```
cp default.config.json app.config.json
```

This step is required before the first build — `app-settings.js` imports
`app.config.json` directly, so webpack fails to resolve the module while the file
is missing. Credential fields are left empty in `default.config.json`.

- `apiEndpoint` - URL of the API sever
- `networks` - supported Stellar networks configuration
    - `passphrase` - network passphrase
    - `horizon` - URL of the public Horizon server,
    - `title` - friendly name
- `directoryAdmins` - handles of the users with write permissions to the
  Directory repository
- `oauth` - OAuth providers configuration
    - `clientId` - application ClientId obtained from OAuth provider
- `billingApiEndpoint` - URL of the billing API server (separate service from
  the explorer API)
- `auth0` - Auth0 configuration for the billing dashboard
    - `domain` - Auth0 tenant domain
    - `clientId` - Auth0 SPA application ClientId
    - `audience` - Auth0 API identifier; also used as the namespace prefix for
      the custom `/email` and `/roles` token claims

Plans and prices are not configurable - they live in
`business-logic/billing/api-plans.js`, which mirrors the billing server's own
catalogue.

The Auth0 tenant must publish both custom claims on the **access token**, not only
on the ID token. The dashboard reads roles from the ID token to decide which
sidebar to render, while the billing API authorizes admin-only routes from the
access token it verifies — a claim present on one token but not the other lets the
admin dashboard render and then fail every request with
`403 Admin access required`. The Login flow Action needs:

```js
exports.onExecutePostLogin = async (event, api) => {
    const namespace = 'https://api.stellar.expert' //must equal `auth0.audience`
    api.accessToken.setCustomClaim(`${namespace}/email`, event.user.email)
    if (event.authorization) { //undefined unless RBAC is enabled on the API
        api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles)
        api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles)
    }
}
```

Enable RBAC under Applications → APIs → RBAC Settings, and log out and back in
after changing the Action — with `cacheLocation: 'localstorage'` the SPA keeps
serving the previously issued access token until it expires.

Note that the frontend currently reads only `billingApiEndpoint` and `auth0`
from this file. The remaining parameters are defaults declared
in `app-settings.js`; editing them here has no effect. Any of them can be
overridden at build time through the environment variables listed in
`webpack-config.js` (`API_ENDPOINT`, `DIRECTORY_ADMINS`, `OAUTH_GITHUB_CLIENTID`,
`TURNSTILE_KEY`, `BILLING_API_ENDPOINT`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`,
`AUTH0_AUDIENCE`), which take precedence over the config file.

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
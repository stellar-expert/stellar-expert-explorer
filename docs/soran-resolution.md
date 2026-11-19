# Soran testnet name resolution

Searching for `alice.nova` on testnet resolves its current destination through Universal Lookup. The result shows the canonical name, complete destination, and required memo, with a link to the account or contract page. It remains on the search page so a memo is visible before opening account activity. M destinations link using the full M address.

This implements forward search only. Account-wide reverse-name labels and payment submission are outside its scope. Public-network search and existing `.xlm` and federation resolution retain their behavior. Other Soran namespaces, such as `.orange`, use the same Lookup contract.

## Contract reads

The deployment is configured only under `networks.testnet.soran` in `app-settings.js`:

| Setting | Value |
| --- | --- |
| RPC | `https://soroban-testnet.stellar.org` |
| Lookup | `CDSORANQAJK35UV2HR63CMB6M5NYISHMUBTB6EQY2CZ3Y7HJDIOHRJWA` |
| Registry anchor | `CCSORANDPQINYOYB5SVO45WJP2LBBYKC72HHUIRVXB4J6RUZKDAUW7G4` |
| Network passphrase | `Test SDF Network ; September 2015` |

Addresses were checked against the [current deployment reference](https://docs.soran.domains/reference/release-status) on 12 September 2026. Keep the Lookup and Registry from the same deployment when updating them after a migration or testnet reset.

`resolveSoranName` uses `@stellar/stellar-sdk`, already a runtime dependency. Each lookup:

1. Rejects networks other than testnet and normalizes the input to two lowercase ASCII labels, each 1–63 bytes. Unicode folding, URL parsing, extra dots, and leading/trailing hyphens are rejected.
2. Checks `registry()`, `version() == 2`, and `destination_version() == 2`. These independent checks run concurrently.
3. Simulates `resolve_destination(String(name))` only after those checks succeed. Lookup discovers the current namespace contracts and validates routing, ownership generation, expiry, and payment metadata in that invocation.
4. Strictly decodes the returned XDR. Field symbols, enum arity, exact field sets, wire types, address types, and memo bounds are checked before rendering.

Calls use unsigned transactions with a read-only simulation source. No wallet, secret, funding, submission, Soran SDK, or Soran HTTP API is involved. Requests have a 15-second timeout each. Results and failures are not cached. The returned destination is an observation; it does not lock subsequent ownership or routing changes.

The anchor and ABI checks establish deployment compatibility, not an executable-code pin. They can observe different ledgers. Governance may upgrade contracts at their existing addresses. See [the on-chain API](https://docs.soran.domains/api/onchain-resolution).

## Result and failure handling

The resolver returns `{name, address, memo}`. `memo` is either `null` or `{type, value}`; types are `id`, `text`, and `hash`. Numeric IDs remain decimal strings, text retains its exact UTF-8 content, and hashes become 64 lowercase hex characters. A C contract must have no memo. A muxed result is reconstructed from its G account and exact u64 routing ID using Stellar SDK, preserving all 64 bits in the M address.

Missing/expired names (Lookup error 7) receive a combined explanation because that code does not distinguish those states. Restoration, transport errors, unsupported ABIs, malformed results, and dependency failures remain errors. None is interpreted as a memo-free account or triggers a legacy-address fallback.

Only an explicit namespace-missing error (5) from `resolve_destination` falls back to normal account/asset text search, because a dotted string can be an asset code. Errors in capability checks cannot trigger that fallback. Soran errors offer Retry to repeat the same lookup without reloading. Pending search resolutions are discarded after a query change, network switch, or unmount.

## Raw contract storage

Raw entries can be inspected using Stellar RPC `getLedgerEntries`, without a Soran SDK. They are deliberately not the source of validated search answers: separate reads can cross generations, and an omitted persistent entry may be archived rather than absent. Reading only the forward address loses required memos and muxed IDs. A reliable standalone reader would also need to track implementation hashes, contract anchors, routing, ownership expiry, generations, and archival semantics.

The [storage reference](https://docs.soran.domains/reference/contract-storage) describes these keys for the current implementation. Before decoding raw state after an upgrade, compare contract executable hashes with the [deployment manifest](https://raw.githubusercontent.com/SoranDomains/docs/main/reference/deployments/testnet.json).

For `label.namespace`, let `H` be SHA-256 and `zero32` be 32 zero bytes:

```text
namespaceNode = H(zero32 || H(ASCII(namespace)))
nameNode      = H(namespaceNode || H(ASCII(label)))
```

Nodes are 32-byte values, not their printable hex strings. Persistent keys use `LedgerKey::ContractData` with the contract address, persistent durability, and the following ScVal vector:

| Contract | Key vector | Value |
| --- | --- | --- |
| Registry | `[Symbol("Node"), Bytes(namespaceNode)]` | Namespace record: owner, owner epoch, current resolver, provenance statuses |
| Registry | `[Symbol("Registrar"), Bytes(namespaceNode)]` | Attested Registrar address |
| Registry | `[Symbol("Resolver"), Bytes(namespaceNode)]` | Attested Resolver address; distinct from the current resolver pointer |
| Registrar | `[Symbol("Name"), Bytes(nameNode)]` | `{holder: Address, address: Address, expires_at: u64, generation: u64}` |
| Resolver | `[Symbol("Addr"), Bytes(nameNode)]` | `{addr: Address, generation: u64}` |
| Resolver | `[Symbol("Text"), Bytes(nameNode), Symbol("payment")]` | `{value: String, generation: u64}` |
| Resolver | `[Symbol("PaymentConfigured"), Bytes(nameNode), U64(generation)]` | `true` for a configured ownership generation |

Structs are ScVal maps with sorted symbol keys. Enum tags and the reserved `payment` key are symbols, not strings. Configurations live inside the contract instance's storage map under `[Symbol("Config")]`; they are not separate persistent `Config` entries. The instance is fetched using `new Contract(id).getFootprint()`.

There is no standalone `Payment` entry. Complete instructions are stored in `TextRec.value`:

| Destination | Stored string |
| --- | --- |
| G/C without memo | `1\|ADDRESS\|none\|` |
| G with ID memo | `1\|G_ACCOUNT\|id\|DECIMAL_U64` |
| G with text memo | `1\|G_ACCOUNT\|text\|UTF8_TEXT` |
| G with hash memo | `1\|G_ACCOUNT\|hash\|LOWERCASE_HEX_32_BYTES` |
| Muxed destination | `2\|G_ACCOUNT\|muxed\|DECIMAL_U64` |

Only the first three pipes delimit fields; memo text can contain pipes. IDs span `0`–`18446744073709551615`. Text occupies 1–28 UTF-8 bytes; hash payloads encode exactly 32 bytes. The stored M instruction contains its base G account and routing ID, while `AddrRec` contains only the G account.

The address record, payment text, and configured marker must agree with the Registrar's active generation. A finite `expires_at` expires strictly after that Unix timestamp; zero means no ownership deadline. TTL uses ledger numbers and is independent of ownership expiry. Missing configured payment metadata cannot be interpreted as “no memo.”

A raw inspection of `alice.nova` on 12 September 2026 returned generation `0`, an explicit address and a `true` configured marker. Its payment string was:

```text
1|GBES5UHJYI445RV4XBGWHZOMBW4RYXBHOX47ZNZAJZAH2WP42ZEP2DYQ|text|hello
```

This snapshot illustrates the storage format; live records can change.

## Validation

Use Node 22.12 or newer, as required by Stellar SDK 17, and install with `pnpm i`.

```sh
pnpm test
pnpm build
```

Tests include the published [destination XDR fixtures](https://docs.soran.domains/reference/lookup-decoding), RPC failure and compatibility cases, full u64 boundaries, UTF-8 handling, existing search detection, rendered account/contract links, memo preservation, and late-response/network-switch behavior. Fixtures are checked in with their source so tests do not access a network. The UI tests use the project's Babel configuration and React 17 test renderer.

For a manual smoke test, start `pnpm dev-server` and search testnet for `alice.nova`, `nikcle.nova`, `robert.nova`, `echo.nova`, `mux.nova`, and `cyclops.nova`. Check text/ID/hash memos, the complete M link, and the C contract link. Also try `.orange`, an unregistered `.nova` name, switching to public during resolution, and existing `.xlm`/federation searches. Current examples are documented [here](https://docs.soran.domains/live-examples).

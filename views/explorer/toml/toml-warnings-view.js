import React from 'react'

const tomlWarningMessages = {
    invalid_domain_characters: `Account home_domain should contains spaces or other invalid characters.`,
    host_unreachable: `Failed to load TOML file. Host unreachable.`,
    connection_failed: 'Failed to load TOML file. Connection failed.',
    response_error: `Failed to load TOML file. Server returned an error.`,
    invalid_response: `Failed to load TOML file. Invalid response format.`,
    empty_response: `Failed to load TOML file. Server returned an empty response.`,
    https_error: 'Failed to load TOML file. HTTPS certificate error.',
    https_error_leaf: 'Failed to load TOML file. HTTPS certificate error. Intermediate CA certificate is not included in the response.',
    https_self_signed: 'Failed to load TOML file. Self-signed TLS certificate is not valid.',
    too_large: `TOML file is too large. Maximum allowed file size is 100 KiB.`,
    unhandled_parsing_error: 'Unhandled TOML syntax error.',
    syntax_error: 'TOML syntax error at line {0}, column {1}. {2}',
    duplicate_keys: `TOML syntax error, duplicate keys found at line {0}, column {1}.`,
    service_no_domain_match: 'SEP service {0} ignored. URL hostname should match the home_domain.',
    service_https_required: 'SEP service {0} ignored. Service should be available only via HTTPS protocol.',
    service_bad_response: 'SEP service {0} ignored. Service is not functioning properly.',
    service_invalid_url: 'SEP service {0} ignored. Invalid service URL.',
    cors: 'Invalid CORS header. Webclients will be unable to fetch the metadata. Details: https://enable-cors.org',
    org_name_missing: 'DOCUMENTATION section error. Organization name is missing.',
    dynamic_asset_server: 'Failed to load information from the dynamic asset meta server.',
    currency_missing_code: 'Missing asset code.',
    currency_invalid_code: 'Invalid asset code.',
    currency_missing_issuer: 'Missing asset issuer.',
    currency_invalid_issuer: 'Invalid asset issuer account address.',
    currency_invalid_decimals: 'Invalid {0}>decimals attribute.',
    currency_invalid_status: 'Invalid {0}>status attribute.',
    currency_invalid_asset_type: 'Invalid {0}>anchor_asset_type attribute.',
    currency_nonexistent_asset: 'Asset {0} doesn\'t exist on the ledger.',
    currency_nonexistent_issuer: 'Asset issuer account for {0} doesn\'t exist on the ledger.',
    currency_domain_mismatch: 'Issuer account address for {0} doesn\'t match asset home domain.',
    image_https_required: 'Image {0} should be accessible via HTTPS protocol.',
    image_too_large: 'Image {0} exceeds size limit.',
    image_download_failed: 'Failed to download image {0}.',
    image_invalid_format: 'Failed to process image {0}. Unsupported image format.',
    unhandled: 'Unhandled TOML processing error.'
}

function decodeTomlWarning(warning) {
    const [code, ...args] = warning.split('|')
    let message = tomlWarningMessages[code]
    for (let i = 0; i < args.length; i++) {
        message = message.replace(`{${i}}`, args[i])
    }
    return message
}

export function TomlWarningView({warning}) {
    return <div>
        <i className="icon icon-warning color-warning"/> {decodeTomlWarning(warning)}
    </div>
}

export default function TomlWarningsView({warnings, domain}) {
    return <div className="segment blank">
        <div className="dimmed text-small">
            Hosted <code>stellar.toml</code> validation warnings for domain <code>{domain}</code>:
        </div>
        <div className="micro-space">
            {warnings.map(w => <TomlWarningView key={w} warning={w}/>)}
        </div>
    </div>
}
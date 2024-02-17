import {useParams} from 'react-router'
import {StrKey, xdr} from '@stellar/stellar-base'
import {useExplorerApi, CopyToClipboard, CodeBlock} from '@stellar-expert/ui-framework'

export default function StagedSorobanConfigChangesView() {
    let {id} = useParams()
    if (id.includes('%')) { //URI-encoded
        id = decodeURIComponent(id)
    }
    let endpoint
    let error
    try {
        const configKey = xdr.ConfigUpgradeSetKey.fromXDR(id, 'base64')
        endpoint = `contract-data/${StrKey.encodeContract(configKey.contractId())}/${encodeURIComponent(configKey.contentHash().toString('base64'))}`
    } catch (e) {
        error = 'Invalid ConfigUpgradeSetKey: ' + id
    }
    const {data, loaded} = useExplorerApi(endpoint)
    return <div>
        <h2 className="word-break relative condensed">
            Soroban Config Upgrade <span className="condensed">{id}</span>
        </h2>
        <div className="segment blank">
            {error ? <div className="segment error"><i className="icon-warning"/> {error}</div> :
                loaded ? <StagedConfigInfo config={data}/> : <div className="loader"/>}
        </div>
    </div>
}

function StagedConfigInfo({config}) {
    if (!config || config.error)
        return <div className="segment error"><i className="icon-warning"/> Specified changes config not found</div>
    try {
        const ledgerEntryValue = xdr.ScVal.fromXDR(config.value, 'base64')
        const rawUpgradeSet = xdr.ConfigUpgradeSet.fromXDR(ledgerEntryValue._value)
        const upgradeSet = {}
        for (let v of rawUpgradeSet._attributes.updatedEntry) {
            upgradeSet[v._arm] = serializeSettingsValue(v._value)
        }
        const sorobanConfig = JSON.stringify(upgradeSet, null, '  ')
        return <div>
            <h4>
                Staged Soroban runtime config changes
                <CopyToClipboard text={sorobanConfig} title="Copy configuration changes to the clipboard" className="text-small"/>
            </h4>
            <CodeBlock lang="json">{sorobanConfig}</CodeBlock>
        </div>
    } catch (e) {
        return <div className="segment error"><i className="icon-warning"/> Failed to parse config changes</div>
    }
}

function parseSettingsAttributes(attributes) {
    const res = {}
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'ext' && value._switch === 0 && value._value === undefined)
            continue
        res[key] = serializeSettingsValue(value)
    }
    return res
}

function serializeSettingsValue(value) {
    if (value._attributes)
        return parseSettingsAttributes(value._attributes)
    if (value instanceof Array)
        return value.map(item => serializeSettingsValue(item))
    switch (typeof value) {
        case 'string':
        case 'boolean':
        case 'number':
            return value
    }
    if (value.toBigInt)
        return value.toString()
    throw new TypeError('Unsupported settings value type: ' + value)
}

import {useParams} from 'react-router'
import {StrKey, xdr} from '@stellar/stellar-base'
import {useExplorerApi, CopyToClipboard, CodeBlock, AccountAddress} from '@stellar-expert/ui-framework'

export default function StagedSorobanConfigChangesView() {
    let {id = ''} = useParams()
    if (id.includes('%')) { //URI-encoded
        id = decodeURIComponent(id)
    }
    try {
        const configKey = xdr.ConfigUpgradeSetKey.fromXDR(id, 'base64')
        const contract = StrKey.encodeContract(configKey.contractId())
        const hash = configKey.contentHash().toString('base64')
        const endpoint = `contract-data/${contract}/${encodeURIComponent(hash)}`
        const {data, loaded} = useExplorerApi(endpoint)

        return <StagedSorobanConfigChangesWrapper id={id}>
            {loaded ? <StagedConfigInfo config={data} contract={contract} hash={hash}/> : <div className="loader"/>}
        </StagedSorobanConfigChangesWrapper>
    } catch (e) {
        return <StagedSorobanConfigChangesWrapper id={id}>
            <div className="segment error"><i className="icon-warning"/> Invalid ConfigUpgradeSetKey: {id}</div>
        </StagedSorobanConfigChangesWrapper>
    }
}

function StagedSorobanConfigChangesWrapper({id, children}){
    return <div>
        <h2 className="condensed">
            Soroban Config Upgrade <span className="condensed text-small text-monospace word-break">{id}</span>
        </h2>
        <div className="segment blank">
            {children}
        </div>
    </div>
}

function StagedConfigInfo({config, contract, hash}) {
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
            <div className="row">
                <div className="column column-50">
                    <h3>
                        Config changes proposal for Soroban runtime
                        <CopyToClipboard text={sorobanConfig} title="Copy configuration changes to the clipboard" className="text-small"/>
                    </h3>
                </div>
                <div className="column column-50 text-right text-small">
                    Contract: <AccountAddress account={contract}/><br/>
                    Content hash: <span className="text-monospace">{hash}</span>
                </div>
            </div>
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

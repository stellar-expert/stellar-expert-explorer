import React from 'react'
import {useParams} from 'react-router'
import {StrKey, xdr} from '@stellar/stellar-base'
import {useExplorerApi, AccountAddress, usePageMetadata} from '@stellar-expert/ui-framework'
import config from '../../../app-settings'
import {applySorobanConfigChanges} from './soroban-config-changes-tracker'
import {SorobanConfigChangesView} from './soroban-config-changes-view'

export default function StagedSorobanConfigChangesView() {
    let {id = ''} = useParams()
    if (id.includes('%')) { //URI-encoded
        id = decodeURIComponent(id)
    }
    usePageMetadata({
        title: `Staged Soroban config changes ${id} for Stellar ${config.activeNetwork} network`,
        description: `Staged Soroban config changes ${id} for Stellar ${config.activeNetwork} network.`
    })
    try {
        const configKey = xdr.ConfigUpgradeSetKey.fromXDR(id, 'base64')
        const contract = StrKey.encodeContract(configKey.contractId())
        const contentHash = configKey.contentHash()
        const endpoint = `contract-data/${contract}/temporary/${encodeURIComponent(xdr.ScVal.scvBytes(contentHash).toXDR('base64'))}`
        const {data, loaded} = useExplorerApi(endpoint)

        return <StagedSorobanConfigChangesWrapper id={id}>
            {loaded ? <StagedConfigInfo config={data} contract={contract} hash={contentHash.toString('hex')}/> : <div className="loader"/>}
        </StagedSorobanConfigChangesWrapper>
    } catch (e) {
        return <StagedSorobanConfigChangesWrapper id={id}>
            <div className="segment error"><i className="icon-warning"/> Invalid ConfigUpgradeSetKey: {id}</div>
        </StagedSorobanConfigChangesWrapper>
    }
}

function StagedSorobanConfigChangesWrapper({id, children}) {
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
    const {data, loaded: historyLoaded} = useExplorerApi('ledger/protocol-history')
    if (!historyLoaded)
        return <div className="loader"/>
    try {
        const ledgerEntryValue = xdr.ScVal.fromXDR(config.value, 'base64')
        const rawUpgradeSet = xdr.ConfigUpgradeSet.fromXDR(ledgerEntryValue._value)
        const upgradeSet = {}
        for (let v of rawUpgradeSet._attributes.updatedEntry) {
            upgradeSet[v._arm] = serializeSettingsValue(v._value)
        }
        const fullHistory = applySorobanConfigChanges([{config_changes: upgradeSet}, ...data])
        return <div>
            <div className="dual-layout text-small">
                <div>
                    Container contract: <AccountAddress account={contract}/>
                </div>
                <div className="text-right">
                    Content hash: <span className="text-monospace">{hash}</span>
                </div>
            </div>
            <SorobanConfigChangesView configChanges={upgradeSet} changesAnnotation={fullHistory[0].changesAnnotation}
                                      title="Config changes proposal for Soroban runtime" maxHeight="80vh"/>
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

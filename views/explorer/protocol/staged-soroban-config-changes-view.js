import React from 'react'
import {useParams} from '@stellar-expert/ui-framework'
import {StrKey, xdr} from '@stellar/stellar-sdk'
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
        const configKey = xdr.ConfigUpgradeSetKey.fromXdr(id, 'base64')
        const contract = StrKey.encodeContract(configKey.contractId.toBytes())
        const contentHash = configKey.contentHash
        const endpoint = `contract-state/${contract}/temporary/${encodeURIComponent(xdr.ScVal.scvBytes(contentHash.toBytes()).toXdr('base64'))}`
        const {data, loaded} = useExplorerApi(endpoint)

        return <StagedSorobanConfigChangesWrapper id={id}>
            {loaded ? <StagedConfigInfo config={data} contract={contract} hash={contentHash.toString()}/> : <div className="loader"/>}
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
        const ledgerEntryValue = xdr.ScVal.fromXdr(config.value, 'base64')
        const rawUpgradeSet = xdr.ConfigUpgradeSet.fromXdr(ledgerEntryValue.bytes.toBytes())
        const upgradeSet = {}
        for (const entry of rawUpgradeSet.updatedEntry) {
            upgradeSet[getUnionArm(entry)] = serializeSettingsValue(entry.value)
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

/**
 * Resolve the name of the arm selected in an XDR union
 * @param {{}} union
 * @return {String|undefined} - undefined for void arms
 */
function getUnionArm(union) {
    return Object.keys(union).find(key => key !== 'type')
}

function parseSettingsAttributes(struct) {
    const res = {}
    for (const [key, value] of Object.entries(struct)) {
        if (key === 'ext' && value.type === 'v0') //skip empty extension points
            continue
        res[key] = serializeSettingsValue(value)
    }
    return res
}

function serializeSettingsValue(value) {
    if (value === null || value === undefined)
        return null
    if (value instanceof Array)
        return value.map(item => serializeSettingsValue(item))
    switch (typeof value) {
        case 'string':
        case 'boolean':
        case 'number':
            return value
        case 'bigint': //int64/uint64 settings do not fit into Number
            return value.toString()
    }
    if (value.value instanceof Uint8Array) //opaque XDR alias (Hash, ContractId, etc.) rendered as hex
        return value.toString()
    if (typeof value.type === 'string') { //nested union
        const arm = getUnionArm(value)
        return arm === undefined ? value.type : {[arm]: serializeSettingsValue(value[arm])}
    }
    if (typeof value === 'object')
        return parseSettingsAttributes(value)
    throw new TypeError('Unsupported settings value type: ' + value)
}

import React, {useMemo} from 'react'
import {Amount, UtcTimestamp, InfoTooltip as Info, useExplorerApi, usePageMetadata} from '@stellar-expert/ui-framework'
import config from '../../../app-settings'
import ErrorNotificationBlock from '../../components/error-notification-block'
import {StagedSorobanParamsUpdate} from './staged-soroban-config-changes-link-view'
import {applySorobanConfigChanges} from './soroban-config-changes-tracker'
import {SorobanConfigChangesView} from './soroban-config-changes-view'

export default function ProtocolHistoryView() {
    const {data, loaded} = useExplorerApi('ledger/protocol-history')
    usePageMetadata({
        title: `Protocol upgrades history of Stellar ${config.activeNetwork} network`,
        description: `All protocol upgrades of the Stellar ${config.activeNetwork} network.`
    })
    const processedData = useMemo(() => applySorobanConfigChanges(data), [data])
    if (!loaded)
        return <div className="loader"/>
    if (processedData.error) {
        return <ErrorNotificationBlock>
            Failed to fetch protocol upgrades history.
        </ErrorNotificationBlock>
    }
    return <div className="container narrow">
        <h2>Protocol Upgrades History<Info
            link="https://www.stellar.org/developers/stellar-core/software/security-protocol-release-notes.html#list-of-releases">
            Protocol defines the serialized forms of all objects stored in the ledger and its behavior.
            This version number is incremented every time the protocol changes over time.
        </Info></h2>
        <div className="segment blank">
            <StagedSorobanParamsUpdate/>
            {processedData.map(entry => <ProtocolHistoryEntry entry={entry} key={entry.sequence}/>)}
        </div>
    </div>
}

function ProtocolHistoryEntry({entry}) {
    return <div className="space">
        <h3>
            <div className="row">
                <div className="column column-66">
                    Ledger {entry.sequence}
                </div>
                <div className="column column-33 desktop-right text-small">
                    {entry.ts > 0 && <UtcTimestamp date={entry.ts} className="nowrap"/>}
                </div>
            </div>
        </h3>
        <div className="row">
            <div className="column column-50">
                <dl>
                    <dt>Protocol version:</dt>
                    <dd>{entry.version}</dd>
                    <dt>Maximum transaction set size:</dt>
                    <dd>{entry.max_tx_set_size}</dd>
                </dl>
            </div>
            <div className="column column-50">
                <dl>
                    <dt>Base fee amount:</dt>
                    <dd><Amount amount={entry.base_fee} asset="XLM" adjust issuer={false}/></dd>
                    <dt>Base reserve amount:</dt>
                    <dd><Amount amount={entry.base_reserve} asset="XLM" adjust issuer={false}/></dd>
                </dl>
            </div>
        </div>
        {!!entry.config_changes &&
            <SorobanConfigChangesView configChanges={entry.config_changes} changesAnnotation={entry.changesAnnotation}/>}
        <div className="space"/>
        <hr className="flare"/>
    </div>
}
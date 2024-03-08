import React from 'react'
import {Amount, UtcTimestamp, InfoTooltip as Info, CodeBlock, CopyToClipboard, useExplorerApi} from '@stellar-expert/ui-framework'
import config from '../../../app-settings'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import {StagedSorobanParamsUpdate} from './staged-soroban-config-changes-link-view'

export default function ProtocolHistoryView() {
    const {data, loaded} = useExplorerApi('ledger/protocol-history')
    setPageMetadata({
        title: `Protocol upgrades history of Stellar ${config.activeNetwork} network`,
        description: `All protocol upgrades of the Stellar ${config.activeNetwork} network.`
    })
    if (!loaded)
        return <div className="loader"/>
    return <div className="container narrow">
        <h2>Protocol Upgrades History<Info
            link="https://www.stellar.org/developers/stellar-core/software/security-protocol-release-notes.html#list-of-releases">
            Protocol defines the serialized forms of all objects stored in the ledger and its behavior.
            This version number is incremented every time the protocol changes over time.
        </Info></h2>
        <div className="segment blank">
            <StagedSorobanParamsUpdate/>
            {data.map(entry => <ProtocolHistoryEntry entry={entry} key={entry.sequence}/>)}
        </div>
    </div>
}

function ProtocolHistoryEntry({entry}) {
    const sorobanConfig = entry.config_changes && JSON.stringify(entry.config_changes, null, '  ')
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
        <dl>
            <dt>Protocol version:</dt>
            <dd>{entry.version}</dd>
            <dt>Maximum transaction set size:</dt>
            <dd>{entry.max_tx_set_size}</dd>
            <dt>Base fee amount:</dt>
            <dd><Amount amount={entry.base_fee} asset="XLM" adjust issuer={false}/></dd>
            <dt>Base reserve amount:</dt>
            <dd><Amount amount={entry.base_reserve} asset="XLM" adjust issuer={false}/></dd>
        </dl>
        {!!sorobanConfig && <div>
            <h4>
                Soroban runtime config changes
                <CopyToClipboard text={sorobanConfig} title="Copy configuration changes to the clipboard" className="text-small"/>
            </h4>
            <CodeBlock lang="json" style={{maxHeight: '30em'}}>{sorobanConfig}</CodeBlock>
        </div>}
        <div className="space"/>
        <hr className="flare"/>
    </div>
}
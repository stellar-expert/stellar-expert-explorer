import React from 'react'
import {Amount, UtcTimestamp, InfoTooltip as Info, useExplorerApi} from '@stellar-expert/ui-framework'
import config from '../../../app-settings'
import {setPageMetadata} from '../../../util/meta-tags-generator'

export default function ProtocolHistoryView() {
    const {data, loaded} = useExplorerApi('ledger/protocol-history')
    setPageMetadata({
        title: `Protocol versions of Stellar ${config.activeNetwork} network`,
        description: `History of the Stellar ${config.activeNetwork} network protocol upgrades.`
    })
    if (!loaded) return <div className="loader"/>
    return <div className="container narrow">
        <div className="card">
            <h3>Stellar Network Upgrades History<Info
                link="https://www.stellar.org/developers/stellar-core/software/security-protocol-release-notes.html#list-of-releases">
                Protocol defines the serialized forms of all objects stored in the ledger and its behavior.
                This version number is incremented every time the protocol changes over time.
            </Info></h3>
            <hr/>
            <table className="table exportable space" data-export-prefix="protocol-history">
                <thead>
                <tr>
                    <th className="text-right">Upgrade Sequence</th>
                    <th className="text-right">Protocol Version</th>
                    <th className="text-right collapsing nowrap">Max TxSet Size</th>
                    <th className="text-right nowrap">Base Fee</th>
                    <th className="text-right nowrap">Base Reserve</th>
                    <th>Upgrade Date</th>
                </tr>
                </thead>
                <tbody>
                {data.map(({version, sequence, ts, maxTxSetSize, baseFee, baseReserve}) => <tr key={sequence}>
                    <td className="text-right">{sequence}</td>
                    <td className="text-right">{version}</td>
                    <td className="text-right">{maxTxSetSize}</td>
                    <td className="text-right"><Amount amount={baseFee} asset="XLM" adjust/></td>
                    <td className="text-right"><Amount amount={baseReserve} asset="XLM" adjust/></td>
                    <td><UtcTimestamp date={ts} className="nowrap"/></td>
                </tr>)}
                </tbody>
            </table>
        </div>
    </div>
}
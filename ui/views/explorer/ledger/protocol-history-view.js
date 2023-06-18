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
    return <div>
        <h2>Stellar Network Upgrades History<Info
            link="https://www.stellar.org/developers/stellar-core/software/security-protocol-release-notes.html#list-of-releases">
            Protocol defines the serialized forms of all objects stored in the ledger and its behavior.
            This version number is incremented every time the protocol changes over time.
        </Info></h2>
        <div className="segment blank">
            <table className="table exportable" data-export-prefix="protocol-history">
                <thead>
                    <tr>
                        <th>Upgrade Sequence</th>
                        <th className="text-right">Protocol Version</th>
                        <th className="text-right nowrap">Max TxSet Size</th>
                        <th className="text-right nowrap">Base Fee</th>
                        <th className="text-right nowrap">Base Reserve</th>
                        <th className="text-right">Upgrade Date</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(({version, sequence, ts, maxTxSetSize, baseFee, baseReserve}) => <tr key={sequence}>
                        <td>{sequence}</td>
                        <td className="text-right">{version}</td>
                        <td className="text-right">{maxTxSetSize}</td>
                        <td className="text-right"><Amount amount={baseFee} asset="XLM" adjust issuer={false}/></td>
                        <td className="text-right"><Amount amount={baseReserve} asset="XLM" adjust issuer={false}/></td>
                        <td className="text-right"><UtcTimestamp date={ts} className="nowrap"/></td>
                    </tr>)}
                </tbody>
            </table>
        </div>
    </div>
}
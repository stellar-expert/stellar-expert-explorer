import React from 'react'
import {resolvePath} from '../../../business-logic/path'

export default function Last10LedgersView({lastLedgers}) {
    let lastLedgerClosedAt = 0

    if (!lastLedgers)
        return <div className="segment warning space">
            <div className="text-center"><i className="icon-warning-circle"/> Failed to fetch last 10 Ledgers</div>
        </div>
    if (!lastLedgers.length)
        return <div className="loader"/>

    return <div className="segment blank">
        <h3>Last 10 Ledgers Info</h3>
        <table className="table exportable space">
            <thead>
            <tr>
                <th>Ledger Number</th>
                <th>Transactions</th>
                <th>Operations</th>
                <th className="text-right nowrap">Closing Time</th>
            </tr>
            </thead>
            <tbody className="condensed">
            {lastLedgers.map(ledger => {
                let timeDelta = 6
                if (lastLedgerClosedAt) {
                    timeDelta = (lastLedgerClosedAt - ledger.ts)
                }
                lastLedgerClosedAt = ledger.ts
                return <tr key={ledger.sequence}>
                    <td data-header="Ledger Number: ">
                        #<a href={resolvePath(`ledger/${ledger.sequence}`)}>{ledger.sequence}</a>
                    </td>
                    <td data-header="Transactions: ">
                        {ledger.txSuccess} <span className="text-tiny dimmed">success</span>&nbsp;/&nbsp;
                        {ledger.txFailed} <span className="text-tiny dimmed">failed</span>
                    </td>
                    <td data-header="Operations: ">
                        {ledger.operations} <span className="text-tiny dimmed">success</span>&nbsp;/&nbsp;
                        {ledger.failedOperations} <span className="text-tiny dimmed">failed</span>
                    </td>
                    <td data-header="Closing Time: " className="text-right nowrap">
                        closed in {timeDelta}s
                    </td>
                </tr>
            })}
            </tbody>
        </table>
    </div>
}
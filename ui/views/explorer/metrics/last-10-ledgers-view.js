import React, {useCallback, useEffect, useState} from 'react'
import {apiCall} from '../../../models/api'
import {resolvePath} from '../../../business-logic/path'

export default function Last10LedgersView({lastLedger}) {
    const [ledgers, setLedgers] = useState([])
    const [isError, setIsError] = useState(false)
    let lastLedgerClosedAt = 0

    const getLast10Ledgers = useCallback(async () => {
        const ledgerList = [...ledgers]
        for (let i = 10; i >= 1; i--) {
            const sequence = lastLedger.sequence - i
            if (ledgerList.find(l => l.sequence === sequence))
                continue
            await apiCall('ledger/' + sequence)
                .then(res => ledgerList.unshift(res))
        }
        return ledgerList.splice(0, 10)
    }, [ledgers, lastLedger])

    useEffect(() => {
        setIsError(false)
        if (!lastLedger)
            return setIsError(true)
        getLast10Ledgers()
            .then(ledgers => setLedgers(ledgers))
            .catch(err => setIsError(err))
    }, [lastLedger])

    if (isError)
        return <div className="segment warning space">
            <div className="text-center"><i className="icon-warning-circle"/> Failed to fetch last 10 Ledgers</div>
        </div>
    if (!ledgers.length)
        return <div className="loader"/>

    return <div className="segment blank">
        <h3>Last 10 Ledgers Info</h3>
        <table className="table exportable space">
            <thead>
            <tr>
                <th>Ledger Number</th>
                <th>Transactions</th>
                <th className="text-right">Operations</th>
                <th className="text-right nowrap">Closing Time</th>
            </tr>
            </thead>
            <tbody className="condensed">
            {ledgers.map(ledger => {
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
                    <td data-header="Operations: " className="text-right">
                        {ledger.operations}
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
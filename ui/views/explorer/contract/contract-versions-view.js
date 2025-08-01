import React from 'react'
import {useParams} from 'react-router'
import {StrKey} from '@stellar/stellar-base'
import {AccountAddress, UtcTimestamp, useExplorerPaginatedApi, usePageMetadata} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../../business-logic/path'
import ErrorNotificationBlock from '../../components/error-notification-block'
import GridDataActionsView from '../../components/grid-data-actions'

export default function ContractVersionsView() {
    const {id: address} = useParams()
    const contractVersions = useExplorerPaginatedApi(
        {
            path: `contract/${address}/versions`
        }, {
            autoReverseRecordsOrder: true,
            defaultSortOrder: 'desc',
            limit: 20,
            defaultQueryParams: {order: 'desc'}
        })
    if (!StrKey.isValidContract(address))
        return <>
            <h2 className="word-break condensed"><span className="dimmed">Contract</span> {address}</h2>
            <ErrorNotificationBlock>
                Invalid smart contract address. Make sure that you copied it correctly.
            </ErrorNotificationBlock>
        </>

    usePageMetadata({
        title: `Contract code version history for ${address}`,
        description: `Detailed source code versions history for contract ${address}.`
    })
    if (contractVersions.data?.error) {
        return <ErrorNotificationBlock>
            Failed to fetch contract code version history.
        </ErrorNotificationBlock>
    }
    return <div>
        <h2 className="word-break relative condensed">
            <span className="dimmed">Contract version history </span>
            <AccountAddress account={address} className="plain" chars="all"/>
        </h2>
        <div className="segment blank">
            <table className="table exportable space">
                <thead>
                <tr>
                    <th>Contract WASM hash</th>
                    <th className="collapsing nowrap">Updated</th>
                </tr>
                </thead>
                <tbody className="condensed">
                {contractVersions.data.map(entry => <tr key={entry.paging_token}>
                    <td data-header="WASM hash: ">
                        {entry.wasm}
                    </td>
                    <td className="text-right" data-header="Updated: ">
                        <a href={resolvePath('op/' + entry.operation)}><UtcTimestamp date={entry.ts}/></a>
                    </td>
                </tr>)}
                </tbody>
            </table>
            {!contractVersions.loaded && <div className="loader"/>}
            <GridDataActionsView model={contractVersions}/>
        </div>
    </div>
}
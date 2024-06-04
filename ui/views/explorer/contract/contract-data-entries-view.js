import React, {useEffect, useState} from 'react'
import {useParams} from 'react-router'
import {UtcTimestamp, AccountAddress, ScVal, useExplorerPaginatedApi, setPageMetadata} from '@stellar-expert/ui-framework'
import {previewUrlCreator} from '../../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../../util/prepareMetadata'
import checkPageReadiness from '../../../util/page-readiness'
import GridDataActionsView from '../../components/grid-data-actions'

export default function ContractDataEntriesView() {
    const {id} = useParams()
    const contractDataEntries = useExplorerPaginatedApi(
        {
            path: `contract-data/${id}`,
            query: {}
        }, {
            autoReverseRecordsOrder: true,
            defaultSortOrder: 'asc',
            limit: 30,
            defaultQueryParams: {order: 'asc'}
            //dynamic price spread
            //dataProcessingCallback: records => records.map(stat => AssetViewModel.fromStats(stat))
        })
    const type = id.startsWith('C') ? 'Contract' : 'Account'
    const [metadata, setMetadata] = useState({
        title: `Stored Data for ${id}`,
        description: `Stored Data for ${type} ${id} into Stellar Network`
    })
    setPageMetadata(metadata)
    checkPageReadiness(metadata)

    useEffect(() => {
        previewUrlCreator(prepareMetadata({
            title: 'Stored Data',
            description: `${type} ${id}`
        }))
            .then(previewUrl => setMetadata(prev => ({...prev, facebookImage: previewUrl})))
    }, [])

    return <div>
        <h2 className="word-break relative condensed">
            <span className="dimmed">Stored Data for&nbsp;</span>
            <AccountAddress account={id} className="plain" chars="all"/>
        </h2>
        <div className="segment blank">
            <div className="contract-data-view">
                <table className="table exportable space">
                    <thead>
                    <tr>
                        <th>Key</th>
                        <th>Value</th>
                        <th className="collapsing nowrap">Updated</th>
                    </tr>
                    </thead>
                    <tbody className="condensed">
                    {contractDataEntries.data.map(entry => {
                        return <tr key={entry.paging_token}>
                            <td data-header="Key: ">
                                <ScVal value={entry.key} indent/>
                            </td>
                            <td data-header="Value: ">
                                <ScVal value={entry.value} indent/>
                            </td>
                            <td className="text-right" data-header="Updated: ">
                                <UtcTimestamp date={entry.updated}/>
                            </td>
                        </tr>
                    })}
                    </tbody>
                </table>
                <GridDataActionsView model={contractDataEntries}/>
            </div>
        </div>
    </div>
}

import React, {useState} from 'react'
import {UtcTimestamp, useDependantState, loadOperation} from '@stellar-expert/ui-framework'
import SearchResultsSectionView from './search-results-section-view'
import OperationDetailsHeader from '../operation/operation-details-header-view'
import OpTextDescriptionView from '../operation/operation-text-description-view'
import {convertHorizonOperation} from '../operation/operation-horizon-converter'
import {resolvePath} from '../../../business-logic/path'

export default function OperationSearchResultsView({term, onLoaded}) {
    const [inProgress, setInProgress] = useState(true),
        [operation, setOperation] = useDependantState(() => {
            setInProgress(true)
            loadOperation(term)
                .then(op => setOperation(op))
                .finally(() => setInProgress(false))
        }, [term])
    if (inProgress) return null
    if (!operation) {
        onLoaded(null)
        return null
    }
    const res = {
        link: resolvePath(`op/${operation.id}`),
        title: <OperationDetailsHeader operation={operation}/>,
        description: <>
            <UtcTimestamp date={operation.created_at} dateOnly/>{' | '}
            <OpTextDescriptionView {...convertHorizonOperation(operation)}/>
        </>,
        links: <>
            <a href={resolvePath(`account/${operation.source_account}`)}>Source account</a>&emsp;
            <a href={resolvePath(`tx/${operation.transaction_hash}`)}>Transaction</a>
        </>
    }
    onLoaded(res)
    return <SearchResultsSectionView key="operation" section="Operations" items={[res]}/>
}
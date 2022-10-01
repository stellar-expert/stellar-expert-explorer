import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {Spoiler, InfoTooltip as Info, loadTransactionOperations} from '@stellar-expert/ui-framework'
import OpDetails from '../operation/operation-details-view'

export default function TxOperationsView({tx, embedded}) {
    const [operations, setOperations] = useState(null)
    const [showOperations, setShowOperations] = useState(!embedded)

    useEffect(() => {
        if (!showOperations || operations) return
        loadTransactionOperations(tx.id, {limit: 100})
            .then(operations => setOperations(operations))
    }, [tx.id, embedded, showOperations])

    return <>
        {!embedded && <h3>Contains {tx.operation_count} operation{tx.operation_count > 1 ? 's' : ''}
            <Info link="https://developers.stellar.org/docs/glossary/operations/">
                Operations included into the transaction. Operations are executed in order as one ACID transaction,
                meaning that either all operations are applied or none are. If any operation fails, the whole
                transaction fails.
            </Info></h3>}
        <hr/>
        {!!embedded && <Spoiler showMore="Show operations" showLess="Hide operations" expanded={showOperations}
                                onChange={e => setShowOperations(!showOperations)}/>}
        {showOperations && !operations && <div className="loader"/>}
        {showOperations && !!operations && <div className="block-indent" style={{marginTop: '0.5em'}}>
            {operations.map(op => <OpDetails embedded key={op.id} operation={op} allowEffects/>)}
        </div>}
    </>
}

TxOperationsView.propTypes = {
    tx: PropTypes.shape({id: PropTypes.string}).isRequired,
    embedded: PropTypes.bool
}
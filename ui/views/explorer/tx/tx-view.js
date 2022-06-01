import React from 'react'
import PropTypes from 'prop-types'
import {BlockSelect, useDependantState, loadTransaction} from '@stellar-expert/ui-framework'
import TransactionDetails from './tx-details-view'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import appSetting from '../../../app-settings'
import ErrorNotificationBlock from '../../components/error-notification-block'

export default function TxView({id, match}) {
    const [data, setTxData] = useDependantState(() => {
        if (!id) id = match.params.id
        const promise = loadTransaction(id)
        if (!promise) return {error: 'invalid', id}
        promise
            .catch(err => {
                if (err && (err.name === 'NotFoundError' || err.status === 404)) return {error: 'not found', id}
                //TODO: handle errors here
                return Promise.reject(err)
            })
            .then(data => setTxData(data))
        return null
    }, [id, match && match.params ? match.params.id : null])
    if (!data) return <div className="loader"/>
    const txHash = data.id
    setPageMetadata({
        title: `Transaction ${txHash} on Stellar ${appSetting.activeNetwork} network`,
        description: `Extensive blockchain information for the transaction ${txHash} on Stellar ${appSetting.activeNetwork} network.`
    })
    if (data.error) return <>
        <h2 className="word-break relative">Transaction&nbsp;<BlockSelect>{txHash}</BlockSelect></h2>
        <ErrorNotificationBlock>
            {data.error === 'invalid' ?
                'Invalid transaction hash. Make sure that you copied it correctly.' :
                'Transaction not found on Stellar Network.'
            }
        </ErrorNotificationBlock>
    </>

    return <TransactionDetails tx={data}/>
}

TxView.propTypes = {
    match: PropTypes.object,
    id: PropTypes.string
}
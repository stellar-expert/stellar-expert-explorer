import React, {useEffect, useState} from 'react'
import {useParams} from 'react-router'
import PropTypes from 'prop-types'
import {BlockSelect, loadTransaction, setPageMetadata} from '@stellar-expert/ui-framework'
import ErrorNotificationBlock from '../../components/error-notification-block'
import appSetting from '../../../app-settings'
import TransactionDetails from './tx-details-view'

export default function TxView({id}) {
    const {id: queryId} = useParams()
    const txId = id || queryId
    const [txData, setTxData] = useState()
    useEffect(() => {
        loadTransaction(txId)
            .catch(err => {
                if (err && (err.name === 'NotFoundError' || err.status === 404))
                    return {error: 'not found', txId}
                //TODO: handle errors here
                return Promise.reject(err)
            })
            .then(setTxData)
    }, [txId])
    if (!txData)
        return <div className="loader"/>
    const txHash = txData.id
    setPageMetadata({
        title: `Transaction ${txHash} on Stellar ${appSetting.activeNetwork} network`,
        description: `Extensive blockchain information for the transaction ${txHash} on Stellar ${appSetting.activeNetwork} network.`
    })
    if (txData.error) return <>
        <h2 className="word-break relative">Transaction&nbsp;<BlockSelect>{txHash}</BlockSelect></h2>
        <ErrorNotificationBlock>
            {txData.error === 'invalid' ?
                'Invalid transaction hash. Make sure that you copied it correctly.' :
                'Transaction not found on Stellar Network.'
            }
        </ErrorNotificationBlock>
    </>

    return <TransactionDetails tx={txData}/>
}

TxView.propTypes = {
    id: PropTypes.string
}
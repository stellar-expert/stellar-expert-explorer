import React, {useEffect, useState} from 'react'
import {useParams} from 'react-router'
import PropTypes from 'prop-types'
import {BlockSelect, loadTransaction, usePageMetadata} from '@stellar-expert/ui-framework'
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
    usePageMetadata({
        title: `Transaction ${txId} on Stellar ${appSetting.activeNetwork} network`,
        description: `Comprehensive blockchain information for the transaction ${txId} ${txData?.ts ? `(${new Date(txData.ts * 1000).toISOString()}) ` : ''}on Stellar ${appSetting.activeNetwork} network.`
    })
    if (!txData)
        return <div className="loader"/>
    const txHash = txData.id
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
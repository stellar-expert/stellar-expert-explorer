import React, {useEffect, useRef, useState} from 'react'
import {throttle} from 'throttle-debounce'
import {ElapsedTime, TxLink, TxOperationsList} from '@stellar-expert/ui-framework'
import {parseTxDetails, useStellarNetwork, loadLedgerTransactions, usePageMetadata, ledgerStream} from '@stellar-expert/ui-framework'
import appSettings from '../../../app-settings'
import ErrorNotificationBlock from '../../components/error-notification-block'
import './activity-stream.scss'

export default function ActivityStreamView() {
    const network = useStellarNetwork()
    const [activity, setActivity] = useState()
    const [loading, setLoading] = useState(false)
    const [includeFailed, setIncludeFailed] = useState(false)
    const [_, refresh] = useState(0)
    const activityContainer = useRef()

    useEffect(() => {
        if (!activityContainer.current)
            return
        const activity = new RecentActivity(network, includeFailed)
        setTimeout(() => {
            activity.startStreaming()
        }, 100)
        setActivity(activity)
        activity.onLoadingStateChanged = setLoading
        activity.onRefresh = () => setTimeout(() => refresh(v => v + 1), 50)
        const container = activityContainer.current
        const scrollHandler = throttle(200, function () {
            //const container = txHistoryRef.current
            const scrolledToBottom = Math.ceil(container.scrollHeight - container.scrollTop - 70) < container.clientHeight
            if (scrolledToBottom) {
                activity.loadNextPage()
            }
            const streamingAllowed = container.scrollTop === 0
            if (activity.streamingMode !== streamingAllowed) {
                if (streamingAllowed) {
                    activity.startStreaming()
                } else {
                    activity.stopStreaming()
                }
            }
        }, {noLeading: true})
        activityContainer.current.addEventListener('scroll', scrollHandler)
        return () => {
            activity.stopStreaming()
            activityContainer.current?.removeEventListener('scroll', scrollHandler)
        }
    }, [network, includeFailed])

    usePageMetadata({
        title: `Recent activity on Stellar ${appSettings.activeNetwork} network`,
        description: `Live transactions feed for Stellar ${appSettings.activeNetwork} network.`
    })

    if (activity?.isFetchError) {
        return <ErrorNotificationBlock>
            Failed to fetch Activity Live Stream.
        </ErrorNotificationBlock>
    }

    return <div className="container narrow">
        <h2>Activity Live Stream</h2>
        <div className="segment blank activity-stream">
            <hr className="flare"/>
            <ul ref={activityContainer}>
                {activity?.records.map(tx => <li key={tx.txHash}>
                    <div className="text-tiny text-right">
                        {!tx.successful && <span className="dimmed">
                        <i className="icon-warning-hexagon color-warning"/> transaction failed
                    </span>}
                        {' '}
                        <TxLink tx={tx.txHash}>
                            <ElapsedTime ts={new Date(tx.createdAt)} suffix=" ago"/>
                        </TxLink>
                    </div>
                    <TxOperationsList parsedTx={tx}/>
                    <hr className="flare"/>
                </li>)}
                {loading && <li key="loader" className="dimmed text-center loader">
                </li>}
            </ul>
        </div>
    </div>
}

class RecentActivity {
    constructor(network, includeFailed) {
        this.network = network
        this.includeFailed = includeFailed
        this.records = []
    }

    /**
     * Stellar network identifier
     * @type {'public'|'testnet'}
     * @readonly
     */
    network = 'public'
    /**
     * Recent transactions history
     * @type {Array<ParsedTxDetails>}
     * @readonly
     */
    records = []
    /**
     * Loaded records paging token
     * @type {String}
     * @private
     */
    cursor
    /**
     * Recent entries to load
     * @type {Number}
     * @private
     */
    maxRecentEntries = 20
    /**
     * In the process of loading
     * @type {Boolean}
     * @readonly
     */
    loading = false
    /**
     * Has more records to load
     * @type {Boolean}
     * @readonly
     */
    hasMore = undefined
    /**
     * Finalize stream handler
     * @private
     */
    finalizeStream = null

    onLoadingStateChanged = null

    onRefresh = null

    isFetchError = null

    get streamingMode() {
        return !!this.finalizeStream
    }


    /**
     * Load transactions history
     * @return {Promise}
     */
    async loadNextPage() {
        if (this.loading || this.hasMore === false)
            return
        let recordsToLoad = this.maxRecentEntries
        try {
            this.updateLoadingState(true)
            while (recordsToLoad > 0) {
                //fetch account transactions
                const count = Math.min(recordsToLoad * 3, 100)
                const newBatch = await loadLedgerTransactions(this.cursor)
                    .then(data => data.map(tx => processTransactionRecord(this.network, tx)))
                //if no records returned
                if (!newBatch.length) {
                    this.hasMore = false
                    break
                }

                let hasMore = newBatch.length === count
                //process records
                const loadedRecords = []
                for (let tx of newBatch) {
                    this.cursor = tx.ledger
                    loadedRecords.push(tx)
                    if (loadedRecords.length >= recordsToLoad) {
                        hasMore = true
                        break //stop if enough records loaded
                    }
                }

                //jump to next iteration if no relevant history records were found
                if (!loadedRecords.length && hasMore)
                    continue
                //update records
                if (loadedRecords.length) {
                    this.records = [...this.records, ...loadedRecords]
                    this.onRefresh()
                }
                if (!hasMore)
                    this.hasMore = false
                //remaining records number
                recordsToLoad -= loadedRecords.length
            }
        } catch (e) {
            if (e.name !== 'NotFoundError') {
                this.isFetchError = true
                console.error(e)
            } else {
                this.hasMore = false
            }
        }
        this.updateLoadingState(false)
    }

    async loadLedger(sequence) { //this.includeFailed
        const transactions = await loadLedgerTransactions(sequence)
        if (!(transactions instanceof Array))
            return null
        for (let transaction of transactions) {
            this.addNewTx(processTransactionRecord(this.network, transaction))
        }
        this.onRefresh()
    }

    /**
     * Stream transactions history from Horizon
     */
    async startStreaming() {
        if (this.finalizeStream)
            return
        this.records = []
        this.cursor = await ledgerStream.getLastSequence()
        await this.loadNextPage()
        const onNewLedger = sequence => this.loadLedger(sequence)
        ledgerStream.on(onNewLedger)
        this.finalizeStream = () => ledgerStream.off(onNewLedger)
    }

    /**
     * Stop history streaming
     */
    stopStreaming() {
        if (this.finalizeStream) {
            this.finalizeStream()
            this.finalizeStream = null
        }
    }

    /**
     * @param {Boolean} loading
     * @private
     */
    updateLoadingState(loading) {
        this.loading = loading
        if (this.onLoadingStateChanged) {
            setTimeout(() => this.onLoadingStateChanged(loading), 100)
        }
    }

    /**
     * @param {TransactionRecord} tx
     * @param {Boolean} inProgress
     * @returns {ParsedTxDetails}
     * @private
     */
    addNewTx(parsedTxDetails, inProgress = false) {
        this.records.unshift(parsedTxDetails)
        if (!inProgress) {
            while (this.records.length > this.maxRecentEntries) {
                this.records.pop()
            }
        }
        this.hasMore = undefined
        return parsedTxDetails
    }
}

/**
 * @param {String} network
 * @param {TransactionRecord} txRecord
 * @param {Boolean} inProgress
 * @returns {ParsedTxDetails}
 * @internal
 */
function processTransactionRecord(network, txRecord) {
    const details = parseTxDetails({
        network: appSettings.networkPassphrase,
        txEnvelope: txRecord.body,
        result: txRecord.result,
        meta: txRecord.meta,
        createdAt: new Date(txRecord.ts * 1000).toISOString(),
        ledger: txRecord.ledger,
        context: {}
    })
    return details
}
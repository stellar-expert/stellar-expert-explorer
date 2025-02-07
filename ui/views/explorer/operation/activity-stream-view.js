import React, {useCallback, useEffect, useRef, useState} from 'react'
import {throttle} from 'throttle-debounce'
import {
    ElapsedTime,
    TxLink,
    TxOperationsList,
    parseTxDetails,
    useStellarNetwork,
    loadTransactions,
    streamTransactions
} from '@stellar-expert/ui-framework'
import './activity-stream.scss'
import appSettings from '../../../app-settings'

export default function ActivityStreamView() {
    const network = useStellarNetwork()
    const [activity, setActivity] = useState()
    const [loading, setLoading] = useState(false)
    const [includeFailed, setIncludeFailed] = useState(false)
    const [_, refresh] = useState(0)
    const activityContainer = useRef()

    const toggleIncludeFailed = useCallback(() => setIncludeFailed(prev => !prev), [])

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

    return <div className="container narrow">
        <h2>Activity Live Stream</h2>
        <div className="segment blank activity-stream">
            <div className="column column-67">
            </div>
            <div className="desktop-right dimmed">
                <label className="text-small">
                    <input type="checkbox" onChange={toggleIncludeFailed} checked={includeFailed}/> Show failed transactions
                </label>
            </div>
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
     * Recent tansactions history
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
                const newBatch = await loadTransactions({
                    cursor: this.cursor,
                    limit: count,
                    order: 'desc',
                    includeFailed: this.includeFailed
                })
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
                    this.cursor = tx.paging_token
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
                    this.removeInProgressTx(loadedRecords)
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
                console.error(e)
            } else {
                this.hasMore = false
            }
        }
        this.updateLoadingState(false)
    }

    /**
     * Stream transactions history from Horizon
     */
    async startStreaming() {
        if (this.finalizeStream)
            return
        this.cursor = undefined
        this.records = []
        await this.loadNextPage()

        this.finalizeStream = streamTransactions('now', tx => {
            const processed = processTransactionRecord(this.network, tx)
            this.addNewTx(processed)
            this.onRefresh()
        }, this.includeFailed)
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
    addNewTx(tx, inProgress = false) {
        const parsedTxDetails = tx.txHash ? tx : processTransactionRecord(this.network, tx, inProgress)
        this.removeInProgressTx([tx])
        this.records.unshift(parsedTxDetails)
        if (!inProgress) {
            while (this.records.length > this.maxRecentEntries) {
                this.records.pop()
            }
        }
        this.hasMore = undefined
        return parsedTxDetails
    }

    /**
     * Remove pending in-progress transactions that match executed/failed transaction received from Horizon
     * @param {ParsedTxDetails[]} newTransactions
     */
    removeInProgressTx(newTransactions) {
        for (let tx of newTransactions) {
            const idx = this.records.findIndex(existing => existing.txHash === tx.txHash)
            if (idx >= 0) {
                this.records.splice(idx, 1)
            }
        }
    }
}

/**
 * @param {String} network
 * @param {TransactionRecord} txRecord
 * @param {Boolean} inProgress
 * @returns {ParsedTxDetails}
 * @internal
 */
function processTransactionRecord(network, txRecord, inProgress = false) {
    const details = parseTxDetails({
        network: appSettings.networkPassphrase,
        txEnvelope: txRecord.envelope_xdr,
        result: txRecord.result_xdr,
        meta: txRecord.result_meta_xdr,
        createdAt: inProgress ? new Date().toISOString() : txRecord.created_at,
        context: {}
    })
    if (txRecord.paging_token) {
        details.paging_token = txRecord.paging_token
    }
    return details
}
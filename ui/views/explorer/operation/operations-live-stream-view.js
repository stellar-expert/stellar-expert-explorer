import React from 'react'
import {throttle} from 'throttle-debounce'
import {ElapsedTime, loadOperations} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'
import {convertHorizonOperation} from './operation-horizon-converter'
import {resolvePath} from '../../../business-logic/path'
import OpTextDescriptionView from './operation-text-description-view'

const maximum = 50
//TODO: refactor!
export default class OperationsLiveStreamView extends React.Component {
    constructor(props) {
        super(props)
        this.container = React.createRef()
    }

    state = {
        loading: true,
        enableStreaming: true,
        includeFailed: true,
        operations: []
    }

    loadingNextPage = false

    streamingInterval = null

    componentDidMount() {
        this.startStreaming()
    }

    toggleFailed() {
        this.setState({includeFailed: !this.state.includeFailed}, () => this.loadFreshBatch())
    }

    loadFreshBatch() {
        loadOperations({
            limit: maximum,
            includeFailed: this.state.includeFailed,
            order: 'desc'
        })
            .then(data => {
                const {operations} = this.state
                data = data.filter(newOp => !operations.some(existingOp => existingOp.id === newOp.id))
                const newData = [...data, ...operations.slice(0, Math.max(maximum - data.length, 0))]

                this.setState({
                    operations: newData,
                    loading: false
                })
            })
    }

    startStreaming() {
        if (this.streamingInterval) return
        this.loadFreshBatch()
        this.streamingInterval = setInterval(() => this.loadFreshBatch(), 4000)
    }

    stopStreaming() {
        clearInterval(this.streamingInterval)
        this.streamingInterval = null
    }

    loadNextPage() {
        const {operations} = this.state,
            oldest = operations[operations.length - 1]
        if (this.loadingNextPage) return
        this.loadingNextPage = true
        loadOperations({
            limit: maximum,
            includeFailed: this.state.includeFailed,
            order: 'desc',
            cursor: oldest.paging_token
        })
            .then(data => {
                if (this.unmounted) return
                this.setState({
                    operations: [...this.state.operations, ...data]
                })
                this.loadingNextPage = false
            })
        //TODO: show loader progress while the next page is loading
    }

    componentWillUnmount() {
        this.unmounted = true
        this.stopStreaming()
    }

    groupByTx(operations) {
        const groupped = []
        let tx
        for (let op of operations) {
            if (!tx || op.transaction_hash !== tx.hash) {
                tx = {
                    hash: op.transaction_hash,
                    ts: op.created_at,
                    operations: [],
                    successful: op.transaction_successful
                }
                groupped.push(tx)
            }
            tx.operations.unshift(op)
        }
        return groupped
    }

    handleInteraction() {
        const {enableStreaming} = this.state,
            container = this.container.current,
            streamAllowed = container.scrollTop === 0,
            scrolledToBottom = Math.ceil(container.scrollHeight - container.scrollTop - 8) < container.clientHeight
        if (enableStreaming !== streamAllowed) {
            this.setState({enableStreaming: streamAllowed})
            if (streamAllowed) {
                this.startStreaming()
            } else {
                this.stopStreaming()
            }
        }
        if (scrolledToBottom) {
            this.loadNextPage()
        }
    }

    renderList() {
        const {loading, operations} = this.state
        if (loading) return <div className="loader"/>

        return <ul style={{maxHeight: 'calc(100vh - 20em)', overflowY: 'auto', overflowX: 'hidden'}}
                   ref={this.container}
                   onScroll={throttle(200, () => this.handleInteraction())}>
            {this.groupByTx(operations).map(tx => this.renderTx(tx))}
        </ul>
    }

    renderTx(tx) {
        return <li className="tx" key={tx.hash}>
            <div>
                <span className="dimmed">Transaction</span>&nbsp;
                <a href={resolvePath(`tx/${tx.hash}`)}>
                    <span title={tx.hash}>{shortenString(tx.hash, 16)}</span>
                </a>
                {!tx.successful &&
                    <span className="dimmed"> <i className="icon icon-warning color-warning"/> failed</span>}
                {' '}<ElapsedTime className="dimmed text-small" ts={tx.ts} suffix=" ago"/>

            </div>
            <ul className="block-indent">
                {tx.operations.map(op => <li key={op.id} className="appear">
                    <OpTextDescriptionView {...convertHorizonOperation(op)}/>{' '}
                    <a href={resolvePath(`op/${op.id}`)} className="icon icon-export"/>
                </li>)}
            </ul>
        </li>
    }

    render() {
        return <div className="container narrow">
            <div className="card">
                <div className="column column-67">
                    <h3>Operations Live Stream</h3>
                    <hr/>
                </div>
                <div className="desktop-right dimmed">
                    <label>
                        <input type="checkbox" checked={this.state.includeFailed}
                               onChange={e => this.toggleFailed()}/> Show failed transactions
                    </label>
                </div>
                {this.renderList()}
            </div>
        </div>
    }
}
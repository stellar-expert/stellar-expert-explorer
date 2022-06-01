import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {throttle} from 'throttle-debounce'
import {AccountAddress} from '@stellar-expert/ui-framework'
import {GraphState, useGraphState} from './state/graph-state'
import {useCompositeAccountInfo} from '../../business-logic/api/account-api'
import AccountBasicPropertiesView from '../explorer/account/account-basic-properties-view'
import AccountDirectoryInfoView from '../explorer/account/account-directory-info-view'

function decodeLinkDescription({type, transfers}) {
    return type.map(t => {
        switch (t) {
            case 0:
                return `creator`
            case 1:
                return `merge destination`
            case 2:
                return `${transfers} payment${transfers === 1 ? 's' : ''}`
        }
    }).filter(v => !!v).join(', ')
}

export default function AccountRelationsListView() {
    const graph = useGraphState(),
        {selectedNode} = graph,
        [fetchingMore, setFetchingMore] = useState(false),
        accountInfo = useCompositeAccountInfo(selectedNode?.id)

    if (selectedNode.cursor === undefined)
        return <div className="loader"/>

    const handleInteraction = throttle(200, (e) => {
        const list = e.target,
            scrolledToBottom = Math.ceil(list.scrollHeight - list.scrollTop - 40) < list.clientHeight
        if (scrolledToBottom && selectedNode.canFetchMoreLinks) {
            setFetchingMore(true)
            graph.populateNodeLinks(selectedNode)
                .finally(() => setFetchingMore(false))
        }
    })

    function select(e, node) {
        const {checked} = e.target
        graph.setDisplayNodeState(node, checked)
        /*if (checked && node.visible) {
            graph.selectedNode(node)
        }*/
    }

    return <>
        <h4>
            <i className="icon icon-search dimmed"/>
            Account <AccountAddress account={selectedNode.id} chars={8} target="_blank"/>
            {accountInfo.deleted && <>&nbsp;(deleted)</>}
        </h4>
        <div className="text-small">
            <AccountDirectoryInfoView address={selectedNode.id}/>
            <div className="micro-space"/>
            {accountInfo.loaded ? <dl><AccountBasicPropertiesView account={accountInfo.data}/></dl> :
                <div className="loader"/>}
            <h4 className="dimmed micro-space">Relations</h4>
            <div>
                <ul onScroll={handleInteraction}>
                    {Array.from(selectedNode.links.values()).map(link => {
                        const otherNode = selectedNode === link.source ? link.target : link.source
                        return <li key={link.id}>
                            <label>
                                <input type="checkbox" checked={otherNode.visible}
                                       onChange={e => select(e, otherNode)}/>{' '}
                                <AccountAddress account={otherNode.id} chars={8} target="_blank"/>
                                <span className="dimmed"> {decodeLinkDescription(link)}</span>
                            </label>
                        </li>
                    })}
                    {fetchingMore && <div className="loader micro"/>}
                </ul>
            </div>
        </div>
    </>
}

AccountRelationsListView.propTypes = {
    graph: PropTypes.instanceOf(GraphState)
}
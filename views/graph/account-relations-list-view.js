import React, {useCallback, useMemo, useState} from 'react'
import {throttle} from 'throttle-debounce'
import {AccountAddress} from '@stellar-expert/ui-framework'
import {useCompositeAccountInfo} from '../../business-logic/api/account-api'
import AccountBasicPropertiesView from '../explorer/account/account-basic-properties-view'
import AccountDirectoryInfoView from '../explorer/account/account-directory-info-view'
import {useGraphState} from './state/graph-state'

function decodeLinkDescription({type, transfers, trades}) {
    const res = []
    if ((type & 1) > 0 || (type & 1 << 16) > 0) {
        res.push({icon: 'icon-hexagon-add', type: 'creator'})
    }
    if ((type & 1 < 1) > 0 || (type & 1 << 17) > 0) {
        res.push({icon: 'icon-hexagon-add', type: 'merger'})
    }
    if (transfers[0] > 0) {
        res.push({icon: 'icon-send-circle', type: `${transfers[0]} transfer${transfers[0] > 1 ? 's' : ''}`})
    }
    if (transfers[1] > 0) {
        res.push({icon: 'icon-receive-circle', type: `${transfers[1]} transfer${transfers[1] > 1 ? 's' : ''}`})
    }
    if (trades > 0) {
        res.push({icon: 'icon-refresh-circle', type: `${trades} trade${trades > 1 ? 's' : ''}`})
    }
    return res
}

export default function AccountRelationsListView() {
    const graph = useGraphState()
    const {selectedNode} = graph
    const [fetchingMore, setFetchingMore] = useState(false)
    const accountInfo = useCompositeAccountInfo(selectedNode?.id)

    const handleInteraction = useMemo(() => throttle(200, (e) => {
        const list = e.target
        const scrolledToBottom = Math.ceil(list.scrollHeight - list.scrollTop - 40) < list.clientHeight
        if (scrolledToBottom && graph.selectedNode.canFetchMoreLinks) {
            setFetchingMore(true)
            graph.populateNodeLinks(graph.selectedNode)
                .finally(() => setFetchingMore(false))
        }
    }), [graph])

    const select = useCallback(function (e, node) {
        const {checked} = e.target
        graph.setDisplayNodeState(node, checked)
        /*if (checked && node.visible) {
            graph.selectedNode(node)
        }*/
    }, [graph])

    if (selectedNode.cursor === undefined)
        return <div className="loader"/>


    return <>
        <div className="segment blank" style={{height: 'auto'}}>
            <h3>
                <i className="icon icon-search dimmed"/>
                Account <AccountAddress account={selectedNode.id} chars={8} target="_blank"/>
                {accountInfo.deleted && <>&nbsp;(deleted)</>}
            </h3>
            <hr className="flare"/>
            <div>
                <AccountDirectoryInfoView address={selectedNode.id}/>
                <div className="space"/>
                {accountInfo.loaded ?
                    <dl><AccountBasicPropertiesView account={accountInfo.data}/></dl> :
                    <div className="loader"/>}
            </div>
        </div>
        <div className="segment blank space" style={{height: 'auto'}}>
            <h3 className="dimmed micro-space">Relations</h3>
            <hr className="flare"/>
            <ul onScroll={handleInteraction}>
                {Array.from(selectedNode.links.values())
                    .map(link => {
                        const otherNode = selectedNode === link.source ? link.target : link.source
                        return <li key={link.id}>
                            <label>
                                <input type="checkbox" checked={otherNode.visible}
                                       onChange={e => select(e, otherNode)}/>{' '}
                                <AccountAddress account={otherNode.id} chars={8} target="_blank"/>
                                <div className="dimmed text-tiny block-indent">
                                    {decodeLinkDescription(link).map(info =>
                                        <span key={info.icon}> <i className={info.icon}/> {info.type}</span>)}
                                </div>
                            </label>
                        </li>
                    })}
                {fetchingMore && <div className="loader micro"/>}
            </ul>
        </div>
    </>
}
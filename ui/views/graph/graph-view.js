import React, {useCallback, useEffect, useRef, useState} from 'react'
import {StrKey} from '@stellar/stellar-base'
import ForceGraph2D from 'react-force-graph-2d'
import {usePageMetadata, useWindowWidth} from '@stellar-expert/ui-framework'
import {drawNode, getLinkColor} from './graph-drawing-primitives'
import {useGraphState} from './state/graph-state'
import AccountRelationsListView from './account-relations-list-view'
import './graph.scss'

function AccountAddressSelector({onSelect}) {
    const [address, setAddress] = useState('')

    const edit = useCallback(function (e) {
        const v = e.target.value.trim()
        setAddress(v)
        if (StrKey.isValidEd25519PublicKey(v)) {
            onSelect(v)
        }
    }, [onSelect])

    return <div className="space">
        <div className="dimmed">Visual analysis tool for Stellar account connections graph analysis</div>
        <div className="micro-space">
            <input type="text" placeholder="Account address to analyze" onChange={edit} value={address}/>
        </div>
        <div className="text-small">
            <p>
                Provide an account address to analyze all account connections via a graph visualization tool.
                Scrutinize transfers, track money flows, detect malicious activity, identify affiliated accounts.
            </p>
        </div>
    </div>
}

function fixNodePosition(node) {
    node.fx = node.x
    node.fy = node.y
}

function RelationsWrapper({children}) {
    return <div className="accounts-graph segment blank">
        <h3>Accounts graph</h3>
        <hr className="flare"/>
        <div className="space">
            {children}
        </div>
    </div>
}

function getGraphWidth(windowWidth) {
    if (windowWidth > 1400) return 870
    if (windowWidth <= 992) return windowWidth - 70
    return (windowWidth - 104) * 2 / 3 | 0
}


export default function GraphView() {
    const [_, forceRefresh] = useState(1)
    const graph = useGraphState()
    const windowWidth = useWindowWidth()
    const gRef = useRef()

    usePageMetadata({
        title: `Account relations graph`,
        description: `Explore relations graph for accounts on Stellar Network.`
    })

    useEffect(() => {
        const handler = () => forceRefresh(v => v + 1)
        graph.on('update', handler)
        return () => graph.off('update', handler)
    }, [graph])

    const canvasDrawNode = function (node, ctx) {
        drawNode(ctx, node, graph)
    }
    const canvasLinkColor = link => getLinkColor(link, graph)
    const canvasNodeHover = function (node) {
        graph.setHoverNode(node)
    }
    const canvasLinkHover = function (link) {
        graph.setHoverLink(link)
    }
    const canvasNodeClick = function (node) {
        fixNodePosition(node)
        graph.selectNode(node)
    }

    if (!graph.hasData)
        return <RelationsWrapper>
            <AccountAddressSelector onSelect={pubkey => graph.init(pubkey)}/>
        </RelationsWrapper>

    /*useEffect(()=>{
        const fg = gRef.current;
        if (!fg) return
        fg.d3Force('link')
            .distance(link => link.value)
    }, [])*/
    return <div className="row">
        <div className="column column-66">
            <RelationsWrapper>
                <ForceGraph2D graphData={graph.graphData}
                              ref={gRef}
                              width={getGraphWidth(windowWidth)}
                              height={800}
                              nodeCanvasObject={canvasDrawNode}
                              linkDirectionalArrowLength={3.5}
                              linkDirectionalArrowRelPos={1}
                              linkCurvature={0.2}
                              nodeLabel={null}
                              warmupTicks={50}
                              cooldownTime={1000}
                              minZoom={3}
                              linkWidth={0.7}
                              linkColor={canvasLinkColor}
                              onNodeHover={canvasNodeHover}
                              onNodeClick={canvasNodeClick}
                              onLinkHover={canvasLinkHover}
                              onNodeDragEnd={fixNodePosition}/>
            </RelationsWrapper>
        </div>
        <div className="column column-33">
            {graph.selectedNode ? <AccountRelationsListView/> : <div className="loader"/>}
        </div>
    </div>
}
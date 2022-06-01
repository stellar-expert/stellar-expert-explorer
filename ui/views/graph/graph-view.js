import React, {useEffect, useRef, useState} from 'react'
import {StrKey} from 'stellar-sdk'
import ForceGraph2D from 'react-force-graph-2d'
import {useWindowWidth} from '@stellar-expert/ui-framework'
import {drawNode, getLinkColor} from './graph-drawing-primitives'
import {useGraphState} from './state/graph-state'
import AccountRelationsListView from './account-relations-list-view'
import {setPageMetadata} from '../../util/meta-tags-generator'
import './graph.scss'

function AccountAddressSelector({onSelect}) {
    const [address, setAddress] = useState('')

    function edit(e) {
        const v = e.target.value.trim()
        setAddress(v)
        if (StrKey.isValidEd25519PublicKey(v)) {
            onSelect(v)
        }
    }

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
    return <div className="card accounts-graph">
        <h3 className="condensed">Accounts graph</h3>
        <hr/>
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
    const graph = useGraphState(),
        windowWidth = useWindowWidth(),
        gRef = useRef()

    useEffect(() => {
        setPageMetadata({
            title: `Account relations graph`,
            description: `Explore relations graph for accounts on Stellar Network.`
        })
    }, [])

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
    return <RelationsWrapper>
        <div className="row">
            <div className="column column-66">
                <ForceGraph2D graphData={graph.graphData}
                              ref={gRef}
                              width={getGraphWidth(windowWidth)}
                              height={800}
                              nodeCanvasObject={(node, ctx) => drawNode(ctx, node, graph)}
                              linkDirectionalArrowLength={3.5}
                              linkDirectionalArrowRelPos={1}
                              linkCurvature={0.2}
                              nodeLabel={null}
                              warmupTicks={50}
                              cooldownTime={1000}
                              minZoom={3}
                              linkWidth={0.7}
                              linkColor={link => getLinkColor(link, graph)}
                              onNodeHover={node => graph.setHoverNode(node)}
                              onNodeClick={node => {
                                  fixNodePosition(node)
                                  graph.selectNode(node)
                              }}
                              onLinkHover={link => graph.setHoverLink(link)}
                              onNodeDragEnd={fixNodePosition}/>
            </div>
            <div className="column column-33">
                {graph.selectedNode ? <AccountRelationsListView/> : <div className="loader"/>}
            </div>
        </div>
    </RelationsWrapper>
}
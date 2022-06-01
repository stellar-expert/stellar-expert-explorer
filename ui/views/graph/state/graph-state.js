import {useEffect, useState} from 'react'
import EventEmitter from 'events'
import {throttle} from 'throttle-debounce'
import {navigation} from '@stellar-expert/navigation'
import AccountGraphLink from './account-graph-link'
import AccountGraphNode from './account-graph-node'
import {getAccountRelations} from '../graph-api'

const linksBatchSize = 50

export class GraphState extends EventEmitter {
    constructor(initialAddress) {
        super()
        this.nodes = new Map()
        this.links = new Map()
        if (initialAddress) {
            this.init(initialAddress)
        }
    }

    nodes

    links

    hoverNode

    selectedNode

    hoverLink

    onChange

    graphData = {nodes: [], links: []}

    get hasData() {
        return this.nodes.size > 0
    }

    isLinkActive(link) {
        return this.hoverLink === link || (this.selectedNode && this.selectedNode.links.has(link.id))
    }

    setHoverLink(link) {
        this.hoverLink = link
        this.notifyUpdated()
    }

    setHoverNode(node = null) {
        if ((!node && !this.hoverNode) || this.hoverNode === node) return
        this.hoverNode = node
        this.notifyUpdated()
    }

    selectNode(node) {
        if (this.selectedNode === node) return
        node.visible = true
        this.selectedNode = node
        this.setHoverNode(node)
        this.notifyUpdated()
        this.populateNodeLinks(node)
        navigation.hash = node.id
    }

    setDisplayNodeState(node, visible) {
        node.visible = visible
        if (node === this.hoverNode) {
            this.hoverNode = null
        }
        this.updateGraphData()
        this.notifyUpdated()
    }

    addNode(address) {
        const existing = this.nodes.get(address)
        if (existing) return existing
        const node = new AccountGraphNode(address)
        this.nodes.set(node.id, node)
        return node
    }

    addLink(rel) {
        const existing = this.links.get(rel.id)
        if (existing) return existing
        const link = new AccountGraphLink(rel)
        link.source = this.nodes.get(rel.accounts[0])
        link.target = this.nodes.get(rel.accounts[1])
        this.links.set(link.id, link)
        return link
    }

    populateNodeLinks(node) {
        if (!node.canFetchMoreLinks) return Promise.resolve()
        return getAccountRelations(node.id, linksBatchSize, node.cursor)
            .then(res => {
                const {records} = res._embedded
                for (let rel of records) {
                    node.cursor = rel.paging_token
                    const otherNode = this.addNode(rel.accounts.find(a => a !== node.id))
                    const link = this.addLink(rel)
                    node.addLink(link)
                    otherNode.addLink(link)
                }
                if (records.length < linksBatchSize) {
                    node.canFetchMoreLinks = false
                }
                this.updateGraphData()
                this.notifyUpdated()
            })
    }

    init(address) {
        this.selectNode(this.addNode(address))
    }

    updateGraphData() {
        const selectedNodes = new Set()
        for (let node of this.nodes.values()) {
            if (node.visible) {
                selectedNodes.add(node)
            }
        }
        const selectedLinks = []
        for (let link of this.links.values()) {
            if (selectedNodes.has(link.source) && selectedNodes.has(link.target)) {
                selectedLinks.push(link)
            }
        }
        if (selectedNodes.size !== this.graphData.nodes.length || selectedLinks.length !== this.graphData.links.length) {
            this.graphData = {nodes: Array.from(selectedNodes), links: selectedLinks}
        }
    }

    notifyUpdated() {
        this.emit('update', this)
    }
}

const graph = new GraphState(navigation.hash.replace('#',''))

/**
 * @return {GraphState}
 */
export function useGraphState() {
    const [v, bumpV] = useState(0)

    const refresh = throttle(100, () => bumpV(v => ++v))

    useEffect(() => {
        graph.on('update', refresh)
        return () => graph.off('update', refresh)
    }, [])

    return graph
}
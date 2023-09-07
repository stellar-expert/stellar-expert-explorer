import EventEmitter from 'events'
import {useEffect, useState} from 'react'
import {throttle} from 'throttle-debounce'
import {navigation} from '@stellar-expert/navigation'
import {getDirectoryEntry} from '@stellar-expert/ui-framework'
import {getAccountRelations} from '../graph-api'
import AccountGraphLink from './account-graph-link'
import AccountGraphNode from './account-graph-node'

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

    /**
     * @type {Map<String,AccountGraphNode>}
     */
    nodes
    /**
     * @type {Map<String,AccountGraphLink>}
     */
    links
    /**
     * @type {AccountGraphNode}
     */
    hoverNode
    /**
     * @type {AccountGraphNode}
     */
    selectedNode
    /**
     * @type {AccountGraphLink}
     */
    hoverLink

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
        if (this.selectedNode === node)
            return
        node.visible = true
        this.selectedNode = node
        this.setHoverNode(node)
        this.populateNodeLinks(node)
        this.notifyUpdated()
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
        if (existing)
            return existing
        const node = new AccountGraphNode(address)
        this.nodes.set(node.id, node)
        getDirectoryEntry(node.id)
            .then(res => {
                if (res) {
                    node.title = res.name
                    node.domain = res.domain
                    node.tags = res.tags
                    this.notifyUpdated()
                }
            })
        return node
    }

    addLinks(rel) {
        const existing = this.links.get(rel.id)
        if (existing) return existing
        const accountNodes = rel.accounts.map(a => this.nodes.get(a))
        const link = new AccountGraphLink(rel)
        link.source = accountNodes[0]
        link.target = accountNodes[1]
        this.links.set(link.id, link)
        link.source.addLink(link)
        link.target.addLink(link)
    }

    populateNodeLinks(node) {
        if (!node.canFetchMoreLinks) return Promise.resolve()
        return getAccountRelations(node.id, linksBatchSize, node.cursor)
            .then(res => {
                const {records} = res._embedded
                for (const rel of records) {
                    node.cursor = rel.paging_token
                    this.addNode(rel.accounts.find(a => a !== node.id))
                    this.addLinks(rel)
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
        for (const node of this.nodes.values()) {
            if (node.visible) {
                selectedNodes.add(node)
            }
        }
        const selectedLinks = []
        for (const link of this.links.values()) {
            if (selectedNodes.has(link.source) && selectedNodes.has(link.target)) {
                for (const r of link.relations()) {
                    selectedLinks.push(r)
                }
            }
        }
        if (selectedNodes.size !== this.graphData.nodes.length || selectedLinks.length !== this.graphData.links.length) {
            this.graphData = {nodes: Array.from(selectedNodes), links: selectedLinks}
        }
    }

    notifyUpdated() {
        setTimeout(() => {
            this.emit('update', this)
        }, 100)
    }
}

const graph = new GraphState(navigation.hash.replace('#', ''))

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
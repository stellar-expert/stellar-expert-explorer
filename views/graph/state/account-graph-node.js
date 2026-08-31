class AccountGraphNode {
    constructor(id) {
        this.id = id
        this.links = new Map()
    }

    /**
     * @type {String}
     */
    id

    /**
     * @type {String}
     */
    directoryName

    /**
     * @type {Map<String, AccountGraphLink>}
     */
    links

    visible = false

    cursor

    canFetchMoreLinks = true

    /**
     * @type {String}
     */
    get name() {
        return this.id.substr(0, 4) + '…' + this.id.substr(-4)
    }

    addLink(link) {
        if (this.links.has(link.id)) return false
        this.links.set(link.id, link)
        return true
    }
}

export default AccountGraphNode
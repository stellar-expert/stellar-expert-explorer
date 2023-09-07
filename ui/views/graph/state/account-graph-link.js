const linkFwMask = 1 | (1 << 1) | (1 << 2) | (1 << 3)
const linkBwMask = (1 << 16) | (1 << 17) | (1 << 18) | (1 << 19)

export default class AccountGraphLink {
    constructor({id, paging_token, type, transfers, created}) {
        this.id = id
        this.cursor = paging_token
        this.type = type
        this.transfers = transfers
        this.created = created
    }

    /**
     * @type {String}
     */
    id

    /**
     * @type {String}
     */
    source

    /**
     * @type {String}
     */
    target

    /**
     * @type {String}
     */
    cursor

    /**
     * @type {Number}
     */
    type

    /**
     * @type {Number[]}
     */
    transfers

    /**
     * @type {Number}
     */
    created

    relations() {
        const res = []
        if ((this.type & linkFwMask) > 0) {
            res.push({
                id: this.id,
                source: this.source,
                target: this.target,
                transfers: this.transfers[0],
                direction: 'f'
            })
        }

        if ((this.type & linkBwMask) > 0) {
            res.push({
                id: 'r' + this.id,
                source: this.target,
                target: this.source,
                transfers: this.transfers[1],
                direction: 'b'
            })
        }
        return res
    }
}
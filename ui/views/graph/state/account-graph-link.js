class AccountGraphLink {
    constructor({id, paging_token, type, transfers, created}) {
        this.id = id
        this.cursor = paging_token
        this.type = type
        this.transfers = transfers
        this.created = created
        this.type.sort()
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
     * @type {Array<Number>}
     */
    type

    /**
     * @type {Number}
     */
    transfers

    /**
     * @type {Number}
     */
    created
}

export default AccountGraphLink
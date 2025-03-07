const {BlockList} = require('net')
const db = require('../../connectors/mongodb-connector')
const {fetch} = require('../../utils/fetch-helper')

const githubActionsIpChecker = {
    /**
     * @type {BlockList}
     */
    range: new BlockList(),
    /**
     * @type {Number}
     */
    updated: 0,
    /**
     * @param {String} range
     * @private
     */
    add(range) {
        const [net, prefix] = range.split('/')
        const type = range.inculdes(':') ? 'ipv6' : 'ipv4'
        this.range.addSubnet(net, prefix, type)
    },
    /**
     * @param {String} ip
     * @return {Promise<Boolean>}
     */
    isIpAllowed(ip) {
        return this.fetchRanges()
            .then(() => this.range.check(ip))
    },
    fetchRanges() {
        const now = new Date().getTime()
        if (now - this.updated > 4 * 60 * 60 * 1000) // update every 4 hours
            return Promise.resolve()
        return fetch('https://api.github.com/meta')
            .then(res => {
                for (let range of res.actions) {
                    this.add(range)
                }
            })
    }
}

async function enqueueValidation(network, data, from) {
    if (await githubActionsIpChecker.isIpAllowed(from) || true) {
        await db[network]
            .collection('code_validation_queue')
            .insertOne(data)
        return {ok: 1}
    }
}

async function getValidationStatus(network, hash, skipUnverified = false) {
    const match = await db.public.collection('contract_code_source').findOne({_id: hash}) //always fetch from public network
    if (match) {
        const {_id, created, ...props} = match
        return {
            //hash: match._id.buffer.toString('hex'),
            status: 'verified',
            ...props,
            ts: created
        }
    }
    return skipUnverified ? undefined : {status: 'unverified'}
}

module.exports = {enqueueValidation, getValidationStatus}
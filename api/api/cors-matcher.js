const {corsWhitelist} = require('../app.config')

class CorsMatcher {
    constructor(whitelist) {
        this.wildcards = new Set()
        this.list = new Set()
        for (let origin of whitelist) {
            if (origin.includes('*.')) { //parse wildcard origins
                this.wildcards.add(origin.substring(origin.indexOf('*.') + 2)) //save only root FQDN
                this.list.add(origin.replace('*.', '')) //add root FQDN
            } else {
                this.list.add(origin) //add origin as-is
            }
        }
    }

    /**
     * @type {Set<String>}
     */
    wildcards
    /**
     * @type {Set<String>}
     */
    list

    match(origin) {
        if (this.list.has(origin))
            return true
        if (this.wildcards.has(/\w+\.\w+$/.exec(origin)[0]))
            return true
        return false
    }
}

module.exports = new CorsMatcher(corsWhitelist)
import {getCurrentStellarNetwork} from '@stellar-expert/ui-framework'

class LedgerStream {
    constructor() {
        this.listeners = new Set()
    }

    /**
     * @type {boolean}
     * @private
     */
    listening = false
    /**
     * @type {Set<function>}
     * @private
     */
    listeners

    /**
     * @param {function} listener
     */
    on(listener) {
        this.listeners.add(listener)
        if (!this.listening) {
            this.listening = true
            setTimeout(() => this.waitForLedger(), 100)
        }
    }

    /**
     * @param {function} listener
     */
    off(listener) {
        this.listeners.delete(listener)
        if (!this.listeners.size) {
            this.listening = false
        }
    }

    /**
     * @param {number} ledger
     * @private
     */
    notify(ledger) {
        for (const listener of this.listeners) {
            listener(ledger)
        }
    }

    /**
     * @return {Promise}
     * @private
     */
    async waitForLedger() {
        const url = `${explorerApiOrigin}/explorer/${getCurrentStellarNetwork()}/ledger/stream`
        try {
            const resp = await fetch(url, {keepalive: true, cache: 'no-cache'})
            if (!resp.ok) {
                let errorExt
                try {
                    errorExt = await resp.json()
                } catch (parsingError) {
                    errorExt = {}
                }
                const err = new Error(errorExt?.error || resp.statusText || 'Failed to fetch data from the server')
                err.status = resp.status
                err.ext = errorExt
                throw err
            }
            const {ledger} = await resp.json()
            this.notify(ledger)
            if (this.listening) {
                setTimeout(() => this.waitForLedger(), 1000)
            }
        } catch (e) {
            console.error(e)
            if (e instanceof Error) {
                e = {
                    error: e.message,
                    status: e.status || 500,
                    ext: e.ext
                }
            }
            if (e.ext && e.ext.status) {
                e.status = e.ext.status
            }
            return e
        }
    }
}

export const ledgerStream = new LedgerStream()

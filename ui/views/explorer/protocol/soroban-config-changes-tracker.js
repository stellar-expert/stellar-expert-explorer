export class SorobanConfigChangesTracker {
    constructor() {
        this.current = {}
    }

    /**
     * @type {{}}
     */
    current

    /**
     * Apply config update
     * @param {{}} update
     * @return {String[]}
     */
    apply(update) {
        const changes = []
        this.applyObjectChanges(changes, this.current, update)
        return changes
    }

    /**
     * @param {[]} changes
     * @param {{}} existing
     * @param {{}} updated
     * @param {String} prefix
     * @private
     */
    applyObjectChanges(changes, existing, updated, prefix = '') {
        for (const [key, newValue] of Object.entries(updated)) {
            existing[key] = this.applyValueChange(changes, `${prefix ? prefix + '.' : ''}${key}`, existing[key], newValue)
        }
        return existing
    }

    /**
     * @param {[]} changes
     * @param {[]} existing
     * @param {[]} updated
     * @param {String} prefix
     * @private
     */
    applyArrayChanges(changes, existing, updated, prefix = '') {
        for (let i = 0; i < updated.length; i++) {
            existing[i] = this.applyValueChange(changes, `${prefix}[${i}]`, existing[i], updated[i])
        }
        return existing
    }

    /**
     * @param changes
     * @param key
     * @param prevValue
     * @param newValue
     * @private
     */
    applyValueChange(changes, key, prevValue, newValue) {
        if (typeof newValue === 'object') { //object or array
            if (newValue instanceof Array)
                return this.applyArrayChanges(changes, prevValue || [], newValue, key)
            return this.applyObjectChanges(changes, prevValue || {}, newValue, key)
        }
        //atomic value
        if (prevValue !== newValue) { //log only if there were changes
            if (prevValue === undefined) {
                changes.push(`${key} = ${newValue}`)
            } else {
                changes.push(`${key} = ${newValue} //before: ${prevValue}`)
            }
            return newValue
        }
        return prevValue
    }
}

export function applySorobanConfigChanges(protocolEntries) {
    if (!protocolEntries)
        return null
    const changesTracker = new SorobanConfigChangesTracker()
    for (let i = protocolEntries.length - 1; i >= 0; i--) {
        const entry = protocolEntries[i]
        if (!entry.config_changes)
            continue
        entry.changesAnnotation = changesTracker.apply(entry.config_changes)
    }
    return protocolEntries
}
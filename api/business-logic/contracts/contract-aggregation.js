const contractHistoryKeys = {
    invocations: 0,
    subinvocation: 1,
    events: 2,
    errors: 3
}

function rehydrateContractHistory(history) {
    return Object.entries(history).map(([key, value]) => ({
        ts: parseInt(key),
        invocations: value[contractHistoryKeys.payments],
        subinvocation: value[contractHistoryKeys.subinvocation],
        events: value[contractHistoryKeys.events],
        errors: value[contractHistoryKeys.errors]
    }))
}


function aggregateContractHistory(history) {
    return rehydrateContractHistory(history)
        .reduce((acc, {invocations, subinvocation, events, errors}) => {
            acc.invocations += invocations
            acc.subinvocation += subinvocation
            acc.events += events
            acc.errors += errors
            return acc
        }, {invocations: 0, subinvocation: 0, events: 0, errors: 0})
}


module.exports = {rehydrateContractHistory, aggregateContractHistory}

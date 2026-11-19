const namePattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export function normalizeSoranName(value) {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    //Reject Unicode before lowercasing, including characters that fold to ASCII.
    if (!/^[A-Za-z0-9.-]+$/.test(trimmed)) return null
    const name = trimmed.toLowerCase()
    return namePattern.test(name) ? name : null
}

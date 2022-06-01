function shortenAddress(address) {
    return address.substring(0, 6) + '…' + address.substring(address.length - 6)
}

/**
 *
 * @param {DirectoryEntryChanges} changes
 * @param {String} [extraInfo]
 * @return {String}
 */
function formatRequestTitle(changes, extraInfo = null) {
    let res
    if (changes.deleted) {
        res = `Delete ${shortenAddress(changes.address)}`
    } else {
        let name = changes.name
        if (changes.domain) {
            name += ' ' + changes.domain
        }
        res = `${changes.version > 0 ? 'Update' : 'Add'} [${name}] `
        if (changes.tags?.length) {
            res += changes.tags.map(t => '#' + t).join(' ') + ' '
        }
        res += shortenAddress(changes.address)
    }
    if (extraInfo) {
        res += ' \n' + extraInfo
    }
    return res
}

/**
 *
 * @param {DirectoryEntryChanges} changes
 * @return {String}
 */
function formatRequestBody(changes) {
    let body = `Address: \`${changes.address}\`  
Tags: ${changes.tags.map(t=>'`'+t+'`').join(' ')}   
Title: **${changes.name}**  `
    if (changes.domain) {
        body += `Domain: ${changes.domain}  `
    }
    body += `
Requested by @${changes.author}`
    if (changes.notes) {
        body += `

> ${changes.notes.replace('\n', ' ')}`
    }
    return body
}

/**
 *
 * @param {DirectoryEntryChanges} changes
 * @return {String}
 */
function formatGithubAccountEntry(changes) {
    const res = {
        address: changes.address,
        name: changes.name,
        tags: changes.tags
    }
    if (changes.domain) {
        res.domain = changes.domain
    }
    res.version = changes.version
    return JSON.stringify(res, null, '  ')
}


module.exports = {
    formatRequestBody,
    formatRequestTitle,
    formatGithubAccountEntry
}
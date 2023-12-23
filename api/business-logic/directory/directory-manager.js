const {StrKey} = require('@stellar/stellar-sdk')
const mongodbStorage = require('./storage/mongodb-directory-storage')
const {validateUpdateEntryData, validateDeletedEntryData} = require('./directory-request-validators')
const {createGithubWrapper, requestGithubUserDetails, generateAccountFileName, getRepoFileHash} = require('./directory-github-api-utils')
const {formatRequestTitle, formatRequestBody, formatGithubAccountEntry} = require('./directory-github-text-formatter')
const directoryTags = require('./directory-tags')
const errors = require('../errors')
const {directory} = require('../../app.config.json')

let lastTs = new Date(0)

const tagNames = directoryTags.map(t => t.name)

function setTimestamp(changes) {
    const ts = new Date()
    if (ts <= lastTs) throw new Error('Simultaneous update conflict')
    lastTs = ts
    changes.ts = ts
}

async function checkVersion({address, version}) {
    const current = await mongodbStorage.getDirectoryEntryVersion(address)
    version = parseInt(version) || 0
    if (version !== current + 1) throw errors.badRequest(`Directory entry version conflict. Current version: ${current}, new: ${version}.`)
}

function isAdmin(githubUserInfo) {
    return directory.admins.includes(githubUserInfo.name)
}

const directoryManager = {
    async listTags() {
        return directoryTags
    },
    async update({address, domain, name, tags, notes, version = 0, accessToken}) {
        //fetch user details from Github
        const githubUserInfo = await requestGithubUserDetails(accessToken)
        const changes = {address, domain, name, tags, notes, version, author: githubUserInfo.name}
        validateUpdateEntryData(changes)
        setTimestamp(changes)
        //check permissions
        if (isAdmin(githubUserInfo)) {
            //ensure the right version
            await checkVersion(changes)
            const filePath = generateAccountFileName(changes)
            //write file
            await createGithubWrapper().writeFile(filePath, {
                content: formatGithubAccountEntry(changes),
                message: formatRequestTitle(changes, changes.notes),
                sha: await getRepoFileHash(filePath),
                author: {name: githubUserInfo.name, email: githubUserInfo.email}
            })
            await mongodbStorage.updateDirectoryEntry(changes)

            if (changes.version == 0) {
                notifyBot('created', `${githubUserInfo.name} created new entry`, changes)
            } else {
                notifyBot('updated', `${githubUserInfo.name} updated entry`, changes)
            }

        } else {
            await createGithubWrapper().createIssue({
                title: formatRequestTitle(changes),
                body: formatRequestBody(changes)
            })
            await mongodbStorage.saveRequest(changes)
            notifyBot('requested', `${githubUserInfo.name} requested new address listing`, changes)
        }
        return changes
    },
    async get(address, extended) {
        return await mongodbStorage.getDirectoryEntry(address, extended)
    },
    async delete({address, notes, version, accessToken}) {
        //fetch user Details from Github
        const githubUserInfo = await requestGithubUserDetails(accessToken)
        if (!isAdmin(githubUserInfo)) throw errors.forbidden()
        const changes = {address, notes, version, deleted: true, author: githubUserInfo.name}

        validateDeletedEntryData(changes)
        setTimestamp(changes)

        await checkVersion(changes)

        const filePath = generateAccountFileName(changes)
        //retrieve hash of the existing file from Github
        const existingFileHash = await getRepoFileHash(filePath)
        //delete if file exists
        if (existingFileHash) {
            await createGithubWrapper().deleteFile(filePath, {
                message: formatRequestTitle(changes),
                sha: existingFileHash,
                author: {name: githubUserInfo.name, email: githubUserInfo.email}
            })
            await mongodbStorage.deleteDirectoryEntry(changes)
            notifyBot('deleted', `${githubUserInfo.name} deleted entry`, changes)
        }
        return {address, deleted: true}
    },
    async listChanges(basePath, address, query) {
        return mongodbStorage.getChangesHistory(basePath, query)
    },
    async listDirectory(basePath, query) {
        let {address, tag, search, since} = query
        if (address) {
            if (!(address instanceof Array))
                throw errors.badRequest('Invalid parameter "address". Expected an array of addresses to fetch.')
            if (address.length > 50)
                throw errors.badRequest('Too many "address" conditions. Maximum 50 searched addresses allowed.')
            query.address = address.filter(a => StrKey.isValidEd25519PublicKey(a))
            if (!query.limit) {
                query.limit = 50
            }
        }
        if (tag) {
            if (!(tag instanceof Array))
                throw errors.badRequest('Invalid "tag" parameter value. Expected an array of strings.')
            for (let t of tag) {
                if (!tagNames.includes(t))
                    throw errors.badRequest(`Invalid "tag" parameter value. Unknown tag: "${t}".`)
            }
            if (tag.length > 20)
                throw errors.badRequest('Too many "tag" conditions. Maximum 20 searched tags allowed.')
        }
        if (search) {
            if (typeof search !== 'string' || search.length < 3 || search.length > 60)
                throw errors.badRequest('Invalid "search" parameter value. Expected a string (3-60 characters).')
        }
        if (since !== undefined) return mongodbStorage.getRecentDirectoryEntries(basePath, query)
        return mongodbStorage.getDirectoryEntries(basePath, query)
    },
    async isDomainBlocked(domain) {
        return {domain, blocked: await mongodbStorage.isDomainBlocked(domain)}
    },
    async listBlockedDomains(basePath, query) {
        return await mongodbStorage.listBlockedDomains(basePath, query)
    },
    async blockDomain({domain, reason, accessToken}) {
        if (!/^\S+\.[a-z]{2,}$/.test(domain))
            throw errors.badRequest('Invalid domain name')
        if (await mongodbStorage.isDomainBlocked(domain))
            return {domain}//already added
        const githubUserInfo = await requestGithubUserDetails(accessToken)
        if (isAdmin(githubUserInfo)) {
            const filePath = 'domains/blocklist.txt'
            const github = createGithubWrapper()
            const {content, sha} = await github.listRepoContents(filePath)
            const newContent = content + (content.substring(content.length - 1) === '\n' ? '' : '\n') + domain + '\n'
            //write file
            await github.writeFile(filePath, {
                content: newContent,
                message: `Block domain ${domain}\n${reason}`,
                sha,
                author: {name: githubUserInfo.name, email: githubUserInfo.email}
            })
            await mongodbStorage.blockDomain(domain)
            notifyBot('requested', `${githubUserInfo.name} blocked domain ${domain}`)
        } else {
            await createGithubWrapper().createIssue({
                title: `Block domain ${domain}`,
                body: `Domain: \`${domain}\`  \nRequested by @${githubUserInfo.name}  \n> ${reason}`
            })
            notifyBot('requested', `${githubUserInfo.name} requested blocking domain ${domain}`)
        }
        return {domain}
    }
}

function notifyBot(category, extInfo) {
    //empty
}

module.exports = directoryManager

/**
 * @typedef {Object} DirectoryEntryChanges
 * @property {String} address
 * @property {String} name
 * @property {String[]} tags
 * @property {String} author
 * @property {String} [domain]
 * @property {String} [notes]
 * @property {Number} [version]
 * @property {Boolean} [deleted]
 */

const {directory} = require('../../app.config.json')
const GithubApiWrapper = require('./github-api-wrapper')
const errors = require('../errors')


/**
 * @param {String} [accessToken]
 * @return {GithubApiWrapper}
 */
function createGithubWrapper(accessToken = null) {
    return new GithubApiWrapper(accessToken || directory.accessToken, directory.repository)
}

/**
 * @param {String} accessToken
 * @return {Promise<GithubUserInfo>}
 */
async function requestGithubUserDetails(accessToken) {
    if (!accessToken)
        throw errors.forbidden(`Github accessToken required`)
    const wrapper = createGithubWrapper(accessToken)
    try {
        return await wrapper.getUserDetails()
    } catch (e) {
        console.error(e)
        throw errors.forbidden()
    }
}

/**
 * @param {DirectoryEntryChanges} changes
 * @return {String}
 */
function generateAccountFileName(changes) {
    return `accounts/${changes.address}.json`
}

async function getRepoFileHash(filePath) {
    try {
        const existingFile = await createGithubWrapper().listRepoContents(filePath)
        if (!existingFile) return undefined
        return existingFile.sha
    } catch (e) {
        return undefined
    }
}

module.exports = {
    createGithubWrapper,
    requestGithubUserDetails,
    generateAccountFileName,
    getRepoFileHash
}
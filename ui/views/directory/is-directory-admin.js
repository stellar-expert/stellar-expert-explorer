import appSettings from '../../app-settings'

/**
 * @param {OAuthUserInfo} githubUser
 * @return {Boolean}
 */
export function isDirectoryAdmin(githubUser) {
    if (!githubUser) return false
    return appSettings.directoryAdmins.includes(githubUser.name.toLowerCase())
}
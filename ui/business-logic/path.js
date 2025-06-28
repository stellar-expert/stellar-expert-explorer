import {getCurrentStellarNetwork} from '@stellar-expert/ui-framework'

/**
 * Build a relative url path.
 * @param {String} relativePath
 * @param {'explorer'|'directory'|'anchor'|'demolisher'|'blog'} [predicate]
 * @return {String}
 */
export function resolvePath(relativePath, predicate = 'explorer') {
    const segments = ['', predicate, getCurrentStellarNetwork()]
    if (relativePath) {
        if (relativePath[relativePath.length - 1] === '/') {
            //remove trailing slash
            relativePath = relativePath.slice(0, relativePath.length - 1)
        }
        segments.push(relativePath)
    }
    return segments.join('/')
}
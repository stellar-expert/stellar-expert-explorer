import {setPageMetadata as setPageMeta} from '@stellar-expert/ui-framework'
import appSettings from '../app-settings'

/**
 * Update page metadata tags and thumbnail generation.
 * @param params
 * @param {string} params.description - Page contents description.
 * @param {string} params.title - Page title.
 */
export function setPageMetadata(params) {
    const search = (window.location.search?.hasOwnProperty()) ? window.location.search : ''
    const endpoint = appSettings.templateServer + '/thumbnail' + window.location.pathname + search
    fetch(endpoint)
        .then(async res => {
            if (!res.ok)
                throw new Error(res.statusText || 'Failed to get thumbnail')

            const thumbnail = await res.json()
            setPageMeta({
                ...params,
                image: thumbnail,
                twitterImage: thumbnail,
                facebookImage: thumbnail
            })
        })
        .catch(() => setPageMeta(params))
}
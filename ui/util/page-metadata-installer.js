import {setPageMetadata as setPageMeta} from '@stellar-expert/ui-framework'
import appSettings from '../app-settings'

const memoizedData = {}
/**
 * Update page metadata tags and thumbnail generation.
 * @param params
 * @param {string} params.description - Page contents description.
 * @param {string} params.title - Page title.
 */
export async function setPageMetadata(params) {
    const search = (window.location.search?.hasOwnProperty()) ? window.location.search : ''
    const endpoint = appSettings.templateServer + '/thumbnail' + window.location.pathname + search
    if (!memoizedData[endpoint]) {
        memoizedData[endpoint] = {
            thumb: null
        }
        await fetch(endpoint)
            .then(async res => {
                if (!res.ok)
                    throw new Error(res.statusText || 'Failed to get thumbnail')
                memoizedData[endpoint].thumb = await res.json()
            })
            .catch(() => setPageMeta(params))
    }
    setPageMeta({
        ...params,
        image: memoizedData[endpoint]?.thumb
    })
}
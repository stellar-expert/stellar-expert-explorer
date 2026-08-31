import {useExplorerApi} from '@stellar-expert/ui-framework'

export function useDexOffer(offerId) {
    return useExplorerApi('offer/' + offerId, {
        processResult(res) {
            if (res.error) {
                res.id = offerId
                if (res.status === 404) {
                    res.nonExistentOffer = true
                }
            }
            return res
        }
    })
}
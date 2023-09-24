import {useExplorerApi} from '@stellar-expert/ui-framework'

export function useContractInfo(address) {
    return useExplorerApi('contract/' + address, {
        processResult(data) {
            if (data?.error && (data.status || data.error.status) === 404) {
                data.nonExistentContract = true
            }
            data.address = address
            return data
        }
    })
}
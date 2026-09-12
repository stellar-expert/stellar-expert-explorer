import {retrieveLedgerInfo} from '@stellar-expert/ui-framework'

//The API can resolve with an error object instead of a ledger, including on transport failures.
export function parseLedgerResponse(data) {
    if (!data || data.error || data.status >= 400 || typeof data.xdr !== 'string' || !data.xdr) {
        throw new Error('Ledger data is unavailable.')
    }
    return retrieveLedgerInfo(data)
}

import {apiCall} from '../../models/api'

export async function getAccountRelations(account, limit = 50, cursor) {
    return apiCall(`relations/${account}`,
        {cursor, limit})
        .catch(err => {
            console.error(err)
            return null
        })
}
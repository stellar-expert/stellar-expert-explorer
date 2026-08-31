import {stringifyQuery} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'

export const LOGS_PAGE_SIZE = 20

/**
 * Fetch a page of log entries across every account
 * @param {Number} [page]
 * @param {Number} [pageSize]
 * @param {{email: String, type: String|String[], from: Number, to: Number}} [filters]
 * @return {Promise<{items: [], total: Number, page: Number, pageSize: Number}>}
 */
export function fetchLogs(page = 0, pageSize = LOGS_PAGE_SIZE, filters = {}) {
    return apiRequest(`logs${stringifyQuery({...filters, page, limit: pageSize})}`)
}
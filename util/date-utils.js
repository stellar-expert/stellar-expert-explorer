import {toUnixTimestamp} from '@stellar-expert/formatter'

/**
 * Trim date with specified precision
 * @param {Date|Number|String} date - Date to trim
 * @param {Number} timeframe - Trim precision, in seconds
 * @return {Number}
 */
export function trimDate(date, timeframe) {
    return Math.floor(toUnixTimestamp(date) / timeframe) * timeframe
}

export const minute = 60
export const hour = minute * 60
export const day = hour * 24
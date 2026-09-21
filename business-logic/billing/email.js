/**
 * Address check the forms use, matching the rule the API applies
 * @param {String} [email]
 * @return {Boolean}
 */
export function isValidEmail(email) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((email || '').trim())
}
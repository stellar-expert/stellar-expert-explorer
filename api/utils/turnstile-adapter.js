const {errors} = require('../business-logic/errors')
const SECRET_KEY = '1x0000000000000000000000000000000AA'

async function validateTurnstileToken(token) {
    if (!token)
        throw errors.forbidden('Anti-automation token is missing')
    // validate the token by calling the "/siteverify" API endpoint.
    let formData = new FormData()
    formData.append('secret', SECRET_KEY)
    formData.append('response', token)

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        body: formData,
        method: 'POST'
    })

    const outcome = await result.json()
    if (!outcome.success)
        throw errors.forbidden('Failed to validate anti-bot protection token')
}

module.exports = {validateTurnstileToken}
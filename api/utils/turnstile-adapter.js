const errors = require('../business-logic/errors')
const {turnstileSecret} = require('../app.config')

async function validateTurnstileToken(token) {
    if (!token)
        throw errors.forbidden('Anti-automation token is missing')

    // validate the token by calling the "/siteverify" API endpoint.
    const formData = new FormData()
    formData.append('secret', turnstileSecret)
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
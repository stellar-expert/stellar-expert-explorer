const {registerRoute} = require('../router')
const errors = require('../../business-logic/errors')
const {oauth} = require('../../app.config')
const GithubApiWrapper = require('../../business-logic/directory/github-api-wrapper')

module.exports = function (app) {
    registerRoute(app,
        'github/exchange-token',
        {cache: false, prefix: '/explorer/oauth/'},
        (async ({query}) => {
            const authCode = query.code
            if (!authCode || query.client_id !== oauth.github.clientId)
                throw errors.forbidden()

            try {
                const {access_token, scope} = await new GithubApiWrapper(null, null)
                    .exchangeAccessToken(query.client_id, oauth.github.secret, authCode)

                if (!access_token)
                    throw errors.forbidden()
                return {access_token, scope}
            } catch (e) {
                console.error(e)
                throw errors.forbidden()
            }
        }))
}
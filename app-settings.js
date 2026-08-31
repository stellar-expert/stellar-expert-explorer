import {setStellarNetwork, getCurrentStellarNetwork} from '@stellar-expert/ui-framework'

class AppSettings {
    constructor() {
        const networkFromUrl = ((/^\/(?:\w+)\/(\w+)/i.exec(location.pathname) || [])[1] || '').toLowerCase()
        const availableNetworks = Object.keys(this.networks)
        setStellarNetwork(availableNetworks.includes(networkFromUrl) ? networkFromUrl : availableNetworks[0])
        //load from env variables
        const {
            API_ENDPOINT,
            DIRECTORY_ADMINS,
            OAUTH_GITHUB_CLIENTID,
            TURNSTILE_KEY,
            BILLING_API_ENDPOINT,
            AUTH0_DOMAIN,
            AUTH0_CLIENT_ID,
            AUTH0_AUDIENCE
        } = envSettings
        if (API_ENDPOINT) {
            this.apiEndpoint = API_ENDPOINT
        }
        if (BILLING_API_ENDPOINT) {
            this.billingApiEndpoint = BILLING_API_ENDPOINT
        }
        if (AUTH0_DOMAIN) {
            this.auth0.domain = AUTH0_DOMAIN
        }
        if (AUTH0_CLIENT_ID) {
            this.auth0.clientId = AUTH0_CLIENT_ID
        }
        if (AUTH0_AUDIENCE) {
            this.auth0.audience = AUTH0_AUDIENCE
        }
        if (DIRECTORY_ADMINS) {
            this.directoryAdmins = DIRECTORY_ADMINS.split(',').map(a => a.trim())
        }
        if (OAUTH_GITHUB_CLIENTID) {
            this.oauth.github.clientId = OAUTH_GITHUB_CLIENTID
        }
        if (TURNSTILE_KEY) {
            this.turnstileKey = TURNSTILE_KEY
        }
        if (window.forcedExplorerApiOrigin) {
            this.apiEndpoint = window.forcedExplorerApiOrigin
        }
    }

    networks = {
        public: {
            title: 'public',
            horizon: 'https://horizon.stellar.org',
            passphrase: 'Public Global Stellar Network ; September 2015',
            demolisher: 'GA4C3WUE7TL7GNXHF27B6Z54VMRCPTW2JH2OQRHH4U2EHPI6CCLMERGE'
        },
        testnet: {
            title: 'testnet',
            horizon: 'https://horizon-testnet.stellar.org',
            passphrase: 'Test SDF Network ; September 2015',
            demolisher: 'GA4C3WUE7TL7GNXHF27B6Z54VMRCPTW2JH2OQRHH4U2EHPI6CCLMERGE'
        }
    }

    apiEndpoint = 'https://api.stellar.expert'

    directoryAdmins = []

    oauth = {
        github: {
            clientId: '40b33b22410d95480eb2'
        }
    }

    turnstileKey = '1x00000000000000000000BB'

    billingApiEndpoint = 'https://api.stellar.expert'

    auth0 = {}

    get activeNetwork() {
        return getCurrentStellarNetwork()
    }

    get networkSettings() {
        const networkName = getCurrentStellarNetwork()
        let res = this.networks[networkName]
        if (!res) {
            res = this.networks.public
        }
        return res
    }

    get networkPassphrase() {
        return this.networkSettings.passphrase
    }

    get horizonUrl() {
        return this.networkSettings.horizon
    }
}

const appSettings = new AppSettings()

export default appSettings

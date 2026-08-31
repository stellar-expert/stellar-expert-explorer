const path = require('path')
const {initWebpackConfig} = require('@stellar-expert/webpack-template')
const pkgInfo = require('./package.json')

const {
    API_ENDPOINT,
    DIRECTORY_ADMINS,
    OAUTH_GITHUB_CLIENTID,
    TURNSTILE_KEY,
    BILLING_API_ENDPOINT,
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_AUDIENCE
} = process.env

const outputPath = path.join(__dirname, './public/')

const config = initWebpackConfig({
    entries: {
        app: {
            import: path.join(__dirname, './app.js'),
            htmlTemplate: './static-template/index.html'
        }
    },
    outputPath,
    staticFilesPath: './static/',
    scss: {
        additionalData: '@import "~@stellar-expert/ui-framework/basic-styles/variables.scss";',
        sassOptions: {
            quietDeps: true,
            silenceDeprecations: ['import']
        }
    },
    define: {
        appVersion: pkgInfo.version,
        envSettings: {
            API_ENDPOINT,
            DIRECTORY_ADMINS,
            OAUTH_GITHUB_CLIENTID,
            TURNSTILE_KEY,
            BILLING_API_ENDPOINT,
            AUTH0_DOMAIN,
            AUTH0_CLIENT_ID,
            AUTH0_AUDIENCE
        }
    },
    devServer: {
        host: '0.0.0.0',
        server: {
            type: 'https'
        },
        port: 9001
    }
})

config.resolve = config.resolve || {}
config.resolve.alias = {
    ...config.resolve.alias,
    react: path.resolve(__dirname, './node_modules/react'),
    'react-dom': path.resolve(__dirname, './node_modules/react-dom')
}

module.exports = config
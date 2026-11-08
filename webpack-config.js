const path = require('path')
const {initWebpackConfig} = require('@stellar-expert/webpack-template')
const pkgInfo = require('./package.json')

const {
    API_ENDPOINT,
    DIRECTORY_ADMINS,
    OAUTH_GITHUB_CLIENTID,
    TURNSTILE_KEY,
    BILLING_API_ENDPOINT
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
            BILLING_API_ENDPOINT
        }
    },
    devServer: {
        allowedHosts: 'all',
        host: '0.0.0.0',
        server: {
            type: 'https'
        },
        port: 9001
    }
})

module.exports = (env, argv) => {
    const webpackConfig = config(env, argv)
    webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        react: path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        //stellar-sdk ships separate ESM and CJS builds; CommonJS dependencies (tx-meta-effects-parser) would pull the CJS
        //copy alongside the ESM one, breaking instanceof checks (Asset, xdr types) between them - always bundle the ESM build
        '@stellar/stellar-sdk$': path.resolve(__dirname, './node_modules/@stellar/stellar-sdk/lib/esm/index.js')
    }
    //legal pages are authored as markdown and bundled as plain text
    webpackConfig.module.rules.push({test: /\.md$/, type: 'asset/source'})
    return webpackConfig
}
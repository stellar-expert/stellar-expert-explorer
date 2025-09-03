const path = require('path')
const {initWebpackConfig} = require('@stellar-expert/webpack-template')
const pkgInfo = require('./package.json')

module.exports = initWebpackConfig({
    entries: {
        app: {
            import: path.join(__dirname, './app.js'),
            htmlTemplate: './static-template/index.html'
        }
    },
    outputPath: './public/',
    staticFilesPath: './static/',
    scss: {
        additionalData: '@import "~@stellar-expert/ui-framework/basic-styles/variables.scss";',
        sassOptions: {
            quietDeps: true,
            silenceDeprecations: ['import']
        }
    },
    define: {
        appVersion: pkgInfo.version
    },
    devServer: {
        host: '0.0.0.0',
        server: {
            type: 'https'
        },
        port: 9001
    }
})

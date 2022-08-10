const path = require('path')
const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
//const {DuplicatesPlugin} = require('inspectpack/plugin')
//const {webpackExcludeNodeModulesExcept} = require('@stellar-expert/webpack-utils')
const pkgInfo = require('./package.json')

module.exports = function (env, argv) {
    const mode = argv.mode || 'development'
    process.env.NODE_ENV = mode

    console.log('mode=' + mode)

    const isProduction = mode !== 'development'

    const settings = {
        mode,
        entry: {
            'app': [path.join(__dirname, './app.js')]
        },
        output: {
            path: path.join(__dirname, './public/'),
            filename: pathData => {
                //if (['app'].includes(pathData.chunk.name)) return '[name].js'
                return `${pathData.runtime}.${pathData.hash}.js`
            },
            chunkFilename: pathData => {
                return `${pathData.chunk.name || pathData.chunk.id}.${pathData.chunk.hash}.js`
            },
            publicPath: '/',
            clean: true
        },
        module: {
            rules: [
                {
                    test: /\.js?$/,
                    loader: 'babel-loader',
                    //exclude: webpackExcludeNodeModulesExcept('@stellar-expert/ui-framework')
                },
                {
                    test: /\.scss$/,
                    //exclude: webpackExcludeNodeModulesExcept('@stellar-expert/ui-framework'),
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                url: false,
                                sourceMap: !isProduction
                            }
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: !isProduction,
                                additionalData: '@import "~@stellar-expert/ui-framework/basic-styles/variables.scss";'
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new webpack.IgnorePlugin({resourceRegExp: /ed25519/}),
            new CopyPlugin({
                patterns: [
                    path.join(__dirname, './static/')
                ]
            }),
            new MiniCssExtractPlugin({
                filename: '[name].[contenthash].css'
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(mode),
                appVersion: JSON.stringify(pkgInfo.version)
            }),
            new webpack.ProvidePlugin({Buffer: ['buffer', 'Buffer']}),
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: './static-template/index.html',
                chunks: ['app']
            })
           /* new DuplicatesPlugin({
                emitErrors: false,
                ignoredPackages: []
            })*/
        ],
        resolve: {
            symlinks: true,
            modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
            fallback: {
                util: false,
                http: false,
                https: false,
                path: false,
                fs: false,
                url: false,
                events: false,
                buffer: require.resolve('buffer/'),
                stream: require.resolve('stream-browserify')
            }
        },
        optimization: {
            moduleIds: 'deterministic'
        }
    }

    if (!isProduction) {
        settings.devtool = 'source-map'
        settings.devServer = {
            historyApiFallback: {
                disableDotRule: true
            },
            compress: true,
            host: '0.0.0.0',
            https: true,
            port: 9001,
            static: {
                directory: path.resolve(__dirname, 'public')
            }
        }
    } else {
        settings.plugins.unshift(new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false,
            sourceMap: false
        }))

        const TerserPlugin = require('terser-webpack-plugin'),
            CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

        settings.optimization.minimizer = [new TerserPlugin({
            terserOptions: {
                //warnings: true,
                toplevel: true
            }
        }),
            new CssMinimizerPlugin()]

    }
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
    settings.plugins.push(new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-stats.html',
        openAnalyzer: false
    }))
    return settings
}
import {useDependantState, useExplorerApi, loadAccount} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {getPrice} from './xlm-price-resolver'
import {calculateAveragePrice} from '../../util/tech-indicators/average-price'
import {calculateVolatility} from '../../util/tech-indicators/yang-zhang-volatility-estimator'
import {calculateStandardDeviation} from '../../util/tech-indicators/standard-deviation'

export function useAssetInfo(asset) {
    const [descriptor] = useDependantState(() => {
        try {
            if (typeof asset === 'string')
                return AssetDescriptor.parse(asset)
            if (asset.code && asset.issuer)
                return new AssetDescriptor(asset)
            throw new Error('Invalid asset: ' + asset)
        } catch (e) {
            console.error(e)
            return {error: e, invalidAsset: true}
        }
    }, [asset])
    return useExplorerApi(descriptor.invalidAsset ? null : 'asset/' + descriptor.toString(), {
        processResult(stats) {
            if (stats.error) {
                if (stats.status === 404) {
                    stats.invalidAsset = true
                }
                return stats
            }
            const currentPrice = getPrice(new Date()),
                xlmdynamic = stats.price7d || []
            delete stats.price7d

            return Object.assign({}, stats, {
                descriptor,
                supply: stats.supply,
                payments_amount: denominate(stats.payments_amount),
                traded_amount: denominate(stats.traded_amount),
                volume: denominate(stats.volume) * currentPrice,
                volume7d: denominate(stats.volume7d),
                price: descriptor.isNative ? null : stats.price * getPrice(new Date()),
                xlm_price_dynamic: xlmdynamic,
                price_dynamic: adjustAssetPrices(xlmdynamic),
                volatility: 0,
                stddev: 0
            })
        }
    })
}

export function adjustAssetPrices(priceChangesHistory = []) {
    return priceChangesHistory.map(([ts, price]) => [ts * 1000, price * getPrice(ts * 1000)])
}

/**
 *
 * @param {AssetDescriptor} asset
 * @return {ExplorerApiResult}
 */
export function useAssetHistory(asset) {
    if (asset.descriptor) {
        asset = asset.descriptor
    }
    return useExplorerApi(asset.invalidAsset ? null : `asset/${asset.toString()}/stats-history`, {
        processResult(history) {
            if (history.error) {
                if (history.status === 404) {
                    history.invalidAsset = true
                }
                return history
            }
            const techIndicatorsMeasurementPeriod = new Date() - 90 * 24 * 60 * 60 * 1000,
                techIndicatorsOhlcData = []
            history = history.map(d => {
                d.ts *= 1000
                const {price} = d
                if (price) {
                    const usdxlm = getPrice(d.ts)
                    for (let i = 0; i < price.length; i++) {
                        price[i] *= usdxlm
                    }
                    if (d.ts >= techIndicatorsMeasurementPeriod) {
                        techIndicatorsOhlcData.push(price)
                    }
                    //TODO: volume can be also optimized by pushing it to the price array
                    d.volume = denominate(d.volume) * usdxlm
                }
                return d
            })

            const res = {history}

            if (techIndicatorsOhlcData.length) {
                const avgPrice = res.avgPrice = calculateAveragePrice(techIndicatorsOhlcData)
                if (avgPrice > 0) {
                    res.volatility = calculateVolatility(techIndicatorsOhlcData) / avgPrice
                    res.stddev = calculateStandardDeviation(techIndicatorsOhlcData) / avgPrice
                }
            }
            return res
        }
    })
}

/**
 * load asset issuer account properties
 * @param {AssetDescriptor} descriptor
 */
export function useAssetIssuerInfo(descriptor) {
    const [issuerInfo, setIssuerInfo] = useDependantState(() => {
        if (!descriptor?.issuer) return null
        loadAccount(descriptor.issuer)
            .then(account => account && setIssuerInfo(account))
            .catch(e => {
                console.error(e)
                setIssuerInfo(null)
                console.warn(`Failed to load information for account ${descriptor.issuer} from Horizon.`)
            })
        return undefined
    }, [descriptor?.issuer?.toString()])
    return issuerInfo
}

function denominate(value) {
    if (typeof value !== 'number') return value
    return value / 10000000
}

export function useAssetOverallStats() {
    return useExplorerApi('asset-stats/overall')
}

import {
    useDependantState,
    useExplorerApi,
    loadAccount,
    useAssetMeta,
    ExplorerApiResult
} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {fromStroops} from '@stellar-expert/formatter'

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
    const meta = useAssetMeta(descriptor)
    const res = useExplorerApi(descriptor.invalidAsset ? null : 'asset/' + descriptor.toString())
    if (res.loaded) {
        const stats = res.data
        if (stats.error) {
            if (stats.status === 404) {
                stats.invalidAsset = true
            }
            return res
        }
        return new ExplorerApiResult(res.apiEndpoint, {
            ...stats,
            descriptor,
            meta,
            supply: stats.supply,
            payments_amount: fromStroops(stats.payments_amount, meta?.decimals ?? 7),
            traded_amount: fromStroops(stats.traded_amount, meta?.decimals ?? 7),
            volume: fromStroops(stats.volume),
            volume7d: fromStroops(stats.volume7d),
            price: stats.price,
            price_dynamic: (stats.price7d || []).map(([ts, price]) => [ts * 1000, price]),
            isContract: asset.startsWith('C') && asset.length === 56
        }, res.fetchedAt)
    }
    return res
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

            return {
                history: history.map(d => {
                    d.ts *= 1000
                    return d
                })
            }
        }
    })
}

/**
 * load asset issuer account properties
 * @param {AssetDescriptor} descriptor
 */
export function useAssetIssuerInfo(descriptor) {
    const [issuerInfo, setIssuerInfo] = useDependantState(() => {
        if (!descriptor?.issuer)
            return null
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

export function useAssetOverallStats() {
    return useExplorerApi('asset-stats/overall')
}

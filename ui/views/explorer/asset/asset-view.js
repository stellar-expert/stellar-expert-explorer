import React, {useCallback, useEffect} from 'react'
import {getDirectoryEntry, useAssetMeta, setPageMetadata} from '@stellar-expert/ui-framework'
import {formatPrice, formatWithAutoPrecision, formatWithPrecision, fromStroops} from '@stellar-expert/formatter'
import {useRouteMatch} from 'react-router'
import {useAssetInfo, useAssetIssuerInfo} from '../../../business-logic/api/asset-api'
import {previewUrlCreator} from '../../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../../util/prepareMetadata'
import checkPageReadiness from '../../../util/page-readiness'
import ErrorNotificationBlock from '../../components/error-notification-block'
import TomlInfo from '../toml/toml-info-view'
import AssetDetailsView from './asset-details-view'
import AssetHistoryTabsView from './asset-history-tabs-view'

function prepareAssetInfoList(asset) {
    const infoList = [
        {name: 'Total supply', value: formatWithAutoPrecision(fromStroops(asset.supply))},
        {name: 'Holders', value: `${formatWithPrecision(asset.trustlines.funded)} / ${formatWithPrecision(asset.trustlines.total)}`},
        {name: 'Payments', value: formatWithPrecision(asset.payments || 0, 0)},
        {name: 'Trades', value: formatWithPrecision(asset.trades || 0, 0)}
    ]
    if (asset.price_dynamic.length) {
        const currentPrice = asset.price_dynamic.at(-1)[1]
        const prevPrice = asset.price_dynamic.at(-2)[1]
        const changedPrice = 100 * (currentPrice - prevPrice) / prevPrice
        const changedPricePercentage = formatPrice(Math.abs(changedPrice), 2) + '%'
        infoList.push({
            name: 'Current price',
            value: formatPrice(Math.abs(currentPrice), 2),
            change: changedPricePercentage,
            priceDown: changedPrice < 0
        })
    }
    if (asset.rating) {
        infoList.push({name: 'Rating', value: (asset.rating.average || 0).toFixed(1)})
    }
    return infoList
}

export default function AssetView() {
    const {params} = useRouteMatch()
    const {data: asset, loaded} = useAssetInfo(params.asset)
    const assetMeta = useAssetMeta(asset?.descriptor)
    const issuerInfo = useAssetIssuerInfo(asset?.descriptor)
    const {code, issuer} = asset?.descriptor || {}

    const updatePageMetadata = useCallback(async () => {
        if (!asset || !assetMeta)
            return null
        const title = !issuer ? 'Stellar Lumens' : `${code} by ${issuer}`
        const metadata = {
            title,
            description: `Stats, price history, and analytic reports for ${title}.`
        }
        if (issuer) {
            await getDirectoryEntry(issuer)
                .then(data => {
                    if (data)
                        metadata.title = `${code} by [${data.name}]${issuer}`
                })
        }
        await previewUrlCreator(prepareMetadata({
            asset: {...asset, ...assetMeta},
            infoList: prepareAssetInfoList(asset)
        }))
            .then(previewUrl => metadata.image = previewUrl)

        setPageMetadata(metadata)
        checkPageReadiness(metadata)
    }, [asset, assetMeta])

    useEffect(updatePageMetadata, [asset, assetMeta])

    if (!loaded) return <div className="loader"/>
    if (issuerInfo) {
        asset.issuerInfo = issuerInfo
    }

    if (asset.invalidAsset) {
        //handle meta
        return <ErrorNotificationBlock>
            The asset does not exist on the ledger.
        </ErrorNotificationBlock>
    }
    if (asset.error) {
        //handle meta
        return <ErrorNotificationBlock>
            Failed to fetch asset info.
        </ErrorNotificationBlock>
    }

    return <>
        <AssetDetailsView asset={asset}/>
        {!!issuerInfo?.home_domain &&
            <TomlInfo homeDomain={issuerInfo.home_domain} assetMeta={assetMeta} account={issuer} className="space"/>}
        <AssetHistoryTabsView asset={asset}/>
    </>
}
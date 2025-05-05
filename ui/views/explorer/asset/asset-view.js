import React, {useEffect, useState} from 'react'
import {getDirectoryEntry, useAssetMeta, usePageMetadata} from '@stellar-expert/ui-framework'
import {useRouteMatch} from 'react-router'
import {useAssetInfo, useAssetIssuerInfo} from '../../../business-logic/api/asset-api'
import ErrorNotificationBlock from '../../components/error-notification-block'
import CrawlerScreen from '../../components/crawler-screen'
import TomlInfo from '../toml/toml-info-view'
import AssetDetailsView from './asset-details-view'
import AssetHistoryTabsView from './asset-history-tabs-view'

export default function AssetView() {
    const {params} = useRouteMatch()
    const {data: asset, loaded} = useAssetInfo(params.asset)
    const [pageMeta, setPageMeta] = useState()
    const assetMeta = useAssetMeta(asset?.descriptor)
    const issuerInfo = useAssetIssuerInfo(asset?.descriptor)
    useEffect(() => {
        if (loaded && asset) {
            const {issuer} = asset.descriptor
            getDirectoryEntry(issuer)
                .then(data => {
                    if (data) {
                        setPageMeta(data)
                    }
                })
        }
        setPageMeta(undefined)
    }, [loaded, asset?.descriptor?.issuer])
    //TODO: fetch TOML metadata instead
    const {code, issuer} = asset?.descriptor || {}
    const title = !issuer ? 'XLM Stellar Lumens' : `${code} by ${pageMeta?.domain || pageMeta?.name || issuer}`
    usePageMetadata({
        title: 'Asset ' + title,
        description: `Stats, price history, and analytic reports for ${title}.`
    })
    if (!loaded)
        return <div className="loader"/>
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
        <CrawlerScreen><AssetHistoryTabsView asset={asset}/></CrawlerScreen>
    </>
}
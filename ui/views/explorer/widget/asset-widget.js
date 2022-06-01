import React from 'react'
import {useRouteMatch} from 'react-router'
import ErrorNotificationBlock from '../../components/error-notification-block'
import AssetHeader from '../asset/asset-header-view'
import AssetSummaryView from '../asset/asset-summary-view'
import AssetSupplyChartView from '../asset/charts/asset-supply-chart-view'
import AssetPriceChartView from '../asset/charts/asset-price-chart-view'
import {useAssetInfo, useAssetIssuerInfo} from '../../../business-logic/api/asset-api'
import Widget from './widget'

export default function AssetWidget() {
    const {params} = useRouteMatch(),
        {data, loaded} = useAssetInfo(params.id),
        issuerInfo = useAssetIssuerInfo(data?.descriptor)

    if (!loaded) return null
    if (issuerInfo) {
        data.issuerInfo = issuerInfo
    }
    if (data.invalidAsset) return <ErrorNotificationBlock>
        The asset does not exist on the ledger.
    </ErrorNotificationBlock>

    switch (params.snippet) {
        case 'summary':
            return <Widget>
                <AssetHeader asset={data} subtitle="Summary"/>
                <hr className="space"/>
                <AssetSummaryView asset={data}/>
            </Widget>
        case 'supply':
            return <Widget center>
                <AssetHeader asset={data} subtitle="Supply and Accounts"/>
                <hr className="space"/>
                <AssetSupplyChartView asset={data} noTitle/>
            </Widget>
        case 'price':
            return <Widget center>
                <AssetHeader asset={data} subtitle="Price History"/>
                <hr className="space"/>
                <AssetPriceChartView asset={data} noTitle/>
            </Widget>
    }
    return <ErrorNotificationBlock>Invalid widget request</ErrorNotificationBlock>
}
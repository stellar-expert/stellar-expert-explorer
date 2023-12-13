import React, {useEffect, useState} from 'react'
import {Dropdown, AssetSelector} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {navigation} from '@stellar-expert/navigation'
import Chart, {Highcharts} from '../../../components/chart/chart'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'
import {useAccountBalanceHistory} from '../../../../business-logic/api/account-api'

const timeframe = 24 * 60 * 60 * 1000

function getChartData(balanceHistory, selectedAsset) {
    const {length} = balanceHistory
    const now = new Date().getTime() / 1000 | 0
    let dataLength = length + 1
    let extend = false
    if (balanceHistory[0][0] + timeframe < now) {
        extend = true
        dataLength++
    }
    const data = new Array(dataLength)
    let maxBalance = 0
    for (let i = 0; i < length; i++) {
        const entry = balanceHistory[i]
        const val = entry[1] / 10000000
        if (val > maxBalance) {
            maxBalance = val
        }
        data[length - i] = [entry[0] * 1000, val]
    }
    const startTs = data[1][0] - timeframe
    //init with 0
    data[0] = [startTs, 0]
    //extend with current balance if needed
    if (extend) {
        const last = data[data.length - 2]
        data[data.length - 1] = [now, last[1]]
    }

    //res.yAxis[0].max = 1.2 * max
    const currency = AssetDescriptor.parse(selectedAsset).toCurrency()
    return {
        type: 'line',
        name: currency,
        color: Highcharts.getOptions().colors[0],
        data,
        max: 1.1 * maxBalance
    }
}

function pointFormatter() {
    return `<b>${formatWithAutoPrecision(this.y)} ${this.series.name}</b><br/>`
}

export default Chart.withErrorBoundary(function AccountBalanceChartView({account, noTitle, externallySelectedAsset}) {
    const [selectedAsset, setSelectedAsset] = useState(navigation.query.asset || externallySelectedAsset || 'XLM')
    const [scale, setScale] = useState(navigation.query.scale || 'linear')
    const {data: balanceHistory, loaded} = useAccountBalanceHistory(account.address, selectedAsset)

    useEffect(() => {
        if (externallySelectedAsset) {
            setSelectedAsset(externallySelectedAsset)
        }
    }, [externallySelectedAsset])

    if (!loaded)
        return <Chart.Loader container=""/>
    if (!balanceHistory?.length)
        return <Chart.Loader unavailable container=""/>
    const options = {
        tooltip: {
            pointFormatter
        },
        plotOptions: {
            series: {
                step: 'left'
            }
        },
        yAxis: [{
            type: scale,
            title: {
                text: 'Balance'
            },
            floor: 0
        }],
        series: [getChartData(balanceHistory, selectedAsset)]
    }


    const query = `?asset=${selectedAsset}&scale=${scale}`
    return <Chart type="StockChart" options={options} grouped range noLegend container="" title={
        !noTitle && <>
            Balance History
            <EmbedWidgetTrigger path={`account/balance-chart/${account.address}${query}`} title="Account Balance History"/>
        </>
    }>
        {!noTitle && <div className="flex-row">
            <div>
                Asset: <AssetSelector value={selectedAsset} predefinedAssets={account.assets} restricted onChange={setSelectedAsset}/>
            </div>
            <div>
                Scale: <Dropdown value={scale} options={['linear', 'logarithmic']} onChange={setScale}/>&emsp;
            </div>
        </div>}
        {!!noTitle && <div>Asset: {AssetDescriptor.parse(selectedAsset).toCurrency()}</div>}
    </Chart>
})
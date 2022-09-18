import React, {useEffect, useState} from 'react'
import {AssetLink, Dropdown} from '@stellar-expert/ui-framework'
import {AssetDescriptor, parseAssetFromObject} from '@stellar-expert/asset-descriptor'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {navigation} from '@stellar-expert/navigation'
import Chart, {Highcharts} from '../../../components/chart-view'
import EmbedWidgetTrigger from '../../widget/embed-widget-trigger'
import {useAccountStatsHistory} from '../../../../business-logic/api/account-api'

const timeframe = 24 * 60 * 60

function getAllAssets(balanceHistory) {
    const assets = new Set(['XLM'])
    for (const dataPoint of balanceHistory) {
        for (const assetBalance of dataPoint.balances) {
            assets.add(assetBalance.asset)
        }
    }
    return Array.from(assets).map(asset => ({
        title: <AssetLink link={false} asset={AssetDescriptor.parse(asset)}/>,
        value: asset
    }))
}

function syncBalancesWithHorizon(balanceHistory, {ledgerData, deleted}) {
    const now = new Date().getTime() / 1000 | 0
    let lastValue = balanceHistory[balanceHistory.length - 1]
    if (!lastValue) return
    //less than statsTimeframe - update directly
    if (lastValue.ts + timeframe > now) {
        if (ledgerData) {
            lastValue.balances = ledgerData.balances.map(record => ({
                asset: parseAssetFromObject(record).toFQAN(),
                balance: record.balance.replace('.', '')
            }))
        } else if (deleted) {
            //extend with zero balances
            for (const record of lastValue.balances) {
                record.balance = '0'
            }
        }
    } else {
        if (ledgerData) {
            lastValue = {
                ts: lastValue.ts + timeframe,
                balances: ledgerData.balances.map(record => ({
                    asset: parseAssetFromObject(record).toFQAN(),
                    balance: record.balance.replace('.', '')
                }))
            }
        } else if (deleted) {
            //extend with zero balances
            lastValue = {
                ts: lastValue.ts + timeframe,
                balances: lastValue.balances.map(({asset}) => ({asset, balance: '0'}))
            }
        }
        //extend balances chart to the current date
        balanceHistory.push(lastValue)
        balanceHistory.push({ts: now, balances: lastValue.balances})
    }
}

function getChartData(balanceHistory, selectedAsset) {
    const line = []
    let maxBalance = 0
    let prevBalances = []
    for (const {ts, balances} of balanceHistory) {
        for (const {balance, asset} of balances) {
            const pb = prevBalances.findIndex(b => b.asset === asset)
            if (pb >= 0) {
                prevBalances.splice(pb, 1)
            }
            if (asset === selectedAsset) {
                const resBalance = balance / 10000000
                line.push([ts, resBalance])
                if (resBalance > maxBalance) {
                    maxBalance = resBalance
                }
            }
        }
        //process trustlines with zero balance
        for (const {asset} of prevBalances) {
            if (asset === selectedAsset) {
                line.push([ts, 0])
            }
        }
        prevBalances = [...balances]
    }

    if (line.length) {
        const startTs = line[0][0] - timeframe
        //init with 0
        line.unshift([startTs, 0])
        /*//extend with current balance
        const now = new Date().getTime() / 1000 | 0
        const last = line[line.length - 1]
        if (last[0] + timeframe < new Date().getTime()) {
            line.push([new Date().getTime(), last[1]])
        }*/
    }

    //res.yAxis[0].max = 1.2 * max
    const currency = AssetDescriptor.parse(selectedAsset).toCurrency()
    return {
        series: {
            type: 'line',
            name: currency,
            color: Highcharts.getOptions().colors[0],
            data: line.map(([ts, value]) => [ts * 1000, value])
        },
        max: 1.1 * maxBalance
    }
}

function pointFormatter() {
    return `<b>${formatWithAutoPrecision(this.y)} ${this.series.name}</b><br/>`
}

export default function AccountBalanceChartView({account, noTitle, externallySelectedAsset}) {
    const [selectedAsset, setSelectedAsset] = useState(navigation.query.asset || externallySelectedAsset || 'XLM')
    const [scale, setScale] = useState(navigation.query.scale || 'linear')
    const {data: balanceHistory, loaded} = useAccountStatsHistory(account.address)

    useEffect(() => {
        if (externallySelectedAsset) {
            setSelectedAsset(externallySelectedAsset)
        }
    }, [externallySelectedAsset])

    if (!loaded || !balanceHistory?.length) return null
    syncBalancesWithHorizon(balanceHistory, account)
    const {series} = getChartData(balanceHistory, selectedAsset)
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
        series: [series]
    }


    const query = `?asset=${selectedAsset}&scale=${scale}`
    return <Chart type="StockChart" options={options} grouped range noLegend title={
        !noTitle && <>
            Balance History
            <EmbedWidgetTrigger path={`account/balance-chart/${account.address}${query}`} title="Account Balance History"/>
        </>
    }>
        {!noTitle && <div className="flex-row">
            <div>
                Asset: <Dropdown value={selectedAsset} options={getAllAssets(balanceHistory)} onChange={setSelectedAsset}/>
            </div>
            <div>
                Scale: <Dropdown value={scale} options={['linear', 'logarithmic']} onChange={setScale}/>&emsp;
            </div>
        </div>}
        {!!noTitle && <div>Asset: {AssetDescriptor.parse(selectedAsset).toCurrency()}</div>}
    </Chart>
}
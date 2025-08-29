import React from 'react'
import Chart from '../../../components/chart/chart'
import {useLedgerStats} from '../../../../business-logic/api/ledger-stats-api'

export default Chart.withErrorBoundary(function LedgerHistoryOperationsDistributionChartView() {
    const {data = [], loaded} = useLedgerStats()
    if (!loaded)
        return <Chart.Loader/>
    if (!(data instanceof Array))
        return <Chart.Loader unavailable/>

    //init series data
    const opsData = [
        {name: 'CreateAccount'}, //0
        {name: 'Payment'}, //1
        {name: 'PathPaymentStrictReceive'}, //2
        {name: 'ManageSellOffer'}, //3
        {name: 'CreatePassiveSellOffer'}, //4
        {name: 'SetOptions'}, //5
        {name: 'ChangeTrust'}, //6
        {name: 'AllowTrust'}, //7
        {name: 'AccountMerge'}, //8
        {name: 'Inflation'}, //9
        {name: 'ManageData'}, //10
        {name: 'BumpSequence'}, //11
        {name: 'ManageBuyOffer'}, //12
        {name: 'PathPaymentStrictSend'}, //13
        {name: 'CreateClaimableBalance'}, //14
        {name: 'ClaimClaimableBalance'}, //15
        {name: 'BeginSponsoringFutureReserves'}, //16
        {name: 'EndSponsoring FutureReserves'}, //17
        {name: 'RevokeSponsorship'}, //18
        {name: 'Clawback'}, //19
        {name: 'ClawbackClaimableBalance'}, //20
        {name: 'SetTrustLineFlags'}, //21
        {name: 'LiquidityPoolDeposit'}, //22
        {name: 'LiquidityPoolWithdraw'} //23
    ]

    for (const series of opsData) {
        series.data = []
        series.type = 'area'
    }
    //retrieve data
    for (const {ts, operation_types} of data) {
        const dt = ts * 1000
        for (let i = 0; i <= 18; i++) {
            opsData[i].data.push([dt, operation_types[i] || 0])
        }
    }

    const options = {
        plotOptions: {
            area: {
                stacking: 'percent',
                fillColor: null,
                dataGrouping: {
                    approximation: 'sum'
                }
            }
        },
        series: opsData
    }

    return <Chart type="StockChart" title="Operations Distribution" options={options} grouped range/>
})
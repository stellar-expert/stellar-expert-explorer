import React, {useState, useEffect} from 'react'
import {AssetLink, useExplorerPaginatedApi} from '@stellar-expert/ui-framework'
import {formatPrice, formatWithAutoPrecision, formatWithPrecision, formatWithAbbreviation} from '@stellar-expert/formatter'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {navigation} from '@stellar-expert/navigation'
import appSettings from '../../../app-settings'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import {resolvePath} from '../../../business-logic/path'
import GridDataActionsView from '../../components/grid-data-actions'
import Dropdown from '../../components/dropdown'

const orderOptions = [
    {value: 'tvl', title: 'total value locked'},
    {value: 'volume1d', title: 'daily volume'},
    {value: 'volume7d', title: 'weekly volume'},
    {value: 'accounts', title: 'number of participants'},
    {value: 'trades', title: 'total trades'},
    {value: 'created', title: 'age'}
]

function LiquidityPoolsContentView({pools}) {
    const {data} = pools
    return <>
        <table className="table compact exportable active" data-export-prefix="markets">
            <thead>
            <tr>
                <th rowSpan={2}>Pool assets</th>
                <th className="text-center nowrap" rowSpan={2}>Value locked</th>
                <th className="text-center nowrap" rowSpan={2}>APY</th>
                <th className="text-center nowrap" colSpan={2}>Volume</th>
                <th className="text-center nowrap" colSpan={2}>Fees earned</th>
                <th className="text-right nowrap" rowSpan={2}>Trades</th>
                <th className="text-right nowrap" rowSpan={2}>Participants</th>
            </tr>
            <tr>
                <th className="text-center nowrap">24h</th>
                <th className="text-center nowrap">7d</th>
                <th className="text-center nowrap">24h</th>
                <th className="text-center nowrap">7d</th>
            </tr>
            </thead>
            <tbody className="condensed">
            {data.map(pool => {
                const assetA = AssetDescriptor.parse(pool.assets[0].asset),
                    assetB = AssetDescriptor.parse(pool.assets[1].asset),
                    apy = 100 * 52 * (pool.earned_value['7d'] / pool.total_value_locked || 0)

                return <tr key={pool.id}
                           onClick={() => navigation.navigate(resolvePath(`liquidity-pool/${pool.id}`))}>
                    <td data-header="Pool assets: ">
                        <div className="dual-layout">
                            <div>
                                <AssetLink asset={assetB} displayIssuer link={false} className="nowrap"/><br/>
                                <AssetLink asset={assetA} displayIssuer link={false} className="nowrap"/>
                            </div>
                            <div className="text-right">
                                {formatWithAbbreviation(pool.assets[1].amount / 10000000)}<br/>
                                {formatWithAbbreviation(pool.assets[0].amount / 10000000)}
                            </div>
                        </div>
                    </td>
                    <td className="nowrap text-center" data-header="Value locked (USD): ">
                        <UsdAmount value={pool.total_value_locked} abbreviation={false}/>
                    </td>
                    <td className="nowrap text-center" data-header="APY: ">
                        {formatPrice(apy, 2)}<span className="dimmed text-small">&thinsp;%</span>
                    </td>
                    <td className="nowrap text-center" data-header="Volume 24h: ">
                        <UsdAmount value={pool.volume_value['1d']}/>
                    </td>
                    <td className="nowrap text-center" data-header="Volume 7d: ">
                        <UsdAmount value={pool.volume_value['7d']}/>
                    </td>
                    <td className="nowrap text-center" data-header="Fees earned 24h: ">
                        <UsdAmount value={pool.earned_value['1d']}/>
                    </td>
                    <td className="nowrap text-center" data-header="Fees earned 7d: ">
                        <UsdAmount value={pool.earned_value['7d']}/>
                    </td>
                    <td className="nowrap text-right" data-header="Total trades: ">
                        {formatWithPrecision(pool.trades, 0)}
                    </td>
                    <td className="nowrap text-right" data-header="Participants: ">
                        {formatWithPrecision(pool.accounts, 0)}
                    </td>
                </tr>
            })}
            </tbody>
        </table>
        <div className="text-center">
            <GridDataActionsView model={pools}/>
        </div>
    </>
}

function UsdAmount({value, abbreviation}) {
    let adjustedValue = value / 10000000
    if (adjustedValue > 0 && adjustedValue < 0.1) {
        adjustedValue = '> 0.1'
    } else {
        if (abbreviation !== false) {
            adjustedValue = formatWithAbbreviation(adjustedValue)
        } else {
            adjustedValue = formatWithAutoPrecision(adjustedValue)
        }
    }
    return <>{adjustedValue}<span className="dimmed text-small">&thinsp;$</span></>
}

export default function AllLiquidityPoolsView() {
    const {asset} = navigation.query,
        defaultSort = orderOptions[0].value,
        [sort, setSort] = useState(navigation.query.sort || defaultSort)

    const pools = useExplorerPaginatedApi({path: 'liquidity-pool', query: {sort, asset}}, {
            autoReverseRecordsOrder: true,
            limit: 20,
            defaultSortOrder: 'desc',
            defaultQueryParams: {sort: defaultSort, order: 'desc'}
        }),
        {loaded, loading} = pools

    useEffect(() => {
        setPageMetadata({
            title: `Liquidity pools on Stellar ${appSettings.activeNetwork} network`,
            description: `Volumes, earned fees, and trading statistics on Stellar ${appSettings.activeNetwork} network.`
        })
    }, [appSettings.activeNetwork])

    function updateSort(sort = orderOptions[0].value) {
        setSort(sort)
        navigation.updateQuery({sort, cursor: undefined, order: 'desc'})
    }

    return <>
        <h2>Liquidity Pools {asset && <>for asset <AssetLink asset={asset}/></>}</h2>
        <div className="card card-blank">
            <div className="text-right">
                Sort by <Dropdown options={orderOptions} onChange={value => updateSort(value)} value={sort}/>
            </div>
            {loading && <div className="loader"/>}
            {loaded && <div className="micro-space">
                <LiquidityPoolsContentView pools={pools}/>
            </div>}
        </div>
    </>
}
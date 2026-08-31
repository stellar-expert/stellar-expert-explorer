import React from 'react'
import Chart from '../../components/chart/chart'

export default function ProtocolPoolDashboardView() {
    return <div>
        <h2>Aquarius statistics</h2>
        <div className="row">
            <div className="column column-50"><TvlChart/></div>
            <div className="column column-50"><VolumeChart/></div>
        </div>
        <div className="space"/>
    </div>
}

function TvlChart() {
    const options = {
        plotOptions: {
            area: {
                marker: {
                    enabled: false
                },
                dataGrouping: {
                    approximation: 'close'
                }
            }
        },
        yAxis: [{
            title: {
                text: 'Liquidity'
            },
            type: 'logarithmic'
        }],
        series: [{
            type: 'area',
            name: `Liquidity`,
            data: tvlData.map(d => [d.ts, d.liquidity]),
            tooltip: {
                valueSuffix: ' USD'
            }
        }]
    }
    return <Chart type="StockChart" title="Liquidity in All Pools" options={options} range="month" noLegend/>
}

function VolumeChart() {
    const options = {
        plotOptions: {
            column: {
                marker: {
                    enabled: false
                },
                dataGrouping: {
                    approximation: 'sum'
                }
            }
        },
        yAxis: [{
            title: {
                text: 'Volume'
            },
            min: 0
        }],
        series: [{
            type: 'column',
            name: `Trading volume`,
            data: tvlData.map(d => [d.ts, d.volume]),
            tooltip: {
                valueSuffix: ' USD'
            }
        }]
    }
    return <Chart type="StockChart" title="Protocol Trading Volumes" options={options} grouped range="month" noLegend/>
}

const tvlData = [
    {
        'ts': 1734825600000,
        'volume': 85245,
        'liquidity': 7089154
    },
    {
        'ts': 1734912000000,
        'volume': 124853,
        'liquidity': 7287034
    },
    {
        'ts': 1734998400000,
        'volume': 107182,
        'liquidity': 7707770
    },
    {
        'ts': 1735084800000,
        'volume': 95322,
        'liquidity': 7461541
    },
    {
        'ts': 1735171200000,
        'volume': 61347,
        'liquidity': 7055773
    },
    {
        'ts': 1735257600000,
        'volume': 75753,
        'liquidity': 6993916
    },
    {
        'ts': 1735344000000,
        'volume': 45091,
        'liquidity': 6833597
    },
    {
        'ts': 1735430400000,
        'volume': 44374,
        'liquidity': 6507926
    },
    {
        'ts': 1735516800000,
        'volume': 108301,
        'liquidity': 6437661
    },
    {
        'ts': 1735603200000,
        'volume': 58871,
        'liquidity': 6426504
    },
    {
        'ts': 1735689600000,
        'volume': 235164,
        'liquidity': 7651990
    },
    {
        'ts': 1735776000000,
        'volume': 119230,
        'liquidity': 7271963
    },
    {
        'ts': 1735862400000,
        'volume': 95396,
        'liquidity': 7420341
    },
    {
        'ts': 1735948800000,
        'volume': 184294,
        'liquidity': 7457820
    },
    {
        'ts': 1736035200000,
        'volume': 74509,
        'liquidity': 7408616
    },
    {
        'ts': 1736121600000,
        'volume': 130101,
        'liquidity': 6632477
    },
    {
        'ts': 1736208000000,
        'volume': 276684,
        'liquidity': 6549892
    },
    {
        'ts': 1736294400000,
        'volume': 302509,
        'liquidity': 6662534
    },
    {
        'ts': 1736380800000,
        'volume': 226198,
        'liquidity': 4546827
    },
    {
        'ts': 1736467200000,
        'volume': 159140,
        'liquidity': 4749894
    },
    {
        'ts': 1736553600000,
        'volume': 212064,
        'liquidity': 5150227
    },
    {
        'ts': 1736640000000,
        'volume': 75825,
        'liquidity': 5096968
    },
    {
        'ts': 1736726400000,
        'volume': 157997,
        'liquidity': 5068730
    },
    {
        'ts': 1736812800000,
        'volume': 84016,
        'liquidity': 7095653
    },
    {
        'ts': 1736899200000,
        'volume': 188601,
        'liquidity': 9344821
    },
    {
        'ts': 1736985600000,
        'volume': 378344,
        'liquidity': 11870369
    },
    {
        'ts': 1737072000000,
        'volume': 105779,
        'liquidity': 12033731
    },
    {
        'ts': 1737158400000,
        'volume': 205789,
        'liquidity': 11828727
    },
    {
        'ts': 1737244800000,
        'volume': 282787,
        'liquidity': 10976773
    },
    {
        'ts': 1737331200000,
        'volume': 284261,
        'liquidity': 7776771
    },
    {
        'ts': 1737417600000,
        'volume': 214972,
        'liquidity': 8355021
    },
    {
        'ts': 1737504000000,
        'volume': 363090,
        'liquidity': 8896140
    },
    {
        'ts': 1737590400000,
        'volume': 192831,
        'liquidity': 9259659
    },
    {
        'ts': 1737676800000,
        'volume': 174999,
        'liquidity': 9494494
    },
    {
        'ts': 1737763200000,
        'volume': 502800,
        'liquidity': 9673409
    },
    {
        'ts': 1737849600000,
        'volume': 192896,
        'liquidity': 9667870
    },
    {
        'ts': 1737936000000,
        'volume': 670626,
        'liquidity': 9654070
    },
    {
        'ts': 1738022400000,
        'volume': 237637,
        'liquidity': 9566066
    },
    {
        'ts': 1738108800000,
        'volume': 456123,
        'liquidity': 9578402
    },
    {
        'ts': 1738195200000,
        'volume': 476785,
        'liquidity': 10096726
    },
    {
        'ts': 1738281600000,
        'volume': 351581,
        'liquidity': 9945891
    },
    {
        'ts': 1738368000000,
        'volume': 320607,
        'liquidity': 9613091
    },
    {
        'ts': 1738454400000,
        'volume': 791347,
        'liquidity': 9002183
    },
    {
        'ts': 1738540800000,
        'volume': 2281513,
        'liquidity': 9418343
    },
    {
        'ts': 1738627200000,
        'volume': 699676,
        'liquidity': 9012442
    },
    {
        'ts': 1738713600000,
        'volume': 354902,
        'liquidity': 8908320
    },
    {
        'ts': 1738800000000,
        'volume': 421543,
        'liquidity': 8856944
    },
    {
        'ts': 1738886400000,
        'volume': 508074,
        'liquidity': 8868126
    },
    {
        'ts': 1738972800000,
        'volume': 311730,
        'liquidity': 9081176
    },
    {
        'ts': 1739059200000,
        'volume': 293825,
        'liquidity': 8823661
    },
    {
        'ts': 1739145600000,
        'volume': 299869,
        'liquidity': 8805644
    },
    {
        'ts': 1739232000000,
        'volume': 333601,
        'liquidity': 8888828
    },
    {
        'ts': 1739318400000,
        'volume': 481306,
        'liquidity': 9149276
    },
    {
        'ts': 1739404800000,
        'volume': 209078,
        'liquidity': 8923330
    },
    {
        'ts': 1739491200000,
        'volume': 423009,
        'liquidity': 9105899
    },
    {
        'ts': 1739577600000,
        'volume': 205829,
        'liquidity': 9237924
    },
    {
        'ts': 1739664000000,
        'volume': 155234,
        'liquidity': 9267836
    },
    {
        'ts': 1739750400000,
        'volume': 218885,
        'liquidity': 9211238
    },
    {
        'ts': 1739836800000,
        'volume': 172531,
        'liquidity': 9037332
    },
    {
        'ts': 1739923200000,
        'volume': 299887,
        'liquidity': 9318749
    },
    {
        'ts': 1740009600000,
        'volume': 162081,
        'liquidity': 9294529
    },
    {
        'ts': 1740096000000,
        'volume': 240527,
        'liquidity': 9116854
    },
    {
        'ts': 1740182400000,
        'volume': 190329,
        'liquidity': 9223101
    },
    {
        'ts': 1740268800000,
        'volume': 250121,
        'liquidity': 9300603
    },
    {
        'ts': 1740355200000,
        'volume': 559638,
        'liquidity': 9769578
    },
    {
        'ts': 1740441600000,
        'volume': 1440122,
        'liquidity': 9471573
    },
    {
        'ts': 1740528000000,
        'volume': 733710,
        'liquidity': 9473710
    },
    {
        'ts': 1740614400000,
        'volume': 394309,
        'liquidity': 9318814
    },
    {
        'ts': 1740700800000,
        'volume': 900785,
        'liquidity': 9341465
    },
    {
        'ts': 1740787200000,
        'volume': 625069,
        'liquidity': 9732164
    },
    {
        'ts': 1740873600000,
        'volume': 1432351,
        'liquidity': 10433182
    },
    {
        'ts': 1740960000000,
        'volume': 906926,
        'liquidity': 9498237
    },
    {
        'ts': 1741046400000,
        'volume': 1071499,
        'liquidity': 9548526
    },
    {
        'ts': 1741132800000,
        'volume': 473459,
        'liquidity': 9710384
    },
    {
        'ts': 1741219200000,
        'volume': 474350,
        'liquidity': 9571371
    },
    {
        'ts': 1741305600000,
        'volume': 577149,
        'liquidity': 9386076
    },
    {
        'ts': 1741392000000,
        'volume': 270302,
        'liquidity': 9356383
    },
    {
        'ts': 1741478400000,
        'volume': 446999,
        'liquidity': 8991262
    },
    {
        'ts': 1741564800000,
        'volume': 1035760,
        'liquidity': 8744308
    },
    {
        'ts': 1741651200000,
        'volume': 709433,
        'liquidity': 8917197
    },
    {
        'ts': 1741737600000,
        'volume': 745766,
        'liquidity': 9014687
    },
    {
        'ts': 1741824000000,
        'volume': 841428,
        'liquidity': 9154319
    },
    {
        'ts': 1741910400000,
        'volume': 495470,
        'liquidity': 9246907
    },
    {
        'ts': 1741996800000,
        'volume': 223758,
        'liquidity': 9278338
    },
    {
        'ts': 1742083200000,
        'volume': 324844,
        'liquidity': 8912158
    },
    {
        'ts': 1742169600000,
        'volume': 292499,
        'liquidity': 9145922
    },
    {
        'ts': 1742256000000,
        'volume': 498857,
        'liquidity': 9198242
    },
    {
        'ts': 1742342400000,
        'volume': 513054,
        'liquidity': 9650434
    },
    {
        'ts': 1742428800000,
        'volume': 322867,
        'liquidity': 9479831
    },
    {
        'ts': 1742515200000,
        'volume': 22380,
        'liquidity': 9633882
    }
]
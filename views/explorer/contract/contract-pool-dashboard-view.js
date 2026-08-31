import React from 'react'
import {AccountAddress, AssetLink} from '@stellar-expert/ui-framework'
import Chart from '../../components/chart/chart'

export default function ContractPoolDashboardView() {
    return <div>
        <h2>Liquidity pool <AccountAddress account="CCY2PXGMKNQHO7WNYXEWX76L2C5BH3JUW3RCATGUYKY7QQTRILBZIFWV"/>{' '}
            (<AssetLink asset="XLM" issuer={false}/> / <AssetLink asset="AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA" issuer={false}/>)
        </h2>
        <div className="row">
            <div className="column column-33">
                <TvlChart/>
            </div>
            <div className="column column-33">
                <VolumeChart/>
            </div>
            <div className="column column-33">
                <AccountsChart/>
            </div>
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
            data: tvlData.map(d => [d.ts, d.tvl]),
            tooltip: {
                valueSuffix: ' USD'
            }
        }]
    }
    return <Chart type="StockChart" title="Locked Liquidity" options={options} range="month" noLegend/>
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
    return <Chart type="StockChart" title="Trading Volumes" options={options} grouped range="month" noLegend/>
}

function AccountsChart() {
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
                text: 'Unique Accounts'
            }
        }],
        series: [{
            type: 'line',
            name: `Unique Accounts`,
            data: accountsData.map(d => [new Date(d[0]).getTime(), d[1]])
        }]
    }
    return <Chart type="StockChart" title="Active Accounts" options={options} grouped range="month" noLegend/>
}


const accountsData = [
    ['2025-03-12 00:00Z', 329],
    ['2025-03-13 00:00Z', 341],
    ['2025-03-14 00:00Z', 376],
    ['2025-03-15 00:00Z', 282],
    ['2025-03-16 00:00Z', 266],
    ['2025-03-17 00:00Z', 248],
    ['2025-03-18 00:00Z', 245],
    ['2025-03-19 00:00Z', 312],
    ['2025-03-20 00:00Z', 297],
    ['2025-03-21 00:00Z', 123]
]

const tvlData =
    [
        {
            'ts': 1741795200000,
            'volume': 4639,
            'tvl': 1550737
        },
        {
            'ts': 1741798800000,
            'volume': 1774,
            'tvl': 1575418
        },
        {
            'ts': 1741802400000,
            'volume': 451,
            'tvl': 1563641
        },
        {
            'ts': 1741806000000,
            'volume': 1573,
            'tvl': 1564882
        },
        {
            'ts': 1741809600000,
            'volume': 299,
            'tvl': 1572803
        },
        {
            'ts': 1741813200000,
            'volume': 4401,
            'tvl': 1571966
        },
        {
            'ts': 1741816800000,
            'volume': 19387,
            'tvl': 1567410
        },
        {
            'ts': 1741820400000,
            'volume': 603,
            'tvl': 1570396
        },
        {
            'ts': 1741824000000,
            'volume': 143,
            'tvl': 1579392
        },
        {
            'ts': 1741827600000,
            'volume': 1470,
            'tvl': 1574881
        },
        {
            'ts': 1741831200000,
            'volume': 385,
            'tvl': 1574105
        },
        {
            'ts': 1741834800000,
            'volume': 634,
            'tvl': 1592083
        },
        {
            'ts': 1741838400000,
            'volume': 2524,
            'tvl': 1615948
        },
        {
            'ts': 1741842000000,
            'volume': 971,
            'tvl': 1606613
        },
        {
            'ts': 1741845600000,
            'volume': 444,
            'tvl': 1588499
        },
        {
            'ts': 1741849200000,
            'volume': 217,
            'tvl': 1596180
        },
        {
            'ts': 1741852800000,
            'volume': 31,
            'tvl': 1600895
        },
        {
            'ts': 1741856400000,
            'volume': 4522,
            'tvl': 1591756
        },
        {
            'ts': 1741860000000,
            'volume': 7494,
            'tvl': 1646474
        },
        {
            'ts': 1741863600000,
            'volume': 17769,
            'tvl': 1656958
        },
        {
            'ts': 1741867200000,
            'volume': 2353,
            'tvl': 1668007
        },
        {
            'ts': 1741870800000,
            'volume': 6354,
            'tvl': 1709398
        },
        {
            'ts': 1741874400000,
            'volume': 904,
            'tvl': 1699157
        },
        {
            'ts': 1741878000000,
            'volume': 5299,
            'tvl': 1670294
        },
        {
            'ts': 1741881600000,
            'volume': 935,
            'tvl': 1649256
        },
        {
            'ts': 1741885200000,
            'volume': 1283,
            'tvl': 1625976
        },
        {
            'ts': 1741888800000,
            'volume': 537,
            'tvl': 1608345
        },
        {
            'ts': 1741892400000,
            'volume': 250,
            'tvl': 1603184
        },
        {
            'ts': 1741896000000,
            'volume': 1068,
            'tvl': 1603462
        },
        {
            'ts': 1741899600000,
            'volume': 77,
            'tvl': 1582660
        },
        {
            'ts': 1741903200000,
            'volume': 2067,
            'tvl': 1599924
        },
        {
            'ts': 1741906800000,
            'volume': 1615,
            'tvl': 1625379
        },
        {
            'ts': 1741910400000,
            'volume': 137,
            'tvl': 1612278
        },
        {
            'ts': 1741914000000,
            'volume': 140,
            'tvl': 1613099
        },
        {
            'ts': 1741917600000,
            'volume': 41,
            'tvl': 1623981
        },
        {
            'ts': 1741921200000,
            'volume': 0,
            'tvl': 1628678
        },
        {
            'ts': 1741924800000,
            'volume': 189,
            'tvl': 1627931
        },
        {
            'ts': 1741928400000,
            'volume': 243,
            'tvl': 1624543
        },
        {
            'ts': 1741932000000,
            'volume': 104,
            'tvl': 1624993
        },
        {
            'ts': 1741935600000,
            'volume': 171,
            'tvl': 1612495
        },
        {
            'ts': 1741939200000,
            'volume': 741,
            'tvl': 1617516
        },
        {
            'ts': 1741942800000,
            'volume': 1998,
            'tvl': 1643645
        },
        {
            'ts': 1741946400000,
            'volume': 236,
            'tvl': 1645316
        },
        {
            'ts': 1741950000000,
            'volume': 792,
            'tvl': 1643621
        },
        {
            'ts': 1741953600000,
            'volume': 1707,
            'tvl': 1635456
        },
        {
            'ts': 1741957200000,
            'volume': 1794,
            'tvl': 1632711
        },
        {
            'ts': 1741960800000,
            'volume': 972,
            'tvl': 1624178
        },
        {
            'ts': 1741964400000,
            'volume': 2400,
            'tvl': 1655522
        },
        {
            'ts': 1741968000000,
            'volume': 1634,
            'tvl': 1639662
        },
        {
            'ts': 1741971600000,
            'volume': 1777,
            'tvl': 1642467
        },
        {
            'ts': 1741975200000,
            'volume': 1780,
            'tvl': 1640631
        },
        {
            'ts': 1741978800000,
            'volume': 907,
            'tvl': 1635098
        },
        {
            'ts': 1741982400000,
            'volume': 641,
            'tvl': 1626392
        },
        {
            'ts': 1741986000000,
            'volume': 176,
            'tvl': 1627429
        },
        {
            'ts': 1741989600000,
            'volume': 3959,
            'tvl': 1624317
        },
        {
            'ts': 1741993200000,
            'volume': 1104,
            'tvl': 1636246
        },
        {
            'ts': 1741996800000,
            'volume': 1723,
            'tvl': 1635830
        },
        {
            'ts': 1742000400000,
            'volume': 610,
            'tvl': 1656680
        },
        {
            'ts': 1742004000000,
            'volume': 0,
            'tvl': 1644018
        },
        {
            'ts': 1742007600000,
            'volume': 176,
            'tvl': 1641017
        },
        {
            'ts': 1742011200000,
            'volume': 2027,
            'tvl': 1645917
        },
        {
            'ts': 1742014800000,
            'volume': 285,
            'tvl': 1663405
        },
        {
            'ts': 1742018400000,
            'volume': 955,
            'tvl': 1641854
        },
        {
            'ts': 1742022000000,
            'volume': 707,
            'tvl': 1626215
        },
        {
            'ts': 1742025600000,
            'volume': 5,
            'tvl': 1617574
        },
        {
            'ts': 1742029200000,
            'volume': 58,
            'tvl': 1622720
        },
        {
            'ts': 1742032800000,
            'volume': 706,
            'tvl': 1620391
        },
        {
            'ts': 1742036400000,
            'volume': 206,
            'tvl': 1617331
        },
        {
            'ts': 1742040000000,
            'volume': 23,
            'tvl': 1624119
        },
        {
            'ts': 1742043600000,
            'volume': 1091,
            'tvl': 1637575
        },
        {
            'ts': 1742047200000,
            'volume': 1162,
            'tvl': 1641493
        },
        {
            'ts': 1742050800000,
            'volume': 26,
            'tvl': 1638821
        },
        {
            'ts': 1742054400000,
            'volume': 234,
            'tvl': 1631167
        },
        {
            'ts': 1742058000000,
            'volume': 140,
            'tvl': 1630101
        },
        {
            'ts': 1742061600000,
            'volume': 159,
            'tvl': 1630527
        },
        {
            'ts': 1742065200000,
            'volume': 469,
            'tvl': 1622553
        },
        {
            'ts': 1742068800000,
            'volume': 693,
            'tvl': 1623981
        },
        {
            'ts': 1742072400000,
            'volume': 38,
            'tvl': 1634930
        },
        {
            'ts': 1742076000000,
            'volume': 97,
            'tvl': 1645035
        },
        {
            'ts': 1742079600000,
            'volume': 201,
            'tvl': 1636463
        },
        {
            'ts': 1742083200000,
            'volume': 1830,
            'tvl': 1623579
        },
        {
            'ts': 1742086800000,
            'volume': 536,
            'tvl': 1627227
        },
        {
            'ts': 1742090400000,
            'volume': 8061,
            'tvl': 1620229
        },
        {
            'ts': 1742094000000,
            'volume': 1412,
            'tvl': 1617560
        },
        {
            'ts': 1742097600000,
            'volume': 1902,
            'tvl': 1619296
        },
        {
            'ts': 1742101200000,
            'volume': 103,
            'tvl': 1619067
        },
        {
            'ts': 1742104800000,
            'volume': 54,
            'tvl': 1619627
        },
        {
            'ts': 1742108400000,
            'volume': 491,
            'tvl': 1616554
        },
        {
            'ts': 1742112000000,
            'volume': 159,
            'tvl': 1613418
        },
        {
            'ts': 1742115600000,
            'volume': 922,
            'tvl': 1607824
        },
        {
            'ts': 1742119200000,
            'volume': 802,
            'tvl': 1594787
        },
        {
            'ts': 1742122800000,
            'volume': 1718,
            'tvl': 1592748
        },
        {
            'ts': 1742126400000,
            'volume': 114,
            'tvl': 1571656
        },
        {
            'ts': 1742130000000,
            'volume': 2157,
            'tvl': 1576125
        },
        {
            'ts': 1742133600000,
            'volume': 708,
            'tvl': 1555979
        },
        {
            'ts': 1742137200000,
            'volume': 404,
            'tvl': 1571214
        },
        {
            'ts': 1742140800000,
            'volume': 1526,
            'tvl': 1573631
        },
        {
            'ts': 1742144400000,
            'volume': 774,
            'tvl': 1587229
        },
        {
            'ts': 1742148000000,
            'volume': 112,
            'tvl': 1582664
        },
        {
            'ts': 1742151600000,
            'volume': 194,
            'tvl': 1585501
        },
        {
            'ts': 1742155200000,
            'volume': 146,
            'tvl': 1580542
        },
        {
            'ts': 1742158800000,
            'volume': 4897,
            'tvl': 1573866
        },
        {
            'ts': 1742162400000,
            'volume': 1344,
            'tvl': 1573516
        },
        {
            'ts': 1742166000000,
            'volume': 479,
            'tvl': 1556242
        },
        {
            'ts': 1742169600000,
            'volume': 514,
            'tvl': 1560655
        },
        {
            'ts': 1742173200000,
            'volume': 1149,
            'tvl': 1584852
        },
        {
            'ts': 1742176800000,
            'volume': 900,
            'tvl': 1595110
        },
        {
            'ts': 1742180400000,
            'volume': 157,
            'tvl': 1601479
        },
        {
            'ts': 1742184000000,
            'volume': 455,
            'tvl': 1603251
        },
        {
            'ts': 1742191200000,
            'volume': 0,
            'tvl': 1599668
        },
        {
            'ts': 1742194800000,
            'volume': 1156,
            'tvl': 1604289
        },
        {
            'ts': 1742198400000,
            'volume': 143,
            'tvl': 1607475
        },
        {
            'ts': 1742202000000,
            'volume': 1106,
            'tvl': 1605135
        },
        {
            'ts': 1742209200000,
            'volume': 852,
            'tvl': 1593887
        },
        {
            'ts': 1742212800000,
            'volume': 5780,
            'tvl': 1607818
        },
        {
            'ts': 1742216400000,
            'volume': 109,
            'tvl': 1594159
        },
        {
            'ts': 1742220000000,
            'volume': 8334,
            'tvl': 1601240
        },
        {
            'ts': 1742223600000,
            'volume': 47,
            'tvl': 1604290
        },
        {
            'ts': 1742227200000,
            'volume': 2939,
            'tvl': 1622948
        },
        {
            'ts': 1742230800000,
            'volume': 2705,
            'tvl': 1612717
        },
        {
            'ts': 1742234400000,
            'volume': 3237,
            'tvl': 1615637
        },
        {
            'ts': 1742238000000,
            'volume': 138,
            'tvl': 1633062
        },
        {
            'ts': 1742241600000,
            'volume': 328,
            'tvl': 1610231
        },
        {
            'ts': 1742245200000,
            'volume': 636,
            'tvl': 1613413
        },
        {
            'ts': 1742248800000,
            'volume': 1267,
            'tvl': 1608288
        },
        {
            'ts': 1742252400000,
            'volume': 769,
            'tvl': 1608707
        },
        {
            'ts': 1742256000000,
            'volume': 566,
            'tvl': 1608324
        },
        {
            'ts': 1742259600000,
            'volume': 1667,
            'tvl': 1595849
        },
        {
            'ts': 1742263200000,
            'volume': 1041,
            'tvl': 1574769
        },
        {
            'ts': 1742266800000,
            'volume': 531,
            'tvl': 1584075
        },
        {
            'ts': 1742270400000,
            'volume': 64,
            'tvl': 1575741
        },
        {
            'ts': 1742274000000,
            'volume': 325,
            'tvl': 1573511
        },
        {
            'ts': 1742277600000,
            'volume': 294,
            'tvl': 1584063
        },
        {
            'ts': 1742281200000,
            'volume': 0,
            'tvl': 1584480
        },
        {
            'ts': 1742284800000,
            'volume': 1533,
            'tvl': 1590544
        },
        {
            'ts': 1742288400000,
            'volume': 2248,
            'tvl': 1594344
        },
        {
            'ts': 1742292000000,
            'volume': 247,
            'tvl': 1600129
        },
        {
            'ts': 1742295600000,
            'volume': 67,
            'tvl': 1587606
        },
        {
            'ts': 1742299200000,
            'volume': 322,
            'tvl': 1583927
        },
        {
            'ts': 1742302800000,
            'volume': 1520,
            'tvl': 1582743
        },
        {
            'ts': 1742306400000,
            'volume': 7462,
            'tvl': 1548911
        },
        {
            'ts': 1742310000000,
            'volume': 153,
            'tvl': 1564305
        },
        {
            'ts': 1742313600000,
            'volume': 5280,
            'tvl': 1563398
        },
        {
            'ts': 1742317200000,
            'volume': 610,
            'tvl': 1562711
        },
        {
            'ts': 1742320800000,
            'volume': 33,
            'tvl': 1558830
        },
        {
            'ts': 1742324400000,
            'volume': 213,
            'tvl': 1569432
        },
        {
            'ts': 1742328000000,
            'volume': 161,
            'tvl': 1579294
        },
        {
            'ts': 1742331600000,
            'volume': 519,
            'tvl': 1577904
        },
        {
            'ts': 1742335200000,
            'volume': 3040,
            'tvl': 1578101
        },
        {
            'ts': 1742338800000,
            'volume': 658,
            'tvl': 1595581
        },
        {
            'ts': 1742342400000,
            'volume': 1403,
            'tvl': 1602212
        },
        {
            'ts': 1742346000000,
            'volume': 120,
            'tvl': 1627992
        },
        {
            'ts': 1742349600000,
            'volume': 1545,
            'tvl': 1604753
        },
        {
            'ts': 1742353200000,
            'volume': 341,
            'tvl': 1623018
        },
        {
            'ts': 1742356800000,
            'volume': 31,
            'tvl': 1626357
        },
        {
            'ts': 1742360400000,
            'volume': 153,
            'tvl': 1623508
        },
        {
            'ts': 1742364000000,
            'volume': 955,
            'tvl': 1631313
        },
        {
            'ts': 1742367600000,
            'volume': 441,
            'tvl': 1622543
        },
        {
            'ts': 1742371200000,
            'volume': 881,
            'tvl': 1620725
        },
        {
            'ts': 1742374800000,
            'volume': 0,
            'tvl': 1616769
        },
        {
            'ts': 1742378400000,
            'volume': 1007,
            'tvl': 1617970
        },
        {
            'ts': 1742382000000,
            'volume': 4047,
            'tvl': 1631445
        },
        {
            'ts': 1742385600000,
            'volume': 321,
            'tvl': 1663436
        },
        {
            'ts': 1742389200000,
            'volume': 6994,
            'tvl': 1650656
        },
        {
            'ts': 1742392800000,
            'volume': 3278,
            'tvl': 1714595
        },
        {
            'ts': 1742396400000,
            'volume': 732,
            'tvl': 1694467
        },
        {
            'ts': 1742400000000,
            'volume': 1726,
            'tvl': 1691531
        },
        {
            'ts': 1742403600000,
            'volume': 2785,
            'tvl': 1684386
        },
        {
            'ts': 1742407200000,
            'volume': 946,
            'tvl': 1663157
        },
        {
            'ts': 1742410800000,
            'volume': 329,
            'tvl': 1690981
        },
        {
            'ts': 1742414400000,
            'volume': 3231,
            'tvl': 1689216
        },
        {
            'ts': 1742418000000,
            'volume': 988,
            'tvl': 1660497
        },
        {
            'ts': 1742421600000,
            'volume': 818,
            'tvl': 1660665
        },
        {
            'ts': 1742425200000,
            'volume': 3376,
            'tvl': 1661054
        },
        {
            'ts': 1742428800000,
            'volume': 1135,
            'tvl': 1694003
        },
        {
            'ts': 1742432400000,
            'volume': 0,
            'tvl': 1667239
        },
        {
            'ts': 1742436000000,
            'volume': 23087,
            'tvl': 1664677
        },
        {
            'ts': 1742439600000,
            'volume': 425,
            'tvl': 1664887
        },
        {
            'ts': 1742443200000,
            'volume': 545,
            'tvl': 1666509
        },
        {
            'ts': 1742446800000,
            'volume': 7,
            'tvl': 1659894
        },
        {
            'ts': 1742450400000,
            'volume': 83,
            'tvl': 1659945
        },
        {
            'ts': 1742454000000,
            'volume': 177,
            'tvl': 1664208
        },
        {
            'ts': 1742457600000,
            'volume': 658,
            'tvl': 1655059
        },
        {
            'ts': 1742461200000,
            'volume': 10799,
            'tvl': 1681916
        },
        {
            'ts': 1742464800000,
            'volume': 620,
            'tvl': 1684453
        },
        {
            'ts': 1742468400000,
            'volume': 1192,
            'tvl': 1669757
        },
        {
            'ts': 1742472000000,
            'volume': 1849,
            'tvl': 1669494
        },
        {
            'ts': 1742475600000,
            'volume': 89,
            'tvl': 1665045
        },
        {
            'ts': 1742479200000,
            'volume': 649,
            'tvl': 1679908
        },
        {
            'ts': 1742482800000,
            'volume': 3032,
            'tvl': 1680764
        },
        {
            'ts': 1742486400000,
            'volume': 2758,
            'tvl': 1651852
        },
        {
            'ts': 1742490000000,
            'volume': 1938,
            'tvl': 1634940
        },
        {
            'ts': 1742493600000,
            'volume': 438,
            'tvl': 1637013
        },
        {
            'ts': 1742497200000,
            'volume': 156,
            'tvl': 1646777
        },
        {
            'ts': 1742500800000,
            'volume': 263,
            'tvl': 1652532
        },
        {
            'ts': 1742504400000,
            'volume': 1264,
            'tvl': 1654074
        },
        {
            'ts': 1742508000000,
            'volume': 470,
            'tvl': 1648411
        },
        {
            'ts': 1742511600000,
            'volume': 3180,
            'tvl': 1632514
        },
        {
            'ts': 1742515200000,
            'volume': 798,
            'tvl': 1649176
        },
        {
            'ts': 1742518800000,
            'volume': 1180,
            'tvl': 1649006
        }
    ]

import React, {useEffect, useState} from 'react'
import {setPageMetadata} from '@stellar-expert/ui-framework'
import {previewUrlCreator} from '../../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../../util/prepareMetadata'
import checkPageReadiness from '../../../util/page-readiness'
import AssetsChart from '../ledger/charts/ledger-history-assets-trustlines-chart-view'
import AssetsOverallStatsView from './asset-overall-stats-view'
import AssetList from './asset-list-view'

export default function AssetsDashboard() {
    const [metaInfoList, setMetaInfoList] = useState([])
    const [metadata, setMetadata] = useState({
        title: 'Assets and smart contract tokens on Stellar Network',
        description: 'Comprehensive analytics, key technical parameters, trading volume, and price dynamics for all Stellar assets, anchors, ICOs, utility tokens.'
    })
    setPageMetadata(metadata)
    checkPageReadiness(metadata)

    useEffect(() => {
        if (!metaInfoList)
            return
        previewUrlCreator(prepareMetadata({title: 'Assets and smart contract tokens', infoList: metaInfoList}))
            .then(previewUrl => setMetadata(prev => ({...prev, facebookImage: previewUrl})))
    }, [metaInfoList])
    return <>
        <h2>All Assets on Stellar Ledger</h2>
        <div className="row">
            <div className="column column-40">
                <div className="segment blank">
                    <h3>Summary</h3>
                    <hr className="flare"/>
                    <AssetsOverallStatsView updateMeta={setMetaInfoList}/>
                </div>
            </div>
            <div className="column column-60">
                <AssetsChart/>
            </div>
        </div>
        <div className="segment blank space">
            <div className="double-space"></div>
            <AssetList/>
        </div>
    </>
}
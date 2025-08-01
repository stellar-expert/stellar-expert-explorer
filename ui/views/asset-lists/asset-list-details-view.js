import React, {useEffect, useState} from 'react'
import {BlockSelect, CopyToClipboard, usePageMetadata} from '@stellar-expert/ui-framework'
import {fetchAssetList} from '@stellar-asset-lists/sdk'
import AssetListAssetsView from './asset-list-assets-view'

export default function AssetListDetailsView({list}) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [assetList, setAssetList] = useState(null)
    useEffect(() => {
        setIsLoaded(false)
        fetchAssetList(list)
            .then(setAssetList)
            .catch(e => console.error(e))
            .finally(() => setIsLoaded(true))
    }, [list])

    usePageMetadata({
        title: assetList?.name,
        description: assetList?.description
    })

    if (!isLoaded)
        return <div className="loader"/>

    if (!assetList)
        return <div className="segment warning space">
            <div className="text-center">
                <i className="icon-warning-circle"/> Failed to fetch asset list
                <div className="micro-space text-tiny">
                    <BlockSelect>{list}</BlockSelect>
                </div>
            </div>
        </div>

    return <>
        <div className="text-small">
            <div>
                <span className="dimmed">Provider: </span>
                <span>
                <a href={assetList.feedback} target="_blank" rel="noreferrer">{assetList.provider}</a>,
                version {assetList.version}
            </span>
            </div>
            <div>
                <span className="dimmed">Description: </span>
                <span className="text-justify">{assetList.description}</span>
            </div>
            <div>
                <span className="dimmed">List&nbsp;URL: </span>
                <span className="text-monospace">
                <BlockSelect inline wrap>{list}</BlockSelect>
                <CopyToClipboard text={list}/>
            </span>
            </div>
        </div>
        <AssetListAssetsView assetList={assetList}/>
    </>
}
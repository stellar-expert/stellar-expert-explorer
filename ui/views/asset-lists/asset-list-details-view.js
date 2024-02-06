import React, {useEffect, useState} from 'react'
import {BlockSelect, CopyToClipboard, InfoTooltip as Info} from '@stellar-expert/ui-framework'
import {fetchAssetList} from '@stellar-asset-lists/sdk'
import {setPageMetadata} from '../../util/meta-tags-generator'
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

    setPageMetadata({
        title: assetList?.name,
        description: assetList?.description
    })

    if (!isLoaded)
        return <div className="loader"/>

    if (!assetList)
        return <div className="segment warning">
            <div className="text-center">
                <i className="icon-warning-circle"/> Failed to fetch asset list
                <div className="micro-space text-tiny">
                    <BlockSelect>{list}</BlockSelect>
                </div>
            </div>
        </div>

    return <>
        <dl className="text-small">
            <div>
                <dt>Provider:</dt>
                <dd>
                    <a href={assetList.feedback} target="_blank" rel="noreferrer">{assetList.provider}</a>,
                    version {assetList.version}
                </dd>
            </div>
            <div>
                <dt>Description:</dt>
                <dd className="text-justify">{assetList.description}</dd>
            </div>
            <div>
                <dt>List URL:</dt>
                <dd>
                    <code><BlockSelect>{list}</BlockSelect></code>
                    <CopyToClipboard text={list}/>
                </dd>
            </div>
        </dl>
        <AssetListAssetsView assetList={assetList}/>
    </>
}
import React, {useState} from 'react'
import {useParams} from 'react-router'
import {useDependantState, CopyToClipboard, InfoTooltip as Info, AssetLink} from '@stellar-expert/ui-framework'
import {fetchAssetsList} from 'assets-list-sdk'
import {setPageMetadata} from '../../util/meta-tags-generator'
import NotFoundView from '../pages/not-found-page-view'
import StellarAssetListView from './stellar-asset-list-view'

const tokenListUrl = 'https://hawthorne-abendsen.github.io/test-json-data/'

export default function TokenListDetailsView() {
    const {name} = useParams()
    const [isLoaded, setIsLoaded] = useState(false)
    const [tokenList, setTokenList] = useDependantState(() => {
        fetchAssetsList(tokenListUrl + name + '.json')
            .then(list => setTokenList(list))
            .catch(e => console.error(e))
            .finally(() => setIsLoaded(true))
        return null
    }, [name])

    setPageMetadata({
        title: tokenList?.name,
        description: tokenList?.description
    })

    if (!isLoaded)
        return <div className="loader"/>

    if (!tokenList)
        return <NotFoundView/>

    return <>
        <h2>{tokenList?.name}</h2>
        <div className="row">
            <div className="column column-25">
                <div className="segment blank">
                    <h3>Details</h3>
                    <hr className="flare"/>
                    <dl>
                        <div>
                            <dt>Description:</dt>
                            <dd>{tokenList.description}</dd>
                        </div>
                        <div>
                            <dt>Provider:</dt>
                            <dd>
                                <a href={tokenList.feedback} target="_blank" rel="noreferrer">{tokenList.provider}</a>
                                <CopyToClipboard text={tokenList.feedback}/>
                            </dd>
                        </div>
                        <div>
                            <dt>Version:</dt>
                            <dd>{tokenList.version}</dd>
                        </div>
                    </dl>
                </div>
            </div>
            <div className="column column-75">
                <StellarAssetListView tokenList={tokenList}/>
            </div>
        </div>
    </>
}
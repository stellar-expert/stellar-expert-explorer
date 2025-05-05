import React, {useCallback, useEffect, useState} from 'react'
import {Accordion, CodeBlock, usePageMetadata} from '@stellar-expert/ui-framework'
import {fetchAvailableAssetLists} from '@stellar-asset-lists/sdk'
import AssetListDetailsView from './asset-list-details-view'
import './asset-lists.scss'

function showList(e) {
    const {name, list} = e.currentTarget.dataset
    alert(<AssetListDetailsView list={list}/>,{title: name})
}

const sep42Link = 'https://github.com/stellar/stellar-protocol/pull/1409'

export default function AssetListCatalogueView() {
    const [catalogue, setCatalogue] = useState()
    const [search, setSearch] = useState('')
    const filteredLists = catalogue?.filter(list => list.name.toLowerCase().includes(search.toLowerCase()))

    useEffect(() => {
        fetchAvailableAssetLists()
            .then(catalogue => setCatalogue(catalogue))
            .catch(e => console.error(e))
    }, [])
    usePageMetadata({
        title: 'Catalogue of Stellar asset lists',
        description: 'Community-managed catalogue of SEP-42 Stellar asset lists provided by ecosystem organizations.'
    })

    const updateSearch = useCallback(e => {
        setSearch(e.target.value)
    }, [])

    return <div>
        <h2>Community-managed catalogue of Stellar asset lists</h2>
        <div className="row">
            <div className="column column-40">
                <div className="segment blank" style={{paddingLeft: '2.4em', minHeight: '75vh'}}>
                    <Accordion collapsedSymbol="»" expandedSymbol="»" options={[
                        {
                            key: 'standard',
                            title: <h3>Stellar asset list standard</h3>,
                            content:
                                <div>
                                    <hr className="flare" style={{marginTop: 0}}/>
                                    <p>
                                        SAL is a specification for lists of asset metadata that can be used by any Stellar applications and
                                        services which rely on externally curated asset catalogs published by trusted providers.
                                        This standard aims to enhance user experiences and trust by standardizing
                                        a mechanism for defining, validating, and sharing curated lists of Stellar assets,
                                        while ensuring ease of integration for wallets and applications across the Stellar network.
                                    </p>
                                    <p>
                                        Any organization can create, maintain, and publish an asset list following the guidelines outlined
                                        in the {''}
                                        <a href={sep42Link}>SEP-42 standard</a>.
                                        Inclusion of any particular asset in a list should not be considered as endorsement or
                                        recommendation.
                                    </p>
                                    <p>
                                        This catalogue of asset lists is maintained by Stellar community developers.
                                    </p>
                                </div>
                        },
                        {
                            key: 'usage',
                            title: <h3>Use it in your application</h3>,
                            content:
                                <div>
                                    <hr className="flare" style={{marginTop: 0}}/>
                                    <p>
                                        The easiest way to utilize asset lists in your web app is a{' '}
                                        <a href="https://github.com/stellar-asset-lists/sdk"><code>@stellar-asset-lists/sdk</code></a>{' '}
                                        NPM package.
                                    </p>
                                    <p>
                                        1. Fetch asset lists from the community-managed catalogue:
                                        <CodeBlock lang="js">const catalogue = await fetchAvailableAssetLists()</CodeBlock>
                                    </p>
                                    <p>
                                        2. Show available lists fetched from the catalogue to your users, so they could select one or more
                                        lists from providers they trust. Save selected lists in user settings.
                                    </p>
                                    <p>
                                        3. Load selected list on the client side and cache the result:
                                        <CodeBlock lang="js">const list = await
                                            fetchAssetList('list_url')</CodeBlock>
                                    </p>
                                    <p>
                                        4. Utilize a user-selected list to show only relevant assets in transfer/trade/swap interfaces.
                                        This helps to combat various fraudulent schemes while delegating all the power of decision-making
                                        to end-users in a truly decentralized manner.
                                    </p>
                                    <p>
                                        5. Profit! Safer, more streamlined UX.
                                    </p>
                                </div>
                        },
                        {
                            key: 'feedback',
                            title: <h3>Provide feedback</h3>,
                            content:
                                <div>
                                    <hr className="flare" style={{marginTop: 0}}/>
                                    <p>
                                        Have any thoughts how to improve the standard? Suggestions regarding a particular asset?
                                        Complaints about the asset list provider?
                                    </p>
                                    <p>
                                        Please leave your feedback <a href="https://github.com/stellar-asset-lists/index/issues">here</a>.
                                    </p>
                                </div>
                        },
                        {
                            key: 'create',
                            title: <h3>Create your own asset list</h3>,
                            content:
                                <div>
                                    <hr className="flare" style={{marginTop: 0}}/>
                                    <p>
                                        If you want to become an asset list provider, please check <a href={sep42Link}>SEP-42 standard</a>,
                                        prepare your list, make it publicly available, and create a{' '}
                                        <a href="https://github.com/stellar-asset-lists/index/issues">ticket</a>.
                                    </p>
                                </div>
                        }
                    ]}/>
                </div>
            </div>
            <div className="column column-60">
                <div className="segment blank">
                    {filteredLists?.length > 6 && <div className="text-center">
                        <input type="text" onChange={updateSearch} value={search} className="primary" style={{maxWidth: '36em'}}
                               placeholder="Search asset list by name"/>
                        <div className="micro-space"/>
                    </div>}
                    {filteredLists?.length ?
                        <div className="row">
                            {filteredLists.map(list => {
                                return <div key={list.url} className="column">
                                    <a href="#" className="asset-list-block" data-list={list.url} data-name={list.name} onClick={showList}>
                                        <span className="list-logo">
                                            <img src={list.icon} alt={list.name}/>
                                        </span>
                                        <span className="info">
                                            <span className="name">{list.name}</span>
                                            <span className="desc text-tiny dimmed">{list.description}</span>
                                        </span>
                                    </a>
                                </div>
                            })}
                        </div> :
                        <p className="space text-center">(no token lists matching search criteria)</p>}
                </div>
            </div>
        </div>
    </div>
}
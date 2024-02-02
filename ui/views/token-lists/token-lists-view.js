import React, {useCallback, useEffect, useState} from 'react'
import {fetchAllAssetsLists} from 'assets-list-sdk'
import {setPageMetadata} from '../../util/meta-tags-generator'
import './token-lists.scss'

const tokenListsUrl = 'https://hawthorne-abendsen.github.io/test-json-data/index.json'

export default function TokenListsView() {
    const [tokenLists, setTokenLists] = useState()
    const [search, setSearch] = useState('')
    const filteredTokenList = tokenLists?.filter(list => list.name.toLowerCase().includes(search.toLowerCase()) )

    useEffect(() => {
        fetchAllAssetsLists(tokenListsUrl)
            .then(list => setTokenLists(list))
            .catch(e => console.error(e))
    }, [])

    const updateSearch = useCallback(e => {
        setSearch(e.target.value)
    }, [])

    setPageMetadata({
        title: 'Stellar token lists',
        description: 'Token lists is a our initiative to improve discoverability, reputation and trust in Stellar token lists in a manner that is inclusive, transparent, and decentralized.'
    })

    return <div>
        <h2>Stellar token lists</h2>
        <div className="row">
            <div className="column column-25">
                <div className="segment blank">
                    <h3>Stellar token list standard</h3>
                    <hr className="flare"/>
                    <div className="space">
                        This standard aims to enhance user experiences and trust by standardizing&nbsp;
                        a mechanism for defining, validating, and sharing curated lists of Stellar assets,&nbsp;
                        while ensuring ease of integration for wallets and applications across the Stellar network.
                    </div>
                    <div className="space"/>
                    <a href="#"><i className="icon-angle-double-right"/>Why token lists?</a>
                    <div className="micro-space"/>
                    <a href="#"><i className="icon-angle-double-right"/>Make your own</a>
                    <div className="micro-space"/>
                    <a href="#"><i className="icon-angle-double-right"/>Community</a>
                </div>
            </div>
            <div className="column column-75">
                <div className="segment blank">
                    {filteredTokenList?.length > 6 && <div className="text-center">
                        <input type="text" onChange={updateSearch} value={search}
                               className="primary" style={{maxWidth: '36em'}}
                               placeholder="Search token lists by name"/>
                        <div className="micro-space"/>
                    </div>}
                    {filteredTokenList?.length ?
                        <div className="row">
                            {filteredTokenList.map(list => {
                                const url = list.url.split('/').at(-1).replace('.json', '')
                                return <div key={list.url} className="column column-33">
                                    <a href={`/token-lists/${url}`} className="token-list-block">
                                        <span className="icon">
                                            <img src={list.icon} alt={list.name}/>
                                        </span>
                                        <span className="info">
                                            <span className="name">{list.name}</span>
                                            <span className="desc text-tiny">{list.desc}</span>
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
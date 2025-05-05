import React, {useState} from 'react'
import {navigation} from '@stellar-expert/navigation'
import {BlockSelect, useExplorerPaginatedApi, usePageMetadata} from '@stellar-expert/ui-framework'
import {useGithubOAuth} from '../../business-logic/oauth/oauth-hooks'
import GridDataActions from '../components/grid-data-actions'
import {isDirectoryAdmin} from './is-directory-admin'
import GithubLoginView from './github-login-view'

export default function DirectoryBlockedDomainsView() {
    const [githubUser, githubApiProvider] = useGithubOAuth()
    const [searchTerm, setSearchTerm] = useState(() => navigation.query.search || '')
    const [query, setQuery] = useState({search: searchTerm})
    const isAdmin = isDirectoryAdmin(githubUser)
    usePageMetadata({
        title: `Block-list of malicious domains`,
        description: `Community-maintained list of malicious domains related to Stellar ecosystem.`
    })

    const blocklist = useExplorerPaginatedApi({
        path: 'directory/blocked-domains',
        query
    }, {
        includeNetwork: false,
        ttl: 0,
        limit: 50,
        autoReverseRecordsOrder: true,
        defaultSortOrder: 'asc'
    })
    const {loaded, loading, data} = blocklist

    function runSearch(e) {
        e.preventDefault()
        setQuery({search: searchTerm})
    }

    return <>
        <h2>Directory | Domains BlockList</h2>
        <div className="text-right mobile-left" style={{marginTop: '-2.2em'}}>
            <GithubLoginView/>
        </div>
        <div className="segment blank directory">
            <p className="dimmed text-small">
                Community-maintained list of malicious domains related to Stellar ecosystem.
            </p>
            <div className="text-center double-space">
                <form onSubmit={runSearch}>
                    <input type="text" onChange={e => setSearchTerm(e.target.value)}
                           value={searchTerm} style={{maxWidth: '36em'}} className="primary"
                           placeholder="Search by domain"/>
                </form>
            </div>
            {loading && <div className="loader"/>}
            {loaded && <>
                <ul className="striped space exportable">
                    {data.map(entry => <li key={entry.domain} style={{padding: '0.4em 1em', lineHeight: 1.6, overflow: 'hidden'}}>
                        <span className="icon icon-warning dimmed"/> <BlockSelect inline>{entry.domain}</BlockSelect>
                    </li>)}
                </ul>
                <GridDataActions model={blocklist} allowExport={false}/>
            </>}
            <div className="double-space dimmed">
                <p>
                    You can report fraudulent domain <a href="/directory/blocked-domains/add">here</a>. The data from {' '}
                    <a href="/openapi.html#tag/Directory-API" target="_blank">Open Directory API</a> is publicly available
                    for developers and users, free of charge.
                </p>
            </div>
        </div>
    </>
}
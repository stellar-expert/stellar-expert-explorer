import React, {useState} from 'react'
import cn from 'classnames'
import {AccountAddress, useExplorerPaginatedApi, useDirectoryTags, usePageMetadata} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import {useGithubOAuth} from '../../business-logic/oauth/oauth-hooks'
import DirectoryTagsLineView from './directory-tags-line-view'
import GridDataActions from '../components/grid-data-actions'
import {isDirectoryAdmin} from './is-directory-admin'
import GithubLoginView from './github-login-view'
import './directory-tags.scss'

function DirectoryBlockTagsView({tags, filters, selectTag}) {
    const directoryTags = useDirectoryTags()
    if (!tags || !directoryTags.length) return null
    return <div className="row">
        {directoryTags.map(({name, description}) => <div key={name} className="column column-25">
            <a className={cn('tag-block', {active: filters.has(name)})} href={`#${name}`}
               onClick={e => {
                   e.preventDefault()
                   selectTag(name)
               }}>
                #{name}
                <span className="description">{description}</span>
            </a>
        </div>)}
    </div>
}

export default function DirectoryView() {
    const [githubUser, githubApiProvider] = useGithubOAuth()
    const isAdmin = isDirectoryAdmin(githubUser)
    const directoryTags = useDirectoryTags()
    const [searchTerm, setSearchTerm] = useState(() => navigation.query.search || '')
    const [{filters, search}, updateState] = useState(() => {
        return {
            filters: new Set(navigation.query.tag || []),
            search: ''
        }
    })

    usePageMetadata({
        title: `Directory of well-known Stellar Network accounts`,
        description: `Discover well-known Stellar accounts, filter data by account address, description, or tags.`
    })

    const queryParams = {
        tag: Array.from(filters),
        search
    }

    const directory = useExplorerPaginatedApi({
        path: 'directory',
        query: queryParams
    }, {
        includeNetwork: false,
        ttl: 0,
        autoReverseRecordsOrder: true,
        defaultSortOrder: 'asc'
    })
    const {loaded, loading, data} = directory

    function selectTag(tag, resetOtherTags = false) {
        const newFilters = new Set(filters)
        if (resetOtherTags) {
            newFilters.clear()
            newFilters.add(tag)
        } else {
            if (newFilters.has(tag)) {
                newFilters.delete(tag)
            } else {
                newFilters.add(tag)
            }
        }
        updateState({filters: newFilters, search: searchTerm})
    }

    function runSearch(e) {
        e.preventDefault()
        updateState({filters, search: searchTerm})
    }

    return <>
        <h2>Directory | Well-known Stellar Accounts</h2>
        <div className="text-right mobile-left" style={{marginTop: '-2.2em'}}>
            <GithubLoginView/>
        </div>
        <div className="segment blank directory">
            <p className="dimmed text-small">
                The list of well-known Stellar accounts curated by StellarExpert team.
            </p>
            <div className="text-center double-space">
                <form onSubmit={runSearch}>
                    <input type="text" onChange={e => setSearchTerm(e.target.value)}
                           value={searchTerm} style={{maxWidth: '36em'}} className="primary"
                           placeholder="Search accounts by domain, company name, or public key"/>
                </form>
                {directoryTags instanceof Array && <div>
                    <div className="dimmed text-small">
                        Filter by tag:
                    </div>
                    <DirectoryBlockTagsView tags={directoryTags.map(t => t.name)} filters={filters} selectTag={selectTag}/>
                </div>}
            </div>
            {loading && <div className="loader"/>}
            {(loaded && data.length > 0) ? <>
                <ul className="striped space">
                    {data.map(entry => <li key={entry.address}
                                           style={{padding: '1em', lineHeight: 1.6, overflow: 'hidden'}}>
                        <div>
                            <b>{entry.name}</b> <a href={'https://' + entry.domain} className="text-small">{entry.domain}</a>
                            &emsp;
                            <DirectoryTagsLineView tags={Array.from(entry.tags)} filters={filters} selectTag={selectTag}/>
                            {isAdmin && <>&emsp;
                                <a className="text-small" href={`/directory/${entry.address}/edit`} target="_blank">
                                    <i className="icon icon-exchange"/>Edit</a>
                            </>}
                        </div>
                        <AccountAddress account={entry.address} name={false} style={{marginRight: '1em'}} chars="all"/>
                    </li>)}
                </ul>
                <GridDataActions model={directory} allowExport={false}/>
            </> : <div className="dimmed text-center text-small double-space">(no accounts matching search criteria)</div>}
            <div className="double-space dimmed">
                <p>
                    You can request new address listing <a href="/directory/add">here</a>. The data from {' '}
                    <a href="/openapi.html#tag/Directory-API" target="_blank">Open Directory API</a> is publicly available
                    for developers and users, free of charge.
                    Please note: listing in the directory is not an endorsement, the maintainers do not verify legal
                    entities operating the listed accounts.
                </p>
            </div>
        </div>
    </>
}
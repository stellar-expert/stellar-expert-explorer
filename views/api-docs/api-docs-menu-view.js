import React, {useCallback, useEffect, useState} from 'react'
import {navigation, useLocation, useParams} from '@stellar-expert/ui-framework'
import cn from 'classnames'
import {introChapters, matchOperation, operationLink, sectionIcon} from './api-docs-catalog'
import ApiMethodBadge from './api-method-badge'

export default function ApiDocsMenuView({catalog, loaded, error, closeMenu}) {
    const {doc, operationId} = useParams()
    const [filter, setFilter] = useState('')
    const onFilterChange = useCallback(e => setFilter(e.target.value), [])
    const normalizedFilter = filter.trim().toLowerCase()
    const total = catalog?.operations.length || 0

    return <div className="api-docs-menu">
        <div className="api-docs-menu-scroll">
            {!normalizedFilter && <>
                <div className="api-docs-menu-caption">Getting started</div>
                <IntroChaptersView active={!doc} closeMenu={closeMenu}/>
            </>}
            <div className="api-docs-menu-caption dual-layout">
                <span>API reference</span>
                {!!total && <span>{total} endpoints</span>}
            </div>
            <div className="api-docs-filter">
                <i className="icon icon-search"/>
                <input type="search" placeholder="Filter endpoints" value={filter} onChange={onFilterChange} spellCheck={false}/>
            </div>
            {!loaded && <div className="loader"/>}
            {!!error && <div className="text-small dimmed">Failed to load the documentation index</div>}
            {catalog?.specs.map(spec => <SectionMenuView key={spec.slug} spec={spec} active={spec.slug === doc} operationId={operationId}
                                                         filter={normalizedFilter} closeMenu={closeMenu}/>)}
        </div>
    </div>
}

function IntroChaptersView({active, closeMenu}) {
    const {hash} = useLocation()
    const current = active ? (hash || '').replace('#', '') || introChapters[0].id : null
    return introChapters.map(({id, title, icon, href}) => {
        const link = href || (id === introChapters[0].id ? '/api-docs' : '/api-docs#' + id)
        return <a key={id} href={link} className={cn('api-docs-menu-item', {active: !href && current === id})}
                  onClick={href ? closeMenu : () => scrollToChapter(id, closeMenu)}>
            <i className={'icon ' + icon}/>
            <span className="api-docs-menu-item-title">{title}</span>
        </a>
    })
}

/**
 * Scroll the introduction page to the chapter, if it is already open (otherwise the link navigates to it)
 * @param {String} id - chapter id
 * @param {Function} closeMenu
 */
function scrollToChapter(id, closeMenu) {
    const chapter = document.getElementById(id)
    if (!chapter)
        return
    chapter.scrollIntoView({behavior: 'smooth'})
    //through the router history, so the location-dependent views (the active chapter) pick it up
    navigation.history.replace(id === introChapters[0].id ? '/api-docs' : '/api-docs#' + id)
    closeMenu()
}

function SectionMenuView({spec, active, operationId, filter, closeMenu}) {
    const [expanded, setExpanded] = useState(active)
    const toggle = useCallback(() => setExpanded(prev => !prev), [])

    useEffect(() => {
        if (active) {
            setExpanded(true)
        }
    }, [active])

    const operations = spec.operations.filter(operation => matchOperation(operation, filter))
    if (filter && !operations.length)
        return null
    //filtering reveals every matching endpoint
    const open = expanded || !!filter

    return <div className={cn('api-docs-menu-group', {open})}>
        <div className="api-docs-menu-group-header">
            <a href={`/api-docs/${spec.slug}`} className={cn('api-docs-menu-item', {active: active && !operationId})}
               onClick={closeMenu}>
                <i className={'icon ' + sectionIcon(spec.slug)}/>
                <span className="api-docs-menu-item-title">{spec.label}</span>
                <span className="api-docs-menu-count">{operations.length}</span>
            </a>
            {/*kept outside the link - the app-wide link interceptor would navigate before React handles the click*/}
            <span className={cn('api-docs-menu-chevron icon', open ? 'icon-angle-down' : 'icon-angle-right')}
                  role="button" title={open ? 'Collapse' : 'Expand'} onClick={toggle}/>
        </div>
        {open && <div className="api-docs-menu-operations">
            {operations.map(operation => <a key={operation.operationId} href={operationLink(spec, operation)} onClick={closeMenu}
                                            className={cn('api-docs-menu-operation', {active: active && operationId === operation.operationId})}>
                <ApiMethodBadge method={operation.method}/>
                <span>{operation.summary}</span>
            </a>)}
        </div>}
    </div>
}

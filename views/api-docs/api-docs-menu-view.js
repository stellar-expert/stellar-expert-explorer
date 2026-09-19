import React, {useCallback, useState, useEffect} from 'react'
import {useParams} from '@stellar-expert/ui-framework'
import cn from 'classnames'
import {resolveDoc} from './api-docs-loader'
import {useApiSpec} from './api-docs-hooks'

export default function ApiDocsMenuView({docs, menuVisible, closeMenu}) {
    const {doc, operationId} = useParams()
    const activeDoc = resolveDoc({docs}, doc)
    return <div className={cn('nav-menu-dropdown sidebar-menu', {active: menuVisible})}>
        <div className="toggle-group">
            <a href="/api-docs" className={cn({active: !doc})} onClick={closeMenu}>Introduction</a>
        </div>
        {docs.map(entry => <DocGroupView key={entry.slug} doc={entry} active={entry === activeDoc}
                                         operationId={operationId} closeMenu={closeMenu}/>)}
    </div>
}

function DocGroupView({doc, active, operationId, closeMenu}) {
    const [isOpen, setIsOpen] = useState(active)
    const toggleOpen = useCallback(() => setIsOpen(prev => !prev), [])
    //load the section spec only once the group gets expanded
    const {spec, loaded} = useApiSpec(isOpen ? doc.slug : null)

    useEffect(() => {
        if (active) {
            setIsOpen(true)
        }
    }, [active])

    return <div>
        <div className="toggle-group">
            <a href={`/api-docs/${doc.slug}`} className={cn({active})} onClick={closeMenu}>{doc.title}</a>
            <div className={cn('toggle-icon', {
                'icon-angle-right': !isOpen,
                'icon-angle-down': isOpen
            })} onClick={toggleOpen}/>
        </div>
        <div className={cn('dropdown', {active: isOpen})}>
            {!loaded && <div className="loader" style={{minHeight: '2rem'}}/>}
            {spec?.operations.map(operation => <div key={operation.operationId} onClick={closeMenu}>
                <a href={`/api-docs/${doc.slug}/${operation.operationId}`}
                   className={cn({active: active && operationId === operation.operationId})}>
                    <span className={cn('text-tiny badge', {success: operation.method === 'get'})}>{operation.method}</span>
                    {' '}{operation.summary}
                </a>
            </div>)}
        </div>
    </div>
}

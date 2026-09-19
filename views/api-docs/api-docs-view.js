import React, {useCallback, useState} from 'react'
import ApiDocsLayout from './api-docs-layout'
import ApiDocsMenuView from './api-docs-menu-view'
import {useApiDocsIndex} from './api-docs-hooks'
import './api-docs.scss'

export default function ApiDocsView({children}) {
    const {index, loaded, error} = useApiDocsIndex()
    const [menuVisible, setMenuVisible] = useState(false)
    const toggleMenu = useCallback(() => setMenuVisible(prev => !prev), [])
    const closeMenu = useCallback(() => setMenuVisible(false), [])

    const title = <h2 style={{margin: '0.2em', width: '20em'}}>
        &nbsp;/&nbsp;API Docs {!!index && <span className="dimmed text-small">({index.version})</span>}</h2>

    return <ApiDocsLayout title={title} toggleMenu={toggleMenu}>
        <div className="row">
            <div className="column column-20">
                <h2 className="desktop-only">&nbsp;&nbsp;API Docs</h2>
                {!loaded && <div className="loader"/>}
                {!!error && <div className="space text-small dimmed">Failed to load documentation index</div>}
                {!!index && <ApiDocsMenuView docs={index.docs} menuVisible={menuVisible} closeMenu={closeMenu}/>}
            </div>
            <div className="column column-80">
                {children}
            </div>
        </div>
    </ApiDocsLayout>
}

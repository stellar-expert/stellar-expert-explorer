import React, {useCallback, useEffect, useRef, useState} from 'react'
import {useLocation} from '@stellar-expert/ui-framework'
import cn from 'classnames'
import ApiDocsLayout from './api-docs-layout'
import ApiDocsMenuView from './api-docs-menu-view'
import {useApiCatalog} from './api-docs-hooks'
import './api-docs.scss'

export default function ApiDocsView({children}) {
    const {catalog, loaded, error} = useApiCatalog()
    const location = useLocation()
    const [menuVisible, setMenuVisible] = useState(false)
    const toggleMenu = useCallback(e => {
        e?.preventDefault()
        setMenuVisible(prev => !prev)
    }, [])
    const closeMenu = useCallback(() => setMenuVisible(false), [])
    const sidebarRef = useRef(null)

    useEffect(closeMenu, [location.pathname])
    useSidebarHeight(sidebarRef)

    return <ApiDocsLayout version={catalog?.version} toggleMenu={toggleMenu}>
        <div className="api-docs-grid">
            <aside ref={sidebarRef} className={cn('api-docs-sidebar', {active: menuVisible})}>
                <ApiDocsMenuView catalog={catalog} loaded={loaded} error={error} closeMenu={closeMenu}/>
            </aside>
            <div className="api-docs-main">
                {children}
            </div>
        </div>
    </ApiDocsLayout>
}

/**
 * Expose the sidebar height to the stylesheet, which uses it to let a menu taller than the window scroll with the page
 * @param {{current: HTMLElement}} ref - sidebar element ref
 */
function useSidebarHeight(ref) {
    useEffect(() => {
        const sidebar = ref.current
        if (!sidebar || typeof ResizeObserver === 'undefined')
            return
        //fires on the initial layout too, then on every expanded/collapsed section and filter change
        const observer = new ResizeObserver(() => sidebar.style.setProperty('--api-sidebar-height', sidebar.offsetHeight + 'px'))
        observer.observe(sidebar)
        return () => observer.disconnect()
    }, [ref])
}

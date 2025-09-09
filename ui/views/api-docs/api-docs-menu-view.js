import React, {useCallback, useState, useEffect} from 'react'
import {useLocation} from 'react-router'
import cn from 'classnames'

export default function ApiDocsMenuView({pathList, menuVisible, toggleMenu}) {
    return <div className={`nav-menu-dropdown sidebar-menu ${menuVisible && 'active'}`}>
        <h2 style={{paddingLeft:'2rem'}}>Reference</h2>
        <hr className="flare"/>
        {Object.entries(pathList).map(([tag, paths]) =>
            <PathGroupView key={tag} tag={tag} paths={paths} toggleMenu={toggleMenu}/>)}
    </div>
}

function PathGroupView({tag, paths, toggleMenu}) {
    const location = useLocation()
    const currentTag = location.pathname.split('/')[2]
    const currentPage = location.pathname.split('/').at(-1)
    const [isOpen, setIsOpen] = useState(currentTag === tag)
    const toggleOpen = useCallback(() => setIsOpen(prev => !prev), [])

    useEffect(() => {
        setIsOpen(currentTag === tag)
    }, [currentTag, tag])

    return <div>
        <div className="toggle-group">
            <a href={`/api-docs/${tag}`} className={cn({'active': currentTag === tag})}>{tag}</a>
            <div className={cn('toggle-icon', {
                'icon-angle-right': !isOpen,
                'icon-angle-down': isOpen
            })} onClick={toggleOpen}/>
        </div>
        <div className={cn('dropdown', {'active': isOpen})}>
            {paths.map(entry => {
                return Object.entries(entry.data).map(([method, data]) => {
                    const href = `/api-docs/${tag}/${method}/${data.operationId}`
                    const isPaid = !!data.cost
                    return <div key={data.operationId} onClick={toggleMenu}>
                        <a href={href} className={cn({'active': currentPage === data.operationId})}>
                            <span className={cn(`text-tiny badge`, {'success': method === 'get'})}>{method}</span>&nbsp;
                            {data.summary}&nbsp;
                            <sup className="badge text-tiny">{isPaid ? 'paid' : 'free'}</sup>
                        </a>
                    </div>
                })
            })}
        </div>
    </div>
}
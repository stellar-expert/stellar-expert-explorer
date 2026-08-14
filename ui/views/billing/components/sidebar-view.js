import React from 'react'
import cn from 'classnames'
import {useLocation, useRouteMatch} from '@stellar-expert/ui-framework'
import {useSession} from '../auth/auth-session'

/**
 * Dashboard navigation
 * @param {{link: String, title: String, icon: String}[]} list - sections to link, in menu order
 * @param {Boolean} [identity] - append the signed-in account under the menu. The admin dashboard acts on
 * other people's accounts, so showing whose session it is only makes sense on the user side
 * @return {JSX.Element}
 */
export default function SidebarView({list = [], identity = false}) {
    const location = useLocation()
    const {url} = useRouteMatch()
    const {email} = useSession()
    const base = url.replace(/\/$/, '')
    const activeLink = location.pathname.slice(base.length).replace(/^\//, '').split('/')[0] || list[0]?.link

    return <div className="sidebar">
        <div className="sidebar-wrapper">
            <nav className="billing-menu">
                <ul>
                    {list.map(({link, title, icon}) => {
                        const active = activeLink === link
                        return <li key={link}>
                            <a href={`${base}/${link}`} className={cn('billing-menu-item', {active})}
                               aria-current={active ? 'page' : undefined}>
                                {!!icon && <i className={cn('billing-menu-icon icon', icon)}/>}
                                <span className="billing-menu-title">{title}</span>
                            </a>
                        </li>
                    })}
                </ul>
            </nav>
            {identity && !!email ? <div className="billing-menu-identity">
                <div className="dimmed text-tiny">Signed in as</div>
                <div className="text-small word-break">{email}</div>
            </div> : null}
        </div>
    </div>
}
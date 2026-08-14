import React from 'react'
import {Dropdown, useLocation} from '@stellar-expert/ui-framework'
import {hasAdminRole, hasAuth0Session, logOutFromBilling} from '../../business-logic/billing/auth0-session-probe'
import {adminSections, userSections} from '../billing/navigation'
import './login-status.scss'

/**
 * Dashboard sections as dropdown entries
 * @param {{link: String, title: String, icon: String}[]} sections - dashboard sections, in menu order
 * @param {String} base - dashboard root the section links hang off
 * @return {{}[]}
 */
function buildMenu(sections, base) {
    return [
        ...sections.map(({link, title, icon}) => ({
            title: <><i className={'icon ' + icon}/> {title}</>,
            href: `${base}/${link}`
        })),
        {title: <><i className="icon icon-logout"/> Log out</>, value: 'logout'}
    ]
}

const menus = {
    user: {options: buildMenu(userSections, '/account'), home: '/account', title: 'Account'},
    admin: {options: buildMenu(adminSections, '/admin'), home: '/admin', title: 'Admin'}
}

function userAction(action) {
    if (action === 'logout')
        return logOutFromBilling()
}

export default function LoginStatus() {
    //re-probe on navigation so the widget picks up a session established on /login
    useLocation()
    if (!hasAuth0Session())
        return <>
            <span className="account-status desktop-only">
                <a href="/login" title="Log in to your account"><i className="icon icon-user-circle"/></a>
            </span>
            <span className="account-menu mobile-only">
                <a href="/login"><i className="icon icon-user-circle"/> Account</a>
            </span>
        </>
    const {options, home, title} = hasAdminRole() ? menus.admin : menus.user
    //the dropdown collapses to plain menu entries on mobile
    return <>
        <span className="account-status desktop-only" title={title}>
            <Dropdown onChange={userAction} style={{padding: 0}} options={options} showToggle={false}
                      title={<i className="icon icon-user-circle"/>}/>
        </span>
        <span className="account-menu mobile-only">
            <a href={home}><i className="icon icon-user-circle"/> {title}</a>&nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="#" onClick={logOutFromBilling}><i className="icon icon-logout"/> Log out</a>
        </span>
    </>
}
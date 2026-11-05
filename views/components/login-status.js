import React from 'react'
import {Dropdown, useLocation} from '@stellar-expert/ui-framework'
import {getEmail, getRoles, isSignedIn, signOut} from '../../business-logic/billing/billing-session'
import {adminSections, userSections} from '../billing/navigation'
import './login-status.scss'

/**
 * Dashboard sections as dropdown entries, then the API docs, and logging out set apart
 * @param {{link: String, title: String, icon: String}[]} sections - dashboard sections, in menu order
 * @param {String} base - dashboard root the section links hang off
 * @return {({}|String)[]}
 */
function buildMenu(sections, base) {
    return [
        ...sections.map(({link, title, icon}) => ({
            title: <><i className={'icon ' + icon}/> {title}</>,
            href: `${base}/${link}`
        })),
        {title: <><i className="icon icon-embed"/> API docs</>, href: '/api-docs'},
        //the dropdown draws a separator for this entry
        '-',
        {title: <><i className="icon icon-logout"/> Log out</>, value: 'logout'}
    ]
}

const menus = {
    user: {options: buildMenu(userSections, '/account'), home: '/account', title: 'Account'},
    admin: {options: buildMenu(adminSections, '/admin'), home: '/admin', title: 'Admin'}
}

function userAction(action) {
    if (action === 'logout')
        return signOut()
}

export default function LoginStatus() {
    //re-probe on navigation so the widget picks up a session established on /login
    useLocation()
    if (!isSignedIn())
        return <>
            <a href="/login" className="account-status desktop-only" title="Sign in" aria-label="Sign in">
                <i className="icon icon-user-circle"/>
            </a>
            <span className="account-menu mobile-only">
                <a href="/login"><i className="icon icon-user-circle"/> Sign in</a>
            </span>
        </>
    const {options, home, title} = getRoles().includes('admin') ? menus.admin : menus.user
    const email = getEmail()

    return <>
        <span className="account-status desktop-only" title={title}>
            <Dropdown onChange={userAction} style={{padding: 0}} options={options} showToggle={false}
                      header={email ? <div className="account-status-email dimmed text-small">{email}</div> : null}
                      title={<i className="icon icon-user-circle"/>}/>
        </span>
        <span className="account-menu mobile-only">
            <a href={home}><i className="icon icon-user-circle"/> {title}</a>&nbsp;&nbsp;|&nbsp;&nbsp;
            <a href="#" onClick={signOut}><i className="icon icon-logout"/> Log out</a>
        </span>
    </>
}
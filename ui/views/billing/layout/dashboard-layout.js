import React from 'react'
import cn from 'classnames'
import {SessionProvider} from '../auth/auth-session'
import {adminSections, userSections} from '../navigation'
import SidebarView from '../components/sidebar-view'
import AuthLayout from './auth-layout'

const sidebars = {
    user: userSections,
    admin: adminSections
}

/**
 * Sidebar + content shell shared by the user and admin dashboards.
 * @param {'user'|'admin'} role - both the access requirement and the sidebar to render
 * @param {*} children
 */
export default function DashboardLayout({role, children}) {
    if (role === 'admin') {
        //reaching the admin dashboard ends an impersonation session started from a user card
        localStorage.removeItem('loginAsToken')
    }
    return <SessionProvider>
        <AuthLayout role={role}>
            <div className={cn('billing-dashboard container dual-layout', {'billing-admin': role === 'admin'})}>
                <SidebarView list={sidebars[role]} identity={role === 'user'}/>
                <div className="content w-100">
                    {children}
                </div>
            </div>
        </AuthLayout>
    </SessionProvider>
}
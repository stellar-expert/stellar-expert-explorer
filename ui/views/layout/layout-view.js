import React from 'react'
import {withRouter} from 'react-router'
import {Dropdown, SystemDialog} from '@stellar-expert/ui-framework'
import Footer from './footer-view'
import CatcherView from './catcher-view'
import {resolvePath} from '../../business-logic/path'

/**
 * Layout component for pages that require authorization.
 * Redirects non-authorized users to login page preserving return path in ?ret
 * @param {ReactNode} children - Page contents
 * @param {Object} menu - Top menu
 */
export default withRouter(function Layout({children, menu}) {
    return <div className="page-wrapper">
        <div className="blue-ribbon"/>
        {menu}
        <div className="page-container">
            {location.pathname.includes('explorer/public') && <div className="container warning text-tiny" style={{padding:'1em'}}>
                <div>
                    <i className="icon-warning"/> <b>StellarExpert: Corrupted database state after Whisk incident</b>
                    <br/>
                    As a result of ledger state changes in the Stellar <a
                    href="https://stellar.org/blog/developers/addressing-state-archival-inconsistencies-protocol-upgrade-vote-next-week">protocol
                    24</a> rolled out on the Mainnet at 17:00 UTC
                    2025-10-22, our ingestion engine incorrectly processed ledger state updates. This resulted in the
                    corrupted database state for a number of ledger entries (accounts, trustlines, contracts).
                    Unfortunately, we didn't have time to test the Stellar Core upgrade given the emergency deployment
                    timeline.
                    <br/>
                    Our team assesses remediation options. Likely, the process of complete service recovery will take
                    several days. In the meantime, our services will be available, but the database state is
                    inconsistent. Some transactions may be missing, account may show incorrect balances,
                    DEX information might be incorrect. Until further notice do not use our data as an ultimate source
                    of truth, check with other blockchain explorers.
                </div>
            </div>}
            <CatcherView>{children}</CatcherView>
        </div>
        <Footer/>
        <SystemDialog/>
    </div>
})

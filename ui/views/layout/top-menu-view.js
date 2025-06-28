import React, {useState} from 'react'
import {Dropdown} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../business-logic/path'
import SearchBoxView from '../explorer/search/search-box-view'
import LoginStatus from '../components/login-status'
import NetworkSwitchView from './network-switch-view'

const services = [
    {title: 'Accounts Directory', href: resolvePath('', 'directory')},
    {title: 'Domains BlockList', href: resolvePath('', 'directory/blocked-domains')},
    {title: 'Payment Locator', href: resolvePath('payment-locator')},
    {title: 'Operations Live Stream', href: resolvePath('operations-live-stream')},
    {title: 'Account Demolisher', href: resolvePath('', 'demolisher')},
    {title: 'Tax Data Export', href: "https://ledgers.tax/"},
    {title: 'Protocol Versions History', href: resolvePath('protocol-history')},
    {title: 'Asset Lists Catalogue', href: '/asset-lists'}
    //{title: 'Account Demolisher', href: resolvePath('', 'demolisher')}
]

export default function TopMenuView() {
    const [menuVisible, setMenuVisible] = useState(false)

    return <div className="top-block">
        <div className="container nav relative">
            <a href={resolvePath('')} className="logo">
                Stellar<img alt="StellarExpert" src="/img/stellar-expert-blue.svg"/>Expert
            </a>
            <a className="toggle-menu" href="#" onClick={e => setMenuVisible(!menuVisible)}>
                <i className="icon icon-menu" style={{fontSize: '1.4em', marginRight: '0.3em'}}/>
            </a>
            <div className={`nav-menu-dropdown ${menuVisible && 'active'}`}>
                <div className="main-menu top-menu-block" onClick={e => setMenuVisible(false)}>
                    <a href={resolvePath('asset')}>Assets</a>
                    <a href={resolvePath('market')}>Markets</a>
                    <a href={resolvePath('liquidity-pool')}>Liquidity Pools</a>
                    <a href={resolvePath('network-activity')}>Network Stats</a>
                    <Dropdown title="Services" className="desktop-only" options={services}/>
                    <a href="/blog">Blog</a>
                    <hr className="mobile-only"/>
                    <a href={resolvePath('', 'directory')} className="mobile-only">Accounts Directory</a>
                    <a href={resolvePath('', 'directory/blocked-domains')} className="mobile-only">Domains BlockList</a>
                    <a href={resolvePath('payment-locator')} className="mobile-only">Payment Locator</a>
                    <a href={resolvePath('operations-live-stream')} className="mobile-only">Operations Live Stream</a>
                    <a href="https://ledgers.tax/" target="_blank" className="mobile-only">Tax Data Export</a>
                    <a href={resolvePath('protocol-history')} className="mobile-only">Protocol Versions History</a>
                    <a href="/asset-lists" className="mobile-only">Asset Lists Catalogue</a>
                </div>
                <div className="top-menu-block right" style={{float: 'right'}}>
                    <LoginStatus/>
                </div>
                <SearchBoxView className="top-menu-block right" shrinkable/>
                <div className="top-menu-block right" style={{float: 'right'}}><NetworkSwitchView/></div>
            </div>
        </div>
    </div>
}
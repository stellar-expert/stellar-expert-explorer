import React from 'react'
import Footer from '../layout/footer-view'
import {resolvePath} from '../../business-logic/path'

export default function ApiDocsLayout({title, toggleMenu, children}) {
    return <div className="page-wrapper">
        <div className="blue-ribbon"/>
        <div className="top-block dual-layout">
            <div>
            <a href={resolvePath('')} className="logo" style={{padding: '0 0.5em'}}>
                Stellar<img alt="StellarExpert" src="/img/stellar-expert-blue.svg"/>Expert
            </a>{title}</div>
            <a className="toggle-menu" href="#" onClick={toggleMenu}>
                <i className="icon icon-menu" style={{fontSize: '1.4em', marginRight: '0.3em'}}/>
            </a>
        </div>
        <div className="api-documentation page-container">
            {children}
        </div>
        <Footer/>
    </div>
}
import React from 'react'
import {resolvePath} from '../../business-logic/path'
import Footer from '../layout/footer-view'

export default function ApiDocsLayout({title, toggleMenu, children}) {
    return <div className="page-wrapper">
        <div className="blue-ribbon"/>
        <div className="top-block">
            <div className=" dual-layout wide container">
            <span>
                <a href={resolvePath('')} className="logo">
                    stellar<img alt="StellarExpert" src="/img/stellar-expert-blue.svg"/>expert
                </a>
                <span className="logo">
                / API Documentation
                    </span>
                </span>
                <a className="toggle-menu" href="#" onClick={toggleMenu}>
                    <i className="icon icon-menu" style={{fontSize: '1.4em', marginRight: '0.3em'}}/>
                </a>
            </div>
        </div>
        <div className="api-documentation page-container">
            <div className=" container wide">
                {children}
            </div>
        </div>
        <Footer/>
    </div>
}
import React from 'react'
import {BlockSelect, ThemeSelector} from '@stellar-expert/ui-framework'

function Footer() {
    return <div className="footer">
        <div className="container text-center">
            <div>{new Date().getFullYear()}&nbsp;©&nbsp;StellarExpert <span className="dimmed">v{appVersion}</span>
            </div>
            <div>
                <a href="/openapi.html" target="_blank" className="nowrap">
                    <i className="icon icon-embed"/> Open API docs
                </a>&emsp;
                <a href="https://github.com/orbitlens/stellar-expert-explorer/issues/" target="_blank" rel="noreferrer noopener" className="nowrap">
                    <i className="icon icon-github"/> Report a bug
                </a>&emsp;
                <ThemeSelector/>
            </div>
            <div>
                <a href="https://twitter.com/orbitlens" target="_blank" rel="noreferrer noopener" className="nowrap">
                    <i className="icon icon-twitter"/>
                </a>&emsp;
                <a href="mailto:info@stellar.expert" target="_blank" rel="noreferrer noopener" className="nowrap">
                    <i className="icon icon-email"/>
                </a>
            </div>
            <div className="dimmed condensed" style={{fontSize: '0.65em'}}>
                Donations: <BlockSelect>GDQ75AS5VSH3ZHZI3P4TAVAOOSNHN346KXJOPZVQMMS27KNCC5TOQEXP</BlockSelect>
            </div>
        </div>
    </div>
}

export default Footer
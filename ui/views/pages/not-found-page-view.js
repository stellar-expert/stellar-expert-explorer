import React from 'react'
import {usePageMetadata} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../business-logic/path'

export default function NotFoundView() {
    usePageMetadata({
        title: 'Page not found',
        description: 'Sorry, the page you are looking for was not found. Start over from the home page.'
    })

    return <div className="row double-space" style={{height: '50vh'}}>
        <div className="column column-33 column-offset-34 column-center text-center">
            <img src="/img/stellar-expert-blue-broken.svg" alt="404" width="160"/>
            <h2>404<br/>PAGE NOT FOUND</h2>
            <div className="space">
                Sorry, the page you are looking for was not found.
                Start over from the <a href="/">home page</a> or
                check a specific category:
                <div className="micro-space">
                    <a href={resolvePath('asset')}>Assets</a>{' · '}
                    <a href={resolvePath('market')}>Markets</a>{' · '}
                    <a href={resolvePath('network-activity')}>Network Stats</a>{' · '}
                    <a href="/blog">Blog</a>
                </div>
            </div>
        </div>
    </div>
}

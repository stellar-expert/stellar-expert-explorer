import React from 'react'

export default function ApiDocNotFoundView() {

    return <div className="row double-space" style={{height: '50vh'}}>
        <div className="column column-33 column-offset-34 column-center text-center">
            <img src="/img/stellar-expert-blue-broken.svg" alt="404" width="160"/>
            <h2>DOCUMENTATION NOT FOUND</h2>
            <div className="space">
                Sorry, the documentation you are looking for was not found.
            </div>
        </div>
    </div>
}
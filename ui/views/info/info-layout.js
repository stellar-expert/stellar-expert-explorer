import React from 'react'
import PropTypes from 'prop-types'

export default function InfoLayout({section, description, children}) {
    return <>
        <h2>{section}</h2>
        <div className="row">
            <div className="column column-66">
                <div className="card">
                    <h3>{description}</h3>
                    <hr/>
                    <div className="space">
                        {children}
                    </div>
                </div>
            </div>
            <div className="column column-33">
                <div className="card">
                    <h3>Check also</h3>
                    <hr/>
                    <a href="/info/technical-problem"><span className="icon icon-lightbulb"/>Technical problems</a>
                </div>
            </div>
        </div>
    </>
}

InfoLayout.propTypes = {
    section: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
}
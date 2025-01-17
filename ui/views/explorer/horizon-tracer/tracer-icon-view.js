import React from 'react'
import PropTypes from 'prop-types'
import {Tooltip} from '@stellar-expert/ui-framework'

function invokeTracer(endpoint, e) {
    e.preventDefault()
    import(/* webpackChunkName: "tracer" */ './tracer-view')
        .then(({default: Tracer}) => alert(<Tracer endpoint={endpoint}/>, {title: 'Horizon API Tracer'}))
}

function TracerIconView({endpoint}) {
    return <Tooltip trigger={<a className="icon icon-lightbulb trigger tracer-trigger" href="#" onClick={invokeTracer.bind(this, endpoint)}/>}>
        Click to view raw Horizon API response in JSON format.
    </Tooltip>
}

TracerIconView.propTypes = {
    endpoint: PropTypes.string.isRequired
}

export default TracerIconView
import React from 'react'
import PropTypes from 'prop-types'
import TxView from '../tx/tx-view'
import Widget from './widget'

function TxWidget({match}) {
    return <Widget>
        <TxView id={match.params.id}/>
    </Widget>
}

TxWidget.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            id: PropTypes.string.isRequired
        })
    }).isRequired
}
export default TxWidget



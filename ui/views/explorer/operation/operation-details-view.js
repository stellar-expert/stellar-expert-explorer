import React from 'react'
import PropTypes from 'prop-types'
import Tracer from '../horizon-tracer/tracer-icon-view'
import OperationEffects from './operation-effects-view'
import OperationDetailsHeader from './operation-details-header-view'
import OpTextDescriptionView from './operation-text-description-view'
import {convertHorizonOperation} from './operation-horizon-converter'
import './operation-details.scss'

export default function OperationDetailsView({operation, embedded, txLink, allowEffects}) {
    function scrollToOp(opContainer) {
        setTimeout(() => {
            if (opContainer && location.hash && operation.id === location.hash.substr(1)) {
                window.scrollTo(0, opContainer.offsetTop)
            }
        }, 500)
    }

    return <div className={'op-view' + (window.location.hash.substr(1) === operation.id ? ' highlighted' : '')}
                id={operation.id} ref={scrollToOp}>
        {React.createElement(embedded ? 'h4' : 'h2', {style: {margin: 0}, className: 'relative'},
            <OperationDetailsHeader operation={operation} txLink={txLink}/>,
            <Tracer endpoint={'operations/' + operation.id}/>
        )}
        <div>
            <OperationEffects operation={operation}>
                <OpTextDescriptionView {...convertHorizonOperation(operation)}/>
            </OperationEffects>
        </div>
    </div>
}

OperationDetailsView.propTypes = {
    operation: PropTypes.object.isRequired,
    allowEffects: PropTypes.bool,
    embedded: PropTypes.bool,
    txLink: PropTypes.bool
}
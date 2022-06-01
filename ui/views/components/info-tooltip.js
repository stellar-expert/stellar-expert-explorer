import React from 'react'
import PropTypes from 'prop-types'
import Tooltip from './tooltip'
import './tooltip.scss'
import './info-tooltip.scss'

export default function InfoTooltip({children, link, icon = 'icon-help'}) {
    return <Tooltip trigger={<i className={`trigger icon ${icon} info-tooltip text-small`}/>}>
        {children}
        {!!link && <a href={link} className="info-tooltip-link" target="_blank">Read more&hellip;</a>}
    </Tooltip>
}

InfoTooltip.propTypes = {
    children: PropTypes.any.isRequired,
    link: PropTypes.string
}
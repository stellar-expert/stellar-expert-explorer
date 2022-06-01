import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import appSettings from '../../../app-settings'
import Tooltip from '../../components/tooltip'
import WidgetCode from './embed-widget-code-view'
import './embed-widget-trigger.scss'

export default function EmbedWidgetTrigger({title, path}) {
    const triggerClass = cn('trigger icon icon-embed')
    const trigger = <a href="#" className={triggerClass} onClick={() => alert({
        content: <WidgetCode path={`${location.origin}/widget/${appSettings.activeNetwork}/${path}`}/>,
        header: `${title} - widget code`
    })}/>

    return <Tooltip trigger={trigger}>Get embeddable widget code for this block</Tooltip>
}

EmbedWidgetTrigger.propTypes = {
    title: PropTypes.any.isRequired,
    path: PropTypes.string.isRequired
}
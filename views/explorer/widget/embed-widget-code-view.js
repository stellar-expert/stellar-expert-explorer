import React from 'react'
import PropTypes from 'prop-types'
import {BlockSelect} from '@stellar-expert/ui-framework'
import {generateWidgetCode} from '../../../util/embed-widget-code-generator'

export default function EmbedWidgetCodeView({path}) {
    /*const frame = this.frame
    window.addEventListener('message', ({data, source}) => {
        if (source === frame.contentWindow && data.widget === frame.src) {
            frame.style.height = data.height + 'px'
        }
    }, false)*/

    const widgetCode = generateWidgetCode(path)
    return <>
        <p>
            To place the live widget on your site, insert this code snippet into the web page:
        </p>
        <BlockSelect wrap as="textarea" className="code word-break" readOnly>{widgetCode}</BlockSelect>
        <div className="space">
            Preview:
            <iframe src={path} style={{
                border: '1px solid #ccc',
                borderRadius: '2px',
                overflowX: 'hidden',
                overflowY: 'scroll',
                maxWidth: '100%',
                minWidth: '300px',
                maxHeight: '100%',
                minHeight: '200px',
                width: '100%'
            }}/>
        </div>
    </>
}

EmbedWidgetCodeView.propTypes = {path: PropTypes.string.isRequired}
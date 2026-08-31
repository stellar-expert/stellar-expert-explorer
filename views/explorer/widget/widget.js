import React, {useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import appSettings from '../../../app-settings'
import './widget.scss'

export default function Widget({center, children}) {
    const container = useRef(null),
        containerHeight = useRef(0)

    function refreshHeight() {
        const {offsetHeight} = container.current
        if (containerHeight.current !== offsetHeight) {
            containerHeight.current = offsetHeight
            window.parent.postMessage({
                widget: location.href,
                height: offsetHeight + 4
            }, '*')
        }
    }

    useEffect(() => {
        //only if we are inside iframe
        if (window.parent !== window) {
            containerHeight.current = 0
            refreshHeight()
            //schedule periodic height auto-update
            const refreshInterval = setInterval(refreshHeight, 2000)
            return () => clearInterval(refreshInterval)
        }
    })

    return <div className={cn('widget-container', {'text-center': center})} ref={container}>
        {appSettings.activeNetwork !== 'public' && <h3 className="dimmed">
            {appSettings.networks[appSettings.activeNetwork].title.toUpperCase()} Network
        </h3>}
        {children}
        <div className="widget-footer dimmed">
            Widget powered by <a href={`${location.origin}`} target="_blank">StellarExpert</a>
        </div>
    </div>
}


Widget.propTypes = {
    children: PropTypes.any.isRequired,
    center: PropTypes.bool
}
import React from 'react'
import cn from 'classnames'

export default function SimplePageLayout({title, action, center = false, children}) {
    return <div className="segment blank">
        <div className="dual-layout simple-page-header">
            <h3 className={cn(center ? 'text-center' : 'section-title')}>{title}</h3>
            {action}
        </div>
        <hr className="flare-half"/>
        <div className="double-space simple-page-content">
            {children}
        </div>
    </div>
}
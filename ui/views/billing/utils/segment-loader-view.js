import React from 'react'
import cn from 'classnames'

export default function SegmentLoader({inside}) {
    return <div className={cn('v-center-block blank', {'segment': !inside})} style={{padding: '2em'}}>
        <div className="text-center">
            <div className="loader inline"/>
        </div>
    </div>
}
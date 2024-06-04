import React from 'react'
import {ErrorBoundary} from '@stellar-expert/ui-framework'

export default function CatcherView({children}) {
    return <div className="container space">
        <ErrorBoundary>{children}</ErrorBoundary>
    </div>
}
import React from 'react'
import {ErrorBoundary} from '@stellar-expert/ui-framework'

export default function CatcherView({children}) {
    return <ErrorBoundary wrapper="div" className="container space segment blank">{children}</ErrorBoundary>
}
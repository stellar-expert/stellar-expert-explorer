import React from 'react'
import {withErrorBoundary} from '@stellar-expert/ui-framework'

export function withChartErrorBoundary(chart) {
    return withErrorBoundary(chart)
}

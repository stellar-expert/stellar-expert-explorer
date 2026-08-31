import React from 'react'
import {Dropdown} from '@stellar-expert/ui-framework'
import {requestTypeTitles} from '../../../business-logic/billing/request-types'

const requestTypeOptions = Object.entries(requestTypeTitles).map(([value, title]) => ({value, title}))

/**
 * FilterView editor for the billing request type, mirroring the framework operation type editor
 * @param {String} value - currently applied request type
 * @param {Function} [setValue] - omitted when the condition is rendered read-only
 */
export default function RequestTypeFilterView({value, setValue}) {
    if (!setValue)
        return <span>{requestTypeTitles[value] || 'Unknown request type'}</span>

    return <Dropdown title="Choose request type" expanded onChange={setValue} options={requestTypeOptions}/>
}
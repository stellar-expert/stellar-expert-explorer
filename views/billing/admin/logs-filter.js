import React from 'react'
import {FilterView, TextEditor} from '@stellar-expert/ui-framework'
import RequestTypeFilterView from './request-type-filter-view'

const fieldDescriptionMapping = {
    email: {
        title: 'Account email',
        description: 'Account email',
        icon: 'email',
        multi: false,
        editor: TextEditor
    },
    type: {
        title: 'Request type',
        description: 'Request type',
        icon: 'puzzle',
        editor: RequestTypeFilterView
    },
    from: {
        title: 'After',
        description: 'After date',
        icon: 'angle-right',
        multi: false
    },
    to: {
        title: 'Before',
        description: 'Before date',
        icon: 'angle-left',
        multi: false
    }
}

export default function LogsFilterView({presetFilter, onChange}) {
    return <FilterView presetFilter={presetFilter} fields={fieldDescriptionMapping} onChange={onChange}/>
}
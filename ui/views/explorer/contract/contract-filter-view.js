import React from 'react'
import {FilterView, parseFiltersFromQuery} from '@stellar-expert/ui-framework'

const fieldDescriptionMapping = {
    topic: {
        title: 'Topic title',
        description: 'Topic title',
        icon: 'puzzle'
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

export function parseContractFiltersFromQuery() {
    return parseFiltersFromQuery(fieldDescriptionMapping)
}

export default function ContractFilterView({onChange}) {
    return <FilterView fields={fieldDescriptionMapping} onChange={onChange}/>
}
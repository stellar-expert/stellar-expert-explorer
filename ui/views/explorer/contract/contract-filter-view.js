import React from 'react'
import {FilterView} from '@stellar-expert/ui-framework'

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

export default function ContractFilterView({presetFilter, onChange}) {
    return <FilterView presetFilter={presetFilter} fields={fieldDescriptionMapping} onChange={onChange}/>
}
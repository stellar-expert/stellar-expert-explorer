import React from 'react'
import {FilterView} from '@stellar-expert/ui-framework'

const fieldDescriptionMapping = {
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

export default React.memo(function UserBillingHistoryFilterView({onChange}) {
    return <FilterView fields={fieldDescriptionMapping} onChange={onChange}/>
})
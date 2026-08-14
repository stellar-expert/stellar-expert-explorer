import React from 'react'
import {FilterView, TextEditor} from '@stellar-expert/ui-framework'

/**
 * A `flag` field is applied the moment it is added, so its editor never has an empty value to fill in -
 * it only names the filter, while `FilterView` supplies the icon and the remove action around it
 * @param {String} label
 * @return {Function}
 */
function createFlagEditor(label) {
    return function FlagEditor() {
        return <span>{label}</span>
    }
}

const fieldDescriptionMapping = {
    email: {
        title: 'Email',
        description: 'Account email',
        icon: 'email',
        multi: false,
        editor: TextEditor
    },
    zeroBalance: {
        title: 'Zero balance',
        description: 'Zero balance',
        icon: 'coins',
        multi: false,
        flag: true,
        editor: createFlagEditor('Zero balance')
    },
    customTariff: {
        title: 'Custom tariff required',
        description: 'Custom tariff required',
        icon: 'warning',
        multi: false,
        flag: true,
        editor: createFlagEditor('Custom tariff required')
    }
}

export default React.memo(function UserListFilterView({onChange}) {
    return <FilterView fields={fieldDescriptionMapping} onChange={onChange}/>
})
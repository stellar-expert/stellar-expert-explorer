import React, {useCallback, useState} from 'react'
import cn from 'classnames'
import {confirmAction} from '../utils/confirm-action'
import {useDialogToggle} from '../utils/dialog-hooks'
import ActionDialogView from '../utils/action-dialog-view'
import TokenListView from './token-list-view'

/**
 * Editable origins panel. The read-only counterpart is `TokenListView` on its own
 * @param {String[]} origins
 * @param {String|JSX.Element} [caption] - omitted where the surrounding section already names the list
 * @param {Function} [onUpdate] - omitted to render the list without the editing actions
 * @param {Boolean} [disabled]
 */
export default function UserOriginsView({origins = [], caption, onUpdate, disabled}) {
    const [isOpen, toggleDialog] = useDialogToggle()

    const updateOrigins = useCallback(value => {
        onUpdate('origins', typeof value === 'function' ? value(origins) : value)
    }, [origins, onUpdate])

    const addOrigin = useCallback(origin => {
        updateOrigins(prev => [...prev, origin])
        toggleDialog()
    }, [updateOrigins, toggleDialog])

    const removeOrigin = useCallback(async origin => {
        if (await confirmAction('Delete this origin?')) {
            updateOrigins(prev => prev.filter(entry => entry !== origin))
        }
    }, [updateOrigins])

    const renderAction = useCallback(origin =>
        <a href="#" onClick={() => removeOrigin(origin)} className="icon-cancel" title="Delete origin"/>,
    [removeOrigin])

    return <div>
        <div className="space mobile-only"/>
        <TokenListView tokens={origins} caption={caption} placeholder="(No origins)"
                       renderAction={onUpdate && renderAction}/>
        {!!onUpdate && <a href="#" onClick={disabled ? undefined : toggleDialog}
                          className={cn('billing-token billing-token-add text-small', {dimmed: disabled})}>
            + Add origin</a>}
        {isOpen && <UserOriginForm updateOrigin={addOrigin} toggleDialog={toggleDialog}/>}
    </div>
}

function UserOriginForm({updateOrigin, toggleDialog}) {
    const [originValue, setOriginValue] = useState('')

    const changeOrigin = useCallback(e => setOriginValue(e.target.value.trim()), [])
    const saveOrigin = useCallback(() => updateOrigin(originValue), [originValue])

    const onKeyUp = useCallback(e => {
        if (e.key === 'Enter') {
            saveOrigin()
        }
    }, [saveOrigin])

    return <ActionDialogView title="Add new origin" onConfirm={saveOrigin} onCancel={toggleDialog}>
        <div className="space">
            <label className="dimmed text-small">Origin</label>
            <input value={originValue} onChange={changeOrigin} onKeyUp={onKeyUp}/>
        </div>
    </ActionDialogView>
}
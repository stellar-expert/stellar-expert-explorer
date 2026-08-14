import React from 'react'
import {Button, Dialog} from '@stellar-expert/ui-framework'

/**
 * Modal with a title and the standard action button row - the action leads, "Cancel" follows it outlined.
 * Renders "Cancel" alone when `onConfirm` is omitted.
 * @param {String|JSX.Element} title
 * @param {Function} onCancel
 * @param {Function} [onConfirm]
 * @param {String} [confirmTitle]
 * @param {Boolean} [dialogOpen]
 * @param {Boolean} [disabled] - blocks the confirm button while the request is in flight
 * @param {Boolean} [big]
 * @param {*} children
 */
export default function ActionDialogView({
                                             title,
                                             onCancel,
                                             onConfirm,
                                             confirmTitle = 'Confirm',
                                             dialogOpen = true,
                                             disabled,
                                             big,
                                             children}) {
    return <Dialog dialogOpen={dialogOpen} big={big}>
        <h3>{title}</h3>
        <hr className="flare"/>
        <div className="space">{children}</div>
        {onConfirm ?
            <div className="row double-space">
                <div className="column column-33 column-offset-33">
                    <Button block disabled={disabled} onClick={onConfirm}>{confirmTitle}</Button>
                </div>
                <div className="column column-33">
                    <Button block outline onClick={onCancel}>Cancel</Button>
                </div>
            </div> :
            <div className="row double-space">
                <div className="column column-33 column-offset-66">
                    <Button block onClick={onCancel}>Cancel</Button>
                </div>
            </div>}
    </Dialog>
}
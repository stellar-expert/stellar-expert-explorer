import {useCallback, useState} from 'react'

/**
 * Track whether a dialog is open
 * @return {[Boolean, Function]} current state and the callback that flips it
 */
export function useDialogToggle() {
    const [isOpen, setIsOpen] = useState(false)
    const toggle = useCallback(() => setIsOpen(prev => !prev), [])
    return [isOpen, toggle]
}
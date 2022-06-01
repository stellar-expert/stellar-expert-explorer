import React, {useState} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {useDependantState} from '@stellar-expert/ui-framework'

function getFirstRelevantValue(values) {
    for (let v of values) {
        if (v !== null && v !== undefined) return v
    }
}

function Dropdown({options, value, disabled, className, title, onChange}) {
    const [listOpen, updateListOpen] = useState(false)
    const [selectedValue, updateSelectedValue] = useDependantState(() => {
        document.addEventListener('click', collapseDropdown)
        return value
    }, [value], () => {
        document.removeEventListener('click', collapseDropdown)
    })

    function collapseDropdown() {
        updateListOpen(false)
    }

    function toggleList(e) {
        e && e.nativeEvent.stopImmediatePropagation()
        if (disabled) return
        updateListOpen(prevValue => !prevValue)
    }

    function select(e, option) {
        e.preventDefault()
        collapseDropdown()
        onChange && onChange(option.value || option)
        updateSelectedValue(option)
    }

    const val = getFirstRelevantValue([value, selectedValue, options[0]])

    const selectedItem = options.find(item => item === val || item.value === val) || options[0]

    return <div className={cn('dd-wrapper', {disabled}, className)} title={title}>
        <a href="#" className="dd-header" onClick={e => toggleList(e)}>
            {selectedItem.title || selectedItem.value || selectedItem}
            <span className={cn('dd-toggle', {visible: listOpen})}/>
        </a>
        {!disabled && <ul className={cn('dd-list', {visible: listOpen})}>
            {options.map(option => {
                if (option === '-') return <li className="dd-list-item" key="-">
                    <hr/>
                </li>
                const selected = option === selectedItem,
                    {id, value, title} = option
                return <li className="dd-list-item" key={id || value || option} onClick={e => select(e, option)}>
                    <a href="#" className={selected ? 'selected' : ''}>{title || value || option}</a>
                </li>
            })}
        </ul>}
    </div>
}

Dropdown.propTypes = {
    options: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        id: PropTypes.string,
        title: PropTypes.string
    }), PropTypes.string])).isRequired,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    className: PropTypes.string,
    title: PropTypes.string
}

export default Dropdown
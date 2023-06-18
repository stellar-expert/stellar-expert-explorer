import React, {useCallback} from 'react'
import PropTypes from 'prop-types'
import {Dropdown} from '@stellar-expert/ui-framework'
import './directory-tags.scss'

export default function DirectoryDropdownTagSelector({available, selected = [], onChange, disabled}) {
    const addTag = useCallback(function (value) {
        if (!selected.includes(value)) {
            onChange([...selected, value])
        }
    }, [onChange, selected])

    function removeTag(value) {
        if (selected.includes(value)) {
            const updated = selected.slice()
            updated.splice(updated.indexOf(value), 1)
            onChange(updated)
        }
    }

    const options = available.filter(t => !selected.includes(t.name)).map(tag => ({
        title: <>#{tag.name} <span className="dimmed text-small condensed">{tag.description}</span></>,
        value: tag.name
    }))

    return <div className="tag-selector-dropdown">
        {selected.map(tag => <span key={tag} className="selected-tag nowrap" style={{cursor: 'pointer'}}
                                   title={available.find(t => t.name === tag)?.description}>
            #{tag}<a href="#" className="icon icon-cancel" onClick={() => removeTag(tag)}/>
        </span>)}
        {!selected.length && <span className="dimmed">[no tags selected]</span>}{' '}
        <Dropdown onChange={addTag} disabled={disabled} title="Add..." options={options}/>
    </div>
}

DirectoryDropdownTagSelector.propTypes = {
    available: PropTypes.arrayOf(PropTypes.shape({name: PropTypes.string, description: PropTypes.string})).isRequired,
    selected: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func
}
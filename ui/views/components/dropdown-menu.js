import React, {useState, useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

function DropdownMenu({children, title, className, onClick, disabled, noToggle, style}) {
    const [listOpen, updateListOpen] = useState(false),
        [hPosition, setHPosition] = useState('left'),
        list = useRef(null)

    useEffect(() => {
        document.addEventListener('click', collapseDropdown)
        return () => {
            document.removeEventListener('click', collapseDropdown)
        }
    })

    function collapseDropdown() {
        updateListOpen(false)
    }

    function toggleList(e) {
        e && e.nativeEvent.stopImmediatePropagation()
        updateListOpen(prevState => {
            const isOpen = disabled ? false : !prevState
            if (isOpen) {
                const rect = list.current.getBoundingClientRect()
                if (window.innerWidth - rect.right < 0 && rect.left - rect.width >= 0) {
                    setHPosition('right')
                } else {
                    setHPosition('left')
                }
            }
            return isOpen
        })
    }

    function handleClick(value, title) {
        if (disabled) return
        collapseDropdown()
        onClick && onClick(value, title)
    }

    const listStyle = {}
    if (listOpen && hPosition === 'right') {
        listStyle.right = '-0.5em'
    }

    return <div className={cn('dd-wrapper', className)} style={style}>
        <a href="#" className="dd-header" onClick={e => toggleList(e)}>
            {title}{!noToggle && <span className={cn('dd-toggle', {visible: listOpen})}/>}
        </a>
        <ul className={cn('dd-list', {visible: listOpen})} ref={list} style={listStyle}>
            {children.map(({href, title, value, className}) => <li className="dd-list-item" key={href || value}>
                <a href={href || '#'} className={className} onClick={() => handleClick(value, title)}>{title}</a>
            </li>)}
        </ul>
    </div>
}

DropdownMenu.propTypes = {
    children: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        href: PropTypes.string,
        value: PropTypes.string,
        className: PropTypes.string
    })).isRequired,
    title: PropTypes.any.isRequired,
    className: PropTypes.string,
    disabled: PropTypes.bool
}

export default DropdownMenu
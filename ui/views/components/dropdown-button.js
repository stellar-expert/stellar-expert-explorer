import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'

function DropdownButton(props) {
    const {children, title, className, disabled, noToggle, style} = props
    const [listOpen, updateOpenState] = useState(() => false)

    useEffect(() => {
        document.addEventListener('click', collapseDropdown)
        return () => {
            document.removeEventListener('click', collapseDropdown)
        }
    }, [props])

    function collapseDropdown() {
        updateOpenState(false)
    }

    function toggleList(e) {
        e && e.nativeEvent.stopImmediatePropagation()
        updateOpenState(prevState => disabled ? false : !prevState)
    }

    function onItemClick(e) {
        e && e.nativeEvent.stopImmediatePropagation()
    }

    return <div className={cn('dd-wrapper', className)} style={{padding: 0}}>
        <a href="#" className={cn('dd-header', 'button', {disabled})} style={style}
           onClick={e => toggleList(e)}>
            {title}{!noToggle && <span className={cn('dd-toggle', {visible: listOpen})}/>}
        </a>
        <ul className={cn('dd-list', {visible: listOpen})}>
            {children.map((item, i) => <li className="dd-list-item" key={i} onClick={e => onItemClick(e)}>
                {item.content ? item.content : <a href="#" onClick={e => item.onClick(e)}>{item.title}</a>}
            </li>)}
        </ul>
    </div>
}

DropdownButton.propTypes = {
    children: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string,
        onClick: PropTypes.func,
        content: PropTypes.node
    })).isRequired,
    title: PropTypes.string.isRequired,
    className: PropTypes.string,
    style: PropTypes.object,
    disabled: PropTypes.bool,
    noToggle: PropTypes.bool
}

export default DropdownButton
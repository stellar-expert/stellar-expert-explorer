import React, {Component} from 'react'
import PropTypes from 'prop-types'
import './tooltip.scss'

/**
 * Calculate the position of a tooltip
 *
 * @params
 * - `e` {Event} the event of current mouse
 * - `node` {DOM} the react-tooltip object
 * - `desiredPlace` {String} top / right / bottom / left
 * - `offset` {Object} the offset to default position
 *
 * @return {Object}
 * - `isNewState` {Bool} required
 * - `newState` {Object}
 * - `position` {Object} {left: {Number}, top: {Number}}
 */
function getTooltipPosition(e, node, desiredPlace, offset) {
    const target = e.currentTarget
    //dimensions of node and target
    const {width: tipWidth, height: tipHeight} = getDimensions(node),
        {width: targetWidth, height: targetHeight} = getDimensions(target)
    //mouse offset
    const {mouseX, mouseY} = getCurrentMouseOffset(target),
        defaultOffset = getDefaultPosition(targetWidth, targetHeight, tipWidth, tipHeight),
        {extraOffset_X, extraOffset_Y} = calculateOffset(offset)

    // Get the edge offset of the tooltip
    function getTipOffsetLeft(place) {
        return mouseX + defaultOffset[place].l + extraOffset_X
    }

    function getTipOffsetRight(place) {
        return mouseX + defaultOffset[place].r + extraOffset_X
    }

    function getTipOffsetTop(place) {
        return mouseY + defaultOffset[place].t + extraOffset_Y
    }

    function getTipOffsetBottom(place) {
        return mouseY + defaultOffset[place].b + extraOffset_Y
    }

    function outside(p) {
        return getTipOffsetLeft(p) < 0 || //outsideLeft
            getTipOffsetRight(p) > window.innerWidth || //outsideRight
            getTipOffsetTop(p) < 0 || //outsideTop
            getTipOffsetBottom(p) > window.innerHeight //outsideBottom
    }

    function inside(p) {
        return !outside(p)
    }

    const insideList = (['top', 'bottom', 'left', 'right']).filter(p => inside(p))

    let newPlace
    if (inside(desiredPlace)) {
        newPlace = desiredPlace
    } else if (insideList.length > 0 && outside(desiredPlace)) {
        newPlace = insideList[0]
    }

    const {top: parentTop, left: parentLeft} = target.getBoundingClientRect()

    return {
        place: newPlace,
        position: {
            left: parseInt(getTipOffsetLeft(newPlace) - parentLeft, 10),
            top: parseInt(getTipOffsetTop(newPlace) - parentTop, 10)
        }
    }
}

function getDimensions(node) {
    const {width, height, top, left} = node.getBoundingClientRect()
    return {
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        top: parseInt(top, 10),
        left: parseInt(left, 10)
    }
}

function getCurrentMouseOffset(currentTarget) {
    const {width, height, top, left} = getDimensions(currentTarget)
    return {
        mouseX: left + (width / 2),
        mouseY: top + (height / 2)
    }
}

function getDefaultPosition(targetWidth, targetHeight, tipWidth, tipHeight) {
    const triangleHeight = 6
    return {
        top: {
            l: -(tipWidth / 2),
            r: tipWidth / 2,
            t: -(targetHeight / 2 + tipHeight + triangleHeight),
            b: -(targetHeight / 2)
        },
        bottom: {
            l: -(tipWidth / 2),
            r: tipWidth / 2,
            t: targetHeight / 2 + triangleHeight,
            b: targetHeight / 2 + tipHeight
        },
        left: {
            l: -(tipWidth + targetWidth / 2),
            r: -(targetWidth / 2) + triangleHeight,
            t: -(tipHeight / 2),
            b: tipHeight / 2
        },
        right: {
            l: targetWidth / 2 + triangleHeight,
            r: tipWidth + targetWidth / 2,
            t: -(tipHeight / 2),
            b: tipHeight / 2
        }
    }
}

function calculateOffset(offset) {
    let extraOffset_X = 0,
        extraOffset_Y = 0

    if (Object.prototype.toString.apply(offset) === '[object String]') {
        offset = JSON.parse(offset.toString().replace(/\'/g, '\"'))
    }
    for (let key in offset) {
        if (key === 'top') {
            extraOffset_Y -= parseInt(offset[key], 10)
        } else if (key === 'bottom') {
            extraOffset_Y += parseInt(offset[key], 10)
        } else if (key === 'left') {
            extraOffset_X -= parseInt(offset[key], 10)
        } else if (key === 'right') {
            extraOffset_X += parseInt(offset[key], 10)
        }
    }

    return {extraOffset_X, extraOffset_Y}
}

export default class Tooltip extends Component {
    constructor(props) {
        super(props)
        this.state = {active: false}
    }

    componentWillUnmount() {
        this.unmounted = true
    }

    mouseEnter(e) {
        if (this.unmounted || this.state.visible) return //do nothing
        const desiredPlace = this.props.desiredPlace || 'top',
            offset = this.props.offset || {}
        const {place, position} = getTooltipPosition(e, this.content, desiredPlace, offset)
        this.setState({visible: true, position, place})

    }

    mouseLeave(e) {
        if (this.unmounted || !this.state.visible) return
        this.setState({visible: false})
    }

    render() {
        const {trigger, children, maxWidth, ...otherProps} = this.props
        const triggerProps = {
            onMouseEnter: e => this.mouseEnter(e),
            onMouseLeave: e => this.mouseLeave(e),
            ...otherProps
        }
        const {position = {top: 0, left: 0}, place = 'top'} = this.state
        const contentStyle = {
            maxWidth,
            left: position.left + 'px',
            top: position.top + 'px'
        }
        return React.cloneElement(trigger, triggerProps, <div className="tooltip-wrapper"  style={contentStyle}>
            <div ref={domNode => this.content = domNode} className={`tooltip ${place}`}>
                <div className="tooltip-content">
                    {children}
                </div>
            </div>
        </div>)
    }
}

Tooltip.defaultProps = {maxWidth: '20em'}

Tooltip.propTypes = {
    trigger: PropTypes.element.isRequired,
    maxWidth: PropTypes.string
}
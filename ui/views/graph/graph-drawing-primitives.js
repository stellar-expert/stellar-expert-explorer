import {drawIdenticon} from '@stellar-expert/ui-framework'
import {hexToRgbArray, rgbArrayToRgba} from '../../util/css-var-utils'

const defaultColor = '#555',
    transparent = 'rgba(0,0,0,0)',
    highlightColor = '#08B5E5',
    parsedHighlightColor = hexToRgbArray(highlightColor),
    highlightBackdropColor = rgbArrayToRgba(parsedHighlightColor, 0.1),
    highlightBorderColor = rgbArrayToRgba(parsedHighlightColor, 0.12)

function drawTextbox(ctx, text, position, backdrop = false) {
    const fontSize = 3.5
    ctx.font = `${fontSize}px Sans-Serif`
    ctx.save()
    ctx.translate(position.x, position.y)
    const padding = fontSize / 4
    const {width} = ctx.measureText(text)
    ctx.fillStyle = backdrop ? highlightBackdropColor : transparent
    ctx.fillRect(-width / 2 - padding, -fontSize / 2 - padding, width + padding * 2, fontSize + padding * 2)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = defaultColor
    ctx.fillText(text, 0, 0)
    ctx.restore()
}

export function drawNode(ctx, node, graph) {
    const isHighlighted = graph.hoverNode === node || graph.selectedNode === node
    ctx.lineWidth = 0.5
    ctx.fillStyle = isHighlighted ? highlightBackdropColor : transparent
    ctx.strokeStyle = isHighlighted ? highlightBorderColor : transparent
    ctx.beginPath()
    ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
    drawIdenticon(ctx, node.id, 7, {top: node.y - 3.5, left: node.x - 3.5})
    drawTextbox(ctx, node.name, {x: node.x, y: node.y + 9}, isHighlighted)
}

export function getLinkColor(link, graph) {
    return graph.isLinkActive(link) ? rgbArrayToRgba(parsedHighlightColor, 0.5) : 'rgba(150,150,150, 0.2)'
}
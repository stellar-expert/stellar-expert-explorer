import {drawIdenticon} from '@stellar-expert/ui-framework'
import {hexToRgbArray, rgbArrayToRgba} from '../../util/css-var-utils'

const defaultColor = '#555'
const transparent = 'rgba(0,0,0,0)'
const highlightColor = '#08B5E5'
const parsedHighlightColor = hexToRgbArray(highlightColor)
const highlightBackdropColor = rgbArrayToRgba(parsedHighlightColor, 0.1)
const highlightBorderColor = rgbArrayToRgba(parsedHighlightColor, 0.12)

class IdenticonImageSource {
    constructor() {
        this.cache = {}
        this.cleanupInterval = setInterval(() => {
            for (const [key, value] of Object.entries(this.cache)) {
                if (value.ts + 120_000 < new Date()) { //expired
                    delete this.cache[key]
                }
            }
        }, 30_000)
    }

    draw(address, onLoad) {
        const cacheEntry = this.cache[address]
        if (!cacheEntry) {
            const identicon = new Image()
            identicon.onload = onLoad(identicon)
            identicon.src = URL.createObjectURL(new Blob([drawIdenticon(address, 7)], {type: 'image/svg+xml'}))
            this.cache[address] = {identicon, ts: new Date()}
        } else {
            cacheEntry.ts = new Date()
            onLoad(cacheEntry.identicon)
        }
    }
}

const identiconImageSource = new IdenticonImageSource()

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
    identiconImageSource.draw(node.id, identicon => ctx.drawImage(identicon, node.x - 3.5, node.y - 3.5, 7, 7))
    drawTextbox(ctx, node.name, {x: node.x, y: node.y + 9}, isHighlighted)
    if (node.title){
        drawTextbox(ctx, `[${node.title}]`, {x: node.x, y: node.y + 14}, isHighlighted)
    }
}

export function getLinkColor(link, graph) {
    return graph.isLinkActive(link) ? rgbArrayToRgba(parsedHighlightColor, 0.5) : 'rgba(150,150,150, 0.2)'
}

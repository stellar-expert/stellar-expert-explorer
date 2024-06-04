
import {registerFont, createCanvas, loadImage} from 'canvas'

registerFont('utils/meta-preview/ClearSans-Regular.ttf', {family: 'ClearSans'})
registerFont('utils/meta-preview/RobotoCondensedLight-Regular.ttf', {family: 'Roboto Condensed'})

const mainTextColor = "#fff"
const secondaryTextColor = "#0691b7"
const colorDimmed = "#b5c2bf"
const colorTag = "#f2fcff"

const fontFamily = 'ClearSans'
const fontFamilySecondary = 'Roboto Condensed'

/**
 * Generate page preview image by metadata.
 */
class PreviewGenerator {
    /**
     * Creates a canvas for drawing
     * @param {Number} width - Width of preview image.
     * @param {Number} height - Height of preview image.
     */
    constructor(width = 1200, height = 630) {
        this.width = width
        this.height = height
        this.canvas = createCanvas(width, height)
        this.context = this.canvas.getContext('2d')
        this.context.quality = 'best'
    }
    //standard space between elements
    gap = 10
    //content padding
    padding = this.gap * 4

    fontSize = 24

    headerFontSize = this.fontSize * 3

    smallFontSize = this.fontSize * 0.75

    lineHeight = this.fontSize * 1.5

    headerLineHeight = this.headerFontSize * 1.5

    headerOffset = [this.padding, this.padding + this.headerLineHeight / 2 - this.gap / 2]

    contentOffset = [this.padding, this.padding + this.headerLineHeight - this.gap]

    /**
     * Generates a standard preview depending on the metadata.
     * @param {Object} data - Page metadata. Template, title, description, infoList, tags, image, notFound.
     * @param {String} data.template - Setting the header type.
     * @param {String} data.title - Text into header in one line, title of page.
     * @param {String} data.description - Description of page in several lines.
     * @param {[Object]} data.infoList - List of additional information.
     * @param {[String]} data.tags - List of tags (each in a special container), using instead of infoList.
     * @param {String} data.image - Link to the source for a large image for drawing in the center of the template.
     * @param {Boolean} data.notFound - Not found page preview.
     * @return {Promise<String>}
     */
    async generate(data = {}) {
        await this.drawBackground()
        await this.switchHeader(data)
        if (data.description) {
            this.drawDesc(data.description, {pos: this.contentOffset})
        }
        const offsetTop = data.description ?
            this.contentOffset[1] + this.padding + this.lineHeight :
            this.contentOffset[1] + this.padding
        if (data.infoList) {
            await this.drawInfo(data.infoList, {pos: [2 * this.padding, offsetTop]})
        }
        if (data.tags && !data.infoList && !data.image) {
            this.drawTags(data.tags, {pos: [this.padding, offsetTop]})
        }
        if (data.image && !data.infoList && !data.tags) {
            await this.drawPostImage(data.image, {pos: [this.padding, offsetTop - 2 * this.gap]})
        }
        if (data.notFound) {
            await this.drawPageNotFound({pos: [this.padding, offsetTop]})
        }

        return this.canvas.toDataURL('image/png')
    }

    /**
     * Draw an image when the source is loaded.
     * @param {Object} options - Options for drawing the image in the correct size and position.
     * @param {String} options.src - Link to the source of image.
     * @param {Number} options.width - The width of the image, if not set, is taken automatically by the aspect ratio.
     * @param {Number} options.height - The height of the image, if not set, is taken automatically by the aspect ratio.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     * @return {Promise<{}>}
     */
    async drawImage(options) {
        const {src, width, height, pos = [0,0]} = options
        if (!src) return {}

        return await loadImage(src)
            .then(img => {
                const aspectRatio = img.width / img.height
                this.context.drawImage(img, pos[0], pos[1], width || height * aspectRatio, height || width / aspectRatio)
                this.context.restore()
                return {
                    width: width || aspectRatio * height,
                    height: height || width / aspectRatio
                }
            }).catch(e => console.error(e))
    }

    /**
     * Draw any text using the set parameters.
     * @param {String} text - Text for drawing in one line.
     * @param {Object} options - Options for drawing the text with parameters in the correct position.
     * @param {String} options.font - Set font property for context of canvas.
     * @param {Number} options.letterSpacing - Horizontal spacing between text characters (px).
     * @param {Number} options.maxWidth - The maximum width of a text line.
     * @param {String} options.color - Set fillStyle property for context of canvas.
     * @param {String} options.textBaseline - Set textBaseline property for context of canvas.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     * @return {Number}
     */
    drawText(text, options = {}) {
        const {
            font,
            letterSpacing,
            maxWidth = this.width - 2 * this.padding,
            color = mainTextColor,
            textBaseline = 'middle',
            pos = [0,0]
        } = options
        this.context.font = font
        this.context.fillStyle = color
        this.context.textBaseline = textBaseline
        const textLineWidth = this.context.measureText(text).width

        if (!letterSpacing) {
            this.context.fillText(text, pos[0], pos[1], maxWidth)
            return textLineWidth
        }
        //Change letter spacing
        let offsetLeft = pos[0]
        let textWidth = 0
        const seperatedText = text.split('')
        const widthRatio = maxWidth / (textLineWidth + seperatedText.length * letterSpacing)
        seperatedText.forEach(c => {
            const compressionRatio = maxWidth / textLineWidth
            const characterWidth = this.context.measureText(c).width
            const drawSpace = (characterWidth - letterSpacing) * compressionRatio
            const calibrationSpace = widthRatio < 1 ? letterSpacing * compressionRatio : letterSpacing
            const compressedWidth = widthRatio < 1 ? drawSpace : characterWidth
            const isCalibrate = compressedWidth < drawSpace
            const calibrationWidth = isCalibrate ? compressedWidth : drawSpace
            this.context.fillText(c, offsetLeft, pos[1], calibrationWidth)
            textWidth += calibrationWidth + calibrationSpace
            offsetLeft += calibrationWidth + calibrationSpace
        })
        return textWidth
    }

    /**
     * Draw background template with logo
     */
    async drawBackground() {
        await this.drawImage({
            src: 'utils/meta-preview/stellarexpert-card-preview-template.png',
            width: this.width,
            height: this.height,
            pos: [0, 0]
        })
    }

    /**
     * Draw header using the set parameters.
     * @param {Object} header - Text for drawing in one line.
     * @param {String} header.type - Type of header.
     * @param {String} header.text - Simple text of header.
     * @param {Object} header.value - Value for a special header type.
     * @param {Object} options - Options for drawing the header in the correct position.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     */
    async drawHeader(header = {}, options = {}) {
        const {pos = [0,0]} = options

        switch (header.type) {
            case 'asset': return await this.drawAsset(header.value, {
                pos: [this.headerOffset[0], this.headerOffset[1]]
            })
            case 'account': return await this.drawAccount(header.value, {
                pos: [this.headerOffset[0], this.headerOffset[1]]
            })
            default: return this.drawText(header.text, {
                font: this.headerFontSize + 'px ' + fontFamilySecondary,
                letterSpacing: - 3,
                maxWidth: this.width - 2 * this.padding,
                pos
            })
        }
    }

    /**
     * Draw the header depending on the template.
     * @param {Object} data - Prepared page metadata.
     * @param {String} data.template - Template of preview.
     * @param {String} data.title - Text into header in one line, title of page.
     * @param {String} data.value - Value for drawing Asset or Account template.
     */
    async switchHeader(data) {
        switch (data.template) {
            case 'asset': {
                await this.drawHeader({
                    type: 'asset',
                    value: {
                        code: data?.value.code || '',
                        domain: data?.value.domain || '',
                        icon: data?.value.icon || ''
                    }
                }, {pos: this.headerOffset})
                break
            }
            case 'account': {
                await this.drawHeader({
                    type: 'account',
                    text: data?.value.text,
                    value: {
                        address: data?.value.address || '',
                        displayName: data?.value.displayName || '',
                        icon: data?.value.icon || ''
                    }
                }, {pos: this.headerOffset})
                break
            }
            default: {
                await this.drawHeader({
                    type: 'text',
                    text: data.title || '...'
                }, {pos: this.headerOffset})
            }
        }
    }

    /**
     * Draw the description of page.
     * @param {String} text - Long description text.
     * @param {Object} options - Options for drawing the description in the correct position.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     */
    drawDesc(text, options = {}) {
        this.drawText(text, options = {
            ...options,
            font: this.fontSize + 'px ' + fontFamily,
            letterSpacing: -1.5,
            color: colorDimmed
        })
    }

    /**
     * Draw tags with special container for each.
     * @param {[String]} list - List of tags (each in a special container), using instead of infoList.
     * @param {Object} options - Options for drawing tags in the correct position.
     * @param {Number} options.column - Number of columns.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     */
    drawTags(list = [], options = {}) {
        const {column = 3, pos = [0,0]} = options
        const maxWidth = this.width - 2 * this.padding
        const widthRect = (maxWidth - (column - 1) * this.gap) / column
        const heightRect = this.lineHeight + this.gap
        const offset = {
            left: pos[0],
            top: pos[1] - this.gap
        }
        list?.forEach((tag, index) => {
            this.drawRoundRect('#' + tag, {
                widthRect,
                heightRect,
                pos: [offset.left, offset.top]
            })
            if ((index + 1) % column) {
                offset.left += widthRect + this.gap
            } else {
                offset.left = pos[0]
                offset.top += heightRect + this.gap
            }
        })
    }

    /**
     * Draw rounded rectangle for tag.
     * @param {String} content - Tag text inside a rectangle.
     * @param {Object} options - Options for drawing tags in the correct position.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     * @param {Number} options.widthRect - Width of rectangle.
     * @param {Number} options.heightRect - Height of rectangle.
     */
    drawRoundRect(content, options = {}) {
        const {pos = [0,0], widthRect, heightRect} = options
        //Filled rect
        this.context.fillStyle = colorTag

        this.context.beginPath()
        this.context.moveTo(pos[0], pos[1])
        this.context.roundRect(pos[0], pos[1], widthRect, heightRect, [5])
        this.context.closePath()
        this.context.fill()

        if (!content)
            return

        this.context.font = this.fontSize + 'px ' + fontFamily
        const contentWidth = this.context.measureText(content).width
        const maxWidth = widthRect - this.gap
        const offsetLeft = pos[0] + (maxWidth - contentWidth) / 2
        this.drawText(content, {
            maxWidth,
            color: secondaryTextColor,
            pos: [offsetLeft + this.gap / 2, pos[1] + this.gap / 2 + this.lineHeight / 2]
        })
    }

    /**
     * Draw big image in the center of template.
     * @param {String} src - Link to the source of image.
     * @param {Object} options - Options for drawing image in the correct position.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     */
    async drawPostImage(src, options = {}) {
        const {pos = [0,0]} = options
        const maxWidth = this.width / 2
        const maxHeight = this.height - pos[1] - 3 * this.padding
        const offset = {
            left: maxWidth / 2,
            top: pos[1] - 2 * this.gap
        }

        //cutting image
        this.context.beginPath()
        this.context.moveTo(offset.left, offset.top)
        this.context.lineTo(offset.left + maxWidth, offset.top)
        this.context.lineTo(offset.left + maxWidth, offset.top + maxHeight)
        this.context.lineTo(offset.left, offset.top + maxHeight)
        this.context.lineTo(offset.left, offset.top)
        this.context.closePath()
        this.context.clip()

        const image = await this.drawImage({
            src,
            width: maxWidth,
            pos: [offset.left, offset.top]
        })

        const gradient = this.context.createLinearGradient(offset.left, offset.top, offset.left, offset.top + image.height)
        gradient.addColorStop(0, 'rgba(18, 54, 63, 0)')
        gradient.addColorStop(0.5, 'rgba(18, 54, 63, 0.1)')
        gradient.addColorStop(1, 'rgba(18, 54, 63, 1.0)')
        this.context.fillStyle = gradient
        this.context.fillRect(offset.left, offset.top, maxWidth, image.height + this.gap)
    }

    /**
     * Draw list of additional info.
     * @param {[Object]} list - Additional info. Name, value, icon, change, priceDown.
     * @param {String} list.name - Name of property.
     * @param {String || Object} list.value - Value of property.
     * @param {String} list.icon - Use icon before name.
     * @param {Number} list.change - Price change.
     * @param {Boolean} list.priceDown - Detect dynamic sign.
     * @param {String} list.type - Type of value.
     * @param {Object} options - Options for drawing list in the correct position.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     */
    async drawInfo(list, options = {}) {
        const {pos = [0,0]} = options
        const fontSizeInfo = this.fontSize * 1.3
        const lineHeightInfo = fontSizeInfo * 1.2
        let offsetTop = pos[1]
        for (const entry of list) {
            const nameText = entry.name ? entry.name + ': ' : ''
            const iconText = entry.icon ? entry.icon + ' ' : ''
            const nameWidth = this.drawText(iconText + nameText, {
                font: fontSizeInfo  + 'px ' + fontFamily,
                color: entry.name ? colorDimmed : mainTextColor,
                pos: [pos[0], offsetTop]
            })
            const valueWidth = entry.type !== 'asset' ?
                this.drawText(entry.value, {
                    font: fontSizeInfo  + 'px ' + fontFamily,
                    maxWidth: this.width - 4 * this.padding - nameWidth,
                    pos: [pos[0] + nameWidth, offsetTop]
                }) :
                await this.drawAsset(entry.value, {
                    fontSize: fontSizeInfo,
                    pos: [pos[0] + nameWidth, offsetTop + 5]
                })
            if (entry.change) {
                const dynamicSign = entry.priceDown ? '↓' : '↑'
                const priceChangeWidth = this.drawText(dynamicSign + entry.change, {
                    font: this.smallFontSize + 'px ' + fontFamily,
                    color: entry.priceDown ? 'red' : 'green',
                    pos: [pos[0] + nameWidth + valueWidth, offsetTop - this.smallFontSize * 0.4]
                })
                this.drawText(' USD', {
                    font: fontSizeInfo + 'px ' + fontFamily,
                    color: colorDimmed,
                    pos: [pos[0] + nameWidth + valueWidth + priceChangeWidth, offsetTop]
                })
            }
            offsetTop += lineHeightInfo
        }
    }

    /**
     * Draw Asset.
     * @param {Object} asset - Prepared asset data. Code, icon and domain.
     * @param {String} asset.code - Asset code without issuer.
     * @param {String} asset.icon - Asset icon source url.
     * @param {String} asset.domain - Asset issuer domain.
     * @param {Object} options - Options for drawing asset in the correct position.
     * @param {[Number]} options.fontSize - Size of text.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     */
    async drawAsset(asset, options = {}) {
        const {fontSize = this.headerFontSize, pos = [0,0]} = options
        const iconGap = fontSize / 7
        const assetIconSize = fontSize * 0.75
        const assetCode = asset.code?.split('-')[0] || ''
        const isContract = assetCode.length === 56
        const calibration = fontSize === this.headerFontSize ? 14 : 4

        const sizeIcon = await this.drawImage({
            src: asset?.icon || '',
            height: assetIconSize,
            pos: [pos[0], pos[1] - fontSize / 2]
        })
        const offsetLeft = sizeIcon?.width ? pos[0] + sizeIcon.width + iconGap : pos[0]
        const assetWidth = this.drawText(assetCode, {
            font: `${fontSize}px ` + fontFamilySecondary,
            letterSpacing: isContract ? -7 : -2,
            maxWidth: this.width - this.padding - offsetLeft,
            pos: [offsetLeft, pos[1] - 1]
        })
        !isContract && this.drawText(asset.domain, {
            font: this.smallFontSize + 'px ' + fontFamilySecondary,
            color: colorDimmed,
            textBaseline: 'bottom',
            pos: [offsetLeft + assetWidth + iconGap, pos[1] + fontSize / 2 - calibration]
        })
        return offsetLeft + assetWidth
    }

    /**
     * Draw Asset.
     * @param {Object} account - Prepared asset data. Code, icon and domain.
     * @param {String} account.displayName - Friendly account name.
     * @param {String} account.icon - Account icon source url.
     * @param {String} account.address - Account address.
     * @param {Object} options - Options for drawing asset in the correct position.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     */
    async drawAccount(account, options = {}) {
        const {pos = [0,0]} = options
        const iconGap = 10
        const accountIconSize = this.headerFontSize * 0.75
        const offsetLeft = pos[0] + accountIconSize + iconGap

        await this.drawImage({
            src: account.icon || '',
            height: accountIconSize,
            pos: [pos[0], pos[1] - this.headerFontSize / 2]
        })
        const maxWidth = this.width - offsetLeft - this.padding - this.gap
        const accountAddress = account.displayName ? `[${account.displayName}] ${account.address}` : account.address
        this.drawText(accountAddress, {
            font: `${this.headerFontSize}px ${fontFamilySecondary}`,
            letterSpacing: -7,
            maxWidth,
            pos: [offsetLeft, pos[1]]
        })
    }

    /**
     * Draw page not found.
     * @param {Object} options - Options for drawing broken logo in the correct position.
     * @param {[Number]} options.pos - Position coordinates [x,y].
     */
    async drawPageNotFound(options = {}) {
        const {pos = [0,0]} = options
        const maxWidth = this.width - 2 * this.padding
        const iconSize = {
            width: 320,
            height: 102
        }
        const offsetLeft = pos[0] + (maxWidth - iconSize.width) / 2
        await this.drawImage({
            src: 'utils/meta-preview/stellar-expert-blue-broken.svg',
            width: iconSize.width,
            pos: [offsetLeft, pos[1] + this.padding]
        })
    }
}

export default PreviewGenerator
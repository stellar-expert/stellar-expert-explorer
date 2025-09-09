export default function parseDocumentationText(text) {
    if (!text)
        return null
    let parsedText = parseHeading(text)
    parsedText = parseLink(parsedText)
    parsedText = parseCode(parsedText)
    return <span dangerouslySetInnerHTML={{__html: parsedText.replace(/\n/g, '<br/>')}}/>
}

function parseHeading(text) {
    return text
        .replace(/###### (.*?)\n/g, '<h6>$1</h6>')
        .replace(/##### (.*?)\n/g, '<h5>$1</h5>')
        .replace(/#### (.*?)\n/g, '<h4>$1</h4>')
        .replace(/### (.*?)\n/g, '<h3>$1</h3>')
        .replace(/## (.*?)\n/g, '<h2>$1</h2>')
        .replace(/# (.*?)\n/g, '<h1>$1</h1>')
}

function parseLink(text) {
    return text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
}

function parseCode(text) {
    return text.replace(/`(.*?)`/g, '<code class="word-break">$1</code>')
}
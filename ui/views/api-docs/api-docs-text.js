import Markdown from 'markdown-to-jsx'

export default function ApiDocsText({text}) {
    if (!text)
        return null
    return <Markdown>{text.replaceAll('\n','\n\n')}</Markdown>
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

function parseLineBreaks(test){

}
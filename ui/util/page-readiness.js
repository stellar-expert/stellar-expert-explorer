export default function checkPageReadiness(metadata) {
    const setReady = setTimeout(() => {
        document.body.classList.add('pageReady')
    }, 10 * 1000) //after 10sec flag will be set regardless of the generation of the preview
    if (metadata?.image || metadata?.facebookImage) {
        clearTimeout(setReady)
        document.body.classList.add('pageReady')
    }
}
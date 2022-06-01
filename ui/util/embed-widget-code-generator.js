const onLoadCallback = `var c=this;window.addEventListener('message',function({data,source}){if(c&&source===c.contentWindow&&data.widget===c.src)c.style.height=data.height+'px'},false);`

function generateWidgetCode(path) {
    return `<iframe onLoad="${onLoadCallback}" src="${path}" style="border:none;overflow:hidden;max-width:100%; min-width:300px;max-height:100%;min-height:200px;width:100%"></iframe>`
}

export {generateWidgetCode}
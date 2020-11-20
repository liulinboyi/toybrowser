const images = require('images')

function render(viewport, element) {
    if (element.style) {
        var img = images(element.style.width, element.style.height)

        if (element.style['background-color']) {
            let color = element.style['background-color'] || 'rgb(0,0,0)'
            console.log(color, '颜色')
            color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
            console.log(RegExp.$1, RegExp.$2, RegExp.$3, '颜色值')
            img.fill(Number(RegExp.$1), Number(RegExp.$2), Number(RegExp.$3), 1)
            viewport.draw(img, element.style.left || 0, element.style.top || 0)
        }
    }
    if (element.children) {
        for (const child of element.children) {
            render(viewport, child)
        }
    }
}

module.exports = render

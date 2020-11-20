function computeCss(elements, rules, element) {
    // 我们必须知道当前元素的所有父元素才能判断元素与规则是否匹配
    // console.log(rules);
    // console.log('computeCss for element', elements, element)
    if (!element.computedStyle) {
        element.computedStyle = {}
    }
    for (let rule of rules) {
        let matched = false

        // 选择器部分 父子选择器用 > ;子孙选择器用空格
        let selectorParts = rule.selectors[0].split(' ').reverse();
        if (!match(element, selectorParts[0])) {
            continue
        }
        let j = 1;
        for (let i = 0; i < elements.length; i++) {
            if (match(elements[i], selectorParts[j])) {
                j++;
            }
        }
        if (j >= selectorParts.length) {
            matched = true
        }
        if (matched) {
            // specificity
            var sp = specificity(rule.selectors[0])
            // console.log('element', element, 'matched rule', rule);
            var computedStyle = element.computedStyle
            // declaration 形如：width: 200px;
            for (var declaration of rule.declarations) {
                if (!computedStyle[declaration.property]) {
                    computedStyle[declaration.property] = {}
                }
                if (!computedStyle[declaration.property].specificity) {
                    computedStyle[declaration.property].value = declaration.value
                    computedStyle[declaration.property].specificity = sp
                } else if (compare(computedStyle[declaration.property].specificity,sp) < 0) {
                    // 如果原来的优先级更低的话，就把新的加上去 否则什么都不做
                    computedStyle[declaration.property].value = declaration.value
                    computedStyle[declaration.property].specificity = sp
                }
            }
        }
    }
    // 在这里处理inlineCss
    /*
    let inline = element.attribute.filter(p => p.name === 'style)
    css.parse(`* {${inline}}`)
    sp = [1,0,0,0]
    for(...) {...}
     */
}

function specificity(selector) {
    var p = [0, 0, 0, 0] // [行内,id,class,tagname] 目前是左边高右边低;实际上是右边高左边低 [tagName, class, id, 行内]
    // 没有实现符合选择器 形如：div.container a.x#y
    var selectorParts = selector.split(' ')
    for (var part of selectorParts) {
        // 这里可以加正则拆开符合选择器再加一层循环即可
        if (part.charAt(0) === '#') {
            p[1] += 1
        } else if (part.charAt(0) === '.') {
            p[2] += 1
        } else {
            p[3] += 1
        }
    }
    return p
}


// 比较specificity
function compare(sp1, sp2) {
    // 从高位到低位比较
    if (sp1[0] - sp2[0]) {
        return sp1[0] - sp2[0]
    }
    if (sp1[1] - sp2[1]) {
        return sp1[1] - sp2[1]
    }
    if (sp1[2] - sp2[2]) {
        return sp1[2] - sp2[2]
    }
    return sp1[3] - sp2[3]
}

function match(element, selector) {
    if (!selector || !element.attributes) {
        return false
    }

    if (selector.charAt(0) === '#') {
        var attr = element.attributes.filter((attr) => attr.name === 'id')[0]
        if (attr && attr.value === selector.replace('#', '')) {
            return true
        }
    } else if (selector.charAt(0) === '.') {
        var attr = element.attributes.filter((attr) => attr.name === 'class')[0]
        let value = attr ? attr.value.split(' ') : []; // class="c1 c2"
        if (attr && value.includes(selector.replace('.', ''))) {
            return true
        }
    } else {
        if (element.tagName === selector) {
            return true
        }
    }
    return false
}

module.exports = computeCss

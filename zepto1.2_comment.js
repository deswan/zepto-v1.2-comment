/* Zepto v1.2.0 - zepto event ajax form ie - zeptojs.com/license */
(function(global, factory) {
  if (typeof define === 'function' && define.amd)
    define(function() {
      return factory(global)
    })
  else
    factory(global)
}(this, function(window) {
  var Zepto = (function() {
    var undefined, key, $, classList, emptyArray = [],
      concat = emptyArray.concat,
      filter = emptyArray.filter,
      slice = emptyArray.slice,
      document = window.document,
      elementDisplay = {},
      classCache = {},

      //不需要加单位的css属性
      cssNumber = {
        'column-count': 1,
        'columns': 1,
        'font-weight': 1,
        'line-height': 1,
        'opacity': 1,
        'z-index': 1,
        'zoom': 1
      },

      //开头<div ********* >
      fragmentRE = /^\s*<(\w+|!)[^>]*>/,

      //开头结尾<div></div>  <div>  <div/>
      singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

      //<div/> <div ********* />
      tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,

      rootNodeRE = /^(?:body|html)$/i,
      capitalRE = /([A-Z])/g,

      // special attributes that should be get/set via method calls
      methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

      adjacencyOperators = ['after', 'prepend', 'before', 'append'],
      table = document.createElement('table'),
      tableRow = document.createElement('tr'),
      containers = {
        'tr': document.createElement('tbody'),
        'tbody': table,
        'thead': table,
        'tfoot': table,
        'td': tableRow,
        'th': tableRow,
        '*': document.createElement('div')
      },
      readyRE = /complete|loaded|interactive/,

      //标签选择器
      simpleSelectorRE = /^[\w-]*$/,
      class2type = {},
      toString = class2type.toString,
      zepto = {},
      camelize, uniq,
      tempParent = document.createElement('div'),
      propMap = {
        'tabindex': 'tabIndex',
        'readonly': 'readOnly',
        'for': 'htmlFor',
        'class': 'className',
        'maxlength': 'maxLength',
        'cellspacing': 'cellSpacing',
        'cellpadding': 'cellPadding',
        'rowspan': 'rowSpan',
        'colspan': 'colSpan',
        'usemap': 'useMap',
        'frameborder': 'frameBorder',
        'contenteditable': 'contentEditable'
      },
      isArray = Array.isArray ||
      function(object) {
        return object instanceof Array
      }

    //判断一个元素是否匹配给定的选择器
    zepto.matches = function(element, selector) {
      if (!selector || !element || element.nodeType !== 1) return false
      var matchesSelector = element.matches || element.webkitMatchesSelector ||
        element.mozMatchesSelector || element.oMatchesSelector ||
        element.matchesSelector
      if (matchesSelector) return matchesSelector.call(element, selector)

      //如果浏览器不支持MatchesSelector方法，则将节点放入一个临时div节点，
      var match, parent = element.parentNode,
        temp = !parent
      if (temp)(parent = tempParent).appendChild(element)
      match = ~zepto.qsa(parent, selector).indexOf(element)
      temp && tempParent.removeChild(element)
      return match
    }

    // 下文定义：Populate the class2type map
    function type(obj) {
      return obj == null ? String(obj) :
        class2type[toString.call(obj)] || "object"
    }

    //为什么不用全等？
    function isFunction(value) {
      return type(value) == "function"
    }

    // window的特点：window.window === window
    function isWindow(obj) {
      return obj != null && obj == obj.window
    }

    function isDocument(obj) {
      return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    }

    function isObject(obj) {
      return type(obj) == "object"
    }

    function isPlainObject(obj) {
      return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }

    //检测是否为数组或类数组对象
    //传入非对象会报错，因为in操作符只能用于对象
    //使用该方法前需type x === "object"
    function likeArray(obj) {
      //(1)Boolean:强制转换为Boolean，检测为true。排除null
      //(2)Boolean:存在length属性。排除普通对象、正则、Date等没有length属性的对象
      var length = !!obj && 'length' in obj && obj.length,
        type = $.type(obj)

      //function对象也有length属性（预期参数的数量）。排除function
      //window对象也有length属性（frames的数量）。排除window
      //length属性需要么为0，要么对象中既要有length属性,又要有length-1属性
      return 'function' != type && !isWindow(obj) && (
        'array' == type || length === 0 ||
        (typeof length == 'number' && length > 0 && (length - 1) in obj)
      )
    }


    //删除数组中为undefined或null的项
    function compact(array) {
      return filter.call(array, function(item) {
        return item != null
      })
    }

    //[[a,b,v],r]->[a,b,v,r]
    function flatten(array) {
      return array.length > 0 ? $.fn.concat.apply([], array) : array
    }

    //a-b转换为aB
    //替换[一个或多个中划线+零个或一个任意字符]
    //若中划线后面没有字符了，则替换为空串
    //若有字符，则替换为[任意字符.toUpperCase]
    camelize = function(str) {
      return str.replace(/-+(.)?/g, function(match, chr) {
        return chr ? chr.toUpperCase() : ''
      })
    }

    //OLinSdeight 转换为 o-lin-sdeight
    function dasherize(str) {
      return str.replace(/::/g, '/')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')  //将两个相邻的大写字母用_分隔开
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')  //将两个相邻的小写与大写字母用_分隔开
        .replace(/_/g, '-')
        .toLowerCase()
    }

    //去重
    uniq = function(array) {
      return filter.call(array, function(item, idx) {
        return array.indexOf(item) == idx
      })
    }

    //获取某个类名的正则表达式
    //   abc: /(^|\s)abc(\s|$)/,  // 能匹配 'abc' 或 ' abc ' 或 ' abc' 或 'abc '
    function classRE(name) {
      return name in classCache ?
        classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }

    // 传入一个css属性的属性名和值，如果这个值需要加单位的话就返回加了单位后的字符串，不需要则返回原值
    function maybeAddPx(name, value) {
      return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }


    // 获取一个元素的默认 display 样式值
    function defaultDisplay(nodeName) {
      var element, display
      if (!elementDisplay[nodeName]) {  //lazyload && 缓存
        element = document.createElement(nodeName)
        document.body.appendChild(element)
        display = getComputedStyle(element, '').getPropertyValue("display")
        element.parentNode.removeChild(element)
        display == "none" && (display = "block")
        elementDisplay[nodeName] = display
      }
      return elementDisplay[nodeName]
    }

    /*
      获取element元素的所有子元素节点数组
     */
    function children(element) {
      return 'children' in element ?
        slice.call(element.children) :
        $.map(element.childNodes, function(node) {  //为什么不能直接filter呢？
          if (node.nodeType == 1) return node
        })
    }

    //Zepto集合对象构造函数
    /**
     * [Z description]
     * @param {[Node]} dom      DOM对象数组
     * @param {String} selector 选择器
     */
    function Z(dom, selector) {
      var i, len = dom ? dom.length : 0
      for (i = 0; i < len; i++) this[i] = dom[i]
      this.length = len
      this.selector = selector || ''
    }

    // `$.zepto.fragment` takes a html string and an optional tag name
    // to generate DOM nodes from the given html string.
    // The generated DOM nodes are returned as an array.
    // This function can be overridden in plugins for example to make
    // it compatible with browsers that don't support the DOM fully.
    zepto.fragment = function(html, name, properties) {
      var dom, nodes, container

      // A special case optimization for a single tag
      if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

      if (!dom) {
        if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>") //将需要扩展的标签进行扩展
        if (name === undefined) name = fragmentRE.test(html) && RegExp.$1   //获取第一个标签名（以确定父元素的类型）
        if (!(name in containers)) name = '*'

        container = containers[name]
        container.innerHTML = '' + html
        dom = $.each(slice.call(container.childNodes), function() { //清空临时容器
          container.removeChild(this)
        })  //->Array[Node]
      }

      if (isPlainObject(properties)) {
        nodes = $(dom)
        $.each(properties, function(key, value) {
          if (methodAttributes.indexOf(key) > -1) nodes[key](value)
          else nodes.attr(key, value)
        })
      }

      return dom
    }

    // `$.zepto.Z` swaps out the prototype of the given `dom` array
    // of nodes with `$.fn` and thus supplying all the Zepto functions
    // to the array. This method can be overridden in plugins.
    zepto.Z = function(dom, selector) {
      return new Z(dom, selector)
    }

    // `$.zepto.isZ` should return `true` if the given object is a Zepto
    // collection. This method can be overridden in plugins.
    // 判断obj是否是一个Zepto集合对象
    zepto.isZ = function(object) {
      return object instanceof zepto.Z
    }

    // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
    // takes a CSS selector and an optional context (and handles various
    // special cases).
    // This method can be overridden in plugins.
    zepto.init = function(selector, context) {
      var dom
      // If nothing given, return an empty Zepto collection
      if (!selector) return zepto.Z() //没传入selector参数：返回空Zepto集合
      // Optimize for string selectors
      else if (typeof selector == 'string') { //参数为String：构造集合
        selector = selector.trim()
        // If it's a html fragment, create nodes from it
        // Note: In both Chrome 21 and Firefox 15, DOM error 12
        // is thrown if the fragment doesn't begin with <
        if (selector[0] == '<' && fragmentRE.test(selector))  //创建对象，此时的 context 应该传入的是css属性对象
          dom = zepto.fragment(selector, RegExp.$1, context), selector = null //这种情形下zepto.Z()第二个参数selector设为null
        // If there's a context, create a collection on that context first, and select
        // nodes from there
        else if (context !== undefined) return $(context).find(selector)  //在上下文中根据选择器查找对象
        // If it's a CSS selector, use it to select nodes.
        else dom = zepto.qsa(document, selector)   //根据选择器查找对象
      }
      // If a function is given, call it when the DOM is ready
      else if (isFunction(selector)) return $(document).ready(selector)   //参数为function:设置window.onload回调函数
      // If a Zepto collection is given, just return it
      else if (zepto.isZ(selector)) return selector //参数为Zepto集合对象:原样返回
      else {  //
        // normalize array if an array of nodes is given
        if (isArray(selector)) dom = compact(selector)
        // Wrap DOM nodes.
        else if (isObject(selector))
          dom = [selector], selector = null
        // If it's a html fragment, create nodes from it
        else if (fragmentRE.test(selector))
          dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
        // If there's a context, create a collection on that context first, and select
        // nodes from there
        else if (context !== undefined) return $(context).find(selector)
        // And last but no least, if it's a CSS selector, use it to select nodes.
        else dom = zepto.qsa(document, selector)
      }
      // create a new Zepto collection from the nodes found
      return zepto.Z(dom, selector) //构建Zepto集合对象
    }

    // `$` will be the base `Zepto` object. When calling this
    // function just call `$.zepto.init, which makes the implementation
    // details of selecting nodes and creating Zepto collections
    // patchable in plugins.
    $ = function(selector, context) {
      return zepto.init(selector, context)
    }

    function extend(target, source, deep) {
      for (key in source)
        if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
          if (isPlainObject(source[key]) && !isPlainObject(target[key]))
            target[key] = {}
          if (isArray(source[key]) && !isArray(target[key]))
            target[key] = []
          extend(target[key], source[key], deep)
        }
      else if (source[key] !== undefined) target[key] = source[key]
    }

    // Copy all but undefined properties from one or more
    // objects to the `target` object.
    $.extend = function(target) {
      var deep, args = slice.call(arguments, 1)
      if (typeof target == 'boolean') {
        deep = target
        target = args.shift()
      }
      args.forEach(function(arg) {
        extend(target, arg, deep)
      })
      return target
    }

    // `$.zepto.qsa` is Zepto's CSS selector implementation which
    // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
    // This method can be overridden in plugins.
    // DOM查询：
    // (1)(id||class||tagNmae)&&单标签选择器 -> getElementById || getElementsByClassName || getElementsByTagName
    // (2)(1)之外的选择器都用querySelectorAll
    // (3)element非element||document||fragmentElement||类型的返回空数组[]
    // (3)没查询到的返回空数组[]
    zepto.qsa = function(element, selector) {
      var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
      return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
        ((found = element.getElementById(nameOnly)) ? [found] : []) :
        (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
        slice.call(
          isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
        )
    }

    function filtered(nodes, selector) {
      return selector == null ? $(nodes) : $(nodes).filter(selector)
    }

    //参数2是否是参数1的子节点
    $.contains = document.documentElement.contains ?
      function(parent, node) {
        return parent !== node && parent.contains(node) //如果node不是Node类型的话会报错
      } :
      function(parent, node) {
        while (node && (node = node.parentNode))
          if (node === parent) return true
        return false
      }

    function funcArg(context, arg, idx, payload) {
      return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }

    //给node添加name=>value属性，如果value为空则删除该属性
    function setAttribute(node, name, value) {
      value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }

    // access className property while respecting SVGAnimatedString
    function className(node, value) {
      var klass = node.className || '',
        svg = klass && klass.baseVal !== undefined

      if (value === undefined) return svg ? klass.baseVal : klass
      svg ? (klass.baseVal = value) : (node.className = value)
    }

    // "true"  => true
    // "false" => false
    // "null"  => null
    // "42"    => 42
    // "42.5"  => 42.5
    // "08"    => "08"
    // JSON    => parse if valid
    // String  => self
    // Object/Array => 原样返回
    function deserializeValue(value) {
      try {
        return value ?
          value == "true" ||
          (value == "false" ? false :
            value == "null" ? null :
            +value + "" == value ? +value :
            /^[\[\{]/.test(value) ? $.parseJSON(value) :  //以[或{开头：数组或对象字符串使用JSON.parse解析。JSON.parse传入非字符串会抛出异常？
            value) :
          value
      } catch (e) {
        return value
      }
    }

    $.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject

    //是否为空对象（包括可遍历原型属性）
    $.isEmptyObject = function(obj) {
      var name
      for (name in obj) return false
      return true
    }

    //是否为有限数字或数字字符串
    $.isNumeric = function(val) {
      var num = Number(val),
        type = typeof val
      return val != null && type != 'boolean' &&
        (type != 'string' || val.length) &&
        !isNaN(num) && isFinite(num) || false
    }

    //简单地封装了一下数组的indexOf方法
    $.inArray = function(elem, array, i) {
      return emptyArray.indexOf.call(array, elem, i)
    }

    $.camelCase = camelize

    /*
      String.prototype.trim 传入除了String之外的其它类型都会原样返回
     */
    $.trim = function(str) {
      return str == null ? "" : String.prototype.trim.call(str)
    }

    // plugin compatibility
    $.uuid = 0
    $.support = {}
    $.expr = {}
    $.noop = function() {}

    //在每个elements项上执行callback,构造由每个返回值组成的数组,若返回值为null或undefined则忽略此项
    $.map = function(elements, callback) {
      var value, values = [],
        i, key
      if (likeArray(elements))  //elements为Array:cb(item,index)
        for (i = 0; i < elements.length; i++) {
          value = callback(elements[i], i)
          if (value != null) values.push(value)
        }
      else
        for (key in elements) { //注意对象会遍历到可遍历原型属性 //elements为Object:cb(value,key)
          value = callback(elements[key], key)
          if (value != null) values.push(value)
        }
      return flatten(values)
    }

    //在每个elements项上执行callback，callback中的this指向elements项，若返回值为false即停止遍历，返回elements
    $.each = function(elements, callback) {
      var i, key
      if (likeArray(elements)) {  //elements为Array:cb(index,item)
        for (i = 0; i < elements.length; i++)
          if (callback.call(elements[i], i, elements[i]) === false) return elements
      } else {
        for (key in elements) //elements为Array:cb(key,value)
          if (callback.call(elements[key], key, elements[key]) === false) return elements
      }

      return elements
    }
    //简单地封装了一下数组的filter方法
    $.grep = function(elements, callback) {
      return filter.call(elements, callback)
    }

    //为什么要用window:如果直接if(JSON),JSON变量未定义的话会报错
    if (window.JSON) $.parseJSON = JSON.parse

    // Populate the class2type map
    // 三普通类型
    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
      class2type["[object " + name + "]"] = name.toLowerCase()
    })

    // Define methods that will be available on all
    // Zepto collections
    $.fn = {
      constructor: zepto.Z,
      length: 0,

      // Because a collection acts like an array
      // copy over these useful array functions.
      forEach: emptyArray.forEach,
      reduce: emptyArray.reduce,
      push: emptyArray.push,
      sort: emptyArray.sort,
      splice: emptyArray.splice,
      indexOf: emptyArray.indexOf,

      //传入多个项（其中可以有数组），返回this与这些项concat合并之后的数组（非Zepto集合对象）
      concat: function() {
        var i, value, args = []
        for (i = 0; i < arguments.length; i++) {
          value = arguments[i]
          args[i] = zepto.isZ(value) ? value.toArray() : value
        }
        return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
      },

      // `map` and `slice` in the jQuery API work differently
      // from their array counterparts
      // 因为$.map构造出的是普通数组因此还要再构造一次Z集合对象
      map: function(fn) {
        return $($.map(this, function(el, i) {
          return fn.call(el, i, el)
        }))
      },
      slice: function() {
        return $(slice.apply(this, arguments))
      },

      ready: function(callback) {
        // need to check if document.body exists for IE as that browser reports
        // document ready when it hasn't yet created the body element
        if (readyRE.test(document.readyState) && document.body) callback($)
        else document.addEventListener('DOMContentLoaded', function() {
          callback($)
        }, false)
        return this
      },

      //将Z对象转换为普通数组对象，或获取某个index的值
      get: function(idx) {
        return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
      },
      toArray: function() {
        return this.get()
      },
      size: function() {  //获取数组/Z集合长度
        return this.length
      },
      remove: function() {  //将集合中所有元素从文档中移除
        return this.each(function() {
          if (this.parentNode != null)
            this.parentNode.removeChild(this)
        })
      },
      each: function(callback) {
        emptyArray.every.call(this, function(el, idx) { //利用every方法遇到返回值为false的处理项就会停止遍历的特性
          return callback.call(el, idx, el) !== false
        })
        return this
      },
      /**
       * [description]
       * @param  {[type]} selector (1)Function:保留return为true的项 (2)String选择器:使用zepto.matches方法，保留为true的项
       */
      filter: function(selector) {
        if (isFunction(selector)) return this.not(this.not(selector)) //负负得正
        return $(filter.call(this, function(element) {
          return zepto.matches(element, selector)
        }))
      },
      add: function(selector, context) {
        return $(uniq(this.concat($(selector, context))))
      },
      is: function(selector) {  //集合第一个元素是否匹配该选择器
        return this.length > 0 && zepto.matches(this[0], selector)
      },
      /**
       * [description]
       * @param  {Function||String(selector)||Array} selector
       */
      not: function(selector) {
        var nodes = []
        if (isFunction(selector) && selector.call !== undefined)  //用函数筛选出返回false项
          this.each(function(idx) {
            if (!selector.call(this, idx)) nodes.push(this)
          })
        else {  //(1)否定选择器 (2)数组
          var excludes = typeof selector == 'string' ? this.filter(selector) :
            (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
          this.forEach(function(el) {
            if (excludes.indexOf(el) < 0) nodes.push(el)
          })
        }
        return $(nodes)
      },
      //在集合中筛选出子元素有 Element||selector的项
      has: function(selector) {
        return this.filter(function() {
          return isObject(selector) ?
            $.contains(this, selector) :  //selector:Element
            $(this).find(selector).size() //selector:String
        })
      },
      //idx除了-1外不允许其它负数
      //返回普通DOM数组
      eq: function(idx) {
        return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1) //slice返回单项依然是数组
      },
      //返回第一项作为Z集合
      first: function() {
        var el = this[0]
        return el && !isObject(el) ? el : $(el)
      },
      last: function() {
        var el = this[this.length - 1]
        return el && !isObject(el) ? el : $(el)
      },
      find: function(selector) {
        var result, $this = this
        if (!selector) result = $() //selector为空：空Z集合
        else if (typeof selector == 'object') //selector为对象
        //以对象构造出Z集合。如果集合中的项是作为this中任意一个元素的子元素的话就保留，否则过滤掉
          result = $(selector).filter(function() {
            var node = this
            return emptyArray.some.call($this, function(parent) {
              return $.contains(parent, node)
            })
          })
        //使用频率更高的操作放在前面
        //如果this只有一个项，就查找这个项的子元素
        else if (this.length == 1) result = $(zepto.qsa(this[0], selector)) //selector为String(选择器)
        else result = this.map(function() { //如果this有多个项，查找每个项的子元素并返回由查找值组成的数组
          return zepto.qsa(this, selector)
        })
        return result
      },
      /**
       * 查找最近的符合指定要求的节点
       * @param  {[type]} selector (1)String选择器 (2)数组、Z集合
       * @param  {[type]} context  只在context的后代元素中查找
       * @return {[type]}          this集合中每个元素的那个符合要求的祖先元素的Z集合（不重复），注意可能包含自身元素
       */
      closest: function(selector, context) {
        var nodes = [],
          collection = typeof selector == 'object' && $(selector)
        this.each(function(_, node) {
          //node为false或符合集合就停止循环
          while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
            node = node !== context && !isDocument(node) && node.parentNode //若找至context节点或document节点还没找到就将node设为false
          if (node && nodes.indexOf(node) < 0) nodes.push(node)
        })
        return $(nodes)
      },
      //获取this集合中每个节点的祖先元素节点（至document元素为止），并根据selector进行filter，得出所有符合要求的祖先节点（不包括自身节点）
      parents: function(selector) {
        var ancestors = [],
          nodes = this
        while (nodes.length > 0)
          nodes = $.map(nodes, function(node) {
            if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
              ancestors.push(node)
              return node
            }
          })
        return filtered(ancestors, selector)
      },
      //获取每个项的父元素组成的数组（不重复），并根据selector进行filter
      parent: function(selector) {
        return filtered(uniq(this.pluck('parentNode')), selector)
      },
      //获取每个项的子Element元素组成的数组（经过flatten的），并根据selector进行filter
      children: function(selector) {
        return filtered(this.map(function() {
          return children(this)
        }), selector)
      },
      //获取每个项的子元素(任意类型)组成的数组
      contents: function() {
        return this.map(function() {
          return this.contentDocument || slice.call(this.childNodes)
        })
      },
      //获取每个项的同级Element元素组成的数组
      siblings: function(selector) {
        return filtered(this.map(function(i, el) {
          return filter.call(children(el.parentNode), function(child) {
            return child !== el
          })
        }), selector)
      },
      //将每个项置为空标签
      empty: function() {
        return this.each(function() {
          this.innerHTML = ''
        })
      },
      // `pluck` is borrowed from Prototype.js
      // 取得该集合每个项的property属性值组成的数组
      pluck: function(property) {
        return $.map(this, function(el) {
          return el[property]
        })
      },
      //将元素原有的display:none覆盖/移除，若元素display不为none就什么都不做
      show: function() {
        return this.each(function() {
          this.style.display == "none" && (this.style.display = '') //如果内联样式中display为none就删除该样式
          //删了还是display为none那就是样式表中定义的，要设置一个内联样式将其覆盖
          if (getComputedStyle(this, '').getPropertyValue("display") == "none")
            this.style.display = defaultDisplay(this.nodeName)
        })
      },
      replaceWith: function(newContent) {
        return this.before(newContent).remove()
      },
      //将每个数组项的元素各自 wrapAll
      wrap: function(structure) {
        var func = isFunction(structure)
        if (this[0] && !func)
          var dom = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

        return this.each(function(index) {
          $(this).wrapAll(
            func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
          )
        })
      },
      //使this中的所有元素成为structure的子元素
      //本质上是
      //(1)将structure insertBefore 在 this 首元素前面 。注意如果 structure 目前在文档中的话会脱离文档，除非 this 元素项的数目大于一（会cloneNode）
      //(2)在 structure 最内层元素中 append（使用insertBefore实现）每个 this 元素项。注意 this 也会脱离原文档位置。
      //因此 this 需要已经在文档中
      wrapAll: function(structure) {
        if (this[0]) {
          $(this[0]).before(structure = $(structure)) //将structure放在第一个元素前
          var children
          // drill down to the inmost element
          while ((children = structure.children()).length) structure = children.first() //不断获取第一个子元素，直到没有子元素为止
          $(structure).append(this)
        }
        return this
      },
      //将每个数组项的元素的子节点 wrapAll ，如果为空元素（没有子节点）就直接放个structure上去
      wrapInner: function(structure) {
        var func = isFunction(structure)
        return this.each(function(index) {
          var self = $(this),
            contents = self.contents(),
            dom = func ? structure.call(this, index) : structure
          contents.length ? contents.wrapAll(dom) : self.append(dom)
        })
      },
      //注意只会保留子节点中的元素节点
      unwrap: function() {
        this.parent().each(function() {
          $(this).replaceWith($(this).children())
        })
        return this
      },
      clone: function() {
        return this.map(function() {
          return this.cloneNode(true)
        })
      },
      hide: function() {
        return this.css("display", "none")
      },
      //切换显示/隐藏
      toggle: function(setting) {
        return this.each(function() {
          var el = $(this);
          (setting === undefined ? el.css("display") == "none" : setting) ? el.show(): el.hide()
        })
      },
      //使用了Element Traversal API 获取Element类型的节点
      prev: function(selector) {
        return $(this.pluck('previousElementSibling')).filter(selector || '*')
      },
      next: function(selector) {
        return $(this.pluck('nextElementSibling')).filter(selector || '*')
      },
      //设置和获取innerHTML
      html: function(html) {
        return 0 in arguments ? //有参数->清空后append（为什么不直接设置innerHTML?）
          this.each(function(idx) {
            var originHtml = this.innerHTML
            $(this).empty().append(funcArg(this, html, idx, originHtml))
          }) :
          (0 in this ? this[0].innerHTML : null)  //无参数->获取
      },
      //设置和获取textContent(IE11+才支持，与innerText作用差不多)
      text: function(text) {
        return 0 in arguments ?
          this.each(function(idx) {
            var newText = funcArg(this, text, idx, this.textContent)
            this.textContent = newText == null ? '' : '' + newText
          }) :
          (0 in this ? this.pluck('textContent').join("") : null)
      },
      attr: function(name, value) {
        var result
        return (typeof name == 'string' && !(1 in arguments)) ? //name:String 取值操作
          (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
          this.each(function(idx) { //name:{} || name:String;value:Function 赋值操作
            if (this.nodeType !== 1) return
            if (isObject(name)) //name:{}
              for (key in name) setAttribute(this, key, name[key])
            else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name))) //name:String;value:Function(idx,attrValue)或String
          })
      },
      //name:以空格分隔的String属性名，在this的每个元素上删除这些属性
      removeAttr: function(name) {
        return this.each(function() {
          this.nodeType === 1 && name.split(' ').forEach(function(attribute) {
            setAttribute(this, attribute) //删除属性
          }, this)
        })
      },
      //设置和获取内置属性
      prop: function(name, value) {
        name = propMap[name] || name
        return (1 in arguments) ?
          this.each(function(idx) {
            this[name] = funcArg(this, value, idx, this[name])
          }) :
          (this[0] && this[0][name])
      },
      removeProp: function(name) {
        name = propMap[name] || name
        return this.each(function() {
          delete this[name] //delete无法删除内置属性，所以这个方法到底有什卵用
        })
      },
      //设置和获取data-xxx属性。获取时会使用JSON.parse解析为字面量。（使用attr属性）
      data: function(name, value) {
        var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase() //name:myName -> data-my-name
        var data = (1 in arguments) ?
          this.attr(attrName, value) :  //this
          this.attr(attrName) //属性值||undefined||false
        return data !== null ? deserializeValue(data) : undefined
      },
      val: function(value) {
        if (0 in arguments) { //设置  //可设置select的value
          if (value == null) value = "" //其实设为null也能实现清除value属性的效果啊
          return this.each(function(idx) {
            this.value = funcArg(this, value, idx, this.value)
          })
        } else {  //获取
          return this[0] && (this[0].multiple ? //多选下拉菜单标签
            $(this[0]).find('option').filter(function() {
              return this.selected
            }).pluck('value') :
            this[0].value)
        }
      },
      //设置和获取元素相对于文档的定位，返回{left,top,width,height}
      offset: function(coordinates) {
        if (coordinates) return this.each(function(index) { //设置
          var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top: coords.top - parentOffset.top,
              left: coords.left - parentOffset.left
            }

          if ($this.css('position') == 'static') props['position'] = 'relative'
          $this.css(props)
        })

        //读取
        if (!this.length) return null   //this为空则返回null
        if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
          return {
            top: 0,
            left: 0
          }
        var obj = this[0].getBoundingClientRect()
        return {
          left: obj.left + window.pageXOffset,
          top: obj.top + window.pageYOffset,
          width: Math.round(obj.width),
          height: Math.round(obj.height)
        }
      },

      css: function(property, value) {
        if (arguments.length < 2) { //获取
          var element = this[0]
          if (typeof property == 'string') {  //参数String:获取 行内样式style || 计算样式
            if (!element) return
            return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
          } else if (isArray(property)) { //参数:Array:获取多个样式 返回{a:value1,b:value2}
            if (!element) return
            var props = {}
            var computedStyle = getComputedStyle(element, '')
            $.each(property, function(_, prop) {
              props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
            })
            return props
          }
        }

        //设置样式（行内样式style）
        var css = ''
        if (type(property) == 'string') { //设置单个属性
          if (!value && value !== 0)  //value为false || '' || null 删除属性:将行内样式style的相应属性移除
            this.each(function() {
              this.style.removeProperty(dasherize(property))
            })
          else
            css = dasherize(property) + ":" + maybeAddPx(property, value)
        } else {    //设置多个属性
          for (key in property)
            if (!property[key] && property[key] !== 0)
              this.each(function() {
                this.style.removeProperty(dasherize(key))
              })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
        }

        return this.each(function() {
          this.style.cssText += ';' + css   //cssText如果被赋了多个相同的属性，只会保留最后被设置的那个属性
        })
      },
      index: function(element) {
        return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
      },
      //this里是否至少有一个元素拥有name这个类
      hasClass: function(name) {
        if (!name) return false
        return emptyArray.some.call(this, function(el) {
          return this.test(className(el))
        }, classRE(name))
      },
      //为this里的每个项添加类名，多个类名用空格分隔，已存在则不添加
      addClass: function(name) {
        if (!name) return this
        return this.each(function(idx) {
          if (!('className' in this)) return
          classList = []
          var cls = className(this),
            newName = funcArg(this, name, idx, cls)
          newName.split(/\s+/g).forEach(function(klass) {
            if (!$(this).hasClass(klass)) classList.push(klass) //定义要添加的类名：classList
          }, this)
          classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
        })
      },
      removeClass: function(name) {
        return this.each(function(idx) {
          if (!('className' in this)) return
          if (name === undefined) return className(this, '')  //无参数：全部清空
          classList = className(this)
          funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass) {
            classList = classList.replace(classRE(klass), " ")
          })
          className(this, classList.trim())
        })
      },
      toggleClass: function(name, when) {
        if (!name) return this
        return this.each(function(idx) {
          var $this = $(this),
            names = funcArg(this, name, idx, className(this))
          names.split(/\s+/g).forEach(function(klass) {
            (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass): $this.removeClass(klass)
          })
        })
      },
      scrollTop: function(value) {
        if (!this.length) return
        var hasScrollTop = 'scrollTop' in this[0]
        if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
        return this.each(hasScrollTop ?
          function() {
            this.scrollTop = value
          } :
          function() {
            this.scrollTo(this.scrollX, value)
          })
      },
      scrollLeft: function(value) {
        if (!this.length) return
        var hasScrollLeft = 'scrollLeft' in this[0]
        if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
        return this.each(hasScrollLeft ?
          function() {
            this.scrollLeft = value
          } :
          function() {
            this.scrollTo(value, this.scrollY)
          })
      },
      position: function() {
        if (!this.length) return

        var elem = this[0],
          // Get *real* offsetParent
          offsetParent = this.offsetParent(),
          // Get correct offsets
          offset = this.offset(),
          parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {
            top: 0,
            left: 0
          } : offsetParent.offset()

        // Subtract element margins
        // note: when an element has margin: auto the offsetLeft and marginLeft
        // are the same in Safari causing offset.left to incorrectly be 0
        offset.top -= parseFloat($(elem).css('margin-top')) || 0
        offset.left -= parseFloat($(elem).css('margin-left')) || 0

        // Add offsetParent borders
        parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
        parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0

        // Subtract the two offsets
        return {
          top: offset.top - parentOffset.top,
          left: offset.left - parentOffset.left
        }
      },
      offsetParent: function() {
        return this.map(function() {
          var parent = this.offsetParent || document.body
          while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
            parent = parent.offsetParent
          return parent
        })
      }
    }
    zepto.fragment("<p>asdsd</p><div>wwww</div>")

    // for now
    $.fn.detach = $.fn.remove

    // Generate the `width` and `height` functions
    ;
    ['width', 'height'].forEach(function(dimension) {
      var dimensionProperty =
        dimension.replace(/./, function(m) {
          return m[0].toUpperCase()
        })

      $.fn[dimension] = function(value) {
        var offset, el = this[0]
        //获取
        if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :  //视口大小：window.innerHeight
          isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :   //文档大小：document.scrollHeight
          (offset = this.offset()) && offset[dimension] //元素大小：通过offset()方法获取(getBoundingClientRect().height)
        //设置:设置行内样式style
        else return this.each(function(idx) {
          el = $(this)
          el.css(dimension, funcArg(this, value, idx, el[dimension]()))
        })
      }
    })

    //递归遍历node极其子元素
    function traverseNode(node, fun) {
      fun(node)
      for (var i = 0, len = node.childNodes.length; i < len; i++)
        traverseNode(node.childNodes[i], fun)
    }

    //上文定义adjacencyOperators = ['after', 'prepend', 'before', 'append']
    // Generate the `after`, `prepend`, `before`, `append`,
    // after:作为后一个同辈元素插入；prepend:作为第一个子元素插入；before：作为前一个同辈元素插入；append:作为最后一个子元素插入
    // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
    adjacencyOperators.forEach(function(operator, operatorIndex) {
      var inside = operatorIndex % 2 //=> prepend, append

      $.fn[operator] = function() {
        // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
        // nodes : 定义要插入的元素
        var argType, nodes = $.map(arguments, function(arg) {
            var arr = []
            argType = type(arg)
            if (argType == "array") { //传入的参数是数组
              arg.forEach(function(el) {
                if (el.nodeType !== undefined) return arr.push(el)  //数组项是单个dom元素：直接push入arr
                else if ($.zepto.isZ(el)) return arr = arr.concat(el.get()) //数组项是一个Z集合：将集合中的dom元素项加入arr
                arr = arr.concat(zepto.fragment(el))  //数组项是标签字符串：解析为dom数组后加入arr
              })
              return arr
            }
            //(1)传入Z集合/dom元素:原样返回
            //(2)传入其它（构造字符串之类的）:返回zepto.fragment
            return argType == "object" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent,
          //如果this元素项大于一个就要对newNode进行clone(不然每次insertBefore都会将newNode从原有的位置上删除，导致最终只能作用到一个元素上)
          copyByClone = this.length > 1
        if (nodes.length < 1) return this
        //对每个Z集合的元素项执行操作
        return this.each(function(_, target) {
          parent = inside ? target : target.parentNode  //将被插入元素的父元素

          // convert all methods to a "before" operation
          // 将被插入元素的后一个同辈元素
          target = operatorIndex == 0 ? target.nextSibling :  //after
            operatorIndex == 1 ? target.firstChild :  //prepend
            operatorIndex == 2 ? target : //before
            null  //append

          var parentInDocument = $.contains(document.documentElement, parent)

          //插入所有nodes元素
          nodes.forEach(function(node) {
            if (copyByClone) node = node.cloneNode(true)
            else if (!parent) return $(node).remove()

            parent.insertBefore(node, target)

            //这到底是要对script标签干啥
            if (parentInDocument) traverseNode(node, function(el) {
              if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                (!el.type || el.type === 'text/javascript') && !el.src) {
                var target = el.ownerDocument ? el.ownerDocument.defaultView : window
                target['eval'].call(target, el.innerHTML)
              }
            })
          })
        })
      }

      // after    => insertAfter
      // prepend  => prependTo
      // before   => insertBefore
      // append   => appendTo
      $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function(html) {
        $(html)[operator](this)
        return this
      }
    })

    zepto.Z.prototype = Z.prototype = $.fn

    // Export internal API functions in the `$.zepto` namespace
    zepto.uniq = uniq
    zepto.deserializeValue = deserializeValue
    $.zepto = zepto

    return $
  })()

  window.Zepto = Zepto
  window.$ === undefined && (window.$ = Zepto)

  ;
  (function($) {
    var _zid = 1,
      undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj) {
        return typeof obj == 'string'
      },
      handlers = {},
      specialEvents = {},
      focusinSupported = 'onfocusin' in window,
      focus = {
        focus: 'focusin',
        blur: 'focusout'
      },
      hover = {
        mouseenter: 'mouseover',
        mouseleave: 'mouseout'
      }

    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

    function zid(element) {
      return element._zid || (element._zid = _zid++)
    }

    function findHandlers(element, event, fn, selector) {
      event = parse(event)
      if (event.ns) var matcher = matcherFor(event.ns)
      return (handlers[zid(element)] || []).filter(function(handler) {
        return handler &&
          (!event.e || handler.e == event.e) &&
          (!event.ns || matcher.test(handler.ns)) &&
          (!fn || zid(handler.fn) === zid(fn)) &&
          (!selector || handler.sel == selector)
      })
    }

    function parse(event) {
      var parts = ('' + event).split('.')
      return {
        e: parts[0],
        ns: parts.slice(1).sort().join(' ')
      }
    }

    function matcherFor(ns) {
      return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
    }

    function eventCapture(handler, captureSetting) {
      return handler.del &&
        (!focusinSupported && (handler.e in focus)) ||
        !!captureSetting
    }

    function realEvent(type) {
      return hover[type] || (focusinSupported && focus[type]) || type
    }

    function add(element, events, fn, data, selector, delegator, capture) {
      var id = zid(element),
        set = (handlers[id] || (handlers[id] = []))
      events.split(/\s/).forEach(function(event) {
        if (event == 'ready') return $(document).ready(fn)
        var handler = parse(event)
        handler.fn = fn
        handler.sel = selector
        // emulate mouseenter, mouseleave
        if (handler.e in hover) fn = function(e) {
          var related = e.relatedTarget
          if (!related || (related !== this && !$.contains(this, related)))
            return handler.fn.apply(this, arguments)
        }
        handler.del = delegator
        var callback = delegator || fn
        handler.proxy = function(e) {
          e = compatible(e)
          if (e.isImmediatePropagationStopped()) return
          e.data = data
          var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
          if (result === false) e.preventDefault(), e.stopPropagation()
          return result
        }
        handler.i = set.length
        set.push(handler)
        if ('addEventListener' in element)
          element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    }

    function remove(element, events, fn, selector, capture) {
      var id = zid(element);
      (events || '').split(/\s/).forEach(function(event) {
        findHandlers(element, event, fn, selector).forEach(function(handler) {
          delete handlers[id][handler.i]
          if ('removeEventListener' in element)
            element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
        })
      })
    }

    $.event = {
      add: add,
      remove: remove
    }

    $.proxy = function(fn, context) {
      var args = (2 in arguments) && slice.call(arguments, 2)
      if (isFunction(fn)) {
        var proxyFn = function() {
          return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments)
        }
        proxyFn._zid = zid(fn)
        return proxyFn
      } else if (isString(context)) {
        if (args) {
          args.unshift(fn[context], fn)
          return $.proxy.apply(null, args)
        } else {
          return $.proxy(fn[context], fn)
        }
      } else {
        throw new TypeError("expected function")
      }
    }

    $.fn.bind = function(event, data, callback) {
      return this.on(event, data, callback)
    }
    $.fn.unbind = function(event, callback) {
      return this.off(event, callback)
    }
    $.fn.one = function(event, selector, data, callback) {
      return this.on(event, selector, data, callback, 1)
    }

    var returnTrue = function() {
        return true
      },
      returnFalse = function() {
        return false
      },
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

    function compatible(event, source) {
      if (source || !event.isDefaultPrevented) {
        source || (source = event)

        $.each(eventMethods, function(name, predicate) {
          var sourceMethod = source[name]
          event[name] = function() {
            this[predicate] = returnTrue
            return sourceMethod && sourceMethod.apply(source, arguments)
          }
          event[predicate] = returnFalse
        })

        event.timeStamp || (event.timeStamp = Date.now())

        if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
          event.isDefaultPrevented = returnTrue
      }
      return event
    }

    function createProxy(event) {
      var key, proxy = {
        originalEvent: event
      }
      for (key in event)
        if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

      return compatible(proxy, event)
    }

    $.fn.delegate = function(selector, event, callback) {
      return this.on(event, selector, callback)
    }
    $.fn.undelegate = function(selector, event, callback) {
      return this.off(event, selector, callback)
    }

    $.fn.live = function(event, callback) {
      $(document.body).delegate(this.selector, event, callback)
      return this
    }
    $.fn.die = function(event, callback) {
      $(document.body).undelegate(this.selector, event, callback)
      return this
    }

    $.fn.on = function(event, selector, data, callback, one) {
      var autoRemove, delegator, $this = this
      if (event && !isString(event)) {
        $.each(event, function(type, fn) {
          $this.on(type, selector, data, fn, one)
        })
        return $this
      }

      if (!isString(selector) && !isFunction(callback) && callback !== false)
        callback = data, data = selector, selector = undefined
      if (callback === undefined || data === false)
        callback = data, data = undefined

      if (callback === false) callback = returnFalse

      return $this.each(function(_, element) {
        if (one) autoRemove = function(e) {
          remove(element, e.type, callback)
          return callback.apply(this, arguments)
        }

        if (selector) delegator = function(e) {
          var evt, match = $(e.target).closest(selector, element).get(0)
          if (match && match !== element) {
            evt = $.extend(createProxy(e), {
              currentTarget: match,
              liveFired: element
            })
            return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
          }
        }

        add(element, event, callback, data, selector, delegator || autoRemove)
      })
    }
    $.fn.off = function(event, selector, callback) {
      var $this = this
      if (event && !isString(event)) {
        $.each(event, function(type, fn) {
          $this.off(type, selector, fn)
        })
        return $this
      }

      if (!isString(selector) && !isFunction(callback) && callback !== false)
        callback = selector, selector = undefined

      if (callback === false) callback = returnFalse

      return $this.each(function() {
        remove(this, event, callback, selector)
      })
    }

    $.fn.trigger = function(event, args) {
      event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
      event._args = args
      return this.each(function() {
        // handle focus(), blur() by calling them directly
        if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
        // items in the collection might not be DOM elements
        else if ('dispatchEvent' in this) this.dispatchEvent(event)
        else $(this).triggerHandler(event, args)
      })
    }

    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    $.fn.triggerHandler = function(event, args) {
      var e, result
      this.each(function(i, element) {
        e = createProxy(isString(event) ? $.Event(event) : event)
        e._args = args
        e.target = element
        $.each(findHandlers(element, event.type || event), function(i, handler) {
          result = handler.proxy(e)
          if (e.isImmediatePropagationStopped()) return false
        })
      })
      return result
    }

    // shortcut methods for `.bind(event, fn)` for each event type
    ;
    ('focusin focusout focus blur load resize scroll unload click dblclick ' +
      'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
      'change select keydown keypress keyup error').split(' ').forEach(function(event) {
      $.fn[event] = function(callback) {
        return (0 in arguments) ?
          this.bind(event, callback) :
          this.trigger(event)
      }
    })

    $.Event = function(type, props) {
      if (!isString(type)) props = type, type = props.type
      var event = document.createEvent(specialEvents[type] || 'Events'),
        bubbles = true
      if (props)
        for (var name in props)(name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
      event.initEvent(type, bubbles, true)
      return compatible(event)
    }

  })(Zepto)

  ;
  (function($) {
    var jsonpID = +new Date(),
      document = window.document,
      key,
      name,
      rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      scriptTypeRE = /^(?:text|application)\/javascript/i,
      xmlTypeRE = /^(?:text|application)\/xml/i,
      jsonType = 'application/json',
      htmlType = 'text/html',
      blankRE = /^\s*$/,
      originAnchor = document.createElement('a')

    originAnchor.href = window.location.href

    // trigger a custom event and return false if it was cancelled
    function triggerAndReturn(context, eventName, data) {
      var event = $.Event(eventName)
      $(context).trigger(event, data)
      return !event.isDefaultPrevented()
    }

    // trigger an Ajax "global" event
    function triggerGlobal(settings, context, eventName, data) {
      if (settings.global) return triggerAndReturn(context || document, eventName, data)
    }

    // Number of active Ajax requests
    $.active = 0

    function ajaxStart(settings) {
      if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
    }

    function ajaxStop(settings) {
      if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
    }

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    function ajaxBeforeSend(xhr, settings) {
      var context = settings.context
      if (settings.beforeSend.call(context, xhr, settings) === false ||
        triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
        return false

      triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
    }

    function ajaxSuccess(data, xhr, settings, deferred) {
      var context = settings.context,
        status = 'success'
      settings.success.call(context, data, status, xhr)
      if (deferred) deferred.resolveWith(context, [data, status, xhr])
      triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
      ajaxComplete(status, xhr, settings)
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings, deferred) {
      var context = settings.context
      settings.error.call(context, xhr, type, error)
      if (deferred) deferred.rejectWith(context, [xhr, type, error])
      triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
      ajaxComplete(type, xhr, settings)
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
      var context = settings.context
      settings.complete.call(context, xhr, status)
      triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
      ajaxStop(settings)
    }

    function ajaxDataFilter(data, type, settings) {
      if (settings.dataFilter == empty) return data
      var context = settings.context
      return settings.dataFilter.call(context, data, type)
    }

    // Empty function, used as default callback
    function empty() {}

    $.ajaxJSONP = function(options, deferred) {
      if (!('type' in options)) return $.ajax(options)

      var _callbackName = options.jsonpCallback,
        callbackName = ($.isFunction(_callbackName) ?
          _callbackName() : _callbackName) || ('Zepto' + (jsonpID++)),
        script = document.createElement('script'),
        originalCallback = window[callbackName],
        responseData,
        abort = function(errorType) {
          $(script).triggerHandler('error', errorType || 'abort')
        },
        xhr = {
          abort: abort
        },
        abortTimeout

      if (deferred) deferred.promise(xhr)

      $(script).on('load error', function(e, errorType) {
        clearTimeout(abortTimeout)
        $(script).off().remove()

        if (e.type == 'error' || !responseData) {
          ajaxError(null, errorType || 'error', xhr, options, deferred)
        } else {
          ajaxSuccess(responseData[0], xhr, options, deferred)
        }

        window[callbackName] = originalCallback
        if (responseData && $.isFunction(originalCallback))
          originalCallback(responseData[0])

        originalCallback = responseData = undefined
      })

      if (ajaxBeforeSend(xhr, options) === false) {
        abort('abort')
        return xhr
      }

      window[callbackName] = function() {
        responseData = arguments
      }

      script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
      document.head.appendChild(script)

      if (options.timeout > 0) abortTimeout = setTimeout(function() {
        abort('timeout')
      }, options.timeout)

      return xhr
    }

    $.ajaxSettings = {
      // Default type of request
      type: 'GET',
      // Callback that is executed before request
      beforeSend: empty,
      // Callback that is executed if the request succeeds
      success: empty,
      // Callback that is executed the the server drops error
      error: empty,
      // Callback that is executed on request complete (both: error and success)
      complete: empty,
      // The context for the callbacks
      context: null,
      // Whether to trigger "global" Ajax events
      global: true,
      // Transport
      xhr: function() {
        return new window.XMLHttpRequest()
      },
      // MIME types mapping
      // IIS returns Javascript as "application/x-javascript"
      accepts: {
        script: 'text/javascript, application/javascript, application/x-javascript',
        json: jsonType,
        xml: 'application/xml, text/xml',
        html: htmlType,
        text: 'text/plain'
      },
      // Whether the request is to another domain
      crossDomain: false,
      // Default timeout
      timeout: 0,
      // Whether data should be serialized to string
      processData: true,
      // Whether the browser should be allowed to cache GET responses
      cache: true,
      //Used to handle the raw response data of XMLHttpRequest.
      //This is a pre-filtering function to sanitize the response.
      //The sanitized response should be returned
      dataFilter: empty
    }

    function mimeToDataType(mime) {
      if (mime) mime = mime.split(';', 2)[0]
      return mime && (mime == htmlType ? 'html' :
        mime == jsonType ? 'json' :
        scriptTypeRE.test(mime) ? 'script' :
        xmlTypeRE.test(mime) && 'xml') || 'text'
    }

    function appendQuery(url, query) {
      if (query == '') return url
      return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }

    // serialize payload and append it to the URL for GET requests
    function serializeData(options) {
      if (options.processData && options.data && $.type(options.data) != "string")
        options.data = $.param(options.data, options.traditional)
      if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
        options.url = appendQuery(options.url, options.data), options.data = undefined
    }

    $.ajax = function(options) {
      var settings = $.extend({}, options || {}),
        deferred = $.Deferred && $.Deferred(),
        urlAnchor, hashIndex
      for (key in $.ajaxSettings)
        if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

      ajaxStart(settings)

      if (!settings.crossDomain) {
        urlAnchor = document.createElement('a')
        urlAnchor.href = settings.url
        // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
        urlAnchor.href = urlAnchor.href
        settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
      }

      if (!settings.url) settings.url = window.location.toString()
      if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex)
      serializeData(settings)

      var dataType = settings.dataType,
        hasPlaceholder = /\?.+=\?/.test(settings.url)
      if (hasPlaceholder) dataType = 'jsonp'

      if (settings.cache === false || (
          (!options || options.cache !== true) &&
          ('script' == dataType || 'jsonp' == dataType)
        ))
        settings.url = appendQuery(settings.url, '_=' + Date.now())

      if ('jsonp' == dataType) {
        if (!hasPlaceholder)
          settings.url = appendQuery(settings.url,
            settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
        return $.ajaxJSONP(settings, deferred)
      }

      var mime = settings.accepts[dataType],
        headers = {},
        setHeader = function(name, value) {
          headers[name.toLowerCase()] = [name, value]
        },
        protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
        xhr = settings.xhr(),
        nativeSetHeader = xhr.setRequestHeader,
        abortTimeout

      if (deferred) deferred.promise(xhr)

      if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
      setHeader('Accept', mime || '*/*')
      if (mime = settings.mimeType || mime) {
        if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
        xhr.overrideMimeType && xhr.overrideMimeType(mime)
      }
      if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
        setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

      if (settings.headers)
        for (name in settings.headers) setHeader(name, settings.headers[name])
      xhr.setRequestHeader = setHeader

      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          xhr.onreadystatechange = empty
          clearTimeout(abortTimeout)
          var result, error = false
          if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
            dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))

            if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
              result = xhr.response
            else {
              result = xhr.responseText

              try {
                // http://perfectionkills.com/global-eval-what-are-the-options/
                // sanitize response accordingly if data filter callback provided
                result = ajaxDataFilter(result, dataType, settings)
                if (dataType == 'script')(1, eval)(result)
                else if (dataType == 'xml') result = xhr.responseXML
                else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
              } catch (e) {
                error = e
              }

              if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred)
            }

            ajaxSuccess(result, xhr, settings, deferred)
          } else {
            ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
          }
        }
      }

      if (ajaxBeforeSend(xhr, settings) === false) {
        xhr.abort()
        ajaxError(null, 'abort', xhr, settings, deferred)
        return xhr
      }

      var async = 'async' in settings ? settings.async : true
      xhr.open(settings.type, settings.url, async, settings.username, settings.password)

      if (settings.xhrFields)
        for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

      for (name in headers) nativeSetHeader.apply(xhr, headers[name])

      if (settings.timeout > 0) abortTimeout = setTimeout(function() {
        xhr.onreadystatechange = empty
        xhr.abort()
        ajaxError(null, 'timeout', xhr, settings, deferred)
      }, settings.timeout)

      // avoid sending empty string (#319)
      xhr.send(settings.data ? settings.data : null)
      return xhr
    }

    // handle optional data/success arguments
    function parseArguments(url, data, success, dataType) {
      if ($.isFunction(data)) dataType = success, success = data, data = undefined
      if (!$.isFunction(success)) dataType = success, success = undefined
      return {
        url: url,
        data: data,
        success: success,
        dataType: dataType
      }
    }

    $.get = function( /* url, data, success, dataType */ ) {
      return $.ajax(parseArguments.apply(null, arguments))
    }

    $.post = function( /* url, data, success, dataType */ ) {
      var options = parseArguments.apply(null, arguments)
      options.type = 'POST'
      return $.ajax(options)
    }

    $.getJSON = function( /* url, data, success */ ) {
      var options = parseArguments.apply(null, arguments)
      options.dataType = 'json'
      return $.ajax(options)
    }

    $.fn.load = function(url, data, success) {
      if (!this.length) return this
      var self = this,
        parts = url.split(/\s/),
        selector,
        options = parseArguments(url, data, success),
        callback = options.success
      if (parts.length > 1) options.url = parts[0], selector = parts[1]
      options.success = function(response) {
        self.html(selector ?
          $('<div>').html(response.replace(rscript, "")).find(selector) :
          response)
        callback && callback.apply(self, arguments)
      }
      $.ajax(options)
      return this
    }

    var escape = encodeURIComponent

    function serialize(params, obj, traditional, scope) {
      var type, array = $.isArray(obj),
        hash = $.isPlainObject(obj)
      $.each(obj, function(key, value) {
        type = $.type(value)
        if (scope) key = traditional ? scope :
          scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
        // handle data in serializeArray() format
        if (!scope && array) params.add(value.name, value.value)
        // recurse into nested objects
        else if (type == "array" || (!traditional && type == "object"))
          serialize(params, value, traditional, key)
        else params.add(key, value)
      })
    }

    $.param = function(obj, traditional) {
      var params = []
      params.add = function(key, value) {
        if ($.isFunction(value)) value = value()
        if (value == null) value = ""
        this.push(escape(key) + '=' + escape(value))
      }
      serialize(params, obj, traditional)
      return params.join('&').replace(/%20/g, '+')
    }
  })(Zepto)

  ;
  (function($) {
    $.fn.serializeArray = function() {
      var name, type, result = [],
        add = function(value) {
          if (value.forEach) return value.forEach(add)
          result.push({
            name: name,
            value: value
          })
        }
      if (this[0]) $.each(this[0].elements, function(_, field) {
        type = field.type, name = field.name
        if (name && field.nodeName.toLowerCase() != 'fieldset' &&
          !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
          ((type != 'radio' && type != 'checkbox') || field.checked))
          add($(field).val())
      })
      return result
    }

    $.fn.serialize = function() {
      var result = []
      this.serializeArray().forEach(function(elm) {
        result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
      })
      return result.join('&')
    }

    $.fn.submit = function(callback) {
      if (0 in arguments) this.bind('submit', callback)
      else if (this.length) {
        var event = $.Event('submit')
        this.eq(0).trigger(event)
        if (!event.isDefaultPrevented()) this.get(0).submit()
      }
      return this
    }

  })(Zepto)

  ;
  (function() {
    // getComputedStyle shouldn't freak out when called
    // without a valid element as argument
    try {
      getComputedStyle(undefined)
    } catch (e) {
      var nativeGetComputedStyle = getComputedStyle
      window.getComputedStyle = function(element, pseudoElement) {
        try {
          return nativeGetComputedStyle(element, pseudoElement)
        } catch (e) {
          return null
        }
      }
    }
  })()
  return Zepto
}))

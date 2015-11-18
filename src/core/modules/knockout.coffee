#
# Custom Knockout.js binding handlers
#
# init:
#   This will be called when the binding is first applied to an element
#   Set up any initial state, event handlers, etc. here
#
# update:
#   This will be called once when the binding is first applied to an element,
#    and again whenever the associated observable changes value.
#   Update the DOM element based on the supplied values here.
#
# Registering a callback on the disposal of an element
# 
# To register a function to run when a node is removed, you can call ko.utils.domNodeDisposal.addDisposeCallback(node, callback). As an example, suppose you create a custom binding to instantiate a widget. When the element with the binding is removed, you may want to call the destroy method of the widget:
# 
# ko.bindingHandlers.myWidget = {
#     init: function(element, valueAccessor) {
#         var options = ko.unwrap(valueAccessor()),
#             $el = $(element);
#  
#         $el.myWidget(options);
#  
#         ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
#             // This will be called when the element is removed by Knockout or
#             // if some other part of your code calls ko.removeNode(element)
#             $el.myWidget("destroy");
#         });
#     }
# };
# 

return unless window?.ko?

ko.bindingHandlers.raw =
  update: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    arg = ko.unwrap valueAccessor()
    if arg
      $element = $ element
      $element.empty()
      $element.append arg
    return

ko.bindingHandlers.markdown =
  update: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    data = ko.unwrap valueAccessor()
    try
      html = marked data or ''
    catch error
      html = error.message or 'Error rendering markdown.'

    $(element).html html

ko.bindingHandlers.stringify =
  update: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    data = ko.unwrap valueAccessor()

    $(element).text JSON.stringify data, null, 2

ko.bindingHandlers.enterKey =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    if action = ko.unwrap valueAccessor() 
      if isFunction action
        $element = $ element
        $element.keydown (e) -> 
          if e.which is 13
            action viewModel
          return
      else
        throw 'Enter key action is not a function'
    return

ko.bindingHandlers.typeahead =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    if action = ko.unwrap valueAccessor() 
      if isFunction action
        $element = $ element
        $element.typeahead null,
          displayKey: 'value'
          source: action
      else
        throw 'Typeahead action is not a function'
    return

ko.bindingHandlers.cursorPosition =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    if arg = ko.unwrap valueAccessor()
      # Bit of a hack. Attaches a method to the bound object that returns the cursor position. Uses dwieeb/jquery-textrange.
      arg.getCursorPosition = -> $(element).textrange 'get', 'position'
    return

ko.bindingHandlers.autoResize =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    if arg = ko.unwrap valueAccessor()
      # Bit of a hack. Attaches a method to the bound object that resizes the element to fit its content.
      arg.autoResize = resize = -> defer ->
        $el
          .css 'height', 'auto'
          .height element.scrollHeight

      $el = $(element).on 'input', resize

      resize()
    return

ko.bindingHandlers.scrollIntoView =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    if arg = ko.unwrap valueAccessor()
      # Bit of a hack. Attaches a method to the bound object that scrolls the cell into view
      $el = $ element
      $viewport = $el.closest '.flow-box-notebook'
      arg.scrollIntoView = (immediate=no) ->
        # height hidden by the top of the viewport
        position = $viewport.scrollTop()
        # position().top is the distance between the top of the element
        #  and the top of the viewport, so add hidden height to it.
        top = $el.position().top + position
        height = $viewport.height()
        # scroll if element is outside the viewport
        if top - 20 < position or top + 20 > position + height 
          if immediate
            $viewport.scrollTop top
          else
            $viewport.animate { scrollTop: top }, 'fast'

    return

ko.bindingHandlers.collapse =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    caretDown = 'fa-caret-down'
    caretRight = 'fa-caret-right'
    isCollapsed = ko.unwrap valueAccessor()
    caretEl = document.createElement 'i'
    caretEl.className = 'fa'
    caretEl.style.marginRight = '3px'
    element.insertBefore caretEl, element.firstChild
    $el = $ element
    $nextEl = $el.next()
    throw new Error 'No collapsible sibling found' unless $nextEl.length
    $caretEl = $ caretEl
    toggle = ->
      if isCollapsed
        $caretEl
          .removeClass caretDown
          .addClass caretRight
        $nextEl.hide()
      else
        $caretEl
          .removeClass caretRight
          .addClass caretDown
        $nextEl.show()
      isCollapsed = not isCollapsed

    $el.css 'cursor', 'pointer'
    $el.attr 'title', 'Click to expand/collapse'
    $el.on 'click', toggle
    toggle()
    ko.utils.domNodeDisposal.addDisposeCallback element, ->
      $el.off 'click'
    return
 
ko.bindingHandlers.dom =
  update: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    arg = ko.unwrap valueAccessor()
    if arg
      $element = $ element
      $element.empty()
      $element.append arg
    return

ko.bindingHandlers.dump =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    object = ko.unwrap valueAccessor()

ko.bindingHandlers.element =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    valueAccessor() element

ko.bindingHandlers.file =
  init: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    file = valueAccessor()
    if file
      $file = $ element
      $file.change -> file @files[0]
    return

ko.bindingHandlers.codemirror =
    init:  (element, valueAccessor, allBindingsAccessor) ->
        typed = false
        options = $.extend valueAccessor(), {
            onChange: (cm) ->
                    typed = true
                    allBindingsAccessor().value(cm.getValue())
                    typed = false
        }

        editor = CodeMirror.fromTextArea element, options
        editor.setSize(200, 100);
        editor.on 'change', (cm) ->
          value = ko.unwrap(valueAccessor()).value
          if ko.isObservable(value)
            value cm.getValue()
          else
            ko.unwrap(valueAccessor()).value = cm.getValue()

        element.editor = editor
        editor.setValue(allBindingsAccessor().value())
        editor.refresh()
        wrapperElement = $(editor.getWrapperElement()) 

        ko.utils.domNodeDisposal.addDisposeCallback element, -> 
            wrapperElement.remove()
    
        allBindingsAccessor().value.subscribe (newValue) ->
            if !typed
                editor.setValue(newValue)
                editor.refresh()

  

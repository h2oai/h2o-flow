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
      arg.scrollIntoView = ->
        # height hidden by the top of the viewport
        position = $viewport.scrollTop()
        # position().top is the distance between the top of the element
        #  and the top of the viewport, so add hidden height to it.
        top = $el.position().top + position
        height = $viewport.height()
        # scroll if element is outside the viewport
        if top - 20 < position or top + 20 > position + height 
          $viewport.animate { scrollTop: top }, 'fast'

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


return unless window?.ko?

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
      arg.read = -> $(element).textrange 'get', 'position'
    return

ko.bindingHandlers.autoResize =
  update: (element, valueAccessor, allBindings, viewModel, bindingContext) ->
    resize = -> defer ->
      $el
        .css 'height', 'auto'
        .height element.scrollHeight

    $el = $(element).on 'input', resize

    resize()
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


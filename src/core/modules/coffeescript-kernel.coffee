{ map, isArray, keyBy, values } = require("lodash")
{ isObject } = require('./prelude')

esprima = require('esprima')
escodegen = require('escodegen')
CoffeeScript = require('coffeescript')

FlowError = require('./flow-error')

module.exports = do ->
  safetyWrapCoffeescript = (guid) ->
    (cs, go) ->
      lines = cs
        # normalize CR/LF
        .replace /[\n\r]/g, '\n'
        # split into lines
        .split '\n'

      # indent once
      block = map lines, (line) -> '  ' + line

      # enclose in execute-immediate closure
      block.unshift "_h2o_results_['#{guid}'].result do ->"

      # join and proceed
      go null, block.join '\n'

  compileCoffeescript = (cs, go) ->
    try
      go null, CoffeeScript.compile cs, bare: yes
    catch error
      go new FlowError 'Error compiling coffee-script', error

  parseJavascript = (js, go) ->
    try
      go null, esprima.parse js
    catch error
      go new FlowError 'Error parsing javascript expression', error


  identifyDeclarations = (node) ->
    return null unless node

    switch node.type
      when 'VariableDeclaration'
        return (name: declaration.id.name, object:'_h2o_context_' for declaration in node.declarations when declaration.type is 'VariableDeclarator' and declaration.id.type is 'Identifier')
          
      when 'FunctionDeclaration'
        #
        # XXX Not sure about the semantics here.
        #
        if node.id.type is 'Identifier'
          return [ name: node.id.name, object: '_h2o_context_' ]
      when 'ForStatement'
        return identifyDeclarations node.init
      when 'ForInStatement', 'ForOfStatement'
        return identifyDeclarations node.left
    return null

  parseDeclarations = (block) ->
    identifiers = []
    for node in block.body
      if declarations = identifyDeclarations node
        for declaration in declarations
          identifiers.push declaration
    keyBy identifiers, (identifier) -> identifier.name

  traverseJavascript = (parent, key, node, f) ->
    if isArray node
      i = node.length
      # walk backwards to allow callers to delete nodes
      while i--
        child = node[i]
        if isObject child
          traverseJavascript node, i, child, f
          f node, i, child
    else 
      for i, child of node
        if isObject child
          traverseJavascript node, i, child, f
          f node, i, child
    return

  deleteAstNode = (parent, i) ->
    if isArray parent
      parent.splice i, 1
    else if isObject parent
      delete parent[i]

  createLocalScope = (node) ->
    # parse all declarations in this scope
    localScope = parseDeclarations node.body

    # include formal parameters
    for param in node.params when param.type is 'Identifier'
      localScope[param.name] = name: param.name, object: 'local'

    localScope

  # redefine scope by coalescing down to non-local identifiers
  coalesceScopes = (scopes) ->
    currentScope = {}
    for scope, i in scopes
      if i is 0
        for name, identifier of scope
          currentScope[name] = identifier
      else
        for name, identifier of scope
          currentScope[name] = null
    currentScope

  traverseJavascriptScoped = (scopes, parentScope, parent, key, node, f) ->
    isNewScope = node.type is 'FunctionExpression' or node.type is 'FunctionDeclaration'
    if isNewScope
      # create and push a new local scope onto scope stack
      scopes.push createLocalScope node
      currentScope = coalesceScopes scopes
    else
      currentScope = parentScope

    for key, child of node
      if isObject child
        traverseJavascriptScoped scopes, currentScope, node, key, child, f
        f currentScope, node, key, child 

    if isNewScope
      # discard local scope
      scopes.pop()

    return

  createRootScope = (sandbox) ->
    (program, go) ->
      try
        rootScope = parseDeclarations program.body[0].expression.arguments[0].callee.body

        for name of sandbox.context
          rootScope[name] =
            name: name
            object: '_h2o_context_'
        go null, rootScope, program

      catch error
        go new FlowError 'Error parsing root scope', error

  #TODO DO NOT call this for raw javascript:
  # Require alternate strategy: 
  #   Declarations with 'var' need to be local to the cell.
  #   Undeclared identifiers are assumed to be global.
  #   'use strict' should be unsupported.
  removeHoistedDeclarations = (rootScope, program, go) ->
    try
      traverseJavascript null, null, program, (parent, key, node) ->
        if node.type is 'VariableDeclaration'		
          declarations = node.declarations.filter (declaration) ->		
            declaration.type is 'VariableDeclarator' and declaration.id.type is 'Identifier' and not rootScope[declaration.id.name]		
          if declarations.length is 0
            # purge this node so that escodegen doesn't fail		
            deleteAstNode parent, key		
          else		
            # replace with cleaned-up declarations
            node.declarations = declarations
      go null, rootScope, program
    catch error
      go new FlowError 'Error rewriting javascript', error


  createGlobalScope = (rootScope, routines) ->
    globalScope = {}

    for name, identifier of rootScope
      globalScope[name] = identifier

    for name of routines
      globalScope[name] = name: name, object: 'h2o'

    globalScope

  rewriteJavascript = (sandbox) ->
    (rootScope, program, go) ->
      globalScope = createGlobalScope rootScope, sandbox.routines 

      try
        traverseJavascriptScoped [ globalScope ], globalScope, null, null, program, (globalScope, parent, key, node) ->
          if node.type is 'Identifier'
            return if parent.type is 'VariableDeclarator' and key is 'id' # ignore var declarations
            return if key is 'property' # ignore members
            return unless identifier = globalScope[node.name]

            # qualify identifier with '_h2o_context_'
            parent[key] =
              type: 'MemberExpression'
              computed: no
              object:
                type: 'Identifier'
                name: identifier.object
              property:
                type: 'Identifier'
                name: identifier.name
        go null, program
      catch error
        go new FlowError 'Error rewriting javascript', error


  generateJavascript = (program, go) ->
    try
      go null, escodegen.generate program
    catch error
      return go new FlowError 'Error generating javascript', error

  compileJavascript = (js, go) ->
    try
      closure = new Function 'h2o', '_h2o_context_', '_h2o_results_', 'print', js
      go null, closure
    catch error
      go new FlowError 'Error compiling javascript', error

  executeJavascript = (sandbox, print) ->
    (closure, go) ->
      try
        go null, closure sandbox.routines, sandbox.context, sandbox.results, print
      catch error
        go new FlowError 'Error executing javascript', error

  
  safetyWrapCoffeescript: safetyWrapCoffeescript
  compileCoffeescript: compileCoffeescript
  parseJavascript: parseJavascript
  createRootScope: createRootScope
  removeHoistedDeclarations: removeHoistedDeclarations
  rewriteJavascript: rewriteJavascript
  generateJavascript: generateJavascript
  compileJavascript: compileJavascript
  executeJavascript: executeJavascript

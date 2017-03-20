[![Join the chat at https://gitter.im/h2oai/h2o-flow](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/h2oai/h2o-flow?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# H2O Flow

*H2O Flow* is a web-based interactive computational environment where you can combine code execution, text, mathematics, plots and rich media to build machine learning workflows.

Think of Flow as a code notebook: a hybrid [GUI](https://en.wikipedia.org/wiki/Graphical_user_interface) + [REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) + storytelling environment for exploratory data analysis and machine learning, with async, re-scriptable record/replay capabilities. 

Flow is written in standard [es2015](https://babeljs.io/learn-es2015/) [Javascript](https://en.wikipedia.org/wiki/JavaScript). Flow uses the [Pug](https://github.com/pugjs/pug) templating engine _(formerly known as [Jade](https://github.com/pugjs/pug#rename-from-jade))_ to define HTML views and lay out pages.  Flow uses the [KnockoutJS](https://github.com/knockout/knockout) Model-View-View-Model library for declarative data binding.  

Flow contains a veritable heap of little embedded [DSL](https://en.wikipedia.org/wiki/Domain-specific_language)s for reactive [dataflow programming](https://en.wikipedia.org/wiki/Dataflow_programming), markup generation, lazy evaluation and multicast signals/slots. Flow sandboxes and evaluates user-Javascript in the browser via static analysis and tree-rewriting. 

## Docs

there is a nice [user guide](https://github.com/h2oai/h2o-3/blob/8858aac90dce771f9025b16948b675f92b542715/h2o-docs/src/product/flow/README.md) for *H2O Flow* housed over in the [h2o-3](https://github.com/h2oai/h2o-3) repo

## Development Instructions

It is recommended that you clone [h2o-3](https://github.com/h2oai/h2o-3) and h2o-flow in the same parent directory. 

If you develop for Flow from a Java [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) like [IntelliJ IDEA](https://www.jetbrains.com/idea/) or [Eclipse](https://eclipse.org/users/), you can see your changes to Flow in the browser immediately after you run the `make` command, without waiting to build a new H2O binary and restart H2O.  

If you have not already, follow these instructions to  [set up your preferred IDE environment](https://github.com/h2oai/h2o-3#47-setting-up-your-preferred-ide-environment) for [h2o-3](https://github.com/h2oai/h2o-3) development.  
    
### Within IDEA/Eclipse

1. First, clean up all built files:  `cd h2o-3 && ./gradlew clean`
2. Open up [h2o-3](https://github.com/h2oai/h2o-3) in IDEA, build and launch `H2OApp`.
3. Run `cd h2o-flow && make install`. You can now access and debug Flow at [http://localhost:54321/](http://localhost:54321/)
4. After each change to h2o-flow sources, run the command `cd h2o-flow && make` to push your changes to the running instance of [h2o-3](https://github.com/h2oai/h2o-3).

### Testing a new Flow Feature with Sparkling Water  

Flow can also be used with [Sparkling Water](https://github.com/h2oai/sparkling-water)  
Follow this guide develop and test new Sparkling Water features in Flow.  
adapted from the comments on this PR https://github.com/h2oai/h2o-flow/pull/13  

##### copy built js files from one place to another  
in the `h2o-3` directory run:  
`cp h2o-web/src/main/resources/www/flow/js/* h2o-web/lib/h2o-flow/build/js/`  

##### build h2o-3  
in the `h2o-3` directory run:  
`./gradlew publishToMavenLocal -x test`  

##### build sparkling water  
in `sparkling-water` directory run:  
`./gradlew clean build -x test -x integTest`  

##### open the Sparkling Water Shell  
in `sparkling-water` directory run:  
`bin/sparkling-shell`  

in the sparkling water shell  
at the `scala>` prompt run:  
`import org.apache.spark.h2o._`  
`H2OContext.getOrCreate(sc)`  

now open Flow at the IP address specified  
in the sparkling water shell  

now test your changes in Flow  

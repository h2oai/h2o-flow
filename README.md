[![Join the chat at https://gitter.im/h2oai/h2o-flow](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/h2oai/h2o-flow?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# H2O Flow

*H2O Flow* is a web-based interactive computational environment where you can combine code execution, 
text, mathematics, plots and rich media to build machine learning workflows.

Think of Flow as a hybrid [GUI](https://en.wikipedia.org/wiki/Graphical_user_interface) + 
[REPL](https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop) + storytelling environment for 
exploratory data analysis and machine learning, with async, re-scriptable record/replay capabilities. 
Flow sandboxes and evals user-Javascript in the browser via static analysis and tree-rewriting. 
Flow is written in CoffeeScript, with a veritable heap of little embedded 
[DSL](https://en.wikipedia.org/wiki/Domain-specific_language)s for reactive 
[dataflow programming](https://en.wikipedia.org/wiki/Dataflow_programming), markup generation, 
lazy evaluation and multicast signals/slots.

## Docs

There is a nice [user guide](https://github.com/h2oai/h2o-3/blob/8858aac90dce771f9025b16948b675f92b542715/h2o-docs/src/product/flow/README.md) 
for *H2O Flow* housed over in the [h2o-3](https://github.com/h2oai/h2o-3) repo.

## Development Setup

It is recommended that you clone [h2o-3](https://github.com/h2oai/h2o-3) and h2o-flow in the same parent directory. 

If you have not already, follow these instructions to  [set up your preferred IDE environment](https://github.com/h2oai/h2o-3#47-setting-up-your-preferred-ide-environment) 
for [h2o-3](https://github.com/h2oai/h2o-3) development.  
    
1. First build H2O-3  `cd h2o-3 && ./gradlew build -x test` (in h2o-E)

1. Install npm dependencies for h2o-flow `npm i` (in h2o-flow)

### Developing with live reload

1. Start H2O-3 with CORS checks disabled `java -Dsys.ai.h2o.disable.cors=true -jar build/h2o.jar` (in h2o-3)

1. Start webpack dev-server `npm run start` (in h2o-flow)

This will open a browser window with auto-refreshing dev server.


### Development within h2o-3 instance

1. Run `make` command. This will copy the build resources into the neighbouring h2o-3 directory.

2. Start h2o-3 from IDE without running gradle (which would write over your local flow build)

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

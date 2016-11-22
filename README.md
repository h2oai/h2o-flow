# H2O Flow

*H2O Flow* is a web-based interactive computational environment where you can combine code execution, text, mathematics, plots and rich media to build machine learning workflows.

## Development Instructions

It is recommended that you clone h2o-3 and h2o-flow in the same parent directory. 

If you develop for Flow from a Java [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) like [IntelliJ IDEA](https://www.jetbrains.com/idea/) or [Eclipse](https://eclipse.org/users/), you can see your changes to Flow in the browser immediately, without building a new H2O binary and restarting H2O.  

If you have not already, follow these instructions to  [set up your preferred IDE environment](https://github.com/h2oai/h2o-3#47-setting-up-your-preferred-ide-environment) for h2o-3 development.  
    
### Within IDEA/Eclipse

1. First, clean up all built files:  `cd h2o-3 && ./gradlew clean`
2. Open up h2o-3 in IDEA, build and launch `H2OApp`.
3. Run `cd h2o-flow && make install`. You can now access and debug Flow at http://localhost:54321/.
4. After each change to h2o-flow sources, run the command `cd h2o-flow && make` to push your changes to the running instance of h2o-3.

### Phantom JS installation notes

The task `npm run headless` requires installing [Phantom JS](http://phantomjs.org).

Note:
Phantom JS refuses to run on OSX Yosemite, and requires [this fix](https://github.com/ariya/phantomjs/issues/12900):

    brew install upx
    upx -d bin/phantomjs

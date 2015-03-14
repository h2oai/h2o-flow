# H2O Flow

*H2O Flow* is a web-based interactive computational environment where you can combine code execution, text, mathematics, plots and rich media to build machine learning workflows.

## Development Instructions

It is recommended that you clone h2o-dev and h2o-flow under the same parent directory. The following steps will enable you to develop on Flow without having to restart H2O. 
    
### Within IDEA/Eclipse

1. First, clean up all built files:  `cd h2o-dev && ./gradlew clean`
2. Open up h2o-dev in IDEA, build and launch `H2OApp`.
3. Run `cd h2o-flow && make`. You can now access and debug Flow at http://localhost:54321/.
4. After each change to h2o-flow sources, run the same command `cd h2o-flow && make` to push your changes to the running instance of h2o-dev.

### Phantom JS installation notes

The task `npm run headless` requires installing [Phantom JS](http://phantomjs.org).

Note:
Phantom JS refuses to run on OSX Yosemite, and requires [this fix](https://github.com/ariya/phantomjs/issues/12900):

    brew install upx
    upx -d bin/phantomjs

# H2O Flow

*H2O Flow* is a web-based interactive computational environment where you can combine code execution, text, mathematics, plots and rich media to build machine learning workflows.

## Instructions

### Standalone

To build and integrate H2O Flow with H2O Dev, intall Node.js on your operating system (see below), then run:

    cd path/to/h2o-flow
    npm start --output=../h2o-dev/h2o-web/src/main/resources/www/flow
    cd ../h2o-dev && ./gradlew build -x test
    java -Xmx4g -jar build/h2o.jar

...and then navigate to http://localhost:54321/flow/index.html
    
### Within IDEA/Eclipse

    cd path/to/h2o-flow
    npm start --output=/path/to/h2o-dev/h2o-web/src/main/resources/www/flow

You can now build and run `h2o-dev` in IDEA/Eclipse and access *Flow* at http://localhost:54321/flow/index.html

### Additional notes

Alternatively, you can set the environment variable `FLOW_DEPLOY_DIR` and then run:

    export FLOW_DEPLOY_DIR=/path/to/h2o-dev/h2o-web/src/main/resources/www/flow
    cd path/to/h2o-flow
    npm start
    cd path/to/h2o-dev && ./gradlew build -x test
    java -Xmx4g -jar build/h2o.jar

...and then navigate to http://localhost:54321/flow/index.html

## Installing Node.js

- **OSX** Run `brew install node`.
- **Linux** Install Node.js by following the instructions on the [Node.js wiki](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager), and then:
- **Windows** Install Node.js [using the official installer](http://nodejs.org/download/). When done, you should have node.exe and npm.cmd in `\Program Files\node\`. These should also be available on your PATH. If not, add the folder to your PATH.

# H2O Flow

*H2O Flow* is a web-based interactive computational environment where you can combine code execution, text, mathematics, plots and rich media to build machine learning workflows.

## OSX

Install Node.js using `brew install node`, and then:

    cd path/to/h2o-flow
    npm install
    npm start --output=/path/to/h2o-dev/h2o-web/src/main/resources/www/flow
    # You can now build+run h2o-dev in IDEA/Eclipse and go to http://localhost:54321/flow/index.html
    #
    # Optionally, build the fat jar:
    cd path/to/h2o-dev && gradle build -x test
    java -Xmx4g -jar build/h2o.jar
    # ...and then navigate to http://localhost:54321/flow/index.html

## Linux

Install Node.js by following the instructions on the [Node.js wiki](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager), and then:

    cd path/to/h2o-flow
    npm install
    npm start --output=/path/to/h2o-dev/h2o-web/src/main/resources/www/flow
    # You can now build+run h2o-dev in IDEA/Eclipse and go to http://localhost:54321/flow/index.html
    #
    # Optionally, build the fat jar:
    cd path/to/h2o-dev && gradle build -x test
    java -Xmx4g -jar build/h2o.jar
    # ...and then navigate to http://localhost:54321/flow/index.html

## Windows

Install Node.js [using the official installer](http://nodejs.org/download/). When done, you should have node.exe and npm.cmd in `\Program Files\node\`. These should also be available on your PATH. If not, add the folder to your PATH.

    cd path\to\h2o-flow
    npm install
    npm start --output=\path\to\h2o-dev\h2o-web\src\main\resources\www\flow
    # You can now build+run h2o-dev in IDEA/Eclipse and go to http://localhost:54321/flow/index.html
    #
    # Optionally, build the fat jar:
    cd path\to\h2o-dev
    gradle build -x test
    java -Xmx4g -jar build/h2o.jar
    # ...and then navigate to http://localhost:54321/flow/index.html


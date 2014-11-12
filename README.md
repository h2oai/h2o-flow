# H2O Flow

*H2O Flow* is a web-based interactive computational environment where you can combine code execution, text, mathematics, plots and rich media to build machine learning workflows.

## Instructions

### STEP 1: Building h2o-flow using Gradle and publishing to Maven local

Take note of the flow **_version_** you are using.

`$ cat gradle.properties | grep version`  

```
version=0.2.3-SNAPSHOT
```

Build and install flow to **_mavenLocal_**.

`$ ./gradlew install`  

```
:compileJava UP-TO-DATE
:checkClientPrerequisites UP-TO-DATE
:installNpmPackages
:installBowerPackages
:buildClientWithGulp
[14:38:15] Requiring external module coffee-script/register
[14:38:16] Using gulpfile ~/0xdata/ws/h2o-flow/gulpfile.coffee
[14:38:16] Starting 'build-libs'...
[14:38:16] Starting 'build-scripts'...
[14:38:16] Starting 'build-templates'...
[14:38:16] Starting 'build-styles'...
[14:38:17] Finished 'build-styles' after 1.09 s
[14:38:17] Finished 'build-templates' after 1.09 s
[14:38:17] Finished 'build-libs' after 1.11 s
[14:38:18] Finished 'build-scripts' after 2.03 s
[14:38:18] Starting 'build'...
[14:38:18] Finished 'build' after 6.38 μs
[14:38:18] Starting 'default'...
[14:38:18] Finished 'default' after 6.08 μs
:processResources UP-TO-DATE
:classes UP-TO-DATE
:jar
:javadoc UP-TO-DATE
:javadocJar
:sourcesJar
:signArchives SKIPPED
:install

BUILD SUCCESSFUL

Total time: 9.644 secs
```

### STEP 2: Update h2o-dev build.gradle to use this version of flow from mavenLocal

Change h2o-dev/build.gradle so that the **_h2oFlowVersion_** matches what you just published, and that you have enabled the **_mavenLocal_** repository.

```
$ git diff
diff --git a/build.gradle b/build.gradle
index f02ee23..a141222 100644
--- a/build.gradle
+++ b/build.gradle
@@ -57,7 +57,7 @@ ext {
     hadoopVersion = '2.5.0-cdh5.2.0'
     jets3tVersion = '0.7.1'
     awsJavaSdkVersion = '1.8.3'
-    h2oFlowVersion = '0.2.2'
+    h2oFlowVersion = '0.2.3-SNAPSHOT'
 }

 //
@@ -88,7 +88,7 @@ subprojects {
         maven {
           url "http://repo.hortonworks.com/content/repositories/releases/"
         }
-        // mavenLocal()
+        mavenLocal()
     }
     // Publish artifacts - we should filter subproject in future but now apply publisher plugin
     // to all projects
```


---

# DEPRECATED

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

default:
	npm run build
	cp -r build/* ../h2o-3/h2o-web/src/main/resources/www/flow/

install:
	npm install

build:
	npm run build

clean:
	npm run clean

watch:
	npm run watch

start:
	npm run start

launch:
	java -Dwebdev=1 -Xmx4g -jar ../h2o-3/build/h2o.jar

unit-test:
	npm run test

test-raw:
	npm run test-raw

test:
	npm run headless

.PHONY: default install build watch start clean unit-test test-raw test launch

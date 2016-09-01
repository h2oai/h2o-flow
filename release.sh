set -e

FLOW_VERSION="$1"

#git pull --rebase

#npm run build

sed -E "s/.+version.+/  \"version\": \"$FLOW_VERSION\",/" bower.json > bower.json.tmp && mv bower.json.tmp bower.json
sed -E "s/999\.999\.999/$FLOW_VERSION/" build/js/flow.js > build/js/flow.js.tmp && mv build/js/flow.js.tmp build/js/flow.js

git add .
git commit -m "Release $FLOW_VERSION"
git push
git tag -a $FLOW_VERSION -m "$FLOW_VERSION"
git push --tags

set -e

FLOW_VERSION="$1"

git pull --rebase

sed -E "s/.+version.+/  \"version\": \"$FLOW_VERSION\",/" bower.json > bower.json.tmp && mv bower.json.tmp bower.json

git add .
git commit -m "Release $FLOW_VERSION"
git push
git tag -a $FLOW_VERSION -m "$FLOW_VERSION"
git push --tags

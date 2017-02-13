export default function onResourceError(_arg) {
  const url = _arg.url;
  const errorString = _arg.errorString;
  return console.log(`BROWSER: *** RESOURCE ERROR *** ${url}: ${errorString}`);
}

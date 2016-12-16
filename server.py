from notebook.base.handlers import IPythonHandler, AuthenticatedFileHandler
from notebook.utils import url_path_join


from urlparse import urlparse

import tornado.httpserver
import tornado.ioloop
import tornado.web
import tornado.httpclient

import re
import subprocess
import sys
import threading

from tornado import web

PORT=8888

client = tornado.httpclient.AsyncHTTPClient(max_clients=1000)


def get_proxy(url):
  #url_parsed = urlparse(url, scheme='http')
  #proxy_key = '%s_proxy' % url_parsed.scheme
  # return os.environ.get(proxy_key)
  return 'localhost:54321'


def parse_proxy(proxy):
  proxy_parsed = urlparse(proxy, scheme='http')
  #return proxy_parsed.hostname, proxy_parsed.port
  return "localhost", 54321


class FlowProxyHandler(IPythonHandler):

  SUPPORTED_METHODS = ['GET', 'POST']

  def __handle_proxy_response(self, response):
    if (response.error and not
            isinstance(response.error, tornado.httpclient.HTTPError)):
      self.set_status(500)
      self.write('Proxy Internal server error:\n' + str(response.error))
      raise response.error
    else:
      self.set_status(response.code, response.reason)
      self._headers = tornado.httputil.HTTPHeaders()  # clear tornado default header

      for header, v in response.headers.get_all():
        if header not in ('Content-Length', 'Transfer-Encoding',
                          'Content-Encoding', 'Connection'):
          # some header appear multiple times, eg 'Set-Cookie'
          self.add_header(header, v)

      if response.body:
        self.set_header('Content-Length', len(response.body))
        self.write(response.body)

  def callback(self, response):
    try:
      self.__handle_proxy_response(response)
    except:
      import traceback
      traceback.print_exc()
    finally:
      self.finish()

  def fetch_request(self, url, callback, **kwargs):
    proxy = get_proxy(url)
    if proxy:
        tornado.httpclient.AsyncHTTPClient.configure(
            'tornado.curl_httpclient.CurlAsyncHTTPClient')
        host, port = parse_proxy(proxy)
        # kwargs['proxy_host'] = host
        # kwargs['proxy_port'] = port
        # print(kwargs)
    url = 'http://' + host + ':' + str(port) + url
    print(url)
    req = tornado.httpclient.HTTPRequest(url, **kwargs)
    #client = tornado.httpclient.AsyncHTTPClient()
    client.fetch(req, callback, raise_error=True)

  @tornado.web.asynchronous
  def get(self, *args):
    self.fetch_request(
        self.request.uri, self.callback,
        method=self.request.method, body=self.request.body,
        headers=self.request.headers, follow_redirects=False,
        allow_nonstandard_methods=True)

  @tornado.web.asynchronous
  def post(self, *args):
    return self.get(*args)


class FlowHandler(IPythonHandler):

  def get(self, *args):
    self.finish('{}')


class MainPageHandler(AuthenticatedFileHandler):
    """static files should only be accessible when logged in"""

    @web.authenticated
    def get(self, path):
        print("MAIN FILE_HANDLER", path)
        return web.StaticFileHandler.get(self, "index.html")


class FileHandler(AuthenticatedFileHandler):
    """static files should only be accessible when logged in"""

    @web.authenticated
    def get(self, path):
        print("FILE_HANDLER", path)
        return web.StaticFileHandler.get(self, path)


def load_jupyter_server_extension(nb_server_app):
  """
  Called when the extension is loaded.

  Args:
      nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
  """
  web_app = nb_server_app.web_app
  host_pattern = '.*$'

  rex = [(handler.regex.pattern, handler.handler_class)
         for handler in web_app.handlers[0][1]]

  base_url = web_app.settings['base_url']

  # Proxy
  route_pattern = url_path_join(web_app.settings['base_url'], r"/3/(.*)")
  web_app.add_handlers(host_pattern, [(route_pattern, FlowProxyHandler)])

  # My Handler
  route_pattern = url_path_join(
      web_app.settings['base_url'],
      '/backends/python')
  web_app.add_handlers(host_pattern, [(route_pattern, FlowHandler)])

  # Static
  # route_pattern = url_path_join(web_app.settings['base_url'], r"/(.*)")

  # web_app.add_handlers(
  #     host_pattern, [
  #         (route_pattern, AuthenticatedFileHandler, {
  #             'path': r"./"})])


  route_pattern = url_path_join(web_app.settings['base_url'], r"/(index\.html)")

  web_app.add_handlers(
      host_pattern, [
          (route_pattern, MainPageHandler,  { 'path': '.' })])

  for path in [r'js', 'css',]:
    route_pattern = url_path_join(web_app.settings['base_url'], r'/'+path+'/(.*)')

    web_app.add_handlers(
        host_pattern, [
            (route_pattern, FileHandler, {'path': r'./'+path+'/'} )])

  # web_app.add_handlers(
  #     host_pattern, [
  #         (route_pattern, tornado.web.StaticFileHandler, {
  #             'path': r"./"})])

  import os
  print(os.getcwd())


def main():
    # Start a notebook server with cross-origin access.
    nb_command = [sys.executable, '-m', 'notebook', '--no-browser',
                  '--debug',
                  # FIXME: allow-origin=* only required for notebook < 4.3
                  '--NotebookApp.allow_origin="*"',
                  # disable user password:
                  '--NotebookApp.password=',
              ]
    nb_server = subprocess.Popen(nb_command, stderr=subprocess.STDOUT,
                                 stdout=subprocess.PIPE)

    # Wait for notebook server to start up.
    # Extract the url used by the server.
    while 1:
        line = nb_server.stdout.readline().decode('utf-8').strip()
        if not line:
            continue
        print(line)
        if 'Jupyter Notebook is running at:' in line:
            base_url = re.search(r'(http[^\?]+)', line).groups()[0]
            break

    # Wait for the server to finish starting up.
    while 1:
        line = nb_server.stdout.readline().decode('utf-8').strip()
        if not line:
            continue
        print(line)
        if 'Control-C' in line:
            break

    def print_server_output():
        """Print output from the notebook server"""
        while 1:
            line = nb_server.stdout.readline().decode('utf-8').strip()
            if not line:
                continue
            print(line)

    # Start a thread to print output from the notebook server.
    thread = threading.Thread(target=print_server_output)
    thread.setDaemon(True)
    thread.start()

    # Set up the web server and start the event loop.
    handlers = [
        (r"/", MainPageHandler, {'base_url': base_url}),
        (r'/(.*)', tornado.web.StaticFileHandler, {'path': '.'}),
    ]

    app = tornado.web.Application(handlers, static_path='build',
                                  template_path='.',
                                  compiled_template_cache=False)

    app.listen(PORT, 'localhost')
    loop = tornado.ioloop.IOLoop.instance()
    print('Browse to http://localhost:%s' % PORT)
    try:
        loop.start()
    except KeyboardInterrupt:
        print(" Shutting down on SIGINT")
    finally:
        nb_server.kill()
        loop.close()

# if __name__ == '__main__':
#     main()


import { getEndpointsRequest } from '../h2oProxy/getEndpointsRequest';
import { getEndpointRequest } from '../h2oProxy/getEndpointRequest';
import { getSchemasRequest } from '../h2oProxy/getSchemasRequest';
import { getSchemaRequest } from '../h2oProxy/getSchemaRequest';
import { requestPacks } from '../h2oProxy/requestPacks';
import { requestPack } from '../h2oProxy/requestPack';
import { requestFlow } from '../h2oProxy/requestFlow';
import { requestHelpIndex } from '../h2oProxy/requestHelpIndex';
import { requestHelpContent } from '../h2oProxy/requestHelpContent';
import { validateFileExtension } from '../utils/validateFileExtension';
import { getFileBaseName } from '../utils/getFileBaseName';

export function help() {
  const lodash = window._;
  const Flow = window.Flow;
  const H2O = window.H2O;
  const marked = window.marked;
  const $ = window.jQuery;
  let _catalog;
  let _homeContent;
  _catalog = null;
  const _index = {};
  _homeContent = null;
  const _homeMarkdown = '<blockquote>\nUsing Flow for the first time?\n<br/>\n<div style=\'margin-top:10px\'>\n  <button type=\'button\' data-action=\'get-flow\' data-pack-name=\'examples\' data-flow-name=\'QuickStartVideos.flow\' class=\'flow-button\'><i class=\'fa fa-file-movie-o\'></i><span>Quickstart Videos</span>\n  </button>\n</div>\n</blockquote>\n\nOr, <a href=\'#\' data-action=\'get-pack\' data-pack-name=\'examples\'>view example Flows</a> to explore and learn H<sub>2</sub>O.\n\n###### Star H2O on Github!\n\n<iframe src="https://ghbtns.com/github-btn.html?user=h2oai&repo=h2o-3&type=star&count=true" frameborder="0" scrolling="0" width="170px" height="20px"></iframe>\n\n###### General\n\n%HELP_TOPICS%\n\n###### Examples\n\nFlow packs are a great way to explore and learn H<sub>2</sub>O. Try out these Flows and run them in your browser.<br/><a href=\'#\' data-action=\'get-packs\'>Browse installed packs...</a>\n\n###### H<sub>2</sub>O REST API\n\n- <a href=\'#\' data-action=\'endpoints\'>Routes</a>\n- <a href=\'#\' data-action=\'schemas\'>Schemas</a>\n';
  Flow.help = _ => {
    let _historyIndex;
    const _content = Flow.Dataflow.signal(null);
    const _history = [];
    _historyIndex = -1;
    const _canGoBack = Flow.Dataflow.signal(false);
    const _canGoForward = Flow.Dataflow.signal(false);
    const goTo = index => {
      const content = _history[_historyIndex = index];
      $('a, button', $(content)).each(function (i) {
        const $a = $(this);
        const action = $a.attr('data-action');
        if (action) {
          return $a.click(() => performAction(action, $a));
        }
      });
      _content(content);
      _canGoForward(_historyIndex < _history.length - 1);
      _canGoBack(_historyIndex > 0);
    };
    const goBack = () => {
      if (_historyIndex > 0) {
        return goTo(_historyIndex - 1);
      }
    };
    const goForward = () => {
      if (_historyIndex < _history.length - 1) {
        return goTo(_historyIndex + 1);
      }
    };
    const displayHtml = content => {
      if (_historyIndex < _history.length - 1) {
        _history.splice(_historyIndex + 1, _history.length - (_historyIndex + 1), content);
      } else {
        _history.push(content);
      }
      return goTo(_history.length - 1);
    };
    const fixImageSources = html => html.replace(/\s+src\s*=\s*"images\//g, ' src="help/images/');
    function performAction(action, $el) {
      let packName;
      let routeIndex;
      let schemaName;
      let topic;
      switch (action) {
        case 'help':
          topic = _index[$el.attr('data-topic')];
          requestHelpContent(topic.name, (error, html) => {
            const _ref = Flow.HTML.template('div', 'mark', 'h5', 'h6');
            const div = _ref[0];
            const mark = _ref[1];
            const h5 = _ref[2];
            const h6 = _ref[3];
            const contents = [
              mark('Help'),
              h5(topic.title),
              fixImageSources(div(html)),
            ];
            if (topic.children.length) {
              contents.push(h6('Topics'));
              contents.push(buildToc(topic.children));
            }
            return displayHtml(Flow.HTML.render('div', div(contents)));
          });
          break;
        case 'assist':
          _.insertAndExecuteCell('cs', 'assist');
          break;
        case 'get-packs':
          requestPacks((error, packNames) => {
            if (!error) {
              return displayPacks(lodash.filter(packNames, packName => packName !== 'test'));
            }
          });
          break;
        case 'get-pack':
          packName = $el.attr('data-pack-name');
          requestPack(packName, (error, flowNames) => {
            if (!error) {
              return displayFlows(packName, flowNames);
            }
          });
          break;
        case 'get-flow':
          _.confirm('This action will replace your active notebook.\nAre you sure you want to continue?', {
            acceptCaption: 'Load Notebook',
            declineCaption: 'Cancel',
          }, accept => {
            let flowName;
            if (accept) {
              packName = $el.attr('data-pack-name');
              flowName = $el.attr('data-flow-name');
              if (validateFileExtension(flowName, '.flow')) {
                return requestFlow(packName, flowName, (error, flow) => {
                  if (!error) {
                    return _.open(getFileBaseName(flowName, '.flow'), flow);
                  }
                });
              }
            }
          });
          break;
        case 'endpoints':
          getEndpointsRequest(_, (error, response) => {
            if (!error) {
              return displayEndpoints(response.routes);
            }
          });
          break;
        case 'endpoint':
          routeIndex = $el.attr('data-index');
          getEndpointRequest(_, routeIndex, (error, response) => {
            if (!error) {
              return displayEndpoint(lodash.head(response.routes));
            }
          });
          break;
        case 'schemas':
          getSchemasRequest(_, (error, response) => {
            if (!error) {
              return displaySchemas(lodash.sortBy(response.schemas, schema => schema.name));
            }
          });
          break;
        case 'schema':
          schemaName = $el.attr('data-schema');
          getSchemaRequest(_, schemaName, (error, response) => {
            if (!error) {
              return displaySchema(lodash.head(response.schemas));
            }
          });
          break;
        default:
          // do nothing
      }
    }
    function buildToc(nodes) {
      const _ref = Flow.HTML.template('ul', 'li', 'a href=\'#\' data-action=\'help\' data-topic=\'$1\'');
      const ul = _ref[0];
      const li = _ref[1];
      const a = _ref[2];
      return ul(lodash.map(nodes, node => li(a(node.title, node.name))));
    }
    const buildTopics = (index, topics) => {
      let topic;
      let _i;
      let _len;
      for (_i = 0, _len = topics.length; _i < _len; _i++) {
        topic = topics[_i];
        index[topic.name] = topic;
        if (topic.children.length) {
          buildTopics(index, topic.children);
        }
      }
    };
    function displayPacks(packNames) {
      const _ref = Flow.HTML.template('div', 'mark', 'h5', 'p', 'i.fa.fa-folder-o', 'a href=\'#\' data-action=\'get-pack\' data-pack-name=\'$1\'');
      const div = _ref[0];
      const mark = _ref[1];
      const h5 = _ref[2];
      const p = _ref[3];
      const i = _ref[4];
      const a = _ref[5];
      displayHtml(Flow.HTML.render('div', div([
        mark('Packs'),
        h5('Installed Packs'),
        div(lodash.map(packNames, packName => p([
          i(),
          a(packName, packName),
        ]))),
      ])));
    }
    function displayFlows(packName, flowNames) {
      const _ref = Flow.HTML.template('div', 'mark', 'h5', 'p', 'i.fa.fa-file-text-o', `a href=\'#\' data-action=\'get-flow\' data-pack-name=\'${packName}\' data-flow-name=\'$1\'`);
      const div = _ref[0];
      const mark = _ref[1];
      const h5 = _ref[2];
      const p = _ref[3];
      const i = _ref[4];
      const a = _ref[5];
      displayHtml(Flow.HTML.render('div', div([
        mark('Pack'),
        h5(packName),
        div(lodash.map(flowNames, flowName => p([
          i(),
          a(flowName, flowName),
        ]))),
      ])));
    }
    function displayEndpoints(routes) {
      let route;
      let routeIndex;
      let _i;
      let _len;
      const _ref = Flow.HTML.template('div', 'mark', 'h5', 'p', 'a href=\'#\' data-action=\'endpoint\' data-index=\'$1\'', 'code');
      const div = _ref[0];
      const mark = _ref[1];
      const h5 = _ref[2];
      const p = _ref[3];
      const action = _ref[4];
      const code = _ref[5];
      const els = [
        mark('API'),
        h5('List of Routes'),
      ];
      for (routeIndex = _i = 0, _len = routes.length; _i < _len; routeIndex = ++_i) {
        route = routes[routeIndex];
        els.push(p(`${action(code(`${route.http_method} ${route.url_pattern}`), routeIndex)}<br/>${route.summary}`));
      }
      displayHtml(Flow.HTML.render('div', div(els)));
    }
    const goHome = () => displayHtml(Flow.HTML.render('div', _homeContent));
    function displayEndpoint(route) {
      const _ref1 = route.path_params;
      const _ref = Flow.HTML.template('div', 'mark', 'h5', 'h6', 'p', 'a href=\'#\' data-action=\'schema\' data-schema=\'$1\'', 'code');
      const div = _ref[0];
      const mark = _ref[1];
      const h5 = _ref[2];
      const h6 = _ref[3];
      const p = _ref[4];
      const action = _ref[5];
      const code = _ref[6];
      return displayHtml(Flow.HTML.render('div', div([
        mark('Route'),
        h5(route.url_pattern),
        h6('Method'),
        p(code(route.http_method)),
        h6('Summary'),
        p(route.summary),
        h6('Parameters'),
        p(((_ref1) != null ? _ref1.length : void 0) ? route.path_params.join(', ') : '-'),
        h6('Input Schema'),
        p(action(code(route.input_schema), route.input_schema)),
        h6('Output Schema'),
        p(action(code(route.output_schema), route.output_schema)),
      ])));
    }
    function displaySchemas(schemas) {
      let schema;
      const _ref = Flow.HTML.template('div', 'h5', 'ul', 'li', 'var', 'mark', 'code', 'a href=\'#\' data-action=\'schema\' data-schema=\'$1\'');
      const div = _ref[0];
      const h5 = _ref[1];
      const ul = _ref[2];
      const li = _ref[3];
      const variable = _ref[4];
      const mark = _ref[5];
      const code = _ref[6];
      const action = _ref[7];
      const els = [
        mark('API'),
        h5('List of Schemas'),
        ul((() => {
          let _i;
          let _len;
          const _results = [];
          for (_i = 0, _len = schemas.length; _i < _len; _i++) {
            schema = schemas[_i];
            _results.push(li(`${action(code(schema.name), schema.name)} ${variable(lodash.escape(schema.type))}`));
          }
          return _results;
        })()),
      ];
      return displayHtml(Flow.HTML.render('div', div(els)));
    }
    function displaySchema(schema) {
      let field;
      let _i;
      let _len;
      const _ref = Flow.HTML.template('div', 'mark', 'h5', 'h6', 'p', 'code', 'var', 'small');
      const div = _ref[0];
      const mark = _ref[1];
      const h5 = _ref[2];
      const h6 = _ref[3];
      const p = _ref[4];
      const code = _ref[5];
      const variable = _ref[6];
      const small = _ref[7];
      const content = [
        mark('Schema'),
        h5(`${schema.name} (${lodash.escape(schema.type)})`),
        h6('Fields'),
      ];
      const _ref1 = schema.fields;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        field = _ref1[_i];
        if (field.name !== '__meta') {
          content.push(p(`${variable(field.name)}${(field.required ? '*' : '')} ${code(lodash.escape(field.type))}<br/>${small(field.help)}`));
        }
      }
      return displayHtml(Flow.HTML.render('div', div(content)));
    }
    const initialize = catalog => {
      _catalog = catalog;
      buildTopics(_index, _catalog);
      _homeContent = marked(_homeMarkdown).replace('%HELP_TOPICS%', buildToc(_catalog));
      return goHome();
    };
    Flow.Dataflow.link(_.ready, () => requestHelpIndex((error, catalog) => {
      if (!error) {
        return initialize(catalog);
      }
    }));
    return {
      content: _content,
      goHome,
      goBack,
      canGoBack: _canGoBack,
      goForward,
      canGoForward: _canGoForward,
    };
  };
}

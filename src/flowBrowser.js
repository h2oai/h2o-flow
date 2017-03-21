import { getObjectsRequest } from './h2oProxy/getObjectsRequest';
import { deleteObjectRequest } from './h2oProxy/deleteObjectRequest';
import { fromNow } from './utils/fromNow';

export function flowBrowser(_) {
  const lodash = window._;
  const Flow = window.Flow;
  const _docs = Flow.Dataflow.signals([]);
  const _sortedDocs = Flow.Dataflow.lift(_docs, docs => lodash.sortBy(docs, doc => -doc.date().getTime()));
  const _hasDocs = Flow.Dataflow.lift(_docs, docs => docs.length > 0);
  const createNotebookView = notebook => {
    const _name = notebook.name;
    const _date = Flow.Dataflow.signal(new Date(notebook.timestamp_millis));
    const _fromNow = Flow.Dataflow.lift(_date, fromNow);
    const load = () => _.confirm('This action will replace your active notebook.\nAre you sure you want to continue?', {
      acceptCaption: 'Load Notebook',
      declineCaption: 'Cancel',
    }, accept => {
      if (accept) {
        return _.load(_name);
      }
    });
    const purge = () => _.confirm(`Are you sure you want to delete this notebook?\n"${_name}"`, {
      acceptCaption: 'Delete',
      declineCaption: 'Keep',
    }, accept => {
      if (accept) {
        return deleteObjectRequest(_, 'notebook', _name, error => {
          let _ref;
          if (error) {
            _ref = error.message;
            return _.alert(_ref != null ? _ref : error);
          }
          _docs.remove(self);
          return _.growl('Notebook deleted.');
        });
      }
    });
    const self = {
      name: _name,
      date: _date,
      fromNow: _fromNow,
      load,
      purge,
    };
    return self;
  };
  const loadNotebooks = () => getObjectsRequest(_, 'notebook', (error, notebooks) => {
    if (error) {
      return console.debug(error);
    }
    // XXX sort
    return _docs(lodash.map(notebooks, notebook => createNotebookView(notebook)));
  });
  Flow.Dataflow.link(_.ready, () => {
    loadNotebooks();
    Flow.Dataflow.link(_.saved, () => loadNotebooks());
    return Flow.Dataflow.link(_.loaded, () => loadNotebooks());
  });
  return {
    docs: _sortedDocs,
    hasDocs: _hasDocs,
    loadNotebooks,
  };
}


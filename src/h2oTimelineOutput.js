import { getTimelineRequest } from './h2oProxy/getTimelineRequest';

export function h2oTimelineOutput(_, _go, _timeline) {
  const lodash = window._;
  const Flow = window.Flow;
  const _exception = Flow.Dataflow.signal(null);
  const _isLive = Flow.Dataflow.signal(false);
  const _isBusy = Flow.Dataflow.signal(false);
  const _headers = [
    'HH:MM:SS:MS',
    'nanosec',
    'Who',
    'I/O Type',
    'Event',
    'Type',
    'Bytes',
  ];
  const _data = Flow.Dataflow.signal(null);
  const _timestamp = Flow.Dataflow.signal(Date.now());
  const createEvent = event => {
    switch (event.type) {
      case 'io':
        return [
          event.date,
          event.nanos,
          event.node,
          event.io_flavor || '-',
          'I/O',
          '-',
          event.data,
        ];
      case 'heartbeat':
        return [
          event.date,
          event.nanos,
          'many &#8594;  many',
          'UDP',
          event.type,
          '-',
          `${event.sends} sent ${event.recvs} received'`,
        ];
      case 'network_msg':
        return [
          event.date,
          event.nanos,
          `${event.from} &#8594; ${event.to}`,
          event.protocol,
          event.msg_type,
          event.is_send ? 'send' : 'receive',
          event.data,
        ];
      default:
    }
  };
  const updateTimeline = timeline => {
    let cell;
    let event;
    let header;
    const _ref = Flow.HTML.template('.grid', 'table', 'thead', 'tbody', 'tr', 'th', 'td');
    const grid = _ref[0];
    const table = _ref[1];
    const thead = _ref[2];
    const tbody = _ref[3];
    const tr = _ref[4];
    const th = _ref[5];
    const td = _ref[6];
    const ths = ((() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = _headers.length; _i < _len; _i++) {
        header = _headers[_i];
        _results.push(th(header));
      }
      return _results;
    })());
    const trs = ((() => {
      let _i;
      let _len;
      const _ref1 = timeline.events;
      const _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        event = _ref1[_i];
        _results.push(tr((() => {
          let _j;
          let _len1;
          const _ref2 = createEvent(event);
          const _results1 = [];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            cell = _ref2[_j];
            _results1.push(td(cell));
          }
          return _results1;
        })()));
      }
      return _results;
    })());
    return _data(Flow.HTML.render('div', grid([table([
      thead(tr(ths)),
      tbody(trs),
    ])])));
  };
  const toggleRefresh = () => _isLive(!_isLive());
  const refresh = () => {
    _isBusy(true);
    return getTimelineRequest(_, (error, timeline) => {
      _isBusy(false);
      if (error) {
        _exception(Flow.failure(_, new Flow.Error('Error fetching timeline', error)));
        return _isLive(false);
      }
      updateTimeline(timeline);
      if (_isLive()) {
        return lodash.delay(refresh, 2000);
      }
    });
  };
  Flow.Dataflow.act(_isLive, (isLive) => {
    if (isLive) {
      return refresh();
    }
  });
  updateTimeline(_timeline);
  lodash.defer(_go);
  return {
    data: _data,
    isLive: _isLive,
    isBusy: _isBusy,
    toggleRefresh,
    refresh,
    template: 'flow-timeline-output',
  };
}


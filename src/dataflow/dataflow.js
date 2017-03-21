import { createSlot } from './createSlot';
import { createSlots } from './createSlots';
import { _link } from './_link';
import { _unlink } from './_unlink';
import { createSignal } from './createSignal';
import { createSignals } from './createSignals';
import { _isSignal } from './_isSignal';

//
// Combinators
//
import { _apply } from './_apply';
import { _act } from './_act';
import { _react } from './_react';
import { _lift } from './_lift';
import { _merge } from './_merge';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

//
// Reactive programming / Dataflow programming wrapper over knockout
//
export function dataflow() {
  const Flow = window.Flow;
  Flow.Dataflow = (() => ({
    slot: createSlot,
    slots: createSlots,
    signal: createSignal,
    signals: createSignals,
    isSignal: _isSignal,
    link: _link,
    unlink: _unlink,
    act: _act,
    react: _react,
    lift: _lift,
    merge: _merge,
  }))();
}

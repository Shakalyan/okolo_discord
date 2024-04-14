import { useRef, useState } from "react";

export function useRenderedRef(initial) {
    let ref = useRef({value: initial});
    let [state, setState] = useState({value: initial});

    let obj = {
        _ref: ref,
        _state: state,
        _setState: setState,

        get: function() {
            return this._ref.current.value;
        },

        set: function(value) {
            this._ref.current.value = value;
            return this;
        },

        update: function() {
            this._setState({...this._ref.current.value})
        }
    }
    
    return obj;
}
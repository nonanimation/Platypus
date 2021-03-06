/**
 * This class defines a state object to use for entity states with helper methods. It includes recycle methods to encourage reuse.
 *
 * @namespace platypus
 * @class StateMap
 * @constructor
 * @return stateMap {platypus.StateMap} Returns the new StateMap object.
 * @extends platypus.DataMap
 * @since 0.8.0
 */
/* global extend, include, platypus, recycle, springroll */
platypus.StateMap = (function () {
    'use strict';
    
    var DataMap = include('platypus.DataMap'),
        StateMap = function (first) {
            var l = arguments.length;
            
            if (l) {
                if ((l === 1) && (typeof first === 'string')) {
                    DataMap.call(this);
                    this.updateFromString(first);
                } else {
                    DataMap.apply(this, arguments);
                }
            } else {
                DataMap.call(this);
            }
        },
        proto = extend(StateMap, DataMap);
        
    /**
     * Sets the state using the provided string value which is a comma-delimited list such that `"blue,red,!green"` sets the following state values:
     *
     *      {
     *          red: true,
     *          blue: true,
     *          green: false
     *      }
     *
     * @method updateFromString
     * @param states {String} A comma-delimited list of true/false state values.
     * @chainable
     */
    Object.defineProperty(proto, 'updateFromString', {
        value: function (states) {
            var arr = states.greenSplit(','),
                i = arr.length,
                str = '';
            
            while (i--) {
                str = arr[i];
                if (str) {
                    if (str.substr(0, 1) === '!') {
                        this.set(str.substr(1), false);
                    } else {
                        this.set(str, true);
                    }
                }
            }
            
            arr.recycle();
            
            return this;
        }
    });
    
    /**
     * Checks whether the provided state matches this state and updates this state to match.
     *
     * @method update
     * @param state {platypus.StateMap} The state that this state should match.
     * @return {Boolean} Whether this state already matches the provided state.
     */
    Object.defineProperty(proto, 'update', {
        value: function (newState) {
            var keys = newState.keys,
                i = keys.length,
                state   = '',
                changed = false,
                value = false;
            
            while (i--) {
                state = keys[i];
                value = newState.get(state);
                if (this.get(state) !== value) {
                    this.set(state, value);
                    changed = true;
                }
            }
            
            return changed;
        }
    });
    
    /**
     * Checks whether the provided state matches all equivalent keys on this state.
     *
     * @method includes
     * @param state {platypus.StateMap} The state that this state should match.
     * @return {Boolean} Whether this state matches the provided state.
     */
    Object.defineProperty(proto, 'includes', {
        value: function (otherState) {
            var keys = otherState.keys,
                i = keys.length,
                state = '';
            
            while (i--) {
                state = keys[i];
                if (this.get(state) !== otherState.get(state)) {
                    return false;
                }
            }
            
            return true;
        }
    });
    
    /**
     * Checks whether the provided state matches any equivalent keys on this state.
     *
     * @method intersects
     * @param state {platypus.StateMap} The state that this state should intersect.
     * @return {Boolean} Whether this state intersects the provided state.
     */
    Object.defineProperty(proto, 'intersects', {
        value: function (otherState) {
            var keys = otherState.keys,
                i = keys.length,
                state = '';
            
            while (i--) {
                state = keys[i];
                if (this.get(state) === otherState.get(state)) {
                    return true;
                }
            }
            
            return false;
        }
    });
    
    /**
     * Returns StateMap from cache or creates a new one if none are available.
     *
     * @method StateMap.setUp
     * @return stateMap {platypus.StateMap} The instantiated StateMap.
     */
    /**
     * Returns StateMap back to the cache. Prefer the StateMap's recycle method since it recycles property objects as well.
     *
     * @method StateMap.recycle
     * @param stateMap {platypus.StateMap} The StateMap to be recycled.
     */
    /**
     * Relinquishes StateMap properties and recycles it.
     *
     * @method recycle
     */
    recycle.add(StateMap, !!springroll.Debug, 'StateMap', function () {
        this.clear();
        StateMap.recycle(this);
    });
    
    return StateMap;
}());
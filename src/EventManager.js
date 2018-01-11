export default () => {
  const events = {};

  /**
   * @type {function (Promise<{}>):({}|Promise<{}>) } EventCallback
   *
   * An event callback. An event callback should accept a Promise, which should resolve to an object
   * of arguments. The callback should then transform those arguments and return them, or a Promise which
   * will resolve to them.
   *
   * @property {?number} EventCallback.priority The priority of the callback.
   */

  return {
    /**
     * Registers an event.
     *
     * `callback` can have a static priority property instead of passing in the `priority` parameter.
     *
     * If the callback has a priority, it supersedes the priority given to the function.
     *
     * @param {string} eventName The name of the event.
     * @param {EventCallback|EventCallback[]} callback A callback, or an array of callbacks.
     * @param {number=100} priority The priority of the event.
     */
    add(eventName, callback, priority) {
      if (Array.isArray(callback)) {
        event.forEach(c => this.add(c, callback, priority));
        return;
      }

      priority = callback.priority !== undefined ? callback.priority :
        (priority !== undefined ? priority : 100);

      events[eventName] = events[eventName] || {};
      events[eventName][priority] = (events[eventName][priority] || []).concat(callback);
    },

    /**
     * Registers a map of events (as a POJO).
     *
     * The map keys will be the event name, and the value is the callback.
     *
     * <pre><code>
     * {
     *   "getData": promise => promise.then(args => Object.assign(args, { a: 5 })),
     *   "saveData": promise => promise.then(args => { saveData(args); Object.assign(args); })
     * }
     * </pre></code>
     *
     * If you want to provide a priority, set it as a static property of a callback. A clean syntax
     *   is to use `Object.assign`.
     *
     * <pre><code>
     * {
     *   "eventName": Object.assign(promise => promise.then(args => Object.assign(args)), { priority: 5 })
     * }
     * </pre></code>
     *
     * You can also provide an array of callbacks for the same key as well.
     *
     * @param {Object<String, EventCallback|EventCallback[]>} map The map of events to register.
     */
    addMap(map) {
      Object.entries(map).forEach(([eventName, callback]) => this.add(eventName, callback))
    },

    /**
     * Applies the named event to the given arguments.
     *
     * The arguments will be passed to each `EventCallback` in priority order (ascending).
     *
     * If the callback does not return a Promise, the result will be wrapped in a Promise.
     * If the callback does not return anything, an empty object will be returned.
     *
     * If no events are registered for the given name, the arguments will be returned in the Promise untransformed.
     *
     * @param {string} eventName The name of the event.
     * @param {{}} args An object of arguments.
     * @return {Promise<{}, string>} A Promise which will resolve to the transformed arguments.
     */
    apply(eventName, args = {}) {
      return Object.keys(events[eventName] || [])
        .sort()
        .reduce((result, priority) =>
            events[eventName][priority].reduce((r, callback) =>
                Promise.resolve(callback(r) || {}),
              result
            ),
          Promise.resolve(args)
        );
    }
  };
};
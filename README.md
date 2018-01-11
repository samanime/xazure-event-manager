# Xazure Event Manager

An async-first event manager. Used by Xazure CMS.

Uses an async reducer pattern to parse arguments with all events.

## Basic Usage

    import EventManager from 'xazure-event-manager';
    
    const eventManager = EventManager();
    
    // Add event
    eventManager.add('add', async previous => {
      const args = await previous;
      const { a, b, sum = 0 } = args;
      return Object.assign(args, { sum: sum + a + b });
    });
    
    // in an async function
    // Apply event
    const { a, b, sum } = await eventManager.apply('add', { a: 1, b: 2 });
    
## Concepts

Xazure Event Manager is async-first. All of the event callbacks should accept a
`Promise` which resolves an object with the parameters. This allows any event
to be asynchronous without any additional effort.

    eventManager.add('add', async previous => {
      const args = await previous;
    }); 
    
The event manager will run through each event in priority order:

    eventManager.add('rollCall', [
      Object.assign(
        async previous => {
          const args = await previous;
          return Object.assign(args, { list: [].concat(args.list, 'a') });
        }, { priority: 1 }
      ),
      Object.assign(
        async previous => {
          const args = await previous;
          return Object.assign(args, { list: [].concat(args.list, 'b') });
        }, { priority: 2 }
      ),
      Object.assign(
        async previous => {
          const args = await previous;
          return Object.assign(args, { list: [].concat(args.list, 'c') });
        }, { priority: 3 }
      )
    ]);
    
    const { list } = eventManager.apply('rollCall');
    console.log(list); // ['a', 'b', 'c']
   
Each event should return all of the arguments, making any transforms as necessary.

Any event can return a `Promise` or the arguments directly.

## API

    add(eventName, callback, priority)
    
  - `eventName` - `string` - The event name to register.
  - `callback` - `function(Promise<{}>):(Promise<{}>|{})` - The callback function to call, or an array of them.
  - `priority` - `number` - Optional. Specifies the priority. Default: 100 
    
`callback` should accept a `Promise` as it's only parameter, which will resolve to an object of arguments. 
It should return the arguments object, applying any required transforms, or a `Promise` that results in one.

`callback` can also have a static `priority` value. If provided, it supersedes the priority argument given to
the function. This is useful when passing an array where you want different priorities.

If neither `callback.priority` or `priority` are given, it'll be defaulted to 100.
    
    addMap(map)
    
Registers a map of events, with each key being the event name, and the values the callback(s).

See [add()](#api) for rules on the callbacks.

    apply(eventName, args = {}):Promise<{}>
    
Applies the arguments to all registered events for the given name, in priority order (ascending).

The `args` are given to the first callback (wrapped in a `Promise`), then the result of that is given
to the next and so-on (a reducer pattern).
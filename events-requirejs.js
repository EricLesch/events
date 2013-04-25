define(
    [],
    function()
    {
        /**
         * counter for the eventbus - incremented each time a new event bus is created - it is used to prevent infinite event loops
         * event buses will ignore events that they have already fired
         * @type {number}
         */
        var eventBusIdCounter = 0;

        /**
         * installs an event object on the given object
         * @param object
         * @returns {*}
         */
        function install(object)
        {
            if (object && !object.evt)
            {
                object.evt = new LocalEvent(object);
            }

            return object;
        }

        // trying to do a decent job of creating a unique id - a counter plus a date in milliseconds plus a random number between 0 and million
        function getGUID()
        {
            return (eventBusIdCounter++).toString() + (+(new Date())).toString() + Math.floor(Math.random() * 1000000).toString();
        }

        /**
         * An Event object(pubSub)
         * @param object
         * @constructor
         */
        function LocalEvent(object)
        {
            this._eventBusId = getGUID();
            this.topics = {};
            this.subId = -1;
            this._globalSubscribeFuncs = [];
        }

        LocalEvent.fn = LocalEvent.prototype;

        /**
         * subscribes a function to a topic - this function gets fired whenever a topic gets fired
         * @methodOf LocalEvent
         * @param topic
         * @param func
         * @returns {number} - the token that can be passed to unsubscribe to unsubscribe the function
         */
        LocalEvent.fn.subscribe = function (topic, func)
        {
            if (!this.topics[topic])
            {
                this.topics[topic] = [];
            }

            var token = ++this.subId;

            this.topics[topic].push(
                {
                    token:token,
                    func:func
                }
            );

            return token;
        };

        /**
         * Subscribes the function to all events fired by this event object
         * @methodOf LocalEvent
         * @param func
         */
        LocalEvent.fn.subscribeToAll = function(func)
        {
            this._globalSubscribeFuncs.push(func);
        };

        /**
         * @methodOf LocalEvent
         * @param eventObject
         * @private
         */
        LocalEvent.fn._publishToGlobalSubscribeFuncs = function(eventObject)
        {
            for (var i = 0, len = this._globalSubscribeFuncs.length; i < len; i++)
            {
                this._globalSubscribeFuncs[i](eventObject);
            }
        };

        /**
         * publishes a topic, all functions subscribed to that topic will fire
         * @methodOf LocalEvent
         * @param eventObject
         * @returns {boolean} - returns false if this event object has already fired this event
         */
        LocalEvent.fn.publish = function (eventObject)
        {
            // add this event object to the hash of the event objects that have fired on this event object
            eventObject.publishers = eventObject.publishers || {};

            // check to see if this publisher has fired this event before. if it has do nothing
            // prevents infinite event loops
            if (eventObject.publishers[this._eventBusId])
            {
                return false;
            }

            // add this object to the list of objects that have published this event
            eventObject.publishers[this._eventBusId] = true;

            this._publishToGlobalSubscribeFuncs(eventObject);

            // everything into an array
            var args = Array.prototype.slice.call(arguments);

            if (!this.topics[eventObject.message])
            {
                return false;
            }

            var subscribers = this.topics[eventObject.message],
                len = subscribers.length;

            while (len--)
            {
                subscribers[len].func.apply(null, args);
            }

            return true;
        };

        /**
         * unsubscribes a function with the given token
         * @methodOf LocalEvent
         * @param token
         * @returns {*}
         */
        LocalEvent.fn.unsubscribe = function (token)
        {
            for (var m in this.topics)
            {
                if (this.topics[m])
                {
                    for (var i = 0, j = this.topics[m].length; i < j; i++)
                    {
                        if (this.topics[m][i].token === token)
                        {
                            this.topics[m].splice(i, 1);
                            return token;
                        }
                    }
                }
            }
            return false;
        };

        return {
            install: install
        };
    }
);

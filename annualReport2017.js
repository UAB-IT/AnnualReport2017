/*!
* jquery.counterup.js 1.0
*
* Copyright 2013, Benjamin Intal http://gambit.ph @bfintal
* Released under the GPL v2 License
*
* Date: Nov 26, 2013
*/
(function ($) {
    "use strict";

    $.fn.counterUp = function (options) {

        // Defaults
        var settings = $.extend({
            'time': 400,
            'delay': 10
        }, options);

        return this.each(function () {

            // Store the object
            var $this = $(this);
            var $settings = settings;

            var counterUpper = function () {
                var nums = [];
                var divisions = $settings.time / $settings.delay;
                var num = $this.text();
                var isComma = /[0-9]+,[0-9]+/.test(num);
                num = num.replace(/,/g, '');
                var isInt = /^[0-9]+$/.test(num);
                var isFloat = /^[0-9]+\.[0-9]+$/.test(num);
                var decimalPlaces = isFloat ? (num.split('.')[1] || []).length : 0;

                // Generate list of incremental numbers to display
                for (var i = divisions; i >= 1; i--) {

                    // Preserve as int if input was int
                    var newNum = parseInt(num / divisions * i);

                    // Preserve float if input was float
                    if (isFloat) {
                        newNum = parseFloat(num / divisions * i).toFixed(decimalPlaces);
                    }

                    // Preserve commas if input had commas
                    if (isComma) {
                        while (/(\d+)(\d{3})/.test(newNum.toString())) {
                            newNum = newNum.toString().replace(/(\d+)(\d{3})/, '$1' + ',' + '$2');
                        }
                    }

                    nums.unshift(newNum);
                }

                $this.data('counterup-nums', nums);
                $this.text('0');

                // Updates the number until we're done
                var f = function () {
                    $this.text($this.data('counterup-nums').shift());
                    if ($this.data('counterup-nums').length) {
                        setTimeout($this.data('counterup-func'), $settings.delay);
                    } else {
                        delete $this.data('counterup-nums');
                        $this.data('counterup-nums', null);
                        $this.data('counterup-func', null);
                    }
                };
                $this.data('counterup-func', f);


                // Start the count up
                setTimeout($this.data('counterup-func'), $settings.delay);
            };


            // Perform counts when the element gets into view
            $this.waypoint(function (direction) {
                counterUpper();
                this.destroy(); //-- Waypoint 3.0 version of triggerOnce
            }, { offset: '100%' });
        });

    };

})(jQuery);
/*!
 * chartjs-plugin-deferred
 * http://chartjs.org/
 * Version: 0.3.0
 *
 * Copyright 2017 Simon Brunel
 * Released under the MIT license
 * https://github.com/chartjs/chartjs-plugin-deferred/blob/master/LICENSE.md
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('chart.js')) :
        typeof define === 'function' && define.amd ? define(['chart.js'], factory) :
            (factory(global.Chart));
}(this, (function (Chart) {
    'use strict';

    Chart = 'default' in Chart ? Chart['default'] : Chart;

    (function () {
        var helpers = Chart.helpers;
        var STUB_KEY = '_chartjs_deferred';
        var MODEL_KEY = '_deferred_model';

        /**
         * Plugin based on discussion from Chart.js issue #2745.
         * @see https://github.com/chartjs/Chart.js/issues/2745
         */
        Chart.Deferred = Chart.Deferred || {};
        Chart.Deferred.defaults = {
            enabled: true,
            xOffset: 0,
            yOffset: '100%',
            delay: 50
        };

        // DOM implementation
        // @TODO move it in Chart.js: src/core/core.platform.js
        Chart.platform = helpers.extend(Chart.platform || {}, {
            defer: function (fn, delay, scope) {
                var callback = function () {
                    fn.call(scope);
                };
                if (!delay) {
                    helpers.requestAnimFrame.call(window, callback);
                } else {
                    window.setTimeout(callback, delay);
                }
            }
        });

        function computeOffset(value, base) {
            var number = parseInt(value, 10);
            if (isNaN(number)) {
                return 0;
            } else if (typeof value === 'string' && value.indexOf('%') !== -1) {
                return number / 100 * base;
            }
            return number;
        }

        function chartInViewport(instance) {
            var model = instance[MODEL_KEY];
            var canvas = instance.chart.canvas;

            // http://stackoverflow.com/a/21696585
            if (!canvas || canvas.offsetParent === null) {
                return false;
            }

            var rect = canvas.getBoundingClientRect();
            var dy = computeOffset(model.yOffset || 0, rect.height);
            var dx = computeOffset(model.xOffset || 0, rect.width);

            return rect.right - dx >= 0
                && rect.bottom - dy >= 0
                && rect.left + dx <= window.innerWidth
                && rect.top + dy <= window.innerHeight;
        }

        function buildDeferredModel(instance) {
            var defaults = Chart.Deferred.defaults;
            var options = instance.options.deferred;
            var getValue = helpers.getValueOrDefault;

            if (options === undefined) {
                options = {};
            } else if (typeof options === 'boolean') {
                // accepting { options: { deferred: true } }
                options = { enabled: options };
            }

            return {
                enabled: getValue(options.enabled, defaults.enabled),
                xOffset: getValue(options.xOffset, defaults.xOffset),
                yOffset: getValue(options.yOffset, defaults.yOffset),
                delay: getValue(options.delay, defaults.delay),
                appeared: false,
                delayed: false,
                loaded: false,
                elements: []
            };
        }

        function onScroll(event) {
            var node = event.target;
            var stub = node[STUB_KEY];
            if (stub.ticking) {
                return;
            }

            stub.ticking = true;
            Chart.platform.defer(function () {
                var instances = stub.instances.slice();
                var ilen = instances.length;
                var instance, i;

                for (i = 0; i < ilen; ++i) {
                    instance = instances[i];
                    if (chartInViewport(instance)) {
                        unwatch(instance); // eslint-disable-line
                        instance[MODEL_KEY].appeared = true;
                        instance.update();
                    }
                }

                stub.ticking = false;
            });
        }

        function isScrollable(node) {
            var type = node.nodeType;
            if (type === Node.ELEMENT_NODE) {
                var overflowX = helpers.getStyle(node, 'overflow-x');
                var overflowY = helpers.getStyle(node, 'overflow-y');
                return overflowX === 'auto' || overflowX === 'scroll'
                    || overflowY === 'auto' || overflowY === 'scroll';
            }

            return node.nodeType === Node.DOCUMENT_NODE;
        }

        function watch(instance) {
            var canvas = instance.chart.canvas;
            var parent = canvas.parentElement;
            var stub, instances;

            while (parent) {
                if (isScrollable(parent)) {
                    stub = parent[STUB_KEY] || (parent[STUB_KEY] = {});
                    instances = stub.instances || (stub.instances = []);
                    if (instances.length === 0) {
                        parent.addEventListener('scroll', onScroll, { passive: true });
                    }

                    instances.push(instance);
                    instance[MODEL_KEY].elements.push(parent);
                }

                parent = parent.parentElement || parent.ownerDocument;
            }
        }

        function unwatch(instance) {
            instance[MODEL_KEY].elements.forEach(function (element) {
                var instances = element[STUB_KEY].instances;
                instances.splice(instances.indexOf(instance), 1);
                if (!instances.length) {
                    helpers.removeEvent(element, 'scroll', onScroll);
                    delete element[STUB_KEY];
                }
            });

            instance[MODEL_KEY].elements = [];
        }

        Chart.plugins.register({
            beforeInit: function (instance) {
                var model = instance[MODEL_KEY] = buildDeferredModel(instance);
                if (model.enabled) {
                    watch(instance);
                }
            },

            beforeDatasetsUpdate: function (instance) {
                var model = instance[MODEL_KEY];
                if (!model.enabled) {
                    return true;
                }

                if (!model.loaded) {
                    if (!model.appeared && !chartInViewport(instance)) {
                        // cancel the datasets update
                        return false;
                    }

                    model.appeared = true;
                    model.loaded = true;
                    unwatch(instance);

                    if (model.delay > 0) {
                        model.delayed = true;
                        Chart.platform.defer(function () {
                            model.delayed = false;
                            instance.update();
                        }, model.delay);

                        return false;
                    }
                }

                if (model.delayed) {
                    // in case of delayed update, ensure to block external requests, such
                    // as interacting with the legend label, or direct calls to update()
                    return false;
                }
            },

            destroy: function (chart) {
                unwatch(chart);
            }
        });

    }());

})));

/*NAV SCRIPT
*
*
*
*
*
*
*/

$(document).ready(function () {

    /**
     * This part does the "fixed navigation after scroll" functionality
     * We use the jQuery function scroll() to recalculate our variables as the
     * page is scrolled/
     */
    $(window).scroll(function () {
        var window_top = $(window).scrollTop() + 0; // the "0" should equal the margin-top value for nav.stick
        var div_top = $('#nav-anchor').offset().top;
        if (window_top > div_top) {
            $('nav.ar').addClass('stick');
        } else {
            $('nav.ar').removeClass('stick');
        }
    });
    /*
    *$("nav a").click(function(evn){
    *        evn.preventDefault();
    *        $('html,body').scrollTo(this.hash, this.hash);
    *    });
    */
    /* This part handles the highlighting functionality.
    * We use the scroll functionality again, some array creation and
    * manipulation, class adding and class removing, and conditional testing
    */
    var aChildren = $("nav.ar li").children(); // find the a children of the list items
    var aArray = []; // create the empty aArray
    for (var i = 0; i < aChildren.length; i++) {
        var aChild = aChildren[i];
        var ahref = $(aChild).attr('href');
        aArray.push(ahref);
    } // this for loop fills the aArray with attribute href values

    $(window).scroll(function () {
        var windowPos = $(window).scrollTop(); // get the offset of the window from the top of page
        var windowHeight = $(window).height(); // get the height of the window
        var docHeight = $(document).height();

        for (var i = 0; i < aArray.length; i++) {
            var theID = aArray[i];
            var divPos = $(theID).offset().top - 50; // get the offset of the div from the top of page
            var divHeight = $(theID).height() + 0; // get the height of the div in question
            if (windowPos >= divPos && windowPos < (divPos + divHeight)) {
                $("a[href='" + theID + "']").addClass("nav-active");
            } else {
                $("a[href='" + theID + "']").removeClass("nav-active");
            }
        }


    });
});
/*TIMELINE CODE
*
*
*
*
*
*
*/

var additionalOptions = {
    timenav_height: 200
}
timeline = new TL.Timeline('timeline-embed',
    'https://docs.google.com/spreadsheets/d/1giydSNu0vMYh6QiL9Q0PRdd8Id26LURT6QyFhTot95E/pubhtml',
    additionalOptions);


/*CHART CODE
*
*
*
*
*
*
*/
var ctx1 = document.getElementById("WorldClassBar1").getContext('2d');
var WorldClassBar1 = new Chart(ctx1, {
    type: 'bar',
    data: {
        labels: ["", ""],
        datasets: [{
            data: [0.5, 2.44],
            backgroundColor: [
                "#F4C300",
                "#F4C300"
            ],
            hoverBackgroundColor: [
                "#F4C300",
                "#F4C300"
            ],
            borderColor: [
                "#F4C300",
                "#F4C300"
            ],
            borderWidth: 0
        }]
    },
    options: {
        tooltips: {
            enabled: true
        },
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    display: false
                }
            }]
        }
    }
});

var ctx = document.getElementById("SecurityPie").getContext('2d');
var SecurityPie = new Chart(ctx, {
    type: 'doughnut',

    data: {
        labels: ["-", "-"],
        datasets: [{
            backgroundColor: [
                "#F4C300",
                "#333"
            ],
            hoverBackgroundColor: [
                "#F4C300",
                "#333"
            ],
            data: [75, 25]
        }]
    },
    options: {
        tooltips: {
            enabled: false
        },
        legend: {
            display: false
        },

    }
});

var ctx = document.getElementById("WorldClassPie1").getContext('2d');
var WorldClassPie1 = new Chart(ctx, {
    type: 'doughnut',

    data: {
        labels: ["Percentage Before", "Percentage Improved By", "Remaining Percentage"],
        datasets: [{
            backgroundColor: [
                "#1E6B52",
                "#A3D55D",
                "#333"
            ],
            hoverBackgroundColor: [
                "#1E6B52",
                "#A3D55D",
                "#333"
            ],
            data: [49, 23, 28]
        }]
    },
    options: {
        tooltips: {
            enabled: true
        },
        legend: {
            display: false
        },

    }
});

var ctx = document.getElementById("BusinessPie1").getContext('2d');
var BusinessPie1 = new Chart(ctx, {
    type: 'doughnut',

    data: {
        labels: ["Elimated Steps", "Remaining Steps"],
        datasets: [{
            backgroundColor: [
                "#333",
                "#A3D55D"
            ],
            hoverBackgroundColor: [
                "#333",
                "#A3D55D"
            ],
            data: [8, 2]
        }]
    },
    options: {
        tooltips: {
            enabled: true
        },
        legend: {
            display: false
        },

    }
});

if ($(window).width() >= 770) {
    jQuery(document).ready(function ($) {
        $('.counter').counterUp({
            delay: 10,
            time: 500
        });
    });
}


<!--LAZY LOAD-->
window.echo = (function (window, document) {

    'use strict';

    /*
     * Constructor function
     */
    var Echo = function (elem) {
        this.elem = elem;
        this.render();
        this.listen();
    };

    /*
     * Images for echoing
     */
    var echoStore = [];

    /*
     * Element in viewport logic
     */
    var scrolledIntoView = function (element) {
        var coords = element.getBoundingClientRect();
        return ((coords.top >= 0 && coords.left >= 0 && coords.top) <= (window.innerHeight || document.documentElement.clientHeight));
    };

    /*
     * Changing src attr logic
     */
    var echoSrc = function (img, callback) {
        img.src = img.getAttribute('data-echo');
        if (callback) {
            callback();
        }
    };

    /*
     * Remove loaded item from array
     */
    var removeEcho = function (element, index) {
        if (echoStore.indexOf(element) !== -1) {
            echoStore.splice(index, 1);
        }
    };

    /*
     * Echo the images and callbacks
     */
    var echoImages = function () {
        for (var i = 0; i < echoStore.length; i++) {
            var self = echoStore[i];
            if (scrolledIntoView(self)) {
                echoSrc(self, removeEcho(self, i));
            }
        }
    };

    /*
     * Prototypal setup
     */
    Echo.prototype = {
        init: function () {
            echoStore.push(this.elem);
        },
        render: function () {
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', echoImages, false);
            } else {
                window.onload = echoImages;
            }
        },
        listen: function () {
            window.onscroll = echoImages;
        }
    };

    /*
     * Initiate the plugin
     */
    var lazyImgs = document.querySelectorAll('img[data-echo]');
    for (var i = 0; i < lazyImgs.length; i++) {
        new Echo(lazyImgs[i]).init();
    }

})(window, document);

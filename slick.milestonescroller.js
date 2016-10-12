(function ($) {
    // TODO: append elements to the grid's main container instead of the document so it's all contained

    // Register namespace
    $.extend(true, window, {
        "Slick": {
            "MilestoneScroller": MilestoneScroller
        }
    });

    /**
     * MilestoneScroller
     * @constructor
     * @param {function}[options.milestoneTest = function(item){ return; }] - function returning true to decide whether to include that row as a milestone or not
     * @param {string}  [options.textProperty = name]                       - row property that includes text to display
     */
    function MilestoneScroller(options) {

        var self = this;

        self.milestones = [];

        options = $.extend({

            milestoneTest: function (item) {
                return //item test here, e.g. item.groupLevel === 0;
            },

            textProperty: 'name'

        }, options);

        /**
         * Initialize plugin.
         */
        function init(grid) {
            self.grid = grid;

            self.$scrollStatus = $('<div class="scroll-helper-milestone"></div>');
            self.$viewport = $(self.grid.getContainerNode()).find('.slick-viewport');

            self.$viewport
                    .on('mousewheel', mousewheel)
                    .on('DOMMouseScroll', mousewheel)
                    .on('scroll', scroll);

            // setup public api
            self.grid.milestoneScroller = {
                resize: resize
            };

            return self;
        }

        // handling mousewheel as special case since you can't hold it down to stay on the milestones
        // hide after a while unless scrolling continues
        // 'mousewheel' works for all browsers but ff
        // 'DOMMouseScroll' is for ff only
        function mousewheel() {
            if (self.scrollStopTimeout) {
                clearTimeout(self.scrollStopTimeout);
            }

            self.scrollStopTimeout = setTimeout(scrollStop, 400);
        }

        function scrollStop() {
            if (self.$milestoneMarkers) self.$milestoneMarkers.remove();
            if (self.$scrollStatus) self.$scrollStatus.hide();
            self.scrollStopTimeout = null;
            self.scrollStarted = false;
        };

        function scroll() {
            if (self.scrollStopTimeout) {
                clearTimeout(self.scrollStopTimeout);
            }

            if (!self.scrollStarted) scrollStart();

            var scrollTop = self.$viewport.scrollTop(),
                percentScrolled = scrollTop / (self.scrollableHeight - self.viewportHeight),
                statusTop = self.viewportOffset.top + 40 + ((self.viewportHeight - 120) * percentScrolled) - self.scrollStatusHeight / 2;

            self.$scrollStatus
                    .text('' + which(percentScrolled, scrollTop))
                    .css({
                        top: statusTop,
                        right: self.viewportRight + 20
                    });

            self.scrollStopTimeout = setTimeout(scrollStop, 400);
        };

        function resize() {
            clearTimeout(self.scrollStopTimeout);
            scrollStop();
        };

        // only happens at the beginning of the scroll
        // stuff we have to do that's a little expensive, but doesn't happen on every scroll movement, just start
        function scrollStart() {
            self.viewportHeight = self.$viewport.height();
            self.viewportWidth = self.$viewport.width();
            self.viewportOffset = self.$viewport.offset();
            self.scrollStatusHeight = self.$scrollStatus.height();
            self.scrollableHeight = self.$viewport[0].scrollHeight;
            self.viewportRight = $(window).width() - (self.viewportOffset.left + self.$viewport.width()) + 3;
            self.rowHeight = self.$viewport.find('.slick-row').height() || 30;

            // if scrolling is necessary set it on up, otherwise just ignore
            if (self.scrollableHeight >= self.viewportHeight) {
                loadMilestones();

                self.$scrollStatus
                    .appendTo(document.body)
                    .css('top', self.viewportOffset.top + 20 - self.scrollStatusHeight / 2)
                    .show();
            }

            self.scrollStarted = true;
        };

        function loadMilestones() {
            var dataView = self.grid.getData(),
                windowWidth = $(window).width(),
                milestoneMarkers = "",
                top,
                right,
                item;

            self.totalItems = dataView.getLength();
            self.milestones = [];

            for (var i = 0; i < self.totalItems; i++) {
                item = dataView.getItem(i);

                if (options.milestoneTest(item)) {
                    self.milestones.push({ n: item[options.textProperty], p: (i + 1) / self.totalItems, i: i });

                    top = self.viewportOffset.top + (((i + 1) / self.totalItems) * (self.viewportHeight - 60) + 20);
                    right = windowWidth - (self.viewportOffset.left + self.viewportWidth) + 3;

                    milestoneMarkers += '<div class="scroll-helper-marker" style="top: ' + top + 'px; right: ' + right + 'px;"></div>';
                }
            }

            self.$milestoneMarkers = $(milestoneMarkers).appendTo(document.body).show();
        }

        // based on current percentScrolled, which milestone should we show
        function which(percentScrolled, scrollTop) {
            var milestone;

            var milestoneIsInView = function (index) {
                return (self.rowHeight * (self.milestones[index].i + 1)) <= ((self.viewportHeight * .5) + scrollTop);
            };

            var percentageGreaterThanPercentScrolled = function (index) {
                return self.milestones[index].p >= percentScrolled;
            };

            for (var i = 0; i < self.milestones.length; i++) {
                // if max scroll, display last milestone name
                if (percentScrolled >= 1) {
                    milestone = self.milestones[self.milestones.length - 1].n;
                    break;
                } else if (percentageGreaterThanPercentScrolled(i) || i == (self.milestones.length - 1)) {
                    if (milestoneIsInView(i)) {
                        milestone = self.milestones[i].n;
                        break;
                    } else {
                        milestone = self.milestones[i === 0 ? 0 : i - 1].n;
                        break;
                    }
                }
            }

            return milestone;
        }

        /**
         * Destroy plugin.
         */
        function destroy() {
            self.$viewport
                    .off('mousewheel', mousewheel)
                    .off('mouseup', scrollStop)
                    .off('scroll', scroll);
            self.$scrollStatus.remove();
        }

        // Public API
        $.extend(this, {
            "init": init,
            "destroy": destroy
        });
    }
})(jQuery);

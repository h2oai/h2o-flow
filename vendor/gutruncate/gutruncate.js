// The MIT License (MIT)

// Copyright (c) 2014 Glass Umbrella. Created by Eddie Lee.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

;
(function(factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery', 'knockout'], factory);
    } else {
        factory(jQuery, ko);
    }
}(function($, ko) {
    $.fn.gutruncate = function(options) {
        var defaults = {
            minLength: 150,
            tolerance: 80,
            readMoreText: "more",
            readLessText: "less",
            ellipsisText: "&hellip;",
            blockLevelMore: true,
            reapply: false,
            togglePosition: "bottom",
            externalToggle: null
        };

        var options = $.extend(defaults, options);

        var _showContent = function($element) {
            var moreLink = $(".gutruncate-more-link", $element);
            var moreContent = $(".gutruncate-more", $element);
            var ellipsis = $(".gutruncate-ellipsis", $element);

            if (options.externalToggle) {
                $(options.externalToggle).addClass("gutruncate_open");
                $(options.externalToggle).removeClass("gutruncate_closed");
            }

            $element.addClass("gutruncate_open");
            $element.removeClass("gutruncate_closed");
            moreContent.css("display", "inline");
            moreLink.text(options.readLessText);
            ellipsis.css("display", "none");
        };

        var _truncateContent = function($element) {
            var moreLink = $(".gutruncate-more-link", $element);
            var moreContent = $(".gutruncate-more", $element);
            var ellipsis = $(".gutruncate-ellipsis", $element);

            if (options.externalToggle) {
                $(options.externalToggle).removeClass("gutruncate_open");
                $(options.externalToggle).addClass("gutruncate_closed");
            }

            $element.removeClass("gutruncate_open");
            $element.addClass("gutruncate_closed");
            moreContent.css("display", "none");
            moreLink.text(options.readMoreText);
            ellipsis.css("display", "inline");
        };

        var _toggleContent = function(evt) {
            $element = $(evt.target).closest(".gutruncate");

            if ($element.hasClass("gutruncate_closed")) {
                _showContent($element);
            } else {
                _truncateContent($element);
            }
            return false;
        };

        return this.each(function(index, element) {

            $element = $(element);

            //Don't reapply
            if ($element.hasClass("gutruncate") && !options.reapply) {
                return true;
            }

            var body = $element.html().trim();

            //Don't apply if isnt long enough
            if (body.length <= options.minLength + options.tolerance) {
                return true;
            }

            //Don't apply if is all one word
            var splitLocation = body.indexOf(" ", options.minLength);
            if (splitLocation === -1 && (options.minLength + options.tolerance) > 0) {
                return true;
            }

            //If can't find a safe place to split within tolerance - split at exact length
            if (splitLocation > (options.minLength + options.tolerance)) {
                splitLocation = options.minLength;
            }

            //Split text
            var visibleSection = body.substring(0, splitLocation);
            var hiddenSection = body.substring(splitLocation);

            //Update DOM
            $element.html(
                visibleSection
                + "<span class=\"gutruncate-ellipsis\">"
                + options.ellipsisText
                + "</span>"
                + "<span class=\"gutruncate-more\">"
                + hiddenSection
                + "</span>"
            );

            if (!options.externalToggle) {
                //Add toggle link
                var toggle = (options.blockLevelMore ? "<div>" : " ")
                    + "<a href=\"javascript:void(0)\" class=\"gutruncate-more-link\">"
                    + options.readMoreText
                    + "</a>"
                    + (options.blockLevelMore ? "</div>" : "");

                if (options.togglePosition === "bottom") {
                    $element.append(toggle);
                } else if (options.togglePosition === "top") {
                    $element.prepend(toggle);
                }

                //Add click handler
                $(".gutruncate-more-link", $element).click(_toggleContent);
            } else if (!$element.hasClass("gutruncate")) {
                //Huck-up external toggle
                var target = this;
                $(options.externalToggle).click(function() {
                    _toggleContent({
                        target: target
                    });
                });
            }

            //Start off truncated
            _truncateContent($element);

            //Finished
            $element.addClass("gutruncate");
        });
    };

    if (ko !== undefined && ko.bindingHandlers !== undefined) {
        var _gutruncate = function(element, valueAccessor) {
            var binding = ko.unwrap(valueAccessor());
            var options = {};
            var text = "";

            if (binding === null) {
                binding = "";
            }

            if (typeof binding === "string") {
                text = binding;
            } else {
                text = ko.unwrap(binding.text);
                if (binding.options) {
                    options = ko.unwrap(binding.options);
                }
            }

            options.reapply = true; //Needs to rerun when changed
            $(element).html(htmlEncode(text));
            $(element).gutruncate(options);
        };

        ko.bindingHandlers.gutruncate = {
            init: _gutruncate,
            update: _gutruncate
        };
    }

    function htmlEncode(value) {
        return $('<div/>').text(value).html();
    }
}));
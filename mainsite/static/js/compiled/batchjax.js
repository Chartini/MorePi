(function() {
  /*
  Batchjax
  Copyright (c) 2011 Jason Stehle
  
  Permission is hereby granted, free of charge, to any person obtaining 
  a copy of this software and associated documentation files (the 
  "Software"), to deal in the Software without restriction, including 
  without limitation the rights to use, copy, modify, merge, publish, 
  distribute, sublicense, and/or sell copies of the Software, and to 
  permit persons to whom the Software is furnished to do so, subject to 
  the following conditions:
  
  The above copyright notice and this permission notice shall be 
  included in all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION 
  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */
  var $;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $ = jQuery;
  $.bjax = function(batch, settings) {
    /*
      If batch exists, append the current settings object to the batch for later execution.
      If batch is null, just make a direct ajax request.
      */    if (batch != null) {
      batch.add(settings);
    } else {
      if (settings.type === 'GET') {
        if (settings.cache !== true) {
          settings.cache = false;
        }
      }
      $.ajax(settings);
    }
  };
  $.bjax.batchPath = "/api/0.0/batch/";
  $.AjaxBatch = (function() {
    function AjaxBatch(onBatchAdded) {
      var _ref;
      this.onBatchAdded = onBatchAdded;
      this.calls = [];
      this.onBatchAdded = (_ref = this.onBatchAdded) != null ? _ref : function(count) {};
      return;
    }
    AjaxBatch.prototype.getCount = function() {
      return this.calls.length;
    };
    AjaxBatch.prototype.add = function(settings) {
      this.calls.push(settings);
      this.onBatchAdded(this.calls.length);
    };
    AjaxBatch.prototype.execute = function(callback, errorCallback) {
      var failureCallback, successCallback;
      this.callback = callback;
      this.errorCallback = errorCallback;
      if (this.calls.length === 0) {
        return false;
      }
      if (!(this.callback != null)) {
        this.callback = function() {};
      }
      if (!(this.errorCallback != null)) {
        this.errorCallback = function() {};
      }
      successCallback = __bind(function(response) {
        this.callback(response);
        return this.batchComplete(response);
      }, this);
      failureCallback = __bind(function(response) {
        return this.errorCallback(response);
      }, this);
      $.ajax({
        url: $.bjax.batchPath,
        type: "POST",
        data: JSON.stringify({
          "batch": this.calls
        }),
        success: successCallback,
        error: failureCallback
      });
      return true;
    };
    AjaxBatch.prototype.batchComplete = function(response) {
      var i, itemResponse, sourceCall, _len, _ref;
      _ref = response.responses;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        itemResponse = _ref[i];
        if (i >= this.calls.length) {
          continue;
        }
        sourceCall = this.calls[i];
        if (sourceCall.success != null) {
          sourceCall.success(itemResponse);
        }
      }
      return true;
    };
    return AjaxBatch;
  })();
}).call(this);

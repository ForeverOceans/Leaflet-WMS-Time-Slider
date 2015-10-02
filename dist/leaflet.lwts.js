L.Control.SliderControl = L.Control.extend({
  options: {
    position: 'topright',
    layers: null,
    maxValue: -1,
    minValue: -1,
    startTime: moment(0),
    endTime: moment(0),
    timeStep: 3600,
    range: false,
    dateDisplayFormat: 'YYYY-MM-DDTHH:mm:ssZ'
  },

  initialize: function(options) {
    L.Util.setOptions(this, options);

    // Initialize variables
    this._layer = null;
    this.multilayer = false;

    // Start and ending times are split into a number of slider positions based on number of milliseconds
    // requested to separate each position
    if (options.startTime) this._begin_time = moment(options.startTime);
    if (options.startTime) this._final_time = moment(options.endTime);
    // assume timeStep is in seconds and turn into milliseconds
    if (options.timeStep) this.options.timeStep = this.options.timeStep * 1000;

    // Check for multiple layers passed to SliderControl
    if (this.options.layers == null) {
      this._layer = this.options.layer;
      this.multilayer = false;
    } else {
      this._layer = this.options.layers;
      this.multilayer = true;
    }
  },

  setPosition: function(position) {
    var map = this._map;

    if (map) {
      map.removeControl(this);
    }

    this.options.position = position;

    if (map) {
      map.addControl(this);
    }
    this.startSlider();
    return this;
  },

  createSliderUI: function() {
    // Create a control sliderContainer with a jquery ui slider
    var sliderContainer = L.DomUtil.create('div', 'ui-slider-container', this._container);

    this._slider = $('<div class="ui-slider"><div class="ui-slider-handle"></div></div>');
    $(sliderContainer).append(this._slider);
    this._sliderTimestamp = $('<div class="ui-slider-timestamp"></div>');
    $(sliderContainer).append(this._sliderTimestamp);

    return sliderContainer;
  },

  onAdd: function(map) {
    this.options.map = map;

    var sliderContainer = this.createSliderUI();
    // Prevent map panning/zooming while using the slider
    $(sliderContainer).mousedown(function() {
      map.dragging.disable();
    });
    $(document).mouseup(function() {
      map.dragging.enable();
    });

    // Make sure a layer has been passed before creating a slider
    if (!this._layer) {
      console.log("Error: You must specify a layer via new SliderControl({layer: your_layer}); or like SliderControl({layers: [your_layer1, your_layer2]});");
    }
    return sliderContainer;
  },

  onRemove: function(map) {
    map.removeLayer(this._layer);
    $(this._slider).remove();
  },

  updateLayer: function(timestamps) {
    // format time to ISO 8601
    if (timestamps.length === 1) {
      timestamp = timestamps[0].format();
    }
    else {
      timestamp = timestamps[0].format() + '/' + timestamps[1].format();
    }
    if (this.multilayer == true) {
      for (var i = 0; i < this._layer.length; i++) {
        this._layer[i].setParams({
          time: timestamp
        });
      }
    } else {
      this._layer.setParams({
        // format string to ISO 8601
        time: timestamp
      });
    }
  },

  updateTimestamp: function(timestamps) {
    if (timestamps.length === 1) {
      $(this._sliderTimestamp).html(timestamps[0].format(this.options.dateDisplayFormat))
    }
    else {
      $(this._sliderTimestamp).html('Range: ' + timestamps[0].format(this.options.dateDisplayFormat)+ ' - ' + timestamps[1].format(this.options.dateDisplayFormat));
    }
  },

  buildTimestamp: function(start, end) {
    var timestamps = [];
    timestamps.push(moment(this._begin_time).add(start * this.options.timeStep, 'ms'));

    if (end) {
      timestamps.push(moment(this._begin_time).add(end * this.options.timeStep, 'ms'));
    }
    return timestamps;
  },

  startSlider: function() {
    var me = this;
    var timesteps = Math.round((me._final_time - me._begin_time) / me.options.timeStep);
    console.dir(timesteps)
    $(me._slider).slider({
      range: me.options.range,
      min: 0,
      max: timesteps,
      step: 1,
      slide: function(e, ui) {
        if (me.options.range) {
          me.updateTimestamp(me.buildTimestampRange(ui.values[0], ui.values[1]));
        } else {
          me.updateTimestamp(me.buildTimestamp(ui.value));
        }
      },
      stop: function(e, ui) {
        if (me.options.range) {
          me.updateLayer(me.buildTimestamp(ui.values[0], ui.values[1]));
        } else {
          me.updateLayer(me.buildTimestamp(ui.value));
        }
      }
    });

    // initialize
    if (me.options.range) {
      me.updateTimestamp(me.buildTimestamp(0,1));
      me.updateLayer(me.buildTimestamp(0,1));
    }
    else {
      me.updateTimestamp(me.buildTimestamp(0));
      me.updateLayer(me.buildTimestamp(0));
    }
  }
});

L.control.sliderControl = function(options) {
  return new L.Control.SliderControl(options);
};

/*
 * jQuery UI addresspicker @VERSION
 *
 * Copyright 2010, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Progressbar
 *
 * Depends:
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 *   jquery.ui.autocomplete.js
 */
(function( $, undefined ) {

  $.widget( "ui.addresspicker", {
    options: {
        appendAddressString: "",
        draggableMarker: true,
        regionBias: null,
        updateCallback: null,
        geocodePosition : true,
        mapOptions: {
            zoom: 5, 
            center: new google.maps.LatLng(46, 2), 
            scrollwheel: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        },
        elements: {
            map: false,
            lat: false,
            lng: false,
            locality: false,
						administrative_area_level_2: false,
            administrative_area_level_1: false,
						country: false,
						postal_code: false,
            type: false

        }
    },

    marker: function() {
      return this.gmarker;
    },
    
    map: function() {
      return this.gmap;
    },

    updatePosition: function() {
      this._updatePosition(this.gmarker.getPosition());
    },
    
    reloadPosition: function() {
      this.gmarker.setVisible(true);
      this.gmarker.setPosition(new google.maps.LatLng(this.lat.val(), this.lng.val()));
      this.gmap.setCenter(this.gmarker.getPosition());
    },
    
    selected: function() {
      return this.selectedResult;
    },
    
    _create: function() {
      this.geocoder = new google.maps.Geocoder();
      this.element.autocomplete({
        source: $.proxy(this._geocode, this),  
        focus:  $.proxy(this._focusAddress, this),
        select: $.proxy(this._selectAddress, this)
      });
      
      this.lat      = $(this.options.elements.lat);
      this.lng      = $(this.options.elements.lng);
      this.locality = $(this.options.elements.locality);
			this.administrative_area_level_2 = $(this.options.elements.administrative_area_level_2);
			this.administrative_area_level_1 = $(this.options.elements.administrative_area_level_1);
      this.country  = $(this.options.elements.country);
			this.postal_code = $(this.options.elements.postal_code);
      this.type     = $(this.options.elements.type);
      if (this.options.elements.map) {
        this.mapElement = $(this.options.elements.map);
        this._initMap();
      }
    },

    _initMap: function() {
      if (this.lat && this.lat.val()) {
        this.options.mapOptions.center = new google.maps.LatLng(this.lat.val(), this.lng.val());
      }

      this.gmap = new google.maps.Map(this.mapElement[0], this.options.mapOptions);
      this.gmarker = new google.maps.Marker({
        position: this.options.mapOptions.center, 
        map:this.gmap, 
        draggable: this.options.draggableMarker});
      google.maps.event.addListener(this.gmarker, 'dragend', $.proxy(this._markerMoved, this));
      this.gmarker.setVisible(false);
    },
    
    _updatePosition: function(location) {
      if (this.lat) {
        this.lat.val(location.lat());
      }
      if (this.lng) {
        this.lng.val(location.lng());
      }
    },
    
    _geocodePosition : function geocodePosition() 
      {
        var self = this;
        this.geocoder.geocode
        ({
          latLng: this.gmarker.getPosition()
        }
         , 
         function(results, status) 
         {
           if (status == google.maps.GeocoderStatus.OK) 
           {
             var value = false;
             var address = results[0];
             self.element.val(results[0].formatted_address);
             if (self.locality) {
               value = self._findInfo(address, 'locality');
               self.locality.val(value ? value : '');
             }
             if (self.administrative_area_level_2) {
               value = self._findInfo(address, 'administrative_area_level_2');
               self.administrative_area_level_2.val(value ? value : '');
             }
             if (self.administrative_area_level_1) {
               value=self._findInfo(address, 'administrative_area_level_1');
               self.administrative_area_level_1.val(value ? value : '');
             }
             if (self.country) {
               value = self._findInfo(address, 'country');
               self.country.val(value ? value : '');
             }
             if (self.postal_code) {
               value = self._findInfo(address, 'postal_code');
               self.postal_code.val(value ? value : '');
             }
             if (self.type) {
               value = address.types[0];
               self.type.val(value ? value : '');
             }
           }
           else {
		self.lat.val('');
		self.lng.val('');
		self.element.val('');
		self.locality.val('');
		self.administrative_area_level_2.val('');
		self.administrative_area_level_1.val('');
		self.country.val('');
		self.postal_code.val('');
		self.type.val('');
		
	   }
         }
        );
      }
      ,
      _markerMoved: function() {
        this._updatePosition(this.gmarker.getPosition());
        if(this.options.geocodePosition){
          this._geocodePosition();
        }
      }    
    // Autocomplete source method: fill its suggests with google geocoder results
    _geocode: function(request, response) {
        var address = request.term, self = this;
        this.geocoder.geocode({
            'address': address + this.options.appendAddressString,
            'region': this.options.regionBias
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    results[i].label =  results[i].formatted_address;
                };
            } 
            response(results);
        })
    },
    
    _findInfo: function(result, type) {
      for (var i = 0; i < result.address_components.length; i++) {
        var component = result.address_components[i];
        if (component.types.indexOf(type) !=-1) {
          return component.long_name;
        }
      }
      return false;
    },
    
    _focusAddress: function(event, ui) {
      var address = ui.item;
      if (!address) {
        return;
      }
      
      if (this.gmarker) {
        this.gmarker.setPosition(address.geometry.location);
        this.gmarker.setVisible(true);

        this.gmap.fitBounds(address.geometry.viewport);
      }
      this._updatePosition(address.geometry.location);
      
      var value = false;
		
	
      if (this.locality) {
      	value = this._findInfo(address, 'locality'); 
      	this.locality.val(value ? value : '');
      
      }
      if (this.administrative_area_level_2) {
      	value = this._findInfo(address, 'administrative_area_level_2');
      	this.administrative_area_level_2.val(value ? value : '');
      }
      if (this.administrative_area_level_1) {
      	value=this._findInfo(address, 'administrative_area_level_1');
      	this.administrative_area_level_1.val(value ? value : '');
      }
      if (this.country) {
      	value = this._findInfo(address, 'country'); 
      	this.country.val(value ? value : '');
      }
      if (this.postal_code) {
      	value = this._findInfo(address, 'postal_code');
      	this.postal_code.val(value ? value : '');
      }
      if (this.type) {
      	value = address.types[0];
      	this.type.val(value ? value : '');
      } 
    },
    
    _selectAddress: function(event, ui) {
      this.selectedResult = ui.item;
      if (this.options.updateCallback) {
        this.options.updateCallback(this.selectedResult);
      }
    }
  });

  $.extend( $.ui.addresspicker, {
    version: "@VERSION"
  });

  // make IE think it doesn't suck
  if(!Array.indexOf){
    Array.prototype.indexOf = function(obj){
      for(var i=0; i<this.length; i++){
        if(this[i]==obj){
          return i;
        }
      }
      return -1;
    }
  }

})( jQuery );

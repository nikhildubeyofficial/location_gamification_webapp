import React, { useEffect } from 'react'

const MapView = () => {
  useEffect(() => {
    // Define the global initMappls function
    window.initMappls = function() {
      // Get device location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var lat = position.coords.latitude;
          var lng = position.coords.longitude;

          // Wait 3 seconds before showing map
          setTimeout(() => {
            var map = new window.mappls.Map('map', {
              center: [lat, lng],
              zoom: 15,
              layer: "vector",
              geolocation: true
            });

            // Add marker at device location
            new window.mappls.Marker({
              map: map,
              position: {lat: lat, lng: lng},
              popupHtml: "<b>You are here!</b>"
            });
          }, 3000);

        }, function(error) {
          alert("Error getting location: " + error.message);
        });
      } else {
        alert("Geolocation not supported by this browser.");
      }
    }

    // Check if mappls is already loaded
    if (window.mappls) {
      window.initMappls();
    }
  }, [])

  return (
    <div style={{
      margin: 0,
      padding: 0,
      width: '100%',
      height: '100vh'
    }}>
      <div id="map" style={{
        margin: 0,
        padding: 0,
        width: '100%',
        height: '100vh'
      }}></div>
    </div>
  )
}

export default MapView

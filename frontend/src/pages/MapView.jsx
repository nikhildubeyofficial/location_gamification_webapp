import React, { useEffect, useState } from 'react'

// Global steps variable with browser storage
let globalSteps = parseInt(localStorage.getItem('fitquest_steps') || '0');

const MapView = () => {
  const [steps, setSteps] = useState(globalSteps);
  const [distance, setDistance] = useState(parseFloat(localStorage.getItem('fitquest_distance') || '0'));
  const [isTracking, setIsTracking] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [watchId, setWatchId] = useState(null);

  // Configure stride length (average step size in meters)
  const stride = 0.78;

  // Haversine formula to calculate distance between two GPS points
  const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth's radius in meters
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(lat1*toRad) * Math.cos(lat2*toRad) *
              Math.sin(dLon/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Save steps and distance to localStorage
  const saveToStorage = (newSteps, newDistance) => {
    globalSteps = newSteps;
    localStorage.setItem('fitquest_steps', newSteps.toString());
    localStorage.setItem('fitquest_distance', newDistance.toString());
  };

  // Start GPS tracking for step counting
  const startStepTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    const id = navigator.geolocation.watchPosition(pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const acc = pos.coords.accuracy;

      console.log(`GPS Update: lat=${lat.toFixed(6)}, lon=${lon.toFixed(6)}, accuracy=${acc.toFixed(1)}m`);

      // Accept any GPS reading for indoor use - don't skip based on accuracy
      // if (acc > 200) {
      //   console.log('GPS accuracy too poor, skipping...');
      //   return;
      // }

      if (lastPos) {
        const d = haversine(lastPos.lat, lastPos.lon, lat, lon);
        console.log(`Distance moved: ${d.toFixed(2)}m`);

        // Accept any movement for step counting - even tiny GPS variations
        if (d > 0.01) {
          setDistance(prevDistance => {
            const newDistance = prevDistance + d;
            const newSteps = Math.floor(newDistance / stride);
            
            console.log(`Adding ${d.toFixed(2)}m, Total: ${newDistance.toFixed(1)}m, Steps: ${newSteps}`);
            
            setSteps(newSteps);
            saveToStorage(newSteps, newDistance);
            return newDistance;
          });
        } else {
          console.log(`Movement too small: ${d.toFixed(4)}m, ignoring`);
        }
      } else {
        console.log('First GPS position recorded');
      }

      setLastPos({ lat, lon });
    }, err => {
      console.error('GPS tracking error:', err);
      alert('GPS Error: ' + err.message);
    }, {
      enableHighAccuracy: true,
      maximumAge: 500,
      timeout: 10000
    });

    setWatchId(id);
    setIsTracking(true);
  };

  // Stop GPS tracking
  const stopStepTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };

  // Reset steps counter
  const resetSteps = () => {
    setSteps(0);
    setDistance(0);
    setLastPos(null);
    saveToStorage(0, 0);
  };

  // Manual step increment for testing
  const addTestStep = () => {
    const newSteps = steps + 1;
    const newDistance = newSteps * stride;
    setSteps(newSteps);
    setDistance(newDistance);
    saveToStorage(newSteps, newDistance);
    console.log(`Manual step added: ${newSteps} steps, ${newDistance.toFixed(1)}m`);
  };

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

            // Auto-start step tracking when map loads
            startStepTracking();
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

    // Cleanup on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [])

  return (
    <div style={{
      margin: 0,
      padding: 0,
      width: '100%',
      height: '100vh',
      position: 'relative'
    }}>
      {/* Map Container */}
      <div id="map" style={{
        margin: 0,
        padding: 0,
        width: '100%',
        height: '100vh'
      }}></div>

      {/* Steps Dashboard Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        fontFamily: 'Arial, sans-serif',
        zIndex: 1000,
        minWidth: '200px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>📊 Step Counter</h3>
        <div style={{ fontSize: '16px', lineHeight: '1.5' }}>
          <div>🚶 Steps: <strong>{steps}</strong></div>
          <div>📏 Distance: <strong>{distance.toFixed(1)}m</strong></div>
          <div>📍 Status: <span style={{ color: isTracking ? '#4CAF50' : '#FF9800' }}>
            {isTracking ? 'Tracking' : 'Stopped'}
          </span></div>
        </div>
        
        {/* Control Buttons */}
        <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button 
            onClick={isTracking ? stopStepTracking : startStepTracking}
            style={{
              padding: '5px 10px',
              backgroundColor: isTracking ? '#f44336' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {isTracking ? 'Stop' : 'Start'}
          </button>
          <button 
            onClick={addTestStep}
            style={{
              padding: '5px 10px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            +1 Step
          </button>
          <button 
            onClick={resetSteps}
            style={{
              padding: '5px 10px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default MapView

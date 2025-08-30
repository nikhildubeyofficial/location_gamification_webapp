// Mappls API Integration Library
class MapplsAPI {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseURL = 'https://apis.mappls.com/advancedmaps/v1'
    this.map = null
  }

  // Initialize Mappls Map
  initializeMap(containerId, options = {}) {
    const defaultOptions = {
      center: [28.6139, 77.2090], // Delhi coordinates
      zoom: 10,
      zoomControl: true,
      location: true,
      ...options
    }

    try {
      this.map = new mappls.Map(containerId, {
        key: this.apiKey,
        ...defaultOptions
      })

      this.map.addListener('load', () => {
        console.log('Mappls map loaded successfully')
      })

      return this.map
    } catch (error) {
      console.error('Failed to initialize Mappls map:', error)
      throw error
    }
  }

  // Get current location
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    })
  }

  // Geocoding - Convert address to coordinates
  async geocode(address) {
    try {
      const response = await fetch(
        `${this.baseURL}/${this.apiKey}/geo_code?addr=${encodeURIComponent(address)}`
      )
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        return {
          lat: parseFloat(data.results[0].lat),
          lng: parseFloat(data.results[0].lng),
          address: data.results[0].formatted_address
        }
      }
      throw new Error('No results found')
    } catch (error) {
      console.error('Geocoding error:', error)
      throw error
    }
  }

  // Reverse Geocoding - Convert coordinates to address
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `${this.baseURL}/${this.apiKey}/rev_geocode?lat=${lat}&lng=${lng}`
      )
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        return {
          address: data.results[0].formatted_address,
          locality: data.results[0].locality,
          city: data.results[0].city,
          state: data.results[0].state
        }
      }
      throw new Error('No address found')
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      throw error
    }
  }

  // Get route directions
  async getDirections(start, end, profile = 'driving') {
    try {
      const response = await fetch(
        `${this.baseURL}/${this.apiKey}/route_adv/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=polyline&overview=full&steps=true`
      )
      const data = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry,
          steps: route.legs[0].steps,
          coordinates: this.decodePolyline(route.geometry)
        }
      }
      throw new Error('No route found')
    } catch (error) {
      console.error('Directions error:', error)
      throw error
    }
  }

  // Snap to road - Clean GPS traces
  async snapToRoad(coordinates) {
    try {
      const coordString = coordinates.map(coord => `${coord.lng},${coord.lat}`).join(';')
      const response = await fetch(
        `${this.baseURL}/${this.apiKey}/snapToRoad?coordinates=${coordString}`
      )
      const data = await response.json()
      
      if (data.snappedPoints) {
        return data.snappedPoints.map(point => ({
          lat: point.location.latitude,
          lng: point.location.longitude,
          originalIndex: point.originalIndex
        }))
      }
      throw new Error('Failed to snap to road')
    } catch (error) {
      console.error('Snap to road error:', error)
      throw error
    }
  }

  // Create geofence
  async createGeofence(center, radius, name) {
    // Note: This would typically be handled by backend
    // For demo purposes, we'll create a client-side geofence
    return {
      id: Date.now().toString(),
      name,
      center,
      radius,
      active: true
    }
  }

  // Check if point is inside geofence
  isInsideGeofence(point, geofence) {
    const distance = this.calculateDistance(point, geofence.center)
    return distance <= geofence.radius
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(point1, point2) {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = point1.lat * Math.PI/180
    const φ2 = point2.lat * Math.PI/180
    const Δφ = (point2.lat-point1.lat) * Math.PI/180
    const Δλ = (point2.lng-point1.lng) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  // Search for nearby POIs
  async searchNearby(center, query, radius = 1000) {
    try {
      const response = await fetch(
        `${this.baseURL}/${this.apiKey}/textsearch?query=${encodeURIComponent(query)}&location=${center.lat},${center.lng}&radius=${radius}`
      )
      const data = await response.json()
      
      if (data.suggestedLocations) {
        return data.suggestedLocations.map(location => ({
          id: location.placeName,
          name: location.placeName,
          lat: parseFloat(location.latitude),
          lng: parseFloat(location.longitude),
          address: location.placeAddress,
          type: location.type
        }))
      }
      return []
    } catch (error) {
      console.error('Nearby search error:', error)
      return []
    }
  }

  // Add marker to map
  addMarker(position, options = {}) {
    if (!this.map) return null

    const marker = new mappls.Marker({
      position: position,
      map: this.map,
      ...options
    })

    return marker
  }

  // Add polyline to map
  addPolyline(coordinates, options = {}) {
    if (!this.map) return null

    const polyline = new mappls.Polyline({
      path: coordinates,
      map: this.map,
      strokeColor: options.color || '#FF0000',
      strokeWeight: options.weight || 3,
      strokeOpacity: options.opacity || 0.8,
      ...options
    })

    return polyline
  }

  // Add circle (for geofences)
  addCircle(center, radius, options = {}) {
    if (!this.map) return null

    const circle = new mappls.Circle({
      center: center,
      radius: radius,
      map: this.map,
      fillColor: options.fillColor || '#FF0000',
      fillOpacity: options.fillOpacity || 0.2,
      strokeColor: options.strokeColor || '#FF0000',
      strokeWeight: options.strokeWeight || 2,
      ...options
    })

    return circle
  }

  // Decode polyline geometry
  decodePolyline(encoded) {
    const points = []
    let index = 0
    const len = encoded.length
    let lat = 0
    let lng = 0

    while (index < len) {
      let b, shift = 0, result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lat += dlat

      shift = 0
      result = 0
      do {
        b = encoded.charCodeAt(index++) - 63
        result |= (b & 0x1f) << shift
        shift += 5
      } while (b >= 0x20)
      
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1))
      lng += dlng

      points.push({ lat: lat / 1e5, lng: lng / 1e5 })
    }

    return points
  }

  // Get map bounds
  getBounds() {
    if (!this.map) return null
    return this.map.getBounds()
  }

  // Fit map to bounds
  fitBounds(bounds) {
    if (!this.map) return
    this.map.fitBounds(bounds)
  }

  // Set map center
  setCenter(position) {
    if (!this.map) return
    this.map.setCenter(position)
  }

  // Set map zoom
  setZoom(zoom) {
    if (!this.map) return
    this.map.setZoom(zoom)
  }
}

export default MapplsAPI

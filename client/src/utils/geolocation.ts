export interface GeolocationCoords {
  latitude: number
  longitude: number
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export interface GeolocationError {
  code: number
  message: string
}

export const isGeolocationSupported = (): boolean => {
  return 'geolocation' in navigator
}

export const getCurrentPosition = (
  options: GeolocationOptions = {}
): Promise<GeolocationCoords> => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject({
        code: -1,
        message: '浏览器不支持地理位置服务',
      })
      return
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        const errorMessages: Record<number, string> = {
          [error.PERMISSION_DENIED]: '用户拒绝了地理位置请求',
          [error.POSITION_UNAVAILABLE]: '位置信息不可用',
          [error.TIMEOUT]: '获取位置超时',
        }
        reject({
          code: error.code,
          message: errorMessages[error.code] || '获取位置失败',
        })
      },
      defaultOptions
    )
  })
}

export const watchPosition = (
  successCallback: (coords: GeolocationCoords) => void,
  errorCallback?: (error: GeolocationError) => void,
  options: GeolocationOptions = {}
): number => {
  if (!isGeolocationSupported()) {
    if (errorCallback) {
      errorCallback({
        code: -1,
        message: '浏览器不支持地理位置服务',
      })
    }
    return -1
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options,
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      successCallback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      })
    },
    (error) => {
      if (errorCallback) {
        const errorMessages: Record<number, string> = {
          [error.PERMISSION_DENIED]: '用户拒绝了地理位置请求',
          [error.POSITION_UNAVAILABLE]: '位置信息不可用',
          [error.TIMEOUT]: '获取位置超时',
        }
        errorCallback({
          code: error.code,
          message: errorMessages[error.code] || '获取位置失败',
        })
      }
    },
    defaultOptions
  )
}

export const clearWatch = (watchId: number): void => {
  if (watchId !== -1 && isGeolocationSupported()) {
    navigator.geolocation.clearWatch(watchId)
  }
}

export const calculateDistance = (
  coords1: GeolocationCoords,
  coords2: GeolocationCoords
): number => {
  const earthRadius = 6371000

  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

  const dLat = toRadians(coords2.latitude - coords1.latitude)
  const dLon = toRadians(coords2.longitude - coords1.longitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coords1.latitude)) *
      Math.cos(toRadians(coords2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadius * c
}

export const isWithinRadius = (
  currentCoords: GeolocationCoords,
  targetCoords: GeolocationCoords,
  radiusInMeters: number
): boolean => {
  const distance = calculateDistance(currentCoords, targetCoords)
  return distance <= radiusInMeters
}

export const formatCoords = (
  coords: GeolocationCoords,
  format: 'decimal' | 'dms' = 'decimal',
  decimals: number = 6
): string => {
  if (format === 'dms') {
    const toDMS = (decimal: number, isLat: boolean): string => {
      const direction = decimal >= 0 ? (isLat ? 'N' : 'E') : isLat ? 'S' : 'W'
      const absDecimal = Math.abs(decimal)
      const degrees = Math.floor(absDecimal)
      const minutes = Math.floor((absDecimal - degrees) * 60)
      const seconds = ((absDecimal - degrees - minutes / 60) * 3600).toFixed(2)
      return `${degrees}°${minutes}'${seconds}"${direction}`
    }
    return `${toDMS(coords.latitude, true)}, ${toDMS(coords.longitude, false)}`
  }

  return `${coords.latitude.toFixed(decimals)}, ${coords.longitude.toFixed(decimals)}`
}

export const parseCoords = (coordsStr: string): GeolocationCoords | null => {
  const match = coordsStr.match(
    /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/
  )
  if (match) {
    const latitude = parseFloat(match[1])
    const longitude = parseFloat(match[2])
    if (!isNaN(latitude) && !isNaN(longitude)) {
      return { latitude, longitude }
    }
  }
  return null
}

export const getBounds = (
  coords: GeolocationCoords,
  radiusInMeters: number
): {
  minLat: number
  maxLat: number
  minLon: number
  maxLon: number
} => {
  const earthRadius = 6371000
  const radiusInDegrees = (radiusInMeters / earthRadius) * (180 / Math.PI)

  const minLat = coords.latitude - radiusInDegrees
  const maxLat = coords.latitude + radiusInDegrees

  const minLon =
    coords.longitude -
    (radiusInDegrees / Math.cos((coords.latitude * Math.PI) / 180))
  const maxLon =
    coords.longitude +
    (radiusInDegrees / Math.cos((coords.latitude * Math.PI) / 180))

  return { minLat, maxLat, minLon, maxLon }
}

export const getMidpoint = (
  coords1: GeolocationCoords,
  coords2: GeolocationCoords
): GeolocationCoords => {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180
  const toDegrees = (radians: number): number => (radians * 180) / Math.PI

  const lat1 = toRadians(coords1.latitude)
  const lon1 = toRadians(coords1.longitude)
  const lat2 = toRadians(coords2.latitude)
  const lon2 = toRadians(coords2.longitude)

  const dLon = lon2 - lon1

  const bx = Math.cos(lat2) * Math.cos(dLon)
  const by = Math.cos(lat2) * Math.sin(dLon)

  const midLat = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) * (Math.cos(lat1) + bx) + by * by)
  )
  const midLon = lon1 + Math.atan2(by, Math.cos(lat1) + bx)

  return {
    latitude: toDegrees(midLat),
    longitude: toDegrees(midLon),
  }
}

export const getBearing = (
  start: GeolocationCoords,
  end: GeolocationCoords
): number => {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180
  const toDegrees = (radians: number): number => (radians * 180) / Math.PI

  const lat1 = toRadians(start.latitude)
  const lat2 = toRadians(end.latitude)
  const dLon = toRadians(end.longitude - start.longitude)

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

  const bearing = toDegrees(Math.atan2(y, x))
  return (bearing + 360) % 360
}

export const getBearingDirection = (bearing: number): string => {
  const directions = [
    '北',
    '东北',
    '东',
    '东南',
    '南',
    '西南',
    '西',
    '西北',
  ]
  const index = Math.round(bearing / 45) % 8
  return directions[index]
}

export const mockLocation = (
  center: GeolocationCoords,
  radiusInMeters: number = 100
): GeolocationCoords => {
  const radiusInDegrees = radiusInMeters / 111320

  const angle = Math.random() * 2 * Math.PI
  const distance = Math.random() * radiusInDegrees

  return {
    latitude: center.latitude + distance * Math.cos(angle),
    longitude: center.longitude + distance * Math.sin(angle),
  }
}

export const validateCoords = (coords: GeolocationCoords): boolean => {
  const { latitude, longitude } = coords
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

export default {
  isGeolocationSupported,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  calculateDistance,
  isWithinRadius,
  formatCoords,
  parseCoords,
  getBounds,
  getMidpoint,
  getBearing,
  getBearingDirection,
  mockLocation,
  validateCoords,
}

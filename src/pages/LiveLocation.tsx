import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonToast,
  IonSpinner,
} from '@ionic/react';
import { Geolocation } from '@capacitor/geolocation';
import { Share } from '@capacitor/share';
import { shareSocialOutline, refreshOutline, locationSharp, mapOutline } from 'ionicons/icons';
import Header from '../components/Header';
import '../LiveLocation.css';

const LiveLocation: React.FC = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastLocation, setLastLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [locationHistory, setLocationHistory] = useState<Array<{ latitude: number, longitude: number }>>([]);
  const [isLocationFetched, setIsLocationFetched] = useState<boolean>(false);

  useEffect(() => {
    const savedLocation = localStorage.getItem('lastLocation');
    const savedLastLocation = localStorage.getItem('lastVisitedLocation');
    if (savedLocation) {
      const locationData = JSON.parse(savedLocation);
      setLocation(locationData);
      setLocationHistory([locationData]);
    }
    if (savedLastLocation) {
      const lastLocationData = JSON.parse(savedLastLocation);
      setLastLocation(lastLocationData);

      // Fetch address for the last location
      if (lastLocationData.latitude && lastLocationData.longitude) {
        fetchAddress(lastLocationData.latitude, lastLocationData.longitude);
      }
    }
  }, []);

  const getLocation = async () => {
    setLoading(true);
    setIsLocationFetched(true);
    try {
      const position = await Geolocation.getCurrentPosition();
      const { latitude, longitude } = position.coords;

      setLocation({ latitude, longitude });
      setAddressLoading(true);
      await fetchAddress(latitude, longitude);

      setLocationHistory((prevHistory) => {
        const newHistory = [...prevHistory, { latitude, longitude }];
        localStorage.setItem('lastLocation', JSON.stringify({ latitude, longitude }));
        return newHistory;
      });

      localStorage.setItem('lastVisitedLocation', JSON.stringify({ latitude, longitude }));
      setLastLocation({ latitude, longitude });

    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMessage('Failed to get location. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddress = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.display_name) {
        setAddress(data.display_name || 'Address not available');
      } else {
        setAddress('Unable to fetch address.');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      setAddress('Error occurred while fetching address.');
      setErrorMessage('Error occurred while fetching address.');
      setShowToast(true);
    } finally {
      setAddressLoading(false);
    }
  };

  const shareLocation = async () => {
    if (location) {
      try {
        const locationUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
        const message = address
          ? `Here is my current location: ${address}`
          : `Here is my current location: Latitude ${location.latitude}, Longitude ${location.longitude}`;

        await Share.share({
          title: 'My Current Location',
          text: message,
          url: locationUrl,
          dialogTitle: 'Share Location',
        });
      } catch (error) {
        console.error('Error sharing location:', error);
        setErrorMessage('Failed to share location.');
        setShowToast(true);
      }
    } else {
      alert('Please get your location first before sharing.');
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setShowToast(false);
    getLocation();
  };

  const openGoogleMaps = () => {
    if (lastLocation) {
      const { latitude, longitude } = lastLocation;
      const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <IonPage>
      <Header title="Location" />
      <IonContent className="live-location-content">
        <IonCard className="location-card">
          <IonCardHeader>
            <IonCardTitle>Your Location</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loading ? (
              <div className="loading-container">
                <IonSpinner name="crescent" />
                <p>Fetching location...</p>
              </div>
            ) : isLocationFetched ? (
              <div className="location-details">
                <p><strong>Latitude:</strong> {location?.latitude}</p>
                <p><strong>Longitude:</strong> {location?.longitude}</p>
                {addressLoading ? (
                  <p>Fetching address...</p>
                ) : address ? (
                  <p><strong>Address:</strong> {address}</p>
                ) : (
                  <p>Unable to fetch address.</p>
                )}
                <IonIcon
                  icon={shareSocialOutline}
                  className="share-icon"
                  onClick={shareLocation}
                />
              </div>
            ) : (
              <p className="no-location">Press 'Get Location' to fetch your location.</p>
            )}
            <IonButton expand="block" onClick={getLocation} className="get-location-button" color={'danger'} >
              Get Location
            </IonButton>
            {errorMessage && (
              <IonButton expand="block" color="warning" onClick={handleRetry}>
                <IonIcon icon={refreshOutline} /> Retry
              </IonButton>
            )}

            {lastLocation && (
              <IonCard className="distance-card" onClick={openGoogleMaps}>
                <IonCardHeader>
                  <IonCardTitle>Last Visited Location</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {addressLoading ? (
                    <p>Loading last location address...</p>
                  ) : address ? (
                    <p><strong>Address:</strong> {address}</p>
                  ) : (
                    <p>Last location address not available.</p>
                  )}
                  <IonIcon icon={mapOutline} className="map-icon" />
                  <p className="click-info">Click to view on Google Maps</p>

                </IonCardContent>
              </IonCard>
            )}

            {location && locationHistory.length > 1 && (
              <IonCard className="distance-card">
                <IonCardHeader>
                  <IonCardTitle>Distance from Last Location</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>
                    Distance from last location: {" "}
                    {calculateDistance(
                      location.latitude,
                      location.longitude,
                      locationHistory[locationHistory.length - 2].latitude,
                      locationHistory[locationHistory.length - 2].longitude
                    ).toFixed(2)} km
                  </p>
                </IonCardContent>
              </IonCard>
            )}
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={errorMessage || 'An error occurred'}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default LiveLocation;

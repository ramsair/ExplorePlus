import React from 'react';
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/react';
import { Route, Redirect, useLocation } from 'react-router-dom';
import { locationSharp, cameraSharp, scanSharp } from 'ionicons/icons';
import LiveLocation from '../pages/LiveLocation';
import TravelCamera from '../pages/Camera';
import DocumentVault from '../pages/DocumentVault';

const Tabs: React.FC = () => {
  const location = useLocation(); // Hook to get the current route

  return (
    <IonTabs>
      <IonRouterOutlet>
        {/* Tab Routes */}
        <Route path="/tabs/live-location" component={LiveLocation} exact />
        <Route path="/tabs/tourism-camera" component={TravelCamera} exact />
        <Route path="/tabs/document-vault" component={DocumentVault} exact />

        {/* Redirect default route to the first tab */}
        <Redirect exact path="/tabs" to="/tabs/live-location" />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
      <IonTabButton tab="document-vault" href="/tabs/document-vault">
          <IonIcon
            icon={scanSharp}
            style={{
              color: location.pathname === '/tabs/document-vault' ? 'red' : 'white',
            }}
          />
          <IonLabel
            style={{
              color: location.pathname === '/tabs/document-vault' ? 'red' : 'white',
            }}
          >
            Scanner
          </IonLabel>
        </IonTabButton>
        <IonTabButton tab="tourism-camera" href="/tabs/tourism-camera">
          <IonIcon
            icon={cameraSharp}
            style={{
              color: location.pathname === '/tabs/tourism-camera' ? 'red' : 'white',
            }}
          />
          <IonLabel
            style={{
              color: location.pathname === '/tabs/tourism-camera' ? 'red' : 'white',
            }}
          >
            Camera
          </IonLabel>
        </IonTabButton>
        <IonTabButton tab="live-location" href="/tabs/live-location">
          <IonIcon
            icon={locationSharp}
            style={{
              color: location.pathname === '/tabs/live-location' ? 'red' : 'white',
            }}
          />
          <IonLabel
            style={{
              color: location.pathname === '/tabs/live-location' ? 'red' : 'white',
            }}
          >
            Location
          </IonLabel>
        </IonTabButton>

     

       
      </IonTabBar>
    </IonTabs>
  );
};

export default Tabs;

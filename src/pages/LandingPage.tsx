import React from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';
import Header from '../components/Header';

const LandingPage: React.FC = () => (
  <IonPage>
    <Header title="TravelGuide" />
    <IonContent className="ion-text-center ion-padding">
      <h1>Welcome to TravelGuide</h1>
      <p>Your ultimate travel and safety companion.</p>
      <IonButton expand="block" href="/tabs">
        Enter App
      </IonButton>
    </IonContent>
  </IonPage>
);

export default LandingPage;

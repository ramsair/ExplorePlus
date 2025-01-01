import React from 'react';
import { IonFooter, IonToolbar, IonTitle } from '@ionic/react';

const Footer: React.FC = () => (
  <IonFooter>
    <IonToolbar>
      <IonTitle className="ion-text-center">TravelGuide © 2024</IonTitle>
    </IonToolbar>
  </IonFooter>
);

export default Footer;

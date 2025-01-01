import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonAlert,
} from '@ionic/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { trashOutline, closeOutline } from 'ionicons/icons';
import Header from '../components/Header';
import './TravelCamera.css'; // Import the CSS file

interface Photo {
  filepath: string;
  webviewPath: string;
}

const TravelCamera: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const folderName = 'MyAppData'; // Predefined folder name

  useEffect(() => {
    document.body.classList.remove('scanner-active');

    createAppFolder();
    loadSavedPhotos();
  }, []);

  const createAppFolder = async () => {
    try {
      await Filesystem.mkdir({
        directory: Directory.External,
        path: folderName,
        recursive: true, // Ensure parent directories are created
      });
    } catch (error) {
        console.error('Error creating app folder:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
      });

      const fileName = `photo_${new Date().getTime()}.jpeg`;
      const savedFileImage = await savePicture(image, fileName);

      const newPhotos = [savedFileImage, ...photos];
      setPhotos(newPhotos);
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  const savePicture = async (photo: any, fileName: string): Promise<Photo> => {
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    const base64 = await convertBlobToBase64(blob);

    await Filesystem.writeFile({
      path: `${folderName}/${fileName}`,
      data: base64 as string,
      directory: Directory.External,
    });

    return {
      filepath: `${folderName}/${fileName}`,
      webviewPath: photo.webPath!,
    };
  };

  const loadSavedPhotos = async () => {
    try {
      const { files } = await Filesystem.readdir({
        directory: Directory.External,
        path: folderName,
      });

      const loadedPhotos = await Promise.all(
        files.map(async (file) => {
          const filePath = `${folderName}/${file.name}`;
          const fileData = await Filesystem.readFile({
            path: filePath,
            directory: Directory.External,
          });

          return {
            filepath: filePath,
            webviewPath: `data:image/jpeg;base64,${fileData.data}`,
          };
        })
      );

      setPhotos(loadedPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const deletePhoto = async () => {
    if (selectedPhoto) {
      await Filesystem.deleteFile({
        path: selectedPhoto.filepath,
        directory: Directory.External,
      });

      const updatedPhotos = photos.filter((p) => p.filepath !== selectedPhoto.filepath);
      setPhotos(updatedPhotos);

      setSelectedPhoto(null);
      setIsAlertOpen(false);
    }
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string | ArrayBuffer | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  return (
    <IonPage>
      <Header title="Travel Camera" />
      <IonContent className="ion-padding">
        <IonButton expand="block" color="danger" className="camera-button" onClick={takePhoto}  >
          Take Photo
        </IonButton>
        <IonGrid className="photo-grid">
          <IonRow>
            {photos.map((photo, index) => (
              <IonCol size="4" key={index}>
                <img
                  src={photo.webviewPath}
                  alt={`Captured ${index}`}
                  className="photo-grid-img"
                  onClick={() => setSelectedPhoto(photo)}
                />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        {/* Photo Viewer Modal */}
        <IonModal isOpen={!!selectedPhoto} onDidDismiss={() => setSelectedPhoto(null)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Photo Viewer</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setSelectedPhoto(null)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {selectedPhoto && (
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <img
                  src={selectedPhoto.webviewPath}
                  alt="Full View"
                  className="modal-img"
                />
                <IonButton
                  fill="clear"
                  color="danger"
                  onClick={() => setIsAlertOpen(true)}
                  className="trash-btn"
                >
                  <IonIcon icon={trashOutline} />
                </IonButton>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Delete Confirmation Alert */}
        <IonAlert
          isOpen={isAlertOpen}
          onDidDismiss={() => setIsAlertOpen(false)}
          header="Confirm Delete"
          message="Are you sure you want to delete this photo?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setIsAlertOpen(false),
            },
            {
              text: 'Delete',
              role: 'confirm',
              handler: deletePhoto,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default TravelCamera;

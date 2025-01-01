import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonButtons,
  IonToast,
  IonAlert,
  IonHeader,
  IonToolbar,
  IonTitle,
  useIonViewWillLeave,
  useIonViewDidEnter,
} from '@ionic/react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { trashOutline, copyOutline } from 'ionicons/icons';

interface ScannedItem {
  filepath: string;
  content: string;
}

const ScannerWithPersistence: React.FC = () => {
  const [scanHistory, setScanHistory] = useState<ScannedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ScannedItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | undefined>(undefined);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const folderName = 'ScannedData';

  useEffect(() => {
    createAppFolder();
    loadSavedScans();

    // Prevent tab switching while scanning
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isScanning) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    // Stop scanning on visibility change (when the tab changes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isScanning) {
        stopScan();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScanning]);

  // Ensure the class is removed when the view is leaving
  useIonViewWillLeave(() => {
    if (isScanning) {
      stopScan();
    }
    document.body.classList.remove('scanner-active');
  });

  // Ensure the class is added back when the view is entered
  useIonViewDidEnter(() => {
    if (isScanning) {
      document.body.classList.add('scanner-active');
    }
  });

  const createAppFolder = async () => {
    try {
      await Filesystem.mkdir({
        directory: Directory.Data,
        path: folderName,
        recursive: true,
      });
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const startScan = async () => {
    try {
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (!status.granted) {
        alert('Camera permission is required to scan barcodes.');
        return;
      }

      setIsScanning(true);
      document.body.classList.add('scanner-active');
      BarcodeScanner.hideBackground();

      const result = await BarcodeScanner.startScan();
      if (result.hasContent) {
        const fileName = `scan_${new Date().getTime()}.txt`;
        await saveScannedData(result.content, fileName);

        // Automatically show scan result and stop scanning
        setScanHistory((prevHistory) => [
          { filepath: `${folderName}/${fileName}`, content: result.content },
          ...prevHistory,
        ]);

        if (navigator.vibrate) {
          navigator.vibrate(200);
        }

        setToastMessage('Scan successful!');
        stopScan(); // Automatically stop the scan after a result is found
      } else {
        alert('No data found in the barcode/QR code.');
        stopScan(); // Stop scanning if no content is found
      }
    } catch (error) {
      console.error('Error during scan:', error);
      alert('Failed to start scanning.');
      stopScan(); // Ensure stopScan is called on error
    }
  };

  const stopScan = async () => {
    try {
      // Stop scanning and show background
      await BarcodeScanner.stopScan();
      BarcodeScanner.showBackground(); // Restore the background
      setIsScanning(false);
      document.body.classList.remove('scanner-active'); // Ensure class is removed
    } catch (error) {
      console.error('Error stopping scan:', error);
    }
  };

  const saveScannedData = async (content: string, fileName: string) => {
    try {
      const base64Content = btoa(content);
      await Filesystem.writeFile({
        path: `${folderName}/${fileName}`,
        data: base64Content,
        directory: Directory.Data,
      });
    } catch (error) {
      console.error('Error saving scanned data:', error);
    }
  };

  const loadSavedScans = async () => {
    try {
      const { files } = await Filesystem.readdir({
        directory: Directory.Data,
        path: folderName,
      });
  
      const loadedScans = await Promise.all(
        files.map(async (file) => {
          const filePath = `${folderName}/${file.name}`;
          const fileData = await Filesystem.readFile({
            path: filePath,
            directory: Directory.Data,
          });
  
          let content: string;
  
          // Check if the data is a Blob or a string
          if (typeof fileData.data === 'string') {
            content = atob(fileData.data); // Decode Base64 to string
          } else {
            // If data is a Blob, convert it to Base64
            content = await blobToBase64(fileData.data as Blob);
          }
  
          return {
            filepath: filePath,
            content,
          };
        })
      );
  
      setScanHistory(loadedScans);
    } catch (error) {
      console.error('Error loading scanned data:', error);
    }
  };
  
  // Helper function to convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  

  const deleteScannedItem = async () => {
    if (selectedItem) {
      try {
        await Filesystem.deleteFile({
          path: selectedItem.filepath,
          directory: Directory.Data,
        });
        setScanHistory((prevHistory) =>
          prevHistory.filter((item) => item.filepath !== selectedItem.filepath)
        );
        setSelectedItem(null);
        setIsAlertOpen(false);
        setToastMessage('Item deleted successfully!');
      } catch (error) {
        console.error('Error deleting scanned item:', error);
      }
    }
  };

  const copyItemToClipboard = async (content: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
        setToastMessage('Copied to clipboard!');
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setToastMessage('Copied to clipboard (fallback)!'); 
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy scanned data. Please try again.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Scanner with Persistent Storage</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {!isScanning ? (
          <IonButton expand="block" onClick={startScan} color={'danger'} >
            Start Scan
          </IonButton>
        ) : (
          <IonButton expand="block" color="danger" onClick={stopScan}>
            Stop Scanner
          </IonButton>
        )}

        {!isScanning && (
          <IonList>
            <IonListHeader>Scanned Items</IonListHeader>
            {scanHistory.map((item, index) => (
              <IonItem key={index}>
                <IonLabel>{item.content}</IonLabel>
                <IonButtons slot="end">
                  <IonButton onClick={() => copyItemToClipboard(item.content)}>
                    <IonIcon icon={copyOutline} />
                  </IonButton>
                  <IonButton
                    color="danger"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsAlertOpen(true);
                    }}
                  >
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </IonButtons>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setToastMessage(undefined)}
        />

        <IonAlert
          isOpen={isAlertOpen}
          onDidDismiss={() => setIsAlertOpen(false)}
          header="Confirm Delete"
          message="Are you sure you want to delete this scanned item?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setIsAlertOpen(false),
            },
            {
              text: 'Delete',
              role: 'confirm',
              handler: deleteScannedItem,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ScannerWithPersistence;

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import UploadText from '@/components/upload-text';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Alert, ActivityIndicator, Pressable, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import { decode as base64ToArrayBuffer } from 'base64-arraybuffer';

export default function ModalScreen() {
  const insets = useSafeAreaInsets();
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [pending, setPending] = useState<
    | { uri: string; name: string; contentType: string; type: 'image' | 'pdf'; file?: any }
    | null
  >(null);

  // Upload when we have a web File object (react-dropzone)
  const uploadWebFile = async (file: any) => {
    try {
      setUploading(true);
      setLastUpload(null);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const { data: userData } = await supabase.auth.getUser();
      const prefix = userData?.user?.id ?? 'anon';
      const safeName = (file?.name as string) || `archivo`;
      const path = `${prefix}/${stamp}-${safeName}`;

      const { error } = await supabase
        .storage
        .from('uploads')
        .upload(path, file, { contentType: (file?.type as string) || undefined, upsert: false });

      if (error) throw error;
      setLastUpload(path);
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      setLastUrl(data.publicUrl);
      Alert.alert('Subida completa', 'Archivo cargado a Storage en ' + path);
    } catch (e: any) {
      Alert.alert('Error al subir', e?.message ?? 'Fallo desconocido');
    } finally {
      setUploading(false);
    }
  };

  // Upload when we have a local URI (native pickers) or blobbed resource
  const uploadFile = async (uri: string, fileName: string, contentType: string) => {
    try {
      setUploading(true);
      setLastUpload(null);
      // Convert local URI to a body compatible with Supabase Storage
      let body: Blob | ArrayBuffer;
      if (Platform.OS === 'web') {
        // On web, Object URLs/File URLs can be fetched to Blob
        const res = await fetch(uri);
        body = await res.blob();
      } else {
        // On native, use ArrayBuffer from base64 per Supabase guidance
        // Ensure the file is cached/readable
        // readAsStringAsync returns a base64 string without data URI prefix
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        body = base64ToArrayBuffer(base64);
      }

      // Build a unique path
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const { data: userData } = await supabase.auth.getUser();
      const prefix = userData?.user?.id ?? 'anon';
      const path = `${prefix}/${stamp}-${fileName}`;

      const { error } = await supabase
        .storage
        .from('uploads')
        .upload(path, body as any, { contentType, upsert: false });

      if (error) throw error;
  setLastUpload(path);
  const { data } = supabase.storage.from('uploads').getPublicUrl(path);
  setLastUrl(data.publicUrl);
      Alert.alert('Subida completa', 'Archivo cargado a Storage en ' + path);
    } catch (e: any) {
      Alert.alert('Error al subir', e?.message ?? 'Fallo desconocido');
    } finally {
      setUploading(false);
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setPending({
      uri: asset.uri,
      name: asset.name ?? 'documento.pdf',
      contentType: 'application/pdf',
      type: 'pdf',
      // On web, prefer the File object to upload directly without refetching
      file: (Platform.OS === 'web' ? (asset as any)?.file : undefined),
    });
  };

  const pickImage = async () => {
    // Request permissions (Android/iOS); web will no-op
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      exif: false,
      allowsMultipleSelection: false,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    const ext = (asset.fileName?.split('.').pop() || 'jpg').toLowerCase();
    const name = asset.fileName ?? `imagen.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    setPending({ uri: asset.uri, name, contentType, type: 'image' });
  };
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#EEF2FF', dark: '#0B1020' }}
      headerImage={
        <View style={styles.headerContainer}>
          <Image
            source={require('../../assets/images/partial-react-logo.png')}
            style={styles.headerImage}
            contentFit="cover"
          />
          <Pressable onPress={() => router.back()} style={[styles.backButton, { top: insets.top + 8 }]}>
            <MaterialIcons name="arrow-back" size={18} color="#fff" />
            <ThemedText style={styles.backText}>Regresar</ThemedText>
          </Pressable>
        </View>
      }
    >
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Sube tu contenido
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Elige un método o pega tu texto directamente para crear embeddings.
        </ThemedText>

        <View style={styles.optionsGrid}>
          <OptionTile
            icon={<MaterialIcons name="text-fields" size={22} color="#4f46e5" />}
            label="Texto"
            onPress={() => {
              // Espacio reservado para hacer scroll al card de texto
            }}
          />
          <OptionTile
            icon={<MaterialIcons name="picture-as-pdf" size={22} color="#e11d48" />}
            label="PDF"
            onPress={pickPdf}
          />
          <OptionTile
            icon={<MaterialIcons name="image" size={22} color="#06b6d4" />}
            label="Imagen"
            onPress={pickImage}
          />
          
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Agregar texto</ThemedText>
          {!!pending && (
            <View style={styles.previewBox}>
              <ThemedText style={styles.previewTitle}>Vista previa (sin subir aún)</ThemedText>
              {pending.type === 'image' ? (
                <Image source={{ uri: pending.uri }} style={styles.previewImage} contentFit="cover" />
              ) : (
                <View style={styles.pdfRow}>
                  <MaterialIcons name="picture-as-pdf" size={18} color="#e11d48" />
                  <ThemedText style={styles.pdfName}>{pending.name}</ThemedText>
                </View>
              )}
              <View style={styles.previewActions}>
                <Pressable
                  style={[styles.btn, styles.btnPrimary]}
                  disabled={uploading}
                  onPress={async () => {
                    if (pending.file && Platform.OS === 'web') {
                      await uploadWebFile(pending.file);
                    } else {
                      await uploadFile(pending.uri, pending.name, pending.contentType);
                    }
                    setPending(null);
                  }}
                >
                  <ThemedText style={styles.btnPrimaryText}>{uploading ? 'Subiendo…' : 'Subir'}</ThemedText>
                </Pressable>
                <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setPending(null)}>
                  <ThemedText>Cancelar</ThemedText>
                </Pressable>
              </View>
            </View>
          )}
          {/* Web-only drag & drop area */}
          <WebDropArea
            onFilePicked={(file: any) => {
              try {
                const url = URL.createObjectURL(file);
                const name = (file?.name as string) || 'archivo';
                const type = (file?.type as string) || '';
                const isImg = type.startsWith('image/');
                setPending({
                  uri: url,
                  name,
                  contentType: type || (isImg ? 'image/jpeg' : 'application/octet-stream'),
                  type: isImg ? 'image' : (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) ? 'pdf' : 'image',
                  file,
                });
              } catch {}
            }}
          />

          {uploading && (
            <View style={styles.uploadRow}>
              <ActivityIndicator size="small" color="#4f46e5" />
              <ThemedText style={styles.uploading}>Subiendo archivo…</ThemedText>
            </View>
          )}
          {!!lastUpload && (
            <View style={{ gap: 4 }}>
              <ThemedText style={styles.uploadDone}>Último archivo: {lastUpload}</ThemedText>
              {!!lastUrl && (
                <Pressable onPress={() => WebBrowser.openBrowserAsync(lastUrl)}>
                  <ThemedText type="link">Abrir archivo</ThemedText>
                </Pressable>
              )}
            </View>
          )}
          <UploadText />
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

function WebDropArea({ onFilePicked }: { onFilePicked: (file: any) => void }) {
  if (Platform.OS !== 'web') return null;
  // Dynamically require only on web to avoid native bundling issues
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useDropzone } = require('react-dropzone') as { useDropzone: any };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDropAccepted: (files: any[]) => {
      const file = files?.[0];
      if (file) onFilePicked(file);
    },
  });
  return (
    <View
      {...(getRootProps() as any)}
      style={[styles.dropZone, isDragActive && styles.dropZoneActive]}
    >
      {/* @ts-ignore - DOM input only in web */}
      <input {...(getInputProps() as any)} />
      <ThemedText>
        Arrastra y suelta aquí un archivo o haz clic para seleccionarlo (web)
      </ThemedText>
    </View>
  );
}

function OptionTile({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.tile,
        disabled && styles.tileDisabled,
        pressed && !disabled && { opacity: 0.8 },
      ]}
    >
      <View style={styles.tileIcon}>{icon}</View>
      <ThemedText style={styles.tileLabel}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.25,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  backText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  content: {
    gap: 12,
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    opacity: 0.8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tile: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tileDisabled: {
    opacity: 0.5,
  },
  tileIcon: {
    width: 24,
    alignItems: 'center',
  },
  tileLabel: {
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    opacity: 0.9,
  },
  previewBox: {
    gap: 10,
    paddingVertical: 6,
  },
  previewTitle: {
    opacity: 0.9,
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pdfName: {
    fontWeight: '600',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  btnGhost: {
    borderColor: '#2A2A2A',
  },
  dropZone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  dropZoneActive: {
    borderColor: '#4f46e5',
    backgroundColor: 'rgba(79,70,229,0.06)'
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  uploading: {
    opacity: 0.9,
  },
  uploadDone: {
    opacity: 0.8,
  },
});
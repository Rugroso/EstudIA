import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import UploadText from '@/components/upload-text';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Alert, ActivityIndicator, Pressable, StyleSheet, View, Platform, useWindowDimensions, Modal, ScrollView, Share } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import { decode as base64ToArrayBuffer } from 'base64-arraybuffer';
// Use dynamic import for expo-sharing to avoid bundling errors if not installed

export default function ModalScreen() {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [pdfFullscreen, setPdfFullscreen] = useState(false);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfTooLarge, setPdfTooLarge] = useState(false);
  const [pdfPreparing, setPdfPreparing] = useState(false);
  const [iosPdfLoading, setIosPdfLoading] = useState(false);
  const MAX_PDF_PREVIEW_SIZE = 6 * 1024 * 1024; // ~6MB guard to avoid memory spikes

  const buildPdfPreviewHtml = (base64: string) => `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      <style>
        html,body { margin:0; padding:0; height:100%; background:#111; color:#fff; }
        #wrap { display:flex; align-items:center; justify-content:center; height:100%; }
        canvas { width: 100%; height: auto; max-height: 100%; background:#222; }
        #controls { position:fixed; top:10px; left:50%; transform:translateX(-50%); display:flex; gap:8px; align-items:center; background:rgba(0,0,0,0.35); padding:6px 8px; border-radius:999px; backdrop-filter: blur(4px); }
        #controls button { background:#1f2937; color:#fff; border:none; padding:6px 10px; border-radius:8px; font-size:14px; }
        #controls span { font-size:12px; opacity:0.85; }
        #loading { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.2); }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.js"></script>
      <script>
        window.addEventListener('load', () => {
          const $ = (sel) => document.querySelector(sel);
          const showError = () => {
            document.body.innerHTML = '<div style="color:#fff;padding:16px;">No se pudo renderizar el PDF.</div>';
          };
          try {
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js';
            const b64 = '${base64}'.replace(/\n/g,'');
            const raw = atob(b64);
            const bytes = new Uint8Array(raw.length);
            for (let i=0; i<raw.length; i++) bytes[i] = raw.charCodeAt(i);
            let pdfDoc = null;
            let pageNum = 1;
            let scale = 1.4;
            let rendering = false;

            const canvas = document.getElementById('cv');
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const hideLoading = () => { const l=$('#loading'); if (l) l.style.display='none'; };
            const showLoading = () => { const l=$('#loading'); if (l) l.style.display='flex'; };

            const renderPage = async (num) => {
              if (!pdfDoc || rendering) return;
              rendering = true;
              showLoading();
              try {
                const page = await pdfDoc.getPage(num);
                const viewport = page.getViewport({ scale });
                canvas.width = viewport.width * dpr;
                canvas.height = viewport.height * dpr;
                canvas.style.width = viewport.width + 'px';
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                await page.render({ canvasContext: ctx, viewport }).promise;
              } catch (e) {
                showError();
              } finally {
                rendering = false;
                hideLoading();
                $('#page').textContent = pageNum + ' / ' + (pdfDoc ? pdfDoc.numPages : '?');
              }
            };

            const loadingTask = pdfjsLib.getDocument({ data: bytes });
            loadingTask.promise.then(async (pdf) => {
              pdfDoc = pdf;
              $('#total').textContent = String(pdf.numPages);
              await renderPage(pageNum);
            }).catch(showError);

            $('#prev').addEventListener('click', async () => {
              if (pageNum > 1) { pageNum--; await renderPage(pageNum); }
            });
            $('#next').addEventListener('click', async () => {
              if (pdfDoc && pageNum < pdfDoc.numPages) { pageNum++; await renderPage(pageNum); }
            });
            $('#zin').addEventListener('click', async () => { scale = Math.min(scale + 0.2, 4); await renderPage(pageNum); });
            $('#zout').addEventListener('click', async () => { scale = Math.max(scale - 0.2, 0.6); await renderPage(pageNum); });
          } catch (e) { showError(); }
        });
      </script>
    </head>
    <body>
      <div id="controls">
        <button id="prev">◀</button>
        <span id="page">1 / <span id="total">?</span></span>
        <button id="next">▶</button>
        <button id="zout">-</button>
        <button id="zin">+</button>
      </div>
      <div id="loading">Cargando…</div>
      <div id="wrap"><canvas id="cv"></canvas></div>
    </body>
  </html>`;
  const [pending, setPending] = useState<
    | {
        uri: string;
        name: string;
        contentType: string;
        type: 'image' | 'pdf';
        file?: any;
        width?: number;
        height?: number;
      }
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
      try {
        const signed = await supabase.storage.from('uploads').createSignedUrl(path, 60 * 60 * 24 * 7);
        if (signed.data?.signedUrl) {
          setLastUrl(signed.data.signedUrl);
        } else {
          const { data } = supabase.storage.from('uploads').getPublicUrl(path);
          setLastUrl(data.publicUrl);
        }
      } catch {
        const { data } = supabase.storage.from('uploads').getPublicUrl(path);
        setLastUrl(data.publicUrl);
      }
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
  try {
    const signed = await supabase.storage.from('uploads').createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signed.data?.signedUrl) {
      setLastUrl(signed.data.signedUrl);
    } else {
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      setLastUrl(data.publicUrl);
    }
  } catch {
    const { data } = supabase.storage.from('uploads').getPublicUrl(path);
    setLastUrl(data.publicUrl);
  }
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
    const next = {
      uri: asset.uri,
      name: asset.name ?? 'documento.pdf',
      contentType: 'application/pdf',
      type: 'pdf',
      // On web, prefer the File object to upload directly without refetching
      file: (Platform.OS === 'web' ? (asset as any)?.file : undefined),
    } as const;
    setPending(next as any);
    // Reset PDF state
    setPdfBase64(null);
    setPdfTooLarge(false);
    setPdfPreparing(false);
    // For native: iOS uses WKWebView with local file URI (no base64). Android uses pdf.js for small files.
    if (Platform.OS === 'android') {
      try {
        const info = await FileSystem.getInfoAsync(asset.uri, { size: true });
        const sz = (info as any)?.size as number | undefined;
        if (sz && sz > MAX_PDF_PREVIEW_SIZE) {
          setPdfTooLarge(true);
          return;
        }
        setPdfPreparing(true);
        const b64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        setPdfBase64(b64);
        setPdfPreparing(false);
      } catch {
        setPdfBase64(null);
        setPdfPreparing(false);
      }
    }
  };

  const openPdfExternallyAndroid = async (uri: string) => {
    if (Platform.OS !== 'android') return;
    try {
      // Lazily import to avoid bundling issues on web
      const IntentLauncher = await import('expo-intent-launcher');
      const contentUri = await FileSystem.getContentUriAsync(uri);
      await (IntentLauncher as any).startActivityAsync((IntentLauncher as any).ActivityAction.VIEW, {
        data: contentUri,
        type: 'application/pdf',
        flags: 1, // minimal flag to allow open
      });
    } catch (e) {
      Alert.alert('No se pudo abrir', 'Instala un visor de PDF o inténtalo después de subirlo.');
    }
  };

  const pickImage = async () => {
    // Request permissions (Android/iOS); web will no-op
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: (ImagePicker as any).MediaType?.Images ?? ImagePicker.MediaTypeOptions.Images,
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
    setPending({
      uri: asset.uri,
      name,
      contentType,
      type: 'image',
      width: asset.width,
      height: asset.height,
    });
  };

  const pickCamera = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      exif: false,
    });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    const ext = (asset.fileName?.split('.').pop() || 'jpg').toLowerCase();
    const name = asset.fileName ?? `cam_${Date.now()}.${ext}`;
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    setPending({
      uri: asset.uri,
      name,
      contentType,
      type: 'image',
      width: asset.width,
      height: asset.height,
    });
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
          <OptionTile
            icon={<MaterialIcons name="photo-camera" size={22} color="#16a34a" />}
            label="Cámara"
            onPress={pickCamera}
          />
          
        </View>

        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Agregar texto</ThemedText>
          {!!pending && (
            <View style={styles.previewBox}>
              <ThemedText style={styles.previewTitle}>Vista previa (sin subir aún)</ThemedText>
              {pending.type === 'image' ? (
                <Image
                  source={{ uri: pending.uri }}
                  // If we have dimensions, use aspectRatio to scale proportionally
                  style={[
                    styles.previewImage,
                    pending.width && pending.height
                      ? {
                          aspectRatio: pending.width / pending.height,
                          // Responsive max height (60% viewport height)
                          maxHeight: Math.max(220, Math.floor(winH * 0.6)),
                        }
                      : { height: Math.max(220, Math.floor(winH * 0.5)) },
                  ]}
                  contentFit="contain"
                  // Tap to open fullscreen
                  onTouchEnd={() => setFullscreen(true)}
                />
              ) : (
                <View style={{ gap: 8 }}>
                  <View style={styles.pdfRow}>
                    <MaterialIcons name="picture-as-pdf" size={18} color="#e11d48" />
                    <ThemedText style={styles.pdfName}>{pending.name}</ThemedText>
                  </View>
                  {Platform.OS === 'web' && (
                    <View style={{ height: Math.max(260, Math.floor(winH * 0.5)), borderRadius: 12, overflow: 'hidden' }}>
                      {/* Web render via iframe to avoid WebView unsupported */}
                      {/* @ts-ignore - raw DOM element on web */}
                      <iframe src={pending.uri} style={{ width: '100%', height: '100%', border: 'none' }} />
                    </View>
                  )}
                  {Platform.OS === 'ios' && (
                    <View style={{ height: Math.max(260, Math.floor(winH * 0.5)), borderRadius: 12, overflow: 'hidden' }}>
                      {/* Compute directory path access for WKWebView */}
                      {/* @ts-ignore - only on iOS; TS may not know allowingReadAccessToURL */}
                      <WebView
                        style={{ flex: 1 }}
                        originWhitelist={["*"]}
                        source={{ uri: pending.uri }}
                        allowingReadAccessToURL={pending.uri.replace(/\/[^/]*$/, '/')}
                        onLoadStart={() => setIosPdfLoading(true)}
                        onLoadEnd={() => setIosPdfLoading(false)}
                        onError={() => {
                          setIosPdfLoading(false);
                          Alert.alert('Error', 'No se pudo mostrar el PDF. Usa “Abrir en…” o súbelo y abre el enlace.');
                        }}
                      />
                      {iosPdfLoading && (
                        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
                          <ActivityIndicator size="small" color="#4f46e5" />
                        </View>
                      )}
                    </View>
                  )}
                  {Platform.OS === 'android' && (
                    pdfBase64 ? (
                      <View style={{ height: Math.max(260, Math.floor(winH * 0.5)), borderRadius: 12, overflow: 'hidden' }}>
                        <WebView style={{ flex: 1 }} originWhitelist={["*"]} source={{ html: buildPdfPreviewHtml(pdfBase64) }} />
                      </View>
                    ) : pdfPreparing ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                        <ActivityIndicator size="small" color="#4f46e5" />
                        <ThemedText style={{ opacity: 0.75 }}>Preparando vista previa…</ThemedText>
                      </View>
                    ) : pdfTooLarge ? (
                      <ThemedText style={{ opacity: 0.75 }}>
                        PDF muy grande para vista previa (&gt;{Math.floor(MAX_PDF_PREVIEW_SIZE/1024/1024)}MB). Abre pantalla completa o súbelo y usa el enlace público.
                      </ThemedText>
                    ) : (
                      <ThemedText style={{ opacity: 0.75 }}>
                        Preparando vista previa… Si no aparece, puedes subirlo y abrir el enlace.
                      </ThemedText>
                    )
                  )}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => setPdfFullscreen(true)}>
                      <ThemedText>Ver pantalla completa</ThemedText>
                    </Pressable>
                    {Platform.OS === 'ios' && (
                      <Pressable
                        style={[styles.btn, styles.btnGhost]}
                        onPress={async () => {
                          try {
                            const Sharing = await import('expo-sharing');
                            const available = await Sharing.isAvailableAsync();
                            if (available) await Sharing.shareAsync(pending.uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' } as any);
                            else Alert.alert('No disponible', 'La función de compartir no está disponible.');
                          } catch {}
                        }}
                      >
                        <ThemedText>Abrir en…</ThemedText>
                      </Pressable>
                    )}
                    {Platform.OS === 'android' && (
                      <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => openPdfExternallyAndroid(pending.uri)}>
                        <ThemedText>Abrir con visor</ThemedText>
                      </Pressable>
                    )}
                  </View>
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
                if (isImg) {
                  // Create a DOM Image to read natural dimensions (web only)
                  // @ts-ignore - DOM Image only available on web
                  const img = new (window as any).Image();
                  // @ts-ignore - web DOM event
                  img.onload = () => {
                    setPending({
                      uri: url,
                      name,
                      contentType: type || 'image/jpeg',
                      type: 'image',
                      file,
                      // @ts-ignore - DOM properties
                      width: img.naturalWidth,
                      // @ts-ignore - DOM properties
                      height: img.naturalHeight,
                    });
                  };
                  // @ts-ignore - web DOM event
                  img.onerror = () => {
                    setPending({
                      uri: url,
                      name,
                      contentType: type || 'image/jpeg',
                      type: 'image',
                      file,
                    });
                  };
                  // @ts-ignore - DOM property
                  img.src = url;
                } else {
                  setPending({
                    uri: url,
                    name,
                    contentType: type || 'application/octet-stream',
                    type: type === 'application/pdf' || name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
                    file,
                  });
                }
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
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Pressable onPress={() => WebBrowser.openBrowserAsync(lastUrl)}>
                    <ThemedText type="link">Abrir archivo</ThemedText>
                  </Pressable>
                  {Platform.OS === 'web' && (
                    <Pressable onPress={async () => { try { await (navigator as any).clipboard.writeText(lastUrl); Alert.alert('Copiado', 'Enlace copiado al portapapeles'); } catch {} }}>
                      <ThemedText type="link">Copiar enlace</ThemedText>
                    </Pressable>
                  )}
                  {(Platform.OS === 'ios' || Platform.OS === 'android') && (
                    <Pressable onPress={() => Share.share({ message: lastUrl })}>
                      <ThemedText type="link">Compartir</ThemedText>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          )}
          <UploadText />
        </View>

        {/* Fullscreen modal preview for images with pinch-to-zoom */}
        <Modal
          visible={!!pending && fullscreen && pending.type === 'image'}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullscreen(false)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalClose} onPress={() => setFullscreen(false)}>
              <MaterialIcons name="close" size={22} color="#fff" />
            </Pressable>
            <ScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={styles.modalContent}
              maximumZoomScale={4}
              minimumZoomScale={1}
              bouncesZoom
              // @ts-ignore - only iOS fully supports ScrollView zoom; Android will still show large image
              centerContent
            >
              {!!pending && (
                <Image
                  source={{ uri: pending.uri }}
                  style={{ width: '100%', aspectRatio: pending.width && pending.height ? pending.width / pending.height : 1 }}
                  contentFit="contain"
                />
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Fullscreen PDF viewer */}
        <Modal
          visible={!!pending && pdfFullscreen && pending.type === 'pdf'}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPdfFullscreen(false)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable style={styles.modalClose} onPress={() => setPdfFullscreen(false)}>
              <MaterialIcons name="close" size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1, width: '100%', paddingTop: 48 }}>
              {Platform.OS === 'web' && !!pending && (
                // @ts-ignore - raw DOM element on web
                <iframe src={pending.uri} style={{ width: '100%', height: '100%', border: 'none' }} />
              )}
              {Platform.OS === 'ios' && !!pending && (
                <WebView style={{ flex: 1 }} originWhitelist={["*"]} source={{ uri: pending.uri }} />
              )}
              {Platform.OS === 'android' && pdfBase64 && (
                <WebView style={{ flex: 1 }} originWhitelist={["*"]} source={{ html: buildPdfPreviewHtml(pdfBase64) }} />
              )}
              {Platform.OS === 'android' && !pdfBase64 && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }}>
                  <ThemedText style={{ color: '#fff', textAlign: 'center' }}>
                    Para ver el PDF en Android antes de subir, usa el visor integrado (si el archivo es pequeño) o sube y abre el enlace público.
                  </ThemedText>
                  {!!pending && (
                    <Pressable style={[styles.btn, { marginTop: 12, borderColor: 'rgba(255,255,255,0.25)' }]} onPress={() => openPdfExternallyAndroid(pending.uri)}>
                      <ThemedText style={{ color: '#fff' }}>Abrir con visor</ThemedText>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
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
    borderRadius: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    paddingTop: 24,
  },
  modalClose: {
    position: 'absolute',
    top: 30,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 8,
    borderRadius: 999,
  },
  modalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 48,
    paddingBottom: 24,
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
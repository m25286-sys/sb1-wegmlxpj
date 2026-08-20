import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera as CameraIcon, RefreshCw, X } from 'lucide-react-native';
import { Button } from '../components/Button';
import { colors, radius, spacing, typography } from '../constants/theme';

interface OcrResult {
  product_name?: string;
  ingredients?: string;
  nutrition?: Record<string, number>;
}

export default function CaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturing, setCapturing] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const callOcr = async (imageBase64: string): Promise<OcrResult | null> => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const apiUrl = `${supabaseUrl}/functions/v1/ocr-label`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey ?? '',
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error ?? '読み取りに失敗しました');
    }

    return await response.json();
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing || ocrLoading) return;
    setCapturing(true);
    setOcrError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      if (!photo?.uri) return;

      setCapturing(false);
      setOcrLoading(true);

      let ocrData: OcrResult | null = null;
      if (photo.base64) {
        try {
          ocrData = await callOcr(photo.base64);
        } catch (e) {
          setOcrError(
            e instanceof Error
              ? e.message
              : '読み取りに失敗しました。手動で入力することもできます。'
          );
        }
      }

      setOcrLoading(false);

      router.push({
        pathname: '/input',
        params: {
          photoUri: photo.uri,
          ocrData: ocrData ? JSON.stringify(ocrData) : '',
        },
      });
    } finally {
      setCapturing(false);
      setOcrLoading(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionIconWrap}>
          <CameraIcon size={40} color={colors.primary[600]} />
        </View>
        <Text style={[typography.h3, styles.permissionTitle]}>カメラへのアクセスが必要です</Text>
        <Text style={[typography.small, styles.permissionText]}>
          商品パッケージの原材料・栄養成分表示を撮影するために、カメラの使用を許可してください。
        </Text>
        <Button label="カメラを許可する" onPress={requestPermission} style={styles.permissionButton} />
        <Pressable onPress={() => router.back()}>
          <Text style={[typography.small, styles.cancelText]}>戻る</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <X size={22} color={colors.neutral[0]} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
          >
            <RefreshCw size={20} color={colors.neutral[0]} />
          </Pressable>
        </View>
        <View style={styles.guideWrap}>
          <View style={styles.guideBox} />
          <Text style={styles.guideText}>
            「原材料名」「栄養成分表示」が写るように撮影してください
          </Text>
        </View>
        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.shutterButton, (capturing || ocrLoading) && styles.shutterDisabled]}
            onPress={handleCapture}
            disabled={capturing || ocrLoading}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </SafeAreaView>

      {ocrLoading ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={[typography.bodyBold, styles.loadingTitle]}>読み取り中...</Text>
            <Text style={[typography.small, { color: colors.neutral[500] }]}>
              写真から原材料と栄養成分を自動で読み取っています
            </Text>
          </View>
        </View>
      ) : null}

      {ocrError && !ocrLoading ? (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Text style={[typography.small, { color: colors.neutral[700] }]}>
              {ocrError}
            </Text>
            <Pressable onPress={() => setOcrError(null)}>
              <Text style={[typography.small, { color: colors.primary[600], fontWeight: '600' }]}>
                閉じる
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(2),
    paddingTop: spacing(1),
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideWrap: {
    alignItems: 'center',
    gap: spacing(1.5),
    paddingHorizontal: spacing(3),
  },
  guideBox: {
    width: '85%',
    height: 180,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  guideText: {
    color: colors.neutral[0],
    textAlign: 'center',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: radius.md,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: spacing(4),
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    borderWidth: 4,
    borderColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[0],
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(3),
    gap: spacing(1.5),
  },
  permissionIconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    color: colors.neutral[600],
  },
  permissionButton: {
    width: '100%',
    marginTop: spacing(1),
  },
  cancelText: {
    color: colors.neutral[500],
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(3),
  },
  loadingCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    padding: spacing(3),
    alignItems: 'center',
    gap: spacing(1.5),
    width: '100%',
    maxWidth: 320,
  },
  loadingTitle: {
    color: colors.neutral[800],
  },
  errorOverlay: {
    position: 'absolute',
    bottom: spacing(12),
    left: spacing(2),
    right: spacing(2),
  },
  errorCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing(2),
    gap: spacing(1),
    alignItems: 'center',
  },
});

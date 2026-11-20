import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';

import { BrandedSplash } from './branded-splash';

/**
 * Hides the native splash as soon as the app has mounted, then shows the
 * animated branded splash on top of the app until it finishes.
 */
export function SplashOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    void SplashScreen.hideAsync().catch((error: unknown) => {
      console.error('Unable to hide the native splash screen.', error);
    });
  }, []);

  const handleFinish = useCallback(() => setVisible(false), []);

  if (!visible) return null;

  return <BrandedSplash onFinish={handleFinish} />;
}

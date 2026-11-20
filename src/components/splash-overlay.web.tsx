import { useCallback, useState } from 'react';

import { BrandedSplash } from './branded-splash';

/** Web has no native splash module, so the branded splash plays on its own. */
export function SplashOverlay() {
  const [visible, setVisible] = useState(true);

  const handleFinish = useCallback(() => setVisible(false), []);

  if (!visible) return null;

  return <BrandedSplash onFinish={handleFinish} />;
}

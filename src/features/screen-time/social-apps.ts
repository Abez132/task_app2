/**
 * Known social apps. Android reports package names, so the mapping keeps the
 * UI readable. Anything not listed still counts when its label looks social.
 */
const KNOWN_SOCIAL_APPS: Record<string, string> = {
  'com.instagram.android': 'Instagram',
  'com.instagram.barcelona': 'Threads',
  'com.zhiliaoapp.musically': 'TikTok',
  'com.ss.android.ugc.trill': 'TikTok',
  'com.facebook.katana': 'Facebook',
  'com.facebook.orca': 'Messenger',
  'com.facebook.lite': 'Facebook Lite',
  'com.snapchat.android': 'Snapchat',
  'com.twitter.android': 'X',
  'com.reddit.frontpage': 'Reddit',
  'com.google.android.youtube': 'YouTube',
  'com.google.android.apps.youtube.music': 'YouTube Music',
  'com.linkedin.android': 'LinkedIn',
  'com.pinterest': 'Pinterest',
  'com.tumblr': 'Tumblr',
  'com.bereal.ft': 'BeReal',
  'com.whatsapp': 'WhatsApp',
  'org.telegram.messenger': 'Telegram',
  'com.discord': 'Discord',
  'org.thoughtcrime.securesms': 'Signal',
  'com.viber.voip': 'Viber',
  'com.kakao.talk': 'KakaoTalk',
  'jp.naver.line.android': 'LINE',
  'com.tencent.mm': 'WeChat',
  'com.sina.weibo': 'Weibo',
};

const SOCIAL_KEYWORDS = [
  'instagram',
  'tiktok',
  'facebook',
  'snapchat',
  'twitter',
  'reddit',
  'youtube',
  'whatsapp',
  'telegram',
  'discord',
  'threads',
  'pinterest',
  'linkedin',
  'tumblr',
  'bereal',
  'signal',
  'messenger',
];

/** Returns the display name when the app counts as social media. */
export function socialAppName(packageName: string, label: string): string | null {
  const known = KNOWN_SOCIAL_APPS[packageName];
  if (known) return known;

  const haystack = `${packageName} ${label}`.toLowerCase();
  if (SOCIAL_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return label.trim() || packageName;
  }

  return null;
}

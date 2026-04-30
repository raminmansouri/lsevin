export const SUPPORT_TRANSLATION_KEY = "Support";

export const DEFAULT_SUPPORT_LABELS = {
  "en-US": {
    launcherLabel: "Chat with us",
    headerTitle: "LSevin Support",
    headerSubtitle: "We usually reply in a few minutes.",
    welcomeTitle: "How can we help?",
    welcomeMessage: "Send us a message about bookings, providers, payments, or your account.",
    inputPlaceholder: "Write your message...",
    startConversationLabel: "Start conversation",
    offlineLabel: "Offline",
    onlineLabel: "Online",
    sendButton: "Send",
    attachmentLabel: "Attach file",
  },
  "fa-IR": {
    launcherLabel: "گفتگو با پشتیبانی",
    headerTitle: "پشتیبانی السوین",
    headerSubtitle: "معمولاً در چند دقیقه پاسخ می‌دهیم.",
    welcomeTitle: "چطور می‌توانیم کمک کنیم؟",
    welcomeMessage: "درباره رزرو، مراکز، پرداخت یا حساب کاربری پیام بفرستید.",
    inputPlaceholder: "پیام خود را بنویسید...",
    startConversationLabel: "شروع گفتگو",
    offlineLabel: "آفلاین",
    onlineLabel: "آنلاین",
    sendButton: "ارسال",
    attachmentLabel: "پیوست فایل",
  },
} as const;

export const SUPPORT_STATUS_OPTIONS = ["open", "pending", "resolved", "closed", "archived"] as const;
export const SUPPORT_PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"] as const;
export const SUPPORT_SOURCE_OPTIONS = ["floating_widget", "support_page", "booking", "provider_page", "service_page", "admin_created"] as const;

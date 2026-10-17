import "server-only";

import { OpenAIEmbeddings } from "@langchain/openai";

/**
 * Semantic router. Classifies each user message with embeddings (about a thousandth of the
 * cost of a chat call) so clearly off-topic or abusive messages never reach the chat model.
 * Short follow-ups are judged together with the assistant's previous reply, not by length.
 */

export type TopicVerdict = "ok" | "offTopic" | "abusive";

const ON_TOPIC = [
  "I want a hair transplant", "کاشت مو می‌خوام", "زراعة الشعر", "saç ekimi", "пересадка волос",
  "how much does a nose job cost", "قیمت جراحی بینی چقدره", "best dentist in Tehran", "دندانپزشک خوب در شیراز",
  "dental implants and veneers", "ایمپلنت دندان", "botox and filler", "لیزر موهای زائد",
  "which clinic is better for me", "کدوم کلینیک بهتره", "I need a doctor for consultation", "مشاوره با پزشک",
  "how long is the recovery", "دوره نقاهتش چند روزه", "hotel near the clinic", "هتل نزدیک کلینیک",
  "where should I stay in Kashan", "airport pickup and transfer", "ترانسفر فرودگاه", "how do I get to the clinic",
  "I am coming from Dubai for treatment", "plan my whole trip", "برنامه سفرم رو بچین", "book an appointment",
  "رزرو نوبت", "cancel my booking", "when is my appointment", "what shampoo after hair transplant",
  "ضدآفتاب می‌خوام", "vitamin D supplement", "blood pressure monitor", "gym membership", "باشگاه بدنسازی",
  "spa and massage", "hello", "سلام", "thank you", "ممنون", "can you help me", "what can you do",
  // Short follow-ups inside a conversation.
  "yes", "بله", "آره", "ok", "باشه", "no", "نه", "the second one", "دومی", "the first clinic", "اولی",
  "5 nights", "۵ شب", "next week", "هفته بعد", "how much", "چقدر", "show me more", "بیشتر نشون بده",
];

const OFF_TOPIC = [
  "write me a python function", "fix this javascript bug", "کد برنامه بنویس", "explain how blockchain works",
  "who will win the election", "what do you think about the president", "نظرت درباره سیاست چیه",
  "solve this math homework", "حل تمرین ریاضی", "write an essay about history", "translate this paragraph to french",
  "tell me a joke", "یه جوک بگو", "جوک", "write a poem about love", "شعر عاشقانه بگو", "recipe for pizza",
  "دستور پخت قورمه سبزی", "who won the football match", "نتیجه بازی فوتبال", "bitcoin price prediction",
  "قیمت دلار فردا", "recommend a movie", "فیلم پیشنهاد بده", "how to hack instagram", "what is the meaning of life",
  "play a game with me", "بازی کنیم", "write my resume", "weather tomorrow in London", "تاریخ ایران باستان",
];

const ABUSIVE = [
  "fuck", "fuck you", "shit", "bullshit", "you are stupid", "you're useless", "shut up", "idiot", "damn you",
  "خفه شو", "احمق", "خری", "گمشو", "لعنتی", "کثافت", "بی‌شعور", "مسخره", "حرف مفت نزن",
  "اسكت", "غبي", "aptal", "salak", "kes sesini", "заткнись", "идиот", "дурак",
];

// A message is declined only when it is clearly closer to off-topic or abusive examples.
const MARGIN = 0.05;
const ON_TOPIC_FLOOR = 0.45;

const embeddings = new OpenAIEmbeddings({
  model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
});

type Anchors = { on: number[][]; off: number[][]; abusive: number[][] };
let anchorsPromise: Promise<Anchors> | null = null;

function anchors(): Promise<Anchors> {
  if (!anchorsPromise) {
    anchorsPromise = Promise.all([
      embeddings.embedDocuments(ON_TOPIC),
      embeddings.embedDocuments(OFF_TOPIC),
      embeddings.embedDocuments(ABUSIVE),
    ]).then(([on, off, abusive]) => ({ on, off, abusive }));
    // Retry next time instead of caching a failure.
    anchorsPromise.catch(() => {
      anchorsPromise = null;
    });
  }
  return anchorsPromise;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

const best = (group: number[][], vector: number[]) => Math.max(...group.map((anchor) => cosine(anchor, vector)));

/**
 * @param previousAssistantText The assistant's last reply, so short follow-ups ("5 nights")
 * are judged in context.
 */
export async function classifyMessage(text: string, previousAssistantText = ""): Promise<TopicVerdict> {
  const value = text.trim();
  if (!value) return "ok";

  const context = previousAssistantText.trim().slice(-400);

  try {
    const inputs = context ? [value, `${context}\n${value}`] : [value];
    const [groups, vectors] = await Promise.all([anchors(), embeddings.embedDocuments(inputs)]);
    const [alone, withContext] = vectors;

    const onAlone = best(groups.on, alone);
    const offAlone = best(groups.off, alone);
    const abusiveAlone = best(groups.abusive, alone);
    const onContext = withContext ? best(groups.on, withContext) : onAlone;
    const offContext = withContext ? best(groups.off, withContext) : offAlone;

    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[topic-guard] on=${onAlone.toFixed(3)}/${onContext.toFixed(3)} off=${offAlone.toFixed(3)}/${offContext.toFixed(3)} abusive=${abusiveAlone.toFixed(3)} "${value.slice(0, 60)}"`
      );
    }

    // Insults are judged on the message alone: context never excuses them.
    if (abusiveAlone > onAlone + MARGIN && abusiveAlone >= offAlone) return "abusive";

    // Off-topic only when the message is off-topic both alone and in context.
    const offTopicAlone = offAlone > onAlone + MARGIN && onAlone < ON_TOPIC_FLOOR;
    const offTopicInContext = offContext > onContext + MARGIN;
    if (offTopicAlone && offTopicInContext) return "offTopic";

    return "ok";
  } catch (error) {
    // Never block a real customer because the embeddings call failed.
    console.error("[topic-guard] failed, letting the message through", error);
    return "ok";
  }
}

const REPLIES: Record<Exclude<TopicVerdict, "ok">, Record<string, string>> = {
  offTopic: {
    fa: "ببخشید، من دستیار LSevin هستم و فقط در انتخاب درمان، کلینیک و پزشک، هتل، ترانسفر، خرید محصولات و رزرو می‌توانم کمکتان کنم. 🌿 دنبال چه خدمتی هستید؟",
    en: "Sorry, I'm the LSevin assistant, so I can only help with treatments, clinics and doctors, hotels, transfers, shop products and bookings. 🌿 What can I help you find?",
    ar: "عذرًا، أنا مساعد LSevin، ويمكنني المساعدة فقط في العلاجات والعيادات والأطباء والفنادق والنقل ومنتجات المتجر والحجوزات. 🌿 بماذا يمكنني مساعدتك؟",
    tr: "Üzgünüm, ben LSevin asistanıyım; yalnızca tedaviler, klinikler ve doktorlar, oteller, transferler, mağaza ürünleri ve rezervasyonlar konusunda yardımcı olabilirim. 🌿 Size nasıl yardımcı olabilirim?",
    ru: "Извините, я ассистент LSevin и могу помочь только с лечением, клиниками и врачами, отелями, трансферами, товарами магазина и бронированием. 🌿 Чем могу помочь?",
  },
  abusive: {
    fa: "متوجهم که شاید ناراحت یا خسته باشید. من اینجا هستم تا با احترام کمکتان کنم. 🌿 بفرمایید دنبال چه خدمتی هستید؟",
    en: "I understand you may be frustrated. I'm here to help you, respectfully. 🌿 What are you looking for?",
    ar: "أتفهّم أنك قد تكون منزعجًا. أنا هنا لمساعدتك باحترام. 🌿 بماذا يمكنني مساعدتك؟",
    tr: "Canınızın sıkılmış olabileceğini anlıyorum. Size saygıyla yardımcı olmak için buradayım. 🌿 Ne arıyorsunuz?",
    ru: "Понимаю, что вы, возможно, расстроены. Я здесь, чтобы уважительно вам помочь. 🌿 Что вы ищете?",
  },
};

export function guardReply(verdict: Exclude<TopicVerdict, "ok">, locale: string): string {
  const replies = REPLIES[verdict];
  return replies[locale.slice(0, 2)] ?? replies.en;
}
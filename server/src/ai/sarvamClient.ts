import { config } from '../config';
import { mockSarvam } from './mockSarvam';
import { SupportedLanguageCode, MedicineItem } from '../../../shared/types';

export class SarvamClient {
  private apiKey: string;
  private useMock: boolean;

  constructor(apiKey: string = config.sarvamApiKey, useMock: boolean = config.useMockSarvam) {
    this.apiKey = apiKey;
    this.useMock = useMock || !apiKey;
  }

  setApiKey(key: string): void {
    this.apiKey = key;
    this.useMock = !key;
  }

  async extractPrescription(
    imagesBase64: string[],
    systemPrompt: string,
    isElderly: boolean
  ): Promise<{
    result: { medicines: MedicineItem[]; plainExplanationEn: string };
    requestId: string;
  }> {
    if (this.useMock) {
      return mockSarvam.chatCompletion(imagesBase64, systemPrompt, isElderly);
    }

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please transcribe the medicine names and instructions, and provide a plain-language explanation of this prescription/discharge summary in strict JSON format.',
            },
            ...imagesBase64.map((b64) => ({
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${b64}` },
            })),
          ],
        },
      ];

      const response = await fetch('https://api.sarvam.ai/v2/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.apiKey,
        },
        body: JSON.stringify({
          model: 'gemma4',
          messages,
          max_tokens: 1500,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sarvam Chat API returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const requestId = (response.headers.get('x-request-id') || `sarvam-${Date.now()}`) as string;
      const content = data.choices?.[0]?.message?.content || '{}';

      // Parse JSON response per contract (7.6 / 6.2 Step 9)
      const cleanJson = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return {
        result: {
          medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
          plainExplanationEn: parsed.plainExplanationEn || '',
        },
        requestId,
      };
    } catch (err: any) {
      // If live call fails or API key is exhausted, fallback to mock to prevent blocking dev
      console.warn('Real Sarvam Chat call failed, falling back to mock:', err.message);
      return mockSarvam.chatCompletion(imagesBase64, systemPrompt, isElderly);
    }
  }

  async translateText(
    text: string,
    targetLanguageCode: SupportedLanguageCode
  ): Promise<{ translatedText: string; requestId: string }> {
    if (this.useMock || targetLanguageCode === 'en-IN') {
      return mockSarvam.translate(text, targetLanguageCode);
    }

    try {
      const response = await fetch('https://api.sarvam.ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.apiKey,
        },
        body: JSON.stringify({
          input: text,
          source_language_code: 'en-IN',
          target_language_code: targetLanguageCode,
          model: 'sarvam-translate:v1',
        }),
      });

      if (!response.ok) {
        throw new Error(`Sarvam Translate API returned ${response.status}`);
      }

      const data = await response.json();
      const requestId = response.headers.get('x-request-id') || `sarvam-trans-${Date.now()}`;
      return {
        translatedText: data.translated_text || text,
        requestId,
      };
    } catch (err: any) {
      console.warn('Sarvam Translate failed, falling back to mock:', err.message);
      return mockSarvam.translate(text, targetLanguageCode);
    }
  }

  async generateSpeech(
    text: string,
    languageCode: SupportedLanguageCode
  ): Promise<{ audioBuffer: Buffer; requestId: string }> {
    // Truncate to 1500 chars per Section 6.2 step 13 / 16.10
    const truncatedText = text.slice(0, 1500);

    if (this.useMock) {
      return mockSarvam.textToSpeech(truncatedText, languageCode);
    }

    try {
      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.apiKey,
        },
        body: JSON.stringify({
          inputs: [truncatedText],
          target_language_code: languageCode,
          speaker: 'anushka',
          model: 'bulbul:v2',
        }),
      });

      if (!response.ok) {
        throw new Error(`Sarvam TTS API returned ${response.status}`);
      }

      const data = await response.json();
      const requestId = response.headers.get('x-request-id') || `sarvam-tts-${Date.now()}`;
      const base64Audio = data.audios?.[0];
      if (!base64Audio) {
        throw new Error('No audio returned in Sarvam TTS response');
      }

      return {
        audioBuffer: Buffer.from(base64Audio, 'base64'),
        requestId,
      };
    } catch (err: any) {
      console.warn('Sarvam TTS failed, falling back to mock:', err.message);
      return mockSarvam.textToSpeech(truncatedText, languageCode);
    }
  }
}

export const sarvam = new SarvamClient();

import { SupportedLanguageCode, MedicineItem } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export interface MockChatExtractionOutput {
  medicines: MedicineItem[];
  plainExplanationEn: string;
}

export class MockSarvamService {
  // Configurable failure injections for testing (Section 13.6)
  public shouldFailChat: boolean = false;
  public shouldReturnMalformedChatJson: boolean = false;
  public shouldFailTranslate: boolean = false;
  public shouldFailTts: boolean = false;
  public simulatedChatResult: MockChatExtractionOutput | null = null;

  async chatCompletion(
    imagesBase64: string[],
    systemPrompt: string,
    isElderly: boolean
  ): Promise<{ result: MockChatExtractionOutput; requestId: string }> {
    if (this.shouldFailChat) {
      throw new Error('Sarvam Chat service unavailable (simulated 502)');
    }

    const requestId = `sarvam-chat-${uuidv4()}`;

    if (this.shouldReturnMalformedChatJson) {
      // simulate malformed output
      throw new Error('Invalid JSON received from extraction model');
    }

    if (this.simulatedChatResult) {
      return { result: this.simulatedChatResult, requestId };
    }

    // Default mock response: realistic prescription for an Indian patient
    const medicines: MedicineItem[] = [
      {
        name: 'Amoxicillin 500mg',
        schedule: '1 capsule three times daily after meals for 7 days',
        confidence: 'high',
      },
      {
        name: 'Paracetamol 650mg',
        schedule: '1 tablet twice daily when needed for fever or pain',
        confidence: 'high',
      },
      {
        name: 'Pantoprazole 40mg',
        schedule: '1 tablet once daily before breakfast for 7 days',
        confidence: 'high',
      },
    ];

    let plainExplanationEn =
      'This prescription contains an antibiotic to fight bacterial infection, paracetamol to reduce fever and body aches, and an antacid to protect your stomach lining. Take the antibiotic for the full 7 days even if you feel better. Drink plenty of water and rest.';

    if (isElderly) {
      plainExplanationEn =
        'Here is your medicine plan. First is Amoxicillin. It stops infection. Take one capsule three times a day after meals. Next is Paracetamol. Take one tablet only if you have fever or pain. Last is Pantoprazole. Take one tablet every morning before breakfast. Drink warm water and rest well.';
    }

    return {
      result: {
        medicines,
        plainExplanationEn,
      },
      requestId,
    };
  }

  async translate(
    text: string,
    targetLanguageCode: SupportedLanguageCode
  ): Promise<{ translatedText: string; requestId: string }> {
    if (this.shouldFailTranslate) {
      throw new Error('Sarvam Translate service unavailable (simulated)');
    }

    const requestId = `sarvam-trans-${uuidv4()}`;

    // Realistic translations for Indian Indic languages
    const sampleTranslations: Record<string, string> = {
      'hi-IN':
        'यह डॉक्टर का पर्चा संक्रमण को ठीक करने और राहत देने के लिए है। अमोक्सिसिलिन एक एंटीबायोटिक है, जिसे भोजन के बाद दिन में 3 बार 7 दिनों तक लें। बुखार या दर्द होने पर ही पैरासिटामोल लें। खाली पेट सुबह पैंटोप्राजोल लें ताकि पेट में गैस न बने। खूब पानी पिएं और आराम करें।',
      'ta-IN':
        'இந்த மருந்துச் சீட்டு உங்கள் தொற்றைக் குணப்படுத்த வழங்கப்பட்டுள்ளது. அமோக்ஸிசிலின் மாத்திரையை 7 நாட்களுக்கு உணவுக்குப் பின் தினமும் 3 வேளை எடுத்துக் கொள்ளவும். காய்ச்சல் அல்லது வலி இருந்தால் மட்டுமே பாராசிட்டமால் எடுக்கவும். காலையில் வெறும் வயிற்றில் பான்டோபிரசோல் மாத்திரையை உட்கொள்ளவும். நன்கு ஓய்வெடுக்கவும்.',
      'te-IN':
        'ఈ ప్రిస్క్రిప్షన్ ఇన్ఫెక్షన్ నివారణకు ఇవ్వబడింది. అమోక్సిసిలిన్ యాంటీబయాటిక్ భోజనం తర్వాత రోజుకు 3 సార్లు 7 రోజుల పాటు వేసుకోవాలి. జ్వరం లేదా నొప్పి ఉన్నప్పుడు మాత్రమే పారాసిటమాల్ వాడండి. ఉదయం ఖాళీ కడుపుతో పాంటోప్రజోల్ తీసుకోండి. తగినంత విశ్రాంతి తీసుకోండి.',
      'kn-IN':
        'ಈ ವೈದ್ಯಕೀಯ ಚೀಟಿಯು ಸೋಂಕನ್ನು ಗುಣಪಡಿಸಲು ನೀಡಲಾಗಿದೆ. ಅಮೋಕ್ಸಿಸಿಲಿನ್ ಮಾತ್ರೆಗಳನ್ನು ಊಟದ ನಂತರ ದಿನಕ್ಕೆ ಮೂರು ಬಾರಿ 7 ದಿನಗಳವರೆಗೆ ಸೇವಿಸಿ. ಜ್ವರ ಅಥವಾ ನೋವು ಇದ್ದಾಗ ಮಾತ್ರ ಪ್ಯಾರಸಿಟಮಾಲ್ ತೆಗೆದುಕೊಳ್ಳಿ. ಬೆಳಿಗ್ಗೆ ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಪ್ಯಾಂಟೊಪ್ರಜೋಲ್ ಸೇವಿಸಿ. ಸಾಕಷ್ಟು ನೀರು ಕುಡಿದು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.',
      'ml-IN':
        'ഈ കുറിപ്പടി അണുബാധ ഭേദമാക്കാനാണ്. അമോക്സിസിലിൻ ഗുളികകൾ ഭക്ഷണത്തിന് ശേഷം ദിവസവും മൂന്ന് നേരം 7 ദിവസം കഴിക്കുക. പനിയോ വേദനയോ ഉള്ളപ്പോൾ മാത്രം പാരസെറ്റാമോൾ എടുക്കുക. രാവിലെ വെറുംവയറ്റിൽ പാന്റോപ്രാസോൾ കഴിക്കുക. ആവശ്യത്തിന് വിശ്രമിക്കുക.',
      'mr-IN':
        'हे प्रिस्क्रिप्शन इन्फेक्शन बरे करण्यासाठी आहे. अमोक्सिसिलिन जेवणानंतर दिवसातून ३ वेळा ७ दिवस घ्या. ताप किंवा अंगदुखी असल्यास पॅरासिटामॉल घ्या. सकाळी उपाशीपोटी पॅन्टोप्राझोल घ्या. भरपूर पाणी प्या आणि विश्रांती घ्या.',
      'bn-IN':
        'এই ব্যবস্থাপত্রটি সংক্রমণ নিরাময়ের জন্য দেওয়া হয়েছে। অ্যামোক্সিসিলিন খাবার পর দিনে ৩ বার ৭ দিনের জন্য গ্রহণ করুন। জ্বর বা ব্যথার ক্ষেত্রে প্যারাসিটামল খান। সকালে খালি পেটে প্যান্টোপ্রাজল খান। প্রচুর পানি পান করুন ও বিশ্রাম নিন।',
      'gu-IN':
        'આ પ્રિસ્ક્રિપ્શન ચેપ દૂર કરવા માટે છે. એમોક્સિસિલિન જમ્યા પછી દિવસમાં ૩ વખત ૭ દિવસ સુધી લો. તાવ અથવા દુખાવો હોય ત્યારે જ પેરાસિટામોલ લો. સવારે ભૂખ્યા પેટે પેન્ટોપ્રાઝોલ લો. પૂરતું પાણી પીવો અને આરામ કરો.',
      'pa-IN':
        'ਇਹ ਪਰਚਾ ਇਨਫੈਕਸ਼ਨ ਨੂੰ ਠੀਕ ਕਰਨ ਲਈ ਹੈ। ਅਮੋਕਸੀਸਿਲਿਨ ਖਾਣੇ ਤੋਂ ਬਾਅਦ ਦਿਨ ਵਿੱਚ 3 ਵਾਰ 7 ਦਿਨਾਂ ਲਈ ਲਵੋ। ਬੁਖਾਰ ਜਾਂ ਦਰਦ ਹੋਣ ਤੇ ਪੈਰਾਸੀਟਾਮੋਲ ਲਵੋ। ਸਵੇਰੇ ਖਾਲੀ ਪੇਟ ਪੈਂਟੋਪ੍ਰਾਜ਼ੋਲ ਲਵੋ। ਖੂਬ ਪਾਣੀ ਪੀਓ ਅਤੇ ਆਰਾਮ ਕਰੋ।',
      'od-IN':
        'ଏହି ପ୍ରେସକ୍ରିପସନ୍ ସଂକ୍ରମଣ ଭଲ କରିବା ପାଇଁ ଦିଆଯାଇଛି। ଆମୋକ୍ସିସିଲିନ୍ ଖାଇବା ପରେ ଦିନକୁ ୩ ଥର ୭ ଦିନ ପର୍ଯ୍ୟନ୍ତ ନିଅନ୍ତୁ। ଜ୍ୱର କିମ୍ବା ଯନ୍ତ୍ରଣା ହେଲେ ପାରାସିଟାମଲ୍ ନିଅନ୍ତୁ। ସକାଳେ ଖାଲି ପେଟରେ ପାଣ୍ଟୋପ୍ରାଜୋଲ୍ ନିଅନ୍ତୁ। ବିଶ୍ରାମ କରନ୍ତୁ।',
      'en-IN': text,
    };

    const translatedText = sampleTranslations[targetLanguageCode] || `[${targetLanguageCode}] ${text}`;
    return { translatedText, requestId };
  }

  async textToSpeech(
    text: string,
    languageCode: SupportedLanguageCode
  ): Promise<{ audioBuffer: Buffer; requestId: string }> {
    if (this.shouldFailTts) {
      throw new Error('Sarvam TTS service unavailable (simulated)');
    }

    const requestId = `sarvam-tts-${uuidv4()}`;

    // Create a valid synthetic playable PCM WAV audio file (1 sec tone)
    const audioBuffer = generateSampleWavBuffer();
    return { audioBuffer, requestId };
  }

  reset(): void {
    this.shouldFailChat = false;
    this.shouldReturnMalformedChatJson = false;
    this.shouldFailTranslate = false;
    this.shouldFailTts = false;
    this.simulatedChatResult = null;
  }
}

// Generate valid 16-bit PCM mono 8kHz WAV buffer so browser audio players actually play it!
function generateSampleWavBuffer(): Buffer {
  const sampleRate = 8000;
  const numSamples = sampleRate * 1.5; // 1.5 seconds
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels (1 mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Gentle audible pleasant chime tone (440 Hz standard concert A)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const amplitude = 8000 * Math.exp(-2.5 * t); // smooth decay
    const sample = Math.round(amplitude * Math.sin(2 * Math.PI * 440 * t));
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  return buffer;
}

export const mockSarvam = new MockSarvamService();

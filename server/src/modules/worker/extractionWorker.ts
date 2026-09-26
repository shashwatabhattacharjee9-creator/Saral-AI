import { db } from '../../db/database';
import { redis } from '../../redis/redisService';
import { storage } from '../../storage/storage';
import { sarvam } from '../../ai/sarvamClient';
import { classifyOcrConfidence } from '../../algorithms/confidenceClassifier';
import { detectSafetyFlags } from '../../algorithms/safetyFlags';
import { buildSystemPrompt } from '../../algorithms/toneAdapter';

export interface ScanProcessingJob {
  scanId: string;
  patientProfileId: string;
  targetLanguageCode: string;
  requestedBy: string;
}

export class ExtractionWorker {
  async processScan(job: ScanProcessingJob): Promise<void> {
    const { scanId, patientProfileId } = job;
    const lockKey = `lock:scan-processing:${scanId}`;

    // 1. Acquire Redis lock (10-min TTL per Section 5.7)
    const acquired = await redis.acquireLock(lockKey, 600);
    if (!acquired) {
      console.warn(`Scan ${scanId} is already being processed by another worker. Skipping.`);
      return;
    }

    try {
      // 2. scans.status -> processing, processing_started_at set (Step 8)
      await db.updateScanStatus(scanId, 'processing', {
        processingStartedAt: new Date().toISOString(),
      });

      const profile = await db.findPatientProfileById(patientProfileId);
      const isElderly = (profile?.dateOfBirth ? (new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear()) >= 65 : false);
      const { systemPrompt, promptVersion } = buildSystemPrompt(profile?.dateOfBirth);

      // Fetch scan pages and base64 encode
      const pages = await db.getPagesForScan(scanId);
      const imagesBase64: string[] = [];
      for (const page of pages) {
        const fileBuffer = await storage.getFile(page.s3ObjectKey);
        if (fileBuffer) {
          imagesBase64.push(fileBuffer.toString('base64'));
        }
      }

      // Step 1: Extract + simplify (Sarvam Chat call)
      const sarvamRequestIds: Record<string, string> = {};
      let chatExtraction: { medicines: any[]; plainExplanationEn: string };

      try {
        const chatResponse = await sarvam.extractPrescription(imagesBase64, systemPrompt, isElderly);
        chatExtraction = chatResponse.result;
        sarvamRequestIds.chatRequestId = chatResponse.requestId;
      } catch (chatError: any) {
        // Automatic retry once per Section 6.2 Step 9 & Section 11
        try {
          const retryResponse = await sarvam.extractPrescription(imagesBase64, systemPrompt, isElderly);
          chatExtraction = retryResponse.result;
          sarvamRequestIds.chatRequestId = retryResponse.requestId;
        } catch (retryError: any) {
          const failureReason = retryError.message?.includes('JSON')
            ? 'extraction_parse_error'
            : 'extraction_service_unavailable';
          await db.updateScanStatus(scanId, 'failed', { failureReason });
          return;
        }
      }

      // Step 2: Compute OCR confidence (Section 5.1 algorithm)
      const ocrConfidence = classifyOcrConfidence(
        chatExtraction.medicines,
        chatExtraction.plainExplanationEn
      );

      // Step 3: Safety flags (Section 5.4 rule engine)
      const safetyFlags = detectSafetyFlags(
        chatExtraction.medicines,
        chatExtraction.plainExplanationEn
      );

      // Step 4: Translate (if target_language_code != 'en-IN')
      const targetLanguage = job.targetLanguageCode as any;
      let translatedExplanation: string | null = null;
      let translationSuccess = true;

      if (targetLanguage && targetLanguage !== 'en-IN') {
        try {
          const transResp = await sarvam.translateText(
            chatExtraction.plainExplanationEn,
            targetLanguage
          );
          translatedExplanation = transResp.translatedText;
          sarvamRequestIds.translateRequestId = transResp.requestId;
        } catch (transErr: any) {
          // Degraded translation per AC3 & Section 6.2 Step 12: fallback to English
          console.warn(`Translation failed for scan ${scanId}:`, transErr.message);
          translatedExplanation = null;
          translationSuccess = false;
        }
      }

      // Step 5: Text-to-Speech (Bulbul v2)
      // If translate failed or target is en-IN, use plainExplanationEn, else translatedExplanation
      const textForAudio = translationSuccess && translatedExplanation ? translatedExplanation : chatExtraction.plainExplanationEn;
      const langForAudio = translationSuccess && translatedExplanation ? targetLanguage : 'en-IN';

      let audioS3Key: string | null = null;
      try {
        const ttsResp = await sarvam.generateSpeech(textForAudio, langForAudio);
        sarvamRequestIds.ttsRequestId = ttsResp.requestId;
        audioS3Key = await storage.saveAudio(scanId, langForAudio, ttsResp.audioBuffer);
      } catch (ttsErr: any) {
        // Non-fatal TTS failure per Section 6.2 Step 13 / Section 11
        console.warn(`TTS synthesis failed for scan ${scanId}:`, ttsErr.message);
        audioS3Key = null;
      }

      // Step 14: Final atomic write (Section 4.8)
      await db.createExtractionResult({
        scanId,
        medicines: chatExtraction.medicines,
        plainExplanationEn: chatExtraction.plainExplanationEn,
        translatedExplanation,
        safetyFlags,
        ocrConfidence,
        audioS3Key,
        sarvamRequestIds,
        promptVersion,
      });

      await db.updateScanStatus(scanId, 'completed', {
        processingCompletedAt: new Date().toISOString(),
      });
    } catch (unexpectedError: any) {
      console.error(`Unexpected worker failure on scan ${scanId}:`, unexpectedError);
      await db.updateScanStatus(scanId, 'failed', {
        failureReason: 'internal_error',
      });
    } finally {
      // Step 15: Release Redis lock
      await redis.releaseLock(lockKey);
    }
  }

  // Audio retry endpoint (Section 7.6 / 6.2 Step 13)
  async retryAudio(scanId: string): Promise<boolean> {
    const scan = await db.findScanById(scanId);
    if (!scan || scan.status !== 'completed') return false;

    const extraction = await db.findExtractionResultByScanId(scanId);
    if (!extraction) return false;

    const textForAudio = extraction.translatedExplanation || extraction.plainExplanationEn;
    const langForAudio = extraction.translatedExplanation ? scan.targetLanguageCode : 'en-IN';

    try {
      const ttsResp = await sarvam.generateSpeech(textForAudio, langForAudio);
      const audioKey = await storage.saveAudio(scanId, langForAudio, ttsResp.audioBuffer);
      extraction.audioS3Key = audioKey;
      extraction.sarvamRequestIds.ttsRetryRequestId = ttsResp.requestId;
      return true;
    } catch {
      return false;
    }
  }
}

export const extractionWorker = new ExtractionWorker();

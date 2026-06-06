/**
 * Client-Side Audio Downsampling and Compression Utility
 * Discards video tracks (if any), downsamples stereo to mono, and adjusts/compresses
 * the sample rate dynamically to stay under payload limits while preserving clear speech.
 */

export async function compressAudioFile(
  file: File,
  onProgress?: (msg: string) => void
): Promise<{ data: string; mimeType: string }> {
  const fileName = file.name.toLowerCase();
  
  onProgress?.('กำลังเริ่มเตรียมไฟล์เสียงหรือวีดีโอเพื่อถอดความ...');
  const fileArrayBuffer = await file.arrayBuffer();

  onProgress?.('กำลังถอดรหัสสัญญาณเสียง (Decoding Media Track)...');
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('เว็บบราวเซอร์ของคุณไม่รองรับ Web Audio API ในการถอดประมวลผลเสียง');
  }

  const audioContext = new AudioContextClass();
  let decodedBuffer: AudioBuffer;
  try {
    decodedBuffer = await audioContext.decodeAudioData(fileArrayBuffer);
  } catch (err) {
    console.warn("Audio decoding failed, falling back to original base64 upload...", err);
    onProgress?.('ไม่สามารถถอดรหัสผ่านบราวเซอร์ได้ กำลังส่งไฟล์ต้นฉบับโดยตรง...');
    
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });

    let originalMimeType = 'audio/mpeg';
    if (fileName.endsWith('.mp3')) originalMimeType = 'audio/mp3';
    else if (fileName.endsWith('.wav')) originalMimeType = 'audio/wav';
    else if (fileName.endsWith('.m4a')) originalMimeType = 'audio/x-m4a';
    else if (fileName.endsWith('.mp4')) originalMimeType = 'video/mp4';

    return { data: base64, mimeType: originalMimeType };
  } finally {
    // Release system audio nodes
    if (audioContext.state !== 'closed') {
      audioContext.close();
    }
  }

  // Determine dynamic target sample rate based on duration to optimize payload size
  const durationSec = decodedBuffer.duration;
  const durationMin = durationSec / 60;
  onProgress?.(`ถอดรหัสสำเร็จ! ความยาว: ${durationMin.toFixed(1)} นาที ช่องเสียง: ${decodedBuffer.numberOfChannels}`);

  let targetSampleRate = 16000; // standard voice sweet spot for Gemini STT
  if (durationMin > 15) {
    targetSampleRate = 12000;  // keep it highly compressed for longer sessions
  }
  if (durationMin > 35) {
    targetSampleRate = 8000;   // telephone voice quality, extremely compact
  }

  onProgress?.(`กำลังบีบอัดความละเอียดจาก ${decodedBuffer.sampleRate}Hz เป็น Mono ${targetSampleRate}Hz (Downsampling)...`);

  // Extract / Mixdown down to mono channel
  const sourceSampleRate = decodedBuffer.sampleRate;
  const leftChannel = decodedBuffer.getChannelData(0);
  let signalData = leftChannel;

  // Mix secondary channels if present for a full average signal
  if (decodedBuffer.numberOfChannels > 1) {
    try {
      const rightChannel = decodedBuffer.getChannelData(1);
      const mixed = new Float32Array(leftChannel.length);
      for (let i = 0; i < leftChannel.length; i++) {
        mixed[i] = (leftChannel[i] + rightChannel[i]) * 0.5;
      }
      signalData = mixed;
    } catch (e) {
      console.warn("Channel mixing failed, using left channel only", e);
    }
  }

  // Downsample with linear interpolation
  const ratio = sourceSampleRate / targetSampleRate;
  const newLength = Math.round(signalData.length / ratio);
  const downsampled = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const nextOffset = i * ratio;
    const index = Math.floor(nextOffset);
    const interpolationValue = nextOffset - index;
    const nextValue = signalData[index + 1] !== undefined ? signalData[index + 1] : signalData[index];
    downsampled[i] = signalData[index] + interpolationValue * (nextValue - signalData[index]);
  }

  onProgress?.('กำลังจัดเรียงแพ็คเก็ตข้อมูลเสียงและใส่หัวไฟล์ RIFF WAV...');
  // Create RIFF WAVE format 16-bit PCM header and content buffer
  const buffer = new ArrayBuffer(44 + downsampled.length * 2);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (v: DataView, offset: number, str: string) => {
    for (let j = 0; j < str.length; j++) {
      v.setUint8(offset + j, str.charCodeAt(j));
    }
  };

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + downsampled.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM is 1) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, targetSampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, targetSampleRate * 2, true);
  /* block align (channel count * bytes per sample = 1 * 2) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* chunk length */
  view.setUint32(40, downsampled.length * 2, true);

  // Write actual floating 32-bit samples converts into 16-bit signed short PCM integers
  let pcmOffset = 44;
  for (let idx = 0; idx < downsampled.length; idx++, pcmOffset += 2) {
    const s = Math.max(-1, Math.min(1, downsampled[idx]));
    view.setInt16(pcmOffset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  const wavBlob = new Blob([buffer], { type: 'audio/wav' });
  console.log(`Original file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB -> Compressed size: ${(wavBlob.size / (1024 * 1024)).toFixed(2)} MB`);

  onProgress?.('การบีบอัดเสียงเสร็จสิ้น! กำลังส่งข้อมูลไปยังโมเดลวิเคราะห์คำพูดภาษาไทย...');

  const compressedBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(wavBlob);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  return { data: compressedBase64, mimeType: 'audio/wav' };
}

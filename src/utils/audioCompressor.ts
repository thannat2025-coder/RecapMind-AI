/**
 * Client-Side Audio Downsampling, Chunking, and Compression Utility
 * Discards video tracks (if any), downsamples stereo to mono, and groups/compresses
 * the sample rate and segments to stay under proxy payload limits while preserving clear speech.
 */

export async function compressAudioFile(
  file: File,
  onProgress?: (msg: string) => void
): Promise<{ chunks: { data: string; mimeType: string }[] }> {
  const fileName = file.name.toLowerCase();
  const fileSizeMB = file.size / (1024 * 1024);

  // Optimization: If the file is already under 10MB, process and upload it as-is in its native format as a single chunk.
  // This avoids converting highly compressed formats (MP3/M4A/MP4) into giant uncompressed PCM WAVs.
  const isCompressedFormat = fileName.endsWith('.mp3') || fileName.endsWith('.m4a') || fileName.endsWith('.mp4') || fileName.endsWith('.wav');
  if (fileSizeMB < 10 && isCompressedFormat) {
    onProgress?.(`ขนาดไฟล์เล็ก (${fileSizeMB.toFixed(2)} MB) กำลังเตรียมส่งไฟล์ต้นฉบับตรง...`);
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

    return { chunks: [{ data: base64, mimeType: originalMimeType }] };
  }

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
    onProgress?.('ไม่สามารถถอดรหัสผ่านบราวเซอร์ได้ ส่งไฟล์ต้นฉบับทางตรง...');
    
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

    return { chunks: [{ data: base64, mimeType: originalMimeType }] };
  } finally {
    // Release system audio nodes
    if (audioContext.state !== 'closed') {
      audioContext.close();
    }
  }

  const durationSec = decodedBuffer.duration;
  const durationMin = durationSec / 60;
  const numChannels = decodedBuffer.numberOfChannels;
  const sampleRate = decodedBuffer.sampleRate;
  const totalSamples = decodedBuffer.length;

  onProgress?.(`ถอดรหัสสำเร็จ! ความยาว: ${durationMin.toFixed(1)} นาที ช่องเสียง: ${numChannels}`);

  // Safe Chunk Selection: split into segments of 4 minutes (240 seconds)
  // This keeps each chunk payload around ~5.7MB for 12000Hz mono 16-bit PCM (well under any Nginx/Cloud Run 10-15MB limits).
  const segmentLengthSec = 240;
  const segmentLengthSamples = segmentLengthSec * sampleRate;
  const chunksCount = Math.ceil(totalSamples / segmentLengthSamples);
  const chunksResult: { data: string; mimeType: string }[] = [];

  for (let c = 0; c < chunksCount; c++) {
    const startOffset = c * segmentLengthSamples;
    const endOffset = Math.min(startOffset + segmentLengthSamples, totalSamples);
    const chunkSamplesLength = endOffset - startOffset;

    onProgress?.(`กำลังประมวลผลข้อมูลส่วนเสียงชิ้นที่ ${c + 1}/${chunksCount} (0.5x Mono)...`);

    // Extract mono data (Left channel) for this segment
    const chunkLeft = decodedBuffer.getChannelData(0).subarray(startOffset, endOffset);
    let chunkSignal = chunkLeft;

    // Mix secondary channels if present for a full average signal
    if (numChannels > 1) {
      try {
        const chunkRight = decodedBuffer.getChannelData(1).subarray(startOffset, endOffset);
        const mixed = new Float32Array(chunkSamplesLength);
        for (let i = 0; i < chunkSamplesLength; i++) {
          mixed[i] = (chunkLeft[i] + chunkRight[i]) * 0.5;
        }
        chunkSignal = mixed;
      } catch (e) {
        console.warn("Mono mixing failed during chunking, using left channel", e);
      }
    }

    // Downsample chunk from source sample rate to 12kHz voice spectrum (perfect speech intelligibility)
    const targetSampleRate = 12000;
    const ratio = sampleRate / targetSampleRate;
    const newLength = Math.round(chunkSamplesLength / ratio);
    const downsampled = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const nextOffset = i * ratio;
      const index = Math.floor(nextOffset);
      const interpolationValue = nextOffset - index;
      const nextValue = chunkSignal[index + 1] !== undefined ? chunkSignal[index + 1] : chunkSignal[index];
      downsampled[i] = chunkSignal[index] + interpolationValue * (nextValue - chunkSignal[index]);
    }

    // Create RIFF WAVE format 16-bit PCM header and content buffer for this chunk
    const buffer = new ArrayBuffer(44 + downsampled.length * 2);
    const view = new DataView(buffer);

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

    // Convert floating 32-bit samples into 16-bit signed PCM integers
    let pcmOffset = 44;
    for (let idx = 0; idx < downsampled.length; idx++, pcmOffset += 2) {
      const s = Math.max(-1, Math.min(1, downsampled[idx]));
      view.setInt16(pcmOffset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    const wavBlob = new Blob([buffer], { type: 'audio/wav' });
    const compressedBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(wavBlob);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });

    chunksResult.push({ data: compressedBase64, mimeType: 'audio/wav' });
  }

  onProgress?.(`เตรียมพาร์ทเสียงเรียบร้อย ทั้งหมด ${chunksCount} พาร์ทรอส่งถอดคำ...`);
  return { chunks: chunksResult };
}

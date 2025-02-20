import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT_TEMPLATE = `Generate a transcript of the episode. Include timestamps and identify speakers.

Speakers are: 
{% for speaker in speakers %}- {{ speaker }}{% if not loop.last %}
{% endif %}{% endfor %}

eg:
[00:00] Brady: Hello there.
[00:02] Tim: Hi Brady.

It is important to include the correct speaker names. Use the names you identified earlier. If you really don't know the speaker's name, identify them with a letter of the alphabet, eg there may be an unknown speaker 'A' and another unknown speaker 'B'.

If there is music or a short jingle playing, signify like so:
[01:02] [MUSIC] or [01:02] [JINGLE]

If you can identify the name of the music or jingle playing then use that instead, eg:
[01:02] [Firework by Katy Perry] or [01:02] [The Sofa Shop jingle]

If there is some other sound playing try to identify the sound, eg:
[01:02] [Bell ringing]

Each individual caption should be quite short, a few short sentences at most.

Signify the end of the episode with [END].

Don't use any markdown formatting, like bolding or italics.`;

export class TranscriptionService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private renderPrompt(speakers: string[] = ['Speaker A']) {
    // Simple template rendering
    return PROMPT_TEMPLATE.replace(
      '{% for speaker in speakers %}- {{ speaker }}{% if not loop.last %}\n{% endif %}{% endfor %}',
      speakers.map(speaker => `- ${speaker}`).join('\n')
    );
  }

  private mapSpeakersInTranscript(transcript: string, customSpeakers: string[]) {
    const speakerPattern = /Speaker ([A-Z])/g;
    let speakerMap: { [key: string]: string } = {};
    let usedSpeakerIndex = 0;

    return transcript.replace(speakerPattern, (match, letter) => {
      const genericSpeaker = `Speaker ${letter}`;
      if (!speakerMap[genericSpeaker] && usedSpeakerIndex < customSpeakers.length) {
        speakerMap[genericSpeaker] = customSpeakers[usedSpeakerIndex];
        usedSpeakerIndex++;
      }
      return speakerMap[genericSpeaker] || match;
    });
  }

  async transcribeAudio(audioFile: File, speakers: string[] = ['Speaker A', 'Speaker B']) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Convert the audio file to base64
      const arrayBuffer = await audioFile.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      
      const prompt = this.renderPrompt();

      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            mimeType: 'audio/x-m4a',
            data: base64Data
          }
        }
      ]);

      const response = await result.response;
      const rawTranscript = response.text();
      
      // Map the generic speakers to custom speaker names
      return this.mapSpeakersInTranscript(rawTranscript, speakers);
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error('Failed to transcribe audio file');
    }
  }
}
import React from 'react';
import { TranscriptionCue, FormattedTranscriptionProps } from '@/types/types';


// Formata o timestamp de 'HH:MM:SS.ms' para 'MM:SS'
const formatTimestamp = (vttTime: string): string => {
  const timeParts = vttTime.split('.')[0].split(':');
  const minutes = timeParts.length > 1 ? timeParts[timeParts.length - 2] : '00';
  const seconds = timeParts.length > 0 ? timeParts[timeParts.length - 1] : '00';
  return `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
};

// Faz o parsing do conteúdo VTT para um array de Cues
const parseVTT = (vtt: string): TranscriptionCue[] => {
  if (!vtt) return [];

  const lines = vtt.split('\n').map(line => line.trim());
  const cues: TranscriptionCue[] = [];

  for (let i = 0; i < lines.length; i++) {
    // Procura por uma linha de tempo
    if (lines[i].includes('-->')) {
      const startTime = lines[i].split('-->')[0].trim();
      let textLine = lines[i + 1] || '';
      
      // Checa se a próxima linha é o texto da fala
      if (textLine) {
        let speaker = 'Desconhecido';
        let text = textLine;

        // Extrai o falante, se existir no formato [SPEAKER_XX]:
        const speakerMatch = textLine.match(/^\[(.*?)\]:\s*(.*)$/);
        if (speakerMatch) {
          speaker = speakerMatch[1].replace('_', ' ');
          text = speakerMatch[2];
        }
        
        cues.push({
          speaker,
          text,
          timestamp: formatTimestamp(startTime),
        });
        i++; // Pula a linha de texto
      }
    }
  }

  return cues;
};

export const FormattedTranscription: React.FC<FormattedTranscriptionProps> = ({ vttContent }) => {
  if (!vttContent) {
    return <p className="text-slate-500 dark:text-slate-400">Transcrição não disponível.</p>;
  }

  const cues = parseVTT(vttContent);
  const speakerColors: { [key: string]: string } = {};
  const availableColors = [
    'text-sky-600 dark:text-sky-400',
    'text-emerald-600 dark:text-emerald-400',
    'text-amber-600 dark:text-amber-400',
    'text-rose-600 dark:text-rose-400',
    'text-indigo-600 dark:text-indigo-400',
  ];
  let colorIndex = 0;

  const getSpeakerColor = (speaker: string) => {
    if (!speakerColors[speaker]) {
      speakerColors[speaker] = availableColors[colorIndex % availableColors.length];
      colorIndex++;
    }
    return speakerColors[speaker];
  };

  return (
    <div className="space-y-4">
      {cues.map((cue, index) => (
        <div key={index} className="flex gap-3">
          <div className="text-xs font-mono text-slate-400 dark:text-slate-500 pt-1 w-12 text-right">{cue.timestamp}</div>
          <div className="flex-1 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
            <p className={`font-semibold text-sm ${getSpeakerColor(cue.speaker)}`}>
              {cue.speaker}
            </p>
            <p className="text-slate-700 dark:text-slate-300">{cue.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
'use client'

import Image from "next/image";
import { useState, useEffect } from "react";

const NOTE_VALUES = {
  MINIM: 8,
  CROTCHET: 4,
  QUAVER: 2,
  REST: 4
};

const NOTES = [
  { value: NOTE_VALUES.MINIM, name: 'Minim', duration: 1.0, isRest: false },
  { value: NOTE_VALUES.CROTCHET, name: 'Crotchet', duration: 0.5, isRest: false },
  { value: NOTE_VALUES.QUAVER, name: 'Quaver', duration: 0.25, isRest: false },
];

const REST = { value: NOTE_VALUES.REST, name: 'Rest', duration: 0.5, isRest: true };


export default function Home() {
  const [playing, setPlaying] = useState(false);
  const [points, setPoints] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRhythm, setCurrentRhythm] = useState<Array<typeof NOTES[0] | typeof REST>>([]);

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(ctx);
    return () => {
      ctx.close();
    };
  }, []);

  const generateRhythm = () => {
    let remainingSpace = 16; // One bar in 16th notes
    const rhythm: Array<typeof NOTES[0] | typeof REST> = [];

    while (remainingSpace > 0) {
      // Determine if this will be a note or a rest (20% chance of rest)
      const willBeRest = Math.random() < 0.2;
      
      const availableChoices = willBeRest 
        ? [REST]
        : NOTES.filter(note => note.value <= remainingSpace);

      if (availableChoices.length === 0) break;

      // Randomly select from available choices
      const selectedNote = availableChoices[Math.floor(Math.random() * availableChoices.length)];
      rhythm.push(selectedNote);
      remainingSpace -= selectedNote.value;
    }

    return rhythm;
  };

  const playNote = (time: number, duration: number) => {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set initial frequency and gain
    oscillator.frequency.setValueAtTime(440, time);
    gainNode.gain.setValueAtTime(0.5, time);

    // Create slight attack and release for smoother sound
    const attackTime = 0.02;
    const releaseTime = 0.05;
    
    // Attack
    gainNode.gain.linearRampToValueAtTime(0.5, time + attackTime);
    
    // Release - start release before the end of the note
    gainNode.gain.setValueAtTime(0.5, time + duration - releaseTime);
    gainNode.gain.linearRampToValueAtTime(0.01, time + duration);

    oscillator.start(time);
    oscillator.stop(time + duration);
  };

  const playRhythm = async () => {
    if (!audioContext) return;
    
    setIsPlaying(true);
    const rhythm = generateRhythm();
    setCurrentRhythm(rhythm);

    const startTime = audioContext.currentTime + 0.1;
    let currentTime = 0;

    // Play each note in the rhythm
    rhythm.forEach(note => {
      if (!note.isRest) {
        playNote(startTime + currentTime, note.duration);
      }
      // Always advance the time by the note's duration, even for rests
      currentTime += note.duration;
    });

    // Stop playing after the rhythm completes (2 seconds for one bar at 120 BPM)
    setTimeout(() => setIsPlaying(false), 2000);
  };

  const renderRhythmNotation = () => {
    return currentRhythm.map((note, index) => (
      <span 
        key={index}
        className={`inline-block px-2 py-1 m-1 rounded ${
          note.isRest ? 'bg-gray-200' : 'bg-blue-200'
        }`}
      >
        {note.name}
      </span>
    ));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
        <h1 className="font-sans text-2xl font-bold">Rhythm Game</h1>
        <div className="my-4"></div>
        <h2 className="font-sans text-xl font-semibold">Click start to begin</h2>
        <div className="my-4"></div>
        <p>
          Please note: You must have speakers or headphones to play this game.
        </p>
        <div className="my-2"></div>
        <h3 className="font-sans text-lg font-semibold">Instructions:</h3>
        <p>1. Click the start button to begin the game.</p>
        <p>2. Listen to the rhythm and remember it.</p>
        <p>3. Click start again to start the metronome.</p>
        <p>
          4. When you're ready, click the button in the correct rhythm and watch
          it appear.
        </p>
        <p>
          5. If you are happy with your submission, click submit. Otherwise, click
          retry.
        </p>
        <div className="my-4"></div>
        <p className="font-semibold">Points: {points}</p>
        <div className="flex space-x-4 my-2">
          {!isPlaying && (<button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => playRhythm()}
          >
            Start
          </button>)}
            {isPlaying && (
            <div className="flex items-center">
              <p>Playing...</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
}

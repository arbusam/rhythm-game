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
  const [userSelections, setUserSelections] = useState<Array<typeof NOTES[0] | typeof REST>>([]);
  const [showNoteButtons, setShowNoteButtons] = useState(false);
  const [plays, setPlays] = useState(0);

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
      const willBeRest = remainingSpace == 16 || remainingSpace <= 4
      ? false
      : Math.random() < 0.5;
      
      const availableChoices = willBeRest 
        ? [REST]
        : NOTES.filter(note => note.value <= remainingSpace);

      if (availableChoices.length === 0) break;

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

    oscillator.frequency.setValueAtTime(440, time);
    gainNode.gain.setValueAtTime(0.5, time);

    const attackTime = 0.02;
    const releaseTime = 0.05;
    
    gainNode.gain.linearRampToValueAtTime(0.5, time + attackTime);
    gainNode.gain.setValueAtTime(0.5, time + duration - releaseTime);
    gainNode.gain.linearRampToValueAtTime(0.01, time + duration);

    oscillator.start(time);
    oscillator.stop(time + duration);
  };

  const playRhythm = async () => {
    if (!audioContext) return;
    
    setIsPlaying(true);
    setUserSelections([]);
    setShowNoteButtons(false);
    
    const rhythm = generateRhythm();
    setCurrentRhythm(rhythm);

    const startTime = audioContext.currentTime + 0.1;
    let currentTime = 0;

    rhythm.forEach(note => {
      if (!note.isRest) {
        playNote(startTime + currentTime, note.duration);
      }
      currentTime += note.duration;
    });

    setTimeout(() => {
      setIsPlaying(false);
      setShowNoteButtons(true);
    }, 2000);
  };

  const replayRhythm = () => {
    if (!audioContext) return;

    setIsPlaying(true);

    const startTime = audioContext.currentTime + 0.1;
    let currentTime = 0;

    currentRhythm.forEach(note => {
      if (!note.isRest) {
        playNote(startTime + currentTime, note.duration);
      }
      currentTime += note.duration;
    });

    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  }

  const handleNoteSelection = (note: typeof NOTES[0] | typeof REST) => {
    setUserSelections(prev => [...prev, note]);
  };

  const handleSubmit = () => {
    const isCorrect = userSelections.length === currentRhythm.length &&
      userSelections.every((note, index) => note.name === currentRhythm[index].name);
    
    if (isCorrect) {
      setPoints(prev => prev + 10);
      alert('Correct! +10 points');
    } else {
      alert('Try again!');
    }
  };

  const handleReset = () => {
    setUserSelections([]);
  };

  const renderUserSelections = () => {
    return userSelections.map((note, index) => (
      <span 
        key={index}
        className={`inline-block px-2 py-1 m-1 rounded ${
          note.isRest ? 'bg-gray-200' : 'bg-blue-200'
        } hover:bg-red-200 cursor-pointer`}
        onClick={() => setUserSelections(prev => prev.filter((_, i) => i !== index))}
      >
        {note.name}
      </span>
    ));
  };

  const calculateTotalBeats = () => {
    return userSelections.reduce((acc, note) => acc + note.duration * 2, 0);
  }

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
        <p>3. Use the note buttons to recreate the rhythm you heard.</p>
        <p>4. Click submit when you're ready, or reset to try again.</p>
        <div className="my-1"></div>
        <p>TIP: All rests are worth 1 beat and can not appear first or last.</p>
        <div className="my-4"></div>
        <p className="font-semibold">Points: {points}</p>
        
        <div className="flex space-x-4 my-2">
          {!isPlaying && plays == 0 && (
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => {
                playRhythm();
                setPlays(1);
              }}
            >
              Start
            </button>
          )}
          {isPlaying && (
            <div className="flex items-center">
              <p>Playing...</p>
            </div>
          )}
          {!isPlaying && plays == 1 && (
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => {
                replayRhythm();
                setPlays(2);
              }}
            >
              Replay
            </button>
          )}
        </div>

        {showNoteButtons && (
          <div className="mt-4">
            <div className="mb-4">
              <p className="font-semibold">Your selections: ({calculateTotalBeats()} beats)</p>
              <div className="min-h-[40px] border rounded p-2 my-2">
                {renderUserSelections()}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {NOTES.map((note) => (
                <button
                  key={note.name}
                  className="bg-blue-400 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                  onClick={() => handleNoteSelection(note)}
                >
                  {note.name}
                </button>
              ))}
              <button
                className="bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                onClick={() => handleNoteSelection(REST)}
              >
                Rest
              </button>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleSubmit}
              >
                Submit
              </button>
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
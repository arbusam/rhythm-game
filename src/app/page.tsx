"use client";

import { useState, useEffect } from "react";

interface WindowWithWebkit extends Window {
  webkitAudioContext: typeof AudioContext;
}

const NOTE_VALUES = {
  MINIM: 8,
  CROTCHET: 4,
  QUAVER: 2,
  REST: 4,
};

const NOTES = [
  { value: NOTE_VALUES.MINIM, name: "Minim", duration: 1.0, isRest: false },
  {
    value: NOTE_VALUES.CROTCHET,
    name: "Crotchet",
    duration: 0.5,
    isRest: false,
  },
  { value: NOTE_VALUES.QUAVER, name: "Quaver", duration: 0.25, isRest: false },
];

const REST = {
  value: NOTE_VALUES.REST,
  name: "Rest",
  duration: 0.5,
  isRest: true,
};

export default function Home() {
  const [points, setPoints] = useState(0);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRhythm, setCurrentRhythm] = useState<
    Array<(typeof NOTES)[0] | typeof REST>
  >([]);
  const [userSelections, setUserSelections] = useState<
    Array<(typeof NOTES)[0] | typeof REST>
  >([]);
  const [showNoteButtons, setShowNoteButtons] = useState(false);
  const [plays, setPlays] = useState(0);

  useEffect(() => {
    const ctx = new (window.AudioContext ||
      (window as unknown as WindowWithWebkit).webkitAudioContext)();
    setAudioContext(ctx);
    return () => {
      ctx.close();
    };
  }, []);

  const generateRhythm = () => {
    let remainingSpace = 16; // One bar in 16th notes
    const rhythm: Array<(typeof NOTES)[0] | typeof REST> = [];

    while (remainingSpace > 0) {
      const willBeRest =
        remainingSpace == 16 || remainingSpace <= 4
          ? false
          : Math.random() < 0.5;

      const availableChoices = willBeRest
        ? [REST]
        : NOTES.filter((note) => note.value <= remainingSpace);

      if (availableChoices.length === 0) break;

      const selectedNote =
        availableChoices[Math.floor(Math.random() * availableChoices.length)];
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

    rhythm.forEach((note) => {
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

    currentRhythm.forEach((note) => {
      if (!note.isRest) {
        playNote(startTime + currentTime, note.duration);
      }
      currentTime += note.duration;
    });

    setTimeout(() => {
      setIsPlaying(false);
    }, 2000);
  };

  const handleNoteSelection = (note: (typeof NOTES)[0] | typeof REST) => {
    setUserSelections((prev) => [...prev, note]);
  };

  const handleSubmit = () => {
    const isCorrect =
      userSelections.length === currentRhythm.length &&
      userSelections.every(
        (note, index) => note.name === currentRhythm[index].name,
      );

    if (isCorrect) {
      setPoints((prev) => prev + 10);
      alert("Correct! +10 points");
      newRhythm();
    } else {
      setPoints((prev) => prev - 10);
      alert("Try again! -10 points");
    }
  };

  const handleReset = () => {
    setUserSelections([]);
  };

  const handleSkip = () => {
    alert(
      "Skipped! The correct answer was: " +
        currentRhythm.map((note) => note.name).join(", "),
    );
    setPoints((prev) => prev - 5);
    newRhythm();
  };

  const renderUserSelections = () => {
    return userSelections.map((note, index) => (
      <span
        key={index}
        className={`m-1 inline-block rounded px-2 py-1 ${
          note.isRest
            ? "bg-gray-200 dark:bg-gray-500"
            : "bg-blue-200 dark:bg-blue-500"
        } cursor-pointer hover:bg-red-200 dark:hover:bg-red-500`}
        onClick={() =>
          setUserSelections((prev) => prev.filter((_, i) => i !== index))
        }
      >
        {note.name}
      </span>
    ));
  };

  const calculateTotalBeats = () => {
    return userSelections.reduce((acc, note) => acc + note.duration * 2, 0);
  };

  const newRhythm = () => {
    setPlays(0);
    setShowNoteButtons(false);
    setUserSelections([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 px-4 py-8">
          <div className="mx-auto max-w-md">
            <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-black">
              <h1 className="font-sans text-2xl font-bold">Rhythm Game</h1>
              <div className="my-4"></div>
              <h2 className="font-sans text-xl font-semibold">Click start to begin</h2>
              <div className="my-4"></div>
              <p>
                Please note: You must have speakers or headphones to play this game.
                You must also be using a chromium based browser (Chrome, Edge, Brave,
                etc). This will not work on iPhone.
              </p>
              <div className="my-2"></div>
              <h3 className="font-sans text-lg font-semibold">Instructions:</h3>
              <p>1. Click the start button to begin the game.</p>
              <p>2. Listen to the rhythm and remember it.</p>
              <p>3. Use the note buttons to recreate the rhythm you heard.</p>
              <p>4. If you need to hear it again, you can replay it once.</p>
              <p>5. Click submit when you&apos;re ready, or skip to try a different one.</p>
              <div className="my-1"></div>
              <p>TIP: All rests are worth 1 beat and can not appear first or last.</p>
              <div className="my-4"></div>
              <p className="font-semibold">Points: {points}</p>

              <div className="my-2 flex space-x-4">
                {!isPlaying && plays == 0 && (
                  <button
                    className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-900"
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
                    className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-900"
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
                    <div className="my-2 min-h-[40px] rounded border p-2">
                      {renderUserSelections()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {NOTES.map((note) => (
                      <button
                        key={note.name}
                        className={`rounded px-4 py-2 font-bold text-white ${
                          calculateTotalBeats() + note.duration * 2 > 4
                            ? "cursor-not-allowed bg-gray-400"
                            : "bg-blue-400 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-800"
                        }`}
                        onClick={() => handleNoteSelection(note)}
                        disabled={calculateTotalBeats() + note.duration * 2 > 4}
                      >
                        {note.name}
                      </button>
                    ))}
                    <button
                      className={`rounded px-4 py-2 font-bold text-white ${
                        calculateTotalBeats() + REST.duration * 2 > 4
                          ? "cursor-not-allowed bg-gray-400"
                          : "bg-gray-400 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => handleNoteSelection(REST)}
                      disabled={calculateTotalBeats() + REST.duration * 2 > 4}
                    >
                      Rest
                    </button>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      className="rounded bg-green-500 px-4 py-2 font-bold text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-900"
                      onClick={handleSubmit}
                    >
                      Submit
                    </button>
                    <button
                      className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-900"
                      onClick={handleReset}
                    >
                      Reset
                    </button>
                    {!isPlaying && (
                      <button
                        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-900"
                        onClick={handleSkip}
                      >
                        Skip (-5 points)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="mt-8 w-full bg-gray-100 px-4 py-6 dark:bg-gray-700">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <span className="text-sm text-gray-500 dark:text-gray-300">
              © 2024 <a href="https://flowbite.com/">Arhan Busam</a>. All Rights Reserved.
            </span>
            <div className="flex space-x-5 rtl:space-x-reverse">
              <a
                href="https://github.com/arbusam/rhythm-game/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <svg
                  className="h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 .333A9.911 9.911 0 0 0 6.866 19.65c.5.092.678-.215.678-.477 0-.237-.01-1.017-.014-1.845-2.757.6-3.338-1.169-3.338-1.169a2.627 2.627 0 0 0-1.1-1.451c-.9-.615.07-.6.07-.6a2.084 2.084 0 0 1 1.518 1.021 2.11 2.11 0 0 0 2.884.823c.044-.503.268-.973.63-1.325-2.2-.25-4.516-1.1-4.516-4.9A3.832 3.832 0 0 1 4.7 7.068a3.56 3.56 0 0 1 .095-2.623s.832-.266 2.726 1.016a9.409 9.409 0 0 1 4.962 0c1.89-1.282 2.717-1.016 2.717-1.016.366.83.402 1.768.1 2.623a3.827 3.827 0 0 1 1.02 2.659c0 3.807-2.319 4.644-4.525 4.889a2.366 2.366 0 0 1 .673 1.834c0 1.326-.012 2.394-.012 2.72 0 .263.18.572.681.475A9.911 9.911 0 0 0 10 .333Z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="sr-only">GitHub account</span>
              </a>
              <a
                href="https://arhanbusam.bsky.social/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <svg
                  className="h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 568 501"
                >
                  <path
                    fill="currentColor"
                    d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.89-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.659 0 75.291 0 57.946 0-28.906 76.135-1.612 123.121 33.664Z"
                  />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

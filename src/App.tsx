import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import "./App.css";
import Oasis from "./assets/oasisLogoBlack.png";
import Door from "./assets/door1.png";
import DoorLeft from "./assets/doorleft.png";
import DoorRight from "./assets/doorright.png";
// import TopRight from "./assets/topright.png";
// import LeftBottom from "./assets/bottomleft1.png";
import GlimmerImg from "./assets/glimmer.png"; // <- the image that shines through
import Band from "./assets/band.png";
import CornerOrnament from "./assets/cornerornament.png"; // top-left oriented corner
import Mosque from "./assets/castle1.png";

// Team photos (same files as the Contact page). Copy that folder to
// src/assets/contact/ in this project, or change the paths below.
import sneha from "/photos/snehaSrivastava1.jpeg";
import avyakt from "/photos/avyaktVerma.webp";
import praful from "/photos/prafulMalik.jpeg";
import shreyas from "/photos/shreyasAnand.webp";
import prithvi from "/photos/prithviGowda.webp";
import devansh from "/photos/devanshAgarwal.jpg";
import pulkit from "/photos/pulkitBhardwaj.webp";
import kushal from "/photos/kushalPoosala.jpeg";

type Person = {
  first: string;
  last: string;
  dept: string;
  photo: string;
};

// Taken from the Contact page's CONTACTS list, in the same order.
// 1st entry = key "1", 2nd = key "2", ...
const PEOPLE: Person[] = [
  { first: "Sneha", last: "Srivastava", dept: "Department of Publication and Correspondence", photo: sneha },
  { first: "Avyakt", last: "Verma", dept: "Department of Visual Media", photo: avyakt },
  { first: "Praful", last: "Malik", dept: "Department of Sponsorships", photo: praful },
  { first: "Shreyas", last: "Anand", dept: "Department of Controls", photo: shreyas },
  { first: "Prithvi", last: "Gowda C", dept: "Department of Reception and Accommodation", photo: prithvi },
  { first: "Devansh", last: "Agarwal", dept: "Department of Art, Design and Publicity", photo: devansh },
  { first: "Pulkit", last: "Bhardwaj", dept: "President, Students' Union", photo: pulkit },
  { first: "Kushal", last: "Poosala", dept: "General Secretary, Students' Union", photo: kushal },
];

// shrink long words so they never run past the right edge
const fit = (word: string, max: number): string =>
  `${Math.min(max, 72 / word.length)}vw`;

const rand = (min: number, max: number): number =>
  min + Math.random() * (max - min);

type Spread = { x: number; y: number; rotate: number; scale: number };

type LetterProps = {
  ch: string;
  reduce: boolean;
};

/* One letter: flies in from a random spot (integrate) and
   drifts off to another random spot while blurring out (disintegrate). */
function Letter({ ch, reduce }: LetterProps) {
  const [fx] = useState(() => {
    const k = reduce ? 0 : 1;
    const spread = (): Spread => ({
      x: rand(-100, 100) * k,
      y: rand(-90, 40) * k, // bias upwards, like ash
      rotate: rand(-100, 100) * k,
      scale: reduce ? 1 : rand(0.3, 1.5),
    });
    return {
      enter: spread(),
      exit: spread(),
      inDelay: rand(0, 0.35),
      outDelay: rand(0, 0.22),
    };
  });

  return (
    <motion.span
      className="ch"
      aria-hidden="true"
      initial={{ opacity: 0, filter: "blur(10px)", ...fx.enter }}
      animate={{
        opacity: 1,
        filter: "blur(0px)",
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        transition: { duration: 0.75, delay: fx.inDelay, ease: "easeOut" },
      }}
      exit={{
        opacity: 0,
        filter: "blur(12px)",
        ...fx.exit,
        transition: { duration: 0.55, delay: fx.outDelay, ease: "easeIn" },
      }}
    >
      {ch}
    </motion.span>
  );
}

type ScatterProps = {
  id: number;
  text: string;
  className?: string;
  style?: CSSProperties;
};

/* Old text finishes disintegrating, then the new text integrates.
   `id` changes whenever the person changes. */
function Scatter({ id, text, className, style }: ScatterProps) {
  const reduce = useReducedMotion() ?? false;
  const words = text.split(" ");

  return (
    <AnimatePresence mode="wait">
      <motion.span key={id} className={className} style={style} aria-label={text}>
        {words.map((w, wi) => (
          <Fragment key={wi}>
            <span className="word">
              {[...w].map((ch, i) => (
                <Letter key={i} ch={ch} reduce={reduce} />
              ))}
            </span>
            {wi < words.length - 1 && " "}
          </Fragment>
        ))}
      </motion.span>
    </AnimatePresence>
  );
}

// every shimmer uses this same radius (in vmax) so they all match
const GLIMMER_RADIUS = 10;

type Spot = {
  id: number;
  x: number; // % across the screen
  y: number; // % down the screen
  dur: number; // seconds the glimmer lasts
  peak: number; // brightest opacity it reaches
  bx: number; // which part of the pattern is lit (random offset, %)
  by: number;
};

/* One glimmer: at a random place a small, soft patch of the image fades in
   and out, then waits a random time and shows up somewhere else. */
function GlimmerSpot({ src, firstDelay }: { src: string; firstDelay: number }) {
  const [spot, setSpot] = useState<Spot | null>(null);

  useEffect(() => {
    let timer = 0;
    let n = 0;

    const show = () => {
      const s: Spot = {
        id: n++,
        x: rand(6, 94),
        y: rand(6, 94),
        dur: rand(2.5, 4), // slow fade in and out
        peak: rand(0.3, 0.65), // never fully bright
        bx: rand(0, 100),
        by: rand(0, 100),
      };
      setSpot(s);
      timer = window.setTimeout(hide, s.dur * 1000);
    };
    const hide = () => {
      setSpot(null);
      timer = window.setTimeout(show, rand(2000, 10000));
    };

    timer = window.setTimeout(show, firstDelay + rand(0, 5000));
    return () => window.clearTimeout(timer);
  }, [firstDelay]);

  if (!spot) return null;

  // soft-edged circle that reveals only a small part of the image
  const mask = `radial-gradient(circle ${GLIMMER_RADIUS}vmax at ${spot.x}% ${spot.y}%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.65) 40%, transparent 100%)`;

  return (
    <motion.div
      key={spot.id}
      className="glimmer"
      style={{
        backgroundImage: `url(${src})`,
        backgroundPosition: `${spot.bx}% ${spot.by}%`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, spot.peak, 0] }}
      transition={{ duration: spot.dur, times: [0, 0.5, 1], ease: "easeInOut" }}
    />
  );
}

function Glimmer({ src }: { src: string }) {
  return (
    <>
       <GlimmerSpot src={src} firstDelay={200} />
      <GlimmerSpot src={src} firstDelay={800} />
      <GlimmerSpot src={src} firstDelay={1200} />
      <GlimmerSpot src={src} firstDelay={2000} />
      <GlimmerSpot src={src} firstDelay={3600} />
      <GlimmerSpot src={src} firstDelay={4500} />
    </>
  );
}

/* Screensaver / title page (key 0). Fades in and out as a whole. */
function Screensaver() {
  return (
    <motion.div
      className="saver"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
    >
      <Glimmer src={GlimmerImg} />

      <img className="saverLogo" src={Oasis} alt="Oasis '26" />

      <div className="saverBanner">
        <img className="bannerCorner tl" src={CornerOrnament} alt="" />
        <img className="bannerCorner tr" src={CornerOrnament} alt="" />
        <img className="bannerCorner bl" src={CornerOrnament} alt="" />
        <img className="bannerCorner br" src={CornerOrnament} alt="" />
        <h1 className="saverTitle">Oasis</h1>
      </div>

      <img className="saverMosque" src={Mosque} alt="" />

      <div className="saverTint" />
      <div className="saverTexture" />
    </motion.div>
  );
}

// door timing (ms): doors close, photo swaps while shut, doors open again
const CLOSE_MS = 1200;
const SWAP_AT_MS = 1300;

const MODIFIERS = ["Shift", "Control", "Alt", "Meta", "CapsLock", "Fn"];

function App() {
  const reduce = useReducedMotion() ?? false;
  const [index, setIndex] = useState<number>(0); // who the text shows
  const [photoIndex, setPhotoIndex] = useState<number>(0); // who the door shows
  const [open, setOpen] = useState<boolean>(false);
  const [photoFailed, setPhotoFailed] = useState<boolean>(false);
  const [saver, setSaver] = useState<boolean>(false); // key 0 = screensaver

  // key 0 -> screensaver, keys 1–8 -> person, any other key -> hide screensaver
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (MODIFIERS.includes(e.key)) return;

      if (e.key === "0") {
        setSaver(true);
        return;
      }

      setSaver(false);
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= PEOPLE.length) setIndex(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // every change (and the first load): close -> swap photo -> open
  useEffect(() => {
    setOpen(false);
    const t = window.setTimeout(() => {
      setPhotoIndex(index);
      setOpen(true);
    }, SWAP_AT_MS);
    return () => window.clearTimeout(t);
  }, [index]);

  useEffect(() => {
    setPhotoFailed(false);
  }, [photoIndex]);

  const p = PEOPLE[index];
  const shown = PEOPLE[photoIndex];
  const slide = {
    duration: reduce ? 0.2 : CLOSE_MS / 1000,
    ease: [0.65, 0, 0.35, 1] as [number, number, number, number],
  };

  return (
    <div className="container">
      <Glimmer src={GlimmerImg} />
      {/* <img className="corner cornerTopRight" src={TopRight} alt="" /> */}
      {/* <img className="corner cornerLeftBottom" src={LeftBottom} alt="" /> */}
      <img className="oasisLogo" src={Oasis} alt="Oasis '26" />

      {/* door frame, photo and the two sliding doors */}
      <div className="doorWrap">
        <div className="opening">
          {!photoFailed && (
            <img
              className={`photo${open ? " isOpen" : ""}`}
              src={shown.photo}
              alt={`${shown.first} ${shown.last}`}
              onError={() => setPhotoFailed(true)}
            />
          )}
          <motion.img
            className="leaf leafLeft"
            src={DoorLeft}
            alt=""
            initial={{ x: "0%" }}
            animate={{ x: open ? "-100%" : "0%" }}
            transition={slide}
          />
          <motion.img
            className="leaf leafRight"
            src={DoorRight}
            alt=""
            initial={{ x: "0%" }}
            animate={{ x: open ? "100%" : "0%" }}
            transition={slide}
          />
        </div>
        <img className="door" src={Door} alt="" />
      </div>

      {/* name + department */}
      <div className="info">
        <h1 className="name">
          <Scatter
            id={index}
            text={p.first}
            className="first"
            style={{ fontSize: fit(p.first, 9.5) }}
          />
          <Scatter
            id={index}
            text={p.last}
            className="last"
            style={{ fontSize: fit(p.last, 8) }}
          />
        </h1>
        <img className="band" src={Band} alt="" />
        <p className="dept">
          <Scatter id={index} text={p.dept} />
        </p>
      </div>

      {/* screensaver on top of everything */}
      <AnimatePresence>{saver && <Screensaver key="saver" />}</AnimatePresence>
    </div>
  );
}

export default App;
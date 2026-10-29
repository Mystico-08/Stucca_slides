import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import "./App.css";
import Oasis from "./assets/oasisLogoBlack.png";
import Door from "./assets/door1.png";
import DoorLeft from "./assets/doorleft.png";
import DoorRight from "./assets/doorright.png";
import GlimmerImg from "./assets/glimmer.png"; // <- the image that shines through
import Band from "./assets/band.png";

type Person = {
  first: string;
  last: string;
  dept: string;
  photo: string;
};

// Put the photos in  public/photos/1.jpg ... 8.jpg  (or change the paths here).
// 1st entry = key "1", 2nd = key "2", ...
const PEOPLE: Person[] = [
  { first: "Sneha", last: "Srivastava", dept: "Department of Art, Design, and Publicity", photo: "/photos/1.jpg" },
  { first: "Person", last: "Two", dept: "Department of Events", photo: "/photos/2.jpg" },
  { first: "Person", last: "Three", dept: "Department of Sponsorship", photo: "/photos/3.jpg" },
  { first: "Person", last: "Four", dept: "Department of Marketing", photo: "/photos/4.jpg" },
  { first: "Person", last: "Five", dept: "Department of Operations", photo: "/photos/5.jpg" },
  { first: "Person", last: "Six", dept: "Department of Hospitality", photo: "/photos/6.jpg" },
  { first: "Person", last: "Seven", dept: "Department of Technical Affairs", photo: "/photos/7.jpg" },
  { first: "Person", last: "Eight", dept: "Department of Public Relations", photo: "/photos/8.jpg" },
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

type Spot = {
  id: number;
  x: number; // % across the screen
  y: number; // % down the screen
  r: number; // radius of the lit patch, in vmax
  dur: number; // seconds the glimmer lasts
  peak: number; // brightest opacity it reaches
};

/* One glimmer: at a random place a small, soft patch of the image fades in
   and out, then waits a random time and shows up somewhere else. */
function GlimmerSpot({ src, firstDelay }: { src: string; firstDelay: number }) {
  const reduce = useReducedMotion() ?? false;
  const [spot, setSpot] = useState<Spot | null>(null);

  useEffect(() => {
    if (reduce) return;
    let timer = 0;
    let n = 0;

    const show = () => {
      const s: Spot = {
        id: n++,
        x: rand(6, 94),
        y: rand(6, 94),
        r: rand(8, 15),
        dur: rand(2, 3.4),
        peak: rand(0.3, 0.6),
      };
      setSpot(s);
      timer = window.setTimeout(hide, s.dur * 1000);
    };
    const hide = () => {
      setSpot(null);
      timer = window.setTimeout(show, rand(500, 2600));
    };

    timer = window.setTimeout(show, firstDelay);
    return () => window.clearTimeout(timer);
  }, [reduce, firstDelay]);

  if (!spot) return null;

  // soft-edged circle that reveals only a small part of the image
  const mask = `radial-gradient(circle ${spot.r}vmax at ${spot.x}% ${spot.y}%, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.35) 45%, transparent 100%)`;

  return (
    <motion.div
      key={spot.id}
      className="glimmer"
      style={{
        backgroundImage: `url(${src})`,
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
      <GlimmerSpot src={src} firstDelay={400} />
      <GlimmerSpot src={src} firstDelay={1500} />
      <GlimmerSpot src={src} firstDelay={2700} />
    </>
  );
}

// door timing (ms): doors close, photo swaps while shut, doors open again
const CLOSE_MS = 700;
const SWAP_AT_MS = 800;

function App() {
  const reduce = useReducedMotion() ?? false;
  const [index, setIndex] = useState<number>(0); // who the text shows
  const [photoIndex, setPhotoIndex] = useState<number>(0); // who the door shows
  const [open, setOpen] = useState<boolean>(false);
  const [photoFailed, setPhotoFailed] = useState<boolean>(false);

  // keys 1–8
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
      <img className="oasisLogo" src={Oasis} alt="Oasis '26" />

      {/* door frame, photo and the two sliding doors */}
      <div className="doorWrap">
        <div className="opening">
          {!photoFailed && (
            <img
              key={`photo-${photoIndex}`}
              className="photo"
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
    </div>
  );
}

export default App;
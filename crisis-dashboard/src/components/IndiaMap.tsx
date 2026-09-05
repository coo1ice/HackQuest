import React from 'react';
import { STATE_DATASET } from '../data/stateData';

interface IndiaMapProps {
  selectedStateId: string;
  onSelectState: (stateId: string) => void;
  hoveredStateId: string | null;
  onHoverState: (stateId: string | null) => void;
}

export const IndiaMap: React.FC<IndiaMapProps> = ({
  selectedStateId,
  onSelectState,
  hoveredStateId,
  onHoverState,
}) => {
  const isStateSelected = (id: string) => selectedStateId === id;
  const isStateHovered = (id: string) => hoveredStateId === id;

  const getPathClasses = (id: string) => {
    const selected = isStateSelected(id);
    const hovered = isStateHovered(id);
    const data = STATE_DATASET[id];
    const isCritical = data?.status === 'Critical Stockout';
    const isAdequate = data?.status === 'Adequate Reserve';

    let classes = 'cursor-pointer transition-all duration-200 outline-none ';

    if (selected) {
      classes += 'stroke-primary stroke-[2.5] filter drop-shadow-md brightness-110 ';
    } else if (hovered) {
      classes += 'stroke-white stroke-[2] brightness-125 ';
    } else {
      classes += 'stroke-white stroke-[1.2] hover:brightness-110 ';
    }

    if (isCritical) {
      classes += 'fill-error ';
    } else if (isAdequate) {
      classes += 'fill-secondary ';
    } else {
      classes += 'fill-surface-container-high ';
    }

    return classes;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 select-none">
      {/* Tactical Grid Background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="gisGrid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#76777d" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gisGrid)" />
      </svg>

      {/* Main Indian Standard Map SVG */}
      <svg
        className="w-full max-w-[620px] max-h-[700px] h-auto drop-shadow-sm select-none relative z-10"
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle glow filter for critical alert nodes */}
          <filter id="alertGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g
          id="india-official-states-layer"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          {/* Ladakh (INLA) */}
          <path
            id="INLA"
            d="M 315 50 L 370 65 L 435 105 L 455 145 L 440 185 L 415 205 L 390 190 L 370 215 L 345 200 L 325 180 L 338 145 L 315 130 L 290 105 L 300 80 Z"
            className={getPathClasses('INLA')}
            onClick={() => onSelectState('INLA')}
            onMouseEnter={() => onHoverState('INLA')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text
            x="365"
            y="135"
            className="text-[13px] fill-slate-700 font-semibold pointer-events-none tabular-nums"
            textAnchor="middle"
          >
            LADAKH
          </text>

          {/* Jammu & Kashmir (INJK) */}
          <path
            id="INJK"
            d="M 260 110 L 290 105 L 315 130 L 338 145 L 325 180 L 295 195 L 270 180 L 255 155 L 250 130 Z"
            className={getPathClasses('INJK')}
            onClick={() => onSelectState('INJK')}
            onMouseEnter={() => onHoverState('INJK')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text
            x="285"
            y="155"
            className="text-[11px] fill-slate-700 font-semibold pointer-events-none tabular-nums"
            textAnchor="middle"
          >
            J&amp;K
          </text>

          {/* Himachal Pradesh (INHP) */}
          <path
            id="INHP"
            d="M 325 180 L 345 200 L 370 215 L 390 190 L 415 220 L 395 250 L 370 250 L 345 230 L 335 210 Z"
            className={getPathClasses('INHP')}
            onClick={() => onSelectState('INHP')}
            onMouseEnter={() => onHoverState('INHP')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="365" y="225" className="text-[11px] fill-slate-700 pointer-events-none">
            HP
          </text>

          {/* Punjab (INPB) */}
          <path
            id="INPB"
            d="M 285 200 L 325 180 L 335 210 L 325 250 L 295 260 L 270 235 L 275 215 Z"
            className={getPathClasses('INPB')}
            onClick={() => onSelectState('INPB')}
            onMouseEnter={() => onHoverState('INPB')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="300" y="230" className="text-[11px] fill-slate-700 pointer-events-none">
            PB
          </text>

          {/* Chandigarh (INCH) */}
          <circle
            id="INCH"
            cx="335"
            cy="228"
            r="4"
            className={`cursor-pointer transition-all ${
              isStateSelected('INCH') ? 'fill-primary stroke-white stroke-2 r-5' : 'fill-slate-400 stroke-white stroke-1 hover:fill-secondary'
            }`}
            onClick={() => onSelectState('INCH')}
            onMouseEnter={() => onHoverState('INCH')}
            onMouseLeave={() => onHoverState(null)}
          />

          {/* Uttarakhand (INUT) */}
          <path
            id="INUT"
            d="M 395 250 L 415 220 L 450 235 L 440 275 L 400 285 L 380 265 Z"
            className={getPathClasses('INUT')}
            onClick={() => onSelectState('INUT')}
            onMouseEnter={() => onHoverState('INUT')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="415" y="260" className="text-[11px] fill-slate-700 pointer-events-none">
            UT
          </text>

          {/* Haryana (INHR) */}
          <path
            id="INHR"
            d="M 295 260 L 325 250 L 345 230 L 370 250 L 380 265 L 365 310 L 335 305 L 315 285 Z"
            className={getPathClasses('INHR')}
            onClick={() => onSelectState('INHR')}
            onMouseEnter={() => onHoverState('INHR')}
            onMouseLeave={() => onHoverState(null)}
          />

          {/* Delhi NCT (INDL) */}
          <circle
            id="INDL"
            cx="348"
            cy="285"
            r="4.5"
            className={`cursor-pointer transition-all ${
              isStateSelected('INDL') ? 'fill-primary stroke-white stroke-2' : 'fill-secondary stroke-white stroke-1 hover:scale-125'
            }`}
            onClick={() => onSelectState('INDL')}
            onMouseEnter={() => onHoverState('INDL')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="335" y="280" className="text-[10px] fill-slate-700 pointer-events-none font-semibold">
            HR/DL
          </text>

          {/* Rajasthan (INRJ) - Adequate Reserve (Dark Blue) */}
          <path
            id="INRJ"
            d="M 270 235 L 295 260 L 315 285 L 335 305 L 350 320 L 340 365 L 310 405 L 280 410 L 250 430 L 215 390 L 200 335 L 220 290 L 255 265 Z"
            className={getPathClasses('INRJ')}
            onClick={() => onSelectState('INRJ')}
            onMouseEnter={() => onHoverState('INRJ')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text
            x="265"
            y="345"
            className="text-[15px] fill-white font-bold pointer-events-none tracking-wide"
            textAnchor="middle"
          >
            RAJASTHAN
          </text>

          {/* Gujarat (INGJ) */}
          <path
            id="INGJ"
            d="M 215 390 L 250 430 L 265 465 L 245 510 L 225 505 L 200 475 L 160 475 L 140 455 L 150 425 L 180 430 L 195 410 Z"
            className={getPathClasses('INGJ')}
            onClick={() => onSelectState('INGJ')}
            onMouseEnter={() => onHoverState('INGJ')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text
            x="195"
            y="455"
            className="text-[14px] fill-slate-700 font-bold pointer-events-none"
            textAnchor="middle"
          >
            GUJARAT
          </text>

          {/* Dadra and Nagar Haveli & Daman and Diu (INDH) */}
          <circle
            id="INDH"
            cx="228"
            cy="510"
            r="4"
            className="fill-slate-300 stroke-white cursor-pointer hover:fill-secondary"
            onClick={() => onSelectState('INDH')}
          />

          {/* Uttar Pradesh (INUP) - Adequate Reserve (Dark Blue) */}
          <path
            id="INUP"
            d="M 365 310 L 380 265 L 400 285 L 440 275 L 490 315 L 540 345 L 565 385 L 530 425 L 480 420 L 435 430 L 415 390 L 375 385 L 350 320 Z"
            className={getPathClasses('INUP')}
            onClick={() => onSelectState('INUP')}
            onMouseEnter={() => onHoverState('INUP')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text
            x="445"
            y="360"
            className="text-[15px] fill-white font-bold pointer-events-none tracking-wide"
            textAnchor="middle"
          >
            UTTAR PRADESH
          </text>

          {/* Bihar (INBR) - Critical Stockout (Deep Red) */}
          <g id="state-bihar-group">
            <path
              id="INBR"
              d="M 540 345 L 610 355 L 635 390 L 620 435 L 575 445 L 530 425 L 565 385 Z"
              className={getPathClasses('INBR')}
              filter="url(#alertGlow)"
              onClick={() => onSelectState('INBR')}
              onMouseEnter={() => onHoverState('INBR')}
              onMouseLeave={() => onHoverState(null)}
            />
            <text
              x="580"
              y="400"
              className="text-[15px] fill-white font-extrabold tracking-wider pointer-events-none"
              textAnchor="middle"
            >
              BIHAR
            </text>
            <circle cx="595" cy="413" r="5" className="fill-white animate-ping" pointerEvents="none" />
            <circle cx="595" cy="413" r="3.5" className="fill-error stroke-white stroke-1" pointerEvents="none" />
          </g>

          {/* Sikkim (INSK) - Critical Stockout */}
          <path
            id="INSK"
            d="M 635 335 L 655 330 L 660 355 L 640 360 Z"
            className={getPathClasses('INSK')}
            onClick={() => onSelectState('INSK')}
            onMouseEnter={() => onHoverState('INSK')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="648" y="350" className="text-[9px] fill-white font-bold pointer-events-none">
            SK
          </text>

          {/* West Bengal (INWB) - Accurate Indian Geographic Boundaries */}
          <path
            id="INWB"
            d="M 640 360 L 660 355 L 665 380 L 645 400 L 640 440 L 660 475 L 650 525 L 615 515 L 620 470 L 620 435 L 635 390 Z"
            className={getPathClasses('INWB')}
            onClick={() => onSelectState('INWB')}
            onMouseEnter={() => onHoverState('INWB')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="635" y="475" className="text-[12px] fill-slate-700 font-bold pointer-events-none">
            WB
          </text>

          {/* Jharkhand (INJH) */}
          <path
            id="INJH"
            d="M 530 425 L 575 445 L 620 435 L 620 470 L 615 515 L 565 515 L 540 480 L 535 445 Z"
            className={getPathClasses('INJH')}
            onClick={() => onSelectState('INJH')}
            onMouseEnter={() => onHoverState('INJH')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="570" y="480" className="text-[12px] fill-white font-bold pointer-events-none">
            JH
          </text>

          {/* Odisha (INOR) - Critical Stockout (Deep Red) */}
          <g id="state-odisha-group">
            <path
              id="INOR"
              d="M 540 480 L 565 515 L 615 515 L 635 555 L 615 610 L 565 620 L 530 575 L 535 525 Z"
              className={getPathClasses('INOR')}
              filter="url(#alertGlow)"
              onClick={() => onSelectState('INOR')}
              onMouseEnter={() => onHoverState('INOR')}
              onMouseLeave={() => onHoverState(null)}
            />
            <text
              x="580"
              y="570"
              className="text-[15px] fill-white font-extrabold tracking-wider pointer-events-none"
              textAnchor="middle"
            >
              ODISHA
            </text>
            <circle cx="580" cy="587" r="5" className="fill-white animate-ping" pointerEvents="none" />
            <circle cx="580" cy="587" r="3.5" className="fill-error stroke-white stroke-1" pointerEvents="none" />
          </g>

          {/* Madhya Pradesh (INMP) - Adequate Reserve (Dark Blue) */}
          <path
            id="INMP"
            d="M 340 365 L 375 385 L 415 390 L 435 430 L 480 420 L 530 425 L 535 475 L 485 525 L 425 520 L 360 530 L 330 480 L 310 405 Z"
            className={getPathClasses('INMP')}
            onClick={() => onSelectState('INMP')}
            onMouseEnter={() => onHoverState('INMP')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text
            x="420"
            y="470"
            className="text-[15px] fill-white font-bold pointer-events-none tracking-wide"
            textAnchor="middle"
          >
            MADHYA PRADESH
          </text>

          {/* Chhattisgarh (INCT) */}
          <path
            id="INCT"
            d="M 485 525 L 535 475 L 540 480 L 535 525 L 530 575 L 500 640 L 470 605 L 480 555 Z"
            className={getPathClasses('INCT')}
            onClick={() => onSelectState('INCT')}
            onMouseEnter={() => onHoverState('INCT')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="500" y="575" className="text-[12px] fill-white font-bold pointer-events-none">
            CG
          </text>

          {/* Maharashtra (INMH) - Normal Strategic Donor */}
          <path
            id="INMH"
            d="M 265 465 L 330 480 L 360 530 L 425 520 L 485 525 L 480 555 L 470 605 L 435 645 L 375 655 L 310 650 L 275 595 L 255 525 Z"
            className={getPathClasses('INMH')}
            onClick={() => onSelectState('INMH')}
            onMouseEnter={() => onHoverState('INMH')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text
            x="365"
            y="590"
            className="text-[15px] fill-slate-800 font-bold pointer-events-none"
            textAnchor="middle"
          >
            MAHARASHTRA
          </text>
          <circle cx="300" cy="575" r="5" className="fill-secondary stroke-white stroke-1" pointerEvents="none" />

          {/* Goa (INGA) */}
          <circle
            id="INGA"
            cx="315"
            cy="695"
            r="6"
            className={`cursor-pointer transition-all ${
              isStateSelected('INGA') ? 'fill-primary stroke-white stroke-2' : 'fill-slate-300 stroke-white stroke-1 hover:fill-secondary'
            }`}
            onClick={() => onSelectState('INGA')}
            onMouseEnter={() => onHoverState('INGA')}
            onMouseLeave={() => onHoverState(null)}
          />

          {/* Telangana (INTG) */}
          <path
            id="INTG"
            d="M 435 645 L 470 605 L 500 640 L 505 690 L 465 720 L 425 705 L 415 670 Z"
            className={getPathClasses('INTG')}
            onClick={() => onSelectState('INTG')}
            onMouseEnter={() => onHoverState('INTG')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="460" y="670" className="text-[12px] fill-slate-700 font-bold pointer-events-none">
            TELANGANA
          </text>

          {/* Andhra Pradesh (INAP) */}
          <path
            id="INAP"
            d="M 500 640 L 530 575 L 565 620 L 545 675 L 515 760 L 475 810 L 450 810 L 455 755 L 465 720 L 505 690 Z"
            className={getPathClasses('INAP')}
            onClick={() => onSelectState('INAP')}
            onMouseEnter={() => onHoverState('INAP')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="495" y="735" className="text-[13px] fill-slate-700 font-bold pointer-events-none">
            ANDHRA PRADESH
          </text>

          {/* Puducherry (INPY) */}
          <circle
            id="INPY"
            cx="482"
            cy="860"
            r="4.5"
            className="fill-slate-300 stroke-white cursor-pointer hover:fill-secondary"
            onClick={() => onSelectState('INPY')}
          />

          {/* Karnataka (INKA) */}
          <path
            id="INKA"
            d="M 310 650 L 375 655 L 435 645 L 415 670 L 425 705 L 455 755 L 435 825 L 390 840 L 360 795 L 335 730 L 305 680 Z"
            className={getPathClasses('INKA')}
            onClick={() => onSelectState('INKA')}
            onMouseEnter={() => onHoverState('INKA')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text
            x="380"
            y="745"
            className="text-[15px] fill-slate-700 font-bold pointer-events-none"
            textAnchor="middle"
          >
            KARNATAKA
          </text>

          {/* Kerala (INKL) */}
          <path
            id="INKL"
            d="M 390 840 L 410 850 L 415 905 L 400 960 L 380 940 L 375 885 Z"
            className={getPathClasses('INKL')}
            onClick={() => onSelectState('INKL')}
            onMouseEnter={() => onHoverState('INKL')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="390" y="910" className="text-[11px] fill-slate-700 font-bold pointer-events-none">
            KER
          </text>

          {/* Tamil Nadu (INTN) */}
          <path
            id="INTN"
            d="M 450 810 L 475 810 L 465 865 L 440 930 L 415 970 L 400 960 L 415 905 L 410 850 L 435 825 Z"
            className={getPathClasses('INTN')}
            onClick={() => onSelectState('INTN')}
            onMouseEnter={() => onHoverState('INTN')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text
            x="445"
            y="890"
            className="text-[15px] fill-slate-800 font-bold pointer-events-none"
            textAnchor="middle"
          >
            TAMIL NADU
          </text>
          <circle cx="455" cy="855" r="5" className="fill-secondary stroke-white stroke-1" pointerEvents="none" />

          {/* --- NORTH-EAST STATES (High Geographic Precision) --- */}

          {/* Arunachal Pradesh (INAR) - Critical Stockout */}
          <path
            id="INAR"
            d="M 740 310 L 815 280 L 870 315 L 850 360 L 805 370 L 755 350 L 730 345 Z"
            className={getPathClasses('INAR')}
            onClick={() => onSelectState('INAR')}
            onMouseEnter={() => onHoverState('INAR')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="800" y="330" className="text-[11px] fill-white font-semibold pointer-events-none">
            ARUNACHAL
          </text>

          {/* Assam (INAS) - Critical Stockout (Deep Red) */}
          <g id="state-assam-group">
            <path
              id="INAS"
              d="M 665 380 L 730 345 L 755 350 L 805 370 L 800 410 L 760 405 L 735 435 L 705 440 L 685 410 Z"
              className={getPathClasses('INAS')}
              filter="url(#alertGlow)"
              onClick={() => onSelectState('INAS')}
              onMouseEnter={() => onHoverState('INAS')}
              onMouseLeave={() => onHoverState(null)}
            />
            <text
              x="740"
              y="390"
              className="text-[14px] fill-white font-extrabold pointer-events-none tracking-wider"
              textAnchor="middle"
            >
              ASSAM
            </text>
            <circle cx="750" cy="405" r="4.5" className="fill-white animate-ping" pointerEvents="none" />
            <circle cx="750" cy="405" r="3" className="fill-error stroke-white stroke-1" pointerEvents="none" />
          </g>

          {/* Meghalaya (INML) */}
          <path
            id="INML"
            d="M 685 410 L 735 435 L 730 460 L 680 455 Z"
            className={getPathClasses('INML')}
            onClick={() => onSelectState('INML')}
            onMouseEnter={() => onHoverState('INML')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="705" y="440" className="text-[9px] fill-white font-bold pointer-events-none">
            ML
          </text>

          {/* Nagaland (INNL) */}
          <path
            id="INNL"
            d="M 805 370 L 845 390 L 830 430 L 800 410 Z"
            className={getPathClasses('INNL')}
            onClick={() => onSelectState('INNL')}
            onMouseEnter={() => onHoverState('INNL')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="820" y="410" className="text-[9px] fill-white font-bold pointer-events-none">
            NL
          </text>

          {/* Manipur (INMN) - Critical Stockout */}
          <path
            id="INMN"
            d="M 800 410 L 830 430 L 820 470 L 790 460 Z"
            className={getPathClasses('INMN')}
            onClick={() => onSelectState('INMN')}
            onMouseEnter={() => onHoverState('INMN')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="810" y="445" className="text-[9px] fill-white font-bold pointer-events-none">
            MN
          </text>

          {/* Mizoram (INMZ) */}
          <path
            id="INMZ"
            d="M 765 465 L 795 465 L 785 525 L 760 515 Z"
            className={getPathClasses('INMZ')}
            onClick={() => onSelectState('INMZ')}
            onMouseEnter={() => onHoverState('INMZ')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="778" y="495" className="text-[9px] fill-slate-700 font-bold pointer-events-none">
            MZ
          </text>

          {/* Tripura (INTR) */}
          <path
            id="INTR"
            d="M 735 460 L 765 465 L 755 505 L 730 490 Z"
            className={getPathClasses('INTR')}
            onClick={() => onSelectState('INTR')}
            onMouseEnter={() => onHoverState('INTR')}
            onMouseLeave={() => onHoverState(null)}
          />
          <text x="745" y="485" className="text-[9px] fill-slate-700 font-bold pointer-events-none">
            TR
          </text>

          {/* Andaman & Nicobar Islands (INAN) */}
          <g
            id="INAN"
            className="cursor-pointer"
            onClick={() => onSelectState('INAN')}
            onMouseEnter={() => onHoverState('INAN')}
            onMouseLeave={() => onHoverState(null)}
          >
            <ellipse
              cx="780"
              cy="800"
              rx="6"
              ry="25"
              className={`transition-all ${isStateSelected('INAN') ? 'fill-primary stroke-white stroke-2' : 'fill-slate-300 stroke-white stroke-1 hover:fill-secondary'}`}
            />
            <ellipse
              cx="790"
              cy="870"
              rx="7"
              ry="20"
              className={`transition-all ${isStateSelected('INAN') ? 'fill-primary stroke-white stroke-2' : 'fill-slate-300 stroke-white stroke-1 hover:fill-secondary'}`}
            />
            <text x="810" y="845" className="text-[11px] fill-slate-700 pointer-events-none font-semibold">
              A &amp; N ISLANDS
            </text>
          </g>

          {/* Lakshadweep (INLD) */}
          <g
            id="INLD"
            className="cursor-pointer"
            onClick={() => onSelectState('INLD')}
            onMouseEnter={() => onHoverState('INLD')}
            onMouseLeave={() => onHoverState(null)}
          >
            <circle
              cx="300"
              cy="870"
              r="5"
              className={`transition-all ${isStateSelected('INLD') ? 'fill-primary stroke-white stroke-2' : 'fill-slate-300 stroke-white stroke-1 hover:fill-secondary'}`}
            />
            <circle
              cx="290"
              cy="900"
              r="4"
              className={`transition-all ${isStateSelected('INLD') ? 'fill-primary stroke-white stroke-2' : 'fill-slate-300 stroke-white stroke-1 hover:fill-secondary'}`}
            />
            <circle
              cx="305"
              cy="930"
              r="4"
              className={`transition-all ${isStateSelected('INLD') ? 'fill-primary stroke-white stroke-2' : 'fill-slate-300 stroke-white stroke-1 hover:fill-secondary'}`}
            />
            <text x="220" y="905" className="text-[11px] fill-slate-700 pointer-events-none font-semibold">
              LAKSHADWEEP
            </text>
          </g>
        </g>

        {/* Dynamic National Logistics Corridors (Maharashtra -> Bihar & Tamil Nadu -> Odisha) */}
        <g id="logistics-corridors" pointer-events="none">
          {/* Corridor 1: MH -> BR */}
          <path
            d="M 365 590 Q 460 505 580 405"
            fill="none"
            stroke="#006399"
            strokeWidth="3.5"
            strokeDasharray="7,6"
            className="animate-pulse"
          />
          <circle cx="475" cy="495" r="7" className="fill-secondary animate-ping opacity-75" />
          <circle cx="475" cy="495" r="4.5" className="fill-white stroke-secondary stroke-2" />

          {/* Corridor 2: TN -> OD */}
          <path
            d="M 455 855 Q 535 725 580 575"
            fill="none"
            stroke="#006399"
            strokeWidth="3.5"
            strokeDasharray="7,6"
            className="animate-pulse"
          />
          <circle cx="525" cy="685" r="7" className="fill-secondary animate-ping opacity-75" />
          <circle cx="525" cy="685" r="4.5" className="fill-white stroke-secondary stroke-2" />
        </g>
      </svg>
    </div>
  );
};

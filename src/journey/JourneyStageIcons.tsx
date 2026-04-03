import {
  HiOutlineArrowRightStartOnRectangle,
  HiOutlineCalendarDays,
  HiOutlineCube,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import { LuPlaneLanding, LuPlaneTakeoff } from 'react-icons/lu';
import { MdOutlineMosque } from 'react-icons/md';

/** أيقونات مراحل مسار الرحلة (react-icons) */
export type JourneyStageSideIcon =
  | 'hajj-root'
  | 'package'
  | 'calendar'
  | 'plane-in'
  | 'plane-out'
  | 'stop'
  | 'leave-stop';

const iconClass = 'h-[18px] w-[18px] shrink-0 text-[#03542c]';

export function JourneyStageSideIconSvg({ type }: { type: JourneyStageSideIcon }) {
  switch (type) {
    case 'hajj-root':
      return <MdOutlineMosque className={iconClass} aria-hidden />;
    case 'package':
      return <HiOutlineCube className={iconClass} aria-hidden />;
    case 'calendar':
      return <HiOutlineCalendarDays className={iconClass} aria-hidden />;
    case 'plane-in':
      return <LuPlaneLanding className={iconClass} aria-hidden />;
    case 'plane-out':
      return <LuPlaneTakeoff className={iconClass} aria-hidden />;
    case 'stop':
      return <HiOutlineMapPin className={iconClass} aria-hidden />;
    case 'leave-stop':
      return <HiOutlineArrowRightStartOnRectangle className={iconClass} aria-hidden />;
    default:
      return <span className={iconClass} aria-hidden />;
  }
}

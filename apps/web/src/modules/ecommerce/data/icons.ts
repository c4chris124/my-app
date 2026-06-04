// Maps serializable category icon keys (from the API) to react-icons
// components. Kept on the client so API payloads stay pure JSON.

import type { IconType } from "react-icons";
import {
  MdOutlineLocalFireDepartment,
  MdOutlineKitchen,
  MdOutlineBlender,
  MdOutlineCleaningServices,
  MdOutlineInventory2,
  MdOutlineAir,
} from "react-icons/md";
import type { CategoryIconKey } from "./types";

export const CATEGORY_ICONS: Record<CategoryIconKey, IconType> = {
  cooking: MdOutlineLocalFireDepartment,
  refrigeration: MdOutlineKitchen,
  "food-prep": MdOutlineBlender,
  warewashing: MdOutlineCleaningServices,
  storage: MdOutlineInventory2,
  ventilation: MdOutlineAir,
};

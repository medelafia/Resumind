import { type ClassValue , clsx} from "clsx";
import { twMerge } from "tailwind-merge";

export const generateUUID = () => crypto.randomUUID()
export function cn(...inputs : ClassValue[]) { 
    return twMerge(clsx(inputs)); 
}
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utilitário de concatenação de classes (usando clsx e tailwind-merge)
 * @param inputs Lista de valores de classe a serem concatenados
 * @returns String contendo as classes CSS mescladas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Nota: Você pode precisar instalar as dependências clsx e tailwind-merge no seu projeto:
// npm install clsx tailwind-merge
// ou
// yarn add clsx tailwind-merge
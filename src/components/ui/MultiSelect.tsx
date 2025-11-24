// src/components/ui/MultiSelect.tsx

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = 'Selecione uma ou mais posições...',
  className,
}) => {
  const [open, setOpen] = React.useState(false);

  // Manipulador para selecionar/desselecionar uma opção
  const handleSelect = (value: string) => {
    const isSelected = selected.includes(value);
    if (isSelected) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
    // Não fecha o popover após a seleção para permitir múltiplas seleções
    // setOpen(false); 
  };

  // Manipulador para limpar todas as seleções
  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Evita que o evento de clique feche o popover imediatamente
    onChange([]);
  };

  const selectedOptions = options.filter(option => selected.includes(option.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* PopoverTrigger deve ter um ÚNICO filho com 'asChild' implícito ou explícito */}
      <PopoverTrigger asChild> 
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between items-center h-auto min-h-9 p-1",
            selected.length > 0 && "py-1", // Ajusta o padding quando há badges
            className
          )}
        >
          {selected.length > 0 ? (
            // Garantir que esta seção inteira é o ÚNICO conteúdo do Button
            <div className="flex flex-wrap gap-1 items-center justify-start text-start w-full">
              {selectedOptions.map((option) => (
                <Badge 
                  key={option.value} 
                  variant="secondary"
                  className="py-0.5 px-2 text-xs font-normal"
                >
                  {option.label}
                  <X className="size-3 ml-1 cursor-pointer" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect(option.value);
                  }} />
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground w-full text-start px-2">
              {placeholder}
            </span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-800 border-zinc-700">
        <Command>
          <CommandInput placeholder="Buscar posição..." className="placeholder:text-zinc-500" />
          <CommandList>
            <CommandEmpty>Nenhuma posição encontrada.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer hover:bg-zinc-700/50"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selected.includes(option.value) ? 'opacity-100 text-green-500' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {/* Correção anterior que estava correta: agrupamento em um Fragment */}
            {selected.length > 0 && (
              <React.Fragment> 
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className="justify-center text-center cursor-pointer text-red-400 hover:bg-red-900/50"
                  >
                    Limpar Seleção
                  </CommandItem>
                </CommandGroup>
              </React.Fragment>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};